import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const conversationId = parseInt(params.conversationId)
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conv) return Response.json({ error: 'Conversa não encontrada' }, { status: 404 })

  // 2 days ago — Prisma handles this correctly with native Date
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      createdAt: { gte: twoDaysAgo },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  })

  // Mark as read
  await prisma.message.updateMany({
    where: { conversationId, senderType: 'client', isRead: false },
    data:  { isRead: true },
  })
  await prisma.conversation.update({ where: { id: conversationId }, data: { unreadCount: 0 } })

  const result = messages.map(m => ({
    id:             m.id,
    conversationId: m.conversationId,
    waMessageId:    m.waMessageId,
    senderType:     m.senderType,
    senderId:       m.senderId,
    senderName:     m.senderName || m.sender?.name || '',
    messageType:    m.messageType,
    content:        m.content,
    fileUrl:        m.fileUrl,
    fileName:       m.fileName,
    fileSize:       m.fileSize,
    mimeType:       m.mimeType,
    isRead:         m.isRead,
    isDelivered:    m.isDelivered,
    isNote:         m.isNote,
    createdAt:      m.createdAt,
  }))

  return Response.json({ messages: result })
}
