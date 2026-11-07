import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import MarketplacePage from './pages/MarketplacePage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductFormPage from './pages/ProductFormPage'
import AuctionsPage from './pages/AuctionsPage'
import AuctionDetailPage from './pages/AuctionDetailPage'
import AuctionFormPage from './pages/AuctionFormPage'
import ServicesPage from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import ServiceFormPage from './pages/ServiceFormPage'
import MyListingsPage from './pages/MyListingsPage'
import OrdersPage from './pages/OrdersPage'
import MyAuctionsPage from './pages/MyAuctionsPage'
import WishlistPage from './pages/WishlistPage'
import ExchangesPage from './pages/ExchangesPage'
import MessagesPage from './pages/MessagesPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import ReportsPage from './pages/ReportsPage'
import ServiceRequestsPage from './pages/ServiceRequestsPage'
import NotFoundPage from './pages/NotFoundPage'

function Shell({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}

const guard = (element, extra) => <ProtectedRoute {...extra}>{element}</ProtectedRoute>

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/new" element={guard(<ProductFormPage />, { verified: true })} />
        <Route path="/products/:id/edit" element={guard(<ProductFormPage />, { verified: true })} />
        <Route path="/auctions" element={<AuctionsPage />} />
        <Route path="/auctions/new" element={guard(<AuctionFormPage />, { verified: true })} />
        <Route path="/auctions/:id" element={<AuctionDetailPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/new" element={guard(<ServiceFormPage />, { verified: true })} />
        <Route path="/services/requests" element={guard(<ServiceRequestsPage />)} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/dashboard" element={guard(<DashboardPage />)} />
        <Route path="/listings" element={guard(<MyListingsPage />)} />
        <Route path="/purchases" element={guard(<OrdersPage mode="purchases" />)} />
        <Route path="/sales" element={guard(<OrdersPage mode="sales" />)} />
        <Route path="/my-auctions" element={guard(<MyAuctionsPage />)} />
        <Route path="/wishlist" element={guard(<WishlistPage />)} />
        <Route path="/exchanges" element={guard(<ExchangesPage />)} />
        <Route path="/messages" element={guard(<MessagesPage />)} />
        <Route path="/messages/:id" element={guard(<MessagesPage />)} />
        <Route path="/notifications" element={guard(<NotificationsPage />)} />
        <Route path="/profile" element={guard(<ProfilePage />)} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/admin" element={guard(<AdminPage />, { admin: true })} />
        <Route path="/reports" element={guard(<ReportsPage />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Shell>
  )
}
