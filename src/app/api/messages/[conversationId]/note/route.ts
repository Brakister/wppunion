import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return Response.json({ error: 'Conteúdo obrigatório' }, { status: 400 })

  const conversationId = parseInt(params.conversationId)

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderType:  'agent',
      senderId:    user.id,
      senderName:  user.name,
      messageType: 'note',
      content:     content.trim(),
      isNote:      true,
    },
  })

  const io = (global as any)._io
  if (io) io.emit('message:new', { conversationId, message })

  return Response.json({ message })
}
