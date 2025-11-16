/**
 * 动态布局案例
 *
 * 这个案例展示了如何实现动态布局功能：
 * - 当新增节点时，自动重新计算布局
 * - 当添加或删除边时，自动重新布局
 * - 使用 Dagre 算法自动计算节点位置
 * - 支持平滑的动画过渡
 * - 提供添加节点和连接节点的功能
 *
 * 参考：https://pro-examples.reactflow.dev/dynamic-layouting
 */

import { useState, useLayoutEffect, useRef, useCallback, useMemo } from "react"
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Panel, addEdge } from "@xyflow/react"
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

  // 如果没有节点，返回空数组
  if (!nodes || nodes.length === 0) {
    return []
  }

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

    // 安全检查：如果 dagre 没有计算位置，使用默认位置
    if (!nodeWithPosition || nodeWithPosition.x === undefined || nodeWithPosition.y === undefined) {
      console.warn(`节点 ${node.id} 没有计算位置，使用默认位置`)
      return {
        ...node,
        position: node.position || { x: 0, y: 0 },
        targetPosition: "top",
        sourcePosition: "bottom",
      }
    }

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

// 布局方向选项
const LAYOUT_DIRECTIONS = [
  { value: "TB", label: "从上到下 (TB)" },
  { value: "LR", label: "从左到右 (LR)" },
  { value: "BT", label: "从下到上 (BT)" },
  { value: "RL", label: "从右到左 (RL)" },
]

// 初始节点数据
const initialNodes = [
  { id: "1", data: { label: "开始" } },
  { id: "2", data: { label: "处理 A" } },
  { id: "3", data: { label: "处理 B" } },
]

// 初始边数据
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
]

function DynamicLayout() {
  const [direction, setDirection] = useState("TB")
  const [animated, setAnimated] = useState(true)
  const [nodeCounter, setNodeCounter] = useState(4)

  // 初始化节点和边状态
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 动画相关引用
  const timerRef = useRef(null)
  const startNodesRef = useRef(null)
  const isLayoutingRef = useRef(false)
  const previousNodesIdsRef = useRef("")
  const previousEdgesIdsRef = useRef("")

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

  // 应用布局（带动画）
  const applyLayout = useCallback(
    (targetNodes, targetEdges, animatedTransition = true) => {
      // 如果正在布局，停止之前的动画
      if (timerRef.current) {
        timerRef.current.stop()
      }

      // 如果没有节点，不执行布局
      if (!targetNodes || targetNodes.length === 0) {
        return
      }

      // 计算目标布局
      const layoutedNodes = getLayoutedNodes(targetNodes, targetEdges, direction, layoutOptions)

      // 如果不启用动画，直接设置布局
      if (!animatedTransition || !animated) {
        setNodes(layoutedNodes)
        isLayoutingRef.current = false
        return
      }

      // 记录起始节点
      startNodesRef.current = targetNodes.map((node) => ({
        ...node,
        position: { ...node.position },
      }))

      isLayoutingRef.current = true
      const duration = 800

      // 使用 d3-timer 创建平滑的动画循环
      timerRef.current = timer((elapsed) => {
        const progress = Math.min(elapsed / duration, 1)

        // 对每个节点进行线性插值
        setNodes((nds) =>
          nds.map((node) => {
            const targetNode = layoutedNodes.find((n) => n.id === node.id)
            const startNode = startNodesRef.current.find((n) => n.id === node.id)

            if (!targetNode) {
              return node
            }

            // 如果是新节点或起始节点没有位置，直接使用目标位置
            if (!startNode || !startNode.position || startNode.position.x === undefined) {
              return {
                ...node,
                ...targetNode,
              }
            }

            // 确保目标节点有有效位置
            if (!targetNode.position || targetNode.position.x === undefined) {
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
          setNodes(layoutedNodes)
          isLayoutingRef.current = false
        }
      })
    },
    [direction, layoutOptions, animated, setNodes]
  )

  // 初始化节点（首次加载时）
  useLayoutEffect(() => {
    if (nodes.length === 0) {
      const layoutedNodes = getLayoutedNodes(initialNodes, initialEdges, direction, layoutOptions)
      setNodes(layoutedNodes)
      setEdges(initialEdges)
      // 更新引用，避免触发重新布局
      previousNodesIdsRef.current = initialNodes.map((n) => n.id).join(",")
      previousEdgesIdsRef.current = initialEdges.map((e) => `${e.source}-${e.target}`).join(",")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  // 当节点或边发生变化时，自动重新布局
  // 使用 useLayoutEffect 确保在渲染前计算布局
  useLayoutEffect(() => {
    // 如果正在布局动画中，不触发新的布局
    if (isLayoutingRef.current) {
      return
    }

    // 如果节点为空，不执行布局
    if (nodes.length === 0) {
      return
    }

    // 生成节点和边的 ID 字符串用于比较
    const currentNodesIds = nodes.map((n) => n.id).join(",")
    const currentEdgesIds = edges.map((e) => `${e.source}-${e.target}`).join(",")

    // 检查节点或边是否发生变化
    const nodesChanged = currentNodesIds !== previousNodesIdsRef.current
    const edgesChanged = currentEdgesIds !== previousEdgesIdsRef.current

    // 只有当节点或边发生变化时才重新布局
    if (nodesChanged || edgesChanged) {
      // 更新引用
      previousNodesIdsRef.current = currentNodesIds
      previousEdgesIdsRef.current = currentEdgesIds

      // 触发布局
      applyLayout(nodes, edges, true)
    }
  }, [nodes, edges, applyLayout]) // 监听节点和边的变化

  // 当布局方向改变时，重新布局
  useLayoutEffect(() => {
    if (nodes.length > 0 && !isLayoutingRef.current) {
      applyLayout(nodes, edges, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction])

  // 添加新节点
  const addNode = useCallback(() => {
    const newNode = {
      id: `${nodeCounter}`,
      data: { label: `节点 ${nodeCounter}` },
      // 给新节点一个临时位置，避免渲染错误
      // 布局会在 useEffect 中自动应用
      position: { x: 0, y: 0 },
    }
    setNodes((nds) => [...nds, newNode])
    setNodeCounter((prev) => prev + 1)
  }, [nodeCounter, setNodes])

  // 删除选中的节点
  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected)
    if (selectedNodes.length === 0) {
      return
    }

    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))

    // 删除选中的节点
    setNodes((nds) => nds.filter((node) => !node.selected))

    // 删除与选中节点相关的所有边
    setEdges((eds) => eds.filter((edge) => !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target)))
  }, [nodes, setNodes, setEdges])

  // 处理节点连接
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  // 切换布局方向
  const handleDirectionChange = useCallback((newDirection) => {
    setDirection(newDirection)
  }, [])

  // 切换动画
  const toggleAnimation = useCallback(() => {
    setAnimated((prev) => !prev)
  }, [])

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
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />

        {/* 控制面板 */}
        <Panel
          position="top-left"
          className="bg-card border border-border rounded-lg shadow-lg p-4 space-y-4 min-w-[240px]"
        >
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">动态布局</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 点击"添加节点"按钮添加新节点</p>
              <p>• 拖拽节点之间的连接点创建连接</p>
              <p>• 新增节点或连接时自动重新布局</p>
              <p>• 选择节点后点击"删除节点"删除</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <button
              onClick={addNode}
              className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              添加节点
            </button>
            <button
              onClick={deleteSelectedNodes}
              disabled={selectedNodesCount === 0}
              className="w-full px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              删除选中节点 ({selectedNodesCount})
            </button>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
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

          <div className="pt-2 border-t border-border space-y-2">
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

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">节点数量:</span>
              <span className="text-xs font-semibold text-foreground">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">边数量:</span>
              <span className="text-xs font-semibold text-foreground">{edges.length}</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default DynamicLayout
