"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyId } from "@/lib/company";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { ActionsMenu } from "./ActionsMenu";
import { toast } from "sonner";
import {
  PenLine,
  Copy,
  Download,
  Archive,
  Trash2,
  FileText,
  FileSignature,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";

interface DocumentRow {
  _id: string;
  type: string;
  number: string;
  customerId?: string;
  issueDate: number;
  validityDate?: number;
  dueDate?: number;
  totalInclTax: number;
  status: string;
  customerName?: string;
}

const typeConfig: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  quote: { icon: FileText, label: "Devis", color: "text-blue-600" },
  invoice: { icon: FileSignature, label: "Facture", color: "text-emerald-600" },
  credit_note: { icon: FileSpreadsheet, label: "Avoir", color: "text-amber-600" },
  purchase_order: { icon: FileText, label: "Bon de commande", color: "text-purple-600" },
  deposit_invoice: { icon: FileSignature, label: "Facture d'acompte", color: "text-cyan-600" },
  progress_invoice: { icon: FileSignature, label: "Facture de situation", color: "text-indigo-600" },
};

const TYPE_ROUTES: Record<string, string> = {
  quote: "/dashboard/devis",
  invoice: "/dashboard/factures",
  credit_note: "/dashboard/avoirs",
  purchase_order: "/dashboard/bons-de-commande",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR");
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

interface DocumentTableProps {
  data: DocumentRow[];
  showType?: boolean;
  showValidite?: boolean;
}

export function DocumentTable({ data, showType = true, showValidite = false }: DocumentTableProps) {
  const router = useRouter();
  const companyId = useCompanyId();
  const duplicateDoc = useMutation(api.mutations.documents.duplicateDocument);
  const archiveDoc = useMutation(api.mutations.documents.archiveDocument);
  const deleteDoc = useMutation(api.mutations.documents.deleteDocument);
  const changeStatus = useMutation(api.mutations.documents.changeDocumentStatus);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleView = (doc: DocumentRow) => {
    const base = TYPE_ROUTES[doc.type] || "/dashboard";
    router.push(`${base}/${doc._id}`);
  };

  const handleEdit = (doc: DocumentRow) => {
    const base = TYPE_ROUTES[doc.type] || "/dashboard";
    router.push(`${base}/${doc._id}/modifier`);
  };

  const handleDuplicate = async (doc: DocumentRow) => {
    if (!companyId) return;
    setActionLoading(`duplicate-${doc._id}`);
    try {
      await duplicateDoc({ documentId: doc._id as any, companyId });
      toast.success("Document dupliqué avec succès");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de la duplication");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = (doc: DocumentRow) => {
    if (!companyId) return;
    const url = `/api/documents/${doc._id}/pdf?companyId=${companyId}`;
    window.open(url, "_blank");
  };

  const handleArchive = async (doc: DocumentRow) => {
    if (!companyId) return;
    setActionLoading(`archive-${doc._id}`);
    try {
      await archiveDoc({ documentId: doc._id as any, companyId });
      toast.success("Document archivé");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de l'archivage");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (docId: string, status: string) => {
    if (!companyId) return;
    try {
      await changeStatus({ documentId: docId as Id<"documents">, companyId, status: status as any });
      toast.success("Statut mis à jour");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !companyId) return;
    setActionLoading(`delete-${deleteTarget._id}`);
    try {
      await deleteDoc({ documentId: deleteTarget._id as any, companyId });
      toast.success("Document supprimé");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              {showType && (
                <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</TableHead>
              )}
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Numéro</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Client</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</TableHead>
              {showValidite && (
                <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Validité</TableHead>
              )}
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Montant</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Statut</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showType ? 8 : 7} className="text-center py-12 text-zinc-400 text-sm">
                  Aucun document
                </TableCell>
              </TableRow>
            ) : (
              data.map((doc) => {
                const config = typeConfig[doc.type];
                const Icon = config?.icon || FileText;
                const isLoading = actionLoading?.endsWith(doc._id);
                return (
                  <ContextMenu key={doc._id}>
                    <ContextMenuTrigger
                      render={<tr />}
                      className="border-b transition-colors hover:bg-zinc-50/50 cursor-pointer"
                      onClick={() => handleView(doc)}
                    >
                      {showType && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", config?.color)} />
                            <span className="text-xs font-medium text-zinc-600">{config?.label}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-sm text-zinc-900">{doc.number}</TableCell>
                      <TableCell className="text-sm text-zinc-600">{doc.customerName ?? "—"}</TableCell>
                      <TableCell className="text-sm text-zinc-600">{formatDate(doc.issueDate)}</TableCell>
                      {showValidite && (
                        <TableCell className="text-sm text-zinc-600">
                          {doc.validityDate ? formatDate(doc.validityDate) : "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-sm font-medium text-zinc-900 text-right">
                        {formatMoney(doc.totalInclTax)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center gap-1 outline-none">
                            <StatusBadge status={doc.status as any} />
                            <ChevronDown className="h-3 w-3 text-zinc-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-40">
                            <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleStatusChange(doc._id, "draft")}>
                              Brouillon
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleStatusChange(doc._id, "sent")}>
                              Envoyé
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleStatusChange(doc._id, "paid")}>
                              Payé
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleStatusChange(doc._id, "partially_paid")}>
                              Partiellement payé
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleStatusChange(doc._id, "cancelled")}>
                              Annulé
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <ActionsMenu
                          onEdit={() => handleEdit(doc)}
                          onDuplicate={() => handleDuplicate(doc)}
                          onDownload={() => handleDownload(doc)}
                          onArchive={() => handleArchive(doc)}
                          onDelete={() => setDeleteTarget(doc)}
                          loading={isLoading ?? false}
                        />
                      </TableCell>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-44">
                      <ContextMenuItem className="gap-2" onClick={() => handleEdit(doc)}>
                        <PenLine className="h-3.5 w-3.5" /> Modifier
                      </ContextMenuItem>
                      <ContextMenuItem className="gap-2" onClick={() => handleDuplicate(doc)}>
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                        Dupliquer
                      </ContextMenuItem>
                      <ContextMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                        <Download className="h-3.5 w-3.5" /> Télécharger
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="gap-2" onClick={() => handleArchive(doc)}>
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                        Archiver
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                        onClick={() => setDeleteTarget(doc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le document {deleteTarget?.number}&nbsp;?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === `delete-${deleteTarget?._id}`}
            >
              {actionLoading === `delete-${deleteTarget?._id}` ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
