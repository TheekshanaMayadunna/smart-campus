import api from '../../../axios'

const createTicket = async (formData) => {
  const response = await api.post('/tickets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

const getMyTickets = async (params = {}) => {
  const response = await api.get('/tickets/my', { params })
  return response.data
}

const getTicketById = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}`)
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
  getTicketById,
  updateTicket,
  deleteTicket,
}

export { createTicket, getMyTickets, getTicketById, updateTicket, deleteTicket }
export default ticketApi
