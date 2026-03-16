import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 })
  const wa = (global as any)._waService
  if (wa) await wa.logout()
  return Response.json({ success: true })
}
