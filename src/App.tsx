import { BrowserRouter, Route, Routes } from "react-router-dom"
import { BrowsePage } from "./components/browse/BrowsePage"
import { MotorcycleDetailPage } from "./components/browse/MotorcycleDetailPage"
import { HomePage } from "./components/home/HomePage"
import { SiteLayout } from "./components/layout/SiteLayout"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/motorcycles/:id" element={<MotorcycleDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
