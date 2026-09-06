import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../index.css"
import { RitmeApp } from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RitmeApp />
  </StrictMode>,
)
