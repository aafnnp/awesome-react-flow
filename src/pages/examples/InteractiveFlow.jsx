/**
 * 交互式流程图案例
 *
 * 这个案例展示了如何实现交互功能：
 * - 点击节点选择
 * - 动态添加节点
 * - 删除选中的节点及其连接
 * - 使用 Panel 组件添加控制面板
 */

import { useCallback, useState } from "react"
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, Panel } from "@xyflow/react"
import "@xyflow/react/dist/style.css"

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
    position: { x: 500, y: 100 },
    data: { label: "节点 3" },
  },
]

const initialEdges = []

function InteractiveFlow() {
  // 使用 setNodes 来动态添加/删除节点
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 跟踪当前选中的节点
  const [selectedNode, setSelectedNode] = useState(null)

  // 处理节点连接
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  // 处理节点点击事件
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  // 添加新节点
  // 随机位置生成新节点
  const addNode = useCallback(() => {
    const newNode = {
      id: `${nodes.length + 1}`,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { label: `节点 ${nodes.length + 1}` },
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes.length, setNodes])

  // 删除选中的节点
  // 同时删除与该节点相关的所有边
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      // 删除节点
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
      // 删除与该节点相关的所有边
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))
      setSelectedNode(null)
    }
  }, [selectedNode, setNodes, setEdges])

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
        onConnect={onConnect}
        onNodeClick={onNodeClick} // 节点点击事件处理
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        {/* Panel: 在画布上添加控制面板 */}
        <Panel
          position="top-left"
          className="bg-white p-4 rounded shadow"
        >
          <div className="space-y-2">
            <button
              onClick={addNode}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              添加节点
            </button>
            {/* 显示选中节点的信息和删除按钮 */}
            {selectedNode && (
              <div className="mt-2">
                <p className="text-sm font-semibold">选中节点: {selectedNode.data.label}</p>
                <button
                  onClick={deleteSelectedNode}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  删除节点
                </button>
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default InteractiveFlow
