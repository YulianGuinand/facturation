"use client";

import { useState, useEffect } from "react";
import { useCompanyId } from "@/lib/company";
import { useWizard } from "./wizard-context";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface LineItem {
  _key: string;
  _id?: string;
  reference: string;
  designation: string;
  quantity: number;
  unitPriceExclTax: number;
  discountPercent: number;
  vatRate: number;
  totalExclTax: number;
  vatAmount: number;
  totalInclTax: number;
}

export function StepLines() {
  const companyId = useCompanyId();
  const { dispatch, goToNextStep, goToPreviousStep, state } = useWizard();
  const addLine = useMutation(api.mutations.invoice_wizard.addInvoiceLine);
  const updateLineMut = useMutation(api.mutations.invoice_wizard.updateInvoiceLine);
  const removeLine = useMutation(api.mutations.invoice_wizard.removeInvoiceLine);
  const updateTotals = useMutation(api.mutations.invoice_wizard.updateInvoiceTotals);
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const existingItems = useQuery(
    api.queries.documents.getDocumentItems,
    state.documentId ? { documentId: state.documentId } : "skip"
  );

  useEffect(() => {
    if (existingItems && !loaded && existingItems.length > 0) {
      setLines(
        existingItems.map((item: any) => ({
          _key: item._id,
          _id: item._id,
          reference: item.reference ?? "",
          designation: item.designation,
          quantity: item.quantity,
          unitPriceExclTax: item.unitPriceExclTax,
          discountPercent: item.discountPercent ?? 0,
          vatRate: item.vatRate,
          totalExclTax: item.totalExclTax,
          vatAmount: item.vatAmount,
          totalInclTax: item.totalInclTax,
        }))
      );
      setLoaded(true);
    } else if (existingItems && existingItems.length === 0) {
      setLoaded(true);
    }
  }, [existingItems, loaded]);

  const taxRates = useQuery(
    api.queries.taxRates.getTaxRates,
    companyId ? { companyId } : "skip"
  );
  const units = useQuery(
    api.queries.units.getUnits,
    companyId ? { companyId } : "skip"
  );
  const products = useQuery(
    api.queries.invoice_wizard.getProducts,
    companyId ? { companyId } : "skip"
  );

  const addEmptyLine = () => {
    const vat = taxRates?.find((t) => t.isDefault)?.rate ?? 2000;
    setLines((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        reference: "",
        designation: "",
        quantity: 1,
        unitPriceExclTax: 0,
        discountPercent: 0,
        vatRate: vat,
        totalExclTax: 0,
        vatAmount: 0,
        totalInclTax: 0,
      },
    ]);
  };

  const updateLine = (key: string, field: keyof LineItem, value: any) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line._key !== key) return line;
        const updated = { ...line, [field]: value };
        // Recalculate
        const qty = field === "quantity" ? Number(value) : line.quantity;
        const up = field === "unitPriceExclTax" ? Number(value) : line.unitPriceExclTax;
        const dp = field === "discountPercent" ? Number(value) : line.discountPercent;
        const vr = field === "vatRate" ? Number(value) : line.vatRate;
        let totalHT = qty * up;
        if (dp > 0) totalHT -= Math.round(totalHT * (dp / 10000));
        updated.totalExclTax = totalHT;
        updated.vatAmount = Math.round(totalHT * (vr / 10000));
        updated.totalInclTax = totalHT + updated.vatAmount;
        return updated;
      })
    );
  };

  const removeLineItem = (key: string) => {
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  const handleContinue = async () => {
    if (lines.length === 0) {
      toast.error("Ajoutez au moins une ligne");
      return;
    }
    if (!state.documentId || !state.companyId) return;
    setSaving(true);
    try {
      const existingIds = new Set(
        (existingItems ?? []).map((i: any) => i._id)
      );
      const keptIds = new Set<string>();

      for (const line of lines) {
        if (line._id && existingIds.has(line._id)) {
          keptIds.add(line._id);
          await updateLineMut({
            itemId: line._id as any,
            companyId: state.companyId,
            designation: line.designation,
            quantity: line.quantity,
            unitPriceExclTax: line.unitPriceExclTax,
            discountPercent: line.discountPercent > 0 ? line.discountPercent : undefined,
            vatRate: line.vatRate,
          });
        } else {
          await addLine({
            documentId: state.documentId,
            companyId: state.companyId,
            designation: line.designation,
            reference: line.reference || undefined,
            quantity: line.quantity,
            unitPriceExclTax: line.unitPriceExclTax,
            discountPercent: line.discountPercent > 0 ? line.discountPercent : undefined,
            vatRate: line.vatRate,
          });
        }
      }

      for (const item of existingItems ?? []) {
        if (!keptIds.has(item._id)) {
          await removeLine({
            companyId: state.companyId,
            itemId: item._id,
          });
        }
      }

      await updateTotals({
        documentId: state.documentId,
        companyId: state.companyId,
      });
      dispatch({ type: "VALIDATE_STEP", step: "lines" });
      goToNextStep();
    } catch {
      toast.error("Erreur lors de l'enregistrement des lignes");
    } finally {
      setSaving(false);
    }
  };

  const subtotals = lines.reduce(
    (acc, l) => ({
      totalHT: acc.totalHT + l.totalExclTax,
      totalVAT: acc.totalVAT + l.vatAmount,
      totalTTC: acc.totalTTC + l.totalInclTax,
    }),
    { totalHT: 0, totalVAT: 0, totalTTC: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Produits & services</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoutez les lignes de votre document.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addEmptyLine}>
          <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
        </Button>
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg border-muted-foreground/20">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucune ligne pour le moment</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={addEmptyLine}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-3">
            <div className="col-span-1" />
            <div className="col-span-2">Réf.</div>
            <div className="col-span-3">Désignation</div>
            <div className="col-span-1 text-right">Qté</div>
            <div className="col-span-1 text-right">PU HT</div>
            <div className="col-span-1 text-right">Remise</div>
            <div className="col-span-1 text-right">TVA</div>
            <div className="col-span-1 text-right">Total HT</div>
            <div className="col-span-1 text-right">
              <Trash2 className="h-3 w-3 inline" />
            </div>
          </div>

          {lines.map((line, index) => (
            <LineRow
              key={line._key}
              line={line}
              index={index}
              products={products ?? []}
              taxRates={taxRates ?? []}
              units={units ?? []}
              onChange={(field, value) => updateLine(line._key, field, value)}
              onRemove={() => removeLineItem(line._key)}
            />
          ))}

          <div className="border-t pt-3 space-y-1 text-sm ml-auto w-full sm:w-72">
            <div className="flex justify-between px-3">
              <span className="text-muted-foreground">Total HT</span>
              <span className="font-medium">{(subtotals.totalHT / 100).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between px-3">
              <span className="text-muted-foreground">Total TVA</span>
              <span className="font-medium">{(subtotals.totalVAT / 100).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between px-3 text-base font-bold">
              <span>Total TTC</span>
              <span>{(subtotals.totalTTC / 100).toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goToPreviousStep}>
          Retour
        </Button>
        <Button onClick={handleContinue} disabled={lines.length === 0 || saving}>
          {saving ? "Enregistrement..." : "Continuer"}
        </Button>
      </div>
    </div>
  );
}

function LineRow({
  line,
  index,
  products,
  taxRates,
  units,
  onChange,
  onRemove,
}: {
  line: LineItem;
  index: number;
  products: any[];
  taxRates: any[];
  units: any[];
  onChange: (field: keyof LineItem, value: any) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border bg-card">
      <div className="col-span-1 text-xs text-muted-foreground">{index + 1}</div>
      <div className="col-span-2">
        <Input
          value={line.reference}
          onChange={(e) => onChange("reference", e.target.value)}
          placeholder="Réf."
          className="h-8 text-xs"
        />
      </div>
      <div className="col-span-3">
        <Input
          value={line.designation}
          onChange={(e) => onChange("designation", e.target.value)}
          placeholder="Désignation *"
          className="h-8 text-xs"
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={line.quantity}
          onChange={(e) => onChange("quantity", parseFloat(e.target.value) || 0)}
          className="h-8 text-xs text-right"
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={line.unitPriceExclTax / 100}
          onChange={(e) =>
            onChange("unitPriceExclTax", Math.round(parseFloat(e.target.value || "0") * 100))
          }
          className="h-8 text-xs text-right"
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={line.discountPercent / 100}
          onChange={(e) =>
            onChange("discountPercent", Math.round(parseFloat(e.target.value || "0") * 100))
          }
          className="h-8 text-xs text-right"
        />
      </div>
      <div className="col-span-1">
        <select
          value={line.vatRate}
          onChange={(e) => onChange("vatRate", parseInt(e.target.value))}
          className="h-8 w-full rounded-md border border-input bg-background px-1 text-xs"
        >
          {taxRates.map((tr) => (
            <option key={tr._id} value={tr.rate}>
              {(tr.rate / 100).toFixed(tr.rate % 100 === 0 ? 0 : 1)}%
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-1 text-right text-xs font-medium">
        {(line.totalExclTax / 100).toFixed(2)}
      </div>
      <div className="col-span-1 text-right">
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5 inline" />
        </button>
      </div>
    </div>
  );
}
