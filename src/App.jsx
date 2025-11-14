import { Routes, Route, Link } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import ExamplePage from "./pages/examples/ExamplePage"

function App() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <nav className="border-b border-border bg-card flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex gap-4">
          <Link
            to="/"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            首页
          </Link>
          <Link
            to="/about"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            关于
          </Link>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route
            path="/"
            element={<div className="container mx-auto px-4 py-8"><Home /></div>}
          />
          <Route
            path="/about"
            element={<div className="container mx-auto px-4 py-8"><About /></div>}
          />
          <Route
            path="/examples/:slug"
            element={<ExamplePage />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
