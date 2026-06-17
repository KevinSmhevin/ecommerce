import { Link } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import type { CartItem as CartItemType } from '@/types/cart'

interface CartItemProps {
  item: CartItemType
  onUpdate: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
}

const CartItem = ({ item, onUpdate, onRemove }: CartItemProps) => (
  <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
    <div className="w-full sm:w-28 h-28 bg-black/30 border border-white/5 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} loading="lazy" decoding="async" className="max-w-full max-h-full object-contain" />
      ) : (
        <span className="text-white/30 text-xs font-bold uppercase tracking-widest">No Image</span>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <Link
        to={`/product/${item.slug}`}
        className="text-white font-black text-sm uppercase tracking-wide leading-snug hover:text-red-600 transition-colors line-clamp-2"
      >
        {item.title}
      </Link>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.7)]" />
        <span className="text-sm font-black text-white">${item.price}</span>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => onUpdate(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-3 py-1.5 glass glass-hover text-white font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="px-4 py-1.5 border-x border-white/10 text-sm font-black text-white">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            disabled={Boolean(item.stock) && item.quantity >= item.stock}
            className="px-3 py-1.5 glass glass-hover text-white font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-white/50 font-black uppercase tracking-widest hover:text-red-600 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
)

const RemovedNotice = ({ count, onDismiss }: { count: number; onDismiss: () => void }) => (
  <div
    role="status"
    data-testid="cart-removed-notice"
    className="bg-amber-500/10 border border-amber-400/30 text-amber-300 backdrop-blur-md rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-4"
  >
    <p className="text-sm font-bold text-amber-300">
      {count === 1
        ? '1 item was removed because it is no longer available.'
        : `${count} items were removed because they are no longer available.`}
    </p>
    <button
      type="button"
      onClick={onDismiss}
      className="text-xs text-amber-300 font-black uppercase tracking-widest hover:text-amber-200 transition-colors"
    >
      Dismiss
    </button>
  </div>
)

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart,
    removedItems,
    dismissRemovedNotice,
  } = useCart()
  const removedCount = removedItems.length

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md glass rounded-2xl p-10 text-center">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Your Cart</h1>
          {removedCount > 0 ? (
            <RemovedNotice count={removedCount} onDismiss={dismissRemovedNotice} />
          ) : null}
          <p className="text-white/50 text-sm font-bold uppercase tracking-wider mb-8">Your cart is empty.</p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_16px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {removedCount > 0 ? (
          <RemovedNotice count={removedCount} onDismiss={dismissRemovedNotice} />
        ) : null}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Your Cart</h1>
          <button
            onClick={clearCart}
            className="text-xs text-white/50 font-black uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdate={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="glass-red rounded-2xl p-6 sticky top-4">
              <h2 className="text-base font-black text-white uppercase tracking-widest mb-5">Order Summary</h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50 font-bold uppercase tracking-wider">Subtotal</span>
                  <span className="font-black text-white">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50 font-bold uppercase tracking-wider">Shipping</span>
                  <span className="text-white/50 font-bold">At checkout</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between">
                  <span className="font-black text-white uppercase tracking-wider">Total</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.7)]" />
                    <span className="font-black text-white text-lg">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl text-center shadow-[0_0_16px_rgba(220,38,38,0.5)] hover:bg-red-700 transition-colors mb-3"
              >
                Checkout
              </Link>
              <Link
                to="/"
                className="block w-full py-3 glass glass-hover text-white font-black uppercase tracking-widest text-sm rounded-xl text-center transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
