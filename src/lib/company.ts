import { useCompany } from "./company-context";

export function useCompanyId() {
  const { companyId } = useCompany();
  return companyId;
}
