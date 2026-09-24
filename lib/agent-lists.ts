import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const MAX_UNITS = 50
export const MAX_LISTS_PER_HOUR = 30
const SLUG_CHARS = "abcdefghjkmnpqrstuvwxyz23456789"
const RESERVED = new Set([
  "admin", "agent", "api", "list", "lists", "l", "map", "seb", "join-team",
  "buildings", "login", "logout", "new", "edit", "saved", "null", "undefined",
])

export type Agent = { email: string; name: string; phone: string | null }

export type UnitSnapshot = {
  building_id: string
  building_name: string | null
  unit_number: string
  unit_type: string | null
  beds: number | null
  baths: number | null
  sqft: number | null
  price: number | null
  available_date: string | null
  floor_plan_code: string | null
  floor_plan_image: string | null
  photo_url: string | null
  captured_at: string
}

/** Returns the approved agent for the current request, or null. Server-side only. */
export async function getVerifiedAgent(): Promise<Agent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const email = data?.user?.email?.toLowerCase()
  if (error || !email) return null

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from("agent_allowlist")
    .select("email, approved, display_name, phone")
    .ilike("email", email)
    .eq("approved", true)
    .limit(1)
  const row = rows?.[0]
  if (!row) return null
  return { email, name: row.display_name || "your agent", phone: row.phone ?? null }
}

export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function validateSlug(slug: string): string | null {
  if (slug.length < 3 || slug.length > 40) return "Use 3 to 40 characters."
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Use lowercase letters, numbers, and single hyphens."
  if (RESERVED.has(slug)) return "That link name is reserved."
  return null
}

export function randomSlug(length = 7): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => SLUG_CHARS[b % SLUG_CHARS.length]).join("")
}

export async function slugAvailable(slug: string): Promise<boolean> {
  const admin = createAdminClient()
  const { count } = await admin
    .from("agent_lists")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug)
  return (count ?? 0) === 0
}

type DraftItem = { building_id: string; unit_number: string; note?: string | null }

export async function publishList(
  agent: Agent,
  input: { title?: string | null; slug?: string | null; items: DraftItem[] },
): Promise<{ slug: string } | { error: string; status: number }> {
  const admin = createAdminClient()

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recent } = await admin
    .from("agent_lists")
    .select("id", { count: "exact", head: true })
    .eq("agent_email", agent.email)
    .gte("created_at", since)
  if ((recent ?? 0) >= MAX_LISTS_PER_HOUR) return { error: "Too many lists this hour. Try again later.", status: 429 }

  const title = (input.title ?? "").trim().slice(0, 80) || null

  const seen = new Set<string>()
  const items = (input.items ?? [])
    .map((i) => ({
      building_id: String(i.building_id ?? "").trim(),
      unit_number: String(i.unit_number ?? "").trim(),
      note: (i.note ?? "").toString().replace(/https?:\/\/\S+|www\.\S+/gi, "").trim().slice(0, 200) || null,
    }))
    .filter((i) => {
      const key = `${i.building_id}::${i.unit_number}`
      if (!i.building_id || !i.unit_number || seen.has(key)) return false
      seen.add(key)
      return true
    })
  if (items.length === 0) return { error: "Add at least one unit.", status: 400 }
  if (items.length > MAX_UNITS) return { error: `Max ${MAX_UNITS} units per list.`, status: 400 }

  // Snapshot from the live units table (never trust client data)
  const buildingIds = [...new Set(items.map((i) => i.building_id))]
  const { data: units, error: unitsError } = await admin
    .from("units")
    .select("building_id, buildingname, unitnumber, unittype, beds, baths, sqft, price, availabilitydate, floor_plan_code, floor_plan_image")
    .in("building_id", buildingIds)
    .limit(5000)
  if (unitsError) return { error: "Could not load units.", status: 500 }

  const { data: images } = await admin
    .from("building_images")
    .select("building_id, image_url, sort_order")
    .in("building_id", buildingIds)
    .order("sort_order", { ascending: true })
  const photoByBuilding = new Map<string, string>()
  for (const img of images ?? []) if (!photoByBuilding.has(img.building_id)) photoByBuilding.set(img.building_id, img.image_url)

  const unitByKey = new Map((units ?? []).map((u) => [`${u.building_id}::${u.unitnumber}`, u]))
  const now = new Date().toISOString()
  const missing: string[] = []
  const rows = items.map((i, position) => {
    const u = unitByKey.get(`${i.building_id}::${i.unit_number}`)
    if (!u) missing.push(i.unit_number)
    const snapshot: UnitSnapshot = {
      building_id: i.building_id,
      building_name: u?.buildingname ?? null,
      unit_number: i.unit_number,
      unit_type: u?.unittype ?? null,
      beds: u?.beds ?? null,
      baths: u?.baths ?? null,
      sqft: u?.sqft ?? null,
      price: u?.price ?? null,
      available_date: u?.availabilitydate ?? null,
      floor_plan_code: u?.floor_plan_code ?? null,
      floor_plan_image: u?.floor_plan_image ?? null,
      photo_url: photoByBuilding.get(i.building_id) ?? null,
      captured_at: now,
    }
    return { building_id: i.building_id, unit_number: i.unit_number, note: i.note, position, snapshot }
  })
  if (missing.length) return { error: `No longer available: ${missing.join(", ")}. Remove them and publish again.`, status: 409 }

  // Slug
  let slug: string
  if (input.slug && input.slug.trim()) {
    slug = normalizeSlug(input.slug)
    const invalid = validateSlug(slug)
    if (invalid) return { error: invalid, status: 400 }
  } else {
    slug = randomSlug()
  }

  // Insert list (retry random slugs on collision)
  let listId: string | null = null
  for (let attempt = 0; attempt < 5 && !listId; attempt++) {
    const { data, error } = await admin
      .from("agent_lists")
      .insert({ slug, title, agent_email: agent.email })
      .select("id")
      .single()
    if (data) listId = data.id
    else if (error?.code === "23505") {
      if (input.slug && input.slug.trim()) return { error: "That link name is taken.", status: 409 }
      slug = randomSlug()
    } else return { error: "Could not create list.", status: 500 }
  }
  if (!listId) return { error: "Could not create list.", status: 500 }

  const { error: itemsError } = await admin
    .from("agent_list_items")
    .insert(rows.map((r) => ({ ...r, list_id: listId })))
  if (itemsError) {
    // List rows can't be deleted (by design). Hide the empty shell instead.
    await admin.from("agent_lists").update({ hidden: true }).eq("id", listId)
    return { error: "Could not save units.", status: 500 }
  }
  return { slug }
}

export type PublicListItem = {
  building_id: string
  unit_number: string
  note: string | null
  snapshot: UnitSnapshot
  live: { price: number | null; available_date: string | null } | null
}

export async function getPublicList(slug: string) {
  const admin = createAdminClient()
  const { data: list } = await admin
    .from("agent_lists")
    .select("id, slug, title, agent_email, created_at, hidden")
    .eq("slug", slug)
    .maybeSingle()
  if (!list || list.hidden) return null

  const [{ data: items }, { data: agentRows }] = await Promise.all([
    admin
      .from("agent_list_items")
      .select("building_id, unit_number, note, snapshot, position")
      .eq("list_id", list.id)
      .order("position", { ascending: true }),
    admin.from("agent_allowlist").select("display_name, phone").ilike("email", list.agent_email).limit(1),
  ])

  const buildingIds = [...new Set((items ?? []).map((i) => i.building_id))]
  const { data: liveUnits } = buildingIds.length
    ? await admin
        .from("units")
        .select("building_id, unitnumber, price, availabilitydate")
        .in("building_id", buildingIds)
        .limit(5000)
    : { data: [] as { building_id: string; unitnumber: string; price: number | null; availabilitydate: string | null }[] }
  const liveByKey = new Map((liveUnits ?? []).map((u) => [`${u.building_id}::${u.unitnumber}`, u]))

  const agent = agentRows?.[0]
  return {
    id: list.id as string,
    slug: list.slug as string,
    title: (list.title as string | null) ?? null,
    createdAt: list.created_at as string,
    agentName: agent?.display_name || "Don",
    agentPhone: agent?.phone || "+14077657306",
    items: (items ?? []).map((i): PublicListItem => {
      const live = liveByKey.get(`${i.building_id}::${i.unit_number}`)
      return {
        building_id: i.building_id,
        unit_number: i.unit_number,
        note: i.note,
        snapshot: i.snapshot as UnitSnapshot,
        live: live ? { price: live.price, available_date: live.availabilitydate } : null,
      }
    }),
  }
}
