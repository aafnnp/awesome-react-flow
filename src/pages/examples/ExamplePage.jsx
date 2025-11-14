import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, Navigate } from "react-router-dom"
import { examples } from "../../data/examples"
import BasicNodes from "./BasicNodes"
import CustomNodes from "./CustomNodes"
import InteractiveFlow from "./InteractiveFlow"
import DagreLayout from "./DagreLayout"
import NodePositionAnimation from "./NodePositionAnimation"
import HelperLines from "./HelperLines"
import CodeViewer from "../../components/CodeViewer"
import { transform } from "@babel/standalone"
import * as React from "react"
import * as ReactFlow from "@xyflow/react"
import dagre from "dagre"

const componentMap = {
  BasicNodes,
  CustomNodes,
  InteractiveFlow,
  DagreLayout,
  NodePositionAnimation,
  HelperLines,
}

function ExamplePage() {
  const { slug } = useParams()
  const example = examples.find((ex) => ex.slug === slug)
  const [showCode, setShowCode] = useState(true) // 默认显示代码
  const [code, setCode] = useState("")
  const [editedCode, setEditedCode] = useState("") // 编辑后的代码
  const [codeWidth, setCodeWidth] = useState(50) // 代码区域宽度百分比
  const [previewError, setPreviewError] = useState(null) // 预览错误
  const isResizing = useRef(false)
  const containerRef = useRef(null)

  // 动态加载代码
  useEffect(() => {
    if (example?.component) {
      // 使用 Vite 的 ?raw 导入来获取源代码
      import(`./${example.component}.jsx?raw`)
        .then((module) => {
          setCode(module.default)
          setEditedCode(module.default) // 初始化编辑代码
        })
        .catch((err) => {
          console.error("Failed to load code:", err)
          const errorMsg = "// 无法加载代码，请检查文件是否存在"
          setCode(errorMsg)
          setEditedCode(errorMsg)
        })
    }
  }, [example])

  // 处理拖拽调整大小
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      setCodeWidth(Math.max(20, Math.min(80, newWidth))) // 限制在 20% 到 80% 之间
    }

    const handleMouseUp = () => {
      isResizing.current = false
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // 获取原始组件（在条件返回之前）
  const OriginalComponent = example ? componentMap[example?.component] : null

  // 动态编译和执行 JSX 代码
  const { component: DynamicComponent, error: compileError } = useMemo(() => {
    if (!OriginalComponent || !editedCode || editedCode === code) {
      return { component: OriginalComponent, error: null }
    }

    try {
      // 预处理：将 import 语句转换为 require
      // 注意：顺序很重要，先处理更复杂的模式
      let processedCode = editedCode

      // 0. 移除 CSS 导入和其他副作用导入（这些不需要执行）
      processedCode = processedCode.replace(
        /import\s+['"][^'"]*\.(css|scss|sass|less)['"];?\s*\n?/g,
        "// CSS import removed\n"
      )

      // 1. 处理混合导入：import A, { B, C } from 'module'（必须在默认导入之前）
      processedCode = processedCode.replace(
        /import\s+(\w+)\s*,\s*{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
        (match, defaultImport, namedImports, moduleName) => {
          return `const ${defaultImport} = require('${moduleName}').default || require('${moduleName}'); const {${namedImports}} = require('${moduleName}')`
        }
      )

      // 2. 处理 import * as：import * as A from 'module'
      processedCode = processedCode.replace(
        /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
        (match, importName, moduleName) => {
          return `const ${importName} = require('${moduleName}')`
        }
      )

      // 3. 处理命名导入：import { A, B } from 'module'
      processedCode = processedCode.replace(
        /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
        (match, imports, moduleName) => {
          return `const {${imports}} = require('${moduleName}')`
        }
      )

      // 4. 处理默认导入：import A from 'module'（必须在最后，避免匹配混合导入）
      processedCode = processedCode.replace(
        /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
        (match, importName, moduleName) => {
          return `const ${importName} = require('${moduleName}').default || require('${moduleName}')`
        }
      )

      // 5. 移除剩余的副作用导入（没有导入名称的）
      processedCode = processedCode.replace(/import\s+['"]([^'"]+)['"];?\s*\n?/g, "// Side effect import removed\n")

      // 6. 处理 export 语句，转换为 module.exports
      // 先提取 export default 的组件名
      let defaultExportName = null

      // 6.1 提取 export default function ComponentName
      const defaultFunctionMatch = processedCode.match(/export\s+default\s+function\s+(\w+)/)
      if (defaultFunctionMatch) {
        defaultExportName = defaultFunctionMatch[1]
        processedCode = processedCode.replace(/export\s+default\s+function\s+(\w+)/g, "function $1")
      }

      // 6.2 提取 export default const ComponentName
      const defaultConstMatch = processedCode.match(/export\s+default\s+const\s+(\w+)/)
      if (defaultConstMatch) {
        defaultExportName = defaultConstMatch[1]
        processedCode = processedCode.replace(/export\s+default\s+const\s+(\w+)/g, "const $1")
      }

      // 6.3 提取 export default class ComponentName
      const defaultClassMatch = processedCode.match(/export\s+default\s+class\s+(\w+)/)
      if (defaultClassMatch) {
        defaultExportName = defaultClassMatch[1]
        processedCode = processedCode.replace(/export\s+default\s+class\s+(\w+)/g, "class $1")
      }

      // 6.4 处理 export default ComponentName（表达式，不是声明）
      const defaultExprMatch = processedCode.match(/export\s+default\s+(\w+)\s*;?\s*$/)
      if (defaultExprMatch && !defaultExportName) {
        defaultExportName = defaultExprMatch[1]
        processedCode = processedCode.replace(/export\s+default\s+(\w+)\s*;?\s*$/gm, "")
      }

      // 6.5 处理 export const/function/class（命名导出）
      processedCode = processedCode.replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, "$1 $2")

      // 6.6 处理 export { A, B }（命名导出列表）
      processedCode = processedCode.replace(/export\s+{([^}]+)}\s*;?/g, "// Named exports removed")

      // 6.7 移除剩余的 export default（如果还有）
      processedCode = processedCode.replace(/export\s+default\s+/g, "")

      // 使用 Babel 转换 JSX
      let transformedCode = transform(processedCode, {
        presets: ["react"],
        plugins: [],
      }).code

      // 如果有默认导出，在代码末尾添加设置默认导出的代码
      if (defaultExportName) {
        transformedCode += `\nif (typeof ${defaultExportName} !== 'undefined') { module.exports.default = ${defaultExportName}; }`
      }

      // 准备模块映射
      const moduleMap = {
        react: React,
        "react-dom": { default: null }, // 通常不需要
        "@xyflow/react": ReactFlow,
        dagre: dagre,
      }

      // 创建 require 函数
      const requireFn = (moduleName) => {
        if (moduleMap[moduleName]) {
          return moduleMap[moduleName]
        }
        throw new Error(`Cannot find module: ${moduleName}`)
      }

      // 创建模块和导出对象
      const exports = {}
      const module = { exports }

      // 执行转换后的代码
      const func = new Function("React", "require", "module", "exports", transformedCode)

      func(React, requireFn, module, exports)

      // 获取默认导出或命名导出
      const Component = module.exports.default || module.exports

      if (typeof Component === "function") {
        return { component: Component, error: null }
      }

      throw new Error("组件必须是一个函数")
    } catch (error) {
      console.error("代码编译错误:", error)
      return { component: OriginalComponent, error: error.message }
    }
  }, [editedCode, code, OriginalComponent])

  // 更新错误状态
  useEffect(() => {
    setPreviewError(compileError)
  }, [compileError])

  if (!example) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  if (!OriginalComponent) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">{example.title}</h1>
          <p className="text-muted-foreground">{example.description}</p>
        </div>

        <div className="min-h-[600px] h-[calc(100vh-280px)] flex flex-col border border-border rounded-lg overflow-hidden">
          {/* 控制按钮 */}
          <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCode(!showCode)}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                {showCode ? "隐藏代码" : "查看代码"}
              </button>
            </div>
          </div>

          {/* 内容区域 - 左右布局 */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden flex relative"
          >
            {showCode && code && (
              <>
                <div
                  className="flex-shrink-0 border-r border-border"
                  style={{ width: `${codeWidth}%` }}
                >
                  <CodeViewer
                    code={editedCode || code}
                    language="tsx"
                    onCodeChange={setEditedCode}
                  />
                </div>
                {/* 可拖拽的分隔条 */}
                <div
                  className="w-1 bg-border hover:bg-primary cursor-col-resize flex-shrink-0 transition-colors group"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    isResizing.current = true
                  }}
                >
                  <div className="w-full h-full group-hover:bg-primary/50 transition-colors" />
                </div>
              </>
            )}
            <div
              className="flex-1 overflow-hidden relative"
              style={showCode ? { width: `${100 - codeWidth}%` } : { width: "100%" }}
            >
              {previewError && (
                <div className="absolute top-2 left-2 right-2 bg-red-500 text-white p-3 rounded text-sm z-10">
                  <div className="font-semibold mb-1">预览错误:</div>
                  <div className="font-mono text-xs">{previewError}</div>
                </div>
              )}
              <DynamicComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamplePage
