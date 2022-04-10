import { sendInfo } from './sendInfo'

const createButtonForID = (id: string) => {
  const button = document.createElement('div')
  button.classList.add('asmr-download-button')
  button.addEventListener('click', async (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (button.classList.contains('loading')) {
      return
    }
    button.classList.remove('done')
    button.classList.remove('error')
    button.classList.add('loading')
    try {
      await sendInfo(id)
      button.classList.remove('loading')
      button.classList.add('done')
    } catch (e) {
      button.classList.remove('loading')
      button.classList.add('error')
    }
  })
  return button
}

export const insertButtons = () => {
  if (window.location.href.includes('/work/')) {
    const menu = document.getElementsByClassName('q-pa-sm')?.[0]
    if (!menu) return
    if (menu.getElementsByClassName('asmr-download-button').length) return
    const id = window.location.href.split('/')?.[4].slice(2)
    if (!id) return
    const button = createButtonForID(id)
    button.classList.add('shadow-4', 'q-btn__wrapper')
    menu.insertBefore(button, menu.lastChild)
  } else {
    const container = document.getElementsByTagName('main')?.[0]
    if (!container) return
    const cards = container.getElementsByClassName(
      'q-card',
    ) as HTMLCollectionOf<HTMLElement>
    const items = container.getElementsByClassName(
      'q-item',
    ) as HTMLCollectionOf<HTMLElement>
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      if (card.getElementsByClassName('asmr-download-button').length) continue
      const id = card.firstElementChild
        ?.getAttribute('href')
        ?.split('/')?.[2]
        ?.slice(2)
      if (!id) continue
      const button = createButtonForID(id)
      card.appendChild(button)
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.getElementsByClassName('asmr-download-button').length) continue
      const id = item
        .getElementsByTagName('a')?.[0]
        ?.getAttribute('href')
        ?.split('/')?.[2]
        ?.slice(2)
      if (!id) continue
      const button = createButtonForID(id)
      item.appendChild(button)
    }
  }
}
