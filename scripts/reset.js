#!/usr/bin/env node
/**
 * Reset Script — use quando:
 *   QR Code não aparece / sessão corrompida → node scripts/reset.js
 *   Banco com problema                      → node scripts/reset.js --db
 *   Reset total (sessão + banco)            → node scripts/reset.js --full
 */
const fs   = require('fs')
const path = require('path')

const args    = process.argv.slice(2)
const fullReset = args.includes('--full')
const dbOnly    = args.includes('--db')
const SESSION   = path.join(__dirname, '../sessions/baileys')
const DB        = path.join(__dirname, '../prisma/database.db')

console.log('\n🔧 WA HelpDesk — Reset Tool\n')

if (!dbOnly) {
  if (fs.existsSync(SESSION)) {
    fs.rmSync(SESSION, { recursive: true, force: true })
    console.log('✅ Sessão WhatsApp removida')
  }
  fs.mkdirSync(SESSION, { recursive: true })
  console.log('✅ Sessão recriada')
}

if (fullReset || dbOnly) {
  if (fs.existsSync(DB)) {
    const bak = `${DB}.bak.${Date.now()}`
    fs.copyFileSync(DB, bak)
    console.log(`✅ Backup: ${path.basename(bak)}`)
    fs.unlinkSync(DB)
    console.log('✅ Banco removido (será recriado no próximo start)')
  }
}

console.log('\n✨ Pronto! Execute: npm run dev\n')
