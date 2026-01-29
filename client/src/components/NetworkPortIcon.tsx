/**
 * 写实的网卡图标组件
 * 根据网卡类型显示RJ45电口或SFP光口图标
 */

interface NetworkPortIconProps {
  type: 'ethernet' | 'fiber';
  linkStatus: 'up' | 'down';
  activity: boolean;
  className?: string;
}

export function NetworkPortIcon({
  type,
  linkStatus,
  activity,
  className = '',
}: NetworkPortIconProps) {
  if (type === 'fiber') {
    // SFP光口图标
    return (
      <div className={`relative ${className}`}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 光口外壳 */}
          <rect
            x="8"
            y="12"
            width="32"
            height="24"
            rx="2"
            fill="#2c3e50"
            stroke="#34495e"
            strokeWidth="1"
          />
          
          {/* 光口插槽 */}
          <rect
            x="12"
            y="18"
            width="24"
            height="12"
            rx="1"
            fill="#1a1a1a"
          />
          
          {/* 光纤接口 */}
          <circle cx="24" cy="24" r="3" fill="#4a5568" />
          <circle cx="24" cy="24" r="1.5" fill="#718096" />
          
          {/* 左下角链路指示灯 */}
          <circle
            cx="14"
            cy="32"
            r="2"
            fill={linkStatus === 'up' ? '#10b981' : '#6b7280'}
            opacity={linkStatus === 'up' ? 1 : 0.3}
          />
          
          {/* 右下角活动指示灯 */}
          <circle
            cx="34"
            cy="32"
            r="2"
            fill={activity ? '#f59e0b' : '#6b7280'}
            opacity={activity ? 1 : 0.3}
          >
            {activity && (
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </svg>
      </div>
    );
  }

  // RJ45电口图标(默认)
  return (
    <div className={`relative ${className}`}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* RJ45外壳 */}
        <rect
          x="6"
          y="10"
          width="36"
          height="28"
          rx="2"
          fill="#2c3e50"
          stroke="#34495e"
          strokeWidth="1"
        />
        
        {/* 插槽开口 */}
        <rect
          x="10"
          y="14"
          width="28"
          height="16"
          rx="1"
          fill="#1a1a1a"
        />
        
        {/* 金属触点(8个) */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={12 + i * 3}
            y="16"
            width="2"
            height="12"
            fill="#d4af37"
            opacity="0.8"
          />
        ))}
        
        {/* 左下角链路指示灯 */}
        <circle
          cx="12"
          cy="34"
          r="2"
          fill={linkStatus === 'up' ? '#10b981' : '#6b7280'}
          opacity={linkStatus === 'up' ? 1 : 0.3}
        />
        
        {/* 右下角活动指示灯 */}
        <circle
          cx="36"
          cy="34"
          r="2"
          fill={activity ? '#f59e0b' : '#6b7280'}
          opacity={activity ? 1 : 0.3}
        >
          {activity && (
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      </svg>
    </div>
  );
}
