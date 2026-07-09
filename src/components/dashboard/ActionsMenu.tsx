import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  Copy,
  Download,
  Loader2,
  MoreHorizontal,
  PenLine,
  Trash2,
} from "lucide-react";

interface ActionsMenuProps {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDownload?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  loading?: boolean;
}

export function ActionsMenu({
  onEdit,
  onDuplicate,
  onDownload,
  onArchive,
  onDelete,
  loading,
}: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center rounded-md h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors outline-none"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="gap-2 text-sm" onClick={onEdit}>
          <PenLine className="h-3.5 w-3.5" /> Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 text-sm"
          onClick={onDuplicate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-sm" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" /> Télécharger
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-sm"
          onClick={onArchive}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          Archiver
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-sm text-red-600 focus:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
