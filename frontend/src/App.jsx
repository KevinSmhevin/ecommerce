import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import CategoryPage from './pages/CategoryPage'
import CartPage from './pages/CartPage'
import Login from './pages/Login'
import Register from './pages/Register'
import CheckOrder from './pages/CheckOrder'
import Dashboard from './pages/Dashboard'
import TrackOrders from './pages/TrackOrders'
import ProfileManagement from './pages/ProfileManagement'
import ManageShipping from './pages/ManageShipping'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailed from './pages/PaymentFailed'

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="bg-gray-50">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/check-order" element={<CheckOrder />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/track-orders" element={<TrackOrders />} />
                  <Route path="/profile-management" element={<ProfileManagement />} />
                  <Route path="/manage-shipping" element={<ManageShipping />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-failed" element={<PaymentFailed />} />
                </Routes>
              </main>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </AppProvider>
  )
}

export default App

