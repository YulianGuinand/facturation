"use client";

import { useCompanyId } from "@/lib/company";
import { useCompany } from "@/lib/company-context";
import { useWizard } from "./wizard-context";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Building2, User, FileText, Landmark } from "lucide-react";

export function StepReview() {
  const companyId = useCompanyId();
  const { goToNextStep, goToPreviousStep, state } = useWizard();
  const { company } = useCompany();

  const data = useQuery(
    api.queries.invoice_wizard.getInvoiceWizardData,
    state.documentId && state.companyId
      ? { documentId: state.documentId, companyId: state.companyId }
      : "skip"
  );

  const customer = data?.customer;
  const doc = data?.document;
  const items = data?.items ?? [];
  const taxRates = data?.taxRates ?? [];
  const units = data?.units ?? [];

  const bankAccount = useQuery(
    api.queries.bank_accounts.getBankAccountById,
    doc?.bankAccountId ? { bankAccountId: doc.bankAccountId as any } : "skip",
  );

  const getUnitLabel = (unitId: any) => {
    if (!unitId) return "";
    const unit = units.find((u: any) => u._id === unitId);
    return unit?.abbreviation ?? "";
  };

  const getVatLabel = (rate: number) => {
    const tr = taxRates.find((t: any) => t.rate === rate);
    return tr?.name ?? `${(rate / 100).toFixed(1)}%`;
  };

  const subtotals = items.reduce(
    (acc: any, item: any) => ({
      totalHT: acc.totalHT + item.totalExclTax,
      totalVAT: acc.totalVAT + item.vatAmount,
      totalTTC: acc.totalTTC + item.totalInclTax,
    }),
    { totalHT: 0, totalVAT: 0, totalTTC: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Récapitulatif</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez l'ensemble des informations avant validation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Building2 className="h-4 w-4" /> Émetteur
          </div>
          {company && (
            <div>
              <p className="font-medium">{company.name}</p>
              {company.siren && (
                <p className="text-sm text-muted-foreground">SIREN {company.siren}</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <User className="h-4 w-4" /> Client
          </div>
          {customer && (
            <div>
              <p className="font-medium">
                {customer.companyName ??
                  `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()}
              </p>
              {customer.email && (
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {doc && (
        <div className="p-4 rounded-lg border bg-card space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            <FileText className="h-4 w-4" /> Document
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">N°</span>
              <p className="font-medium">{doc.number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Émission</span>
              <p className="font-medium">
                {new Date(doc.issueDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Échéance</span>
              <p className="font-medium">
                {doc.dueDate ? new Date(doc.dueDate).toLocaleDateString("fr-FR") : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Devise</span>
              <p className="font-medium">{doc.currency ?? "EUR"}</p>
            </div>
          </div>
          {doc.internalReference && (
            <div className="text-sm">
              <span className="text-muted-foreground">Réf. interne : </span>
              {doc.internalReference}
            </div>
          )}
          {doc.customerNotes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes client : </span>
              {doc.customerNotes}
            </div>
          )}
          {bankAccount && (
            <div className="flex items-start gap-2 text-sm pt-1 border-t mt-2">
              <Landmark className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">{bankAccount.name}</span>
                {bankAccount.bankName && <span className="text-muted-foreground"> — {bankAccount.bankName}</span>}
                <p className="font-mono text-xs text-muted-foreground">
                  IBAN: {bankAccount.iban} · BIC: {bankAccount.bic}
                </p>
              </div>
            </div>
          )}
          {doc.legalNotes && (
            <div className="text-sm pt-1 border-t mt-2">
              <span className="text-muted-foreground font-medium">Conditions de paiement :</span>
              <pre className="text-xs mt-1 whitespace-pre-wrap font-sans text-muted-foreground">
                {doc.legalNotes}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Réf.</th>
              <th className="text-left p-3 font-medium">Désignation</th>
              <th className="text-right p-3 font-medium">Qté</th>
              <th className="text-right p-3 font-medium">PU HT</th>
              <th className="text-right p-3 font-medium">Remise</th>
              <th className="text-right p-3 font-medium">TVA</th>
              <th className="text-right p-3 font-medium">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item._id} className="border-b last:border-0">
                <td className="p-3 text-muted-foreground">{item.reference ?? "-"}</td>
                <td className="p-3">
                  <span className="[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:text-xs [&_li_p]:m-0 [&_p]:text-xs [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold" dangerouslySetInnerHTML={{ __html: item.designation ?? "" }} />
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </td>
                <td className="p-3 text-right">
                  {item.quantity} {getUnitLabel(item.unitId)}
                </td>
                <td className="p-3 text-right">
                  {(item.unitPriceExclTax / 100).toFixed(2)} €
                </td>
                <td className="p-3 text-right">
                  {item.discountPercent ? `${(item.discountPercent / 100).toFixed(1)}%` : "-"}
                </td>
                <td className="p-3 text-right">{getVatLabel(item.vatRate)}</td>
                <td className="p-3 text-right font-medium">
                  {(item.totalExclTax / 100).toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t p-3 space-y-1 ml-auto w-full sm:w-64">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total HT</span>
            <span>{(subtotals.totalHT / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total TVA</span>
            <span>{(subtotals.totalVAT / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-1 border-t">
            <span>Total TTC</span>
            <span>{(subtotals.totalTTC / 100).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goToPreviousStep}>
          Retour
        </Button>
        <Button onClick={goToNextStep}>
          Valider le document
        </Button>
      </div>
    </div>
  );
}
