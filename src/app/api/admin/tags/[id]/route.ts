import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 })
  await prisma.tag.delete({ where: { id: parseInt(params.id) } })
  return Response.json({ success: true })
}
