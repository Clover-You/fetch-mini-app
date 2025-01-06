import dayjs, { Dayjs } from 'dayjs'

export function isEmptyArr(list?: unknown[]) {
  const size = list?.length ?? 0
  return size <= 0
}

export function recordAppointment(startTime: string | number | Date | Dayjs, duration: number) {
  const record: Record<string, boolean> = {};
  let currentTime = dayjs(startTime);
  const endTime = dayjs(startTime).add(duration, 'minute');

  while (currentTime.isBefore(endTime)) {
    const key = currentTime.format('HH:mm');
    record[key] = true;
    currentTime = currentTime.add(30, 'minute');
  }

  return record;
}

export async function mergeDetail(
  cache: Record<string, StoreDetail> = {},
  getStore: () => Promise<Store[]>,
  getTable: (id: string) => Promise<Table[]>
) {
  const records = await getStore()

  records.forEach((it) => {
    cache[it.id] ??= { store: it, tables: {} }

    cache[it.id].store = it
  })

  const recordValues = Object.values(cache)

  const tables = await Promise.all(
    recordValues.map(async ({ store }) => {
      const sid = store.id

      try {
        const tableResp = await getTable(sid)
        return [sid, tableResp] as const
      } catch (err) {
        console.error('store-id = ' + sid);

        throw err
      }
    })
  )
  const storeTableRecords = Object.fromEntries(tables)

  recordValues.forEach(it => {
    const tables = storeTableRecords[it.store.id]
    if (!tables) return

    tables.forEach(table => {
      it.tables[table.id] ??= table

      for (const day in table.appointRecords) {
        const cacheAppoint = it.tables[table.id].appointRecords[day] ?? {}
        Object.assign(cacheAppoint, table.appointRecords[day])
        it.tables[table.id].appointRecords[day] = cacheAppoint
      }
    })

  })

  return cache
}
