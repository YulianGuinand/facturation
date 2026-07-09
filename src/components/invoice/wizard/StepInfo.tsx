"use client";

import { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/company";
import { useWizard } from "./wizard-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function StepInfo() {
  const companyId = useCompanyId();
  const { dispatch, goToNextStep, goToPreviousStep, state } = useWizard();
  const updateInfo = useMutation(api.mutations.invoice_wizard.updateInvoiceInfo);
  const [saving, setSaving] = useState(false);
  const isEditing = state.documentId !== null && state.documentNumber !== null;

  const existingDoc = useQuery(
    api.queries.documents.getDocumentById,
    isEditing && state.documentId ? { documentId: state.documentId } : "skip"
  );

  const paymentMethods = useQuery(
    api.queries.documents.getPaymentMethods,
    companyId ? { companyId } : "skip"
  );

  const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

  const [issueDate, setIssueDate] = useState(toDateInput(new Date()));
  const [dueDate, setDueDate] = useState(
    toDateInput(new Date(Date.now() + 30 * 86400000))
  );
  const [paymentMethodId, setPaymentMethodId] = useState("");
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
          <select
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm font-sans shadow-sm"
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
      </div>

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
