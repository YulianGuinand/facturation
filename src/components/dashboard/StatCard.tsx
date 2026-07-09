import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-2xl font-semibold text-zinc-900 tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-zinc-400">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Icon className="h-5 w-5 text-zinc-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
