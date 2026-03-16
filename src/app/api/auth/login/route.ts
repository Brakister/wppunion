import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password)
      return Response.json({ error: 'Email e senha obrigatórios' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user) return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })

    await prisma.user.update({ where: { id: user.id }, data: { isOnline: true, lastSeen: new Date() } })

    const token = signToken(user.id)
    await prisma.session.create({
      data: {
        userId: user.id, token,
        ip: req.headers.get('x-forwarded-for') || '',
        userAgent: req.headers.get('user-agent') || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return Response.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId },
    })
  } catch(e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
