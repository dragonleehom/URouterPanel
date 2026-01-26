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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Server,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  Wifi,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

// 类型定义
interface DHCPPool {
  id: string;
  name: string;
  interface: string;
  startIp: string;
  endIp: string;
  netmask: string;
  gateway: string;
  dnsServers: string[];
  leaseTime: number; // 秒
  enabled: boolean;
}

interface StaticLease {
  id: string;
  hostname: string;
  macAddress: string;
  ipAddress: string;
  enabled: boolean;
}

interface DHCPLease {
  id: string;
  hostname: string;
  macAddress: string;
  ipAddress: string;
  expiresAt: Date;
  isActive: boolean;
}

interface DNSForwarder {
  id: string;
  name: string;
  server: string;
  port: number;
  enabled: boolean;
}

interface DNSRecord {
  id: string;
  hostname: string;
  ipAddress: string;
  type: "A" | "AAAA" | "CNAME";
  enabled: boolean;
}

// 模拟数据
const mockDHCPPools: DHCPPool[] = [
  {
    id: "1",
    name: "LAN地址池",
    interface: "br-lan",
    startIp: "192.168.1.100",
    endIp: "192.168.1.200",
    netmask: "255.255.255.0",
    gateway: "192.168.1.1",
    dnsServers: ["192.168.1.1", "8.8.8.8"],
    leaseTime: 86400,
    enabled: true,
  },
  {
    id: "2",
    name: "Guest地址池",
    interface: "br-guest",
    startIp: "192.168.2.100",
    endIp: "192.168.2.200",
    netmask: "255.255.255.0",
    gateway: "192.168.2.1",
    dnsServers: ["192.168.2.1"],
    leaseTime: 3600,
    enabled: true,
  },
];

const mockStaticLeases: StaticLease[] = [
  {
    id: "1",
    hostname: "nas-server",
    macAddress: "00:11:22:33:44:55",
    ipAddress: "192.168.1.10",
    enabled: true,
  },
  {
    id: "2",
    hostname: "printer",
    macAddress: "AA:BB:CC:DD:EE:FF",
    ipAddress: "192.168.1.20",
    enabled: true,
  },
];

const mockDHCPLeases: DHCPLease[] = [
  {
    id: "1",
    hostname: "laptop-01",
    macAddress: "11:22:33:44:55:66",
    ipAddress: "192.168.1.150",
    expiresAt: new Date(Date.now() + 3600 * 1000),
    isActive: true,
  },
  {
    id: "2",
    hostname: "phone-02",
    macAddress: "77:88:99:AA:BB:CC",
    ipAddress: "192.168.1.151",
    expiresAt: new Date(Date.now() + 7200 * 1000),
    isActive: true,
  },
];

const mockDNSForwarders: DNSForwarder[] = [
  {
    id: "1",
    name: "Google DNS",
    server: "8.8.8.8",
    port: 53,
    enabled: true,
  },
  {
    id: "2",
    name: "Cloudflare DNS",
    server: "1.1.1.1",
    port: 53,
    enabled: true,
  },
];

const mockDNSRecords: DNSRecord[] = [
  {
    id: "1",
    hostname: "router.local",
    ipAddress: "192.168.1.1",
    type: "A",
    enabled: true,
  },
  {
    id: "2",
    hostname: "nas.local",
    ipAddress: "192.168.1.10",
    type: "A",
    enabled: true,
  },
];

export default function DHCPDNSManagement() {
  const [dhcpPools, setDHCPPools] = useState<DHCPPool[]>(mockDHCPPools);
  const [staticLeases, setStaticLeases] = useState<StaticLease[]>(mockStaticLeases);
  const [dhcpLeases] = useState<DHCPLease[]>(mockDHCPLeases);
  const [dnsForwarders, setDNSForwarders] = useState<DNSForwarder[]>(mockDNSForwarders);
  const [dnsRecords, setDNSRecords] = useState<DNSRecord[]>(mockDNSRecords);

  const [isAddPoolOpen, setIsAddPoolOpen] = useState(false);
  const [isAddLeaseOpen, setIsAddLeaseOpen] = useState(false);
  const [isAddForwarderOpen, setIsAddForwarderOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  // 新建DHCP地址池表单
  const [newPool, setNewPool] = useState({
    name: "",
    interface: "br-lan",
    startIp: "",
    endIp: "",
    netmask: "255.255.255.0",
    gateway: "",
    dnsServers: "8.8.8.8,1.1.1.1",
    leaseTime: "86400",
  });

  // 新建静态租约表单
  const [newLease, setNewLease] = useState({
    hostname: "",
    macAddress: "",
    ipAddress: "",
  });

  // 新建DNS转发器表单
  const [newForwarder, setNewForwarder] = useState({
    name: "",
    server: "",
    port: "53",
  });

  // 新建DNS记录表单
  const [newRecord, setNewRecord] = useState({
    hostname: "",
    ipAddress: "",
    type: "A" as "A" | "AAAA" | "CNAME",
  });

  const handleAddPool = () => {
    if (!newPool.name || !newPool.startIp || !newPool.endIp || !newPool.gateway) {
      toast.error("请填写完整的地址池信息");
      return;
    }

    const pool: DHCPPool = {
      id: Date.now().toString(),
      name: newPool.name,
      interface: newPool.interface,
      startIp: newPool.startIp,
      endIp: newPool.endIp,
      netmask: newPool.netmask,
      gateway: newPool.gateway,
      dnsServers: newPool.dnsServers.split(",").map((s) => s.trim()),
      leaseTime: parseInt(newPool.leaseTime),
      enabled: true,
    };

    setDHCPPools([...dhcpPools, pool]);
    setIsAddPoolOpen(false);
    setNewPool({
      name: "",
      interface: "br-lan",
      startIp: "",
      endIp: "",
      netmask: "255.255.255.0",
      gateway: "",
      dnsServers: "8.8.8.8,1.1.1.1",
      leaseTime: "86400",
    });
    toast.success("DHCP地址池添加成功");
  };

  const handleAddLease = () => {
    if (!newLease.hostname || !newLease.macAddress || !newLease.ipAddress) {
      toast.error("请填写完整的静态租约信息");
      return;
    }

    const lease: StaticLease = {
      id: Date.now().toString(),
      ...newLease,
      enabled: true,
    };

    setStaticLeases([...staticLeases, lease]);
    setIsAddLeaseOpen(false);
    setNewLease({
      hostname: "",
      macAddress: "",
      ipAddress: "",
    });
    toast.success("静态租约添加成功");
  };

  const handleAddForwarder = () => {
    if (!newForwarder.name || !newForwarder.server) {
      toast.error("请填写完整的DNS转发器信息");
      return;
    }

    const forwarder: DNSForwarder = {
      id: Date.now().toString(),
      name: newForwarder.name,
      server: newForwarder.server,
      port: parseInt(newForwarder.port),
      enabled: true,
    };

    setDNSForwarders([...dnsForwarders, forwarder]);
    setIsAddForwarderOpen(false);
    setNewForwarder({
      name: "",
      server: "",
      port: "53",
    });
    toast.success("DNS转发器添加成功");
  };

  const handleAddRecord = () => {
    if (!newRecord.hostname || !newRecord.ipAddress) {
      toast.error("请填写完整的DNS记录信息");
      return;
    }

    const record: DNSRecord = {
      id: Date.now().toString(),
      ...newRecord,
      enabled: true,
    };

    setDNSRecords([...dnsRecords, record]);
    setIsAddRecordOpen(false);
    setNewRecord({
      hostname: "",
      ipAddress: "",
      type: "A",
    });
    toast.success("DNS记录添加成功");
  };

  const handleDeletePool = (id: string) => {
    setDHCPPools(dhcpPools.filter((pool) => pool.id !== id));
    toast.success("地址池已删除");
  };

  const handleDeleteLease = (id: string) => {
    setStaticLeases(staticLeases.filter((lease) => lease.id !== id));
    toast.success("静态租约已删除");
  };

  const handleDeleteForwarder = (id: string) => {
    setDNSForwarders(dnsForwarders.filter((f) => f.id !== id));
    toast.success("DNS转发器已删除");
  };

  const handleDeleteRecord = (id: string) => {
    setDNSRecords(dnsRecords.filter((r) => r.id !== id));
    toast.success("DNS记录已删除");
  };

  const handleTogglePool = (id: string) => {
    setDHCPPools(
      dhcpPools.map((pool) =>
        pool.id === id ? { ...pool, enabled: !pool.enabled } : pool
      )
    );
    toast.success("地址池状态已更新");
  };

  const handleToggleLease = (id: string) => {
    setStaticLeases(
      staticLeases.map((lease) =>
        lease.id === id ? { ...lease, enabled: !lease.enabled } : lease
      )
    );
    toast.success("静态租约状态已更新");
  };

  const handleToggleForwarder = (id: string) => {
    setDNSForwarders(
      dnsForwarders.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
    toast.success("DNS转发器状态已更新");
  };

  const handleToggleRecord = (id: string) => {
    setDNSRecords(
      dnsRecords.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    toast.success("DNS记录状态已更新");
  };

  const formatLeaseTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    if (hours >= 24) {
      return `${Math.floor(hours / 24)}天`;
    }
    return `${hours}小时`;
  };

  const formatExpiresAt = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours}小时`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">DHCP/DNS管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            配置DHCP地址池、静态租约和DNS服务
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="dhcp-pools" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dhcp-pools">
            <Server className="w-4 h-4 mr-2" />
            DHCP地址池
          </TabsTrigger>
          <TabsTrigger value="static-leases">
            <Wifi className="w-4 h-4 mr-2" />
            静态租约
          </TabsTrigger>
          <TabsTrigger value="dhcp-leases">
            <Clock className="w-4 h-4 mr-2" />
            DHCP租约
          </TabsTrigger>
          <TabsTrigger value="dns-forwarders">
            <Globe className="w-4 h-4 mr-2" />
            DNS转发
          </TabsTrigger>
          <TabsTrigger value="dns-records">
            <Server className="w-4 h-4 mr-2" />
            本地DNS
          </TabsTrigger>
        </TabsList>

        {/* DHCP地址池标签页 */}
        <TabsContent value="dhcp-pools" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddPoolOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加地址池
            </Button>
          </div>

          <div className="grid gap-4">
            {dhcpPools.map((pool) => (
              <Card key={pool.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{pool.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {pool.interface}
                      </Badge>
                      <Switch
                        checked={pool.enabled}
                        onCheckedChange={() => handleTogglePool(pool.id)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePool(pool.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">地址范围</span>
                      <p className="font-mono mt-1">
                        {pool.startIp} - {pool.endIp}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">子网掩码</span>
                      <p className="font-mono mt-1">{pool.netmask}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">网关</span>
                      <p className="font-mono mt-1">{pool.gateway}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">租约时间</span>
                      <p className="mt-1">{formatLeaseTime(pool.leaseTime)}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">DNS服务器</span>
                      <p className="font-mono mt-1">{pool.dnsServers.join(", ")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 静态租约标签页 */}
        <TabsContent value="static-leases" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddLeaseOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加静态租约
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>静态租约列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        主机名
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        MAC地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        IP地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {staticLeases.map((lease) => (
                      <tr key={lease.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{lease.hostname}</td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{lease.macAddress}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{lease.ipAddress}</code>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleLease(lease.id)}
                            className="flex items-center gap-1"
                          >
                            {lease.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {lease.enabled ? "已启用" : "已禁用"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLease(lease.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 静态租约说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">静态租约说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                静态租约(Static Lease)为指定MAC地址的设备分配固定的IP地址,确保设备每次连接时都获得相同的IP。
              </p>
              <p className="font-medium">典型应用场景:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>为NAS、打印机等设备分配固定IP,便于访问</li>
                <li>为服务器设备分配固定IP,便于配置防火墙规则</li>
                <li>为IoT设备分配固定IP,便于管理和监控</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DHCP租约标签页 */}
        <TabsContent value="dhcp-leases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>当前DHCP租约</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        主机名
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        MAC地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        IP地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        剩余时间
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dhcpLeases.map((lease) => (
                      <tr key={lease.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{lease.hostname}</td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{lease.macAddress}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{lease.ipAddress}</code>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {formatExpiresAt(lease.expiresAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={lease.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {lease.isActive ? "活跃" : "过期"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DNS转发标签页 */}
        <TabsContent value="dns-forwarders" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddForwarderOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加DNS转发器
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>DNS转发器列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        服务器地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        端口
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsForwarders.map((forwarder) => (
                      <tr key={forwarder.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{forwarder.name}</td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{forwarder.server}</code>
                        </td>
                        <td className="py-3 px-4 text-sm">{forwarder.port}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleForwarder(forwarder.id)}
                            className="flex items-center gap-1"
                          >
                            {forwarder.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {forwarder.enabled ? "已启用" : "已禁用"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteForwarder(forwarder.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* DNS转发说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">DNS转发说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                DNS转发器将本地无法解析的域名查询转发到上游DNS服务器。建议配置多个DNS服务器以提高可用性。
              </p>
              <p className="font-medium">常用公共DNS服务器:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Google DNS: 8.8.8.8, 8.8.4.4</li>
                <li>Cloudflare DNS: 1.1.1.1, 1.0.0.1</li>
                <li>阿里DNS: 223.5.5.5, 223.6.6.6</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 本地DNS记录标签页 */}
        <TabsContent value="dns-records" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAddRecordOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加DNS记录
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>本地DNS记录列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        主机名
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        IP地址
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        类型
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{record.hostname}</code>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{record.ipAddress}</code>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {record.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleRecord(record.id)}
                            className="flex items-center gap-1"
                          >
                            {record.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {record.enabled ? "已启用" : "已禁用"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 本地DNS记录说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">本地DNS记录说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                本地DNS记录允许您为内网设备配置自定义域名,无需修改每台设备的hosts文件。
              </p>
              <p className="font-medium">典型应用场景:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>为路由器配置 router.local 域名,方便访问管理界面</li>
                <li>为NAS配置 nas.local 域名,方便文件共享访问</li>
                <li>为内网服务配置友好的域名,提升用户体验</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加DHCP地址池对话框 */}
      <Dialog open={isAddPoolOpen} onOpenChange={setIsAddPoolOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加DHCP地址池</DialogTitle>
            <DialogDescription>
              配置新的DHCP地址池
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pool-name">地址池名称</Label>
                <Input
                  id="pool-name"
                  value={newPool.name}
                  onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                  placeholder="例如: LAN地址池"
                />
              </div>
              <div>
                <Label htmlFor="pool-interface">接口</Label>
                <Select
                  value={newPool.interface}
                  onValueChange={(value) => setNewPool({ ...newPool, interface: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="br-lan">br-lan</SelectItem>
                    <SelectItem value="br-guest">br-guest</SelectItem>
                    <SelectItem value="eth0">eth0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pool-start">起始IP</Label>
                <Input
                  id="pool-start"
                  value={newPool.startIp}
                  onChange={(e) => setNewPool({ ...newPool, startIp: e.target.value })}
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <Label htmlFor="pool-end">结束IP</Label>
                <Input
                  id="pool-end"
                  value={newPool.endIp}
                  onChange={(e) => setNewPool({ ...newPool, endIp: e.target.value })}
                  placeholder="192.168.1.200"
                />
              </div>
              <div>
                <Label htmlFor="pool-netmask">子网掩码</Label>
                <Input
                  id="pool-netmask"
                  value={newPool.netmask}
                  onChange={(e) => setNewPool({ ...newPool, netmask: e.target.value })}
                  placeholder="255.255.255.0"
                />
              </div>
              <div>
                <Label htmlFor="pool-gateway">网关</Label>
                <Input
                  id="pool-gateway"
                  value={newPool.gateway}
                  onChange={(e) => setNewPool({ ...newPool, gateway: e.target.value })}
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <Label htmlFor="pool-dns">DNS服务器</Label>
                <Input
                  id="pool-dns"
                  value={newPool.dnsServers}
                  onChange={(e) =>
                    setNewPool({ ...newPool, dnsServers: e.target.value })
                  }
                  placeholder="8.8.8.8,1.1.1.1"
                />
              </div>
              <div>
                <Label htmlFor="pool-lease">租约时间(秒)</Label>
                <Input
                  id="pool-lease"
                  value={newPool.leaseTime}
                  onChange={(e) =>
                    setNewPool({ ...newPool, leaseTime: e.target.value })
                  }
                  placeholder="86400"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPoolOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddPool}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加静态租约对话框 */}
      <Dialog open={isAddLeaseOpen} onOpenChange={setIsAddLeaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加静态租约</DialogTitle>
            <DialogDescription>
              为指定MAC地址分配固定IP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lease-hostname">主机名</Label>
              <Input
                id="lease-hostname"
                value={newLease.hostname}
                onChange={(e) =>
                  setNewLease({ ...newLease, hostname: e.target.value })
                }
                placeholder="nas-server"
              />
            </div>
            <div>
              <Label htmlFor="lease-mac">MAC地址</Label>
              <Input
                id="lease-mac"
                value={newLease.macAddress}
                onChange={(e) =>
                  setNewLease({ ...newLease, macAddress: e.target.value })
                }
                placeholder="00:11:22:33:44:55"
              />
            </div>
            <div>
              <Label htmlFor="lease-ip">IP地址</Label>
              <Input
                id="lease-ip"
                value={newLease.ipAddress}
                onChange={(e) =>
                  setNewLease({ ...newLease, ipAddress: e.target.value })
                }
                placeholder="192.168.1.10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeaseOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddLease}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加DNS转发器对话框 */}
      <Dialog open={isAddForwarderOpen} onOpenChange={setIsAddForwarderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加DNS转发器</DialogTitle>
            <DialogDescription>
              配置上游DNS服务器
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="forwarder-name">名称</Label>
              <Input
                id="forwarder-name"
                value={newForwarder.name}
                onChange={(e) =>
                  setNewForwarder({ ...newForwarder, name: e.target.value })
                }
                placeholder="Google DNS"
              />
            </div>
            <div>
              <Label htmlFor="forwarder-server">服务器地址</Label>
              <Input
                id="forwarder-server"
                value={newForwarder.server}
                onChange={(e) =>
                  setNewForwarder({ ...newForwarder, server: e.target.value })
                }
                placeholder="8.8.8.8"
              />
            </div>
            <div>
              <Label htmlFor="forwarder-port">端口</Label>
              <Input
                id="forwarder-port"
                value={newForwarder.port}
                onChange={(e) =>
                  setNewForwarder({ ...newForwarder, port: e.target.value })
                }
                placeholder="53"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddForwarderOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddForwarder}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加DNS记录对话框 */}
      <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加DNS记录</DialogTitle>
            <DialogDescription>
              配置本地DNS解析记录
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="record-hostname">主机名</Label>
              <Input
                id="record-hostname"
                value={newRecord.hostname}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, hostname: e.target.value })
                }
                placeholder="router.local"
              />
            </div>
            <div>
              <Label htmlFor="record-ip">IP地址</Label>
              <Input
                id="record-ip"
                value={newRecord.ipAddress}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, ipAddress: e.target.value })
                }
                placeholder="192.168.1.1"
              />
            </div>
            <div>
              <Label htmlFor="record-type">记录类型</Label>
              <Select
                value={newRecord.type}
                onValueChange={(value) =>
                  setNewRecord({
                    ...newRecord,
                    type: value as "A" | "AAAA" | "CNAME",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A (IPv4)</SelectItem>
                  <SelectItem value="AAAA">AAAA (IPv6)</SelectItem>
                  <SelectItem value="CNAME">CNAME (别名)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRecordOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddRecord}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
