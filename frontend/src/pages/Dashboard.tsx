import { useEffect } from 'react'
import type { ComponentType, SVGProps } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, User, MapPin, Info } from 'lucide-react'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { useDashboardQuery } from '@/hooks/useDashboardQuery'
import PageSpinner from '@/components/PageSpinner'

interface DashboardCardProps {
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  subtitle: string
  meta?: string | null
}

const DashboardCard = ({ to, icon: Icon, title, subtitle, meta }: DashboardCardProps) => (
  <Link
    to={to}
    className="group bg-white border border-black/20 rounded-2xl p-6 hover:border-black hover:shadow-lg transition-all duration-200 flex flex-col"
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-black font-black text-base uppercase tracking-widest">{title}</h2>
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
    </div>
    <p className="text-gray-500 text-sm font-bold mb-4 flex-1">{subtitle}</p>
    {meta && (
      <div className="flex items-center gap-2 mt-auto">
        <div className="w-2 h-2 bg-red-600 rounded-full" />
        <span className="text-xs font-black uppercase tracking-widest text-black">{meta}</span>
      </div>
    )}
  </Link>
)

const Dashboard = () => {
  const { data: user, isPending: authLoading } = useAuthQuery()
  const dashboardQuery = useDashboardQuery(Boolean(user))
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  if (authLoading || (user && dashboardQuery.isPending)) return <PageSpinner />
  if (!user) return null

  const ordersCount = dashboardQuery.data?.orders_count
  const ordersMeta =
    typeof ordersCount === 'number'
      ? `${ordersCount} ${ordersCount === 1 ? 'order' : 'orders'}`
      : null

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-black uppercase tracking-widest">Dashboard</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mt-1">
            Welcome back, {user.username}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr">
          <DashboardCard
            to="/track-orders"
            icon={Package}
            title="Track Orders"
            subtitle="View and track your order history"
            meta={ordersMeta}
          />
          <DashboardCard
            to="/profile-management"
            icon={User}
            title="Profile"
            subtitle="Update your account information"
          />
          <DashboardCard
            to="/manage-shipping"
            icon={MapPin}
            title="Shipping"
            subtitle="Manage your shipping address"
          />

          {/* Account info static card */}
          <div className="bg-white border border-black/20 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-black font-black text-base uppercase tracking-widest">Account</h2>
              <Info className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center py-2 border-b border-black/10">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Username</span>
                <span className="text-sm font-bold text-black">{user.username}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Email</span>
                <span className="text-sm font-bold text-black">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
