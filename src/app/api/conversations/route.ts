import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status     = searchParams.get('status')     || undefined
  const assignedTo = searchParams.get('assigned_to')
  const tag        = searchParams.get('tag')        || undefined
  const search     = searchParams.get('search')     || undefined
  const page       = parseInt(searchParams.get('page')  || '1')
  const limit      = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (status)     where.status = status
  if (assignedTo) where.assignedTo = parseInt(assignedTo)
  if (search)     where.OR = [
    { contactName:   { contains: search } },
    { contactNumber: { contains: search } },
  ]
  if (tag) where.tags = { some: { tag: { name: tag } } }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    skip:  (page - 1) * limit,
    take:  limit,
    include: {
      user:       { select: { id: true, name: true } },
      department: { select: { id: true, name: true, color: true } },
      tags:       { include: { tag: true } },
    },
  })

  const result = conversations.map(c => ({
    id:              c.id,
    waId:            c.waId,
    contactName:     c.contactName,
    contactNumber:   c.contactNumber,
    status:          c.status,
    assignedTo:      c.assignedTo,
    assignedName:    c.user?.name       || null,
    departmentId:    c.departmentId,
    departmentName:  c.department?.name  || null,
    departmentColor: c.department?.color || null,
    unreadCount:     c.unreadCount,
    lastMessage:     c.lastMessage,
    lastMessageAt:   c.lastMessageAt,
    createdAt:       c.createdAt,
    tags:            c.tags.map(t => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
  }))

  return Response.json({ conversations: result })
}
