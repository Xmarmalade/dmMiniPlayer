import type {
  SubtitleItem,
  SubtitleRow,
} from '@root/core/SubtitleManager/types'
import { dq } from '@root/utils'

export async function getVideoInfo(url = location.href) {
  const htmlText = await fetch(url).then((res) => res.text())

  return JSON.parse(
    '{' + htmlText.match(/ytInitialPlayerResponse = \{(.*)\};/)[1] + '}'
  )
}

export async function getSubtitles(
  url = location.href
): Promise<SubtitleItem[]> {
  const videoInfo = await getVideoInfo(url)

  const subtitles =
    videoInfo?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

  return subtitles.map((s: any) => ({
    label: s.name.simpleText,
    value: s.baseUrl,
  }))
}

export async function getSubtitle(subtitleUrl: string): Promise<SubtitleRow[]> {
  const xmlText = await fetch(subtitleUrl).then((res) => res.text())
  const parse = new DOMParser()
  const document = parse.parseFromString(xmlText, 'text/xml').documentElement

  const textEls = dq('text', document)

  return textEls.map((el, i) => {
    const startTime = +el.getAttribute('start'),
      duration = +el.getAttribute('dur'),
      text = el.textContent

    return {
      startTime,
      endTime: startTime + duration,
      text,
      htmlText: text,
      id: i + '',
    }
  })
}
