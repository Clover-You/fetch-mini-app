import fs from 'fs/promises'

import { appList } from './app'

(async () => {

  const records = await Promise.all(
    appList.map(async ({ excutor, name }) => {
      const importResult = await import(`../data/${name}.json`)
      const cache: Record<string, StoreDetail> = importResult.default ?? name
      return [name, await excutor(cache)] as const
    })
  )

  for (const [name, data] of records) {
    fs.writeFile(`data/${name}.json`, JSON.stringify(data, null, 2))
  }
})()
