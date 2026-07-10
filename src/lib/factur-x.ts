function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return (
    d.getFullYear().toString() +
    (d.getMonth() + 1).toString().padStart(2, "0") +
    d.getDate().toString().padStart(2, "0")
  );
}

function fmtAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

function docTypeCode(dt: string): string {
  switch (dt) {
    case "invoice":
      return "380";
    case "quote":
      return "381";
    case "credit_note":
      return "384";
    case "purchase_order":
      return "225";
    case "deposit_invoice":
      return "326";
    case "progress_invoice":
      return "326";
    default:
      return "380";
  }
}

interface FacturXItem {
  reference?: string;
  designation: string;
  quantity: number;
  unit?: string;
  unitPriceExclTax: number;
  vatRate: number;
  totalExclTax: number;
}

interface FacturXInput {
  number: string;
  documentType: string;
  issueDate: number;
  dueDate: number;
  deliveryDate?: number;
  currency?: string;
  latePenaltyRate?: number;
  flatRateIndemnity?: number;
  discountRate?: string;
  paymentTerms?: string;
  orderReference?: string;
  contractReference?: string;

  company: {
    name: string;
    siren?: string;
    siret?: string;
    vatNumber?: string;
    address?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };

  customer: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    siren?: string;
    siret?: string;
    vatNumber?: string;
    address?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };

  vatBreakdown?: Array<{ rate: number; base: number; amount: number }>;
  items: FacturXItem[];
  totals: { totalExclTax: number; totalVat: number; totalInclTax: number };
}

function vatCategoryCode(rate: number): string {
  if (rate === 0) return "Z";
  if (rate < 0) return "E";
  return "S";
}

function tradePartyBlock(
  name: string,
  siren: string | undefined,
  siret: string | undefined,
  vatNumber: string | undefined,
  addr: {
    address?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  },
): string {
  const lines: string[] = [];
  lines.push(`            <ram:Name>${esc(name)}</ram:Name>`);

  const cleanSiren = siren ? siren.replace(/\s/g, "").substring(0, 9) : undefined;
  if (cleanSiren) {
    lines.push(
      `            <ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(cleanSiren)}</ram:ID></ram:SpecifiedLegalOrganization>`,
    );
  }

  if (addr.address || addr.postalCode || addr.city || addr.country) {
    lines.push("            <ram:PostalTradeAddress>");
    if (addr.address)
      lines.push(`              <ram:LineOne>${esc(addr.address)}</ram:LineOne>`);
    const pc = [addr.postalCode, addr.city].filter(Boolean).join(" ");
    if (pc)
      lines.push(`              <ram:CityName>${esc(pc)}</ram:CityName>`);
    if (addr.country)
      lines.push(`              <ram:CountryID>${esc(addr.country)}</ram:CountryID>`);
    lines.push("            </ram:PostalTradeAddress>");
  }

  const cleanId = (siret || siren || "00000000000000")
    .replace(/\s/g, "")
    .substring(0, 14);
  lines.push(
    `            <ram:URIUniversalCommunication><ram:URIID schemeID="0002">${esc(cleanId)}</ram:URIID></ram:URIUniversalCommunication>`,
  );

  if (vatNumber) {
    lines.push(
      `            <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(vatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>`,
    );
  }

  return lines.join("\n");
}

export function generateFacturXxml(input: FacturXInput): string {
  const cur = input.currency ?? "EUR";

  const custName =
    input.customer.companyName ??
    [input.customer.firstName, input.customer.lastName]
      .filter(Boolean)
      .join(" ") ??
    "Client";

  const itemsXml = input.items
    .map(
      (it, i) => `        <ram:IncludedSupplyChainTradeLineItem>
          <ram:AssociatedDocumentLineDocument>
            <ram:LineID>${i + 1}</ram:LineID>
          </ram:AssociatedDocumentLineDocument>
          <ram:SpecifiedTradeProduct>
            <ram:Name>${esc(it.designation)}</ram:Name>
          </ram:SpecifiedTradeProduct>
          <ram:SpecifiedLineTradeAgreement>
            <ram:NetPriceProductTradePrice>
              <ram:ChargeAmount>${fmtAmount(it.unitPriceExclTax)}</ram:ChargeAmount>
            </ram:NetPriceProductTradePrice>
          </ram:SpecifiedLineTradeAgreement>
          <ram:SpecifiedLineTradeDelivery>
            <ram:BilledQuantity unitCode="${esc(it.unit ?? "C62")}">${it.quantity}</ram:BilledQuantity>
          </ram:SpecifiedLineTradeDelivery>
          <ram:SpecifiedLineTradeSettlement>
            <ram:ApplicableTradeTax>
              <ram:TypeCode>VAT</ram:TypeCode>
              <ram:CategoryCode>${vatCategoryCode(it.vatRate)}</ram:CategoryCode>
              <ram:RateApplicablePercent>${(it.vatRate / 100).toFixed(1)}</ram:RateApplicablePercent>
            </ram:ApplicableTradeTax>
            <ram:SpecifiedTradeSettlementLineMonetarySummation>
              <ram:LineTotalAmount>${fmtAmount(it.totalExclTax)}</ram:LineTotalAmount>
            </ram:SpecifiedTradeSettlementLineMonetarySummation>
          </ram:SpecifiedLineTradeSettlement>
        </ram:IncludedSupplyChainTradeLineItem>`,
    )
    .join("\n");

  const vatBreakdownXml = (input.vatBreakdown ?? [])
    .map(
      (vb) => `            <ram:ApplicableTradeTax>
              <ram:CalculatedAmount>${fmtAmount(vb.amount)}</ram:CalculatedAmount>
              <ram:TypeCode>VAT</ram:TypeCode>
              <ram:BasisAmount>${fmtAmount(vb.base)}</ram:BasisAmount>
              <ram:CategoryCode>${vatCategoryCode(vb.rate)}</ram:CategoryCode>
              <ram:RateApplicablePercent>${(vb.rate / 100).toFixed(1)}</ram:RateApplicablePercent>
            </ram:ApplicableTradeTax>`,
    )
    .join("\n");

  const deliveryDateToUse = input.deliveryDate || input.issueDate;
  const deliveryBlock = `        <ram:ActualDeliverySupplyChainEvent>
            <ram:OccurrenceDateTime>
              <udt:DateTimeString format="102">${fmtDate(deliveryDateToUse)}</udt:DateTimeString>
            </ram:OccurrenceDateTime>
          </ram:ActualDeliverySupplyChainEvent>`;

  const orderRefBlock = input.orderReference
    ? `          <ram:BuyerOrderReferencedDocument>
              <ram:IssuerAssignedID>${esc(input.orderReference)}</ram:IssuerAssignedID>
            </ram:BuyerOrderReferencedDocument>`
    : "";

  const contractRefBlock = input.contractReference
    ? `          <ram:ContractReferencedDocument>
              <ram:IssuerAssignedID>${esc(input.contractReference)}</ram:IssuerAssignedID>
            </ram:ContractReferencedDocument>`
    : "";

  const sellerParty = tradePartyBlock(
    input.company.name,
    input.company.siren,
    input.company.siret,
    input.company.vatNumber,
    input.company,
  );
  const buyerParty = tradePartyBlock(
    custName,
    input.customer.siren,
    input.customer.siret,
    input.customer.vatNumber,
    input.customer,
  );

  const flatRateText =
    "Indemnité forfaitaire pour frais de recouvrement : 40 EUR";

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"',
    '  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"',
    '  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">',
    "  <rsm:ExchangedDocumentContext>",
    "    <ram:BusinessProcessSpecifiedDocumentContextParameter>",
    "      <ram:ID>B1</ram:ID>",
    "    </ram:BusinessProcessSpecifiedDocumentContextParameter>",
    "    <ram:GuidelineSpecifiedDocumentContextParameter>",
    `      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>`,
    "    </ram:GuidelineSpecifiedDocumentContextParameter>",
    "  </rsm:ExchangedDocumentContext>",
    "  <rsm:ExchangedDocument>",
    `    <ram:ID>${esc(input.number)}</ram:ID>`,
    `    <ram:TypeCode>${docTypeCode(input.documentType)}</ram:TypeCode>`,
    "    <ram:IssueDateTime>",
    `      <udt:DateTimeString format="102">${fmtDate(input.issueDate)}</udt:DateTimeString>`,
    "    </ram:IssueDateTime>",
    `    <ram:IncludedNote><ram:Content>${esc(flatRateText)}</ram:Content><ram:SubjectCode>PMT</ram:SubjectCode></ram:IncludedNote>`,
    `    <ram:IncludedNote><ram:Content>${esc(`Pénalités de retard : ${input.latePenaltyRate ? (input.latePenaltyRate / 100).toFixed(2) : "0"}%`)}</ram:Content><ram:SubjectCode>PMD</ram:SubjectCode></ram:IncludedNote>`,
    `    <ram:IncludedNote><ram:Content>${esc(input.discountRate ? `Escompte pour paiement anticipé : ${input.discountRate}` : "Escompte pour paiement anticipé : néant")}</ram:Content><ram:SubjectCode>AAB</ram:SubjectCode></ram:IncludedNote>`,
    "  </rsm:ExchangedDocument>",
    "  <rsm:SupplyChainTradeTransaction>",
    itemsXml,
    "    <ram:ApplicableHeaderTradeAgreement>",
    `      <ram:SellerTradeParty>`,
    sellerParty,
    `      </ram:SellerTradeParty>`,
    `      <ram:BuyerTradeParty>`,
    buyerParty,
    `      </ram:BuyerTradeParty>`,
    orderRefBlock,
    contractRefBlock,
    "    </ram:ApplicableHeaderTradeAgreement>",
    "    <ram:ApplicableHeaderTradeDelivery>",
    deliveryBlock,
    "    </ram:ApplicableHeaderTradeDelivery>",
    "    <ram:ApplicableHeaderTradeSettlement>",
    `      <ram:InvoiceCurrencyCode>${cur}</ram:InvoiceCurrencyCode>`,
    vatBreakdownXml,
    `      <ram:SpecifiedTradePaymentTerms>`,
    `        <ram:DueDateDateTime><udt:DateTimeString format="102">${fmtDate(input.dueDate)}</udt:DateTimeString></ram:DueDateDateTime>`,
    `      </ram:SpecifiedTradePaymentTerms>`,
    "      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>",
    `        <ram:LineTotalAmount>${fmtAmount(input.totals.totalExclTax)}</ram:LineTotalAmount>`,
    `        <ram:TaxBasisTotalAmount>${fmtAmount(input.totals.totalExclTax)}</ram:TaxBasisTotalAmount>`,
    `        <ram:TaxTotalAmount currencyID="${cur}">${fmtAmount(input.totals.totalVat)}</ram:TaxTotalAmount>`,
    `        <ram:GrandTotalAmount>${fmtAmount(input.totals.totalInclTax)}</ram:GrandTotalAmount>`,
    `        <ram:DuePayableAmount>${fmtAmount(input.totals.totalInclTax)}</ram:DuePayableAmount>`,
    "      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>",
    "    </ram:ApplicableHeaderTradeSettlement>",
    "  </rsm:SupplyChainTradeTransaction>",
    "</rsm:CrossIndustryInvoice>",
  ]
    .filter(Boolean)
    .join("\n");
}
