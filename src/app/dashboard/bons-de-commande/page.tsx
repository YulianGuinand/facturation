"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/dashboard/Header";
import { DocumentTable } from "@/components/dashboard/DocumentTable";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCompanyId } from "@/lib/company";

export default function BonsCommandePage() {
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");
  const docs = useQuery(
    api.queries.documents.getDocumentsWithCustomers,
    companyId ? { companyId, type: "purchase_order", isArchived: false } : "skip"
  );

  const filtered = (docs ?? []).filter(
    (d: any) => d.number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header
        title="Bons de commande"
        subtitle="Gérez l'ensemble de vos bons de commande."
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Rechercher un bon de commande..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DocumentTable
        data={filtered.map((d: any) => ({
          _id: d._id,
          type: d.type,
          number: d.number,
          customerId: d.customerId,
          customerName: d.customerName ?? undefined,
          issueDate: d.issueDate,
          validityDate: d.validityDate,
          dueDate: d.dueDate,
          totalInclTax: d.totalInclTax,
          status: d.status,
        }))}
        showType={false}
        showValidite
      />
    </div>
  );
}
