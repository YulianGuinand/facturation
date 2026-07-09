import { InvoiceWizard } from "@/components/invoice/wizard/InvoiceWizard";

export const metadata = {
  title: "Nouvelle facture - Facturation",
};

export default async function NewInvoicePage(props: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const searchParams = await props.searchParams;
  return <InvoiceWizard editId={searchParams?.edit} />;
}
