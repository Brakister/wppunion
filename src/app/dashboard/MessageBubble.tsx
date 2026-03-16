'use client'
import { useState } from 'react'
import type { Message, User } from '@/types'
import styles from './MessageBubble.module.css'

interface Props {
  msg:         Message
  currentUser: User
  contactName: string
}

export default function MessageBubble({ msg, currentUser, contactName }: Props) {
  const [lightbox, setLightbox] = useState(false)

  const fromMe  = msg.senderType === 'agent'
  const isNote  = msg.isNote
  const isPhone = fromMe && msg.senderName === '📱 Celular'

  let rowCls = styles.row
  if (isNote)      rowCls += ` ${styles.noteRow}`
  else if (fromMe) rowCls += ` ${styles.out}`
  else             rowCls += ` ${styles.in}`

  // Sender label
  let labelCls = styles.label
  if      (isNote)    labelCls += ` ${styles.noteLabel}`
  else if (isPhone)   labelCls += ` ${styles.phoneLabel}`
  else if (fromMe)    labelCls += ` ${styles.agentLabel}`
  else                labelCls += ` ${styles.clientLabel}`

  const senderDisplay = isNote  ? `📌 Nota — ${msg.senderName || 'Agente'}`
                       : isPhone ? '📱 Celular'
                       : fromMe  ? (msg.senderName || 'Suporte')
                       :           (msg.senderName || contactName || 'Cliente')

  // Body content
  let body: React.ReactNode = null
  const mt = msg.messageType

  if (mt === 'image' && msg.fileUrl) {
    body = (
      <>
        <img className={styles.imgPreview} src={msg.fileUrl} alt="Imagem" onClick={() => setLightbox(true)} loading="lazy" />
        {msg.content && <p className={styles.caption}>{msg.content}</p>}
      </>
    )
  } else if (mt === 'audio' && msg.fileUrl) {
    body = <audio className={styles.audio} controls src={msg.fileUrl} />
  } else if (mt === 'video' && msg.fileUrl) {
    body = <video className={styles.video} controls src={msg.fileUrl} />
  } else if (mt === 'document' && msg.fileUrl) {
    body = (
      <a className={styles.docBlock} href={msg.fileUrl} download={msg.fileName || 'arquivo'} target="_blank" rel="noreferrer">
        <span className={styles.docIcon}>{docIcon(msg.mimeType || '')}</span>
        <span className={styles.docInfo}>
          <span className={styles.docName}>{msg.fileName || 'Documento'}</span>
          {msg.fileSize && <span className={styles.docSize}>{fmtBytes(msg.fileSize)}</span>}
        </span>
        <span>⬇️</span>
      </a>
    )
  } else if (mt === 'sticker' && msg.fileUrl) {
    body = <img className={styles.sticker} src={msg.fileUrl} alt="Sticker" />
  } else if (mt === 'location' && msg.content) {
    const [lat, lng] = msg.content.split(',')
    body = <a className={styles.location} href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noreferrer">📍 Ver localização</a>
  } else {
    body = <span className={styles.text} dangerouslySetInnerHTML={{ __html: linkify(esc(msg.content || '')) }} />
  }

  const time = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <div className={rowCls}>
        {!fromMe && (
          <div className={styles.avatar} style={{ background: avatarBg(msg.senderName || contactName) }}>
            {initials(msg.senderName || contactName)}
          </div>
        )}
        <div className={`${styles.bubble} ${isNote ? styles.noteBubble : fromMe ? styles.outBubble : styles.inBubble}`}>
          <div className={labelCls}>{senderDisplay}</div>
          <div className={styles.body}>{body}</div>
          <div className={styles.meta}>
            {isNote && <span className={styles.noteTag}>nota</span>}
            <span className={styles.time}>{time}</span>
            {fromMe && !isNote && (
              <span className={`${styles.tick} ${msg.isDelivered ? styles.delivered : ''}`}>
                {msg.isDelivered ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)}>
          <img src={msg.fileUrl!} alt="Imagem" />
        </div>
      )}
    </>
  )
}

function initials(name: string) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function avatarBg(name: string) {
  const colors = ['#1a7f5a','#1a5f8f','#6b3fa0','#8f3f1a','#1a7a7a','#7a1a5a','#5a7a1a']
  const i = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return colors[i]
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function linkify(text: string) {
  return text.replace(/(https?:\/\/[^\s<]+)/g, url => `<a href="${url}" target="_blank" rel="noreferrer" style="color:var(--info);text-decoration:underline">${url}</a>`)
}

function fmtBytes(b: number) {
  if (b < 1024)    return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}

function docIcon(mime: string) {
  if (mime.includes('pdf'))              return '📄'
  if (mime.includes('word') || mime.includes('doc')) return '📝'
  if (mime.includes('excel') || mime.includes('sheet') || mime.includes('xls')) return '📊'
  return '📁'
}
