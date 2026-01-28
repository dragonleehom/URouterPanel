import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Route as RouteIcon,
  Plus,
  Trash2,
  RefreshCw,
  Network,
  Globe,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function RoutingManagement() {
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [gatewayDialogOpen, setGatewayDialogOpen] = useState(false);

  // 获取路由表
  const { data: routes, isLoading: routesLoading, refetch: refetchRoutes } = 
    trpc.routes.list.useQuery();

  // 获取默认网关
  const { data: defaultGateway, refetch: refetchGateway } = 
    trpc.routes.getDefaultGateway.useQuery();

  // 获取ARP表
  const { data: neighbors, refetch: refetchNeighbors } = 
    trpc.routes.getArpTable.useQuery();

  // 添加路由mutation
  const addRouteMutation = trpc.routes.add.useMutation({
    onSuccess: () => {
      toast.success("路由已添加");
      refetchRoutes();
      setRouteDialogOpen(false);
      setRouteForm({ destination: "", gateway: "", interface: "", metric: "" });
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  // 删除路由mutation
  const deleteRouteMutation = trpc.routes.delete.useMutation({
    onSuccess: () => {
      toast.success("路由已删除");
      refetchRoutes();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 设置默认网关mutation
  const setGatewayMutation = trpc.routes.setDefaultGateway.useMutation({
    onSuccess: () => {
      toast.success("默认网关已设置");
      refetchGateway();
      refetchRoutes();
      setGatewayDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`设置失败: ${error.message}`);
    },
  });

  // 路由表单状态
  const [routeForm, setRouteForm] = useState({
    destination: "",
    gateway: "",
    interface: "",
    metric: "",
  });

  // 网关表单状态
  const [gatewayForm, setGatewayForm] = useState({
    gateway: "",
    interface: "",
  });

  // 加载默认网关到表单
  const loadGatewayToForm = () => {
    if (defaultGateway) {
      setGatewayForm({
        gateway: defaultGateway.gateway || "",
        interface: defaultGateway.interface || "",
      });
    }
    setGatewayDialogOpen(true);
  };

  // 提交路由
  const handleSubmitRoute = () => {
    if (!routeForm.destination || !routeForm.gateway) {
      toast.error("请填写目标网络和网关");
      return;
    }

    addRouteMutation.mutate({
      destination: routeForm.destination,
      gateway: routeForm.gateway,
      interface: routeForm.interface || undefined,
      metric: routeForm.metric ? parseInt(routeForm.metric) : undefined,
    });
  };

  // 提交网关
  const handleSubmitGateway = () => {
    if (!gatewayForm.gateway) {
      toast.error("请填写网关地址");
      return;
    }

    setGatewayMutation.mutate({
      gateway: gatewayForm.gateway,
      interface: gatewayForm.interface || undefined,
    });
  };

  // 删除路由
  const handleDeleteRoute = (destination: string) => {
    if (confirm(`确定要删除到 ${destination} 的路由吗?`)) {
      deleteRouteMutation.mutate({ destination });
    }
  };

  if (routesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">路由管理</h1>
          <p className="text-muted-foreground mt-1">
            管理静态路由、默认网关和ARP表
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchRoutes();
              refetchGateway();
              refetchNeighbors();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button size="sm" onClick={() => setRouteDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加路由
          </Button>
        </div>
      </div>

      {/* 默认网关卡片 */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">默认网关</p>
              <p className="text-2xl font-bold">
                {defaultGateway?.gateway || "未设置"}
              </p>
              {defaultGateway?.interface && (
                <p className="text-sm text-muted-foreground">
                  接口: {defaultGateway.interface}
                </p>
              )}
            </div>
          </div>
          <Button onClick={loadGatewayToForm}>设置网关</Button>
        </div>
      </Card>

      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes">路由表</TabsTrigger>
          <TabsTrigger value="neighbors">ARP表</TabsTrigger>
        </TabsList>

        {/* 路由表标签页 */}
        <TabsContent value="routes" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">静态路由</h3>
            {routes && routes.length > 0 ? (
              <div className="space-y-2">
                {routes.map((route: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">目标网络</p>
                        <p className="font-medium">{route.destination}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">网关</p>
                        <p className="font-medium">{route.gateway || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">接口</p>
                        <p className="font-medium">{route.interface || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">跃点数</p>
                        <p className="font-medium">{route.metric || "-"}</p>
                      </div>
                    </div>
                    {route.destination !== "default" && route.destination !== "0.0.0.0/0" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRoute(route.destination)}
                        disabled={deleteRouteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <RouteIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">暂无路由记录</p>
                <Button
                  className="mt-4"
                  onClick={() => setRouteDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一条路由
                </Button>
              </Card>
            )}
          </Card>
        </TabsContent>

        {/* ARP表标签页 */}
        <TabsContent value="neighbors" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">ARP邻居表</h3>
            {neighbors && neighbors.length > 0 ? (
              <div className="space-y-2">
                {neighbors.map((neighbor: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">IP地址</p>
                        <p className="font-medium">{neighbor.ip}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">MAC地址</p>
                        <p className="font-medium">{neighbor.mac || "未知"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">接口</p>
                        <p className="font-medium">{neighbor.interface || "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {neighbor.state && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          neighbor.state === "REACHABLE" || neighbor.state === "PERMANENT"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {neighbor.state}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">暂无ARP记录</p>
              </Card>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加路由对话框 */}
      <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加静态路由</DialogTitle>
            <DialogDescription>
              配置到特定网络的静态路由
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="destination">目标网络 *</Label>
              <Input
                id="destination"
                value={routeForm.destination}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, destination: e.target.value })
                }
                placeholder="例如: 192.168.2.0/24"
              />
            </div>
            <div>
              <Label htmlFor="gateway">网关 *</Label>
              <Input
                id="gateway"
                value={routeForm.gateway}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, gateway: e.target.value })
                }
                placeholder="例如: 192.168.1.1"
              />
            </div>
            <div>
              <Label htmlFor="interface">接口</Label>
              <Input
                id="interface"
                value={routeForm.interface}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, interface: e.target.value })
                }
                placeholder="例如: eth0"
              />
            </div>
            <div>
              <Label htmlFor="metric">跃点数</Label>
              <Input
                id="metric"
                type="number"
                value={routeForm.metric}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, metric: e.target.value })
                }
                placeholder="例如: 100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRouteDialogOpen(false);
                setRouteForm({ destination: "", gateway: "", interface: "", metric: "" });
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitRoute}
              disabled={addRouteMutation.isPending}
            >
              {addRouteMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置网关对话框 */}
      <Dialog open={gatewayDialogOpen} onOpenChange={setGatewayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置默认网关</DialogTitle>
            <DialogDescription>
              配置系统的默认网关地址
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gw_gateway">网关地址 *</Label>
              <Input
                id="gw_gateway"
                value={gatewayForm.gateway}
                onChange={(e) =>
                  setGatewayForm({ ...gatewayForm, gateway: e.target.value })
                }
                placeholder="例如: 192.168.1.1"
              />
            </div>
            <div>
              <Label htmlFor="gw_interface">接口</Label>
              <Input
                id="gw_interface"
                value={gatewayForm.interface}
                onChange={(e) =>
                  setGatewayForm({ ...gatewayForm, interface: e.target.value })
                }
                placeholder="例如: eth0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGatewayDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitGateway}
              disabled={setGatewayMutation.isPending}
            >
              {setGatewayMutation.isPending ? "设置中..." : "设置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
