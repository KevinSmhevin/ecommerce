import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/api/account'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

export const useDashboardQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: fetchDashboard,
    enabled,
  })
