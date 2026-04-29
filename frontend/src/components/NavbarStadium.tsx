import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuthQuery } from '@/hooks/useAuthQuery'
import { useLogoutMutation } from '@/hooks/useLogoutMutation'
import InstagramLink from './InstagramLink'

const NavbarStadium = () => {
  const { getCartItemCount } = useCart()
  const { data: user } = useAuthQuery()
  const logoutMutation = useLogoutMutation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const cartCount = getCartItemCount()

  const handleLogout = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // ignore logout errors — we still close menus and trust onSettled to clear cache
    }
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }

  const close = () => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  return (
    <>
      <nav className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">

            {/* Instagram */}
            <div className="z-10 text-black hover:text-red-600 transition-colors">
              <InstagramLink />
            </div>

            {/* Logo */}
            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5"
              onClick={close}
            >
              <div className="w-9 h-9 rounded-full border-4 border-black overflow-hidden relative bg-red-600 flex-shrink-0">
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-1 bg-black" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-black" />
                </div>
              </div>
              <span className="text-2xl font-black text-black tracking-tighter uppercase">
                POKEBIN
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-0 z-10">
              <Link
                to="/cart"
                className="relative flex items-center gap-2 px-5 py-5 text-black text-sm font-black uppercase tracking-wider border-l-2 border-black hover:bg-black hover:text-white transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
                {cartCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-black px-1.5 py-0.5 min-w-[20px] text-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/check-order"
                className="px-5 py-5 text-black text-sm font-black uppercase tracking-wider border-l-2 border-black hover:bg-black hover:text-white transition-colors"
              >
                Orders
              </Link>

              {user ? (
                <div className="relative border-l-2 border-black">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                    className="flex items-center gap-1.5 px-5 py-5 text-black text-sm font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors focus:outline-none"
                  >
                    {user.username}
                    <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute top-full right-0 w-52 bg-white border-4 border-black z-50 overflow-hidden"
                      style={{ boxShadow: '4px 4px 0 #000' }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="px-4 py-3 bg-black text-white">
                        <p className="text-sm font-black truncate">{user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-black text-sm font-black uppercase tracking-wider border-b-2 border-black hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-black text-sm font-black uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors"
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
                    className="px-5 py-5 text-black text-sm font-black uppercase tracking-wider border-l-2 border-black hover:bg-black hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-5 bg-red-600 text-white text-sm font-black uppercase tracking-wider border-l-2 border-black hover:bg-red-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile */}
            <div className="flex lg:hidden items-center gap-3 z-10">
              <Link to="/cart" className="relative text-black hover:text-red-600 transition-colors" onClick={close}>
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-black hover:text-red-600 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-4 border-black">
            <Link to="/check-order" onClick={close} className="block px-6 py-4 text-black text-sm font-black uppercase tracking-wider border-b-2 border-black hover:bg-red-600 hover:text-white transition-colors">
              Orders
            </Link>
            {user ? (
              <>
                <div className="px-6 py-4 bg-black text-white border-b-2 border-black">
                  <p className="text-sm font-black">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <Link to="/dashboard" onClick={close} className="block px-6 py-4 text-black text-sm font-black uppercase tracking-wider border-b-2 border-black hover:bg-black hover:text-white transition-colors">Dashboard</Link>
                <button type="button" onClick={handleLogout} className="w-full text-left px-6 py-4 text-black text-sm font-black uppercase tracking-wider border-b-2 border-black hover:bg-red-600 hover:text-white transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close} className="block px-6 py-4 text-black text-sm font-black uppercase tracking-wider border-b-2 border-black hover:bg-black hover:text-white transition-colors">Login</Link>
                <Link to="/register" onClick={close} className="block px-6 py-4 bg-red-600 text-white text-sm font-black uppercase tracking-wider hover:bg-red-700 transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </nav>
      {/* Red accent stripe */}
      <div className="h-1.5 bg-red-600" />
    </>
  )
}

export default NavbarStadium
