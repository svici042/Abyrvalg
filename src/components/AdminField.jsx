import { useId } from 'react'
import { useLanguage } from '../hooks/useLanguage'
export default function AdminField({
  label,
  name,
  value,
  onChange,
  multiline = false,
  ...props
}) {
  const id = useId()
  const { t } = useLanguage()
  // Share label association and change handling between single-line and multiline fields.
  const Control = multiline ? 'textarea' : 'input'
  return (
    <label htmlFor={id}>
      {t(label)}
      <Control
        {...props}
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
