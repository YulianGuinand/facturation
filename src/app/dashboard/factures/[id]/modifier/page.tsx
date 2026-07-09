"use client";

import { use } from "react";
import { InvoiceWizard } from "@/components/invoice/wizard/InvoiceWizard";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <InvoiceWizard editId={id} />;
}
