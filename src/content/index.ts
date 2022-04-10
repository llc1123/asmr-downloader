import { insertButtons } from './button'
import { debounce } from './utils'
import './index.sass'

const observer = new MutationObserver(debounce(insertButtons))

const target = document.getElementById('q-app')
target &&
  observer.observe(target, { attributes: true, childList: true, subtree: true })
