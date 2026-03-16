import { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password)
      return Response.json({ error: 'Nome, email e senha obrigatórios' }, { status: 400 })
    if (password.length < 6)
      return Response.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (exists)
      return Response.json({ error: 'Email já cadastrado' }, { status: 409 })

    const count = await prisma.user.count()
    const role  = count === 0 ? 'admin' : 'agent'
    const hash  = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), password: hash, role },
      select: { id: true, name: true, email: true, role: true },
    })

    return Response.json({ user, message: role === 'admin' ? 'Admin criado!' : 'Conta criada!' }, { status: 201 })
  } catch(e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
