import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <h1 className="text-4xl font-bold text-black mb-4">Shopping Cart</h1>
            <p className="text-gray-600 mb-8 text-lg">Your cart is empty.</p>
            <Link to="/" className="btn-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-black">Shopping Cart</h1>
            <button
              onClick={clearCart}
              className="text-primary-red hover:underline font-medium"
            >
              Clear Cart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="card p-6 flex flex-col sm:flex-row gap-4"
                >
                  <div className="w-full sm:w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-2 border border-gray-200">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link
                      to={`/product/${item.slug}`}
                      className="text-xl font-semibold text-black hover:text-primary-red transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-lg font-bold text-primary-red mt-2">
                      ${item.price}
                    </p>

                    <div className="flex items-center gap-4 mt-4">
                      <label className="text-sm text-gray-600">Quantity:</label>
                      <div className="flex items-center border-2 border-black rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-gray-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 border-x-2 border-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-primary-red hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-black mb-4">Order Summary</h2>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t-2 border-black pt-2 mt-4">
                  <div className="flex justify-between text-xl font-bold text-black">
                    <span>Total</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="btn-primary w-full mb-4 block text-center"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/"
                className="btn-outline w-full block text-center"
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

