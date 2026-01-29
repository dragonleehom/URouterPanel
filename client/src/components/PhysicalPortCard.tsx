/**
 * 物理端口卡片组件
 * 样式参考附件图片: 网口图标 + 速率 + 接口名
 */

import { NetworkPortIcon } from './NetworkPortIcon';

interface PhysicalPortCardProps {
  name: string;
  type: 'ethernet' | 'fiber' | 'wireless';
  speed: string;  // 如 "1000 Mbit/s"
  linkStatus: boolean;
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
  // 格式化速率显示
  const displaySpeed = speed || "未知";
  
  // 链路状态颜色
  const linkColor = linkStatus ? "bg-green-500" : "bg-gray-300";
  
  // 数据传输活动颜色  
  const txColor = txActivity ? "bg-orange-500" : "bg-gray-300";

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded p-3 min-w-[110px]">
      {/* 网口图标区域 */}
      <div className="mb-2">
        <NetworkPortIcon
          type={type === 'fiber' ? 'fiber' : 'ethernet'}
          linkStatus={linkStatus ? 'up' : 'down'}
          activity={txActivity || rxActivity}
        />
      </div>
      
      {/* 速率显示 */}
      <div className="text-sm font-semibold text-gray-900">
        {displaySpeed}
      </div>
      
      {/* 接口名称 */}
      <div className="text-xs text-gray-600 mt-0.5">
        {name}
      </div>
    </div>
  );
}
