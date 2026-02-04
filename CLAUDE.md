# 🎯 Projet: Verger et Com

> ⚠️ **IMPORTANT**: Ce fichier **hérite** des instructions globales définies dans `/home/itmade/Documents/ITMADE-STUDIO/CLAUDE.md`.
> Les standards de communication GAFAM (argumentation Design Doc, profondeur technique, patterns architecturaux) s'appliquent à ce projet.

> **Résumé en une ligne**: E-commerce / plateforme avec Supabase et Stripe

---

## 📋 Contexte Projet

**Type**: Plateforme e-commerce
**Statut**: En développement

---

## 🛠️ Stack Technique

### Frontend
- **Framework**: Next.js 16.1.4 + React 19
- **Styling**: Tailwind CSS 4
- **Drag & Drop**: @dnd-kit/core + sortable

### Backend
- **BaaS**: Supabase (@supabase/supabase-js + @supabase/ssr)
- **Paiements**: Stripe
- **Email**: Resend + Nodemailer

### Infrastructure
- **Tests**: Vitest + Testing Library

---

## 🔧 Commandes Essentielles

```bash
npm install           # Installation
npm run dev           # Dev server
npm run build         # Build production
npm run start         # Production mode
npm run test          # Tests Vitest
npm run test:run      # Tests en mode CI
npm run lint          # ESLint
```

---

## 📁 Architecture

```
/
├── src/              → Code source principal
├── supabase/         → Migrations et config Supabase
├── public/           → Assets statiques
└── coverage/         → Rapports de couverture
```

---

## ⚠️ Points d'Attention

- **RLS Supabase**: Vérifier les policies pour chaque table
- **Stripe**: Webhooks à configurer en production
- **Drag & Drop**: Utiliser @dnd-kit pour les fonctionnalités de tri
- **Emails**: Resend pour transactionnel, Nodemailer en backup

---

## 🤖 Instructions Claude

- Réponses en français
- Utiliser @supabase/ssr pour la compatibilité SSR
- Tests obligatoires pour les fonctionnalités e-commerce
- Valider la sécurité des paiements Stripe
