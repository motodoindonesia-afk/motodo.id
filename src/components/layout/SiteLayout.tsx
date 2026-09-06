import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Footer } from "./Footer"
import { Header } from "./Header"

export function SiteLayout() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1))
      target?.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <Header />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}