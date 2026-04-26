import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import InstagramLink from './InstagramLink'

const NavbarArcade = () => {
  const { getCartItemCount } = useCart()
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const cartCount = getCartItemCount()

  const handleLogout = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try { await logout() } catch (_) {}
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }

  const close = () => { setMobileMenuOpen(false); setUserMenuOpen(false) }

  return (
    <nav
      className="bg-zinc-950 border-b border-red-600/40"
      style={{ boxShadow: '0 2px 24px rgba(220,38,38,0.12)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">

          {/* Instagram */}
          <div className="z-10 text-zinc-500 hover:text-red-500 transition-colors">
            <InstagramLink />
          </div>

          {/* Logo */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
            onClick={close}
          >
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none"
              style={{ filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.8))' }}>
              <circle cx="20" cy="20" r="20" fill="#DC2626" />
              <path d="M0 20h40" stroke="#0a0a0a" strokeWidth="3" />
              <path d="M20 20a20 20 0 0 0 20 0H0a20 20 0 0 0 20 0z" fill="#18181b" />
              <circle cx="20" cy="20" r="6" fill="#18181b" stroke="#DC2626" strokeWidth="2" />
              <circle cx="20" cy="20" r="3" fill="#DC2626" />
            </svg>
            <span
              className="text-xl font-black tracking-widest uppercase text-white"
              style={{ textShadow: '0 0 14px rgba(220,38,38,0.7), 0 0 30px rgba(220,38,38,0.3)' }}
            >
              POKEBIN
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1 z-10">
            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 px-4 py-2 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              {cartCount > 0 && (
                <span
                  className="bg-red-600 text-white text-xs font-black px-1.5 rounded-sm min-w-[20px] text-center"
                  style={{ boxShadow: '0 0 8px rgba(220,38,38,0.8)' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/check-order"
              className="px-4 py-2 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Orders
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                  className="flex items-center gap-1 px-4 py-2 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors focus:outline-none"
                >
                  {user.username}
                  <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute top-full right-0 mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-lg z-50 overflow-hidden"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 16px rgba(220,38,38,0.1)' }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="px-4 py-3 border-b border-zinc-700/60">
                      <p className="text-sm font-bold text-white truncate">{user.username}</p>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-3 text-zinc-300 text-sm font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-red-500 transition-colors border-b border-zinc-800"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-zinc-300 text-sm font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-red-500 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-red-600 text-white text-sm font-black uppercase tracking-widest hover:bg-red-500 transition-colors rounded"
                  style={{ boxShadow: '0 0 14px rgba(220,38,38,0.5)' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-4 z-10">
            <Link to="/cart" className="relative text-zinc-300 hover:text-red-500 transition-colors" onClick={close}>
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black rounded-sm w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-zinc-300 hover:text-red-500 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-800 py-3">
            <Link to="/check-order" onClick={close} className="block px-4 py-3 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Orders</Link>
            {user ? (
              <>
                <div className="px-4 py-3 border-t border-zinc-800 mt-1">
                  <p className="text-sm font-bold text-white">{user.username}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <Link to="/dashboard" onClick={close} className="block px-4 py-3 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Dashboard</Link>
                <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-3 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close} className="block px-4 py-3 text-zinc-300 text-sm font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Login</Link>
                <div className="px-4 pt-2 pb-3">
                  <Link to="/register" onClick={close} className="block w-full py-3 bg-red-600 text-white text-sm font-black uppercase tracking-widest text-center rounded hover:bg-red-500 transition-colors">Sign Up</Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default NavbarArcade
