import fs from 'fs/promises'

import { appList } from './app'

(async () => {

  const records: [string, Record<string, StoreDetail>][] = []

  for (const { excutor, name } of appList) {
    const importResult = await import(`../data/${name}.json`)
    const cache: Record<string, StoreDetail> = importResult.default ?? name

    records.push([name, await excutor(cache)] as const)
  }

  for (const [name, data] of records) {
    fs.writeFile(`data/${name}.json`, JSON.stringify(data, null, 2))
  }
})()
