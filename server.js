require('dotenv').config()
const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')
const fs = require('fs')
const next = require('next')
const { Server } = require('socket.io')
const { setupSocket } = require('./src/lib/socket.server')
const { WhatsAppService } = require('./src/lib/whatsapp.server')
const { seedDb } = require('./src/lib/seed')

const dev  = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000')
const app  = next({ dev })
const handle = app.getRequestHandler()
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

const MIME_TYPES = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.webm': 'audio/webm',
  '.m4a':  'audio/mp4',
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.pdf':  'application/pdf',
}

function serveUploads(req, res, pathname) {
  const relPath = pathname.replace(/^\/uploads\//, '')
  const safePath = path.normalize(path.join(UPLOADS_DIR, relPath))
  if (!safePath.startsWith(UPLOADS_DIR)) {
    res.statusCode = 400
    res.end('Invalid path')
    return true
  }

  if (!fs.existsSync(safePath) || !fs.statSync(safePath).isFile()) {
    res.statusCode = 404
    res.end('Not found')
    return true
  }

  const ext = path.extname(safePath).toLowerCase()
  const total = fs.statSync(safePath).size
  const range = req.headers.range
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range)
    const start = match ? parseInt(match[1], 10) : 0
    const end = match && match[2] ? parseInt(match[2], 10) : total - 1
    if (start >= total || end >= total) {
      res.statusCode = 416
      res.setHeader('Content-Range', `bytes */${total}`)
      res.end()
      return true
    }
    res.statusCode = 206
    res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Length', end - start + 1)
    res.setHeader('Content-Type', contentType)
    fs.createReadStream(safePath, { start, end }).pipe(res)
    return true
  }

  res.statusCode = 200
  res.setHeader('Content-Length', total)
  res.setHeader('Content-Type', contentType)
  fs.createReadStream(safePath).pipe(res)
  return true
}

app.prepare().then(async () => {
  // Seed default data
  await seedDb()

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/uploads/')) {
      if (serveUploads(req, res, parsedUrl.pathname)) return
    }
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
