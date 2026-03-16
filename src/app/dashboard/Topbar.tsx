'use client'
import { useState } from 'react'
import type { User } from '@/types'
import styles from './Topbar.module.css'

interface Props {
  user: User
  waConnected: boolean
  notifCount: number
  searchTerm: string
  onNotifClear: () => void
  onWAClick: () => void
  onAdmin: () => void
  onLogout: () => void
  onSearch: (s: string) => void
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Topbar({ user, waConnected, notifCount, searchTerm, onNotifClear, onWAClick, onAdmin, onLogout, onSearch }: Props) {
  const [dropOpen, setDropOpen] = useState(false)

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>💬</div>
        <span>HelpDesk WA</span>
      </div>

      <div className={styles.search}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.waPill} ${waConnected ? styles.connected : styles.disconnected}`}
          onClick={onWAClick}
        >
          <span className={styles.waDot} />
          {waConnected ? 'Conectado' : 'Desconectado'}
        </button>

        <button className={styles.iconBtn} onClick={() => { onNotifClear() }} title="Notificações">
          🔔
          {notifCount > 0 && <span className={styles.badge}>{notifCount > 99 ? '99+' : notifCount}</span>}
        </button>

        {user.role === 'admin' && (
          <button className={styles.iconBtn} onClick={onAdmin} title="Administração">⚙️</button>
        )}

        <div className={styles.avatarWrap}>
          <button className={styles.avatar} onClick={() => setDropOpen(d => !d)}>
            {initials(user.name)}
          </button>
          {dropOpen && (
            <>
              <div className={styles.overlay} onClick={() => setDropOpen(false)} />
              <div className={styles.dropdown}>
                <div className={styles.ddHeader}>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <div className={styles.ddSep} />
                {user.role === 'admin' && (
                  <button className={styles.ddItem} onClick={() => { onAdmin(); setDropOpen(false) }}>⚙️ Administração</button>
                )}
                <button className={styles.ddItem} onClick={() => { onWAClick(); setDropOpen(false) }}>📱 WhatsApp</button>
                <div className={styles.ddSep} />
                <button className={`${styles.ddItem} ${styles.danger}`} onClick={() => { onLogout(); setDropOpen(false) }}>🚪 Sair</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
