"use client";

import { useCompany } from "@/lib/company-context";
import { useWizard } from "./wizard-context";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Loader2 } from "lucide-react";
import { CreateCompanyForm } from "@/components/company/CreateCompanyForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StepCompany() {
  const { companyId, companies, setCompanyId } = useCompany();
  const { dispatch, goToNextStep, state } = useWizard();
  const createDraft = useMutation(api.mutations.invoice_wizard.createInvoiceDraft);
  const [creating, setCreating] = useState(false);

  const handleSelectCompany = (id: typeof companyId) => {
    if (!id) return;
    setCompanyId(id);
    dispatch({ type: "SET_COMPANY", companyId: id });
  };

  const handleContinue = async () => {
    if (!state.companyId) {
      toast.error("Veuillez sélectionner une société");
      return;
    }
    setCreating(true);
    try {
      const result = await createDraft({ companyId: state.companyId });
      dispatch({ type: "SET_DOCUMENT", documentId: result.documentId, number: result.number });
      dispatch({ type: "VALIDATE_STEP", step: "company" });
      goToNextStep();
    } catch {
      toast.error("Erreur lors de la création du document");
    } finally {
      setCreating(false);
    }
  };

  if (companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Créer votre société</CardTitle>
          <CardDescription>
            Vous devez d'abord créer une société pour émettre des documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCompanyForm
            onSuccess={(id) => {
              setCompanyId(id as any);
              dispatch({ type: "SET_COMPANY", companyId: id as any });
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Sélectionnez la société émettrice</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cette société apparaîtra comme émetteur sur le document.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {companies.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => handleSelectCompany(c._id)}
            className={`relative flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
              state.companyId === c._id
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{c.name}</p>
              {c.siren && <p className="text-xs text-muted-foreground">SIREN {c.siren}</p>}
              {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Dialog>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle société
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer votre société</DialogTitle>
            </DialogHeader>
            <CreateCompanyForm
              onSuccess={(id) => {
                setCompanyId(id as any);
                dispatch({ type: "SET_COMPANY", companyId: id as any });
              }}
            />
          </DialogContent>
        </Dialog>

        <Button onClick={handleContinue} disabled={!state.companyId || creating}>
          {creating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Continuer
        </Button>
      </div>
    </div>
  );
}
