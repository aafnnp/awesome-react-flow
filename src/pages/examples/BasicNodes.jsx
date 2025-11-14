/**
 * 基础节点案例
 *
 * 这个案例展示了 React Flow 的基础功能：
 * - 创建节点和边（连接）
 * - 使用内置的 input/output 节点类型
 * - 处理节点和边的变化事件
 * - 连接节点
 */

import { useCallback } from "react"
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState } from "@xyflow/react"
import "@xyflow/react/dist/style.css"

// 定义初始节点数据
// 每个节点需要 id、position 和 data 属性
// type: 'input' 表示输入节点（只有输出连接点）
// type: 'output' 表示输出节点（只有输入连接点）
const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "开始节点" },
    type: "input", // 输入节点类型，只有输出连接点
  },
  {
    id: "2",
    position: { x: 200, y: 0 },
    data: { label: "处理节点" },
    // 默认节点类型，有输入和输出连接点
  },
  {
    id: "3",
    position: { x: 400, y: 0 },
    data: { label: "结束节点" },
    type: "output", // 输出节点类型，只有输入连接点
  },
]

// 定义初始边（连接）数据
// source: 源节点 id
// target: 目标节点 id
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
]

function BasicNodes() {
  // useNodesState: 管理节点状态的 hook
  // 返回 [nodes, setNodes, onNodesChange]
  // onNodesChange 用于处理节点的拖拽、选择等变化
  const [nodes, , onNodesChange] = useNodesState(initialNodes)

  // useEdgesState: 管理边（连接）状态的 hook
  // 返回 [edges, setEdges, onEdgesChange]
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // onConnect: 当用户连接两个节点时触发
  // addEdge: 工具函数，用于添加新的边到边数组中
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  return (
    <div
      className="w-full h-full"
      style={{ minHeight: 0 }}
    >
      {/* ReactFlow 主组件 */}
      <ReactFlow
        nodes={nodes} // 节点数组
        edges={edges} // 边数组
        onNodesChange={onNodesChange} // 节点变化处理函数
        onEdgesChange={onEdgesChange} // 边变化处理函数
        onConnect={onConnect} // 连接处理函数
        fitView // 自动调整视图以适应所有节点
      >
        {/* Background: 背景网格 */}
        <Background />
        {/* Controls: 缩放、适应视图等控制按钮 */}
        <Controls />
        {/* MiniMap: 小地图，显示整个流程的缩略图 */}
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default BasicNodes
