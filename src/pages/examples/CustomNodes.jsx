/**
 * 自定义节点案例
 *
 * 这个案例展示了如何创建自定义样式的节点：
 * - 定义自定义节点组件
 * - 注册自定义节点类型
 * - 在节点数据中使用自定义类型
 */

import { useCallback } from "react"
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState } from "@xyflow/react"
import "@xyflow/react/dist/style.css"

// 自定义节点的样式
const customNodeStyle = {
  background: "#f0f0f0",
  border: "2px solid #222",
  borderRadius: "8px",
  padding: "10px",
}

/**
 * 自定义节点组件
 * @param {Object} props - 节点属性
 * @param {Object} props.data - 节点数据，包含 label 和 description
 */
const CustomNode = ({ data }) => {
  return (
    <div style={customNodeStyle}>
      <div className="font-bold text-lg">{data.label}</div>
      <div className="text-sm text-gray-600 mt-1">{data.description}</div>
    </div>
  )
}

// 注册自定义节点类型
// key 是节点类型名称，value 是节点组件
const nodeTypes = {
  custom: CustomNode,
}

// 初始节点数据
// type: "custom" 指定使用自定义节点类型
const initialNodes = [
  {
    id: "1",
    type: "custom", // 使用自定义节点类型
    position: { x: 0, y: 0 },
    data: {
      label: "自定义节点 1",
      description: "这是一个自定义样式的节点",
    },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 300, y: 0 },
    data: {
      label: "自定义节点 2",
      description: "支持自定义内容和样式",
    },
  },
  {
    id: "3",
    type: "custom",
    position: { x: 150, y: 150 },
    data: {
      label: "自定义节点 3",
      description: "可以添加任意内容",
    },
  },
]

const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-3", source: "2", target: "3" },
]

function CustomNodes() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

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
        onConnect={onConnect}
        nodeTypes={nodeTypes} // 传入自定义节点类型映射
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default CustomNodes
