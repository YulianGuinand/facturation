---
name: facturation
description: |
  Use ONLY for the facturation project — a French invoicing/quoting app built
  with Next.js 16 (Turbopack), Convex, Tailwind CSS 4, shadcn/ui, pdf-lib,
  and react-hook-form. Covers conventions for Convex mutations/queries, the
  PDF generator, the invoice wizard, document statuses, and the project's
  file/import structure.
---

# Projet Facturation

Application de facturation et devis avec génération de PDF, gestion des
clients, TVA et comptes bancaires.

## Stack

| Couche          | Technologie                                  |
| --------------- | -------------------------------------------- |
| Framework       | Next.js 16 (Turbopack)                       |
| Base de données | Convex (SQLite locale, mutations/queries)    |
| UI              | Tailwind CSS 4 + shadcn/ui (Base UI React)   |
| Formulaires     | react-hook-form + zod                        |
| PDF             | pdf-lib + @pdf-lib/fontkit (côté serveur)    |
| Polices         | @fontsource/roboto                           |
| Notifications   | sonner                                       |
| Tableaux        | @tanstack/react-table                        |
| Icônes          | lucide-react                                 |
| Facture-X       | @stafyniaksacha/facturx                      |

## Démarrage

```bash
npm install
# Terminal 1 : backend Convex local
npx convex dev
# Terminal 2 : frontend Next.js
npm run dev
# Ouvrir http://localhost:3000
```

**Fichier `.env.local` :**

```env
CONVEX_DEPLOYMENT=anonymous:anonymous-facturation
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

## Architecture Convex

Les fonctions Convex sont dans `convex/` et les typages auto-générés dans
`convex/_generated/` (gitignoré, régénéré par `npx convex dev`).

### Mutations (`convex/mutations/`)

| Fichier          | Fonctions principales                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `companies.ts`   | `createCompany`, `updateCompany` (with address inline), `archiveCompany`                 |
| `customers.ts`   | `createCustomer`, `updateCustomer`, `archiveCustomer`                                    |
| `documents.ts`   | `createDocument`, `updateDocument`, `changeDocumentStatus`, `archiveDocument`            |
| `invoice_wizard.ts` | `saveWizardData` — sauvegarde complète d'un document via le wizard (items, taxes…)    |
| `bank_accounts.ts` | `createOrUpdateBankAccount`, `deleteBankAccount`, `setDefaultBankAccount`              |
| `storage.ts`     | `generateUploadUrl`, `saveLogo`, `deleteLogo`                                            |

### Queries (`convex/queries/`)

| Fichier          | Fonctions principales                                              |
| ---------------- | ------------------------------------------------------------------- |
| `companies.ts`   | `getCompanies`, `getCompany`, `getCompanySettings`, `getStorageUrl` |
| `customers.ts`   | `getCustomers`, `getCustomer`, `getCustomerAddresses`               |
| `documents.ts`   | `getDocuments`, `getDocumentWithItems`, `getPaymentMethodById`…     |
| `invoice_wizard.ts` | `getWizardData`                                                  |
| `addresses.ts`   | `getAddressById`                                                    |
| `units.ts`       | `getUnitById`, `getUnits`                                           |
| `bank_accounts.ts` | `getDefaultBankAccount`, `getBankAccounts`                        |
| `taxRates.ts`    | `getTaxRates`                                                       |
| `dashboard.ts`   | `getDashboardStats`                                                 |

### Schema (`convex/schema.ts`)

Tables principales : `companies`, `addresses`, `companySettings`, `customers`,
`documents`, `documentItems`, `taxRates`, `units`, `paymentMethods`,
`bankAccounts`, `auditLogs`, `sequences`.

## Composants et pages

### Pages dashboard (`src/app/dashboard/`)

| Page              | Chemin                                                              |
| ----------------- | ------------------------------------------------------------------- |
| Tableau de bord   | `page.tsx`                                                          |
| Factures          | `factures/page.tsx`, `factures/nouvelle/page.tsx`, `factures/[id]/` |
| Devis             | `devis/page.tsx`                                                    |
| Avoirs            | `avoirs/page.tsx`                                                   |
| Bons de commande  | `bons-de-commande/page.tsx`                                         |
| Clients           | `clients/page.tsx`                                                  |
| Produits          | `produits/page.tsx`                                                 |
| Paramètres        | `parametres/page.tsx`                                               |

### Composants réutilisables (`src/components/`)

| Chemin                         | Description                                            |
| ------------------------------ | ------------------------------------------------------ |
| `ConvexClientProvider.tsx`     | Provider Convex pour le client Next.js                 |
| `company/CreateCompanyForm`    | Formulaire onboarding création de société              |
| `company/LogoUpload`           | Upload/affichage du logo société (PNG/JPEG/WebP, 2Mo)  |
| `company/LogoThumb`            | Miniature logo read-only                               |
| `dashboard/Header`             | En-tête avec sélecteur société et thème                |
| `dashboard/Sidebar`            | Navigation latérale                                    |
| `dashboard/DocumentTable`      | Tableau générique de documents (clique ligne → détail) |
| `dashboard/ActionsMenu`        | Menu contextuel actions (DropdownMenu)                 |
| `dashboard/StatusBadge`        | Badge de statut coloré                                 |
| `dashboard/StatCard`           | Carte statistique                                      |
| `invoice/wizard/InvoiceWizard` | Wizard création document multi-étapes                  |
| `invoice/wizard/StepClient`    | Étape client + adresse + TVA                           |
| `invoice/wizard/StepCompany`   | Étape société (infos expéditeur)                       |
| `invoice/wizard/StepInfo`      | Étape infos générales (nature opération, notes…)       |
| `invoice/wizard/StepLines`     | Étape lignes (articles, quantités, TVA, remises)       |
| `invoice/wizard/StepReview`    | Étape récapitulatif                                    |
| `invoice/wizard/StepValidate`  | Étape validation et signature                          |
| `invoice/wizard/wizard-context`| Contexte React du wizard (état, navigation)            |

### Route API PDF

`src/app/api/documents/[id]/pdf/route.ts` — génère un PDF via
`src/lib/invoice-pdf.ts` en utilisant `pdf-lib`. Appelle des queries Convex
depuis un `ConvexHttpClient` côté serveur. Supporte logo société (base64).

## Conventions de code

### Générales

- **Langue** : français (noms de variables, commentaires, UI)
- **Typage** : TypeScript strict, pas de `any` sauf cast Convex `as any`
- **Imports** : utiliser `@/` pour src (`@/components/…`, `@/lib/…`)
- **Format monnaie** : stocké en centimes (number), formaté avec
  `Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })`
- **Format dates** : timestamp UNIX (number), formaté avec
  `new Date(ts).toLocaleDateString("fr-FR")`
- **Pas de commentaires** dans le code sauf exceptions justifiées

### Convex

- Les IDs Convex sont typés `Id<"tableName">` mais dans les composants React,
  on caste souvent avec `as any` pour éviter les frictions avec les génériques
- Les mutations doivent utiliser `createAuditLog(ctx, ...)` pour tracer les
  actions importantes
- Préfixe : `get*` pour les queries, `create*`/`update*`/`archive*` pour les
  mutations

### Styles

- Tailwind CSS 4 (PostCSS)
- shadcn/ui : composants dans `src/components/ui/` (boutons, inputs, dialogs…)
- Les `<select>` natifs : ajouter `font-sans` pour éviter la police par défaut
- Couleur bleue du thème : `[0.05, 0.25, 0.55]` en RGB (utilisé dans les PDFs)

### Wizard

Le wizard est géré par un contexte React (`wizard-context.tsx`) qui expose :
- `currentStepIndex`, `steps`
- `goToNextStep()`, `goToPrevStep()`, `goToStep(index)`
- `wizardData` (état complet du document en cours)
- `updateWizardData(partial)`

Les fonctions de navigation lisent les données via des refs pour éviter les
fermetures obsolètes (stale closures). Ne pas changer ce pattern.

### Types de documents

```typescript
type DocumentType = "quote" | "invoice" | "credit_note" | "purchase_order"
                    | "deposit_invoice" | "progress_invoice";
```

### Statuts

```
draft → sent → overdue → paid → cancelled
```

### Status de TVA

- `normal` : TVA applicable aux taux standards
- `franchise` : TVA non applicable, article 293 B du CGI

## PDF (`src/lib/invoice-pdf.ts`)

- Généré avec `pdf-lib` + `@pdf-lib/fontkit` (police Roboto embarquée)
- Fonction principale : `generateInvoicePdf(data: InvoiceData) => Uint8Array`
- Marges : 50px
- Dimensions page : 595.28 × 841.89 (A4)
- Logos : PNG/JPG embarqués via `embedPng` / `embedJpg`, max 140×50px
- Appelée depuis la route API `src/app/api/documents/[id]/pdf/route.ts`

## Upload de logo

1. Mutation `generateUploadUrl` → URL temporaire
2. `fetch(POST)` vers l'URL avec le fichier en body
3. Réponse JSON `{ storageId: "..." }`
4. Mutation `saveLogo({ companyId, storageId })`
5. Query `getStorageUrl({ storageId })` → URL publique
6. Dans la route PDF : télécharge l'image, convertit en base64, passe à
   `generateInvoicePdf` via `logoBase64`

## Règles importantes

- Quand l'utilisateur demande des changements de comportement, ne pas modifier
  directement le code métier dans `convex/` sans vérifier le schéma (`schema.ts`)
- La TVA est en centièmes de pourcentage (ex: 2000 = 20%)
- Les montants sont en centimes
- Le ContextMenu utilise `render={<tr />}` pour éviter les erreurs d'hydratation
  (`<div>` interdit dans `<tbody>`)
- Le sélecteur de société (`useCompany()`) vient de `@/lib/company-context`
