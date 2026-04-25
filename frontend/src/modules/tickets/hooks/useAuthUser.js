import { useQuery } from '@tanstack/react-query'
import authApi from '../api/authApi'

export const useAuthUser = () =>
  useQuery({
    queryKey: ['authUser'],
    queryFn: () => authApi.me(),
    retry: false,
    refetchOnWindowFocus: false,
  })
