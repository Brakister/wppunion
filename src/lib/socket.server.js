const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const SECRET = process.env.JWT_SECRET || 'helpdesk_secret_change_in_production'

function setupSocket(io) {
  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next(new Error('Token required'))
    try {
      const decoded = jwt.verify(token, SECRET)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true },
      })
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.user
    console.log(`[Socket] ${user.name} connected (${socket.id})`)

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    })
    io.emit('user:online', { userId: user.id, name: user.name })

    socket.on('join:conversation', (convId) => socket.join(`conv:${convId}`))
    socket.on('leave:conversation', (convId) => socket.leave(`conv:${convId}`))

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', {
        conversationId, user: { id: user.id, name: user.name },
      })
    })
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { conversationId, userId: user.id })
    })

    socket.on('disconnect', async () => {
      console.log(`[Socket] ${user.name} disconnected`)
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: false, lastSeen: new Date() },
      })
      io.emit('user:offline', { userId: user.id })
    })
  })
}

module.exports = { setupSocket }
