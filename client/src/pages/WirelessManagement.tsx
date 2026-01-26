import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Wifi, Plus, Trash2, Edit, Eye, EyeOff, Radio } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface WirelessNetwork {
  id: string;
  ssid: string;
  band: "2.4GHz" | "5GHz";
  enabled: boolean;
  security: string;
  password: string;
  channel: number;
  bandwidth: string;
  txPower: number;
  hidden: boolean;
  maxClients: number;
  isolate: boolean;
}

interface ConnectedClient {
  mac: string;
  ip: string;
  hostname: string;
  signal: number;
  rxRate: string;
  txRate: string;
  connectedTime: string;
}

export default function WirelessManagement() {
  const [networks, setNetworks] = useState<WirelessNetwork[]>([
    {
      id: "1",
      ssid: "URouterOS-Main",
      band: "5GHz",
      enabled: true,
      security: "WPA3-Personal",
      password: "********",
      channel: 36,
      bandwidth: "80MHz",
      txPower: 80,
      hidden: false,
      maxClients: 50,
      isolate: false,
    },
    {
      id: "2",
      ssid: "URouterOS-Guest",
      band: "2.4GHz",
      enabled: true,
      security: "WPA2-Personal",
      password: "********",
      channel: 6,
      bandwidth: "20MHz",
      txPower: 60,
      hidden: false,
      maxClients: 20,
      isolate: true,
    },
  ]);

  const [connectedClients] = useState<ConnectedClient[]>([
    {
      mac: "AA:BB:CC:DD:EE:FF",
      ip: "192.168.1.100",
      hostname: "iPhone-12",
      signal: -45,
      rxRate: "866 Mbps",
      txRate: "866 Mbps",
      connectedTime: "2h 15m",
    },
    {
      mac: "11:22:33:44:55:66",
      ip: "192.168.1.101",
      hostname: "MacBook-Pro",
      signal: -52,
      rxRate: "650 Mbps",
      txRate: "650 Mbps",
      connectedTime: "5h 42m",
    },
  ]);

  const [editingNetwork, setEditingNetwork] = useState<WirelessNetwork | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggleNetwork = (id: string) => {
    setNetworks(
      networks.map((net) =>
        net.id === id ? { ...net, enabled: !net.enabled } : net
      )
    );
    toast.success("无线网络状态已更新");
  };

  const handleEditNetwork = (network: WirelessNetwork) => {
    setEditingNetwork({ ...network });
    setIsDialogOpen(true);
  };

  const handleSaveNetwork = () => {
    if (!editingNetwork) return;

    if (!editingNetwork.ssid.trim()) {
      toast.error("SSID不能为空");
      return;
    }

    if (editingNetwork.security !== "Open" && editingNetwork.password.length < 8) {
      toast.error("密码长度至少为8位");
      return;
    }

    setNetworks(
      networks.map((net) =>
        net.id === editingNetwork.id ? editingNetwork : net
      )
    );
    setIsDialogOpen(false);
    setEditingNetwork(null);
    toast.success("无线网络配置已保存");
  };

  const handleAddNetwork = () => {
    const newNetwork: WirelessNetwork = {
      id: Date.now().toString(),
      ssid: "New-Network",
      band: "2.4GHz",
      enabled: false,
      security: "WPA2-Personal",
      password: "",
      channel: 1,
      bandwidth: "20MHz",
      txPower: 100,
      hidden: false,
      maxClients: 50,
      isolate: false,
    };
    setEditingNetwork(newNetwork);
    setIsDialogOpen(true);
  };

  const handleDeleteNetwork = (id: string) => {
    setNetworks(networks.filter((net) => net.id !== id));
    toast.success("无线网络已删除");
  };

  const getSignalStrength = (signal: number) => {
    if (signal >= -50) return { text: "优秀", color: "text-green-600" };
    if (signal >= -60) return { text: "良好", color: "text-blue-600" };
    if (signal >= -70) return { text: "一般", color: "text-yellow-600" };
    return { text: "较弱", color: "text-red-600" };
  };

  const channels24GHz = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const channels5GHz = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 149, 153, 157, 161, 165];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Wifi className="w-6 h-6" />
            无线网络管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            配置WiFi网络、安全设置和无线参数
          </p>
        </div>
        <Button onClick={handleAddNetwork}>
          <Plus className="w-4 h-4 mr-2" />
          添加网络
        </Button>
      </div>

      <Tabs defaultValue="networks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="networks">无线网络</TabsTrigger>
          <TabsTrigger value="clients">已连接设备</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-4">
          {networks.map((network) => (
            <Card key={network.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Radio className={`w-5 h-5 ${network.enabled ? "text-blue-600" : "text-gray-400"}`} />
                    <div>
                      <h3 className="text-lg font-medium">{network.ssid}</h3>
                      <p className="text-sm text-gray-500">
                        {network.band} · 信道 {network.channel} · {network.bandwidth}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        network.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {network.enabled ? "已启用" : "已禁用"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">安全模式</p>
                      <p className="font-medium">{network.security}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">发射功率</p>
                      <p className="font-medium">{network.txPower}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">最大客户端</p>
                      <p className="font-medium">{network.maxClients}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">客户端隔离</p>
                      <p className="font-medium">{network.isolate ? "已启用" : "已禁用"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={network.enabled}
                    onCheckedChange={() => handleToggleNetwork(network.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditNetwork(network)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteNetwork(network.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">主机名</th>
                    <th className="p-4 font-medium">IP地址</th>
                    <th className="p-4 font-medium">MAC地址</th>
                    <th className="p-4 font-medium">信号强度</th>
                    <th className="p-4 font-medium">速率 (RX/TX)</th>
                    <th className="p-4 font-medium">连接时间</th>
                  </tr>
                </thead>
                <tbody>
                  {connectedClients.map((client, index) => {
                    const signal = getSignalStrength(client.signal);
                    return (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-4">{client.hostname}</td>
                        <td className="p-4 font-mono text-sm">{client.ip}</td>
                        <td className="p-4 font-mono text-sm">{client.mac}</td>
                        <td className="p-4">
                          <span className={signal.color}>
                            {client.signal} dBm ({signal.text})
                          </span>
                        </td>
                        <td className="p-4">
                          {client.rxRate} / {client.txRate}
                        </td>
                        <td className="p-4">{client.connectedTime}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">高级无线设置</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>国家/地区代码</Label>
                  <Select defaultValue="CN">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CN">中国 (CN)</SelectItem>
                      <SelectItem value="US">美国 (US)</SelectItem>
                      <SelectItem value="EU">欧盟 (EU)</SelectItem>
                      <SelectItem value="JP">日本 (JP)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    影响可用信道和最大发射功率
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Beacon间隔 (ms)</Label>
                  <Input type="number" defaultValue="100" min="20" max="1000" />
                  <p className="text-xs text-gray-500">
                    信标帧发送间隔,默认100ms
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>RTS阈值</Label>
                  <Input type="number" defaultValue="2347" min="0" max="2347" />
                  <p className="text-xs text-gray-500">
                    RTS/CTS握手阈值,0表示禁用
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>分片阈值</Label>
                  <Input type="number" defaultValue="2346" min="256" max="2346" />
                  <p className="text-xs text-gray-500">
                    数据包分片阈值
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">WMM (Wi-Fi多媒体)</p>
                  <p className="text-sm text-gray-500">
                    启用QoS以优化语音和视频流量
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Short GI (短保护间隔)</p>
                  <p className="text-sm text-gray-500">
                    启用以提高吞吐量,可能影响稳定性
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">LDPC编码</p>
                  <p className="text-sm text-gray-500">
                    低密度奇偶校验码,提高传输可靠性
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button>保存高级设置</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑网络对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNetwork?.id ? "编辑无线网络" : "添加无线网络"}
            </DialogTitle>
            <DialogDescription>
              配置无线网络的基本参数和安全设置
            </DialogDescription>
          </DialogHeader>

          {editingNetwork && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SSID (网络名称)</Label>
                  <Input
                    value={editingNetwork.ssid}
                    onChange={(e) =>
                      setEditingNetwork({ ...editingNetwork, ssid: e.target.value })
                    }
                    placeholder="输入网络名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label>频段</Label>
                  <Select
                    value={editingNetwork.band}
                    onValueChange={(value: "2.4GHz" | "5GHz") =>
                      setEditingNetwork({ ...editingNetwork, band: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2.4GHz">2.4GHz</SelectItem>
                      <SelectItem value="5GHz">5GHz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>安全模式</Label>
                  <Select
                    value={editingNetwork.security}
                    onValueChange={(value) =>
                      setEditingNetwork({ ...editingNetwork, security: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">开放网络</SelectItem>
                      <SelectItem value="WPA2-Personal">WPA2-Personal</SelectItem>
                      <SelectItem value="WPA3-Personal">WPA3-Personal</SelectItem>
                      <SelectItem value="WPA2/WPA3-Mixed">WPA2/WPA3混合</SelectItem>
                      <SelectItem value="WPA2-Enterprise">WPA2-Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingNetwork.security !== "Open" && (
                  <div className="space-y-2">
                    <Label>密码</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={editingNetwork.password}
                        onChange={(e) =>
                          setEditingNetwork({
                            ...editingNetwork,
                            password: e.target.value,
                          })
                        }
                        placeholder="至少8位字符"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>信道</Label>
                  <Select
                    value={editingNetwork.channel.toString()}
                    onValueChange={(value) =>
                      setEditingNetwork({
                        ...editingNetwork,
                        channel: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">自动</SelectItem>
                      {(editingNetwork.band === "2.4GHz"
                        ? channels24GHz
                        : channels5GHz
                      ).map((ch) => (
                        <SelectItem key={ch} value={ch.toString()}>
                          信道 {ch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>信道带宽</Label>
                  <Select
                    value={editingNetwork.bandwidth}
                    onValueChange={(value) =>
                      setEditingNetwork({ ...editingNetwork, bandwidth: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {editingNetwork.band === "2.4GHz" ? (
                        <>
                          <SelectItem value="20MHz">20MHz</SelectItem>
                          <SelectItem value="40MHz">40MHz</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="20MHz">20MHz</SelectItem>
                          <SelectItem value="40MHz">40MHz</SelectItem>
                          <SelectItem value="80MHz">80MHz</SelectItem>
                          <SelectItem value="160MHz">160MHz</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>最大客户端数</Label>
                  <Input
                    type="number"
                    value={editingNetwork.maxClients}
                    onChange={(e) =>
                      setEditingNetwork({
                        ...editingNetwork,
                        maxClients: parseInt(e.target.value) || 50,
                      })
                    }
                    min="1"
                    max="100"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>发射功率: {editingNetwork.txPower}%</Label>
                  <Slider
                    value={[editingNetwork.txPower]}
                    onValueChange={(value) =>
                      setEditingNetwork({ ...editingNetwork, txPower: value[0] || 100 })
                    }
                    min={10}
                    max={100}
                    step={10}
                  />
                  <p className="text-xs text-gray-500">
                    降低发射功率可减少干扰和能耗
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">隐藏SSID</p>
                    <p className="text-sm text-gray-500">
                      不广播网络名称,需要手动输入SSID连接
                    </p>
                  </div>
                  <Switch
                    checked={editingNetwork.hidden}
                    onCheckedChange={(checked) =>
                      setEditingNetwork({ ...editingNetwork, hidden: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">客户端隔离</p>
                    <p className="text-sm text-gray-500">
                      防止连接到此网络的设备相互通信
                    </p>
                  </div>
                  <Switch
                    checked={editingNetwork.isolate}
                    onCheckedChange={(checked) =>
                      setEditingNetwork({ ...editingNetwork, isolate: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveNetwork}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
