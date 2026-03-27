# PPE Infractions — App Publique

## Description
Interface de consultation pour les contrevenants.
Aucune connexion requise. Aucune mention de la PPE.

## Stack
React + Vite + Supabase + html5-qrcode

## Fonctionnalités principales
- Scan QR code via caméra ou saisie manuelle du code
- Lecture automatique du code depuis l'URL (?code=XXXXXXXX)
- Vérification de la plaque (confidentialité)
- Affichage des détails et photos de l'infraction
- Formulaire de contact anonyme (bouton conditionnel)
- Gestion des statuts : vierge, actif, consulté, annulé

## Points ouverts liés à cette app
Voir section 9 du document de référence.
Prioritaires : bouton retour incorrect (4), statut consulté (5),
espaces dans code (2)

## Déploiement
Vercel — redéploiement automatique sur push GitHub (branche main)