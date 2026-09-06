import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../context/AuthContext"
import { SellerProfilesProvider } from "../context/SellerProfilesContext"
import { ListingsProvider } from "../context/ListingsContext"
import { OrdersProvider } from "../context/OrdersContext"
import { ChatProvider } from "../context/ChatContext"
import { ReviewsProvider } from "../context/ReviewsContext"
import { NotificationsProvider } from "../context/NotificationsContext"
import { AdminDirectoryProvider } from "../context/AdminDirectoryContext"
import { AdminUsersDataGate } from "../components/admin/AdminUsersDataGate"
import { ProductionConfigError } from "../components/layout/ProductionConfigError"
import { isProductionConfigBlocked } from "../lib/supabase"
import { ReviewsDataGate } from "../components/reviews/ReviewsDataGate"
import { ListingsDataGate } from "../components/listings/ListingsDataGate"
import { OrdersDataGate } from "../components/orders/OrdersDataGate"
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage"
import { AdminSellerDetailPage } from "../pages/admin/AdminSellerDetailPage"
import { AdminSellersPage } from "../pages/admin/AdminSellersPage"
import { AdminListingsPage } from "../pages/admin/AdminListingsPage"
import { AdminListingDetailPage } from "../pages/admin/AdminListingDetailPage"
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage"
import { AdminOrderDetailPage } from "../pages/admin/AdminOrderDetailPage"
import { AdminUsersPage } from "../pages/admin/AdminUsersPage"
import { AdminUserDetailPage } from "../pages/admin/AdminUserDetailPage"
import { AdminReviewsPage } from "../pages/admin/AdminReviewsPage"
import { AdminReviewDetailPage } from "../pages/admin/AdminReviewDetailPage"
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage"
import { OPS } from "../lib/opsPaths"
import { RitmeGate } from "./auth/RitmeGate"
import { RitmeShell } from "./layout/RitmeShell"
import { RitmeLoginPage } from "./pages/RitmeLoginPage"

function RitmeNotFound() {
  return (
    <main className="px-6 py-16">
      <h1 className="text-2xl font-bold text-navy">Not found</h1>
      <p className="mt-2 text-sm text-navy-muted">This Ritme page does not exist.</p>
    </main>
  )
}

export function RitmeApp() {
  if (isProductionConfigBlocked()) {
    return <ProductionConfigError product="Ritme" />
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
                        <Route path={OPS.login} element={<RitmeLoginPage />} />
                        <Route
                          element={
                            <RitmeGate>
                              <RitmeShell />
                            </RitmeGate>
                          }
                        >
                          <Route path="/" element={<Navigate to={OPS.dashboard} replace />} />
                          <Route
                            path={OPS.dashboard}
                            element={
                              <AdminUsersDataGate>
                                <ListingsDataGate>
                                  <AdminDashboardPage />
                                </ListingsDataGate>
                              </AdminUsersDataGate>
                            }
                          />
                          <Route path={OPS.sellers} element={<AdminSellersPage />} />
                          <Route path="/sellers/:id" element={<AdminSellerDetailPage />} />
                          <Route
                            path={OPS.listings}
                            element={
                              <ListingsDataGate>
                                <AdminListingsPage />
                              </ListingsDataGate>
                            }
                          />
                          <Route
                            path="/listings/:id"
                            element={
                              <ListingsDataGate>
                                <ReviewsDataGate>
                                  <AdminListingDetailPage />
                                </ReviewsDataGate>
                              </ListingsDataGate>
                            }
                          />
                          <Route
                            path={OPS.orders}
                            element={
                              <OrdersDataGate>
                                <AdminOrdersPage />
                              </OrdersDataGate>
                            }
                          />
                          <Route
                            path="/orders/:id"
                            element={
                              <OrdersDataGate>
                                <AdminOrderDetailPage />
                              </OrdersDataGate>
                            }
                          />
                          <Route
                            path={OPS.users}
                            element={
                              <AdminUsersDataGate>
                                <AdminUsersPage />
                              </AdminUsersDataGate>
                            }
                          />
                          <Route
                            path="/users/:id"
                            element={
                              <AdminUsersDataGate>
                                <AdminUserDetailPage />
                              </AdminUsersDataGate>
                            }
                          />
                          <Route
                            path={OPS.reviews}
                            element={
                              <ReviewsDataGate>
                                <AdminReviewsPage />
                              </ReviewsDataGate>
                            }
                          />
                          <Route
                            path="/reviews/:id"
                            element={
                              <ReviewsDataGate>
                                <AdminReviewDetailPage />
                              </ReviewsDataGate>
                            }
                          />
                          <Route path={OPS.settings} element={<AdminSettingsPage />} />
                          <Route path="*" element={<RitmeNotFound />} />
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
