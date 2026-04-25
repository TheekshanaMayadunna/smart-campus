import { useQuery } from '@tanstack/react-query'
import ticketApi from '../api/ticketApi'

export const useMyTickets = (filters) =>
  useQuery({
    queryKey: ['myTickets', filters],
    queryFn: () => ticketApi.getMyTickets(filters),
  })
