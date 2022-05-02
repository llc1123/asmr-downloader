import { FC, useCallback, useEffect, useState } from 'react'

import { DownloadData, DownloadPrepared, FileProgress } from '../types'

import styles from './App.module.sass'
import { handleDownload } from './download'
import DownloadItem from './DownloadItem'

const stripFilename = (s: string) => s.replaceAll(/[\\/|*?<>:"]/g, '_')

const App: FC = () => {
  const getDownloadData = useCallback(async () => {
    const currentTab = await chrome.tabs.getCurrent()
    if (!currentTab.id) Promise.reject('Current tab not found')
    return new Promise<DownloadData>((resolve, reject) =>
      chrome.runtime.sendMessage<DownloadPrepared, DownloadData | string>(
        {
          action: 'downloadPrepared',
          payload: null,
        },
        async (data) => {
          if (typeof data === 'string') {
            reject(data)
            return
          }
          resolve(data)
        },
      ),
    )
  }, [])

  const handleDownloadData = useCallback(async (data: DownloadData) => {
    const blob = await new Response(handleDownload(data, setDownloadProgress), {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    }).blob()

    const url = URL.createObjectURL(blob)
    return url
  }, [])

  const handleDownloadFinish = useCallback((url: string, filename: string) => {
    chrome.downloads.download({
      url,
      filename,
      conflictAction: 'uniquify',
    })
    window.close()
  }, [])

  const handleError = useCallback((error: string) => {
    alert(error)
    window.close()
  }, [])

  const [downloadData, setDownloadData] = useState<DownloadData | null>(null)

  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, FileProgress>
  >({})

  useEffect(() => {
    getDownloadData()
      .then((data) => setDownloadData(data))
      .catch(handleError)
  }, [])

  useEffect(() => {
    if (!downloadData) return

    document.title = `[${downloadData.info.circle.name}] ${downloadData.info.title}`
    const filename = stripFilename(
      `[${downloadData.info.circle.name}] ${downloadData.info.title}.zip`,
    )

    handleDownloadData(downloadData)
      .then((url) => handleDownloadFinish(url, filename))
      .catch(handleError)
  }, [downloadData])

  return (
    <div className={styles.app}>
      <img className={styles.cover} src={downloadData?.info.mainCoverUrl} />
      <div className={styles.title}>{downloadData?.info.title}</div>
      <div className={styles.circle}>{downloadData?.info.circle.name}</div>
      {Object.entries(downloadProgress).map(([key, value], idx) => (
        <DownloadItem name={key} data={value} key={idx} />
      ))}
    </div>
  )
}

export default App
