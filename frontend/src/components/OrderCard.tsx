import type { Order } from '@/types/api'

interface OrderCardProps {
  order: Order
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const OrderCard = ({ order }: OrderCardProps) => (
  <div className="glass rounded-2xl overflow-hidden">

    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      <div>
        <h3 className="text-white font-black text-lg">Order #{order.id}</h3>
        <p className="text-white/50 text-xs font-bold uppercase tracking-wider mt-0.5">
          {formatDate(order.date_ordered)}
        </p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
        order.shipped ? 'bg-white/15 text-white border border-white/20' : 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
      }`}>
        {order.shipped ? 'Shipped' : 'Processing'}
      </span>
    </div>

    {/* Customer + Shipping */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-4 border-b border-white/10">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-2">Customer</p>
        <p className="text-sm font-bold text-white">{order.full_name}</p>
        <p className="text-sm text-white/60">{order.email}</p>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-2">Shipping Address</p>
        <p className="text-sm text-white whitespace-pre-line">{order.shipping_address}</p>
      </div>
    </div>

    {/* Items */}
    <div className="px-6 py-4 border-b border-white/10">
      <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-3">Items</p>
      <div className="space-y-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm font-bold text-white">{item.product_name}</p>
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">${item.total}</p>
              <p className="text-xs text-white/50">${item.price} each</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Footer */}
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black uppercase tracking-widest text-white/50">Total</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full" />
          <span className="text-lg font-black text-white">${order.amount_paid}</span>
        </div>
      </div>
      {(order.tracking_number || order.courier || order.date_shipped) && (
        <div className="space-y-1.5 pt-3 border-t border-white/10">
          {order.date_shipped && (
            <div className="flex justify-between text-xs">
              <span className="text-white/50 font-black uppercase tracking-wider">Shipped</span>
              <span className="text-white font-bold">{formatDate(order.date_shipped)}</span>
            </div>
          )}
          {order.tracking_number && (
            <div className="flex justify-between text-xs">
              <span className="text-white/50 font-black uppercase tracking-wider">Tracking</span>
              <span className="text-white font-bold">{order.tracking_number}</span>
            </div>
          )}
          {order.courier && (
            <div className="flex justify-between text-xs">
              <span className="text-white/50 font-black uppercase tracking-wider">Courier</span>
              <span className="text-white font-bold">{order.courier}</span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)

export default OrderCard
