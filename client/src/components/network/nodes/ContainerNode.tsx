/**
 * 容器节点组件
 */

import { Handle, Position } from "reactflow";
import { Box } from "lucide-react";

export function ContainerNode({ data }: any) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-orange-500 min-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
          <Box className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500">Container</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
