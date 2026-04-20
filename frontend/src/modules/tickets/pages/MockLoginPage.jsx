import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROLES, loginMockUser } from '../auth/mockAuth'

const roleOptions = [ROLES.STUDENT, ROLES.TECHNICIAN, ROLES.ADMIN]

const MockLoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const fromPath = useMemo(() => {
    return location.state?.from?.pathname || '/my-tickets'
  }, [location.state])

  const [name, setName] = useState('')
  const [role, setRole] = useState(ROLES.STUDENT)
  const [error, setError] = useState('')

  const onSubmit = (event) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setError('')
    loginMockUser({ name, role })
    navigate(fromPath, { replace: true })
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Mock Login</h1>
        <p style={styles.subtitle}>
          Temporary login for the ticketing module. Remove this after real user management is integrated.
        </p>

        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.field}>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
            />
          </label>

          <label style={styles.field}>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {roleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>
            Continue
          </button>
        </form>
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
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e0f2fe 100%)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #dbeafe',
    boxShadow: '0 10px 35px rgba(2, 132, 199, 0.1)',
    padding: '1.25rem',
  },
  title: {
    margin: 0,
    color: '#0f172a',
  },
  subtitle: {
    marginTop: '0.4rem',
    color: '#334155',
    fontSize: '0.9rem',
  },
  form: {
    display: 'grid',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  field: {
    display: 'grid',
    gap: '0.35rem',
    color: '#0f172a',
  },
  error: {
    margin: 0,
    color: '#b91c1c',
    fontSize: '0.9rem',
  },
  button: {
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '0.65rem 0.9rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
}

export default MockLoginPage
