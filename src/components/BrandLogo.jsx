import logo from '../assets/brand-logo-display.webp'
import styles from './BrandLogo.module.css'

// Keep the original asset proportions; decorative instances rely on the parent link label.
export default function BrandLogo({ compact = false, decorative = false }) {
  return (
    <img
      className={compact ? styles.compact : styles.logo}
      src={logo}
      alt={decorative ? '' : 'Abyrvalg'}
      width="564"
      height="160"
    />
  )
}
