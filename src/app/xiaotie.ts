import CryptoJs from 'crypto-js'
import fetch from 'node-fetch'
import qs from 'qs'
import dayjs from 'dayjs'
import dotenv from 'dotenv'
import { mergeDetail, recordAppointment } from '../util'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

env.TZ = 'Asia/Shanghai'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')
dayjs.tz()

if (process.env.NODE_ENV === 'dev') {
  dotenv.config({ path: '.env.dev' })
} else {
  dotenv.config()
}

const BASE_URL = 'https://table-api.xironiot.com'

function getSign() {
  const curr = new Date().getTime()
  return {
    timestamp: curr,
    md5: CryptoJs.MD5(curr + '8f8a95b1da1dcf538bc017a47861c9c7').toString()
  }
}

const userToken = process.env.XIAOTIE_TOKEN as string



async function getXiaotieStores() {
  const URL = '/api/client/info/sites/'

  const { md5: sign, timestamp } = getSign()

  const paramJson = {
    city: '广州市',
    latitude: '38.7946',
    longitude: '106.5348',
    refresh: true,
    limit: 10,
    skip: 0
  }

  let records: Store[] = []

  for (; ;) {
    paramJson.limit += 10
    paramJson.skip += 10
    const params = qs.stringify(paramJson)

    const resp = await fetch(`${BASE_URL}${URL}?${params}`, {
      method: 'GET',
      headers: {
        authorization: 'Motern '.concat(userToken),
        sign,
        timestamp: timestamp.toString(),
        'xi-app-id': '0a60f00b28c849d3ac529994f98b825f'
      },
      hostname: 'table-api.xironiot.com'
    })

    const json = await resp.json() as any

    if (json.Results == void 0)
      break

    const results = json.Results as any[]

    const stores = results.map<Store>(it => ({
      address: it.address,
      city: it.city,
      id: it.node_id,
      name: it.name
    })).filter(it => it.id)

    records = [...records, ...stores]
  }

  return records
}

async function getTableById(id: string) {
  const URL = '/api/client/info/site_details/'

  const { md5: sign, timestamp } = getSign()

  const resp = await fetch(`${BASE_URL}${URL}?node_id=${id}`, {
    method: 'GET',
    headers: {
      authorization: 'Motern '.concat(userToken),
      sign,
      timestamp: timestamp.toString(),
      'xi-app-id': '0a60f00b28c849d3ac529994f98b825f'
    },
    hostname: 'table-api.xironiot.com'
  })

  const json = await resp.json() as any
  const tables = json.Results.tables as any[]
  const current = dayjs().format('HH:mm')

  return tables.map<Table>(it => {
    const appointRecords: Record<string, Record<string, boolean>> = {}

    // 在用
    if (it.info) {
      // 预约总时长
      appointRecords[dayjs().format('YYYY-MM-DD')] = { [current]: true }
    }

    return {
      id: it.id,
      address: it.address,
      type: TypeConvertor[it.type],
      appointRecords
    }
  })
}

export function xiaotieConvert(cache: Record<string, StoreDetail> = {}) {
  return mergeDetail(cache, getXiaotieStores, getTableById)
}

const TypeConvertor: Record<number, string> = {
  1: '中式台球',
  2: '斯诺克',
  3: '棋牌',
  4: '包房'
}
