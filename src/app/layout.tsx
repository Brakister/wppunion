import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WA HelpDesk',
  description: 'Sistema de atendimento via WhatsApp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
