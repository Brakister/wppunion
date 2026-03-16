import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ ok: true })

  const auth  = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''

  if (token) await prisma.session.deleteMany({ where: { token } })
  await prisma.user.update({ where: { id: user.id }, data: { isOnline: false, lastSeen: new Date() } })

  return Response.json({ ok: true })
}
