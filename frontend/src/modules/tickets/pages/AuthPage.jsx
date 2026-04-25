import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import authApi from '../api/authApi'

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const fromPath = useMemo(() => location.state?.from?.pathname || '/my-tickets', [location.state])
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  const handleSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['authUser'] })
    navigate(fromPath, { replace: true })
  }

  const loginMutation = useMutation({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: handleSuccess,
    onError: (err) => setError(err?.response?.data?.message ?? 'Login failed'),
  })

  const submitLogin = (event) => {
    event.preventDefault()
    setError('')
    loginMutation.mutate(loginForm)
  }

  const busy = loginMutation.isPending

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Smart Campus Login</h1>
            <p style={styles.subtitle}>Real database-backed auth for your ticketing module.</p>
          </div>
        </div>

        <form onSubmit={submitLogin} style={styles.form}>
          <label style={styles.field}>
            Username
            <input
              type="text"
              value={loginForm.username}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="admin"
            />
          </label>
          <label style={styles.field}>
            Password
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="••••••••"
            />
          </label>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={busy} style={styles.button}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.sampleBox}>
          <strong>Seeded demo accounts</strong>
          <p>admin / Admin@123</p>
          <p>technician / Tech@123</p>
          <p>student / Student@123</p>
        </div>
      </section>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '1rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 55%, #e0f2fe 100%)',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    border: '1px solid #bfdbfe',
    boxShadow: '0 18px 45px rgba(37, 99, 235, 0.12)',
    padding: '1.4rem',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    color: '#0f172a',
  },
  subtitle: {
    margin: '0.35rem 0 0',
    color: '#475569',
    fontSize: '0.92rem',
  },
  form: {
    display: 'grid',
    gap: '0.85rem',
  },
  field: {
    display: 'grid',
    gap: '0.35rem',
    color: '#0f172a',
    fontSize: '0.95rem',
  },
  error: {
    margin: 0,
    color: '#b91c1c',
    fontSize: '0.9rem',
  },
  button: {
    border: 'none',
    borderRadius: 10,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontWeight: 700,
  },
  sampleBox: {
    marginTop: '1rem',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1rem',
    color: '#334155',
    fontSize: '0.9rem',
  },
}

export default AuthPage
