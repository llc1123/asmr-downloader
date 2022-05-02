export type Work = {
  id: number
  title: string
  circle_id: number
  name: string
  nsfw: boolean
  release: string
  dl_count: number
  price: number
  review_count: number
  rate_count: number
  rate_average_2dp: number
  rate_count_detail: {
    review_point: number
    count: number
    ratio: number
  }[]
  rank: {
    term: string
    category: string
    rank: number
    rank_date: string
  }[]
  has_subtitle: boolean
  create_date: string
  circle: {
    id: number
    name: string
  }
  vas: {
    id: number
    name: string
  }[]
  tags: {
    id: number
    name: string
  }[]
  samCoverUrl: string
  thumbnailCoverUrl: string
  mainCoverUrl: string
}

export type Tracks = Track[]

export type Track = FileItem | FolderItem

export type FileItem = {
  type: 'image' | 'audio' | 'text'
  title: string
  hash: string
  mediaDownloadUrl: string
  mediaStreamUrl: string
  workTitle: string
}

export type FolderItem = {
  type: 'folder'
  title: string
  children: Track[]
}

export type DownloadData = {
  info: Work
  tracks: Tracks
  token: string
}

export type Action = DownloadAction | DownloadPrepared
export type DownloadAction = {
  action: 'newDownload'
  payload: DownloadData
}
export type DownloadPrepared = {
  action: 'downloadPrepared'
  payload: null
}

export type FileProgress = {
  loaded: number
  total: number
  retry: number
}
