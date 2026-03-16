import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const wa = (global as any)._waService
  return Response.json({ qr: wa?.getQR() || null })
}
