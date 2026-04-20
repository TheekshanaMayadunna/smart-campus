import { Navigate, Route, Routes } from 'react-router-dom'
import MyTicketsPage from './modules/tickets/pages/MyTicketsPage'

function App() {
  return (
    <Routes>
      <Route path="/my-tickets" element={<MyTicketsPage />} />
      <Route path="*" element={<Navigate to="/my-tickets" replace />} />
    </Routes>
  )
}

export default App
