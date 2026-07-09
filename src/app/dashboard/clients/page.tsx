"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Mail, Phone, PenLine, Copy, Trash2 } from "lucide-react";
import { useCompanyId } from "@/lib/company";
import { ActionsMenu } from "@/components/dashboard/ActionsMenu";
import { useRouter } from "next/navigation";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";

export default function ClientsPage() {
  const router = useRouter();
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");
  const customers = useQuery(
    api.queries.customers.getCustomers,
    companyId ? { companyId, isActive: true } : "skip"
  );
  const archiveCustomer = useMutation(api.mutations.customers.archiveCustomer);
  const [editingCustomer, setEditingCustomer] = useState<Doc<"customers"> | null>(null);

  const filtered = (customers ?? []).filter(
    (c) =>
      (c.companyName?.toLowerCase().includes(search.toLowerCase())) ||
      (c.firstName?.toLowerCase().includes(search.toLowerCase())) ||
      (c.lastName?.toLowerCase().includes(search.toLowerCase())) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleArchive = useCallback(
    async (customerId: Id<"customers">, name: string) => {
      if (!companyId) return;
      if (!window.confirm(`Archiver le client "${name}" ?`)) return;
      try {
        await archiveCustomer({ customerId, companyId: companyId as any });
        toast.success("Client archivé");
      } catch {
        toast.error("Erreur lors de l'archivage");
      }
    },
    [companyId, archiveCustomer]
  );

  return (
    <div>
      <Header
        title="Clients"
        subtitle="Gérez votre carnet de clients."
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Rechercher un client..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader>
            <tr className="bg-zinc-50">
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nom</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Société</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Téléphone</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">SIRET</TableHead>
              <TableHead className="w-12" />
            </tr>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <tr>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-400 text-sm">
                  Aucun client
                </TableCell>
              </tr>
            ) : (
              filtered.map((client) => (
                <ContextMenu key={client._id}>
                    <ContextMenuTrigger
                    render={<tr />}
                    className="border-b transition-colors hover:bg-zinc-50/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/clients/${client._id}`)}
                  >
                    <TableCell className="font-medium text-sm text-zinc-900">
                      {client.companyName ?? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {client.type === "professional" ? client.companyName : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                        {client.email ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        {client.phone ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500 font-mono">{client.siret ?? "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ActionsMenu
                        onEdit={() => setEditingCustomer(client)}
                        onArchive={() => handleArchive(client._id, client.companyName ?? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim())}
                      />
                    </TableCell>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-44">
                    <ContextMenuItem className="gap-2" onClick={() => setEditingCustomer(client)}>
                      <PenLine className="h-3.5 w-3.5" /> Modifier
                    </ContextMenuItem>
                    <ContextMenuItem className="gap-2" onClick={() => toast.success("Client dupliqué")}>
                      <Copy className="h-3.5 w-3.5" /> Dupliquer
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                      onClick={() => handleArchive(client._id, client.companyName ?? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim())}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Archiver
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingCustomer && (
        <CustomerEditDialog
          customer={editingCustomer}
          companyId={companyId as any}
          open={!!editingCustomer}
          onOpenChange={(open) => { if (!open) setEditingCustomer(null); }}
        />
      )}
    </div>
  );
}

function CustomerEditDialog({
  customer,
  companyId,
  open,
  onOpenChange,
}: {
  customer: Doc<"customers">;
  companyId: Id<"companies">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateCustomer = useMutation(api.mutations.customers.updateCustomer);
  const [companyName, setCompanyName] = useState(customer.companyName ?? "");
  const [firstName, setFirstName] = useState(customer.firstName ?? "");
  const [lastName, setLastName] = useState(customer.lastName ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [siren, setSiren] = useState(customer.siren ?? "");
  const [siret, setSiret] = useState(customer.siret ?? "");
  const [vatNumber, setVatNumber] = useState(customer.vatNumber ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCustomer({
        customerId: customer._id,
        companyId,
        companyName: companyName || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        siren: siren || undefined,
        siret: siret || undefined,
        vatNumber: vatNumber || undefined,
      });
      toast.success("Client mis à jour");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            {customer.companyName ?? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Raison sociale</label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prénom</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Téléphone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">SIREN</label>
              <Input value={siren} onChange={(e) => setSiren(e.target.value)} maxLength={9} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SIRET</label>
              <Input value={siret} onChange={(e) => setSiret(e.target.value)} maxLength={14} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Numéro TVA intracommunautaire</label>
            <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
