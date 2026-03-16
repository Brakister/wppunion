import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import prisma from './prisma'

const SECRET = process.env.JWT_SECRET || 'helpdesk_secret_change_in_production'

export function signToken(userId: number): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: number }
  } catch {
    return null
  }
}

export async function getAuthUser(req: NextRequest) {
  const auth  = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true, departmentId: true, isOnline: true },
  })
  return user
}

export function requireAuth(handler: Function) {
  return async (req: NextRequest, ctx: any) => {
    const user = await getAuthUser(req)
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return handler(req, ctx, user)
  }
}

export function requireAdmin(handler: Function) {
  return async (req: NextRequest, ctx: any) => {
    const user = await getAuthUser(req)
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })
    if (user.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 })
    return handler(req, ctx, user)
  }
}
