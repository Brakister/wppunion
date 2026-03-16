'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab]       = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  // Login fields
  const [lEmail, setLEmail] = useState('')
  const [lPass,  setLPass]  = useState('')

  // Register fields
  const [rName,  setRName]  = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass,  setRPass]  = useState('')
  const [rPass2, setRPass2] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lEmail, password: lPass }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao entrar'); return }
      localStorage.setItem('hd_token', data.token)
      localStorage.setItem('hd_user',  JSON.stringify(data.user))
      router.push('/dashboard')
    } catch { setError('Erro de conexão') }
    finally  { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (rPass !== rPass2) { setError('Senhas não coincidem'); return }
    if (rPass.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, email: rEmail, password: rPass }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar conta'); return }
      setSuccess('Conta criada! Fazendo login...')
      // Auto login
      const r2   = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rEmail, password: rPass }),
      })
      const d2   = await r2.json()
      if (r2.ok) {
        localStorage.setItem('hd_token', d2.token)
        localStorage.setItem('hd_user',  JSON.stringify(d2.user))
        router.push('/dashboard')
      }
    } catch { setError('Erro de conexão') }
    finally  { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>💬</div>
          <h1>HelpDesk WA</h1>
          <p>Atendimento via WhatsApp</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login'    ? styles.active : ''}`} onClick={() => { setTab('login');    setError(''); setSuccess('') }}>Entrar</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>Criar Conta</button>
        </div>

        {error   && <div className={styles.msgError}>{error}</div>}
        {success && <div className={styles.msgSuccess}>{success}</div>}

        {tab === 'login' && (
          <form onSubmit={handleLogin} className={styles.form}>
            <label>Email<input type="email" value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" /></label>
            <label>Senha<input type="password" value={lPass} onChange={e => setLPass(e.target.value)} placeholder="••••••••" required autoComplete="current-password" /></label>
            <button type="submit" className={styles.btn} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className={styles.form}>
            <label>Nome<input type="text" value={rName} onChange={e => setRName(e.target.value)} placeholder="Seu nome" required /></label>
            <label>Email<input type="email" value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="seu@email.com" required /></label>
            <label>Senha<input type="password" value={rPass} onChange={e => setRPass(e.target.value)} placeholder="Mínimo 6 caracteres" required /></label>
            <label>Confirmar<input type="password" value={rPass2} onChange={e => setRPass2(e.target.value)} placeholder="Repita a senha" required /></label>
            <button type="submit" className={styles.btn} disabled={loading}>{loading ? 'Criando...' : 'Criar Conta'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
