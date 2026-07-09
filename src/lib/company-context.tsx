"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";

interface CompanyContextValue {
  companyId: Id<"companies"> | null;
  company: Doc<"companies"> | null;
  companies: Doc<"companies">[];
  setCompanyId: (id: Id<"companies"> | null) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

const STORAGE_KEY = "facturation_selected_company";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyIdState] = useState<Id<"companies"> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const companies = useQuery(api.queries.companies.getCompanies) ?? [];

  const company = useQuery(
    api.queries.companies.getCompany,
    companyId ? { companyId } : "skip"
  ) ?? null;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCompanyIdState(stored as Id<"companies">);
    }
    setIsInitialized(true);
  }, []);

  const setCompanyId = useCallback((id: Id<"companies"> | null) => {
    setCompanyIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && companies.length > 0 && !companyId) {
      setCompanyId(companies[0]._id);
    }
  }, [isInitialized, companies, companyId, setCompanyId]);

  useEffect(() => {
    if (isInitialized && companyId && companies.length > 0) {
      const stillExists = companies.some((c) => c._id === companyId);
      if (!stillExists) {
        setCompanyId(companies[0]?._id ?? null);
      }
    }
  }, [isInitialized, companies, companyId, setCompanyId]);

  return (
    <CompanyContext.Provider
      value={{
        companyId,
        company,
        companies,
        setCompanyId,
        isLoading: !isInitialized,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
