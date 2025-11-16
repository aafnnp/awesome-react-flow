# SEO 配置说明

本项目已配置完整的 SEO 优化，方便搜索引擎快速爬取和索引。

## 已实现的 SEO 功能

### 1. HTML Meta 标签优化 (`index.html`)

- ✅ 基础 Meta 标签（title, description, keywords）
- ✅ Open Graph 标签（用于 Facebook、LinkedIn 等社交平台）
- ✅ Twitter Card 标签（用于 Twitter 分享）
- ✅ Canonical URL（避免重复内容）
- ✅ 结构化数据（JSON-LD Schema.org）

### 2. 动态 SEO 组件 (`src/components/SEO.jsx`)

创建了 `SEO` 组件，用于在路由切换时动态更新页面标题和 meta 标签。每个页面都可以使用此组件来设置独特的 SEO 信息。

**使用方法：**

```jsx
import SEO from '../components/SEO'

function MyPage() {
  return (
    <>
      <SEO
        title="页面标题"
        description="页面描述"
        keywords="关键词1, 关键词2"
        url="https://flow.manon.icu/page"
        image="https://flow.manon.icu/image.jpg" // 可选
      />
      {/* 页面内容 */}
    </>
  )
}
```

### 3. robots.txt (`public/robots.txt`)

- ✅ 允许所有搜索引擎爬取
- ✅ 禁止爬取开发文件和构建产物
- ✅ 指定 sitemap 位置

### 4. sitemap.xml (`public/sitemap.xml`)

- ✅ 包含所有页面路由
- ✅ 设置页面优先级和更新频率
- ✅ 帮助搜索引擎快速发现和索引所有页面

## 需要配置的内容

### 1. 更新域名

在以下文件中将 `https://flow.manon.icu/` 替换为你的实际域名：

- `index.html` - 所有 URL 和图片链接
- `public/robots.txt` - Sitemap URL
- `public/sitemap.xml` - 所有页面 URL
- `src/components/SEO.jsx` - 默认 URL（如果使用）

### 2. 添加 Open Graph 图片

1. 准备一张 1200x630 像素的图片作为 Open Graph 图片
2. 将图片放在 `public/` 目录下（例如 `public/og-image.jpg`）
3. 在 `index.html` 中更新图片 URL

### 3. 更新 sitemap.xml 的日期

在 `public/sitemap.xml` 中，将 `<lastmod>` 标签更新为当前日期或实际页面最后修改日期。

### 4. 验证 SEO 配置

部署后，可以使用以下工具验证 SEO 配置：

- **Google Search Console**: https://search.google.com/search-console
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator

## 页面 SEO 配置

### 首页 (`/`)

- 标题：React Flow 案例集合 - 探索流程图和节点图的实现方案
- 描述：展示各种流程图、节点图的实现方案

### 关于页面 (`/about`)

- 标题：关于 - React Flow 案例集合
- 描述：项目介绍信息

### 示例页面 (`/examples/:slug`)

- 标题：动态生成（示例名称 + 网站名称）
- 描述：使用示例的描述信息
- 关键词：包含示例名称和相关关键词

## 注意事项

1. **SPA 应用的 SEO 限制**：由于这是单页应用（SPA），搜索引擎爬虫可能无法完全执行 JavaScript。对于生产环境，建议考虑：

   - 使用服务端渲染（SSR）如 Next.js
   - 使用预渲染工具如 Prerender.io
   - 使用静态站点生成（SSG）

2. **动态内容**：如果页面内容经常变化，记得更新 `sitemap.xml` 中的 `<lastmod>` 日期。

3. **图片优化**：确保 Open Graph 图片大小适中（建议小于 1MB），格式为 JPG 或 PNG。

4. **HTTPS**：确保网站使用 HTTPS，这对 SEO 很重要。

## 后续优化建议

1. 添加更多结构化数据（如 BreadcrumbList、Article 等）
2. 实现自动生成 sitemap.xml 的脚本
3. 添加页面加载性能优化（影响 SEO 排名）
4. 添加多语言支持（hreflang 标签）
5. 实现服务端渲染或静态站点生成
