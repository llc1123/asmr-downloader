import { PromisePool } from '@supercharge/promise-pool'
import { AsyncZipDeflate, Zip } from 'fflate'

import { DownloadData, FileProgress, Tracks } from '../types'

const SPEED_WINDOW_SIZE = 3

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
      dataset.map((file) => [
        file.filename,
        { loaded: 0, total: 0, retry: 0, speed: 0 },
      ]),
    ),
  )

  const abortController = new AbortController()
  const signal = abortController.signal

  let hasError: unknown = null

  const downloadFileWithRetry = async (filename: string, url: string) => {
    let retry = 0

    const response = await fetch(`${url}?token=${token}`, { signal })
    const total = parseInt(response.headers.get('content-length') || '0', 10)
    let loaded = 0
    let duplicatedLength = 0
    let speedWindow = 0

    const updateProgress = () => {
      setDownloadProgress((state) => ({
        ...state,
        [filename]: {
          loaded,
          total,
          retry,
          speed: speedWindow / SPEED_WINDOW_SIZE,
        },
      }))
    }

    const countSpeed = (bytes: number) => {
      speedWindow += bytes
      updateProgress()
      setTimeout(() => {
        speedWindow -= bytes
        updateProgress()
      }, SPEED_WINDOW_SIZE * 1000)
    }

    updateProgress()

    let reader = response.body?.getReader()

    const rs = new ReadableStream<Uint8Array>({
      async start(controller) {
        while (true) {
          try {
            if (!reader) throw new Error('no reader')
            const { done, value } = await reader.read()
            if (done) break
            loaded += value.byteLength
            countSpeed(value.byteLength)
            if (duplicatedLength === 0) {
              controller.enqueue(value)
              continue
            } else if (duplicatedLength < value.byteLength) {
              const newValue = value.slice(duplicatedLength)
              controller.enqueue(newValue)
              duplicatedLength = 0
              continue
            } else {
              duplicatedLength -= value.byteLength
              continue
            }
          } catch (e) {
            retry += 1
            const res = await fetch(`${url}?token=${token}`, {
              signal,
              headers: { Range: `bytes=${loaded}-` },
            })
            if (res.status === 200) {
              duplicatedLength = loaded
              loaded = 0
              updateProgress()
            }
            reader = res.body?.getReader()
          }
        }
        controller.close()
      },
    })
    return rs
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
            const response = await downloadFileWithRetry(
              file.filename,
              file.url,
            )
            const rs = response.getReader()
            while (true) {
              const { done, value } = await rs.read()
              if (done) {
                addFile.push(new Uint8Array(), true)
                break
              }
              addFile.push(value, false)
            }
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
