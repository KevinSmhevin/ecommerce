import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import NavbarStadium from '@/components/NavbarStadium'
import Home from '@/pages/Home'
import ProductDetail from '@/pages/ProductDetail'
import CategoryPage from '@/pages/CategoryPage'
import CartPage from '@/pages/CartPage'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import CheckOrder from '@/pages/CheckOrder'
import Dashboard from '@/pages/Dashboard'
import TrackOrders from '@/pages/TrackOrders'
import ProfileManagement from '@/pages/ProfileManagement'
import ManageShipping from '@/pages/ManageShipping'
import Checkout from '@/pages/Checkout'
import PaymentSuccess from '@/pages/PaymentSuccess'
import PaymentFailed from '@/pages/PaymentFailed'

const App = () => (
  <CartProvider>
    <Router>
      <div className="min-h-screen">
        <NavbarStadium />
        <main>
          <Routes>
            <Route path="/"                    element={<Home />} />
            <Route path="/product/:slug"        element={<ProductDetail />} />
            <Route path="/category/:slug"       element={<CategoryPage />} />
            <Route path="/cart"                 element={<CartPage />} />
            <Route path="/login"                element={<Login />} />
            <Route path="/register"             element={<Register />} />
            <Route path="/check-order"          element={<CheckOrder />} />
            <Route path="/dashboard"            element={<Dashboard />} />
            <Route path="/track-orders"         element={<TrackOrders />} />
            <Route path="/profile-management"   element={<ProfileManagement />} />
            <Route path="/manage-shipping"      element={<ManageShipping />} />
            <Route path="/checkout"             element={<Checkout />} />
            <Route path="/payment-success"      element={<PaymentSuccess />} />
            <Route path="/payment-failed"       element={<PaymentFailed />} />
          </Routes>
        </main>
      </div>
    </Router>
  </CartProvider>
)

export default App
