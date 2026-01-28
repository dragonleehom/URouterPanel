/**
 * 网络拓扑编辑器组件
 * 使用React Flow实现可视化拓扑编辑
 * 支持拖拽创建节点和连接
 */

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  BackgroundVariant,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, Loader2 } from "lucide-react";
import { BridgeNode } from "./nodes/BridgeNode";
import { RouterNode } from "./nodes/RouterNode";
import { PhysicalNICNode } from "./nodes/PhysicalNICNode";
import { ContainerNode } from "./nodes/ContainerNode";
import { VMNode } from "./nodes/VMNode";

const nodeTypes = {
  bridge: BridgeNode,
  router: RouterNode,
  physicalNIC: PhysicalNICNode,
  container: ContainerNode,
  vm: VMNode,
};

interface NetworkTopologyEditorProps {
  networkId: number;
}

export function NetworkTopologyEditor({ networkId }: NetworkTopologyEditorProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // 获取拓扑数据
  const { data: topology, isLoading } = trpc.virtualNetwork.getTopology.useQuery({
    networkId,
  });

  // 保存拓扑数据
  const saveMutation = trpc.virtualNetwork.saveTopology.useMutation({
    onSuccess: () => {
      alert("拓扑已保存");
    },
    onError: (error) => {
      alert(`保存失败: ${error.message}`);
    },
  });

  // 加载拓扑数据
  useEffect(() => {
    if (topology) {
      setNodes(topology.nodes || []);
      setEdges(topology.edges || []);
    }
  }, [topology]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const handleSave = () => {
    saveMutation.mutate({
      networkId,
      topologyData: { nodes, edges },
    });
  };

  const addBridgeNode = () => {
    const newNode: Node = {
      id: `bridge-${Date.now()}`,
      type: "bridge",
      position: { x: 250, y: 100 },
      data: { label: "虚拟交换机" },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addRouterNode = () => {
    const newNode: Node = {
      id: `router-${Date.now()}`,
      type: "router",
      position: { x: 250, y: 200 },
      data: { label: "虚拟路由器" },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addPhysicalNICNode = () => {
    const newNode: Node = {
      id: `nic-${Date.now()}`,
      type: "physicalNIC",
      position: { x: 250, y: 300 },
      data: { label: "物理网卡", nicName: "eth0" },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={addBridgeNode}>
          <Plus className="w-4 h-4 mr-1" />
          虚拟交换机
        </Button>
        <Button size="sm" variant="outline" onClick={addRouterNode}>
          <Plus className="w-4 h-4 mr-1" />
          虚拟路由器
        </Button>
        <Button size="sm" variant="outline" onClick={addPhysicalNICNode}>
          <Plus className="w-4 h-4 mr-1" />
          物理网卡
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          保存拓扑
        </Button>
      </div>

      {/* React Flow画布 */}
      <div className="h-[600px] border rounded-lg bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-1">
          <p>• 点击工具栏按钮添加网络组件</p>
          <p>• 拖拽节点调整位置</p>
          <p>• 从节点边缘拖拽创建连接</p>
          <p>• 点击节点或连接后按Delete键删除</p>
          <p>• 完成编辑后点击"保存拓扑"按钮</p>
        </CardContent>
      </Card>
    </div>
  );
}
