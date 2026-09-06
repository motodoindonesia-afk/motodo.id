import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"
import { BrowsePage } from "./components/browse/BrowsePage"
import { MotorcycleDetailPage } from "./components/browse/MotorcycleDetailPage"
import { HomePage } from "./components/home/HomePage"
import { AdminRoute } from "./components/admin/AdminRoute"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { SiteLayout } from "./components/layout/SiteLayout"
import { AuthProvider } from "./context/AuthContext"
import { SellerProfilesProvider } from "./context/SellerProfilesContext"
import { ListingsProvider } from "./context/ListingsContext"
import { OrdersProvider } from "./context/OrdersContext"
import { ChatProvider } from "./context/ChatContext"
import { ReviewsProvider } from "./context/ReviewsContext"
import { NotificationsProvider } from "./context/NotificationsContext"
import { AdminDirectoryProvider } from "./context/AdminDirectoryContext"
import { AdminUsersDataGate } from "./components/admin/AdminUsersDataGate"
import { ProductionConfigError } from "./components/layout/ProductionConfigError"
import { isProductionConfigBlocked } from "./lib/supabase"
import { NotificationsDataGate } from "./components/notifications/NotificationsDataGate"
import { ChatDataGate } from "./components/chat/ChatDataGate"
import { ReviewsDataGate } from "./components/reviews/ReviewsDataGate"
import { LoginPage } from "./pages/LoginPage"
import { ProfilePage } from "./pages/ProfilePage"
import { SavedPage } from "./pages/SavedPage"
import { SellPage } from "./pages/SellPage"
import { SignupPage } from "./pages/SignupPage"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { AdminSellerDetailPage } from "./pages/admin/AdminSellerDetailPage"
import { AdminSellersPage } from "./pages/admin/AdminSellersPage"
import { AdminListingsPage } from "./pages/admin/AdminListingsPage"
import { AdminListingDetailPage } from "./pages/admin/AdminListingDetailPage"
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage"
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetailPage"
import { AdminUsersPage } from "./pages/admin/AdminUsersPage"
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage"
import { AdminReviewsPage } from "./pages/admin/AdminReviewsPage"
import { AdminReviewDetailPage } from "./pages/admin/AdminReviewDetailPage"
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage"
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
import { SellerOnlyRoute } from "./components/seller/SellerOnlyRoute"
import { ListingsDataGate } from "./components/listings/ListingsDataGate"
import { OrdersDataGate } from "./components/orders/OrdersDataGate"
import { SellerProfileEditPage } from "./pages/seller/SellerProfileEditPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { OrdersPage } from "./pages/OrdersPage"
import { OrderDetailPage } from "./pages/OrderDetailPage"
import { SellerOrdersPage } from "./pages/seller/SellerOrdersPage"
import { SellerOrderDetailPage } from "./pages/seller/SellerOrderDetailPage"
import { SellerReviewsPage } from "./pages/seller/SellerReviewsPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { PublicSellerPage } from "./pages/PublicSellerPage"
import { PublicSellerReviewsPage } from "./pages/PublicSellerReviewsPage"
import { NotFoundPage } from "./pages/NotFoundPage"

function SellerListingGate({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ApprovedSellerRoute>
        <ListingsDataGate>{children}</ListingsDataGate>
      </ApprovedSellerRoute>
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
  if (isProductionConfigBlocked()) {
    return <ProductionConfigError />
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <SellerProfilesProvider>
        <ListingsProvider>
        <OrdersProvider>
        <ChatProvider>
        <ReviewsProvider>
        <NotificationsProvider>
        <AdminDirectoryProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/browse"
              element={
                <ListingsDataGate>
                  <BrowsePage />
                </ListingsDataGate>
              }
            />
            <Route
              path="/motorcycles/:id"
              element={
                <ListingsDataGate>
                  <ReviewsDataGate>
                    <MotorcycleDetailPage />
                  </ReviewsDataGate>
                </ListingsDataGate>
              }
            />
            <Route
              path="/sellers/:sellerId/reviews"
              element={
                <ReviewsDataGate>
                  <PublicSellerReviewsPage />
                </ReviewsDataGate>
              }
            />
            <Route
              path="/sellers/:sellerId"
              element={
                <ReviewsDataGate>
                  <PublicSellerPage />
                </ReviewsDataGate>
              }
            />
            <Route
              path="/checkout/:listingId"
              element={
                <ProtectedRoute>
                  <ListingsDataGate>
                    <OrdersDataGate>
                      <CheckoutPage />
                    </OrdersDataGate>
                  </ListingsDataGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersDataGate>
                    <ReviewsDataGate>
                      <OrdersPage />
                    </ReviewsDataGate>
                  </OrdersDataGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrdersDataGate>
                    <ReviewsDataGate>
                      <OrderDetailPage />
                    </ReviewsDataGate>
                  </OrdersDataGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsDataGate>
                    <NotificationsPage />
                  </NotificationsDataGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <OrdersDataGate>
                      <SellerOrdersPage />
                    </OrdersDataGate>
                  </SellerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders/:orderId"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <OrdersDataGate>
                      <SellerOrderDetailPage />
                    </OrdersDataGate>
                  </SellerOnlyRoute>
                </ProtectedRoute>
              }
            />
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
              path="/seller"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <Navigate to="/seller/dashboard" replace />
                  </SellerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <OrdersDataGate>
                      <ChatDataGate>
                        <ReviewsDataGate>
                          <SellerDashboardPage />
                        </ReviewsDataGate>
                      </ChatDataGate>
                    </OrdersDataGate>
                  </SellerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/profile"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <SellerProfilePage />
                  </SellerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/profile/edit"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <SellerProfileEditPage />
                  </SellerOnlyRoute>
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
                  <ChatDataGate>
                    <MessagesPage />
                  </ChatDataGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <ChatDataGate>
                    <MessagesPage />
                  </ChatDataGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/reviews"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <ReviewsDataGate>
                      <SellerReviewsPage />
                    </ReviewsDataGate>
                  </SellerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/messages"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <ChatDataGate>
                      <SellerMessagesPage />
                    </ChatDataGate>
                  </SellerOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <ChatDataGate>
                      <SellerMessagesPage />
                    </ChatDataGate>
                  </SellerOnlyRoute>
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
            <Route
              path="/admin/listings"
              element={
                <AdminGate>
                  <ListingsDataGate>
                    <AdminListingsPage />
                  </ListingsDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/listings/:listingId"
              element={
                <AdminGate>
                  <ListingsDataGate>
                    <ReviewsDataGate>
                      <AdminListingDetailPage />
                    </ReviewsDataGate>
                  </ListingsDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminGate>
                  <OrdersDataGate>
                    <AdminOrdersPage />
                  </OrdersDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/orders/:orderId"
              element={
                <AdminGate>
                  <OrdersDataGate>
                    <AdminOrderDetailPage />
                  </OrdersDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminGate>
                  <AdminUsersDataGate>
                    <AdminUsersPage />
                  </AdminUsersDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <AdminGate>
                  <AdminUsersDataGate>
                    <AdminUserDetailPage />
                  </AdminUsersDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <AdminGate>
                  <ReviewsDataGate>
                    <AdminReviewsPage />
                  </ReviewsDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/reviews/:reviewId"
              element={
                <AdminGate>
                  <ReviewsDataGate>
                    <AdminReviewDetailPage />
                  </ReviewsDataGate>
                </AdminGate>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminGate>
                  <AdminSettingsPage />
                </AdminGate>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </AdminDirectoryProvider>
        </NotificationsProvider>
        </ReviewsProvider>
        </ChatProvider>
        </OrdersProvider>
        </ListingsProvider>
        </SellerProfilesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
