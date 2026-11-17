// Tiny in-memory stand-in for the Supabase service-role client, just enough for the inbox code.
// Real SQL behaviour (RLS, dedupe, triggers) is covered by tests/inbox/db/run.sh against Postgres.
type Row = Record<string, any>

export function makeAdmin(
  seed: Record<string, Row[]> = {},
  opts: { users?: Record<string, string>; rpc?: (name: string, args: any) => any } = {},
) {
  const tables: Record<string, Row[]> = JSON.parse(JSON.stringify(seed))
  const calls = { rpc: [] as { name: string; args: any }[], inserts: [] as { table: string; row: Row }[], updates: [] as { table: string; patch: Row; where: number }[] }
  let n = 0

  function builder(table: string) {
    tables[table] ??= []
    let op: 'select' | 'update' | 'insert' | 'upsert' = 'select'
    const filters: ((r: Row) => boolean)[] = []
    let payload: any
    let onConflict: string | undefined
    let single: '' | 'maybe' | 'single' = ''
    let lim: number | undefined

    const run = () => {
      const match = () => tables[table].filter(r => filters.every(f => f(r)))
      if (op === 'select') {
        let rows = match()
        if (lim != null) rows = rows.slice(0, lim)
        if (single === 'maybe') return { data: rows[0] ?? null, error: null }
        if (single === 'single') return rows[0] ? { data: rows[0], error: null } : { data: null, error: { message: 'no rows' } }
        return { data: rows, error: null }
      }
      if (op === 'update') {
        const rows = match()
        rows.forEach(r => Object.assign(r, payload))
        calls.updates.push({ table, patch: payload, where: rows.length })
        return { data: null, error: null }
      }
      if (op === 'insert') {
        const row = { id: `gen-${++n}`, ...payload }
        tables[table].push(row)
        calls.inserts.push({ table, row })
        return { data: single ? row : [row], error: null }
      }
      // upsert
      const key = onConflict ?? 'id'
      const existing = tables[table].find(r => r[key] === payload[key])
      if (existing) Object.assign(existing, payload)
      else tables[table].push({ ...payload })
      return { data: null, error: null }
    }

    const b: any = {
      select: () => b,
      eq: (k: string, v: any) => (filters.push(r => r[k] === v), b),
      ilike: (k: string, v: string) => (filters.push(r => String(r[k] ?? '').toLowerCase() === String(v).toLowerCase()), b),
      is: (k: string, v: any) => (filters.push(r => (v === null ? r[k] == null : r[k] === v)), b),
      limit: (x: number) => ((lim = x), b),
      update: (p: Row) => ((op = 'update'), (payload = p), b),
      insert: (p: Row) => ((op = 'insert'), (payload = p), b),
      upsert: (p: Row, o?: { onConflict?: string }) => ((op = 'upsert'), (payload = p), (onConflict = o?.onConflict), b),
      maybeSingle: () => ((single = 'maybe'), b),
      single: () => ((single = 'single'), b),
      then: (res: any, rej: any) => Promise.resolve(run()).then(res, rej),
    }
    return b
  }

  const admin: any = {
    from: builder,
    rpc: async (name: string, args: any) => {
      calls.rpc.push({ name, args })
      return opts.rpc ? opts.rpc(name, args) : { data: { status: 'ok' }, error: null }
    },
    auth: {
      getUser: async (token: string) => {
        const email = opts.users?.[token]
        return email ? { data: { user: { email } }, error: null } : { data: { user: null }, error: { message: 'invalid token' } }
      },
    },
  }
  return { admin, tables, calls }
}
