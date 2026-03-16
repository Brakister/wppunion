const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // Departments
  const depts = [
    { name: 'Suporte',    color: '#00a884' },
    { name: 'Comercial',  color: '#3b82f6' },
    { name: 'Financeiro', color: '#f59e0b' },
    { name: 'Estoque',    color: '#8b5cf6' },
  ]
  for (const d of depts) {
    await prisma.department.upsert({ where: { name: d.name }, update: {}, create: d })
  }

  // Tags
  const tags = [
    { name: 'urgente',     color: '#ef4444' },
    { name: 'orcamento',   color: '#f59e0b' },
    { name: 'pedido',      color: '#3b82f6' },
    { name: 'cliente novo',color: '#10b981' },
    { name: 'estoque',     color: '#8b5cf6' },
  ]
  for (const t of tags) {
    await prisma.tag.upsert({ where: { name: t.name }, update: {}, create: t })
  }

  console.log('Seed concluído. Crie seu usuário admin em /login')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
