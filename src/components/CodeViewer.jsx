import { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"

/**
 * 代码编辑器组件
 * 支持直接编辑代码，实时预览，带语法高亮
 */
function CodeViewer({ code, language = "typescript", onCodeChange }) {
  const [editedCode, setEditedCode] = useState(code)

  // 当 code prop 变化时，更新 editedCode
  useEffect(() => {
    setEditedCode(code)
  }, [code])

  const handleCodeChange = (newCode) => {
    setEditedCode(newCode || "")
    if (onCodeChange) {
      onCodeChange(newCode || "")
    }
  }

  const handleReset = () => {
    setEditedCode(code)
    if (onCodeChange) {
      onCodeChange(code)
    }
  }

  // 根据 language 确定 Monaco Editor 的语言模式
  const getEditorLanguage = () => {
    // Monaco Editor 的 JavaScript 模式已经支持 JSX 语法高亮
    if (language === "jsx" || language === "javascript") {
      return "javascript"
    }
    if (language === "tsx" || language === "typescript") {
      return "typescript"
    }
    return language
  }

  return (
    <div className="h-full flex flex-col border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">代码编辑器</span>
          <span className="text-xs text-muted-foreground">({language})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 bg-background border border-border rounded hover:bg-muted transition-colors"
          >
            重置
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language={getEditorLanguage()}
          value={editedCode}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: "full",
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            wordBasedSuggestions: "allDocuments",
            quickSuggestions: true,
            parameterHints: { enabled: true },
          }}
          beforeMount={(monaco) => {
            // 配置 JavaScript 编译器选项
            const compilerOptions = {
              target: monaco.languages.typescript.ScriptTarget.Latest,
              allowNonTsExtensions: true,
              moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
              module: monaco.languages.typescript.ModuleKind.ESNext,
              noEmit: true,
              esModuleInterop: true,
              jsx: monaco.languages.typescript.JsxEmit.React,
              reactNamespace: "React",
              allowJs: true,
              typeRoots: ["node_modules/@types"],
              checkJs: false, // 禁用 JavaScript 类型检查
              skipLibCheck: true, // 跳过库文件的类型检查
            }

            monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions)
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)

            // 禁用语义验证和诊断，只保留语法高亮
            const diagnosticsOptions = {
              noSemanticValidation: true, // 禁用语义验证
              noSyntaxValidation: false, // 保留语法检查（用于语法高亮）
              noSuggestionDiagnostics: true, // 禁用建议诊断
            }

            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnosticsOptions)
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnosticsOptions)

            // 添加类型定义，避免模块找不到的错误
            // 这些只是占位符，实际的类型检查已禁用
            const typeDefinitions = `
declare module 'react' {
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useState<T>(initial: T): [T, (value: T) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  export function useRef<T>(initial: T): { current: T };
  export function useLayoutEffect(effect: () => void | (() => void), deps?: any[]): void;
  export default any;
  export const Component: any;
  export const Fragment: any;
}
declare module '@xyflow/react' {
  export const ReactFlow: any;
  export const Background: any;
  export const Controls: any;
  export const MiniMap: any;
  export const Panel: any;
  export function addEdge(edge: any, edges: any[]): any[];
  export function useNodesState(initial: any[]): [any[], any, any];
  export function useEdgesState(initial: any[]): [any[], any, any];
}
declare module 'dagre' {
  const dagre: any;
  export default dagre;
}
`

            monaco.languages.typescript.javascriptDefaults.addExtraLib(
              typeDefinitions,
              "file:///node_modules/@types/index.d.ts"
            )
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              typeDefinitions,
              "file:///node_modules/@types/index.d.ts"
            )
          }}
        />
      </div>
    </div>
  )
}

export default CodeViewer
