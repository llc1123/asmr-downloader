import { DownloadData, DownloadPrepared } from '../types'

import { handleDownload } from './download'

const stripFilename = (s: string) => s.replaceAll(/[\\/|*?<>:"]/g, '_')

let filename = ''

const onload = async () => {
  const currentTab = await chrome.tabs.getCurrent()
  if (!currentTab.id) return
  chrome.runtime.sendMessage<DownloadPrepared, DownloadData | string>(
    {
      action: 'downloadPrepared',
      payload: null,
    },
    async (data) => {
      if (typeof data === 'string') {
        window.alert(data)
        window.close()
        return
      }
      filename = `[${data.info.circle.name}] ${data.info.title}.zip`
      document.title = filename

      const blob = await new Response(handleDownload(data), {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }).blob()

      const url = URL.createObjectURL(blob)
      chrome.downloads.download({
        url,
        filename: stripFilename(filename),
        conflictAction: 'uniquify',
      })
      window.close()
    },
  )
}

window.addEventListener('load', onload)
