/**
 * 智能优化建议组件
 * 根据硬件能力自动生成性能优化建议
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, Zap, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizationConfig {
  enableCPUPinning: boolean;
  enableHugepages: boolean;
  enableNUMA: boolean;
  hugepagesSize?: "2M" | "1G";
  hugepagesCount?: number;
}

interface OptimizationRecommendationsProps {
  onApplyOptimization?: (config: OptimizationConfig) => void;
}

export function OptimizationRecommendations({ onApplyOptimization }: OptimizationRecommendationsProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const { data: recommendations, isLoading, error } = trpc.vm.getPerformanceRecommendations.useQuery();

  const handleOneClickOptimize = async () => {
    if (!recommendations) return;

    setApplying(true);
    try {
      // 构建优化配置
      const config: OptimizationConfig = {
        enableCPUPinning: recommendations.cpuPinning,
        enableHugepages: recommendations.hugepages,
        enableNUMA: recommendations.numa,
      };

      // 如果支持大页内存,配置默认值
      if (recommendations.hugepages) {
        config.hugepagesSize = "2M";
        config.hugepagesCount = 512; // 1GB
      }

      // 回调给父组件
      if (onApplyOptimization) {
        onApplyOptimization(config);
      }

      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    } catch (error) {
      console.error("Failed to apply optimization:", error);
    } finally {
      setApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>性能优化建议</CardTitle>
          <CardDescription>正在分析系统硬件...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>性能优化建议</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              获取优化建议失败: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  const hasRecommendations = recommendations.recommendations.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              智能优化建议
            </CardTitle>
            <CardDescription>
              根据您的硬件配置自动生成的性能优化建议
            </CardDescription>
          </div>
          {hasRecommendations && (
            <Button
              onClick={handleOneClickOptimize}
              disabled={applying || applied}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  应用中...
                </>
              ) : applied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  已应用
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  一键优化
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasRecommendations ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              您的系统配置已经很好了!无需额外优化。
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* 优化建议列表 */}
            <div className="space-y-3">
              {recommendations.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Lightbulb className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm flex-1">{rec}</p>
                </div>
              ))}
            </div>

            {/* 优化功能状态 */}
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm font-medium text-muted-foreground">可用优化功能:</p>
              <div className="flex flex-wrap gap-2">
                {recommendations.cpuPinning && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    CPU Pinning
                  </Badge>
                )}
                {recommendations.hugepages && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    大页内存
                  </Badge>
                )}
                {recommendations.numa && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    NUMA优化
                  </Badge>
                )}
                {recommendations.cpuIsolation && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    CPU隔离
                  </Badge>
                )}
              </div>
            </div>

            {/* 说明 */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                点击"一键优化"将自动应用推荐的性能配置。您也可以在"高级选项"中手动配置每个选项。
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
