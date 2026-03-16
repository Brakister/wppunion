require('dotenv').config()
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { setupSocket } = require('./src/lib/socket.server')
const { WhatsAppService } = require('./src/lib/whatsapp.server')
const { seedDb } = require('./src/lib/seed')

const dev  = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000')
const app  = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  // Seed default data
  await seedDb()

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Socket.io
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  })

  // Make io globally accessible for API routes
  global._io = io
  setupSocket(io)

  // WhatsApp service
  const waService = new WhatsAppService(io)
  global._waService = waService
  waService.connect()

  httpServer.listen(port, () => {
    console.log(`\n🚀 WA HelpDesk rodando em http://localhost:${port}`)
    console.log(`📱 Acesse /login para criar sua conta\n`)
  })
})
