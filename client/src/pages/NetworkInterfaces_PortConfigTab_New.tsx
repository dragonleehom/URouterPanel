/**
 * 新的网口配置标签页 - 物理端口可视化界面
 */

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Plus, Settings, Trash2, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PhysicalPortCard } from "@/components/PhysicalPortCard";

interface PortFormData {
  id?: number;
  name: string;
  type: 'wan' | 'lan';
  protocol: 'static' | 'dhcp' | 'pppoe';
  physicalInterfaces: string[];  // 绑定的物理接口
  ipaddr?: string;
  netmask?: string;
  gateway?: string;
  dns?: string;
  pppoeUsername?: string;
  pppoePassword?: string;
  pppoeServiceName?: string;
  mtu?: number;
  metric?: number;
  firewallZone?: string;
  enabled: boolean;
}

export function PortConfigTabNew() {
  const [editingPort, setEditingPort] = useState<PortFormData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  
  // 获取物理接口列表
  const { data: physicalInterfaces, isLoading: loadingPhysical } = 
    trpc.networkConfig.listPhysicalInterfaces.useQuery();
  
  // 获取逻辑端口列表
  const { data: logicalPorts, isLoading: loadingPorts } = 
    trpc.networkConfig.listPorts.useQuery();
  
  // 获取防火墙区域列表
  const { data: firewallZones } = trpc.firewall.listZones.useQuery();

  const createPort = trpc.networkConfig.createPort.useMutation({
    onSuccess: () => {
      toast.success("接口创建成功");
      utils.networkConfig.listPorts.invalidate();
      setIsDialogOpen(false);
      setEditingPort(null);
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updatePort = trpc.networkConfig.updatePort.useMutation({
    onSuccess: () => {
      toast.success("接口更新成功");
      utils.networkConfig.listPorts.invalidate();
      setIsDialogOpen(false);
      setEditingPort(null);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deletePort = trpc.networkConfig.deletePort.useMutation({
    onSuccess: () => {
      toast.success("接口已删除");
      utils.networkConfig.listPorts.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 获取某个物理接口被哪个逻辑端口使用
  const getPhysicalPortOwner = (ifname: string): number | null => {
    if (!logicalPorts) return null;
    
    for (const port of logicalPorts) {
      if (port.ifname === ifname) {
        return port.id;
      }
    }
    return null;
  };

  // 检查物理接口是否可用于当前编辑的端口
  const isPhysicalPortAvailable = (ifname: string, currentPortId?: number): boolean => {
    const owner = getPhysicalPortOwner(ifname);
    return owner === null || owner === currentPortId;
  };

  // 切换物理接口的分配
  const togglePhysicalInterface = (portId: number, ifname: string) => {
    const port = logicalPorts?.find(p => p.id === portId);
    if (!port) return;

    const currentIfname = port.ifname || '';
    const newIfname = currentIfname === ifname ? '' : ifname;

    updatePort.mutate({
      id: portId,
      ifname: newIfname,
    });
  };

  // 处理添加接口
  const handleAddPort = (type: 'wan' | 'lan') => {
    setEditingPort({
      name: type === 'wan' ? 'WAN' : 'LAN',
      type,
      protocol: 'dhcp',
      physicalInterfaces: [],
      enabled: true,
    });
    setIsDialogOpen(true);
  };

  // 处理编辑接口
  const handleEditPort = (port: any) => {
    setEditingPort({
      id: port.id,
      name: port.name,
      type: port.type,
      protocol: port.protocol,
      physicalInterfaces: port.ifname ? [port.ifname] : [],
      ipaddr: port.ipaddr || '',
      netmask: port.netmask || '',
      gateway: port.gateway || '',
      dns: port.dns || '',
      pppoeUsername: port.pppoeUsername || '',
      pppoePassword: port.pppoePassword || '',
      pppoeServiceName: port.pppoeServiceName || '',
      mtu: port.mtu || 1500,
      metric: port.metric || 0,
      firewallZone: port.firewallZone || '',
      enabled: port.enabled === 1,
    });
    setIsDialogOpen(true);
  };

  // 处理保存
  const handleSave = () => {
    if (!editingPort) return;

    const data: any = {
      name: editingPort.name,
      type: editingPort.type,
      protocol: editingPort.protocol,
      ifname: editingPort.physicalInterfaces[0] || '',
      enabled: editingPort.enabled ? 1 : 0,
      mtu: editingPort.mtu || 1500,
      metric: editingPort.metric || 0,
      firewallZone: editingPort.firewallZone || '',
    };

    if (editingPort.protocol === 'static') {
      data.ipaddr = editingPort.ipaddr || '';
      data.netmask = editingPort.netmask || '';
      data.gateway = editingPort.gateway || '';
      data.dns = editingPort.dns || '';
    } else if (editingPort.protocol === 'pppoe') {
      data.pppoeUsername = editingPort.pppoeUsername || '';
      data.pppoePassword = editingPort.pppoePassword || '';
      data.pppoeServiceName = editingPort.pppoeServiceName || '';
    }

    if (editingPort.id) {
      updatePort.mutate({ id: editingPort.id, ...data });
    } else {
      createPort.mutate(data);
    }
  };

  // 分组端口
  const wanPorts = logicalPorts?.filter(p => p.type === 'wan') || [];
  const lanPorts = logicalPorts?.filter(p => p.type === 'lan') || [];

  if (loadingPhysical || loadingPorts) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 物理端口展示区 */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">物理网口</h3>
        <div className="flex flex-wrap gap-4">
          {physicalInterfaces && physicalInterfaces.length > 0 ? (
            physicalInterfaces.map((iface) => (
              <PhysicalPortCard
                key={iface.name}
                name={iface.name}
                type={iface.type}
                speed={iface.speed}
                linkStatus={iface.linkStatus}
                txActivity={iface.txActivity}
                rxActivity={iface.rxActivity}
              />
            ))
          ) : (
            <p className="text-gray-500">未检测到物理网口</p>
          )}
        </div>
      </div>

      {/* WAN接口配置区 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">WAN接口</h3>
          <Button onClick={() => handleAddPort('wan')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            添加WAN接口
          </Button>
        </div>

        {wanPorts.length > 0 ? (
          <div className="space-y-2">
            {wanPorts.map((port) => (
              <div key={port.id} className="flex items-center gap-4 p-4 bg-white border rounded-lg">
                {/* 物理接口checkbox */}
                <div className="flex gap-4 flex-1">
                  {physicalInterfaces?.map((iface) => {
                    const isChecked = port.ifname === iface.name;
                    const isDisabled = !isPhysicalPortAvailable(iface.name, port.id);
                    
                    return (
                      <label
                        key={iface.name}
                        className={`flex items-center justify-center w-32 h-12 border-2 rounded cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => togglePhysicalInterface(port.id, iface.name)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{iface.name}</span>
                      </label>
                    );
                  })}
                </div>

                {/* 接口名称和操作 */}
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">{port.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPort(port)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`确定删除接口 ${port.name}?`)) {
                        deletePort.mutate({ id: port.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">暂无WAN接口配置</p>
        )}
      </div>

      {/* LAN接口配置区 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">LAN接口</h3>
          <Button onClick={() => handleAddPort('lan')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            添加LAN接口
          </Button>
        </div>

        {lanPorts.length > 0 ? (
          <div className="space-y-2">
            {lanPorts.map((port) => (
              <div key={port.id} className="flex items-center gap-4 p-4 bg-white border rounded-lg">
                {/* 物理接口checkbox */}
                <div className="flex gap-4 flex-1">
                  {physicalInterfaces?.map((iface) => {
                    const isChecked = port.ifname === iface.name;
                    const isDisabled = !isPhysicalPortAvailable(iface.name, port.id);
                    
                    return (
                      <label
                        key={iface.name}
                        className={`flex items-center justify-center w-32 h-12 border-2 rounded cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-green-500 bg-green-50'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => togglePhysicalInterface(port.id, iface.name)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{iface.name}</span>
                      </label>
                    );
                  })}
                </div>

                {/* 接口名称和操作 */}
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">{port.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPort(port)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`确定删除接口 ${port.name}?`)) {
                        deletePort.mutate({ id: port.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">暂无LAN接口配置</p>
        )}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPort?.id ? '编辑接口' : '添加接口'}
            </DialogTitle>
            <DialogDescription>
              配置{editingPort?.type === 'wan' ? 'WAN' : 'LAN'}接口参数
            </DialogDescription>
          </DialogHeader>

          {editingPort && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="space-y-2">
                <Label>接口名称</Label>
                <Input
                  value={editingPort.name}
                  onChange={(e) => setEditingPort({ ...editingPort, name: e.target.value })}
                  placeholder="例如: WAN, WAN1, LAN, LAN1"
                />
              </div>

              <div className="space-y-2">
                <Label>协议类型</Label>
                <Select
                  value={editingPort.protocol}
                  onValueChange={(value: 'static' | 'dhcp' | 'pppoe') =>
                    setEditingPort({ ...editingPort, protocol: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">静态IP</SelectItem>
                    <SelectItem value="dhcp">DHCP</SelectItem>
                    <SelectItem value="pppoe">PPPoE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 静态IP配置 */}
              {editingPort.protocol === 'static' && (
                <>
                  <div className="space-y-2">
                    <Label>IP地址</Label>
                    <Input
                      value={editingPort.ipaddr}
                      onChange={(e) => setEditingPort({ ...editingPort, ipaddr: e.target.value })}
                      placeholder="192.168.1.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>子网掩码</Label>
                    <Input
                      value={editingPort.netmask}
                      onChange={(e) => setEditingPort({ ...editingPort, netmask: e.target.value })}
                      placeholder="255.255.255.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>网关</Label>
                    <Input
                      value={editingPort.gateway}
                      onChange={(e) => setEditingPort({ ...editingPort, gateway: e.target.value })}
                      placeholder="192.168.1.254"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DNS服务器</Label>
                    <Input
                      value={editingPort.dns}
                      onChange={(e) => setEditingPort({ ...editingPort, dns: e.target.value })}
                      placeholder="8.8.8.8,8.8.4.4"
                    />
                  </div>
                </>
              )}

              {/* PPPoE配置 */}
              {editingPort.protocol === 'pppoe' && (
                <>
                  <div className="space-y-2">
                    <Label>PPPoE用户名</Label>
                    <Input
                      value={editingPort.pppoeUsername}
                      onChange={(e) => setEditingPort({ ...editingPort, pppoeUsername: e.target.value })}
                      placeholder="用户名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PPPoE密码</Label>
                    <Input
                      type="password"
                      value={editingPort.pppoePassword}
                      onChange={(e) => setEditingPort({ ...editingPort, pppoePassword: e.target.value })}
                      placeholder="密码"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>服务名称(可选)</Label>
                    <Input
                      value={editingPort.pppoeServiceName}
                      onChange={(e) => setEditingPort({ ...editingPort, pppoeServiceName: e.target.value })}
                      placeholder="留空使用默认"
                    />
                  </div>
                </>
              )}

              {/* 高级选项 */}
              <div className="space-y-2">
                <Label>MTU</Label>
                <Input
                  type="number"
                  value={editingPort.mtu}
                  onChange={(e) => setEditingPort({ ...editingPort, mtu: parseInt(e.target.value) })}
                  placeholder="1500"
                />
              </div>

              {editingPort.type === 'wan' && (
                <div className="space-y-2">
                  <Label>路由优先级(Metric)</Label>
                  <Input
                    type="number"
                    value={editingPort.metric}
                    onChange={(e) => setEditingPort({ ...editingPort, metric: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              )}

              {/* 防火墙区域 */}
              <div className="space-y-2">
                <Label>防火墙区域</Label>
                <div className="flex flex-wrap gap-4">
                  {(firewallZones || ['wan', 'lan', 'guest', 'dmz']).map((zone) => {
                    const currentZones = editingPort.firewallZone ? editingPort.firewallZone.split(',').map(z => z.trim()) : [];
                    const isChecked = currentZones.includes(zone);
                    return (
                      <div key={zone} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`zone-${zone}`}
                          checked={isChecked}
                          onChange={(e) => {
                            let newZones: string[];
                            if (e.target.checked) {
                              newZones = [...currentZones, zone];
                            } else {
                              newZones = currentZones.filter(z => z !== zone);
                            }
                            setEditingPort({ ...editingPort, firewallZone: newZones.join(',') });
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`zone-${zone}`} className="text-sm font-medium">
                          {zone.toUpperCase()}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
