import { useEffect } from "react"

/**
 * SEO 组件，用于动态更新页面标题和 meta 标签
 * @param {Object} props
 * @param {string} props.title - 页面标题
 * @param {string} props.description - 页面描述
 * @param {string} props.keywords - 页面关键词（可选）
 * @param {string} props.image - Open Graph 图片 URL（可选）
 * @param {string} props.url - 页面 URL（可选）
 */
function SEO({
  title = "React Flow 案例集合",
  description = "React Flow 案例集合网站，展示各种流程图、节点图的实现方案",
  keywords = "React Flow, 流程图, 节点图, 数据可视化, React, 前端开发",
  image = "https://flow.manon.icu/og-image.jpg",
  url = "https://flow.manon.icu/",
}) {
  useEffect(() => {
    // 更新页面标题
    document.title = title

    // 更新或创建 meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement("meta")
      metaDescription.setAttribute("name", "description")
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute("content", description)

    // 更新或创建 meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta")
      metaKeywords.setAttribute("name", "keywords")
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.setAttribute("content", keywords)

    // 更新 Open Graph 标签
    const updateOGTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement("meta")
        tag.setAttribute("property", property)
        document.head.appendChild(tag)
      }
      tag.setAttribute("content", content)
    }

    updateOGTag("og:title", title)
    updateOGTag("og:description", description)
    updateOGTag("og:url", url)
    updateOGTag("og:image", image)

    // 更新 Twitter Card 标签
    const updateTwitterTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement("meta")
        tag.setAttribute("property", property)
        document.head.appendChild(tag)
      }
      tag.setAttribute("content", content)
    }

    updateTwitterTag("twitter:title", title)
    updateTwitterTag("twitter:description", description)
    updateTwitterTag("twitter:url", url)
    updateTwitterTag("twitter:image", image)

    // 更新 canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.setAttribute("rel", "canonical")
      document.head.appendChild(canonical)
    }
    canonical.setAttribute("href", url)
  }, [title, description, keywords, image, url])

  return null
}

export default SEO
