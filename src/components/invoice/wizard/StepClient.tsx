"use client";

import { useState } from "react";
import { useCompanyId } from "@/lib/company";
import { useWizard } from "./wizard-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StepClient() {
  const companyId = useCompanyId();
  const { dispatch, goToNextStep, goToPreviousStep, state } = useWizard();
  const updateClient = useMutation(api.mutations.invoice_wizard.updateInvoiceClient);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(state.customerId);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const isEditing = state.documentId !== null && state.documentNumber !== null;

  const customers = useQuery(
    api.queries.customers.getCustomers,
    companyId ? { companyId } : "skip"
  );

  const filtered = customers
    ? customers.filter(
        (c) =>
          !search ||
          (c.companyName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim())
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
          (c.siren && c.siren.includes(search))
      )
    : [];

  const handleContinue = async () => {
    if (!selected || !state.documentId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    setSaving(true);
    try {
      await updateClient({
        documentId: state.documentId,
        companyId: state.companyId!,
        customerId: selected,
      });
      dispatch({ type: "SET_CLIENT", customerId: selected });
      dispatch({ type: "VALIDATE_STEP", step: "client" });
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
        <h2 className="text-lg font-semibold">Sélectionnez le client</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Recherchez un client existant ou créez-en un nouveau.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email ou SIREN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun client trouvé</p>
          </div>
        ) : (
          filtered.map((c) => {
            const name = c.companyName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => setSelected(c._id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  selected === c._id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{name}</p>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {c.email && <span>{c.email}</span>}
                    {c.siren && <span>SIREN {c.siren}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau client
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un client</DialogTitle>
            </DialogHeader>
            <CreateCustomerForm
              companyId={companyId!}
              onSuccess={(id) => {
                setSelected(id);
                setOpen(false);
                toast.success("Client créé");
              }}
            />
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={goToPreviousStep}>
            Retour
          </Button>
          <Button onClick={handleContinue} disabled={!selected || saving}>
            {saving ? "Enregistrement..." : "Continuer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateCustomerForm({
  companyId,
  onSuccess,
}: {
  companyId: string;
  onSuccess: (id: any) => void;
}) {
  const createCustomer = useMutation(api.mutations.customers.createCustomer);
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [siren, setSiren] = useState("");
  const [siret, setSiret] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("France");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName && !firstName && !lastName) {
      toast.error("Renseignez au moins le nom ou la raison sociale");
      return;
    }
    setSaving(true);
    try {
      const id = await createCustomer({
        companyId: companyId as any,
        type: companyName ? "professional" : "individual",
        companyName: companyName || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        siren: siren || undefined,
        siret: siret || undefined,
        vatNumber: vatNumber || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        postalCode: postalCode || undefined,
        city: city || undefined,
        country: country || undefined,
      });
      onSuccess(id);
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Raison sociale</label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nom de l'entreprise" />
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
        <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="FR12345678900" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Adresse de facturation</label>
        <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Numéro et rue" />
      </div>
      <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Complément d'adresse" />
      <div className="grid grid-cols-3 gap-3">
        <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Code postal" />
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" />
        <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pays" />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
        Créer le client
      </Button>
    </form>
  );
}
