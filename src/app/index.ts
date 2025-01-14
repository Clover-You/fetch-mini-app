import { koConvert } from './ko'
import { noBossConvert } from './no-boss'
import { xiaotieConvert } from './xiaotie'

export const appList = [
  {
    excutor: xiaotieConvert,
    name: 'xiaotie'
  },
  {
    excutor: koConvert,
    name: 'ko'
  },
  {
    excutor: (c: any) => noBossConvert('wx9be62f8bb91b02c7', '3.112.2', c),
    name: 'maliyou'
  },
] as const
