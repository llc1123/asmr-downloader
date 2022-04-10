import { PromisePool } from '@supercharge/promise-pool'
import { Zip, ZipPassThrough } from 'fflate'

import { DownloadData, DownloadQueueItem, Tracks } from '../types'

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

const downloadFile = async (url: string, auth: string) => {
  return await fetch(`${url}?token=${auth}`).then((r) => r.arrayBuffer())
}

export const handleDownload = async (
  data: DownloadData,
  downloadQueue: DownloadQueueItem[],
) => {
  const { info, tracks, token } = data
  const zipFilename = `[${info.circle.name}] ${info.title}.zip`

  const dataset: DownloadFile[] = []
  parseTracks(tracks, '/', dataset)

  let result: number[] = []

  const zip = new Zip((err, data, final) => {
    if (err) {
      console.error(err)
      return
    }
    result = result.concat(Array.from(data))
    if (!final) return
    downloadQueue.push({ filename: zipFilename, data: result })
    chrome.tabs.create({ url: '/download.html', active: false })
  })

  await PromisePool.withConcurrency(5)
    .for(dataset)
    .process(async (file) => {
      const buffer = await downloadFile(file.url, token)
      const addFile = new ZipPassThrough(file.filename)
      zip.add(addFile)
      addFile.push(new Uint8Array(buffer), true)
    })

  zip.end()
}
