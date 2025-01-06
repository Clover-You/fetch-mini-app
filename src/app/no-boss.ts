import CryptoJS from 'crypto-js'
import { isEmptyArr, mergeDetail } from '../util'
import dayjs from 'dayjs'
import { env } from 'node:process'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

env.TZ = 'Asia/Shanghai'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')
dayjs.tz()

const baseURL = 'https://www.5laoban.com/'

export function noBossConvert(appId: string, appVersion: string, cache: Record<string, StoreDetail> = {}) {
  type Params = { path: string, timestamp: number }

  function genAppletToken({ path, timestamp }: Params) {
    // 拼接必要信息
    const tokenString = `${baseURL}${appId}${appVersion}${path}${timestamp}${baseURL}`;

    // 使用 MD5 加密生成 token
    return CryptoJS.MD5(tokenString).toString();
  }

  const BASE_URL = 'https://api.5laoban.com'

  async function getStoreList() {
    const URI = '/store/list'
    const timestamp = new Date().getTime()

    const appletToken = genAppletToken({ path: URI, timestamp })


    let pageNum = 1

    const records: Store[] = []

    for (; ;) {

      const formData = new FormData()

      formData.set('timestamp_private', timestamp)
      formData.set('store', 12393)
      formData.set('mid', 8674)
      formData.set('citycode', 20)
      formData.set('page', pageNum)
      formData.set('limit', 100)

      const resp = await fetch(BASE_URL + URI, {
        method: 'POST',
        headers: {
          'applet-token': appletToken,
          'wxappid': appId,
          'version': appVersion
        },
        body: formData
      })

      const json: any = await resp.json()
      const list = json.result.list ?? []

      if (isEmptyArr(list))
        break

      list.forEach((it: any) => {
        if (it.name.indexOf('筹备中') === -1)
          records.push({
            id: it.sid + '',
            name: it.name,
            address: it.address,
            city: '广州市'
          })
      })

      pageNum++
    }

    return records
  }

  async function getAreaList(sid: string) {
    const URI = '/area/getplace4scene'
    const timestamp = new Date().getTime()

    const appletToken = genAppletToken({ path: URI, timestamp })

    const formData = new FormData()

    formData.set('timestamp_private', timestamp)
    formData.set('store', sid)

    const records: Table[] = []

    const resp = await fetch(BASE_URL + URI, {
      method: 'POST',
      headers: {
        'applet-token': appletToken,
        'wxappid': appId,
        'version': appVersion
      },
      body: formData
    })

    const json: any = await resp.json()
    const list = json.result.area ?? []

    list.forEach((it: any) => {
      const p = it.place ?? []
      const appointRecords: Record<string, Record<string, boolean>> = {}
      let today = dayjs().format('YYYY-MM-DD')


      p.forEach((it: any) => {

        it.timeline.forEach((it: any) => {
          if (it.key === '次') {
            today = dayjs().add(1, 'days').format('YYYY-MM-DD')
            return
          }

          if (!it.val) return

          appointRecords[today] ??= {}
          appointRecords[today][it.key] = it.val
        })

        records.push({
          id: it.aid + '',
          address: it.title,
          type: '棋牌',
          appointRecords
        })
      })
    })

    return records
  }

  return mergeDetail(cache, getStoreList, getAreaList)
}
