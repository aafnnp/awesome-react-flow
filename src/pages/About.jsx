import SEO from "../components/SEO"

function About() {
  return (
    <>
      <SEO
        title="关于 - React Flow 案例集合"
        description="了解 React Flow 案例集合项目，这是一个使用 React Router 和 shadcn/ui 构建的应用示例，展示各种流程图和节点图的实现方案。"
        keywords="React Flow, 关于, 项目介绍, React Router, shadcn/ui"
        url="https://flow.manon.icu/about"
      />
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">关于</h1>
        <p className="text-muted-foreground">这是一个使用 React Router 和 shadcn/ui 的应用示例</p>
      </div>
    </>
  )
}

export default About
