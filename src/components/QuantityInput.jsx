import { useEffect, useId, useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import styles from './QuantityInput.module.css'
function validQuantity(raw, max) {
  const next = Number(raw)
  return raw.trim() !== '' &&
    Number.isSafeInteger(next) &&
    next >= 1 &&
    next <= max
    ? next
    : null
}

export default function QuantityInput({
  value,
  max,
  onCommit,
  onDraftChange,
  title = '',
}) {
  const id = useId()
  const { t } = useLanguage()
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState(false)
  // Only actual external value changes replace an unfinished draft.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setDraft(String(value))
    setError(false)
  }, [value])
  useEffect(() => {
    onDraftChange?.(validQuantity(draft, max))
  }, [draft, max, onDraftChange])
  function commit(raw) {
    const next = validQuantity(raw, max)
    setError(next === null)
    if (next !== null) {
      onCommit(next)
      setDraft(String(next))
    }
  }
  function step(delta) {
    const next = Math.min(max, Math.max(1, (Number(draft) || value) + delta))
    commit(String(next))
  }
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {t('Quantity')} {title}
      </label>
      <div className={styles.controls}>
        <button
          type="button"
          aria-label={t('Fewer {title}', { title })}
          disabled={Number(draft) <= 1}
          onClick={() => step(-1)}
        >
          −
        </button>
        <input
          id={id}
          name="quantity"
          type="number"
          inputMode="numeric"
          min="1"
          max={max}
          step="1"
          value={draft}
          aria-invalid={
            error || (draft !== '' && validQuantity(draft, max) === null)
          }
          aria-describedby={error ? id + '-error' : undefined}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(false)
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit(draft)
            }
          }}
        />
        <button
          type="button"
          aria-label={t('More {title}', { title })}
          disabled={Number(draft) >= max}
          onClick={() => step(1)}
        >
          +
        </button>
      </div>
      {error && (
        <p id={id + '-error'} role="alert">
          {t('Enter a whole quantity from 1 to {max}.', { max })}
        </p>
      )}
    </div>
  )
}
