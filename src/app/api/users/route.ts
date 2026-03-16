import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true, departmentId: true, isOnline: true, lastSeen: true, createdAt: true },
  })
  return Response.json({ users })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 })

  const { name, email, password, role = 'agent', department_id } = await req.json()
  if (!name || !email || !password)
    return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (exists) return Response.json({ error: 'Email já cadastrado' }, { status: 409 })

  const hash = await bcrypt.hash(password, 10)
  const newUser = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hash, role, departmentId: department_id || null },
    select: { id: true, name: true, email: true, role: true, departmentId: true },
  })
  return Response.json({ user: newUser }, { status: 201 })
}
