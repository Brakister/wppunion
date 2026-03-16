import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
  return Response.json({ tags })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 })
  const { name, color = '#00a884' } = await req.json()
  if (!name) return Response.json({ error: 'Nome obrigatório' }, { status: 400 })
  try {
    const tag = await prisma.tag.create({ data: { name, color } })
    return Response.json({ tag })
  } catch {
    return Response.json({ error: 'Tag já existe' }, { status: 409 })
  }
}
