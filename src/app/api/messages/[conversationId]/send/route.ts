import { NextRequest } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const conversationId = parseInt(params.conversationId)
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conv) return Response.json({ error: 'Conversa não encontrada' }, { status: 404 })

  const formData    = await req.formData()
  const content     = formData.get('content') as string | null
  const messageType = (formData.get('message_type') as string) || 'text'
  const file        = formData.get('file') as File | null

  let fileUrl  = null, fileName = null, fileSize = null, mimeType = null, filePath = null

  if (file) {
    const ext      = path.extname(file.name)
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    filePath = path.join(UPLOADS_DIR, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)
    fileUrl  = `/uploads/${filename}`
    fileName = file.name
    fileSize = file.size
    mimeType = file.type
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderType:  'agent',
      senderId:    user.id,
      senderName:  user.name,
      messageType,
      content:     content || null,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      isDelivered: true,
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: content || fileName || '[Arquivo]', lastMessageAt: new Date() },
  })

  // Send via WhatsApp
  const waService = (global as any)._waService
  if (waService?.isConnected()) {
    try {
      await waService.sendMessage(conv.waId, {
        type: messageType, content, filePath, mimeType, fileName, senderName: user.name,
      })
    } catch(e: any) { console.error('[WA] Send error:', e.message) }
  }

  const io = (global as any)._io
  if (io) {
    io.emit('message:new', { conversationId, message })
    io.emit('conversation:updated', {
      id: conversationId, lastMessage: content || fileName || '[Arquivo]', lastMessageAt: new Date().toISOString(),
    })
  }

  return Response.json({ message })
}
