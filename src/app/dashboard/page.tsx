"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { DocumentTable } from "@/components/dashboard/DocumentTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileText, FileSignature, Euro, Clock, Plus, Loader2 } from "lucide-react";
import { useCompanyId } from "@/lib/company";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const DOC_ROUTES: Record<string, string> = {
  Devis: "/dashboard/devis/nouveau",
  Facture: "/dashboard/factures/nouvelle",
  Avoir: "/dashboard/avoirs/nouveau",
  "Bon de commande": "/dashboard/bons-de-commande/nouveau",
};

export default function OverviewPage() {
  const router = useRouter();
  const companyId = useCompanyId();
  const stats = useQuery(api.queries.dashboard.getDashboardStats, companyId ? { companyId } : "skip");
  const recentDocs = useQuery(api.queries.documents.getDocumentsWithCustomers, companyId ? { companyId, limit: 15 } : "skip");

  return (
    <div>
      <Header
        title="Vue d'ensemble"
        subtitle="Retrouvez tous vos documents commerciaux."
        action={
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors outline-none">
              <Plus className="h-4 w-4" />
              Nouveau document
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau document</DialogTitle>
                <DialogDescription>
                  Choisissez le type de document à créer.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-4">
                {[
                  { type: "Devis", icon: FileText },
                  { type: "Facture", icon: FileSignature },
                  { type: "Avoir", icon: FileSignature },
                  { type: "Bon de commande", icon: FileText },
                ].map((item) => (
                  <Button
                    key={item.type}
                    variant="outline"
                    className="h-24 flex-col gap-2 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400"
                    onClick={() => {
                      const route = DOC_ROUTES[item.type];
                      if (route) router.push(route);
                      else toast.success(`Création d'un ${item.type.toLowerCase()}`);
                    }}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{item.type}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Devis"
          value={stats?.quoteCount.toString() ?? "—"}
          icon={FileText}
          description="Devis en cours"
        />
        <StatCard
          title="Factures"
          value={stats?.invoiceCount.toString() ?? "—"}
          icon={FileSignature}
          description="Factures émises"
        />
        <StatCard
          title="Chiffre d'affaires"
          value={stats ? formatMoney(stats.revenue) : "—"}
          icon={Euro}
          description="Total encaissé"
        />
        <StatCard
          title="En attente"
          value={stats ? formatMoney(stats.pending) : "—"}
          icon={Clock}
          description="Encaissements à venir"
        />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Derniers documents</h2>
        <DocumentTable
          data={(recentDocs ?? []).map((d: any) => ({
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
          showType
        />
      </div>
    </div>
  );
}
