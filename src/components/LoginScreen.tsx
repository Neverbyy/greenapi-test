import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getStateInstance } from '../api/greenApi'
import type { Credentials } from '../api/types'
import { DEFAULT_API_URL, useAuthStore } from '../store/authStore'
import styles from './LoginScreen.module.css'

function describeState(stateInstance: string): string {
  switch (stateInstance) {
    case 'notAuthorized':
      return 'Инстанс не авторизован: войдите в аккаунт MAX в личном кабинете GREEN-API'
    case 'starting':
      return 'Инстанс запускается, попробуйте через минуту'
    case 'blocked':
      return 'Аккаунт MAX заблокирован'
    case 'suspended':
      return 'Отправка сообщений временно ограничена'
    case 'pendingPassword':
      return 'Инстанс ожидает двухфакторную авторизацию'
    default:
      return `Инстанс недоступен (состояние: ${stateInstance})`
  }
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: 'text' | 'password'
}

function Field({ label, value, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </label>
  )
}

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)

  const check = useMutation({
    mutationFn: async (credentials: Credentials) => {
      const { stateInstance } = await getStateInstance(credentials)
      if (stateInstance !== 'authorized') throw new Error(describeState(stateInstance))
      return credentials
    },
    onSuccess: (credentials) => login(credentials),
  })

  const canSubmit = idInstance.trim() !== '' && apiTokenInstance.trim() !== '' && !check.isPending

  return (
    <div className={styles.screen}>
      <form
        className={styles.card}
        onSubmit={(event) => {
          event.preventDefault()
          check.mutate({
            idInstance: idInstance.trim(),
            apiTokenInstance: apiTokenInstance.trim(),
            apiUrl: apiUrl.trim() || DEFAULT_API_URL,
          })
        }}
      >
        <div className={styles.logo}>MAX</div>
        <h1 className={styles.title}>Вход через GREEN-API</h1>
        <p className={styles.subtitle}>
          Введите данные инстанса MAX из личного кабинета GREEN-API
        </p>

        <Field
          label="idInstance"
          value={idInstance}
          onChange={setIdInstance}
          placeholder="1101000001"
        />
        <Field
          label="apiTokenInstance"
          type="password"
          value={apiTokenInstance}
          onChange={setApiTokenInstance}
          placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd451234"
        />
        <Field
          label="apiUrl"
          value={apiUrl}
          onChange={setApiUrl}
          placeholder={DEFAULT_API_URL}
        />

        {check.isError && <p className={styles.error}>{check.error.message}</p>}

        <button className={styles.submit} type="submit" disabled={!canSubmit}>
          {check.isPending ? 'Проверяем…' : 'Войти'}
        </button>

        <p className={styles.hint}>
          Данные инстанса — на странице{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            console.green-api.com
          </a>
        </p>
      </form>
    </div>
  )
}
