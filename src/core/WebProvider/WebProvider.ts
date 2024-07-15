import configStore from '@root/store/config'
import { createElement, dq } from '@root/utils'
import { CanvasPIPWebProvider, DocPIPWebProvider } from '.'
import {
  CanvasDanmakuEngine,
  DanmakuEngine,
  HtmlDanmakuEngine,
} from '../danmaku/DanmakuEngine'
import SubtitleManager from '../SubtitleManager'
import VideoPlayerBase, {
  ExtendComponent,
} from '../VideoPlayer/VideoPlayerBase'
import DanmakuSender from '../danmaku/DanmakuSender'
import { PlayerEvent } from '../event'
import { SideSwitcher } from '../SideSwitcher'

export default abstract class WebProvider implements ExtendComponent {
  // videoChanger: VideoChanger
  subtitleManager!: SubtitleManager
  danmakuEngine?: DanmakuEngine
  danmakuSender?: DanmakuSender
  sideSwitcher?: SideSwitcher

  private _webVideo?: HTMLVideoElement
  get webVideo() {
    if (!this._webVideo)
      throw new Error('webVideo还没初始化，请用openPlayer()后再调用')
    return this._webVideo
  }
  set webVideo(v: HTMLVideoElement) {
    this._webVideo = v
  }

  miniPlayer!: VideoPlayerBase

  constructor() {
    if (
      [DocPIPWebProvider, CanvasPIPWebProvider].find((v) => this instanceof v)
    )
      return this

    const provider = (() => {
      if (configStore.useDocPIP) {
        return new DocPIPWebProvider()
      } else {
        return new CanvasPIPWebProvider()
      }
    })()

    Object.setPrototypeOf(Object.getPrototypeOf(this), provider)
    return this
  }

  init() {
    this.danmakuEngine = configStore.useHtmlDanmaku
      ? new HtmlDanmakuEngine()
      : new CanvasDanmakuEngine()

    this.subtitleManager = new SubtitleManager()

    this.onInit()
  }
  onInit(): void {}

  /**播放器初始化完毕后触发 */
  onPlayerInitd(): void {}

  protected onUnloadFn: (() => void)[] = []
  protected addOnUnloadFn(fn: () => void) {
    this.onUnloadFn.push(fn)
  }
  unload() {
    this.onUnloadFn.forEach((fn) => fn())
  }

  /**打开播放器 */
  async openPlayer(props?: { videoEl?: HTMLVideoElement }) {
    this.init()
    this.webVideo = props?.videoEl ?? this.getVideoEl()

    await this.onOpenPlayer()
    await this.onPlayerInitd()

    const unListenOnClose = this.miniPlayer.on2(PlayerEvent.close, () => {
      this.unload()
      unListenOnClose()
    })
  }

  /**获取视频 */
  getVideoEl(document = window.document): HTMLVideoElement {
    const videos = [
      ...dq('video', document),
      ...dq('iframe', document)
        .map((iframe) => {
          try {
            return Array.from(
              iframe.contentWindow?.document.querySelectorAll('video') ?? []
            )
          } catch (error) {
            return null
          }
        })
        .filter((v) => !!v)
        .flat(),
    ]

    if (!videos.length)
      throw Error('页面中不存在video，或者video在不支持的非同源iframe中')
    const targetVideo = videos.reduce((tar, now) => {
      if (tar.clientHeight < now.clientHeight) return now
      return tar
    }, videos[0])

    return targetVideo
  }

  onOpenPlayer(): Promise<void> | void {}
}
