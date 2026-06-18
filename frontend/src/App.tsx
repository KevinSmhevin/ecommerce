import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import RingBackground from '@/components/RingBackground'
import NavbarStadium from '@/components/NavbarStadium'
import PageSpinner from '@/components/PageSpinner'
import Home from '@/pages/Home'

// Home is eager-loaded (it's the landing page); every other route is split
// out so the initial bundle doesn't carry Checkout / Dashboard / auth flows
// for first-time visitors.
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const CheckOrder = lazy(() => import('@/pages/CheckOrder'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const TrackOrders = lazy(() => import('@/pages/TrackOrders'))
const ProfileManagement = lazy(() => import('@/pages/ProfileManagement'))
const ManageShipping = lazy(() => import('@/pages/ManageShipping'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'))
const PaymentFailed = lazy(() => import('@/pages/PaymentFailed'))

const App = () => (
  <CartProvider>
    <Router>
      <div className="min-h-screen">
        <RingBackground />
        <NavbarStadium />
        <main>
          <Suspense fallback={<PageSpinner />}>
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
          </Suspense>
        </main>
      </div>
    </Router>
  </CartProvider>
)

export default App
