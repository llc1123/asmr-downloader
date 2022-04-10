export const getAuth = () => {
  const token = window.localStorage.getItem('jwt-token')
  return token ? `${token.split('|')?.[1]}` : ''
}

export const debounce = (callback: () => void) => {
  let timer: number | null = null
  return () => {
    if (timer) {
      window.clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      callback()
    }, 100)
  }
}
