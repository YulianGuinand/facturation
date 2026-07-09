"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "@/lib/company-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BankAccountList } from "./BankAccountList";
import { LogoUpload, LogoThumb } from "@/components/company/LogoUpload";
import { PenLine, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { company } = useCompany();

  if (!company) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez les informations de votre société.</p>
      </div>

      <CompanyEditCard companyId={company._id} />

      <section>
        <h2 className="text-lg font-semibold mb-4">Coordonnées bancaires</h2>
        <BankAccountList companyId={company._id} />
      </section>
    </div>
  );
}

function CompanyEditCard({ companyId }: { companyId: string }) {
  const [editing, setEditing] = useState(false);
  const company = useQuery(api.queries.companies.getCompany, { companyId: companyId as any });
  const address = useQuery(
    api.queries.addresses.getAddressById,
    company?.addressId ? { addressId: company.addressId } : "skip"
  );

  if (!company) return <div className="border rounded-lg p-4 text-sm text-muted-foreground">Chargement...</div>;

  return (
    <>
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{company.name}</h2>
            {company.legalForm && <p className="text-sm text-muted-foreground">{company.legalForm}</p>}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
            <PenLine className="h-3.5 w-3.5" />
            Modifier
          </Button>
        </div>
        <div className="flex gap-4 pt-2">
          {company.logoStorageId && (
            <LogoThumb companyId={company._id} storageId={company.logoStorageId} />
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm flex-1">
            <div><span className="text-muted-foreground">SIREN :</span> {company.siren}</div>
            <div><span className="text-muted-foreground">SIRET :</span> {company.siret}</div>
            {company.vatNumber && <div><span className="text-muted-foreground">TVA intra. :</span> {company.vatNumber}</div>}
            {company.rcs && <div><span className="text-muted-foreground">RCS :</span> {company.rcs}</div>}
            {company.shareCapital !== undefined && <div><span className="text-muted-foreground">Capital :</span> {company.shareCapital.toLocaleString()} €</div>}
            {company.email && <div><span className="text-muted-foreground">Email :</span> {company.email}</div>}
            {company.phone && <div><span className="text-muted-foreground">Tél. :</span> {company.phone}</div>}
            {address && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Adresse :</span> {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.postalCode} {address.city}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={(o) => { if (!o) setEditing(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la société</DialogTitle>
            <DialogDescription>{company.name}</DialogDescription>
          </DialogHeader>
          <CompanyEditForm
            company={company}
            address={address ?? undefined}
            onSuccess={() => setEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompanyEditForm({
  company,
  address,
  onSuccess,
}: {
  company: NonNullable<ReturnType<typeof useQuery<typeof api.queries.companies.getCompany>>>;
  address?: NonNullable<ReturnType<typeof useQuery<typeof api.queries.addresses.getAddressById>>>;
  onSuccess: () => void;
}) {
  const updateCompany = useMutation(api.mutations.companies.updateCompany);
  const [name, setName] = useState(company.name);
  const [legalForm, setLegalForm] = useState(company.legalForm);
  const [siren, setSiren] = useState(company.siren);
  const [siret, setSiret] = useState(company.siret);
  const [email, setEmail] = useState(company.email ?? "");
  const [phone, setPhone] = useState(company.phone ?? "");
  const [vatNumber, setVatNumber] = useState(company.vatNumber ?? "");
  const [rcs, setRcs] = useState(company.rcs ?? "");
  const [shareCapital, setShareCapital] = useState(company.shareCapital?.toString() ?? "");
  const [addressLine1, setAddressLine1] = useState(address?.line1 ?? "");
  const [addressLine2, setAddressLine2] = useState(address?.line2 ?? "");
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [country, setCountry] = useState(address?.country ?? "France");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompany({
        companyId: company._id,
        name: name !== company.name ? name : undefined,
        legalForm: legalForm !== company.legalForm ? legalForm : undefined,
        siren: siren !== company.siren ? siren : undefined,
        siret: siret !== company.siret ? siret : undefined,
        email: email !== (company.email ?? "") ? (email || undefined) : undefined,
        phone: phone !== (company.phone ?? "") ? (phone || undefined) : undefined,
        vatNumber: vatNumber !== (company.vatNumber ?? "") ? (vatNumber || undefined) : undefined,
        rcs: rcs !== (company.rcs ?? "") ? (rcs || undefined) : undefined,
        shareCapital: shareCapital !== (company.shareCapital?.toString() ?? "")
          ? (shareCapital ? parseInt(shareCapital.replace(/\D/g, "")) : undefined)
          : undefined,
        addressLine1: addressLine1 !== (address?.line1 ?? "") ? (addressLine1 || undefined) : undefined,
        addressLine2: addressLine2 !== (address?.line2 ?? "")
          ? (addressLine2 || undefined)
          : undefined,
        postalCode: postalCode !== (address?.postalCode ?? "") ? (postalCode || undefined) : undefined,
        city: city !== (address?.city ?? "") ? (city || undefined) : undefined,
        country: country !== (address?.country ?? "France") ? (country || undefined) : undefined,
      });
      toast.success("Société mise à jour");
      onSuccess();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Raison sociale *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
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
          <Input value={shareCapital} onChange={(e) => setShareCapital(e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">SIREN *</label>
          <Input value={siren} onChange={(e) => setSiren(e.target.value.replace(/\D/g, ""))} maxLength={9} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">SIRET *</label>
          <Input value={siret} onChange={(e) => setSiret(e.target.value.replace(/\D/g, ""))} maxLength={14} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Numéro TVA intracommunautaire</label>
          <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">RCS (ville)</label>
          <Input value={rcs} onChange={(e) => setRcs(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Téléphone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Adresse</label>
        <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Numéro et rue" />
      </div>
      <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Complément d'adresse" />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Code postal</label>
          <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ville</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Pays</label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>

      <div className="py-2 border-t">
        <LogoUpload companyId={company._id} storageId={company.logoStorageId} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Annuler</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
