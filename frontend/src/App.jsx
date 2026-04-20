import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MyTicketsPage from './modules/tickets/pages/MyTicketsPage'
import MockLoginPage from './modules/tickets/pages/MockLoginPage'
import { getMockUser, hasAnyRole, ROLES } from './modules/tickets/auth/mockAuth'

const RequireMockAuth = ({ children }) => {
  const location = useLocation()
  const user = getMockUser()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

const RequireRole = ({ roles, children }) => {
  const user = getMockUser()
  if (!hasAnyRole(user, roles)) {
    return <Navigate to="/my-tickets" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<MockLoginPage />} />
      <Route
        path="/my-tickets"
        element={
          <RequireMockAuth>
            <RequireRole roles={[ROLES.STUDENT, ROLES.TECHNICIAN, ROLES.ADMIN]}>
              <MyTicketsPage />
            </RequireRole>
          </RequireMockAuth>
        }
      />
      <Route path="*" element={<Navigate to="/my-tickets" replace />} />
    </Routes>
  )
}

export default App
