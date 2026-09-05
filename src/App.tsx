import { BrowserRouter, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"
import { BrowsePage } from "./components/browse/BrowsePage"
import { MotorcycleDetailPage } from "./components/browse/MotorcycleDetailPage"
import { HomePage } from "./components/home/HomePage"
import { AdminRoute } from "./components/admin/AdminRoute"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { SiteLayout } from "./components/layout/SiteLayout"
import { AuthProvider } from "./context/AuthContext"
import { LoginPage } from "./pages/LoginPage"
import { ProfilePage } from "./pages/ProfilePage"
import { SavedPage } from "./pages/SavedPage"
import { SellPage } from "./pages/SellPage"
import { SignupPage } from "./pages/SignupPage"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { AdminSellerDetailPage } from "./pages/admin/AdminSellerDetailPage"
import { AdminSellersPage } from "./pages/admin/AdminSellersPage"
import { SellerDashboardPage } from "./pages/seller/SellerDashboardPage"
import { SellerListingNewPage } from "./pages/seller/SellerListingNewPage"
import { SellerListingEditPage } from "./pages/seller/SellerListingEditPage"
import { SellerListingPreviewPage } from "./pages/seller/SellerListingPreviewPage"
import { SellerListingsPage } from "./pages/seller/SellerListingsPage"
import { SellerListingViewPage } from "./pages/seller/SellerListingViewPage"
import { SellerMessagesPage } from "./pages/seller/SellerMessagesPage"
import { MessagesPage } from "./pages/MessagesPage"
import { SellerProfilePage } from "./pages/seller/SellerProfilePage"
import { SellerRegisterPage } from "./pages/seller/SellerRegisterPage"
import { ApprovedSellerRoute } from "./components/seller/ApprovedSellerRoute"

function SellerListingGate({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ApprovedSellerRoute>{children}</ApprovedSellerRoute>
    </ProtectedRoute>
  )
}

function AdminGate({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminRoute>{children}</AdminRoute>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/motorcycles/:id" element={<MotorcycleDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sell"
              element={
                <ProtectedRoute>
                  <SellPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <SavedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/register"
              element={
                <ProtectedRoute>
                  <SellerRegisterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute>
                  <SellerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/profile"
              element={
                <ProtectedRoute>
                  <SellerProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/listings/new"
              element={
                <SellerListingGate>
                  <SellerListingNewPage />
                </SellerListingGate>
              }
            />
            <Route
              path="/seller/listings"
              element={
                <SellerListingGate>
                  <SellerListingsPage />
                </SellerListingGate>
              }
            />
            <Route
              path="/seller/listings/:id/edit"
              element={
                <SellerListingGate>
                  <SellerListingEditPage />
                </SellerListingGate>
              }
            />
            <Route
              path="/seller/listings/:id/preview"
              element={
                <SellerListingGate>
                  <SellerListingPreviewPage />
                </SellerListingGate>
              }
            />
            <Route
              path="/seller/listings/:id"
              element={
                <SellerListingGate>
                  <SellerListingViewPage />
                </SellerListingGate>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/messages"
              element={
                <ProtectedRoute>
                  <SellerMessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <SellerMessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminGate>
                  <AdminDashboardPage />
                </AdminGate>
              }
            />
            <Route
              path="/admin/sellers"
              element={
                <AdminGate>
                  <AdminSellersPage />
                </AdminGate>
              }
            />
            <Route
              path="/admin/sellers/:id"
              element={
                <AdminGate>
                  <AdminSellerDetailPage />
                </AdminGate>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
