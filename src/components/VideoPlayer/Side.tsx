import VideoChanger from '@root/core/VideoChanger'
import { useOnce } from '@root/hook'
import { formatTime, formatView } from '@root/utils'
import type { Rec } from '@root/utils/typeUtils'
import type WebProvider from '@root/web-provider/webProvider'
import classNames from 'classnames'
import { useRef, type FC, useState, useEffect } from 'react'

export type VideoItem = {
  /**spa点击切换路由的link元素 */
  linkEl: HTMLElement
  title: string
  link: string
  /**item的容器 */
  el: HTMLElement

  isActive?: boolean
  cover?: string
  played?: number
  user?: string
  duration?: number
  id?: string
}
export type VideoList = {
  category: string
  /**默认为true */
  isSpa?: boolean
  items: VideoItem[]
}
export type Props = {
  videoList: VideoList[]
  webProvider: WebProvider
  onClick?: (videoItem: VideoItem) => void
  onChange?: (videoItem: VideoItem) => void
}

const VideoPlayerSide: FC<Props> = (props) => {
  const videoChanger = useRef<VideoChanger>(null)
  const [activeMap, setActiveMap] = useState<Rec<number>>({})

  useOnce(() => {
    videoChanger.current = new VideoChanger(props.webProvider)
    props.webProvider.videoChanger = videoChanger.current
  })

  // 更新active数据
  useEffect(() => {
    const activeMap: Rec<number> = {}

    props.videoList.forEach((list, i) => {
      const activeIndex = list.items.findIndex((v) => v.isActive)
      if (activeIndex == -1) return
      activeMap[i] = activeIndex
    })

    console.log('side activeMap', activeMap, props.videoList)

    setActiveMap(activeMap)
  }, [props.videoList])

  return (
    <div className="side-outer-container">
      {/* TODO 侧边栏提示 */}
      <div className="side-inner-container">
        {props.videoList.map((list, vi) => {
          const isCoverTitle = !!list.items?.[0]?.cover
          return (
            <div key={vi}>
              <h3>{list.category}</h3>
              <ul className="select-list">
                {list.items.map((item, ii) => {
                  return (
                    <li
                      key={item.id ?? ii}
                      className={classNames(
                        'select',
                        activeMap[vi] == ii && 'active'
                      )}
                      onClick={() => {
                        props.onClick?.(item)
                        if (list.isSpa === false) {
                          videoChanger.current
                            .changeVideo(item.link)
                            .then(() => {
                              props.onChange?.(item)
                            })
                        } else {
                          item.linkEl.click()
                          props.onChange?.(item)
                        }
                        setActiveMap((map) => ({ ...map, [vi]: ii }))
                      }}
                    >
                      {isCoverTitle ? <CoverTitleItem {...item} /> : item.title}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CoverTitleItem: FC<VideoItem> = (data) => {
  return (
    <>
      <div className="img-container">
        <img src={data.cover} loading="lazy" />
        {data.played && <div className="info">{formatView(+data.played)}</div>}
        {data.duration && (
          <div className="duration">{formatTime(+data.duration)}</div>
        )}
      </div>
      <div className="right">
        <div className="title" title={data.title}>
          {data.title}
        </div>
        <div className="name">{data.user}</div>
      </div>
    </>
  )
}

export default VideoPlayerSide