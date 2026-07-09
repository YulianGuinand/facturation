"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { BankAccountForm } from "./BankAccountForm";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BankAccountList({ companyId }: { companyId: string }) {
  const bankAccounts = useQuery(
    api.queries.bank_accounts.getBankAccounts,
    { companyId: companyId as any }
  );
  const deleteBankAccount = useMutation(api.mutations.bank_accounts.deleteBankAccount);
  const [editing, setEditing] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (!bankAccounts) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-3">
      {bankAccounts.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun compte bancaire enregistré.</p>
      )}

      {bankAccounts.map((acc) => (
        <div
          key={acc._id}
          className="border rounded-lg p-4 flex items-start justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="font-medium">
              {acc.name}
              {acc.isDefault && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Par défaut
                </span>
              )}
            </p>
            <p className="text-sm font-mono">IBAN : {acc.iban}</p>
            <p className="text-sm font-mono">BIC : {acc.bic}</p>
            {acc.bankName && <p className="text-sm text-muted-foreground">{acc.bankName}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditing(acc._id)}>
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={async () => {
                await deleteBankAccount({
                  bankAccountId: acc._id as any,
                  companyId: companyId as any,
                });
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger
          render={<Button variant="outline" className="w-full" />}
        >
          Ajouter un compte bancaire
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau compte bancaire</DialogTitle>
          </DialogHeader>
          <BankAccountForm
            companyId={companyId}
            onSuccess={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le compte bancaire</DialogTitle>
            </DialogHeader>
            <BankAccountForm
              companyId={companyId}
              bankAccountId={editing}
              onSuccess={() => setEditing(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
