import { DownloadQueueItem, GetFileAction } from '../types'

const onload = () => {
  chrome.runtime.sendMessage<GetFileAction, DownloadQueueItem>(
    {
      action: 'getFile',
      payload: null,
    },
    (fileData) => {
      if (fileData) {
        const { filename, data } = fileData
        chrome.downloads.download(
          {
            url: URL.createObjectURL(
              new Blob([Uint8Array.from(data)], { type: 'application/zip' }),
            ),
            filename,
          },
          () => window.close(),
        )
      } else {
        window.close()
      }
    },
  )
}

window.addEventListener('load', onload)
