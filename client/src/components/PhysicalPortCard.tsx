/**
 * 物理端口卡片组件
 * 样式参考附件图片: 网口图标 + 速率 + 接口名
 */

import { NetworkPortIcon } from './NetworkPortIcon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PhysicalPortCardProps {
  name: string;
  type: 'ethernet' | 'fiber' | 'wireless';
  speed: string;  // 如 "1000 Mbit/s"
  linkStatus: boolean;
  txActivity: boolean;
  rxActivity: boolean;
  // 详细信息(用于Tooltip)
  macAddress?: string;
  driver?: string;
  mtu?: number;
  duplex?: string;
}

export function PhysicalPortCard({
  name,
  type,
  speed,
  linkStatus,
  txActivity,
  rxActivity,
  macAddress,
  driver,
  mtu,
  duplex,
}: PhysicalPortCardProps) {
  // 格式化速率显示
  const displaySpeed = speed || "未知";
  
  // 链路状态颜色
  const linkColor = linkStatus ? "bg-green-500" : "bg-gray-300";
  
  // 数据传输活动颜色  
  const txColor = txActivity ? "bg-orange-500" : "bg-gray-300";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded p-3 min-w-[110px] cursor-help">
      {/* 网口图标区域 */}
      <div className="mb-2">
        <NetworkPortIcon
          type={type === 'fiber' ? 'fiber' : 'ethernet'}
          linkStatus={linkStatus ? 'up' : 'down'}
          activity={txActivity || rxActivity}
        />
      </div>
      
      {/* 速率显示 - 已连接:黑色加粗 | 未连接:灰色加粗 */}
      <div className={`text-sm font-bold ${linkStatus ? 'text-gray-900' : 'text-gray-400'}`}>
        {displaySpeed}
      </div>
      
      {/* 接口名称 - 已连接:黑色加粗 | 未连接:灰色加粗 */}
      <div className={`text-xs font-bold mt-0.5 ${linkStatus ? 'text-gray-900' : 'text-gray-400'}`}>
        {name}
      </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-sm">
            <div className="font-semibold border-b pb-1 mb-2">{name} 详细信息</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="text-gray-500">MAC地址:</span>
              <span className="font-mono text-xs">{macAddress || '未知'}</span>
              
              <span className="text-gray-500">驱动:</span>
              <span>{driver || '未知'}</span>
              
              <span className="text-gray-500">速率:</span>
              <span>{speed || '未知'}</span>
              
              <span className="text-gray-500">双工:</span>
              <span>{duplex === 'full' ? '全双工' : duplex === 'half' ? '半双工' : '未知'}</span>
              
              <span className="text-gray-500">MTU:</span>
              <span>{mtu || '未知'}</span>
              
              <span className="text-gray-500">链路状态:</span>
              <span className={linkStatus ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                {linkStatus ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
