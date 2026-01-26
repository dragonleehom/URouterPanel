/**
 * 占位页面 - 用于未实现的功能
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { toast } from "sonner";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Construction className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-medium mb-2">{title}</h2>
          <p className="text-muted-foreground text-center mb-6">
            {description}
          </p>
          <Button
            onClick={() => toast.info("功能开发中,敬请期待!")}
            variant="outline"
          >
            了解更多
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
