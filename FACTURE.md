En pratique, Factur-X est constitué de deux éléments :

* un **PDF/A-3** lisible par un humain ;
* un **XML** conforme à la norme **EN16931** (Cross Industry Invoice - CII) contenant les données structurées.

Voici les principales informations à prévoir dans ton modèle de données.

---

# 1. Informations du document

* Numéro de facture
* Type de document (facture, avoir, acompte...)
* Date d'émission
* Date de livraison ou d'exécution
* Devise
* Langue (facultative)
* Référence du document précédent (pour un avoir, par exemple)

---

# 2. Société émettrice

* Raison sociale
* Nom commercial (si utilisé)
* Adresse complète
* Pays
* SIREN
* SIRET
* Numéro de TVA intracommunautaire
* Forme juridique (facultative)
* Coordonnées (email, téléphone)
* Identifiant électronique si applicable

---

# 3. Client

* Nom ou raison sociale
* Adresse complète
* Pays
* SIREN (si entreprise française concernée)
* Numéro de TVA intracommunautaire (si applicable)
* Identifiant électronique si applicable
* Contact (facultatif)

---

# 4. Références commerciales

* Numéro de commande
* Référence contrat
* Référence projet
* Référence client
* Buyer Reference
* Seller Reference
* Accounting Cost

---

# 5. Dates

* Date d'émission
* Date de livraison
* Date d'échéance
* Date de paiement (si déjà réglée)

---

# 6. Conditions de paiement

* Mode de paiement
* Délai de paiement
* Conditions de paiement
* Escompte
* Pénalités de retard
* Indemnité forfaitaire de recouvrement
* IBAN
* BIC
* Titulaire du compte

---

# 7. Lignes de facture

Chaque ligne doit contenir :

* Numéro de ligne
* Référence produit
* Désignation
* Description
* Quantité
* Unité
* Prix unitaire HT
* Remise
* Prix après remise
* Taux de TVA
* Montant HT
* Montant TVA
* Montant TTC

---

# 8. TVA

Pour chaque taux utilisé :

* Taux
* Base taxable
* Montant de TVA
* Catégorie de TVA
* Motif d'exonération si applicable

---

# 9. Totaux

Le XML contient notamment :

* Total HT
* Total TVA
* Total TTC
* Total des remises
* Total des acomptes
* Montant déjà payé
* Reste à payer
* Total des lignes
* Total hors lignes (frais, etc.)

---

# 10. Adresse de livraison

Si différente de la facturation :

* Nom
* Adresse
* Pays
* Date de livraison

---

# 11. Informations fiscales

* Régime TVA
* Franchise en base
* Autoliquidation
* Livraison intracommunautaire
* Export
* Motif d'exonération
* Catégorie fiscale

---

# 12. Informations techniques Factur-X

Le XML contient également des métadonnées telles que :

* Business Process Identifier
* Specification Identifier
* Profil Factur-X
* Version de la norme
* Identifiants des parties
* Codes de devise
* Codes d'unités
* Codes des moyens de paiement

---

# 13. Pièces jointes

Factur-X permet d'embarquer :

* le PDF de la facture ;
* le XML structuré.

Selon les usages, d'autres pièces jointes peuvent être ajoutées, mais ce n'est pas une obligation générale.

---

# 14. Historique métier (interne)

Ces informations ne font pas partie du XML Factur-X, mais sont utiles dans ton application :

* Brouillon
* Validée
* Envoyée
* Payée
* Annulée
* Archivée
* Génération PDF
* Génération Factur-X
* Transmission à une plateforme


