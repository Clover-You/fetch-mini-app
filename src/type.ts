interface StoreDetail {
  store: Store
  tables: Record<string, Table>
}

interface Store {
  address: string
  city: string
  id: string
  name: string
}

interface Table {
  id: string
  address: string
  type: string
  appointRecords: Record<number, Record<string, boolean>>
}

