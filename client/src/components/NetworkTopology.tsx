/**
 * Docker网络拓扑可视化组件
 * 使用React Flow展示网络和容器的关系图
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Box } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NodeDetailPanel from "./NodeDetailPanel";

// 自定义网络节点组件
const NetworkNode = ({ data }: { data: any }) => {
  return (
    <div className="px-6 py-4 rounded-lg border-2 border-blue-500 bg-blue-50 shadow-md min-w-[150px]">
      <div className="flex items-center gap-2 mb-2">
        <Network className="w-5 h-5 text-blue-600" />
        <div className="font-semibold text-blue-900">{data.label}</div>
      </div>
      <div className="space-y-1 text-xs">
        <Badge variant="secondary" className="text-xs">
          {data.driver}
        </Badge>
        {data.internal && (
          <Badge variant="outline" className="text-xs ml-1">
            内部
          </Badge>
        )}
      </div>
    </div>
  );
};

// 自定义容器节点组件
const ContainerNode = ({ data }: { data: any }) => {
  const getStatusColor = (status: string) => {
    if (status.includes("running")) return "bg-green-50 border-green-500 text-green-900";
    if (status.includes("exited")) return "bg-gray-50 border-gray-500 text-gray-900";
    return "bg-yellow-50 border-yellow-500 text-yellow-900";
  };

  return (
    <div className={`px-4 py-3 rounded-lg border-2 shadow-md min-w-[120px] ${getStatusColor(data.status)}`}>
      <div className="flex items-center gap-2 mb-1">
        <Box className="w-4 h-4" />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-70 truncate max-w-[150px]">
        {data.image}
      </div>
    </div>
  );
};

const nodeTypes = {
  network: NetworkNode,
  container: ContainerNode,
};

export default function NetworkTopology() {
  const { data: topologyData, isLoading } = trpc.network.topology.useQuery();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // 自动布局算法 - 将网络节点排列在左侧,容器节点排列在右侧
  const layoutNodes = useCallback((topologyNodes: any[], topologyEdges: any[]) => {
    const networkNodes = topologyNodes.filter((n) => n.type === "network");
    const containerNodes = topologyNodes.filter((n) => n.type === "container");

    const layoutedNodes: Node[] = [];
    const verticalSpacing = 120;
    const horizontalSpacing = 400;

    // 布局网络节点(左侧)
    networkNodes.forEach((node, index) => {
      layoutedNodes.push({
        id: node.id,
        type: "network",
        position: { x: 50, y: index * verticalSpacing + 50 },
        data: { ...node.data, label: node.label },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });

    // 布局容器节点(右侧)
    containerNodes.forEach((node, index) => {
      layoutedNodes.push({
        id: node.id,
        type: "container",
        position: { x: horizontalSpacing, y: index * verticalSpacing + 50 },
        data: { ...node.data, label: node.label },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });

    const layoutedEdges: Edge[] = topologyEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: { stroke: "#94a3b8", strokeWidth: 2 },
    }));

    return { nodes: layoutedNodes, edges: layoutedEdges };
  }, []);

  // 当拓扑数据更新时,重新布局
  useEffect(() => {
    if (topologyData) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutNodes(
        topologyData.nodes,
        topologyData.edges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [topologyData, layoutNodes, setNodes, setEdges]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>网络拓扑图</CardTitle>
          <CardDescription>可视化展示Docker网络和容器的连接关系</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topologyData || (topologyData.nodes.length === 0 && topologyData.edges.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>网络拓扑图</CardTitle>
          <CardDescription>可视化展示Docker网络和容器的连接关系</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] flex items-center justify-center text-muted-foreground">
            暂无网络或容器数据
          </div>
        </CardContent>
      </Card>
    );
  }

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="relative">
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>网络拓扑图</CardTitle>
            <CardDescription>可视化展示Docker网络和容器的连接关系</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600" />
              <span>{topologyData.nodes.filter((n: any) => n.type === "network").length} 个网络</span>
            </div>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-green-600" />
              <span>{topologyData.nodes.filter((n: any) => n.type === "container").length} 个容器</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] border rounded-lg overflow-hidden bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === "network") return "#3b82f6";
                return "#10b981";
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>💡 提示: 可以拖拽节点调整位置,使用鼠标滚轮缩放视图</p>
        </div>
      </CardContent>
    </Card>
    
    {/* 节点详情面板 */}
    {selectedNode && (
      <NodeDetailPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    )}
  </div>
  );
}
