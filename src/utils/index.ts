import { isNumber, isNull } from 'lodash'
import { CSSProperties } from 'react'

let el: HTMLSpanElement = null
export function getTextWidth(text: string, style: CSSProperties): number {
  if (!el) {
    el = document.createElement('span')
    document.body.appendChild(el)
    el.style.visibility = 'hidden'
    el.style.position = 'fixed'
    el.setAttribute('desc', 'calc text overflow node')
  }

  for (let k in style) {
    el.style[k as any] = (style as any)[k]
  }
  el.innerText = text

  // console.log('el.clientWidth', el.offsetWidth, el)

  return el.clientWidth
}

type WaitLoop = {
  (cb: () => boolean /* | Promise<boolean> */, limitTime?: number): Promise<
    boolean
  >
  // TODO
  (
    cb: () => boolean /* | Promise<boolean> */,
    option?: Partial<{
      intervalTime: number
      intervalCount: number
      limitTime: number
    }>
  ): Promise<boolean>
}
export let waitLoopCallback: WaitLoop = (cb, option = 5000) => {
  return new Promise(async (res, rej) => {
    if (isNumber(option)) {
      let timer: NodeJS.Timeout
      let initTime = new Date().getTime()
      let loop = () => {
        let rs = cb()
        if (!rs) {
          if (!isNull(option) && new Date().getTime() - initTime > option)
            return res(false)
          return (timer = setTimeout(() => {
            loop()
          }, 500))
        } else return res(true)
      }
      loop()
    }
  })
}