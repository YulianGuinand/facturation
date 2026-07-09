"use client";

import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { CheckCircle, FileDown, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { useWizard } from "./wizard-context";

export function StepValidate() {
  const { state, goToPreviousStep } = useWizard();
  const finalize = useMutation(api.mutations.invoice_wizard.finalizeInvoice);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleFinalize = async (status: "draft" | "sent") => {
    if (!state.documentId || !state.companyId) return;
    setSaving(true);
    try {
      await finalize({
        documentId: state.documentId,
        companyId: state.companyId,
        status,
      });
      toast.success(
        status === "sent"
          ? "Facture finalisée et envoyée"
          : "Facture enregistrée comme brouillon",
      );
      router.push("/dashboard/factures");
    } catch {
      toast.error("Erreur lors de la finalisation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Validation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Toutes les étapes sont complètes. Choisissez l'action ci-dessous.
        </p>
        {state.documentNumber && (
          <p className="text-sm font-medium mt-2">
            Document n° {state.documentNumber}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => handleFinalize("draft")}
          disabled={saving}
          className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all bg-card"
        >
          <FileDown className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">Enregistrer comme brouillon</p>
            <p className="text-xs text-muted-foreground mt-1">
              Vous pourrez modifier et envoyer plus tard
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFinalize("sent")}
          disabled={saving}
          className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all"
        >
          <Send className="h-8 w-8 text-primary" />
          <div className="text-center">
            <p className="font-medium text-primary">Finaliser</p>
            <p className="text-xs text-muted-foreground mt-1">
              Le document sera marqué comme envoyé
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-center">
        <Button variant="ghost" onClick={goToPreviousStep} disabled={saving}>
          Retour
        </Button>
        {saving && (
          <span className="ml-2 text-sm text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Traitement en cours...
          </span>
        )}
      </div>
    </div>
  );
}
