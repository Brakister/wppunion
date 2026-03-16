import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  await prisma.conversation.updateMany({ data: { unreadCount: 0 } })
  await prisma.message.updateMany({
    where: { senderType: 'client', isRead: false },
    data:  { isRead: true },
  })

  return Response.json({ ok: true })
}
