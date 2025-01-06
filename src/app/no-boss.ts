import CryptoJS from 'crypto-js'
import { isEmptyArr, mergeDetail } from '../util'
import dayjs from 'dayjs'
import { env } from 'node:process'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import ora from 'ora'

env.TZ = 'Asia/Shanghai'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')
dayjs.tz()

const baseURL = 'https://www.5laoban.com/'

export async function noBossConvert(appId: string, appVersion: string, cache: Record<string, StoreDetail> = {}) {
  const spinner = ora('Begin handle API of No BOSS').start()
  type Params = { path: string, timestamp: number }

  function genAppletToken({ path, timestamp }: Params) {
    // 拼接必要信息
    const tokenString = `${baseURL}${appId}${appVersion}${path}${timestamp}${baseURL}`;

    // 使用 MD5 加密生成 token
    return CryptoJS.MD5(tokenString).toString();
  }

  const BASE_URL = 'https://api.5laoban.com'

  async function getStoreList() {
    spinner.start('Fetch: No BOSS store list API')

    const URI = '/store/list'
    const timestamp = new Date().getTime()

    const appletToken = genAppletToken({ path: URI, timestamp })

    let pageNum = 1

    const records: Store[] = []

    for (; ;) {
      spinner.info(`Fetch: Page ${pageNum}`)

      const formData = new FormData()

      formData.set('timestamp_private', timestamp)
      formData.set('store', 12393)
      formData.set('mid', 8674)
      formData.set('citycode', 20)
      formData.set('page', pageNum)
      formData.set('limit', 20)

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

    spinner.info(`Fetch: Store data retrieval completed, a total of ${records.length} piece of data`)
    spinner.succeed('Sotre fetch successful...')

    return records
  }

  async function getAreaList(sid: string) {
    spinner.start(`Fetch: Get store table by ${sid}}`)

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

    spinner.succeed(`Fetch: Successfully obtained Table by ${sid}`)
    spinner.start(`Sotre fetch successful...`)

    const json: any = await resp.json()
    const list = json.result.area ?? []

    list.forEach((it: any) => {
      const p = it.place ?? []

      p.forEach((place: any) => {
        spinner.start(`Process: ${place.title}`)
        
        const appointRecords: Record<string, Record<string, boolean>> = {}
        let today = dayjs().format('YYYY-MM-DD')


        place.timeline.forEach((timeline: any) => {
          if (timeline.key === '次') {
            today = dayjs().add(1, 'days').format('YYYY-MM-DD')
            return
          }

          if (!timeline.val) return

          appointRecords[today] ??= {}
          appointRecords[today][timeline.key] = timeline.val
        })

        records.push({
          id: place.aid + '',
          address: place.title,
          type: '棋牌',
          appointRecords
        })
      })
    })

    return records
  }

  const result = await mergeDetail(cache, getStoreList, getAreaList)

  spinner.info('No BOSS Processing completed')
  spinner.stop()

  return result
}
