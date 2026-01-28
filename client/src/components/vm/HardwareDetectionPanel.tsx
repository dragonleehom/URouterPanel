/**
 * 硬件检测面板组件
 * 显示系统硬件虚拟化能力
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Cpu, Monitor, Network, Layers, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function HardwareDetectionPanel() {
  const { data: hardwareInfo, isLoading, error } = trpc.vm.getHardwareInfo.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>硬件检测</CardTitle>
          <CardDescription>正在检测系统硬件虚拟化能力...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>硬件检测</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>硬件检测失败: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hardwareInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>硬件虚拟化能力</CardTitle>
        <CardDescription>系统硬件检测结果</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KVM支持 */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Cpu className="w-5 h-5 mt-0.5 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">KVM硬件加速</span>
              {hardwareInfo.kvmSupported ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  支持
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-3 h-3 mr-1" />
                  不支持
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hardwareInfo.kvmSupported
                ? `检测到 ${hardwareInfo.cpu.vendor} 虚拟化支持`
                : "系统不支持硬件虚拟化,将使用软件模拟"}
            </p>
          </div>
        </div>

        {/* IOMMU支持 */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Layers className="w-5 h-5 mt-0.5 text-purple-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">IOMMU (设备直通)</span>
              {hardwareInfo.iommuEnabled ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  已启用
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-3 h-3 mr-1" />
                  未启用
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hardwareInfo.iommuEnabled
                ? `IOMMU 已启用,支持PCI设备直通`
                : "需要在BIOS中启用VT-d/AMD-Vi并配置内核参数"}
            </p>
          </div>
        </div>

        {/* GPU设备 */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Monitor className="w-5 h-5 mt-0.5 text-green-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">GPU设备</span>
              <Badge variant="outline">{hardwareInfo.gpuDevices.length} 个</Badge>
            </div>
            {hardwareInfo.gpuDevices.length > 0 ? (
              <div className="space-y-1 mt-2">
                {hardwareInfo.gpuDevices.map((gpu: any, index: number) => (
                  <div key={index} className="text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{gpu.slot}</span>
                    <span className="ml-2">{gpu.model}</span>
                    {gpu.driver && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {gpu.driver}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">未检测到独立GPU</p>
            )}
          </div>
        </div>

        {/* 网卡SR-IOV */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Network className="w-5 h-5 mt-0.5 text-orange-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">SR-IOV网卡</span>
              <Badge variant="outline">
                {hardwareInfo.networkDevices.filter((nic: any) => nic.sriovSupport).length} 个
              </Badge>
            </div>
            {hardwareInfo.networkDevices.filter((nic: any) => nic.sriovSupport).length > 0 ? (
              <div className="space-y-1 mt-2">
                {hardwareInfo.networkDevices
                  .filter((nic: any) => nic.sriovSupport)
                  .map((nic: any, index: number) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{nic.interface}</span>
                      <span className="ml-2 text-muted-foreground">
                        最多 {nic.maxVFs || 0} 个虚拟功能
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                未检测到支持SR-IOV的网卡
              </p>
            )}
          </div>
        </div>

        {/* NUMA拓扑 */}
        {hardwareInfo.numa.nodes > 1 && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <Layers className="w-5 h-5 mt-0.5 text-indigo-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">NUMA架构</span>
                <Badge variant="outline">{hardwareInfo.numa.nodes} 个节点</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                检测到NUMA架构,建议配置NUMA节点绑定以优化性能
              </p>
            </div>
          </div>
        )}

        {/* CPU特性 */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
          <Cpu className="w-5 h-5 mt-0.5 text-cyan-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">CPU特性</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {hardwareInfo.cpu.features.vtx && (
                <Badge variant="secondary">Intel VT-x</Badge>
              )}
              {hardwareInfo.cpu.features.amdv && (
                <Badge variant="secondary">AMD-V</Badge>
              )}
              {hardwareInfo.cpu.features.ept && (
                <Badge variant="secondary">EPT</Badge>
              )}
              {hardwareInfo.cpu.features.npt && (
                <Badge variant="secondary">NPT</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
