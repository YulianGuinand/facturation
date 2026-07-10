import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { generateFacturXxml } from "@/lib/factur-x";

const DOC_TYPE_LABELS: Record<string, string> = {
  quote: "devis",
  invoice: "facture",
  credit_note: "avoir",
  purchase_order: "bon de commande",
  deposit_invoice: "facture d'acompte",
  progress_invoice: "facture de situation",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = req.nextUrl.searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ error: "companyId requis" }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const data = await convex.query(api.queries.documents.getDocumentWithItems, {
      documentId: id as any,
      companyId: companyId as any,
    });

    if (!data) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    const { document: doc, items, customer } = data;

    const company = await convex.query(api.queries.companies.getCompany, {
      companyId: companyId as any,
    });

    // Fetch addresses
    const companyAddress = company?.addressId
      ? await convex.query(api.queries.addresses.getAddressById, { addressId: company.addressId as any })
      : null;

    const customerAddress = customer?.billingAddressId
      ? await convex.query(api.queries.addresses.getAddressById, { addressId: customer.billingAddressId as any })
      : null;

    // Fetch company settings
    const companySettings = await convex.query(api.queries.companies.getCompanySettings, {
      companyId: companyId as any,
    });

    // Fetch delivery address
    let deliveryAddress = null;
    if (customer?.deliveryAddressId) {
      deliveryAddress = await convex.query(api.queries.addresses.getAddressById, {
        addressId: customer.deliveryAddressId as any,
      });
    } else {
      deliveryAddress = customerAddress;
    }

    // Fetch payment method name
    let paymentMethodName: string | undefined;
    if (doc.paymentMethodId) {
      const pm = await convex.query(api.queries.documents.getPaymentMethodById, {
        paymentMethodId: doc.paymentMethodId as any,
      });
      paymentMethodName = pm?.name;
    }

    // Fetch units for items
    const unitIds = [...new Set(items.map((i: any) => i.unitId).filter(Boolean))];
    const unitMap = new Map<string, string>();
    for (const uid of unitIds) {
      const unit = await convex.query(api.queries.units.getUnitById, { unitId: uid as any });
      if (unit) unitMap.set(uid, unit.name);
    }

    let bankAccount = null;
    if (doc.bankAccountId) {
      bankAccount = await convex.query(api.queries.bank_accounts.getBankAccountById, {
        bankAccountId: doc.bankAccountId as any,
      });
    }
    if (!bankAccount) {
      bankAccount = await convex.query(api.queries.bank_accounts.getDefaultBankAccount, {
        companyId: companyId as any,
      });
    }

    // Fetch logo image if present
    let logoBase64: string | undefined;
    if (company?.logoStorageId) {
      try {
        const logoUrl = await convex.query(api.queries.companies.getStorageUrl, {
          storageId: company.logoStorageId,
        });
        if (logoUrl) {
          const resp = await fetch(logoUrl);
          const blob = await resp.arrayBuffer();
          const bytes = new Uint8Array(blob);
          const mime = resp.headers.get("content-type") ?? "image/png";
          const b64 = btoa(String.fromCharCode(...bytes));
          logoBase64 = `data:${mime};base64,${b64}`;
        }
      } catch (e) {
        console.warn("Failed to fetch logo", e);
      }
    }

    // Compute VAT breakdown
    const vatMap = new Map<number, { base: number; amount: number }>();
    for (const item of items) {
      const rate = item.vatRate;
      const existing = vatMap.get(rate) ?? { base: 0, amount: 0 };
      existing.base += item.totalExclTax;
      existing.amount += item.vatAmount;
      vatMap.set(rate, existing);
    }
    const vatBreakdown = Array.from(vatMap.entries()).map(([rate, vals]) => ({
      rate,
      base: vals.base,
      amount: vals.amount,
    }));

    const xmlStr = generateFacturXxml({
      number: doc.number,
      documentType: doc.type,
      issueDate: doc.issueDate,
      dueDate: doc.dueDate ?? doc.issueDate,
      deliveryDate: doc.saleDate ?? undefined,
      currency: doc.currency,
      latePenaltyRate: doc.latePenaltyRate ?? undefined,
      flatRateIndemnity: doc.flatRateIndemnity ?? undefined,
      discountRate: "néant",
      paymentTerms: doc.paymentTerms ?? undefined,
      orderReference: doc.orderReference ?? undefined,
      contractReference: doc.contractReference ?? undefined,
      company: {
        name: company?.name ?? "",
        siren: company?.siren ?? undefined,
        siret: company?.siret ?? undefined,
        vatNumber: company?.vatNumber ?? undefined,
        address: companyAddress?.line1 ?? undefined,
        addressLine2: companyAddress?.line2 ?? undefined,
        postalCode: companyAddress?.postalCode ?? undefined,
        city: companyAddress?.city ?? undefined,
        country: companyAddress?.country ?? undefined,
      },
      customer: {
        companyName: customer?.companyName ?? undefined,
        firstName: customer?.firstName ?? undefined,
        lastName: customer?.lastName ?? undefined,
        siren: customer?.siren ?? undefined,
        siret: customer?.siret ?? undefined,
        vatNumber: customer?.vatNumber ?? undefined,
        address: customerAddress?.line1 ?? undefined,
        addressLine2: customerAddress?.line2 ?? undefined,
        postalCode: customerAddress?.postalCode ?? undefined,
        city: customerAddress?.city ?? undefined,
        country: customerAddress?.country ?? undefined,
      },
      vatBreakdown,
      items: items.map((item: any) => ({
        reference: item.reference ?? undefined,
        designation: item.designation,
        quantity: item.quantity,
        unit: item.unitId ? unitMap.get(item.unitId) ?? undefined : undefined,
        unitPriceExclTax: item.unitPriceExclTax,
        vatRate: item.vatRate,
        totalExclTax: item.totalExclTax,
      })),
      totals: {
        totalExclTax: doc.totalExclTax,
        totalVat: doc.totalVat,
        totalInclTax: doc.totalInclTax,
      },
    });
    const facturXxml = new TextEncoder().encode(xmlStr);

    const pdfBytes = await generateInvoicePdf({
      logoBase64,
      facturXxml,
      number: doc.number,
      documentType: doc.type,
      issueDate: doc.issueDate,
      dueDate: doc.dueDate ?? doc.issueDate,
      deliveryDate: doc.saleDate ?? undefined,
      currency: doc.currency,
      customerNotes: doc.customerNotes ?? undefined,
      legalNotes: doc.legalNotes ?? undefined,
      paymentTerms: doc.paymentTerms ?? undefined,
      paymentMethod: paymentMethodName,
      orderReference: doc.orderReference ?? undefined,
      contractReference: doc.contractReference ?? undefined,
      operationNature: doc.operationCategory ?? undefined,
      taxOption: companySettings?.vatRegime === "franchise"
        ? "TVA non applicable, article 293 B du CGI"
        : undefined,
      rcs: company?.rcs ?? undefined,
      shareCapital: company?.shareCapital ?? undefined,
      discountRate: "néant",
      latePenaltyRate: doc.latePenaltyRate ?? undefined,
      flatRateIndemnity: doc.flatRateIndemnity ?? undefined,
      amountPaid: doc.amountPaid > 0 ? doc.amountPaid : undefined,
      amountDue: doc.amountDue > 0 ? doc.amountDue : undefined,
      bankAccount: bankAccount
        ? {
            iban: bankAccount.iban,
            bic: bankAccount.bic,
            bankName: bankAccount.bankName ?? undefined,
          }
        : undefined,
      company: {
        name: company?.name ?? "",
        legalForm: company?.legalForm ?? undefined,
        siren: company?.siren ?? undefined,
        siret: company?.siret ?? undefined,
        vatNumber: company?.vatNumber ?? undefined,
        address: companyAddress?.line1 ?? undefined,
        addressLine2: companyAddress?.line2 ?? undefined,
        postalCode: companyAddress?.postalCode ?? undefined,
        city: companyAddress?.city ?? undefined,
        country: companyAddress?.country ?? undefined,
        email: company?.email ?? undefined,
        phone: company?.phone ?? undefined,
      },
      customer: {
        companyName: customer?.companyName ?? undefined,
        firstName: customer?.firstName ?? undefined,
        lastName: customer?.lastName ?? undefined,
        email: customer?.email ?? undefined,
        phone: customer?.phone ?? undefined,
        siren: customer?.siren ?? undefined,
        siret: customer?.siret ?? undefined,
        vatNumber: customer?.vatNumber ?? undefined,
        address: customerAddress?.line1 ?? undefined,
        addressLine2: customerAddress?.line2 ?? undefined,
        postalCode: customerAddress?.postalCode ?? undefined,
        city: customerAddress?.city ?? undefined,
        country: customerAddress?.country ?? undefined,
      },
      deliveryAddress: deliveryAddress && deliveryAddress !== customerAddress
        ? {
            line1: deliveryAddress.line1 ?? undefined,
            line2: deliveryAddress.line2 ?? undefined,
            postalCode: deliveryAddress.postalCode ?? undefined,
            city: deliveryAddress.city ?? undefined,
            country: deliveryAddress.country ?? undefined,
          }
        : undefined,
      vatBreakdown,
      items: items.map((item: any) => ({
        reference: item.reference ?? undefined,
        designation: item.designation,
        quantity: item.quantity,
        unit: item.unitId ? unitMap.get(item.unitId) ?? undefined : undefined,
        unitPriceExclTax: item.unitPriceExclTax,
        discountPercent: item.discountPercent ?? undefined,
        vatRate: item.vatRate,
        totalExclTax: item.totalExclTax,
        vatAmount: item.vatAmount,
        totalInclTax: item.totalInclTax,
      })),
      totals: {
        totalExclTax: doc.totalExclTax,
        totalVat: doc.totalVat,
        totalInclTax: doc.totalInclTax,
      },
    });

    const label = DOC_TYPE_LABELS[doc.type] ?? "document";

    return new NextResponse(pdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${label}-${doc.number}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: err.message ?? "Erreur génération PDF" },
      { status: 500 }
    );
  }
}
