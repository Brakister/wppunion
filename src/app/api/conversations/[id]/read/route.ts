import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const id = parseInt(params.id)
  await prisma.conversation.update({ where: { id }, data: { unreadCount: 0 } })
  await prisma.message.updateMany({ where: { conversationId: id, senderType: 'client' }, data: { isRead: true } })

  return Response.json({ success: true })
}
