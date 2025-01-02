import { koConvert } from './ko'
import { xiaotieConvert } from './xiaotie'

export const appList = [
  {
    excutor: xiaotieConvert,
    name: 'xiaotie'
  },
  {
    excutor: koConvert,
    name: 'ko'
  }
] as const
