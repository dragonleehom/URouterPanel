import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Network,
  Plus,
  Settings,
  Trash2,
  Play,
  Square,
  RefreshCw,
  Wifi,
  Cable,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

// 接口类型定义
type InterfaceProtocol = "static" | "dhcp" | "pppoe";
type InterfaceType = "wan" | "lan" | "guest" | "vlan";
type InterfaceStatus = "up" | "down" | "error";

interface NetworkInterface {
  id: string;
  name: string;
  type: InterfaceType;
  protocol: InterfaceProtocol;
  device: string;
  ipv4: string;
  netmask: string;
  gateway: string;
  dns: string[];
  mac: string;
  mtu: number;
  enabled: boolean;
  status: InterfaceStatus;
  rxBytes: number;
  txBytes: number;
  uptime: number;
}

// 模拟数据
const mockInterfaces: NetworkInterface[] = [
  {
    id: "wan",
    name: "WAN",
    type: "wan",
    protocol: "dhcp",
    device: "eth0",
    ipv4: "192.168.1.100",
    netmask: "255.255.255.0",
    gateway: "192.168.1.1",
    dns: ["8.8.8.8", "8.8.4.4"],
    mac: "00:11:22:33:44:55",
    mtu: 1500,
    enabled: true,
    status: "up",
    rxBytes: 1024 * 1024 * 500,
    txBytes: 1024 * 1024 * 200,
    uptime: 86400,
  },
  {
    id: "lan",
    name: "LAN",
    type: "lan",
    protocol: "static",
    device: "br-lan",
    ipv4: "192.168.50.1",
    netmask: "255.255.255.0",
    gateway: "",
    dns: [],
    mac: "00:11:22:33:44:66",
    mtu: 1500,
    enabled: true,
    status: "up",
    rxBytes: 1024 * 1024 * 300,
    txBytes: 1024 * 1024 * 400,
    uptime: 86400,
  },
];

export default function NetworkInterfaces() {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>(mockInterfaces);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingInterface, setEditingInterface] = useState<NetworkInterface | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 新建接口表单
  const [newInterface, setNewInterface] = useState({
    name: "",
    type: "lan" as InterfaceType,
    protocol: "static" as InterfaceProtocol,
    device: "",
    ipv4: "",
    netmask: "255.255.255.0",
    gateway: "",
    dns: "",
    mtu: 1500,
  });

  const handleAddInterface = () => {
    if (!newInterface.name || !newInterface.device) {
      toast.error("请填写完整的接口信息");
      return;
    }

    const newIface: NetworkInterface = {
      id: Date.now().toString(),
      name: newInterface.name,
      type: newInterface.type,
      protocol: newInterface.protocol,
      device: newInterface.device,
      ipv4: newInterface.ipv4,
      netmask: newInterface.netmask,
      gateway: newInterface.gateway,
      dns: newInterface.dns.split(",").map((d) => d.trim()).filter(Boolean),
      mac: "00:00:00:00:00:00",
      mtu: newInterface.mtu,
      enabled: true,
      status: "down",
      rxBytes: 0,
      txBytes: 0,
      uptime: 0,
    };

    setInterfaces([...interfaces, newIface]);
    setIsAddDialogOpen(false);
    setNewInterface({
      name: "",
      type: "lan",
      protocol: "static",
      device: "",
      ipv4: "",
      netmask: "255.255.255.0",
      gateway: "",
      dns: "",
      mtu: 1500,
    });
    toast.success("接口添加成功");
  };

  const handleEditInterface = () => {
    if (!editingInterface) return;

    setInterfaces(
      interfaces.map((iface) =>
        iface.id === editingInterface.id ? editingInterface : iface
      )
    );
    setIsEditDialogOpen(false);
    setEditingInterface(null);
    toast.success("接口配置已更新");
  };

  const handleDeleteInterface = (id: string) => {
    setInterfaces(interfaces.filter((iface) => iface.id !== id));
    toast.success("接口已删除");
  };

  const handleToggleInterface = (id: string) => {
    setInterfaces(
      interfaces.map((iface) =>
        iface.id === id
          ? {
              ...iface,
              enabled: !iface.enabled,
              status: !iface.enabled ? "up" : "down",
            }
          : iface
      )
    );
    toast.success("接口状态已更新");
  };

  const getStatusIcon = (status: InterfaceStatus) => {
    switch (status) {
      case "up":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "down":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getTypeIcon = (type: InterfaceType) => {
    switch (type) {
      case "wan":
        return <Globe className="w-4 h-4" />;
      case "lan":
        return <Cable className="w-4 h-4" />;
      case "guest":
        return <Wifi className="w-4 h-4" />;
      default:
        return <Network className="w-4 h-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">网络接口</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理WAN、LAN、VLAN等网络接口配置
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加接口
          </Button>
        </div>
      </div>

      {/* 接口列表 */}
      <div className="grid gap-4">
        {interfaces.map((iface) => (
          <Card key={iface.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(iface.type)}
                  <div>
                    <CardTitle className="text-lg">{iface.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {iface.device}
                      </Badge>
                      <Badge
                        variant={iface.type === "wan" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {iface.type.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(iface.status)}
                        <span className="text-xs text-gray-500">
                          {iface.status === "up" ? "运行中" : "已停止"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={iface.enabled}
                    onCheckedChange={() => handleToggleInterface(iface.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingInterface(iface);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteInterface(iface.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">协议</p>
                  <p className="text-sm font-medium mt-1">
                    {iface.protocol.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IPv4地址</p>
                  <p className="text-sm font-medium mt-1">{iface.ipv4}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">子网掩码</p>
                  <p className="text-sm font-medium mt-1">{iface.netmask}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">网关</p>
                  <p className="text-sm font-medium mt-1">
                    {iface.gateway || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">MAC地址</p>
                  <p className="text-sm font-medium mt-1">{iface.mac}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">MTU</p>
                  <p className="text-sm font-medium mt-1">{iface.mtu}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">接收/发送</p>
                  <p className="text-sm font-medium mt-1">
                    {formatBytes(iface.rxBytes)} / {formatBytes(iface.txBytes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">运行时间</p>
                  <p className="text-sm font-medium mt-1">
                    {formatUptime(iface.uptime)}
                  </p>
                </div>
              </div>
              {iface.dns.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">DNS服务器</p>
                  <p className="text-sm font-medium mt-1">
                    {iface.dns.join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 添加接口对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加网络接口</DialogTitle>
            <DialogDescription>
              配置新的网络接口(WAN/LAN/VLAN)
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本设置</TabsTrigger>
              <TabsTrigger value="advanced">高级设置</TabsTrigger>
              <TabsTrigger value="physical">物理设置</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">接口名称</Label>
                  <Input
                    id="name"
                    value={newInterface.name}
                    onChange={(e) =>
                      setNewInterface({ ...newInterface, name: e.target.value })
                    }
                    placeholder="例如: WAN2"
                  />
                </div>
                <div>
                  <Label htmlFor="type">接口类型</Label>
                  <Select
                    value={newInterface.type}
                    onValueChange={(value) =>
                      setNewInterface({
                        ...newInterface,
                        type: value as InterfaceType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wan">WAN (外网)</SelectItem>
                      <SelectItem value="lan">LAN (内网)</SelectItem>
                      <SelectItem value="guest">Guest (访客)</SelectItem>
                      <SelectItem value="vlan">VLAN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="protocol">协议</Label>
                  <Select
                    value={newInterface.protocol}
                    onValueChange={(value) =>
                      setNewInterface({
                        ...newInterface,
                        protocol: value as InterfaceProtocol,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">静态IP</SelectItem>
                      <SelectItem value="dhcp">DHCP客户端</SelectItem>
                      <SelectItem value="pppoe">PPPoE拨号</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="device">物理设备</Label>
                  <Input
                    id="device"
                    value={newInterface.device}
                    onChange={(e) =>
                      setNewInterface({ ...newInterface, device: e.target.value })
                    }
                    placeholder="例如: eth1"
                  />
                </div>
              </div>
              {newInterface.protocol === "static" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ipv4">IPv4地址</Label>
                    <Input
                      id="ipv4"
                      value={newInterface.ipv4}
                      onChange={(e) =>
                        setNewInterface({ ...newInterface, ipv4: e.target.value })
                      }
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="netmask">子网掩码</Label>
                    <Input
                      id="netmask"
                      value={newInterface.netmask}
                      onChange={(e) =>
                        setNewInterface({
                          ...newInterface,
                          netmask: e.target.value,
                        })
                      }
                      placeholder="255.255.255.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gateway">网关</Label>
                    <Input
                      id="gateway"
                      value={newInterface.gateway}
                      onChange={(e) =>
                        setNewInterface({
                          ...newInterface,
                          gateway: e.target.value,
                        })
                      }
                      placeholder="192.168.1.254"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dns">DNS服务器</Label>
                    <Input
                      id="dns"
                      value={newInterface.dns}
                      onChange={(e) =>
                        setNewInterface({ ...newInterface, dns: e.target.value })
                      }
                      placeholder="8.8.8.8, 8.8.4.4"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mtu">MTU</Label>
                  <Input
                    id="mtu"
                    type="number"
                    value={newInterface.mtu}
                    onChange={(e) =>
                      setNewInterface({
                        ...newInterface,
                        mtu: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                更多高级选项即将推出,包括:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>MAC地址克隆</li>
                  <li>VLAN ID配置</li>
                  <li>IPv6设置</li>
                  <li>防火墙区域分配</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="physical" className="space-y-4">
              <div className="text-sm text-gray-500">
                物理设置功能即将推出,包括:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>桥接设备选择</li>
                  <li>网卡绑定(Bonding)</li>
                  <li>链路聚合(LACP)</li>
                  <li>端口镜像</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddInterface}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑接口对话框 */}
      {editingInterface && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑接口 - {editingInterface.name}</DialogTitle>
              <DialogDescription>
                修改接口配置参数
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ipv4">IPv4地址</Label>
                  <Input
                    id="edit-ipv4"
                    value={editingInterface.ipv4}
                    onChange={(e) =>
                      setEditingInterface({
                        ...editingInterface,
                        ipv4: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-netmask">子网掩码</Label>
                  <Input
                    id="edit-netmask"
                    value={editingInterface.netmask}
                    onChange={(e) =>
                      setEditingInterface({
                        ...editingInterface,
                        netmask: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gateway">网关</Label>
                  <Input
                    id="edit-gateway"
                    value={editingInterface.gateway}
                    onChange={(e) =>
                      setEditingInterface({
                        ...editingInterface,
                        gateway: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-mtu">MTU</Label>
                  <Input
                    id="edit-mtu"
                    type="number"
                    value={editingInterface.mtu}
                    onChange={(e) =>
                      setEditingInterface({
                        ...editingInterface,
                        mtu: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleEditInterface}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
