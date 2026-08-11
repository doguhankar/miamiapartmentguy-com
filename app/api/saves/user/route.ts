import { NextResponse } from 'next/server'
import { getOrCreateUser, safeError } from '@/lib/saved-lists'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await getOrCreateUser({ firstName: String(body.firstName ?? ''), lastName: String(body.lastName ?? ''), phone: String(body.phone ?? '') })
    return NextResponse.json({ user: { id: user.id, firstName: user.first_name, shareSlug: user.share_slug } })
  } catch (error) { return NextResponse.json({ error: safeError(error) }, { status: 400 }) }
}
