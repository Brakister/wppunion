import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const targetId = parseInt(params.id)
  const isAdmin  = user.role === 'admin'
  const isSelf   = user.id === targetId
  if (!isAdmin && !isSelf) return Response.json({ error: 'Sem permissão' }, { status: 403 })

  const body: any = await req.json()
  const data: any = {}
  if (body.name)     data.name  = body.name
  if (body.email)    data.email = body.email.toLowerCase()
  if (body.password) data.password = await bcrypt.hash(body.password, 10)
  if (isAdmin && body.role)         data.role         = body.role
  if (isAdmin && body.department_id !== undefined) data.departmentId = body.department_id || null

  const updated = await prisma.user.update({
    where: { id: targetId },
    data,
    select: { id: true, name: true, email: true, role: true, departmentId: true },
  })
  return Response.json({ user: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 })

  const targetId = parseInt(params.id)
  if (targetId === user.id) return Response.json({ error: 'Não pode remover sua própria conta' }, { status: 400 })

  await prisma.user.delete({ where: { id: targetId } })
  return Response.json({ success: true })
}
