Tu es un expert en UI/UX et en développement Frontend avec **Next.js**, **React**, **TypeScript**, **Tailwind CSS** et **shadcn/ui**.

Ta mission est de concevoir une **interface de dashboard moderne**, inspirée de l'expérience utilisateur de ChatGPT, mais adaptée à une application de gestion de facturation.

## Objectif

Je souhaite uniquement réaliser la **maquette visuelle** de l'application.

Aucune logique métier n'est attendue :

* pas d'API
* pas de gestion d'état
* pas de base de données
* pas de backend
* pas de formulaires fonctionnels

Tous les contenus peuvent être statiques.

Le rendu doit être suffisamment réaliste pour servir de base à un futur développement.

---

## Stack

Utiliser exclusivement :

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide React pour les icônes

Ne pas utiliser d'autres bibliothèques UI.

---

# Layout général

Créer un dashboard inspiré de ChatGPT.

L'écran est composé de :

* une sidebar fixe à gauche
* un header discret en haut du contenu
* une zone principale responsive

L'ensemble doit être sobre, moderne, professionnel et épuré.

---

# Sidebar

La sidebar ressemble à celle de ChatGPT.

Elle contient :

## Section principale

* Vue d'ensemble
* Devis
* Factures
* Avoirs
* Bons de commande
* Clients
* Produits

Chaque élément possède une icône Lucide.

L'élément actif est visuellement mis en avant.

En bas de la sidebar :

* Paramètres
* Profil utilisateur

---

# Vue d'ensemble

Lorsque "Vue d'ensemble" est sélectionné :

Afficher :

## Header

Titre :

> Vue d'ensemble

Sous-titre :

> Retrouvez tous vos documents commerciaux.

À droite :

un bouton primaire

"Nouveau document"

---

## Statistiques

Afficher 4 Cards shadcn :

* Nombre de devis
* Nombre de factures
* Chiffre d'affaires
* Montant en attente

Utiliser des valeurs fictives.

---

## Tableau principal

Utiliser le composant Table de shadcn.

Colonnes :

* Type
* Numéro
* Client
* Date
* Montant
* Statut
* Actions

Créer environ 15 lignes fictives mélangeant :

* devis
* factures
* avoirs

Les badges de statut utilisent les composants Badge de shadcn.

Exemples :

* Brouillon
* Envoyé
* Payé
* En attente
* Annulé

Chaque ligne possède un menu Actions (DropdownMenu).

---

# Vue Devis

Lorsque "Devis" est sélectionné :

Le contenu change.

Header :

Titre :

> Devis

Sous-titre :

> Gérez l'ensemble de vos devis.

À droite :

Bouton

"Nouveau devis"

Sous le header :

* barre de recherche
* filtre Statut
* filtre Date

Puis une Table contenant uniquement des devis.

Colonnes :

* Numéro
* Client
* Date
* Validité
* Montant
* Statut
* Actions

Créer des données fictives.

---

# Les autres sections

Factures

Même structure.

Bouton :

Nouvelle facture

---

Avoirs

Même structure.

Bouton :

Nouvel avoir

---

Bons de commande

Même structure.

---

Clients

Afficher une table :

* Nom
* Société
* Email
* Téléphone
* Nombre de documents

Bouton :

Nouveau client

---

Produits

Afficher une table :

* Nom
* Référence
* Prix HT
* TVA
* Stock

Bouton :

Nouveau produit

---

# Design

Le design doit être premium.

Je souhaite retrouver une sensation proche de :

* ChatGPT
* Linear
* Vercel
* Stripe Dashboard

Caractéristiques :

* beaucoup d'espace blanc
* coins arrondis
* ombres légères
* typographie propre
* hiérarchie visuelle forte
* composants shadcn natifs
* couleurs neutres
* responsive
* cohérence visuelle sur toutes les pages

---

# Contraintes

* Aucun backend
* Aucun fetch
* Aucun état complexe
* Toutes les données sont mockées
* Tous les composants doivent être réutilisables
* Respecter les bonnes pratiques React
* Organiser proprement les composants
* Code lisible et maintenable

Je souhaite obtenir une interface qui semble prête à être mise en production, même si elle est entièrement statique.
