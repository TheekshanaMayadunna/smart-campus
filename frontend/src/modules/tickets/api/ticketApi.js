import api from '../../../axios'

const createTicket = async (data) => {
  const response = await api.post('/tickets', data)
  return response.data
}

const getMyTickets = async (params = {}) => {
  const response = await api.get('/tickets/my', { params })
  return response.data
}

const updateTicket = async (ticketId, data) => {
  const response = await api.put(`/tickets/${ticketId}`, data)
  return response.data
}

const deleteTicket = async (ticketId) => {
  await api.delete(`/tickets/${ticketId}`)
}

const ticketApi = {
  createTicket,
  getMyTickets,
  updateTicket,
  deleteTicket,
}

export { createTicket, getMyTickets, updateTicket, deleteTicket }
export default ticketApi
