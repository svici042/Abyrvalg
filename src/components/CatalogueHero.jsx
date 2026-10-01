import { HERO_HEADING, HERO_TEXT } from '../config/storeContent'
import { useStoreContent } from '../hooks/useStoreContent'
import { useLanguage } from '../hooks/useLanguage'
import styles from '../pages/CataloguePage.module.css'

// Decorative artwork is hidden from assistive technology; the link targets the catalogue.
export default function CatalogueHero() {
  const { t } = useLanguage()
  const { content, storeText } = useStoreContent()
  return (
    <>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t('A LITTLE WORLD OF GOOD FINDS')}</p>
          <h1>
            {content.heroHeading ? (
              storeText('heroHeading')
            ) : (
              <>
                {t(HERO_HEADING[0])}
                <br />
                {t(HERO_HEADING[1])} <em>{t(HERO_HEADING[2])}</em>
              </>
            )}
          </h1>
          <p>
            {content.heroText ? (
              storeText('heroText')
            ) : (
              <>
                {t(HERO_TEXT[0])}
                <br />
                {t(HERO_TEXT[1])}
              </>
            )}
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
            {storeText('storeName')} / {t('Everyday finds')}
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
