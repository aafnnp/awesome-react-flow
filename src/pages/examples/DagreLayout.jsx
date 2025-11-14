/**
 * Dagre 自动布局案例
 *
 * 这个案例展示了如何使用 Dagre 算法自动排列节点：
 * - 使用 dagre 库计算节点位置
 * - 根据边的连接关系自动布局
 * - 支持不同的布局方向（TB: 从上到下）
 */

import { useLayoutEffect } from "react"
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from "@xyflow/react"
import dagre from "dagre"
import "@xyflow/react/dist/style.css"

/**
 * 使用 Dagre 算法计算节点布局
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @param {string} direction - 布局方向，默认为 "TB" (Top to Bottom)
 * @returns {Object} 包含布局后的 nodes 和 edges
 */
const getLayoutedElements = (nodes, edges, direction = "TB") => {
  // 创建 Dagre 图实例
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction }) // 设置布局方向：TB (从上到下), LR (从左到右) 等

  // 为每个节点设置尺寸
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 })
  })

  // 添加边到图中
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // 执行布局计算
  dagre.layout(dagreGraph)

  // 更新节点的位置和连接点位置
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    // 设置连接点位置：顶部输入，底部输出
    node.targetPosition = "top"
    node.sourcePosition = "bottom"
    // 设置节点位置（居中）
    node.position = {
      x: nodeWithPosition.x - 75, // 减去节点宽度的一半
      y: nodeWithPosition.y - 25, // 减去节点高度的一半
    }
  })

  return { nodes, edges }
}

// 初始节点数据（不包含位置信息，位置将由 Dagre 计算）
const initialNodes = [
  { id: "1", data: { label: "开始" } },
  { id: "2", data: { label: "处理 A" } },
  { id: "3", data: { label: "处理 B" } },
  { id: "4", data: { label: "处理 C" } },
  { id: "5", data: { label: "结束" } },
]

// 定义节点之间的连接关系
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
]

function DagreLayout() {
  // 初始状态为空数组，将在 useLayoutEffect 中设置
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 在组件挂载时计算布局
  // useLayoutEffect 确保在 DOM 更新前执行
  useLayoutEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [setNodes, setEdges])

  return (
    <div
      className="w-full h-full"
      style={{ minHeight: 0 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default DagreLayout
