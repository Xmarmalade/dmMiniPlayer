import { DanMoveType, DanType } from '@root/danmaku'
import assParser from 'ass-parser'

type Dialogue = {
  start: number
  end: number
  text: string
  color: string
  type: DanMoveType
  y?: number
  [key: string]: string | number
}
export default class AssParser {
  assContent: string

  formats: string[]

  parsers: any[] = []

  private _dans: DanType[] = []
  get dans(): DanType[] {
    if (this.dialogues.length && !this._dans.length) {
      this.dialogues.forEach(({ color = 'white', start, text, type }) => {
        this._dans.push({ color, text, time: start, type })
      })
    }
    return this._dans
  }

  dialogues: Dialogue[] = []
  constructor(assContent: string) {
    this.assContent = assContent

    // this.resolveFormats()
    this.resolveParser()
  }

  resolveDialogueTime(dialogueTime: string): number {
    let [hours, min, sec] = dialogueTime.split(':')

    return +hours * 60 * 60 + +min * 60 + +sec
  }

  resolveParser() {
    this.parsers = assParser(this.assContent)

    let eventsBody = this.parsers.find((p) => p.section == 'Events').body

    // let dialogues: Dialogue[] = []
    for (let _dialogue of eventsBody) {
      if (_dialogue.key != 'Dialogue') continue

      let dialogueEntries = Object.entries(_dialogue.value)
      for (let index in dialogueEntries) {
        let [key, value] = dialogueEntries[index]

        key = key.toLowerCase()
        if (key == 'start' || key == 'end') {
          value = this.resolveDialogueTime(value as string)
        } else if (key == 'text') {
          let { color, danMoveType, text } = this.resolveText(value as string)
          value = text

          dialogueEntries.push(['type', danMoveType])
          dialogueEntries.push(['color', color])
        }
        dialogueEntries[index] = [key, value]
      }

      this.dialogues.push(Object.fromEntries(dialogueEntries) as Dialogue)
    }
  }

  resolveText(
    inputText: string
  ): { color: string; text: string; danMoveType: DanMoveType } {
    let danMoveType: DanMoveType = 'right',
      color = '',
      text = ''

    let configBlock = inputText.slice(
      inputText.indexOf('{') + 1,
      inputText.indexOf('}')
    )

    let configBlocks = configBlock.split('\\')
    configBlocks.shift()

    configBlocks.forEach((config) => {
      if (config.includes('pos')) {
        danMoveType = 'top'
      } else if (config.includes('c&H')) {
        color = config.replace('c&H', '#')
      } else if (config.includes('move')) {
        danMoveType = 'right'
      }
    })

    return {
      danMoveType,
      color,
      text: inputText.replace(`{${configBlock}}`, ''),
    }
    // let i = 0,
    //   str = '',
    //   isEnterBlock = false,
    //   isColorMode = false
    // while (i < inputText.length) {
    //   let t = inputText[i]
    //   if (t == '{') {
    //     isEnterBlock = true
    //   }
    //   if (t == '}') {
    //     isEnterBlock = false
    //     if()
    //   }
    //   if (str == '\\move') {
    //     danMoveType = 'right'
    //     continue
    //   }
    //   if (str == '\\pos') {
    //     danMoveType = 'top'
    //     continue
    //   }
    //   if (str == '\\c') {
    //     str = ''
    //     isColorMode = true
    //     continue
    //   }
    //   str += t
    //   i++
    // }
  }
}