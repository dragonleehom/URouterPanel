import { useEffect, useState } from "react";
import { SystemDashboard } from "../components/dashboard/SystemDashboard";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [isInitializing, setIsInitializing] = useState(false);
  const utils = trpc.useUtils();

  // 查询网口配置
  const { data: ports } = trpc.networkConfig.listPorts.useQuery();
  
  // 扫描设备mutation
  const scanDevices = trpc.networkConfig.scanDevices.useMutation({
    onSuccess: () => {
      console.log("[Network Config] Device scan completed");
    },
    onError: (error) => {
      console.error("[Network Config] Device scan failed:", error);
    },
  });

  // 创建默认配置mutation
  const createDefaultConfig = trpc.networkConfig.createDefaultConfig.useMutation({
    onSuccess: () => {
      console.log("[Network Config] Default config created");
      toast.success("网络配置已初始化");
      utils.networkConfig.listPorts.invalidate();
      utils.networkConfig.listDevices.invalidate();
      setIsInitializing(false);
    },
    onError: (error) => {
      console.error("[Network Config] Failed to create default config:", error);
      toast.error("网络配置初始化失败");
      setIsInitializing(false);
    },
  });

  // 自动初始化网络配置
  useEffect(() => {
    if (ports !== undefined && ports.length === 0 && !isInitializing) {
      console.log("[Network Config] No configuration found, initializing...");
      setIsInitializing(true);
      
      // 先扫描设备
      scanDevices.mutate(undefined, {
        onSuccess: () => {
          // 扫描完成后创建默认配置
          setTimeout(() => {
            createDefaultConfig.mutate();
          }, 1000);
        },
      });
    }
  }, [ports, isInitializing]);

  return <SystemDashboard />;
}
