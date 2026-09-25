// Per-tab memory of the last filtered map view, plus which map page a building
// was opened from. Used so opening/closing a building preserves map filters.
//
// sessionStorage is per tab, so a brand-new tab starts clean automatically.

const keyFor = (pathname: string) => `mag:lastMapQuery:${pathname}`
const ORIGIN_KEY = 'mag:buildingOrigin'

export function saveMapQuery(pathname: string, params: URLSearchParams) {
  try {
    const p = new URLSearchParams(params)
    p.delete('building') // never persist an ephemeral building param
    const q = p.toString()
    if (q) sessionStorage.setItem(keyFor(pathname), q)
    else sessionStorage.removeItem(keyFor(pathname))
  } catch {}
}

export function readMapQuery(pathname: string): string {
  try {
    return sessionStorage.getItem(keyFor(pathname)) ?? ''
  } catch {
    return ''
  }
}

export function clearMapQuery(pathname: string) {
  try {
    sessionStorage.removeItem(keyFor(pathname))
  } catch {}
}

// The separate /buildings/[id] page uses this to know which map page to return
// to. Presence of a value means the building was opened from within the app in
// THIS tab (so router.back() is safe); absence means a fresh/direct landing.
export function saveBuildingOrigin(pathname: string) {
  try {
    sessionStorage.setItem(ORIGIN_KEY, pathname)
  } catch {}
}

export function readBuildingOrigin(): string {
  try {
    return sessionStorage.getItem(ORIGIN_KEY) ?? ''
  } catch {
    return ''
  }
}
