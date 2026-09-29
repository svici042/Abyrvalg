import { useLanguage } from '../hooks/useLanguage'
import styles from '../pages/CataloguePage.module.css'

// Decorative artwork is hidden from assistive technology; the link targets the catalogue.
export default function CatalogueHero() {
  const { t } = useLanguage()
  return (
    <>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t('A LITTLE WORLD OF GOOD FINDS')}</p>
          <h1>
            {t('Everyday life, with')}
            <br />
            {t('a little more')} <em>{t('possibility.')}</em>
          </h1>
          <p>
            {t('From what you need to what you never knew you wanted.')}
            <br />
            {t('Find your next favourite with us.')}
          </p>
          <a href="#catalogue">
            {t('Explore the collection')} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className={styles.art} aria-hidden="true">
          <span className={styles.orbit} />
          <span className={styles.star}>✳</span>
          <span className={styles.artLabel}>
            {t('CHOSEN FOR')}
            <br />
            {t('THE CURIOUS.')}
          </span>
          <span className={styles.artBottom}>
            {t('abyrvalg / everyday finds')}
          </span>
        </div>
      </section>
      <div className={styles.intro}>
        <span>{t('A wide selection')}</span>
        <span>{t('A simple cart')}</span>
        <span>{t('Your style. Your choice.')}</span>
      </div>
    </>
  )
}
