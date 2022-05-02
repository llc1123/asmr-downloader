import { PromisePool } from '@supercharge/promise-pool'
import { AsyncZipDeflate, Zip } from 'fflate'

import { DownloadData, FileProgress, Tracks } from '../types'

type DownloadFile = {
  filename: string
  url: string
}

const parseTracks = (tracks: Tracks, root: string, dataset: DownloadFile[]) => {
  for (const track of tracks) {
    if (track.type === 'folder') {
      parseTracks(track.children, `${root}${track.title}/`, dataset)
    } else {
      dataset.push({
        filename: `${root}${track.title}`,
        url: track.mediaDownloadUrl,
      })
    }
  }
}

export const handleDownload = (
  data: DownloadData,
  setDownloadProgress: (
    progress:
      | Record<string, FileProgress>
      | ((state: Record<string, FileProgress>) => Record<string, FileProgress>),
  ) => void,
) => {
  const { tracks, token } = data

  const dataset: DownloadFile[] = []
  parseTracks(tracks, '/', dataset)

  setDownloadProgress(
    Object.fromEntries(
      dataset.map((file) => [file.filename, { loaded: 0, total: 0, retry: 0 }]),
    ),
  )

  const abortController = new AbortController()
  const signal = abortController.signal

  let hasError: unknown = null

  const downloadFileWithRetry = async (filename: string, url: string) => {
    let retry = 0

    const updateProgress = (loaded: number, total: number) => {
      setDownloadProgress((state) => ({
        ...state,
        [filename]: {
          loaded,
          total,
          retry,
        },
      }))
    }

    for (let i = 1; i <= 10; i++) {
      try {
        const response = await fetch(`${url}?token=${token}`, { signal })
        const total = parseInt(
          response.headers.get('content-length') || '0',
          10,
        )
        let loaded = 0
        updateProgress(loaded, total)
        const reader = response.body?.getReader()
        if (!reader) throw new Error('no reader')
        const res = new Response(
          new ReadableStream<Uint8Array>({
            async start(controller) {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                loaded += value.byteLength
                updateProgress(loaded, total)
                controller.enqueue(value)
              }
              controller.close()
            },
          }),
        )
        return await res.arrayBuffer()
      } catch (e) {
        retry += 1
      }
    }
    throw new Error(`download failed: ${url}`)
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const zip = new Zip((err, data, final) => {
        if (err) {
          controller.error(err)
          hasError = err
          abortController.abort()
          return
        }
        controller.enqueue(data)
        if (final) {
          controller.close()
        }
      })

      await PromisePool.withConcurrency(3)
        .for(dataset)
        .process(async (file, _, pool) => {
          if (hasError !== null) {
            pool.stop()
          }
          try {
            const addFile = new AsyncZipDeflate(file.filename)
            zip.add(addFile)
            const buffer = await downloadFileWithRetry(file.filename, file.url)
            addFile.push(new Uint8Array(buffer), true)
          } catch (e) {
            hasError = e
            abortController.abort()
            return
          }
        })

      zip.end()
    },
    cancel() {
      hasError = 'cancelled'
      abortController.abort()
    },
  })
}
