import { Action, DownloadData } from '../types'

const dataMap = new Map<number, DownloadData>()

chrome.runtime.onMessage.addListener(
  async ({ action, payload }: Action, sender, sendResponse) => {
    switch (action) {
      case 'newDownload': {
        sendResponse('ok')
        const targetTab = await chrome.tabs.create({
          url: 'download.html',
          active: false,
        })
        if (!targetTab.id) break
        dataMap.set(targetTab.id, payload)
        break
      }
      case 'downloadPrepared': {
        const tabId = sender.tab?.id
        if (!tabId) {
          sendResponse('no tab id')
          break
        }
        const data = dataMap.get(tabId)
        if (!data) {
          sendResponse('no data')
          break
        }
        sendResponse(data)
        dataMap.delete(tabId)
        break
      }
      default: {
        sendResponse('unknown action')
        break
      }
    }
  },
)
