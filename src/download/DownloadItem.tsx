import filesize from 'filesize'
import { FC } from 'react'

import { FileProgress } from '../types'

import styles from './DownloadItem.module.sass'

const DownloadItem: FC<{ name: string; data: FileProgress }> = ({
  name,
  data,
}) => {
  const loaded = filesize(data.loaded, { base: 2 })
  const total = filesize(data.total, { base: 2 })

  const percent = data.total ? data.loaded / data.total : 0

  return (
    <div className={styles.card}>
      <div className={styles.title}>
        <div className={styles.filename}>{name}</div>
        <div className={styles.percentage}>{(percent * 100).toFixed(2)}%</div>
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.inner}
          style={{
            width: `${percent * 100}%`,
            ...(percent === 1 && {
              backgroundColor: '#238551',
              backgroundImage: 'none',
            }),
          }}
        ></div>
      </div>
      <div className={styles.info}>
        <div className={styles.size}>
          {loaded} / {total}
        </div>
        {data.retry !== 0 && (
          <>
            <div className={styles.icon}>
              <svg
                data-icon="refresh"
                width="14"
                height="14"
                viewBox="0 0 16 16"
              >
                <path
                  d="M14.99 6.99c-.55 0-1 .45-1 1 0 3.31-2.69 6-6 6-1.77 0-3.36-.78-4.46-2h1.46c.55 0 1-.45 1-1s-.45-1-1-1h-4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1s1-.45 1-1v-1.74a7.95 7.95 0 006 2.74c4.42 0 8-3.58 8-8 0-.55-.45-1-1-1zm0-7c-.55 0-1 .45-1 1v1.74a7.95 7.95 0 00-6-2.74c-4.42 0-8 3.58-8 8 0 .55.45 1 1 1s1-.45 1-1c0-3.31 2.69-6 6-6 1.77 0 3.36.78 4.46 2h-1.46c-.55 0-1 .45-1 1s.45 1 1 1h4c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1z"
                  fill-rule="evenodd"
                ></path>
              </svg>
            </div>
            <div>{data.retry}</div>
          </>
        )}
      </div>
    </div>
  )
}

export default DownloadItem
