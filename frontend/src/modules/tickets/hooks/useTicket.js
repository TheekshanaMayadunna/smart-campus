import { useQuery } from '@tanstack/react-query'
import ticketApi from '../api/ticketApi'

export const useTicket = (ticketId) =>
  useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketApi.getTicketById(ticketId),
    enabled: !!ticketId,
  })