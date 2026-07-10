"use client";

import { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/company";
import { useWizard } from "./wizard-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function StepInfo() {
  const companyId = useCompanyId();
  const { dispatch, goToNextStep, goToPreviousStep, state } = useWizard();
  const updateInfo = useMutation(api.mutations.invoice_wizard.updateInvoiceInfo);
  const createPaymentMethod = useMutation(api.mutations.payment_methods.createPaymentMethod);
  const upsertBankAccount = useMutation(api.mutations.bank_accounts.upsertBankAccount);
  const [saving, setSaving] = useState(false);
  const isEditing = state.documentId !== null && state.documentNumber !== null;
  const [pmDialog, setPmDialog] = useState(false);
  const [newPmName, setNewPmName] = useState("");
  const [newPmCode, setNewPmCode] = useState("");
  const [baDialog, setBaDialog] = useState(false);
  const [newBaName, setNewBaName] = useState("");
  const [newBaIban, setNewBaIban] = useState("");
  const [newBaBic, setNewBaBic] = useState("");
  const [newBaBankName, setNewBaBankName] = useState("");

  const existingDoc = useQuery(
    api.queries.documents.getDocumentById,
    isEditing && state.documentId ? { documentId: state.documentId } : "skip"
  );

  const paymentMethods = useQuery(
    api.queries.documents.getPaymentMethods,
    companyId ? { companyId } : "skip"
  );

  const bankAccounts = useQuery(
    api.queries.bank_accounts.getBankAccounts,
    companyId ? { companyId } : "skip"
  );

  const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

  const [issueDate, setIssueDate] = useState(toDateInput(new Date()));
  const [dueDate, setDueDate] = useState(
    toDateInput(new Date(Date.now() + 30 * 86400000))
  );
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [internalReference, setInternalReference] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [operationCategory, setOperationCategory] = useState("");

  useEffect(() => {
    if (existingDoc) {
      setIssueDate(toDateInput(new Date(existingDoc.issueDate)));
      if (existingDoc.dueDate) setDueDate(toDateInput(new Date(existingDoc.dueDate)));
      if (existingDoc.paymentMethodId) setPaymentMethodId(existingDoc.paymentMethodId);
      if (existingDoc.bankAccountId) setBankAccountId(existingDoc.bankAccountId);
      if (existingDoc.orderReference) setOrderReference(existingDoc.orderReference);
      if (existingDoc.internalReference) setInternalReference(existingDoc.internalReference);
      if (existingDoc.customerNotes) setCustomerNotes(existingDoc.customerNotes);
      if (existingDoc.internalNotes) setInternalNotes(existingDoc.internalNotes);
      if (existingDoc.operationCategory) setOperationCategory(existingDoc.operationCategory);
    }
  }, [existingDoc]);

  const handleContinue = async () => {
    if (!state.documentId || !state.companyId) return;
    setSaving(true);
    try {
      await updateInfo({
        documentId: state.documentId,
        companyId: state.companyId,
        issueDate: new Date(issueDate).getTime(),
        dueDate: new Date(dueDate).getTime(),
        paymentMethodId: (paymentMethodId || undefined) as any,
        bankAccountId: (bankAccountId || undefined) as any,
        orderReference: orderReference || undefined,
        internalReference: internalReference || undefined,
        customerNotes: customerNotes || undefined,
        internalNotes: internalNotes || undefined,
        operationCategory: operationCategory || undefined,
      });
      dispatch({ type: "VALIDATE_STEP", step: "info" });
      goToNextStep();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Informations générales</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dates, références et conditions de paiement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date d'émission *</label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Date d'échéance *</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Mode de paiement</label>
        <div className="flex gap-2">
          <select
            className="flex h-9 flex-1 rounded-lg border border-input bg-background px-3 py-1 text-sm font-sans shadow-sm"
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
          >
            <option value="">Sélectionner...</option>
            {paymentMethods?.map((pm) => (
              <option key={pm._id} value={pm._id}>
                {pm.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setPmDialog(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={pmDialog} onOpenChange={(o) => { if (!o) setPmDialog(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau mode de paiement</DialogTitle>
            <DialogDescription>Ajoutez un nouveau mode de paiement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={newPmName}
                onChange={(e) => setNewPmName(e.target.value)}
                placeholder="Ex: Virement bancaire"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input
                value={newPmCode}
                onChange={(e) => setNewPmCode(e.target.value)}
                placeholder="Ex: transfer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPmDialog(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!newPmName || !newPmCode}
                onClick={async () => {
                  if (!companyId || !newPmName || !newPmCode) return;
                  try {
                    const id = await createPaymentMethod({
                      companyId: companyId as any,
                      name: newPmName,
                      code: newPmCode,
                    });
                    setPaymentMethodId(id);
                    setPmDialog(false);
                    setNewPmName("");
                    setNewPmCode("");
                    toast.success("Mode de paiement créé");
                  } catch {
                    toast.error("Erreur lors de la création");
                  }
                }}
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <label className="text-sm font-medium">Compte bancaire</label>
        <div className="flex gap-2">
          <select
            className="flex h-9 flex-1 rounded-lg border border-input bg-background px-3 py-1 text-sm font-sans shadow-sm"
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
          >
            <option value="">Sélectionner...</option>
            {bankAccounts?.map((ba) => (
              <option key={ba._id} value={ba._id}>
                {ba.name} {ba.iban ? `(${ba.iban.slice(-4)})` : ""}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setBaDialog(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={baDialog} onOpenChange={(o) => { if (!o) setBaDialog(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau compte bancaire</DialogTitle>
            <DialogDescription>Ajoutez un nouveau compte bancaire.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={newBaName}
                onChange={(e) => setNewBaName(e.target.value)}
                placeholder="Ex: Compte professionnel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IBAN</label>
              <Input
                value={newBaIban}
                onChange={(e) => setNewBaIban(e.target.value)}
                placeholder="FR76..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">BIC</label>
              <Input
                value={newBaBic}
                onChange={(e) => setNewBaBic(e.target.value)}
                placeholder="Ex: BNPAFRPP"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Banque</label>
              <Input
                value={newBaBankName}
                onChange={(e) => setNewBaBankName(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBaDialog(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!newBaName || !newBaIban || !newBaBic}
                onClick={async () => {
                  if (!companyId || !newBaName || !newBaIban || !newBaBic) return;
                  try {
                    const id = await upsertBankAccount({
                      companyId: companyId as any,
                      name: newBaName,
                      iban: newBaIban,
                      bic: newBaBic,
                      bankName: newBaBankName || undefined,
                      isDefault: false,
                    });
                    setBankAccountId(id);
                    setBaDialog(false);
                    setNewBaName("");
                    setNewBaIban("");
                    setNewBaBic("");
                    setNewBaBankName("");
                    toast.success("Compte bancaire créé");
                  } catch {
                    toast.error("Erreur lors de la création");
                  }
                }}
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nature de l'opération</label>
        <select
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm font-sans shadow-sm"
          value={operationCategory}
          onChange={(e) => setOperationCategory(e.target.value)}
        >
          <option value="">Sélectionner...</option>
          <option value="Prestation de services">Prestation de services</option>
          <option value="Livraison de biens">Livraison de biens</option>
          <option value="Opération mixte">Opération mixte</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Réf. commande client</label>
          <Input
            value={orderReference}
            onChange={(e) => setOrderReference(e.target.value)}
            placeholder="Optionnel"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Réf. interne</label>
          <Input
            value={internalReference}
            onChange={(e) => setInternalReference(e.target.value)}
            placeholder="Optionnel"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes pour le client</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm"
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          placeholder="Informations visibles sur le document..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes internes</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Non visible sur le document..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goToPreviousStep}>
          Retour
        </Button>
        <Button onClick={handleContinue} disabled={saving}>
          {saving ? "Enregistrement..." : "Continuer"}
        </Button>
      </div>
    </div>
  );
}
