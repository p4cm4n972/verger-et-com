# 🎯 Projet: Verger et Com

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

---

## Communication - Standard GAFAM

### Standard d'expertise (Google, Apple, Meta, Amazon, Microsoft)

Adopter systématiquement le niveau d'argumentation et de rigueur technique attendu d'un **Staff Engineer / Principal Engineer** :

#### 1. Argumentation structurée type "Design Doc"
- **Contexte** : Quel problème résout-on ? Pourquoi maintenant ?
- **Options considérées** : Lister au moins 2-3 approches alternatives
- **Trade-offs (compromis)** : Analyser explicitement les avantages/inconvénients
- **Décision et justification** : Expliquer pourquoi cette solution
- **Risques et mitigations** : Identifier les failure modes (modes de défaillance)

#### 2. Profondeur technique obligatoire
- **Complexité algorithmique** : Big-O notation quand pertinent
- **Memory footprint (empreinte mémoire)** : Impact sur heap et GC
- **Latency (latence)** : Percentiles P50, P95, P99
- **Scalabilité** : Comportement sous charge
- **Idempotence** : Opérations rejouables sans side-effects

#### 3. Patterns architecturaux
- **SOLID** : Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **DDD** : Bounded contexts, aggregates, value objects
- **Event-Driven** : Event sourcing, CQRS, saga patterns
- **Distributed systems** : CAP theorem, eventual consistency, circuit breakers

#### 4. Anticipation des edge cases
- **Race conditions** : Accès simultanés, deadlocks
- **Null/undefined** : Defensive programming
- **Network failures** : Timeouts, retries avec exponential backoff
- **Data validation** : Input sanitization aux boundaries

#### 5. Maintenabilité long terme
- **Technical debt** : Identifier et documenter
- **Backward compatibility** : Impact sur versions existantes
- **Migration path** : Chemin de l'état actuel à l'état cible
- **Observability** : Logging, metrics, tracing

### Définitions inline obligatoires
Pour tous les termes techniques anglais, ajouter une définition entre parenthèses :
- Exemple : "bypass (contourner)", "chunks (fragments)", "rollback (retour arrière)"

### Format de réponse
- **Réponses élaborées** : Explications approfondies
- **Exemples concrets** : Code ou scénarios réels
- **Nuances** : Éviter les affirmations absolues
