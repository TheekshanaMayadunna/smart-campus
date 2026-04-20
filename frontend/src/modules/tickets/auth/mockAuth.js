const MOCK_AUTH_STORAGE_KEY = 'ticketingMockUser'

const ROLES = {
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
  STUDENT: 'STUDENT',
}

const getMockUser = () => {
  const raw = localStorage.getItem(MOCK_AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.role || !parsed?.name) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const loginMockUser = ({ name, role }) => {
  const user = {
    name: name.trim(),
    role,
  }

  localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user))
  localStorage.setItem('authToken', `mock-token-${role.toLowerCase()}`)
  return user
}

const logoutMockUser = () => {
  localStorage.removeItem(MOCK_AUTH_STORAGE_KEY)
  localStorage.removeItem('authToken')
}

const hasAnyRole = (user, roles) => {
  if (!user) {
    return false
  }
  return roles.includes(user.role)
}

export { ROLES, getMockUser, loginMockUser, logoutMockUser, hasAnyRole }
