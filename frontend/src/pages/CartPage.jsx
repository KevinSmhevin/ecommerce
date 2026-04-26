import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const CartItem = ({ item, onUpdate, onRemove }) => (
  <div className="bg-white border border-black/20 rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
    <div className="w-full sm:w-28 h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
      {item.image_url ? (
        <img src={item.image_url} alt={item.title} className="max-w-full max-h-full object-contain" />
      ) : (
        <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">No Image</span>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <Link
        to={`/product/${item.slug}`}
        className="text-black font-black text-sm uppercase tracking-wide leading-snug hover:text-red-600 transition-colors line-clamp-2"
      >
        {item.title}
      </Link>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 bg-red-600 rounded-full" />
        <span className="text-sm font-black text-black">${item.price}</span>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center border-2 border-black rounded-lg overflow-hidden">
          <button
            onClick={() => onUpdate(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-3 py-1.5 text-black font-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="px-4 py-1.5 border-x-2 border-black text-sm font-black text-black">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdate(item.id, item.quantity + 1)}
            disabled={item.stock && item.quantity >= item.stock}
            className="px-3 py-1.5 text-black font-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-gray-400 font-black uppercase tracking-widest hover:text-red-600 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
)

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div
          className="w-full max-w-md bg-white border-2 border-black rounded-2xl p-10 text-center"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          <h1 className="text-2xl font-black text-black uppercase tracking-widest mb-3">Your Cart</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-8">Your cart is empty.</p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-red-700 transition-colors"
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-black uppercase tracking-widest">Your Cart</h1>
          <button
            onClick={clearCart}
            className="text-xs text-gray-400 font-black uppercase tracking-widest hover:text-red-600 transition-colors"
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
            <div
              className="bg-white border-2 border-black rounded-2xl p-6 sticky top-4"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              <h2 className="text-base font-black text-black uppercase tracking-widest mb-5">Order Summary</h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Subtotal</span>
                  <span className="font-black text-black">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">Shipping</span>
                  <span className="text-gray-400 font-bold">At checkout</span>
                </div>
                <div className="pt-3 border-t-2 border-black flex justify-between">
                  <span className="font-black text-black uppercase tracking-wider">Total</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    <span className="font-black text-black text-lg">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl text-center hover:bg-red-700 transition-colors mb-3"
              >
                Checkout
              </Link>
              <Link
                to="/"
                className="block w-full py-3 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl text-center border-2 border-black hover:bg-black hover:text-white transition-colors"
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
