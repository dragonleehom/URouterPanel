import { Cable, Zap } from "lucide-react";

interface PhysicalPortCardProps {
  name: string;
  type: 'ethernet' | 'fiber';
  speed: string;
  linkStatus: 'up' | 'down';
  txActivity: boolean;
  rxActivity: boolean;
}

export function PhysicalPortCard({
  name,
  type,
  speed,
  linkStatus,
  txActivity,
  rxActivity,
}: PhysicalPortCardProps) {
  const isConnected = linkStatus === 'up';
  
  return (
    <div className="relative flex flex-col items-center justify-center w-32 h-32 border-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* 网口图标 */}
      <div className="relative mb-2">
        {type === 'fiber' ? (
          <Zap className={`h-12 w-12 ${isConnected ? 'text-blue-600' : 'text-gray-400'}`} />
        ) : (
          <Cable className={`h-12 w-12 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
        )}
        
        {/* 状态指示灯 */}
        <div className="absolute -bottom-1 -left-1 flex gap-1">
          {/* 链路状态指示灯 (左下) */}
          <div 
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}
            title={isConnected ? "链路已连接" : "链路未连接"}
          />
        </div>
        
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          {/* 数据传输状态指示灯 (右下) */}
          <div 
            className={`w-2 h-2 rounded-full ${
              txActivity || rxActivity ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'
            }`}
            title={txActivity || rxActivity ? "数据传输中" : "无数据传输"}
          />
        </div>
      </div>
      
      {/* 速率显示 (右上) */}
      <div className="absolute top-2 right-2">
        <span className={`text-xs font-medium ${
          isConnected ? 'text-gray-700' : 'text-gray-400'
        }`}>
          {speed}
        </span>
      </div>
      
      {/* 接口名称 (底部) */}
      <div className="text-sm font-semibold text-gray-900">
        {name}
      </div>
    </div>
  );
}
