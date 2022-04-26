import { PromisePool } from '@supercharge/promise-pool'
import { Zip, ZipPassThrough } from 'fflate'

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
      if (track.title.endsWith('.wav')) continue
      dataset.push({
        filename: `${root}${track.title}`,
        url: track.mediaDownloadUrl,
      })
    }
  }
}

const downloadFile = async (url: string, auth: string, signal: AbortSignal) => {
  const r = await fetch(`${url}?token=${auth}`, { signal })
  return r.body
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
            const rs = await downloadFile(file.url, token, signal)
            if (!rs) return
            const addFile = new ZipPassThrough(file.filename)
            zip.add(addFile)
            const reader = rs.getReader()
            while (hasError === null) {
              const { done, value } = await reader.read()
              if (done) {
                addFile.push(new Uint8Array(), true)
                break
              }
              addFile.push(value)
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
