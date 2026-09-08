import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"
import { BrowsePage } from "./components/browse/BrowsePage"
import { MotorcycleDetailPage } from "./components/browse/MotorcycleDetailPage"
import { HomePage } from "./components/home/HomePage"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { SiteLayout } from "./components/layout/SiteLayout"
import { AuthProvider } from "./context/AuthContext"
import { SellerProfilesProvider } from "./context/SellerProfilesContext"
import { ListingsProvider } from "./context/ListingsContext"
import { OrdersProvider } from "./context/OrdersContext"
import { ChatProvider } from "./context/ChatContext"
import { ReviewsProvider } from "./context/ReviewsContext"
import { NotificationsProvider } from "./context/NotificationsContext"
import { FavoritesProvider } from "./context/FavoritesContext"
import { CartProvider } from "./context/CartContext"
import { ProductionConfigError } from "./components/layout/ProductionConfigError"
import { isProductionConfigBlocked } from "./lib/supabase"
import { NotificationsDataGate } from "./components/notifications/NotificationsDataGate"
import { ChatDataGate } from "./components/chat/ChatDataGate"
import { ReviewsDataGate } from "./components/reviews/ReviewsDataGate"
import { LoginPage } from "./pages/LoginPage"
import { ProfilePage } from "./pages/ProfilePage"
import { ProfileEditPage } from "./pages/ProfileEditPage"
import { SettingsPage } from "./pages/SettingsPage"
import { WishlistPage } from "./pages/WishlistPage"
import { CartPage } from "./pages/CartPage"
import { SellPage } from "./pages/SellPage"
import { SignupPage } from "./pages/SignupPage"
import { SellerDashboardPage } from "./pages/seller/SellerDashboardPage"
import { SellerListingNewPage } from "./pages/seller/SellerListingNewPage"
import { SellerListingEditPage } from "./pages/seller/SellerListingEditPage"
import { SellerListingPreviewPage } from "./pages/seller/SellerListingPreviewPage"
import { SellerListingsPage } from "./pages/seller/SellerListingsPage"
import { SellerListingViewPage } from "./pages/seller/SellerListingViewPage"
import { SellerMessagesPage } from "./pages/seller/SellerMessagesPage"
import { MessagesPage } from "./pages/MessagesPage"
import { SellerProfilePage } from "./pages/seller/SellerProfilePage"
import { SellerSettingsPage } from "./pages/seller/SellerSettingsPage"
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
import { LanguageProvider } from "./i18n"

function SellerListingGate({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <ApprovedSellerRoute>
        <ListingsDataGate>{children}</ListingsDataGate>
      </ApprovedSellerRoute>
    </ProtectedRoute>
  )
}

export default function App() {
  if (isProductionConfigBlocked()) {
    return (
      <LanguageProvider>
        <ProductionConfigError />
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
    <BrowserRouter>
      <AuthProvider>
        <SellerProfilesProvider>
        <ListingsProvider>
        <OrdersProvider>
        <ChatProvider>
        <ReviewsProvider>
        <NotificationsProvider>
        <FavoritesProvider>
        <CartProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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
              element={<PublicSellerPage />}
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
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
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
              path="/cart"
              element={
                <ProtectedRoute>
                  <ListingsDataGate>
                    <CartPage />
                  </ListingsDataGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <ListingsDataGate>
                    <WishlistPage />
                  </ListingsDataGate>
                </ProtectedRoute>
              }
            />
            <Route path="/saved" element={<Navigate to="/wishlist" replace />} />
            <Route path="/favorites" element={<Navigate to="/wishlist" replace />} />
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
              path="/seller/settings"
              element={
                <ProtectedRoute>
                  <SellerOnlyRoute>
                    <SellerSettingsPage />
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
            <Route path="/admin" element={<NotFoundPage />} />
            <Route path="/admin/*" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </CartProvider>
        </FavoritesProvider>
        </NotificationsProvider>
        </ReviewsProvider>
        </ChatProvider>
        </OrdersProvider>
        </ListingsProvider>
        </SellerProfilesProvider>
      </AuthProvider>
    </BrowserRouter>
    </LanguageProvider>
  )
}
