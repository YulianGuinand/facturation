"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/dashboard/Header";
import { DocumentTable } from "@/components/dashboard/DocumentTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useCompanyId } from "@/lib/company";

export default function FacturesPage() {
  const router = useRouter();
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");
  const docs = useQuery(
    api.queries.documents.getDocumentsWithCustomers,
    companyId ? { companyId, type: "invoice", isArchived: false } : "skip"
  );

  const filtered = (docs ?? []).filter(
    (d: any) => d.number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header
        title="Factures"
        subtitle="Gérez l'ensemble de vos factures."
        action={
          <Button className="gap-2" onClick={() => router.push("/dashboard/factures/nouvelle")}>
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Rechercher une facture..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select defaultValue="tout">
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tout">Tous</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
            <SelectItem value="partially_paid">Partiel</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="tout">
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tout">Toutes</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
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
      />
    </div>
  );
}
