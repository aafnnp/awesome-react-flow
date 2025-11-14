import { Link } from 'react-router-dom'

function ExampleLayout({ children, title }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/"
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              ← 返回首页
            </Link>
            <h1 className="text-3xl font-bold mt-2">{title}</h1>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default ExampleLayout

