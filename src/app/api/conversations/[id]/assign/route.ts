import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { user_id, department_id } = await req.json()
  const id = parseInt(params.id)

  const conversation = await prisma.conversation.update({
    where: { id },
    data: {
      assignedTo:   user_id       ? parseInt(user_id)       : null,
      departmentId: department_id ? parseInt(department_id) : null,
    },
  })

  const io = (global as any)._io
  if (io) io.emit('conversation:updated', { id: conversation.id, assignedTo: conversation.assignedTo, departmentId: conversation.departmentId })

  return Response.json({ conversation })
}
