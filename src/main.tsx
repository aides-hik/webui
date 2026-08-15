import React from "react"
import ReactDOM from "react-dom/client"

import "@/api/index"
import App from "./App"
import "@/styles/design-tokens.css"
import "@/styles/globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
