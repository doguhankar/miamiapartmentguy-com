import { NextRequest, NextResponse } from 'next/server'

interface LeadData {
  moveDate: string
  apartmentSize: string
  budget: string
  neighborhoods: string[]
  creditScore: string
  name: string
  phone: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json()

    console.log('[v0] Lead received:', {
      name: body.name,
      phone: body.phone,
      moveDate: body.moveDate,
      budget: body.budget,
      neighborhoods: body.neighborhoods.join(', '),
      apartmentSize: body.apartmentSize,
      creditScore: body.creditScore,
      timestamp: new Date().toISOString(),
    })

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // 3. Add to CRM
    // 4. Send SMS to customer

    return NextResponse.json(
      { success: true, message: 'Lead submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error processing lead:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit lead' },
      { status: 500 }
    )
  }
}
