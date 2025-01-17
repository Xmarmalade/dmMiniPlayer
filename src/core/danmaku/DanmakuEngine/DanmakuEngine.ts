import configStore from '@root/store/config'
import { createElement, minmax } from '@root/utils'
import Events2 from '@root/utils/Events2'
import { makeObservable, runInAction } from 'mobx'
import {
  DanmakuBase,
  DanmakuEngineEvents,
  DanmakuInitData,
  TunnelManager,
} from '.'

type DanmakuConfig = {
  speed: number
  fontSize: number
  fontFamily: string
  fontWeight: number
  unmovingDanmakuSaveTime: number
  gap: number
}

export type DanmakuEngineInitProps = {
  /**
   * 传入一个能覆盖media大小的dom，如果是canvas传video dom就行
   *
   * 用来处理动态字体大小的dom，监听dom的大小改变来修改fontSize
   *  */
  container: HTMLElement
  media: HTMLMediaElement
}

export default class DanmakuEngine extends Events2<DanmakuEngineEvents> {
  // implements DanmakuConfig, PlayerComponent
  /**弹幕在实例化时会new这个 */
  Danmaku = DanmakuBase
  container: HTMLElement = createElement('div')
  danmakus: DanmakuBase[] = []

  media?: HTMLMediaElement
  tunnelManager: TunnelManager

  get speed() {
    return configStore.danSpeed
  }
  get fontSize() {
    if (!configStore.adjustFontsizeByPIPWidthResize) {
      return configStore.fontSize
    }

    // 先计算出目标大小
    const tarSize =
      (configStore.fontSize / configStore.adjustFontsizeStartWidth) *
      this.containerWidth *
      configStore.adjustFontsizeScaleRate
    // 再根据最大大小调整
    const clampSize = minmax(
      tarSize,
      configStore.fontSize,
      configStore.adjustFontsizeMaxSize
    )
    return clampSize
  }
  get fontFamily() {
    return configStore.fontFamily
  }
  get fontWeight() {
    return configStore.fontWeight
  }
  get unmovingDanmakuSaveTime() {
    return configStore.danVerticalSafeTime
  }
  get gap() {
    return configStore.gap
  }
  get opacity() {
    return configStore.opacity
  }
  get fontShadow() {
    return configStore.fontShadow
  }

  containerWidth = 0
  containerHeight = 0

  // seek + 第一次进入视频时确定startIndex位置
  hasSeek = true
  offsetStartTime = 10
  initd = false

  get fps() {
    return configStore.renderFPS
  }

  visible = true

  constructor() {
    super()
    makeObservable(this, {
      containerWidth: true,
      containerHeight: true,
      visible: true,
    })
    this.tunnelManager = new TunnelManager(this)
  }

  changeVisible(visible?: boolean) {
    runInAction(() => {
      this.visible = visible ?? !this.visible
    })
  }

  onInit(props: DanmakuEngineInitProps) {}
  onUnload() {}

  unload() {
    this.onUnload()
    this.tunnelManager.unload()
    this.resizeObserver.disconnect()
  }

  // 监听container大小变化
  private resizeObserver = new ResizeObserver(([{ target }]) => {
    runInAction(() => {
      if (!target.clientWidth || !target.clientHeight) return
      this.containerWidth = target.clientWidth
      this.containerHeight = target.clientHeight
      this.initd = true
    })
  })

  init(props: DanmakuEngineInitProps) {
    this.resizeObserver.unobserve(this.container)

    Object.assign(this, props)
    this.onInit(props)

    this.resizeObserver.observe(this.container)
  }

  runningDanmakus = new Set<DanmakuBase>()
  addDanmakus(danmakus: DanmakuInitData[]) {
    this.danmakus.push(
      ...danmakus.map((dan) => {
        return new DanmakuBase({
          ...dan,
          time: dan.time ?? this.media?.currentTime,
          danmakuEngine: this,
        })
      })
    )
  }

  setDanmakus(danmakus: DanmakuInitData[]) {
    this.resetState()
    this.addDanmakus(danmakus)
    this.hasSeek = true
  }

  resetState() {
    this.danmakus.length = 0
    this.tunnelManager.resetTunnelsMap()
  }

  updateVideo(video: HTMLVideoElement) {
    this.media = video
  }
}
