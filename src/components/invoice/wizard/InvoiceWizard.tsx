"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { api } from "../../../../convex/_generated/api";
import { StepClient } from "./StepClient";
import { StepCompany } from "./StepCompany";
import { StepInfo } from "./StepInfo";
import { StepLines } from "./StepLines";
import { StepProgress } from "./StepProgress";
import { StepReview } from "./StepReview";
import { StepValidate } from "./StepValidate";
import { WizardProvider, useWizard } from "./wizard-context";

function WizardContent() {
  const { state } = useWizard();
  const router = useRouter();

  const steps = {
    company: StepCompany,
    client: StepClient,
    info: StepInfo,
    lines: StepLines,
    review: StepReview,
    validate: StepValidate,
  };

  const Component = steps[state.currentStep];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/factures")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm font-medium">
          {state.documentId && state.documentNumber
            ? `Modification - n°${state.documentNumber}`
            : "Nouvelle facture"}
        </span>
      </div>

      <StepProgress />

      <div className="bg-card border rounded-xl p-6">
        <Component />
      </div>
    </div>
  );
}

function WizardLoader({ editId }: { editId?: string }) {
  const { dispatch } = useWizard();
  const initialisedRef = useRef(false);

  const editDoc = useQuery(
    api.queries.documents.getDocumentById,
    editId ? { documentId: editId as any } : "skip",
  );

  useEffect(() => {
    if (editId && editDoc && !initialisedRef.current) {
      initialisedRef.current = true;
      const preValidated = editDoc.customerId
        ? ["company", "client"]
        : ["company"];
      dispatch({
        type: "INIT_EDIT",
        payload: {
          documentId: editId as any,
          documentNumber: editDoc.number,
          companyId: editDoc.companyId,
          customerId: editDoc.customerId,
          validatedSteps: preValidated as any,
        },
      });
    }
  }, [editId, editDoc, dispatch]);

  if (editId && !editDoc) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement du document...
      </div>
    );
  }

  return <WizardContent />;
}

export function InvoiceWizard({ editId }: { editId?: string }) {
  return (
    <WizardProvider documentType="invoice">
      <WizardLoader editId={editId} />
    </WizardProvider>
  );
}
