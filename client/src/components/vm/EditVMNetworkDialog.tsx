/**
 * 虚拟机网络编辑对话框组件
 * 允许用户切换虚拟机的虚拟网络或修改IP地址
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Network, AlertCircle } from "lucide-react";

interface EditVMNetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vmName: string;
  vmStatus: string;
  onSuccess: () => void;
}

export function EditVMNetworkDialog({
  open,
  onOpenChange,
  vmName,
  vmStatus,
  onSuccess,
}: EditVMNetworkDialogProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [ipAddress, setIpAddress] = useState("");

  // 获取虚拟网络列表
  const { data: virtualNetworks } = trpc.virtualNetwork.list.useQuery();

  // 获取当前网络连接
  const { data: currentNetwork, refetch: refetchCurrentNetwork } =
    trpc.virtualNetwork.getResourceNetwork.useQuery(
      { resourceId: vmName, resourceType: "vm" },
      { enabled: open }
    );

  // 更新网络mutation
  const updateNetworkMutation = trpc.virtualNetwork.updateVMNetwork.useMutation({
    onSuccess: () => {
      alert("虚拟机网络更新成功!");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      alert(`网络更新失败: ${error.message}`);
    },
  });

  // 当对话框打开时,初始化当前网络信息
  useEffect(() => {
    if (open && currentNetwork) {
      setSelectedNetworkId(currentNetwork.networkId);
      setIpAddress(currentNetwork.ipAddress || "");
    }
  }, [open, currentNetwork]);

  const handleSave = () => {
    if (selectedNetworkId === null) {
      alert("请选择虚拟网络");
      return;
    }

    updateNetworkMutation.mutate({
      vmName,
      newNetworkId: selectedNetworkId,
      ipAddress: ipAddress || undefined,
    });
  };

  const isRunning = vmStatus === "running";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑虚拟机网络</DialogTitle>
          <DialogDescription>
            为虚拟机 <span className="font-semibold text-gray-900">{vmName}</span> 切换虚拟网络或修改IP地址
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 当前网络信息 */}
          {currentNetwork && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">当前网络</span>
              </div>
              <div className="text-xs text-blue-800 space-y-1">
                <p>网络: {currentNetwork.networkName}</p>
                <p>子网: {currentNetwork.subnet}</p>
                {currentNetwork.ipAddress && <p>IP地址: {currentNetwork.ipAddress}</p>}
              </div>
            </div>
          )}

          {/* 虚拟网络选择器 */}
          <div className="space-y-2">
            <Label htmlFor="network-select">选择虚拟网络</Label>
            <Select
              value={selectedNetworkId?.toString() || ""}
              onValueChange={(value) => setSelectedNetworkId(parseInt(value))}
            >
              <SelectTrigger id="network-select">
                <SelectValue placeholder="选择网络" />
              </SelectTrigger>
              <SelectContent>
                {virtualNetworks?.map((network: any) => (
                  <SelectItem key={network.id} value={network.id.toString()}>
                    {network.name} ({network.subnet})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* IP地址输入 */}
          <div className="space-y-2">
            <Label htmlFor="ip-address">IP地址 (可选)</Label>
            <Input
              id="ip-address"
              placeholder="留空自动分配"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              指定静态IP地址,留空则自动分配
            </p>
          </div>

          {/* 网络信息预览 */}
          {selectedNetworkId && virtualNetworks && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">新网络信息</p>
              {(() => {
                const selectedNetwork = virtualNetworks.find(
                  (n: any) => n.id === selectedNetworkId
                );
                if (!selectedNetwork) return null;
                return (
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>网络: {selectedNetwork.name}</p>
                    <p>子网: {selectedNetwork.subnet}</p>
                    <p>网关: {selectedNetwork.gateway}</p>
                    <p>类型: {selectedNetwork.type}</p>
                    {selectedNetwork.bridgeName && (
                      <p>Bridge: {selectedNetwork.bridgeName}</p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 警告提示 */}
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800">
              {isRunning ? (
                <p>
                  虚拟机正在运行中。切换网络需要重启虚拟机,可能会导致服务中断。建议先停止虚拟机再进行网络配置。
                </p>
              ) : (
                <p>
                  虚拟机已停止。网络配置将在下次启动时生效。
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateNetworkMutation.isPending || selectedNetworkId === null}
          >
            {updateNetworkMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
