import { PromisePool } from '@supercharge/promise-pool'
import { AsyncZipDeflate, Zip } from 'fflate'

import { DownloadData, Tracks } from '../types'

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

const downloadFileWithRetry = async (
  url: string,
  auth: string,
  signal: AbortSignal,
) => {
  for (let i = 1; i <= 10; i++) {
    try {
      return await fetch(`${url}?token=${auth}`, { signal }).then((r) =>
        r.arrayBuffer(),
      )
    } catch (e) {
      console.warn(`download error (${i}): `, e, url)
    }
  }
  throw new Error(`download failed: ${url}`)
}

export const handleDownload = (data: DownloadData) => {
  const { tracks, token } = data

  const dataset: DownloadFile[] = []
  parseTracks(tracks, '/', dataset)

  const abortController = new AbortController()
  const signal = abortController.signal

  let hasError: unknown = null

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
            const buffer = await downloadFileWithRetry(file.url, token, signal)
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
