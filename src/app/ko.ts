import CryptoJs from 'crypto-js'
import { isEmptyArr, mergeDetail, recordAppointment } from '../util'
import dayjs from 'dayjs'

const SIGN_KEY = 'rb8emaZfsWNuoUSo'

const STORE_LIST_METHOD = 'com.yuyuka.billiards.api.new.billiards.rcmd.list'
const STORE_METHOD = 'com.yuyuka.billiards.api.user.table.list.query'


const param = {
  channelCode: 'h5_api_get',
  timestamp: '123123',
  sign: SIGN_KEY,
  channelType: 'KO',
  platformType: 'MINIAPP',
  appType: 'WEIXIN',
  deviceType: 'IOS'
}

function getContetn(bizContent: object, method: string) {
  const bizContentStr = JSON.stringify(bizContent)

  const SIGN = CryptoJs.MD5(param.channelCode + bizContentStr + param.sign).toString()

  return {
    method: method,
    channelCode: 'h5_api_get',
    channelType: 'KO',
    platformType: 'MINIAPP',
    appType: 'WEIXIN',
    deviceType: 'MAC',
    timestamp: '123123',
    bizContent: bizContentStr,
    sign: SIGN,
    token: null
  }

}

function request(bizContent: object, method: string) {
  return fetch('https://gatewayapi.kotaiqiu.com/api/gateway', {
    method: 'POST',
    body: JSON.stringify(getContetn(bizContent, method)),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

async function getKoStore() {
  let records: Store[] = []

  let pageNum = 1

  for (; ;) {
    const bizContent = {
      billiardsName: '',
      latitude: null,
      longitude: null,
      cityId: 70, // 广州
      page: { start: pageNum, limit: 100 },
      sortDirection: 'DESC',
      sortType: 'DISTANCE',
      billiardsFrom: 'TXY'
    }

    const result = await request(bizContent, STORE_LIST_METHOD)

    const resp: any = await result.json()
    const json = JSON.parse(resp.bizContent)
    const list = json.items as any[]

    if (isEmptyArr(list))
      break

    list.forEach(it => {
      records.push({
        address: it.baseInfo.position,
        id: it.billiardsId + '',
        city: '广州市',
        name: it.baseInfo.billiardsName
      })
    })

    pageNum++
  }

  return records
}

async function getBilliardsTable(id: string) {
  const result = await request({ id: id + '' }, STORE_METHOD)
  const resp: any = await result.json()
  const json = JSON.parse(resp.bizContent)
  const list = json.items as any[]

  const current = dayjs().format('HH:mm')

  const records = list.flatMap((it) => {
    return (it.poolTables as any[]).map<Table>(it => {
      const appointRecords: Record<string, Record<string, boolean>> = {}

      if (it.remainingTime) {
        appointRecords[dayjs().format('YYYY-MM-DD')] = { [current]: true }
      }

      return {
        id: it.poolTableId + '',
        address: it.tableName + '',
        type: '中式台球',
        appointRecords
      }
    })
  })

  return records
}

export function koConvert(cache: Record<string, StoreDetail> = {}) {
  return mergeDetail(cache, getKoStore, getBilliardsTable)
}