import { Link } from 'react-router-dom'
import { examples } from '../data/examples'

function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">React Flow 案例集合</h1>
        <p className="text-muted-foreground">
          探索 React Flow 的各种使用场景和功能演示
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examples.map((example) => (
          <Link
            key={example.slug}
            to={`/examples/${example.slug}`}
            className="group block"
          >
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-primary">
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {example.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {example.description}
              </p>
              <div className="text-sm text-primary font-medium">
                查看案例 →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
