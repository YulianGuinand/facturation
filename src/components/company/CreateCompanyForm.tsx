"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompany } from "@/lib/company-context";
import { Loader2 } from "lucide-react";

export function CreateCompanyForm({
  onSuccess,
}: {
  onSuccess?: (id: string) => void;
} = {}) {
  const [name, setName] = useState("");
  const [legalForm, setLegalForm] = useState("SASU");
  const [siren, setSiren] = useState("");
  const [siret, setSiret] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [rcs, setRcs] = useState("");
  const [shareCapital, setShareCapital] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("France");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCompany = useMutation(api.mutations.companies.createCompany);
  const { setCompanyId } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !siren || !siret) return;
    setIsSubmitting(true);
    try {
      const id = await createCompany({
        name,
        legalForm,
        siren,
        siret,
        isMicroEnterprise: legalForm === "micro",
        email: email || undefined,
        phone: phone || undefined,
        vatNumber: vatNumber || undefined,
        rcs: rcs || undefined,
        shareCapital: shareCapital ? parseInt(shareCapital.replace(/\D/g, "")) : undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        postalCode: postalCode || undefined,
        city: city || undefined,
        country: country || undefined,
      });
      setCompanyId(id);
      onSuccess?.(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Raison sociale *</label>
        <Input placeholder="Ma Société" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Forme juridique</label>
          <select
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm font-sans shadow-sm"
            value={legalForm}
            onChange={(e) => setLegalForm(e.target.value)}
          >
            <option value="SASU">SASU</option>
            <option value="SAS">SAS</option>
            <option value="SARL">SARL</option>
            <option value="EURL">EURL</option>
            <option value="EI">EI</option>
            <option value="micro">Micro-entreprise</option>
            <option value="Association">Association</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Capital social (€)</label>
          <Input
            placeholder="1000"
            value={shareCapital}
            onChange={(e) => setShareCapital(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">SIREN *</label>
          <Input placeholder="123456789" maxLength={9} value={siren} onChange={(e) => setSiren(e.target.value.replace(/\D/g, ""))} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">SIRET *</label>
          <Input placeholder="12345678900012" maxLength={14} value={siret} onChange={(e) => setSiret(e.target.value.replace(/\D/g, ""))} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Numéro TVA intracommunautaire</label>
          <Input placeholder="FR12345678900" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">RCS (ville)</label>
          <Input placeholder="RCS Besançon" value={rcs} onChange={(e) => setRcs(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" placeholder="contact@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Téléphone</label>
          <Input placeholder="0612345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Adresse</label>
        <Input placeholder="Numéro et rue *" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
      </div>
      <Input placeholder="Complément d'adresse" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Code postal</label>
          <Input placeholder="25000" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ville</label>
          <Input placeholder="Besançon" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Pays</label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" variant="outline" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Créer mon espace
      </Button>
    </form>
  );
}
