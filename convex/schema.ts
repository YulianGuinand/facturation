import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  companies: defineTable({
    name: v.string(),
    businessName: v.optional(v.string()),
    legalForm: v.string(),
    siren: v.string(),
    siret: v.string(),
    vatNumber: v.optional(v.string()),
    rcs: v.optional(v.string()),
    shareCapital: v.optional(v.number()),
    apeCode: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    addressId: v.optional(v.id("addresses")),
    logoStorageId: v.optional(v.string()),
    isMicroEnterprise: v.boolean(),
    isActive: v.boolean(),
  })
    .index("by_siret", ["siret"])
    .index("by_siren", ["siren"])
    .index("by_email", ["email"]),

  companySettings: defineTable({
    companyId: v.id("companies"),
    defaultCurrency: v.string(),
    defaultPaymentTermsDays: v.number(),
    latePenaltyRate: v.number(),
    flatRateIndemnity: v.number(),
    invoicePrefix: v.string(),
    quotePrefix: v.string(),
    creditNotePrefix: v.string(),
    purchaseOrderPrefix: v.string(),
    depositInvoicePrefix: v.optional(v.string()),
    progressInvoicePrefix: v.optional(v.string()),
    resetSequencesAnnually: v.boolean(),
    defaultVatRateId: v.optional(v.id("taxRates")),
    vatRegime: v.union(
      v.literal("franchise"),
      v.literal("normal"),
      v.literal("oss"),
      v.literal("intracommunautaire")
    ),
    legalNotes: v.optional(v.string()),
    invoiceFooter: v.optional(v.string()),
  })
    .index("by_company", ["companyId"]),

  addresses: defineTable({
    companyId: v.id("companies"),
    label: v.optional(v.string()),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    postalCode: v.string(),
    country: v.string(),
    countryCode: v.string(),
  })
    .index("by_company", ["companyId"]),

  customers: defineTable({
    companyId: v.id("companies"),
    type: v.union(v.literal("individual"), v.literal("professional")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    siren: v.optional(v.string()),
    siret: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    billingAddressId: v.optional(v.id("addresses")),
    deliveryAddressId: v.optional(v.id("addresses")),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_active", ["companyId", "isActive"])
    .index("by_siret", ["siret"])
    .searchIndex("search_name", {
      searchField: "companyName",
      filterFields: ["companyId"],
    }),

  contacts: defineTable({
    companyId: v.id("companies"),
    customerId: v.id("customers"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    isPrimary: v.boolean(),
  })
    .index("by_customer", ["customerId"])
    .index("by_company", ["companyId"]),

  documents: defineTable({
    companyId: v.id("companies"),
    customerId: v.optional(v.id("customers")),
    type: v.union(
      v.literal("quote"),
      v.literal("invoice"),
      v.literal("credit_note"),
      v.literal("purchase_order"),
      v.literal("deposit_invoice"),
      v.literal("progress_invoice")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("refused"),
      v.literal("paid"),
      v.literal("partially_paid"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    number: v.string(),
    sequenceId: v.optional(v.id("sequences")),
    issueDate: v.number(),
    saleDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    validityDate: v.optional(v.number()),
    operationCategory: v.optional(v.string()),
    internalReference: v.optional(v.string()),
    orderReference: v.optional(v.string()),
    contractReference: v.optional(v.string()),
    currency: v.string(),
    language: v.string(),
    subtotalExclTax: v.number(),
    globalDiscountPercent: v.optional(v.number()),
    globalDiscountAmount: v.optional(v.number()),
    totalExclTax: v.number(),
    totalVat: v.number(),
    totalInclTax: v.number(),
    amountPaid: v.number(),
    amountDue: v.number(),
    paymentTerms: v.optional(v.string()),
    paymentMethodId: v.optional(v.id("paymentMethods")),
    bankAccountId: v.optional(v.id("bankAccounts")),
    iban: v.optional(v.string()),
    bic: v.optional(v.string()),
    latePenaltyRate: v.optional(v.number()),
    flatRateIndemnity: v.optional(v.number()),
    legalNotes: v.optional(v.string()),
    customerNotes: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    isArchived: v.boolean(),
    archivedAt: v.optional(v.number()),
    archivedBy: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_type", ["companyId", "type"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_customer", ["customerId"])
    .index("by_company_number", ["companyId", "number"])
    .index("by_company_issue_date", ["companyId", "issueDate"])
    .index("by_company_due_date", ["companyId", "dueDate"])
    .searchIndex("search_customer", {
      searchField: "customerId",
      filterFields: ["companyId", "type"],
    }),

  documentItems: defineTable({
    companyId: v.id("companies"),
    documentId: v.id("documents"),
    lineNumber: v.number(),
    reference: v.optional(v.string()),
    designation: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    unitId: v.optional(v.id("units")),
    unitPriceExclTax: v.number(),
    discountPercent: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    vatRateId: v.optional(v.id("taxRates")),
    vatRate: v.number(),
    vatAmount: v.number(),
    totalExclTax: v.number(),
    totalInclTax: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_company", ["companyId"]),

  payments: defineTable({
    companyId: v.id("companies"),
    documentId: v.id("documents"),
    customerId: v.id("customers"),
    amount: v.number(),
    paymentDate: v.number(),
    paymentMethodId: v.optional(v.id("paymentMethods")),
    bankAccountId: v.optional(v.id("bankAccounts")),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
  })
    .index("by_document", ["documentId"])
    .index("by_company", ["companyId"])
    .index("by_company_date", ["companyId", "paymentDate"])
    .index("by_customer", ["customerId"]),

  paymentMethods: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    code: v.string(),
    isActive: v.boolean(),
  })
    .index("by_company", ["companyId"]),

  bankAccounts: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    iban: v.string(),
    bic: v.string(),
    bankName: v.optional(v.string()),
    isDefault: v.boolean(),
    isActive: v.boolean(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_default", ["companyId", "isDefault"]),

  taxRates: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    rate: v.number(),
    code: v.string(),
    isDefault: v.boolean(),
    isActive: v.boolean(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_rate", ["companyId", "rate"]),

  products: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    reference: v.string(),
    description: v.optional(v.string()),
    unitId: v.optional(v.id("units")),
    priceExclTax: v.number(),
    vatRateId: v.optional(v.id("taxRates")),
    vatRate: v.number(),
    isActive: v.boolean(),
  })
    .index("by_company", ["companyId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["companyId"],
    }),

  units: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    abbreviation: v.string(),
    code: v.string(),
    isActive: v.boolean(),
  })
    .index("by_company", ["companyId"]),

  sequences: defineTable({
    companyId: v.id("companies"),
    prefix: v.string(),
    year: v.number(),
    lastNumber: v.number(),
  })
    .index("by_company_prefix_year", ["companyId", "prefix", "year"]),

  auditLogs: defineTable({
    companyId: v.id("companies"),
    entityType: v.string(),
    entityId: v.string(),
    action: v.string(),
    userId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_entity", ["companyId", "entityType", "entityId"])
    .index("by_company_entity_action", ["companyId", "entityType", "entityId", "action"]),

  documentHistory: defineTable({
    companyId: v.id("companies"),
    documentId: v.id("documents"),
    action: v.string(),
    userId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_document", ["documentId"])
    .index("by_company", ["companyId"])
    .index("by_document_action", ["documentId", "action"]),

  userPreferences: defineTable({
    userId: v.string(),
    companyId: v.optional(v.id("companies")),
    theme: v.union(v.literal("light"), v.literal("dark")),
    locale: v.string(),
    sidebarCollapsed: v.boolean(),
  })
    .index("by_user", ["userId"]),
});
