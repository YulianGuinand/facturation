"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CompanySelector } from "@/components/company/CompanySelector";
import { useCompany } from "@/lib/company-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { companyId, isLoading } = useCompany();

  if (isLoading) return null;

  if (!companyId) {
    return <CompanySelector />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
