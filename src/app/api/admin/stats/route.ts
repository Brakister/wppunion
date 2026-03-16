import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 })

  const today = new Date(); today.setHours(0, 0, 0, 0)

  const [total, open, todayMsgs, online, byAgent, byDept] = await Promise.all([
    prisma.conversation.count(),
    prisma.conversation.count({ where: { status: 'open' } }),
    prisma.message.count({ where: { createdAt: { gte: today }, isNote: false } }),
    prisma.user.count({ where: { isOnline: true } }),
    prisma.user.findMany({
      select: {
        name: true,
        _count: { select: { conversations: true } },
      },
      orderBy: { conversations: { _count: 'desc' } },
      take: 10,
    }),
    prisma.department.findMany({
      select: {
        name: true, color: true,
        _count: { select: { conversations: true } },
      },
    }),
  ])

  return Response.json({
    stats: {
      total_conversations:  total,
      open_conversations:   open,
      today_messages:       todayMsgs,
      online_users:         online,
      by_agent:  byAgent.map(u => ({ name: u.name, total: u._count.conversations })),
      by_department: byDept.map(d => ({ name: d.name, color: d.color, total: d._count.conversations })),
    },
  })
}
