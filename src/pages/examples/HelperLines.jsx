/**
 * Helper Lines 辅助线案例
 *
 * 这个案例展示了如何在拖拽节点时显示辅助对齐线：
 * - 检测节点之间的水平和垂直对齐
 * - 在拖拽时显示辅助线
 * - 自动吸附到对齐位置
 * - 参考官方 Pro 示例：https://pro-examples.reactflow.dev/helper-lines
 */

import { useState, useCallback, useEffect } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

// 对齐阈值（像素），在这个范围内认为是对齐的
const SNAP_THRESHOLD = 5

// 默认节点尺寸
const DEFAULT_NODE_WIDTH = 150
const DEFAULT_NODE_HEIGHT = 40

// 辅助线组件 - 使用画布坐标系
function HelperLines({ horizontal, vertical }) {
  const { getViewport } = useReactFlow()
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })

  // 更新视口状态
  useEffect(() => {
    const updateViewport = () => {
      setViewport(getViewport())
    }
    updateViewport()
    // 使用 requestAnimationFrame 定期更新视口
    let rafId = requestAnimationFrame(function update() {
      updateViewport()
      rafId = requestAnimationFrame(update)
    })
    return () => cancelAnimationFrame(rafId)
  }, [getViewport])

  if (!horizontal && !vertical) {
    return null
  }

  // 将画布坐标转换为屏幕坐标
  const toScreenCoord = (x, y) => ({
    x: x * viewport.zoom + viewport.x,
    y: y * viewport.zoom + viewport.y,
  })

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 1, width: "100%", height: "100%" }}
    >
      {horizontal && (
        <line
          x1={toScreenCoord(horizontal.x1, horizontal.y).x}
          y1={toScreenCoord(horizontal.x1, horizontal.y).y}
          x2={toScreenCoord(horizontal.x2, horizontal.y).x}
          y2={toScreenCoord(horizontal.x2, horizontal.y).y}
          stroke="#ff0072"
          strokeWidth={1}
          strokeDasharray="5,5"
        />
      )}
      {vertical && (
        <line
          x1={toScreenCoord(vertical.x, vertical.y1).x}
          y1={toScreenCoord(vertical.x, vertical.y1).y}
          x2={toScreenCoord(vertical.x, vertical.y2).x}
          y2={toScreenCoord(vertical.x, vertical.y2).y}
          stroke="#ff0072"
          strokeWidth={1}
          strokeDasharray="5,5"
        />
      )}
    </svg>
  )
}

// 初始节点数据
const initialNodes = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: { label: "节点 1" },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  },
  {
    id: "2",
    position: { x: 300, y: 200 },
    data: { label: "节点 2" },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  },
  {
    id: "3",
    position: { x: 500, y: 100 },
    data: { label: "节点 3" },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  },
  {
    id: "4",
    position: { x: 100, y: 300 },
    data: { label: "节点 4" },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  },
  {
    id: "5",
    position: { x: 500, y: 300 },
    data: { label: "节点 5" },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  },
]

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2-3", source: "2", target: "3", markerEnd: { type: MarkerType.ArrowClosed } },
]

function HelperLinesExample() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 辅助线状态（使用画布坐标系）
  const [helperLines, setHelperLines] = useState({
    horizontal: null,
    vertical: null,
  })

  // 获取节点的边界框（画布坐标系）
  const getNodeBounds = useCallback((node) => {
    const width = node.width || DEFAULT_NODE_WIDTH
    const height = node.height || DEFAULT_NODE_HEIGHT

    return {
      left: node.position.x,
      right: node.position.x + width,
      top: node.position.y,
      bottom: node.position.y + height,
      centerX: node.position.x + width / 2,
      centerY: node.position.y + height / 2,
    }
  }, [])

  // 检查对齐并计算辅助线
  const checkAlignment = useCallback(
    (draggedNode) => {
      const draggedBounds = getNodeBounds(draggedNode)
      let horizontalLine = null
      let verticalLine = null
      let snapX = null
      let snapY = null

      // 检查与其他节点的对齐
      for (const node of nodes) {
        if (node.id === draggedNode.id || !node.position) continue

        const nodeBounds = getNodeBounds(node)

        // 检查水平对齐（顶部、中心、底部）
        const topDiff = Math.abs(draggedBounds.top - nodeBounds.top)
        const centerYDiff = Math.abs(draggedBounds.centerY - nodeBounds.centerY)
        const bottomDiff = Math.abs(draggedBounds.bottom - nodeBounds.bottom)

        if (topDiff < SNAP_THRESHOLD) {
          snapY = nodeBounds.top
          horizontalLine = {
            y: nodeBounds.top,
            x1: Math.min(draggedBounds.left, nodeBounds.left) - 50,
            x2: Math.max(draggedBounds.right, nodeBounds.right) + 50,
          }
        } else if (centerYDiff < SNAP_THRESHOLD) {
          snapY = nodeBounds.centerY - (draggedNode.height || DEFAULT_NODE_HEIGHT) / 2
          horizontalLine = {
            y: nodeBounds.centerY,
            x1: Math.min(draggedBounds.left, nodeBounds.left) - 50,
            x2: Math.max(draggedBounds.right, nodeBounds.right) + 50,
          }
        } else if (bottomDiff < SNAP_THRESHOLD) {
          snapY = nodeBounds.bottom - (draggedNode.height || DEFAULT_NODE_HEIGHT)
          horizontalLine = {
            y: nodeBounds.bottom,
            x1: Math.min(draggedBounds.left, nodeBounds.left) - 50,
            x2: Math.max(draggedBounds.right, nodeBounds.right) + 50,
          }
        }

        // 检查垂直对齐（左侧、中心、右侧）
        const leftDiff = Math.abs(draggedBounds.left - nodeBounds.left)
        const centerXDiff = Math.abs(draggedBounds.centerX - nodeBounds.centerX)
        const rightDiff = Math.abs(draggedBounds.right - nodeBounds.right)

        if (leftDiff < SNAP_THRESHOLD) {
          snapX = nodeBounds.left
          verticalLine = {
            x: nodeBounds.left,
            y1: Math.min(draggedBounds.top, nodeBounds.top) - 50,
            y2: Math.max(draggedBounds.bottom, nodeBounds.bottom) + 50,
          }
        } else if (centerXDiff < SNAP_THRESHOLD) {
          snapX = nodeBounds.centerX - (draggedNode.width || DEFAULT_NODE_WIDTH) / 2
          verticalLine = {
            x: nodeBounds.centerX,
            y1: Math.min(draggedBounds.top, nodeBounds.top) - 50,
            y2: Math.max(draggedBounds.bottom, nodeBounds.bottom) + 50,
          }
        } else if (rightDiff < SNAP_THRESHOLD) {
          snapX = nodeBounds.right - (draggedNode.width || DEFAULT_NODE_WIDTH)
          verticalLine = {
            x: nodeBounds.right,
            y1: Math.min(draggedBounds.top, nodeBounds.top) - 50,
            y2: Math.max(draggedBounds.bottom, nodeBounds.bottom) + 50,
          }
        }
      }

      setHelperLines({
        horizontal: horizontalLine,
        vertical: verticalLine,
      })

      // 返回对齐位置（用于吸附）
      return {
        x: snapX,
        y: snapY,
      }
    },
    [nodes, getNodeBounds]
  )

  // 处理节点拖拽
  const onNodeDrag = useCallback(
    (event, node) => {
      const alignment = checkAlignment(node)

      // 如果检测到对齐，自动吸附
      if (alignment.x !== null || alignment.y !== null) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                position: {
                  x: alignment.x !== null ? alignment.x : n.position.x,
                  y: alignment.y !== null ? alignment.y : n.position.y,
                },
              }
            }
            return n
          })
        )
      }
    },
    [checkAlignment, setNodes]
  )

  // 拖拽结束时清除辅助线
  const onNodeDragStop = useCallback(() => {
    setHelperLines({
      horizontal: null,
      vertical: null,
    })
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
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <HelperLines
          horizontal={helperLines.horizontal}
          vertical={helperLines.vertical}
        />
      </ReactFlow>
    </div>
  )
}

export default HelperLinesExample
