/**
 * 物理端口卡片组件
 * 样式参考附件图片: 网口图标 + 速率 + 接口名
 */

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
      <div className="relative mb-2">
        {/* RJ45网口图标 */}
        <svg
          className="w-10 h-10 text-gray-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="5" y="11" width="14" height="10" rx="1.5" />
          <path d="M8 8v3M11 8v3M13 8v3M16 8v3" strokeLinecap="round" />
        </svg>
        
        {/* 左下角指示灯 - 链路状态 */}
        <div
          className={`absolute bottom-0 left-0 w-2 h-2 rounded-full ${linkColor}`}
          title={linkStatus ? "已连接" : "未连接"}
        />
        
        {/* 右下角指示灯 - 数据传输 */}
        <div
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${txColor}`}
          title={txActivity ? "传输中" : "空闲"}
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
