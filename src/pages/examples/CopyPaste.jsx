/**
 * 复制粘贴案例
 *
 * 这个案例展示了如何实现复制粘贴功能：
 * - 使用键盘快捷键复制选中的节点和边（Ctrl+C / Cmd+C）
 * - 使用键盘快捷键粘贴节点和边（Ctrl+V / Cmd+V）
 * - 粘贴时自动偏移位置，避免重叠
 * - 保持节点之间的连接关系
 * - 自动生成新的节点ID
 *
 * 参考：https://pro-examples.reactflow.dev/copy-paste
 */

import { useCallback, useEffect, useRef } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

// 初始节点数据
const initialNodes = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: { label: "节点 1" },
  },
  {
    id: "2",
    position: { x: 300, y: 100 },
    data: { label: "节点 2" },
  },
  {
    id: "3",
    position: { x: 200, y: 250 },
    data: { label: "节点 3" },
  },
]

// 初始边数据
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
]

// 粘贴时的偏移量
const PASTE_OFFSET = 50

function CopyPaste() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const reactFlowInstanceRef = useRef(null)

  // 存储复制的内容
  const copiedNodesRef = useRef([])
  const copiedEdgesRef = useRef([])

  // 生成唯一的节点ID
  const generateNodeId = useCallback(() => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // 生成唯一的边ID
  const generateEdgeId = useCallback(() => {
    return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // 复制选中的节点和边
  const copySelected = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected)
    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))

    // 只复制连接选中节点之间的边
    const selectedEdges = edges.filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    )

    if (selectedNodes.length > 0) {
      copiedNodesRef.current = selectedNodes
      copiedEdgesRef.current = selectedEdges
      console.log(`已复制 ${selectedNodes.length} 个节点和 ${selectedEdges.length} 条边`)
    }
  }, [nodes, edges])

  // 粘贴节点和边
  const pasteSelected = useCallback(() => {
    if (copiedNodesRef.current.length === 0) {
      return
    }

    const reactFlowInstance = reactFlowInstanceRef.current
    if (!reactFlowInstance) {
      return
    }

    // 计算粘贴位置（在原始位置基础上偏移，避免重叠）
    const pastePosition = {
      x: PASTE_OFFSET,
      y: PASTE_OFFSET,
    }

    // 创建节点ID映射（旧ID -> 新ID）
    const nodeIdMap = {}
    copiedNodesRef.current.forEach((node) => {
      nodeIdMap[node.id] = generateNodeId()
    })

    // 创建新节点（更新ID和位置）
    const newNodes = copiedNodesRef.current.map((node) => ({
      ...node,
      id: nodeIdMap[node.id],
      position: {
        x: node.position.x + pastePosition.x,
        y: node.position.y + pastePosition.y,
      },
      selected: false, // 取消选中状态
    }))

    // 创建新边（更新ID和节点引用）
    const newEdges = copiedEdgesRef.current.map((edge) => ({
      ...edge,
      id: generateEdgeId(),
      source: nodeIdMap[edge.source],
      target: nodeIdMap[edge.target],
      selected: false,
    }))

    // 添加到画布
    setNodes((nds) => [...nds, ...newNodes])
    setEdges((eds) => [...eds, ...newEdges])

    console.log(`已粘贴 ${newNodes.length} 个节点和 ${newEdges.length} 条边`)
  }, [setNodes, setEdges, generateNodeId, generateEdgeId])

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 检查是否按下了 Ctrl/Cmd + C（复制）
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        // 确保焦点不在输入框中
        if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
          event.preventDefault()
          copySelected()
        }
      }

      // 检查是否按下了 Ctrl/Cmd + V（粘贴）
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        // 确保焦点不在输入框中
        if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
          event.preventDefault()
          pasteSelected()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [copySelected, pasteSelected])

  // 获取选中的节点数量
  const selectedNodesCount = nodes.filter((node) => node.selected).length

  return (
    <div
      className="w-full h-full relative"
      style={{ minHeight: 0 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance
        }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel
          position="top-left"
          className="bg-card border border-border rounded-lg shadow-lg p-4 space-y-2 min-w-[240px]"
        >
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">复制粘贴</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 选择节点后按 Ctrl+C (Mac: Cmd+C) 复制</p>
              <p>• 按 Ctrl+V (Mac: Cmd+V) 粘贴</p>
              <p>• 粘贴的节点会自动偏移位置</p>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">已选中节点:</span>
                <span className="text-xs font-semibold text-foreground">{selectedNodesCount}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">已复制节点:</span>
                <span className="text-xs font-semibold text-foreground">{copiedNodesRef.current.length}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-border space-y-2">
              <button
                onClick={copySelected}
                disabled={selectedNodesCount === 0}
                className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                复制选中节点 (Ctrl+C)
              </button>
              <button
                onClick={pasteSelected}
                disabled={copiedNodesRef.current.length === 0}
                className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                粘贴节点 (Ctrl+V)
              </button>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default CopyPaste

