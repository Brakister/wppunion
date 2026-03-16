import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { tag_ids } = await req.json()
  const conversationId = parseInt(params.id)

  await prisma.conversationTag.deleteMany({ where: { conversationId } })

  if (Array.isArray(tag_ids) && tag_ids.length > 0) {
    await prisma.conversationTag.createMany({
      data: tag_ids.map((tagId: number) => ({ conversationId, tagId })),
      skipDuplicates: true,
    })
  }

  return Response.json({ success: true })
}
