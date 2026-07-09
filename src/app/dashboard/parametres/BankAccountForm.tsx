"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function BankAccountForm({
  companyId,
  bankAccountId,
  onSuccess,
}: {
  companyId: string;
  bankAccountId?: string;
  onSuccess?: () => void;
}) {
  const upsert = useMutation(api.mutations.bank_accounts.upsertBankAccount);
  const existing = useQuery(
    api.queries.bank_accounts.getBankAccounts,
    bankAccountId ? { companyId: companyId as any } : "skip"
  );

  const existingAccount = existing?.find((a) => a._id === bankAccountId);

  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [bankName, setBankName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingAccount) {
      setName(existingAccount.name);
      setIban(existingAccount.iban);
      setBic(existingAccount.bic);
      setBankName(existingAccount.bankName ?? "");
      setIsDefault(existingAccount.isDefault);
    }
  }, [existingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !iban.trim() || !bic.trim()) {
      toast.error("Nom, IBAN et BIC sont requis");
      return;
    }
    setSaving(true);
    try {
      await upsert({
        bankAccountId: bankAccountId as any,
        companyId: companyId as any,
        name: name.trim(),
        iban: iban.trim(),
        bic: bic.trim(),
        bankName: bankName.trim() || undefined,
        isDefault,
      });
      toast.success(bankAccountId ? "Compte modifié" : "Compte ajouté");
      onSuccess?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nom *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Compte principal" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">IBAN *</label>
        <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">BIC *</label>
        <Input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="XXXXXXXXX" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nom de la banque</label>
        <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Optionnel" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Compte par défaut
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : bankAccountId ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
