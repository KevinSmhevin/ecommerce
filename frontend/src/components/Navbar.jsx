import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const Navbar = () => {
  const { categories } = useApp()
  const { getCartItemCount } = useCart()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Ensure categories is always an array
  const categoriesList = Array.isArray(categories) ? categories : []
  const cartCount = getCartItemCount()

  const handleLogout = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await logout()
      setUserMenuOpen(false)
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
      // Still close menus even if logout fails
      setUserMenuOpen(false)
      setMobileMenuOpen(false)
    }
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
    setUserMenuOpen(false)
  }

  return (
    <nav className="bg-white border-b-2 border-black shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
            <Logo size="small" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setDropdownOpen(!dropdownOpen)
                  } else if (e.key === 'Escape') {
                    setDropdownOpen(false)
                  }
                }}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                className="flex items-center space-x-1 text-black font-medium hover:text-primary-red transition-colors focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 rounded"
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              >
                <span>Categories</span>
                <svg
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-48 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden"
                  role="menu"
                  aria-label="Categories menu"
                >
                  <Link
                    to="/"
                    role="menuitem"
                    tabIndex={0}
                    className="block px-4 py-3 text-black hover:bg-gray-100 hover:text-primary-red transition-colors border-b border-gray-200 focus:outline-none focus:bg-gray-100 focus:text-primary-red"
                    onClick={() => setDropdownOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setDropdownOpen(false)
                      } else if (e.key === 'Escape') {
                        setDropdownOpen(false)
                      }
                    }}
                  >
                    All
                  </Link>
                  {categoriesList.map((category, index) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      role="menuitem"
                      tabIndex={0}
                      className={`block px-4 py-3 text-black hover:bg-gray-100 hover:text-primary-red transition-colors focus:outline-none focus:bg-gray-100 focus:text-primary-red ${
                        index !== categoriesList.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                      onClick={() => setDropdownOpen(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setDropdownOpen(false)
                        } else if (e.key === 'Escape') {
                          setDropdownOpen(false)
                        }
                      }}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/cart"
              className="relative text-black font-medium hover:text-primary-red transition-colors"
            >
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/check-order"
              className="text-black font-medium hover:text-primary-red transition-colors"
            >
              Check Order
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-black font-medium hover:text-primary-red transition-colors"
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setUserMenuOpen(!userMenuOpen)
                      } else if (e.key === 'Escape') {
                        setUserMenuOpen(false)
                      }
                    }}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    className="flex items-center space-x-1 text-black font-medium hover:text-primary-red transition-colors focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 rounded"
                    onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                  >
                    <span>{user.username}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div 
                      className="absolute top-full right-0 mt-2 w-48 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden"
                      role="menu"
                      aria-label="User menu"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-black">{user.username}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleLogout(e)
                          } else if (e.key === 'Escape') {
                            setUserMenuOpen(false)
                          }
                        }}
                        className="w-full text-left px-4 py-3 text-black hover:bg-gray-100 hover:text-primary-red transition-colors focus:outline-none focus:bg-gray-100 focus:text-primary-red"
                        aria-label="Logout"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-black font-medium hover:text-primary-red transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-red text-white font-medium rounded hover:bg-red-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Cart and Menu Button */}
          <div className="flex lg:hidden items-center space-x-4">
            <Link
              to="/cart"
              className="relative text-black font-medium hover:text-primary-red transition-colors"
              onClick={closeMobileMenu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-black hover:text-primary-red transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-gray-200 py-4">
            <div className="space-y-1">
              {/* Categories */}
              <div>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDropdownOpen(!dropdownOpen)
                    } else if (e.key === 'Escape') {
                      setDropdownOpen(false)
                    }
                  }}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className="w-full flex items-center justify-between px-4 py-3 text-black font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100 focus:ring-2 focus:ring-primary-red focus:ring-inset"
                >
                  <span>Categories</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="bg-gray-50" role="menu" aria-label="Categories menu">
                    <Link
                      to="/"
                      role="menuitem"
                      tabIndex={0}
                      className="block px-8 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-red transition-colors focus:outline-none focus:bg-gray-100 focus:text-primary-red"
                      onClick={closeMobileMenu}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          closeMobileMenu()
                        } else if (e.key === 'Escape') {
                          setDropdownOpen(false)
                        }
                      }}
                    >
                      All
                    </Link>
                    {categoriesList.map((category) => (
                      <Link
                        key={category.id}
                        to={`/category/${category.slug}`}
                        role="menuitem"
                        tabIndex={0}
                        className="block px-8 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-red transition-colors focus:outline-none focus:bg-gray-100 focus:text-primary-red"
                        onClick={closeMobileMenu}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            closeMobileMenu()
                          } else if (e.key === 'Escape') {
                            setDropdownOpen(false)
                          }
                        }}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Check Order */}
              <Link
                to="/check-order"
                className="block px-4 py-3 text-black font-medium hover:bg-gray-100 hover:text-primary-red transition-colors"
                onClick={closeMobileMenu}
              >
                Check Order
              </Link>

              {/* Dashboard */}
              {user && (
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 text-black font-medium hover:bg-gray-100 hover:text-primary-red transition-colors"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
              )}

              {/* User Section */}
              {user ? (
                <>
                  <div className="px-4 py-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-black">{user.username}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleLogout(e)
                      } else if (e.key === 'Escape') {
                        setMobileMenuOpen(false)
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-black font-medium hover:bg-gray-100 hover:text-primary-red transition-colors focus:outline-none focus:bg-gray-100 focus:text-primary-red focus:ring-2 focus:ring-primary-red focus:ring-inset"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-black font-medium hover:bg-gray-100 hover:text-primary-red transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 bg-primary-red text-white font-medium text-center rounded hover:bg-red-700 transition-colors mx-4"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

