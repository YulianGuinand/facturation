# Facturation

Application de facturation et devis avec génération de PDF, gestion des clients et TVA.

## Stack

- **Framework** – Next.js 16 (Turbopack)
- **Base de données / Backend** – Convex (temps réel, auto-généré)
- **UI** – Tailwind CSS 4 + shadcn/ui (Base UI)
- **PDF** – pdf-lib (génération côté serveur)
- **Police** – Roboto (via `@fontsource/roboto`)
- **Facture-X** – `@stafyniaksacha/facturx`

## Prérequis

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env.local` à la racine du projet :

```env
# Déploiement Convex (généré automatiquement par `npx convex dev`)
CONVEX_DEPLOYMENT=anonymous:anonymous-facturation

# URL du backend Convex local
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# URL du site Convex local (pour les fichiers statiques / storage)
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

> Les valeurs par défaut pour le développement local sont celles-ci. Si vous utilisez Convex Cloud, remplacez les URLs par celles de votre déploiement.

## Développement

Lancez le backend Convex et le frontend Next.js **en parallèle** (deux terminaux) :

### Terminal 1 — Convex

```bash
npx convex dev
```

Ceci démarre le serveur Convex local qui :
- héberge la base de données SQLite
- exécute les mutations / queries
- sert les fichiers uploadés (storage)
- regénère automatiquement les typages dans `convex/_generated/`

### Terminal 2 — Next.js

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Autres commandes

| Commande | Description |
|----------|-------------|
| `npm run build` | Build de production Next.js |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |
| `npx convex deploy` | Déploiement Convex Cloud (prod) |
| `npx convex dashboard` | Ouvrir le dashboard Convex |

## Project Structure

```
convex/
├── mutations/          # Mutations Convex (écritures DB)
│   ├── index.ts
│   ├── companies.ts    # createCompany, updateCompany, archiveCompany
│   ├── customers.ts    # CRUD clients
│   ├── documents.ts    # CRUD documents (devis, factures, avoirs…)
│   ├── invoice_wizard.ts  # Wizard de création de document
│   ├── bank_accounts.ts
│   └── storage.ts      # generateUploadUrl, saveLogo, deleteLogo
├── queries/            # Queries Convex (lectures DB)
│   ├── index.ts
│   ├── companies.ts    # getCompanies, getCompany, getCompanySettings, getStorageUrl
│   ├── customers.ts
│   ├── documents.ts    # getDocumentWithItems, getPaymentMethodById…
│   ├── addresses.ts
│   ├── bank_accounts.ts
│   └── units.ts
├── lib/
│   └── audit.ts        # Journal d'audit
├── schema.ts           # Définition de toutes les tables
├── auth.ts             # Authentification (si activée)
└── _generated/         # Typages auto-générés (ne pas modifier)

src/
├── app/
│   ├── page.tsx                        # Page d'accueil (onboarding)
│   ├── layout.tsx                      # Layout racine
│   ├── globals.css                     # Styles globaux Tailwind
│   ├── dashboard/                      # App principale (authentifié)
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Tableau de bord
│   │   ├── parametres/                 # Paramètres société
│   │   ├── clients/                    # Gestion des clients
│   │   ├── documents/                  # Liste des documents
│   │   └── nouveau/                    # Création de document (wizard)
│   └── api/
│       └── documents/[id]/pdf/route.ts # Route API de génération PDF
├── components/
│   ├── ui/                             # Composants shadcn/ui
│   ├── company/
│   │   ├── CreateCompanyForm.tsx       # Formulaire de création société
│   │   └── LogoUpload.tsx             # Upload / affichage logo
│   ├── clients/
│   └── documents/                      # Wizard, table, PDF preview…
└── lib/
    ├── utils.ts                        # Utilitaires (cn, format monnaie…)
    ├── invoice-pdf.ts                  # Générateur PDF (pdf-lib)
    └── company-context.tsx             # Contexte société active
```

## Fonctionnalités

- **Création de société** – onboarding avec formulaire complet (SIREN, SIRET, TVA, RCS, capital, adresse)
- **Gestion des clients** – CRUD avec adresse de facturation et de livraison
- **Documents** – Devis, factures, avoirs, bons de commande, factures d'acompte, factures de situation
- **Wizard de création** – Navigation multi-étapes avec numérotation auto, TVA, remises, notes
- **Génération PDF** – PDF complet avec logo, coordonnées, TVA, échéances, conditions, RIB
- **Statuts** – Brouillon → Envoyé → En retard → Payé → Annulé
- **Paramètres** – Modification des infos société, upload de logo, comptes bancaires
- **TVA** – Gestion multi-taux (20%, 10%, 5.5%, 2.1%) et franchise en base
- **Storage Convex** – Upload de logo (PNG, JPEG, WebP, max 2 Mo)

## Flux d'upload de logo

1. Mutation `generateUploadUrl` → retourne une URL temporaire
2. `fetch(POST)` vers cette URL avec le fichier en body
3. Réponse JSON `{ storageId: "…" }`
4. Mutation `saveLogo` → enregistre le `storageId` sur la société
5. Query `getStorageUrl` → résout l'URL publique pour l'affichage
6. Route PDF → télécharge l'image et l'encode en base64 pour l'incorporer dans le PDF
