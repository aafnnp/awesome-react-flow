/**
 * 自动布局案例
 *
 * 这个案例展示了如何实现自动布局功能：
 * - 使用 Dagre 算法自动计算节点位置
 * - 支持多种布局方向（TB: 从上到下, LR: 从左到右, BT: 从下到上, RL: 从右到左）
 * - 支持运行时切换布局方向
 * - 结合动画效果，平滑过渡到新布局
 * - 提供可复用的 useAutoLayout hook
 *
 * 参考：https://pro-examples.reactflow.dev/auto-layout
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from "@xyflow/react"
import { timer } from "d3-timer"
import dagre from "dagre"
import "@xyflow/react/dist/style.css"

/**
 * 线性插值函数
 * @param {number} a - 起始值
 * @param {number} b - 目标值
 * @param {number} t - 插值系数 (0-1)
 * @returns {number} 插值结果
 */
const lerp = (a, b, t) => a + (b - a) * t

/**
 * 使用 Dagre 算法计算节点布局
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @param {string} direction - 布局方向：TB (从上到下), LR (从左到右), BT (从下到上), RL (从右到左)
 * @param {Object} options - 布局选项
 * @returns {Array} 布局后的节点数组
 */
const getLayoutedNodes = (nodes, edges, direction = "TB", options = {}) => {
  const { nodeWidth = 150, nodeHeight = 50, ranksep = 50, nodesep = 50 } = options

  // 创建 Dagre 图实例
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep, // 层级间距
    nodesep, // 节点间距
  })

  // 为每个节点设置尺寸
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  // 添加边到图中
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // 执行布局计算
  dagre.layout(dagreGraph)

  // 更新节点的位置和连接点位置
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)

    // 根据布局方向设置连接点位置
    let targetPosition, sourcePosition
    switch (direction) {
      case "TB": // 从上到下
        targetPosition = "top"
        sourcePosition = "bottom"
        break
      case "BT": // 从下到上
        targetPosition = "bottom"
        sourcePosition = "top"
        break
      case "LR": // 从左到右
        targetPosition = "left"
        sourcePosition = "right"
        break
      case "RL": // 从右到左
        targetPosition = "right"
        sourcePosition = "left"
        break
      default:
        targetPosition = "top"
        sourcePosition = "bottom"
    }

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      targetPosition,
      sourcePosition,
    }
  })
}

/**
 * 自定义 Hook：自动布局
 * @param {Array} nodes - 当前节点数组
 * @param {Array} edges - 边数组
 * @param {string} direction - 布局方向
 * @param {Function} setNodes - 更新节点的函数
 * @param {Object} options - 布局选项
 * @param {boolean} animated - 是否启用动画，默认 true
 * @param {number} duration - 动画持续时间（毫秒），默认 800ms
 */
const useAutoLayout = (nodes, edges, direction, setNodes, options = {}, animated = true, duration = 800) => {
  const timerRef = useRef(null)
  const startNodesRef = useRef(null)
  const previousDirectionRef = useRef(null)
  const currentNodesRef = useRef(nodes)

  // 同步更新当前节点引用
  useEffect(() => {
    currentNodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    // 检查方向是否真的发生了变化
    if (previousDirectionRef.current === direction) {
      return
    }

    // 更新方向引用
    previousDirectionRef.current = direction

    // 停止之前的动画
    if (timerRef.current) {
      timerRef.current.stop()
    }

    // 获取当前节点（使用 ref 避免依赖项问题）
    const currentNodes = currentNodesRef.current

    // 如果没有节点，不执行布局
    if (!currentNodes || currentNodes.length === 0) {
      return
    }

    // 计算目标布局（基于当前节点数据，但重新计算位置）
    const targetNodes = getLayoutedNodes(currentNodes, edges, direction, options)

    // 如果不启用动画，直接设置布局
    if (!animated) {
      setNodes(targetNodes)
      return
    }

    // 记录起始节点（使用当前的节点状态）
    startNodesRef.current = currentNodesRef.current.map((node) => ({
      ...node,
      position: { ...node.position },
    }))

    // 使用 d3-timer 创建平滑的动画循环
    timerRef.current = timer((elapsed) => {
      const progress = Math.min(elapsed / duration, 1)

      // 对每个节点进行线性插值
      setNodes((nds) =>
        nds.map((node) => {
          const targetNode = targetNodes.find((n) => n.id === node.id)
          const startNode = startNodesRef.current.find((n) => n.id === node.id)

          if (!targetNode || !startNode) {
            return node
          }

          return {
            ...node,
            position: {
              x: lerp(startNode.position.x, targetNode.position.x, progress),
              y: lerp(startNode.position.y, targetNode.position.y, progress),
            },
            // 立即更新连接点位置（不需要动画）
            targetPosition: targetNode.targetPosition,
            sourcePosition: targetNode.sourcePosition,
          }
        })
      )

      // 动画完成时停止定时器
      if (progress >= 1) {
        if (timerRef.current) {
          timerRef.current.stop()
        }
        // 确保最终位置精确
        setNodes(targetNodes)
      }
    })

    return () => {
      if (timerRef.current) {
        timerRef.current.stop()
      }
    }
  }, [direction, edges, setNodes, options, animated, duration])
}

// 布局方向选项
const LAYOUT_DIRECTIONS = [
  { value: "TB", label: "从上到下 (TB)" },
  { value: "LR", label: "从左到右 (LR)" },
  { value: "BT", label: "从下到上 (BT)" },
  { value: "RL", label: "从右到左 (RL)" },
]

// 初始节点数据（不包含位置信息，位置将由自动布局计算）
const initialNodes = [
  { id: "1", data: { label: "开始" } },
  { id: "2", data: { label: "处理 A" } },
  { id: "3", data: { label: "处理 B" } },
  { id: "4", data: { label: "处理 C" } },
  { id: "5", data: { label: "处理 D" } },
  { id: "6", data: { label: "合并" } },
  { id: "7", data: { label: "结束" } },
]

// 定义节点之间的连接关系
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-5", source: "3", target: "5" },
  { id: "e4-6", source: "4", target: "6" },
  { id: "e5-6", source: "5", target: "6" },
  { id: "e6-7", source: "6", target: "7" },
]

function AutoLayout() {
  const [direction, setDirection] = useState("TB")
  const [animated, setAnimated] = useState(true)

  // 初始化节点状态
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // 布局选项
  const layoutOptions = useMemo(
    () => ({
      nodeWidth: 150,
      nodeHeight: 50,
      ranksep: 50,
      nodesep: 50,
    }),
    []
  )

  // 初始化节点（首次加载时）
  useEffect(() => {
    if (nodes.length === 0) {
      const layoutedNodes = getLayoutedNodes(initialNodes, initialEdges, direction, layoutOptions)
      setNodes(layoutedNodes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  // 使用自动布局 hook
  useAutoLayout(nodes, edges, direction, setNodes, layoutOptions, animated, 800)

  // 切换布局方向
  const handleDirectionChange = useCallback((newDirection) => {
    setDirection(newDirection)
  }, [])

  // 切换动画
  const toggleAnimation = useCallback(() => {
    setAnimated((prev) => !prev)
  }, [])

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
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* 控制面板 */}
      <div className="absolute top-4 left-4 z-10 bg-card border border-border rounded-lg shadow-lg p-4 space-y-4 min-w-[240px]">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">布局方向</h3>
          <div className="space-y-2">
            {LAYOUT_DIRECTIONS.map((layout) => (
              <button
                key={layout.value}
                onClick={() => handleDirectionChange(layout.value)}
                className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  direction === layout.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {layout.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">动画</h3>
          <button
            onClick={toggleAnimation}
            className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
              animated ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {animated ? "✓ 启用动画" : "✗ 禁用动画"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AutoLayout
