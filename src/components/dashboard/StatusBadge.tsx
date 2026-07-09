import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DocumentStatus = "draft" | "sent" | "accepted" | "refused" | "paid" | "partially_paid" | "cancelled" | "expired";

const statusLabels: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  paid: "Payé",
  partially_paid: "Partiellement payé",
  cancelled: "Annulé",
  expired: "Expiré",
};

const statusStyles: Record<DocumentStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 hover:bg-zinc-100",
  sent: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  accepted: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  refused: "bg-red-50 text-red-700 hover:bg-red-50",
  paid: "bg-green-50 text-green-700 hover:bg-green-50",
  partially_paid: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  cancelled: "bg-zinc-100 text-zinc-500 hover:bg-zinc-100",
  expired: "bg-red-50 text-red-700 hover:bg-red-50",
};

interface StatusBadgeProps {
  status: DocumentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium border-0", statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export type { DocumentStatus };
