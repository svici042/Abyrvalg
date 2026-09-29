import { useEffect, useRef } from 'react'
import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { customerErrors } from '../utils/orders'
import styles from './Orders.module.css'

const fields = [
  { name: 'name', label: 'Name', type: 'text', maxLength: 100 },
  { name: 'email', label: 'Email', type: 'email', maxLength: 254 },
  { name: 'address', label: 'Delivery address', type: 'text', maxLength: 500 },
]

export default function CustomerForm({ customer, setCustomer, onReview }) {
  const { t } = useLanguage()
  const focusRef = useRef(null)
  useEffect(() => {
    focusRef.current?.focus()
  }, [])
  const [errors, setErrors] = useState({})

  function submit(event) {
    event.preventDefault()
    const nextErrors = customerErrors(customer)
    setErrors(nextErrors)
    // Custom validation provides consistent, translated messages in both languages.
    if (Object.keys(nextErrors).length === 0) onReview()
    else event.currentTarget.elements[Object.keys(nextErrors)[0]].focus()
  }

  return (
    <form
      ref={focusRef}
      tabIndex={-1}
      className={styles.panel}
      noValidate
      onSubmit={submit}
    >
      <h2>{t('Customer')}</h2>
      <p>{t('Use fictional customer details only.')}</p>
      {fields.map((field) => (
        <div className={styles.field} key={field.name}>
          <label htmlFor={field.name}>{t(field.label)}</label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            required
            autoComplete="off"
            maxLength={field.maxLength}
            value={customer[field.name]}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={
              errors[field.name] ? `${field.name}-error` : undefined
            }
            onChange={(event) =>
              setCustomer((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
          />
          {errors[field.name] && (
            <span id={`${field.name}-error`} className={styles.errorText}>
              {t(errors[field.name])}
            </span>
          )}
        </div>
      ))}
      <button className={styles.primary} type="submit">
        {t('Review order')}
      </button>
    </form>
  )
}
