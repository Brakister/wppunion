'use client'
import styles from './Modal.module.css'

interface Props {
  qr:        string | null
  connected: boolean
  onClose:   () => void
}

export default function QRModal({ qr, connected, onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>
        <h3>📱 Conectar WhatsApp</h3>

        {connected ? (
          <div className={styles.connected}>
            <div className={styles.connIcon}>✅</div>
            <div className={styles.connText}>WhatsApp conectado!</div>
          </div>
        ) : qr ? (
          <div className={styles.qrWrap}>
            <img src={qr} alt="QR Code" className={styles.qrImg} />
            <p className={styles.qrHint}>
              Abra o WhatsApp no celular →<br />
              <strong>Dispositivos Conectados → Conectar Dispositivo</strong><br />
              e escaneie o QR Code acima.
            </p>
          </div>
        ) : (
          <div className={styles.qrLoading}>⏳ Aguardando QR Code...</div>
        )}
      </div>
    </div>
  )
}
