import { NextResponse } from 'next/server'
import { applicationDeadline, daysUntilDeadline, isApplicationOpen } from '@/lib/deadline'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    open: isApplicationOpen(),
    deadline: applicationDeadline().toISOString(),
    daysLeft: daysUntilDeadline(),
  })
}
