/**
 * 网络流量监控面板组件
 * 显示实时流量统计、带宽使用和历史趋势图表
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, ArrowDown, ArrowUp, AlertCircle, TrendingUp } from "lucide-react";

interface NetworkTrafficPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  networkId: number;
  networkName: string;
}

/**
 * 格式化字节数为人类可读格式
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 格式化带宽为人类可读格式
 */
function formatBandwidth(bytesPerSec: number): string {
  if (bytesPerSec === 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return `${(bytesPerSec / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 格式化时间戳为HH:MM:SS
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function NetworkTrafficPanel({
  open,
  onOpenChange,
  networkId,
  networkName,
}: NetworkTrafficPanelProps) {
  // 获取实时流量统计(每5秒刷新)
  const { data: currentStats, refetch: refetchCurrent } = trpc.virtualNetwork.getNetworkTraffic.useQuery(
    { networkId },
    {
      enabled: open,
      refetchInterval: 5000,
    }
  );

  // 获取历史流量数据
  const { data: historyData, refetch: refetchHistory } = trpc.virtualNetwork.getNetworkTrafficHistory.useQuery(
    { networkId, maxPoints: 60 },
    {
      enabled: open,
      refetchInterval: 5000,
    }
  );

  // 准备图表数据
  const chartData = historyData?.map((stat: any) => ({
    time: formatTime(stat.timestamp),
    rx: (stat.bandwidth?.rxBytesPerSec || 0) / 1024, // 转换为KB/s
    tx: (stat.bandwidth?.txBytesPerSec || 0) / 1024,
  })) || [];

  if (!currentStats) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>网络流量监控 - {networkName}</DialogTitle>
            <DialogDescription>实时流量统计和历史趋势</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">暂无流量数据</p>
              <p className="text-sm text-gray-400 mt-1">网络可能尚未创建或未激活</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            网络流量监控 - {networkName}
          </DialogTitle>
          <DialogDescription>实时流量统计和历史趋势</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 实时带宽统计 */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-green-600" />
                  下载速度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatBandwidth(currentStats.bandwidth?.rxBytesPerSec || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  总接收: {formatBytes(currentStats.rx.bytes)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-blue-600" />
                  上传速度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatBandwidth(currentStats.bandwidth?.txBytesPerSec || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  总发送: {formatBytes(currentStats.tx.bytes)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 数据包统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">数据包统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">接收包</p>
                  <p className="font-semibold">{currentStats.rx.packets.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">发送包</p>
                  <p className="font-semibold">{currentStats.tx.packets.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">接收错误</p>
                  <p className="font-semibold text-red-600">{currentStats.rx.errors}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">发送错误</p>
                  <p className="font-semibold text-red-600">{currentStats.tx.errors}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t">
                <div>
                  <p className="text-gray-500 mb-1">接收丢包</p>
                  <p className="font-semibold text-orange-600">{currentStats.rx.dropped}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">发送丢包</p>
                  <p className="font-semibold text-orange-600">{currentStats.tx.dropped}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 流量趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                流量趋势 (最近5分钟)
              </CardTitle>
              <CardDescription>实时带宽使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      label={{ value: "KB/s", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                      formatter={(value: number) => `${value.toFixed(2)} KB/s`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rx"
                      stroke="#10b981"
                      name="下载"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="tx"
                      stroke="#3b82f6"
                      name="上传"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-400">
                  <p>暂无历史数据</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 接口信息 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
            <p className="text-gray-600">
              <span className="font-semibold">接口名称:</span> {currentStats.interfaceName}
            </p>
            <p className="text-gray-600 mt-1">
              <span className="font-semibold">更新时间:</span> {formatTime(currentStats.timestamp)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
