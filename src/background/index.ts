import { Action, DownloadQueueItem } from '../types'

import { handleDownload } from './download'

const downloadQueue: DownloadQueueItem[] = []

chrome.runtime.onMessage.addListener(
  ({ action, payload }: Action, _, sendResponse) => {
    switch (action) {
      case 'download': {
        handleDownload(payload, downloadQueue)
        sendResponse('ok')
        break
      }
      case 'getFile': {
        sendResponse(downloadQueue.shift())
        break
      }
      default: {
        sendResponse('unknown action')
        break
      }
    }
  },
)
