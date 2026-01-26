/**
 * 网络唤醒(WOL)管理页面
 * 设备列表管理、发送魔术包、唤醒历史记录
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Edit, Monitor, Plus, Power, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface WOLDevice {
  id: string;
  name: string;
  mac: string;
  ip: string;
  description: string;
  lastWake: string | null;
}

interface WOLHistory {
  id: string;
  deviceName: string;
  mac: string;
  timestamp: string;
  success: boolean;
}

export default function WOLManagement() {
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState<WOLDevice | null>(null);

  // WOL设备列表
  const [devices, setDevices] = useState<WOLDevice[]>([
    {
      id: "1",
      name: "Desktop-PC",
      mac: "AA:BB:CC:DD:EE:FF",
      ip: "192.168.1.100",
      description: "办公电脑",
      lastWake: "2024-01-26 10:30:00",
    },
    {
      id: "2",
      name: "NAS-Server",
      mac: "11:22:33:44:55:66",
      ip: "192.168.1.101",
      description: "网络存储服务器",
      lastWake: "2024-01-25 18:45:00",
    },
    {
      id: "3",
      name: "Media-Center",
      mac: "77:88:99:AA:BB:CC",
      ip: "192.168.1.102",
      description: "媒体中心",
      lastWake: null,
    },
  ]);

  // 唤醒历史
  const [history] = useState<WOLHistory[]>([
    {
      id: "1",
      deviceName: "Desktop-PC",
      mac: "AA:BB:CC:DD:EE:FF",
      timestamp: "2024-01-26 10:30:00",
      success: true,
    },
    {
      id: "2",
      deviceName: "NAS-Server",
      mac: "11:22:33:44:55:66",
      timestamp: "2024-01-25 18:45:00",
      success: true,
    },
    {
      id: "3",
      deviceName: "Media-Center",
      mac: "77:88:99:AA:BB:CC",
      timestamp: "2024-01-25 15:20:00",
      success: false,
    },
  ]);

  const handleAddDevice = () => {
    setEditingDevice(null);
    setShowDeviceDialog(true);
  };

  const handleEditDevice = (device: WOLDevice) => {
    setEditingDevice(device);
    setShowDeviceDialog(true);
  };

  const handleDeleteDevice = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
    toast.success("已删除设备");
  };

  const handleWakeDevice = (device: WOLDevice) => {
    toast.success(`正在唤醒设备: ${device.name}`);
    // 模拟更新最后唤醒时间
    setDevices(
      devices.map((d) =>
        d.id === device.id
          ? { ...d, lastWake: new Date().toLocaleString("zh-CN") }
          : d
      )
    );
  };

  const handleWakeAll = () => {
    toast.success("正在唤醒所有设备...");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">网络唤醒(WOL)</h1>
            <p className="text-sm text-gray-600 mt-1">
              通过局域网唤醒支持WOL的设备
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleWakeAll}>
              <Zap className="w-4 h-4 mr-2" />
              唤醒全部
            </Button>
            <Button onClick={handleAddDevice}>
              <Plus className="w-4 h-4 mr-2" />
              添加设备
            </Button>
          </div>
        </div>

        {/* 功能说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">什么是网络唤醒(WOL)?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                网络唤醒(Wake-on-LAN)是一种通过网络远程唤醒处于关机或休眠状态的计算机的技术。
              </p>
              <p className="font-medium">使用条件:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>目标设备的主板和网卡支持WOL功能</li>
                <li>在BIOS中启用WOL选项</li>
                <li>在操作系统的网卡设置中启用WOL</li>
                <li>目标设备需要连接电源(不能完全断电)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 设备列表 */}
        <Card>
          <CardHeader>
            <CardTitle>设备列表</CardTitle>
            <CardDescription>
              管理支持WOL的设备,点击唤醒按钮发送魔术包
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {devices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无设备</p>
                <p className="text-sm mt-1">点击"添加设备"按钮添加WOL设备</p>
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Monitor className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{device.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {device.ip}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        MAC: <span className="font-mono">{device.mac}</span> •{" "}
                        {device.description}
                      </div>
                      {device.lastWake && (
                        <div className="text-xs text-gray-500 mt-1">
                          最后唤醒: {device.lastWake}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleWakeDevice(device)}
                    >
                      <Power className="w-4 h-4 mr-2" />
                      唤醒
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditDevice(device)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDevice(device.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 唤醒历史 */}
        <Card>
          <CardHeader>
            <CardTitle>唤醒历史</CardTitle>
            <CardDescription>最近的WOL唤醒记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {record.success ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Zap className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{record.deviceName}</div>
                      <div className="text-xs text-gray-600 font-mono">
                        {record.mac}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={record.success ? "default" : "destructive"}
                      className="mb-1"
                    >
                      {record.success ? "成功" : "失败"}
                    </Badge>
                    <div className="text-xs text-gray-600">{record.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 添加/编辑设备对话框 */}
        <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDevice ? "编辑设备" : "添加设备"}
              </DialogTitle>
              <DialogDescription>
                配置支持WOL的设备信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">设备名称</Label>
                <Input
                  id="device-name"
                  placeholder="Desktop-PC"
                  defaultValue={editingDevice?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-mac">MAC地址</Label>
                <Input
                  id="device-mac"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="font-mono"
                  defaultValue={editingDevice?.mac}
                />
                <p className="text-xs text-gray-600">
                  格式: XX:XX:XX:XX:XX:XX
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-ip">IP地址(可选)</Label>
                <Input
                  id="device-ip"
                  placeholder="192.168.1.100"
                  className="font-mono"
                  defaultValue={editingDevice?.ip}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-desc">描述</Label>
                <Input
                  id="device-desc"
                  placeholder="设备描述"
                  defaultValue={editingDevice?.description}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeviceDialog(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  toast.success(editingDevice ? "已更新设备" : "已添加设备");
                  setShowDeviceDialog(false);
                }}
              >
                {editingDevice ? "更新" : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
