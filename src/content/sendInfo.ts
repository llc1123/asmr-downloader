import { DownloadData, Tracks, Work } from '../types'

import { getAuth } from './utils'

export const sendInfo = async (id: string) => {
  const option = {
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${getAuth()}`,
    },
  }
  const work: Promise<Work> = fetch(
    `//api.asmr.one/api/work/${id}`,
    option,
  ).then((r) => r.json())
  const tracks: Promise<Tracks> = fetch(
    `//api.asmr.one/api/tracks/${id}`,
    option,
  ).then((r) => r.json())
  const [workRes, tracksRes] = await Promise.all([work, tracks])
  const data: DownloadData = {
    info: workRes,
    tracks: tracksRes,
    token: getAuth(),
  }
  await new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'download', payload: data },
      (response) => {
        if (response === 'ok') {
          resolve()
        } else {
          reject(response)
        }
      },
    )
  })
}
