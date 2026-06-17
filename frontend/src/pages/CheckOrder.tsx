import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCheckOrderMutation } from '@/hooks/useCheckOrderMutation'
import type { Order } from '@/types/api'
import FormField from '@/components/FormField'
import Alert from '@/components/Alert'
import OrderCard from '@/components/OrderCard'

const isAxiosErrorShape = (
  err: unknown,
): err is { response?: { data?: { error?: string } } } =>
  err !== null && typeof err === 'object' && 'response' in (err as Record<string, unknown>)

const CheckOrder = () => {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const checkOrderMutation = useCheckOrderMutation()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setOrder(null)
    try {
      const result = await checkOrderMutation.mutateAsync({ order_number: orderNumber, email })
      if (result.success && result.order) {
        setOrder(result.order)
      } else {
        setError(result.error ?? 'Unable to find order number')
      }
    } catch (err) {
      if (isAxiosErrorShape(err)) {
        setError(err.response?.data?.error ?? 'Unable to find order number')
      } else {
        setError('Unable to find order number')
      }
    }
  }

  const loading = checkOrderMutation.isPending

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Check Order</h1>
          <p className="text-white/50 text-sm font-bold uppercase tracking-wider mt-1">
            Enter your order number and email
          </p>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="order_number"
                label="Order Number"
                type="text"
                required
                placeholder="e.g. 1042"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
              <FormField
                id="email"
                label="Order Email"
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_16px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {order && <div className="mt-6"><OrderCard order={order} /></div>}
      </div>
    </div>
  )
}

export default CheckOrder
