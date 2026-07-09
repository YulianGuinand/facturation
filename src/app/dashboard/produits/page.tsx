"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { useCompanyId } from "@/lib/company";
import { ActionsMenu } from "@/components/dashboard/ActionsMenu";

export default function ProduitsPage() {
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");

  const taxRates = useQuery(api.queries.taxRates.getTaxRates, companyId ? { companyId } : "skip");
  const units = useQuery(api.queries.units.getUnits, companyId ? { companyId } : "skip");

  const filteredTaxes = (taxRates ?? []).filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header
        title="Produits et services"
        subtitle="Gérez votre catalogue."
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        }
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Rechercher..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Taux de TVA</h3>
          <div className="rounded-lg border border-zinc-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50">
                  <TableHead className="text-xs font-semibold text-zinc-500 uppercase">Nom</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-500 uppercase text-right">Taux</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-500 uppercase">Code</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaxes.map((tax) => (
                  <TableRow key={tax._id}>
                    <TableCell className="font-medium text-sm text-zinc-900">{tax.name}</TableCell>
                    <TableCell className="text-sm text-zinc-900 text-right">{tax.rate / 100}%</TableCell>
                    <TableCell className="text-sm text-zinc-500 font-mono">{tax.code}</TableCell>
                    <TableCell><ActionsMenu /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Unités</h3>
          <div className="rounded-lg border border-zinc-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50">
                  <TableHead className="text-xs font-semibold text-zinc-500 uppercase">Nom</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-500 uppercase">Abréviation</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-500 uppercase">Code UN/ECE</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(units ?? []).map((unit) => (
                  <TableRow key={unit._id}>
                    <TableCell className="font-medium text-sm text-zinc-900">{unit.name}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{unit.abbreviation}</TableCell>
                    <TableCell className="text-sm text-zinc-500 font-mono">{unit.code}</TableCell>
                    <TableCell><ActionsMenu /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
