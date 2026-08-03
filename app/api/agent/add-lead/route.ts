import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface BlankCardData {
  name: string
  phone: string
  beds?: string | null
  budget?: string | null
  move_in_timing?: string | null
  notes?: string | null
  agent_id: string
}

export async function POST(req: NextRequest) {
  try {
    const data: BlankCardData = await req.json()

    // Validation
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: { message: 'Full name is required' } },
        { status: 400 }
      )
    }
    if (!data.phone?.trim() || data.phone.trim().length < 7) {
      return NextResponse.json(
        { error: { message: 'Phone must be at least 7 characters' } },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    const newLead = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      move_in_timing: data.move_in_timing || null,
      beds: data.beds || null,
      budget: data.budget || null,
      area: null,
      credit_range: null,
      agent_id: data.agent_id,
      stage: 'New Lead',
      source: 'Manual Entry',
      notes: data.notes || null,
    }

    const { data: insertedLead, error } = await admin
      .from('leads')
      .insert([newLead])
      .select('*')
      .single()

    if (error) {
      console.error('[v0] Supabase insert error:', error)
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: insertedLead,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[v0] add-lead error:', err)
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    )
  }
}
