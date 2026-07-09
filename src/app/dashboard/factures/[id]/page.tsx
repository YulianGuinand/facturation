"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCompanyId } from "@/lib/company";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, PenLine, FileDown } from "lucide-react";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const companyId = useCompanyId();
  const data = useQuery(
    api.queries.documents.getDocumentWithItems,
    companyId ? { documentId: id as any, companyId } : "skip"
  );
  const bankAccount = useQuery(
    api.queries.bank_accounts.getDefaultBankAccount,
    companyId ? { companyId } : "skip"
  );

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const { document: doc, items, customer } = data;

  const subtotals = (items ?? []).reduce(
    (acc: any, item: any) => ({
      totalHT: acc.totalHT + item.totalExclTax,
      totalVAT: acc.totalVAT + item.vatAmount,
      totalTTC: acc.totalTTC + item.totalInclTax,
    }),
    { totalHT: 0, totalVAT: 0, totalTTC: 0 }
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/factures")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-lg font-semibold">Facture {doc.number}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/factures/${id}/modifier`)}>
            <PenLine className="h-4 w-4 mr-1" /> Modifier
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Client</p>
          <p className="font-medium">
            {customer
              ? customer.companyName ??
                `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
              : "—"}
          </p>
          {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Date d'émission</p>
          <p className="font-medium">{new Date(doc.issueDate).toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Échéance</p>
          <p className="font-medium">
            {doc.dueDate ? new Date(doc.dueDate).toLocaleDateString("fr-FR") : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Désignation</th>
              <th className="text-right p-3 font-medium">Qté</th>
              <th className="text-right p-3 font-medium">PU HT</th>
              <th className="text-right p-3 font-medium">TVA</th>
              <th className="text-right p-3 font-medium">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item._id} className="border-b last:border-0">
                <td className="p-3">{item.designation}</td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-right">{(item.unitPriceExclTax / 100).toFixed(2)} €</td>
                <td className="p-3 text-right">{(item.vatRate / 100).toFixed(1)}%</td>
                <td className="p-3 text-right font-medium">{(item.totalExclTax / 100).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t p-4 space-y-1 ml-auto w-64">
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

      {bankAccount && (
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Coordonnées bancaires</p>
          <p className="font-medium">{bankAccount.name}</p>
          {bankAccount.bankName && <p className="text-sm">{bankAccount.bankName}</p>}
          <p className="text-sm font-mono">IBAN : {bankAccount.iban}</p>
          <p className="text-sm font-mono">BIC : {bankAccount.bic}</p>
        </div>
      )}
    </div>
  );
}
