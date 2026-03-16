import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const id = parseInt(params.id)
  const c = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user:       { select: { id: true, name: true } },
      department: { select: { id: true, name: true, color: true } },
      tags:       { include: { tag: true } },
    },
  })

  if (!c) return Response.json({ error: 'Conversa não encontrada' }, { status: 404 })

  return Response.json({
    conversation: {
      ...c,
      assignedName:    c.user?.name       || null,
      departmentName:  c.department?.name  || null,
      departmentColor: c.department?.color || null,
      tags: c.tags.map(t => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
    },
  })
}
