import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { status } = await req.json()
  const validStatuses = ['open', 'closed', 'pending']
  if (!validStatuses.includes(status))
    return Response.json({ error: 'Status inválido' }, { status: 400 })

  const id = parseInt(params.id)
  const conversation = await prisma.conversation.update({ where: { id }, data: { status } })

  const io = (global as any)._io
  if (io) io.emit('conversation:updated', { id: conversation.id, status: conversation.status })

  return Response.json({ conversation })
}
