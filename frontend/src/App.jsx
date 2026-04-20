import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import MyTicketsPage from './modules/tickets/pages/MyTicketsPage'
import AuthPage from './modules/tickets/pages/AuthPage'
import authApi from './modules/tickets/api/authApi'

const RequireAuth = ({ children }) => {
  const location = useLocation()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => authApi.me(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return <main style={{ padding: '1rem' }}>Checking session...</main>
  }

  if (isError || !data?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/my-tickets"
        element={
          <RequireAuth>
            <MyTicketsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/my-tickets" replace />} />
    </Routes>
  )
}

export default App
