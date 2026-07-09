"use client";

import { useCompany } from "@/lib/company-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCompanyForm } from "./CreateCompanyForm";
import { Building2, ChevronRight } from "lucide-react";

export function CompanySelector() {
  const { companies, setCompanyId } = useCompany();

  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <Card className="w-full max-w-lg shadow-lg border-zinc-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">Créer votre société</CardTitle>
            <CardDescription>Configurez votre espace de facturation</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateCompanyForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            FACTURATION
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Sélectionnez une société
          </p>
        </div>

        <div className="space-y-3">
          {companies.map((company) => (
            <button
              key={company._id}
              onClick={() => setCompanyId(company._id)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">{company.name}</p>
                  <p className="text-sm text-zinc-500">{company.siret}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400" />
            </button>
          ))}
        </div>

        <details className="mt-6">
          <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-700 text-center">
            Créer une nouvelle société
          </summary>
          <div className="mt-4">
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle>Créer votre société</CardTitle>
                <CardDescription>Configurez votre espace de facturation</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateCompanyForm />
              </CardContent>
            </Card>
          </div>
        </details>
      </div>
    </div>
  );
}
