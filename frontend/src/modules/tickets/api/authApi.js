import api from '../../../axios'

const login = async (payload) => {
  const response = await api.post('/auth/login', payload)
  return response.data
}

const me = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

const logout = async () => {
  await api.post('/auth/logout')
}

const authApi = {
  login,
  me,
  logout,
}

export { login, me, logout }
export default authApi
