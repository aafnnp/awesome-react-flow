/**
 * 节点位置动画案例
 *
 * 这个案例展示了如何创建流畅的节点位置动画：
 * - 使用线性插值（lerp）实现平滑的位置过渡
 * - 在不同布局之间切换时，节点会平滑地移动到新位置
 * - 使用 d3-timer 来驱动平滑的动画循环（与官方示例一致）
 * - 实现了可复用的 useAnimatedNodes hook
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from "@xyflow/react"
import { timer } from "d3-timer"
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
 * 自定义 Hook：动画化节点位置
 * 参考官方 Pro 示例实现：https://pro-examples.reactflow.dev/node-position-animation
 * @param {Array} nodes - 当前节点数组
 * @param {Array} targetNodes - 目标节点数组（包含目标位置）
 * @param {Function} setNodes - 更新节点的函数
 * @param {number} duration - 动画持续时间（毫秒），默认 800ms
 */
const useAnimatedNodes = (nodes, targetNodes, setNodes, duration = 800) => {
  const timerRef = useRef(null)
  const startNodesRef = useRef(null)
  const previousTargetNodesRef = useRef(null)
  const currentNodesRef = useRef(nodes)

  // 同步更新当前节点引用
  useEffect(() => {
    currentNodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    // 检查目标节点是否真的发生了变化
    const targetChanged =
      !previousTargetNodesRef.current ||
      previousTargetNodesRef.current.length !== targetNodes.length ||
      previousTargetNodesRef.current.some(
        (node, i) =>
          !targetNodes[i] ||
          node.id !== targetNodes[i].id ||
          node.position.x !== targetNodes[i].position.x ||
          node.position.y !== targetNodes[i].position.y
      )

    if (!targetChanged) {
      return
    }

    // 更新目标节点引用
    previousTargetNodesRef.current = targetNodes

    // 停止之前的动画
    if (timerRef.current) {
      timerRef.current.stop()
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
            // 保持目标节点的其他属性（如 targetPosition, sourcePosition）
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
  }, [targetNodes, duration, setNodes])
}

/**
 * 计算水平布局的节点位置
 * @param {Array} nodes - 节点数组
 * @returns {Array} 布局后的节点数组
 */
const getHorizontalLayout = (nodes) => {
  const spacing = 200
  const startX = 100
  const startY = 100

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: startX + index * spacing,
      y: startY,
    },
    targetPosition: "left",
    sourcePosition: "right",
  }))
}

/**
 * 计算垂直布局的节点位置
 * @param {Array} nodes - 节点数组
 * @returns {Array} 布局后的节点数组
 */
const getVerticalLayout = (nodes) => {
  const spacing = 150
  const startX = 300
  const startY = 100

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: startX,
      y: startY + index * spacing,
    },
    targetPosition: "top",
    sourcePosition: "bottom",
  }))
}

// 初始节点数据
const initialNodes = [
  { id: "1", data: { label: "节点 1" } },
  { id: "2", data: { label: "节点 2" } },
  { id: "3", data: { label: "节点 3" } },
  { id: "4", data: { label: "节点 4" } },
  { id: "5", data: { label: "节点 5" } },
]

// 定义节点之间的连接关系
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
]

function NodePositionAnimation() {
  const [layout, setLayout] = useState("horizontal") // 'horizontal' 或 'vertical'

  // 初始化节点状态，使用水平布局作为初始状态
  const initialNodesForState = useMemo(() => getHorizontalLayout(initialNodes), [])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesForState)
  const [, , onEdgesChange] = useEdgesState(initialEdges)

  // 使用 useMemo 确保 targetNodes 的引用变化能被正确检测
  const targetNodes = useMemo(
    () => (layout === "horizontal" ? getHorizontalLayout(initialNodes) : getVerticalLayout(initialNodes)),
    [layout]
  )

  // 使用动画 hook（与官方 Pro 示例一致，使用 800ms 持续时间）
  useAnimatedNodes(nodes, targetNodes, setNodes, 800)

  // 切换布局
  const toggleLayout = useCallback(() => {
    setLayout((prev) => (prev === "horizontal" ? "vertical" : "horizontal"))
  }, [])

  return (
    <div
      className="w-full h-full relative"
      style={{ minHeight: 0 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={initialEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* 切换布局按钮 */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={toggleLayout}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90 transition-colors font-medium"
        >
          切换布局 ({layout === "horizontal" ? "水平" : "垂直"})
        </button>
      </div>
    </div>
  )
}

export default NodePositionAnimation
