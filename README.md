# SmartCampus AI

Plateforme de gestion des incidents du campus : **signaler** (US-01), **suivre** (US-02), **traiter** (US-03),
**interroger l'assistant IA** (US-04/05) et **piloter** (US-06).

Stack : React (Vite) · Node.js/Express · PostgreSQL · AWS us-west-2 (EC2, RDS, S3, Bedrock).

**Architecture MVP validée** : une seule application Node/Express sur l'EC2 sert le front React compilé, l'API
et la tâche de relance 24 h (RG-06). Elle appelle RDS (SQL :5432), S3 (photos) et Bedrock (assistant) via le rôle IAM.
Hors MVP : HTTPS/Route 53, Cognito, SES, SNS, Secrets Manager, CloudWatch, VPC dédié, Bedrock Knowledge Base.

---

## 1. Démarrer en local

### Option A — Tout en Docker (le plus simple)

```bash
cp .env.example .env            # Windows (cmd) : copy .env.example .env
docker compose --profile local up --build
```

→ http://localhost (la base est créée avec les données de démo au premier lancement).
Port 80 déjà utilisé sur votre PC ? Dans `docker-compose.yml`, remplacer `"80:3000"` par `"8081:3000"`.
Pour remettre la base à zéro : `docker compose --profile local down -v` puis relancer.

### Option B — Développement (rechargement à chaud)

```bash
# 1. La base seule
docker compose --profile local up -d db

# 2. L'API (port 3000)
cd api
cp ../.env.example .env        # DATABASE_URL=postgres://smartcampus:smartcampus@localhost:5433/smartcampus
npm install
npm run dev

# 3. Le front (port 5173, /api redirigé vers :3000)
cd ../front
npm install
npm run dev
```

→ http://localhost:5173

### Comptes de démo (mot de passe `demo1234`)

| Compte | Rôle | Pour tester |
|---|---|---|
| lea@campus.fr | Étudiante | US-01, 02, 04, 05 |
| tom@campus.fr | Étudiant | RG-05 (ne voit pas les tickets de Léa) |
| karim@campus.fr | Technicien (Matériel, Réseau) | US-03 |
| julie@campus.fr | Technicienne (Salle, Bâtiment, Sécurité) | RG-07 (ne peut pas modifier les tickets de Karim) |
| sophie@campus.fr | Admin | US-06 |

---

## 2. Organisation du code

```
api/
  db/01-schema.sql, 02-seed.sql   Schéma + 22 tickets de démo (4 mois d'historique)
  faq.json                        Base de connaissances de l'assistant
  src/index.js                    Montage des routes + service du front compilé (front/dist)
  src/jobs/relance.js             RG-06 : tâche de relance des tickets > 24 h
  src/middleware/auth.js          JWT + rôles (RBAC)
  src/routes/tickets.js           US-01, 02, 03 — RG-01 à RG-08, RG-13, RG-14
  src/routes/assistant.js         US-04, 05 — RG-09, RG-10
  src/routes/stats.js             US-06 — RG-11, RG-12, alertes RG-03
  src/services/storage.js         Photos : S3 ou disque local
  src/services/assistant.js       Bedrock ou repli FAQ par mots-clés
  test/api.test.js                Tests des règles métier
front/src/pages/
  Login · Signaler · MesDemandes · DetailTicket · MaFile · Assistant · Dashboard
```

### Contrat d'API

| Méthode | Route | Rôle | US |
|---|---|---|---|
| POST | `/api/auth/login` | tous | — |
| GET | `/api/referentiels` | connecté | 01 |
| POST | `/api/tickets` (multipart) | étudiant | 01 |
| GET | `/api/tickets/mine?statut=` | étudiant | 02 |
| GET | `/api/tickets/:id` | auteur / technicien assigné / admin | 02 |
| GET | `/api/tickets/:id/photo` | idem | 01 |
| GET | `/api/tickets/assigned?tous=1` | technicien / admin | 03 |
| PATCH | `/api/tickets/:id/status` `{statut, commentaire}` | technicien assigné / admin | 03 |
| POST | `/api/assistant/chat` `{message}` | étudiant | 04, 05 |
| GET | `/api/stats?periode=semaine\|mois\|semestre` | admin | 06 |
| GET | `/api/health` | public | — |

### Règles métier implémentées

| Règle | Où |
|---|---|
| RG-01 champs obligatoires | `tickets.js` POST + front `Signaler.jsx` |
| RG-02 photo JPG/PNG ≤ `MAX_PHOTO_MB` | `tickets.js` (multer) + front |
| RG-03 Sécurité → Critique + alerte | priorité de la catégorie (seed) + bandeau tableau de bord + log |
| RG-04 statut Nouveau + priorité de la catégorie | `tickets.js` POST |
| RG-05 étudiant = ses tickets | `canAccess()` + `/mine` |
| RG-06 relance 24 h | `jobs/relance.js` (toutes les `RELANCE_INTERVAL_MIN` min) : 1 relance par ticket dans l'historique + badge « En retard » + compteur sur le tableau de bord |
| RG-07 Nouveau → En cours → Résolu, technicien assigné ou admin | `TRANSITIONS` dans `tickets.js` |
| RG-08 commentaire obligatoire pour Résolu | `tickets.js` PATCH + front |
| RG-09 pas d'invention hors FAQ | prompt Bedrock + repli mots-clés |
| RG-10 pas de ticket sans validation | l'assistant renvoie une suggestion, l'étudiant valide le formulaire |
| RG-11 délai de résolution | `stats.js` (tickets résolus uniquement) |
| RG-12 tableau de bord admin, données agrégées | `requireRole('ADMIN')` dans `index.js` |
| RG-13 assignation auto au technicien de la catégorie | `categorie.technicien_id` |
| RG-14 technicien = ses tickets | `canAccess()` + `/assigned` |

---

## 3. Tests (QE)

```bash
cd api
npm run db:init     # ATTENTION : remet la base à zéro
npm test
```

14 tests couvrent RG-01 à RG-09, RG-11, RG-12, RG-13 et les scénarios Gherkin de US-02 et US-05.

---

## 4. Déployer sur AWS

Prérequis (étape Setup, région **us-west-2**) : RDS PostgreSQL (accès public : Non), bucket S3 privé,
rôle IAM sur l'EC2 (S3 + Bedrock + SSM), groupes de sécurité « web » (80 depuis Internet) et « db » (5432 depuis « web »).

```bash
# Sur l'EC2 (Amazon Linux 2023), via Session Manager ou SSH
sudo bash scripts/ec2-setup.sh              # ou collé dans « User data » au lancement
git clone <votre-repo> smartcampus && cd smartcampus
cp .env.example .env && nano .env           # DATABASE_URL (RDS), PGSSL=true, S3_BUCKET, BEDROCK_MODEL_ID, JWT_SECRET
docker compose up -d --build
docker compose run --rm app npm run db:init # une seule fois : schéma + données de démo dans RDS
curl localhost/api/health                    # → stockage s3://… et assistant bedrock
```

→ `http://<IP publique de l'EC2>`

**Mettre à jour après un `git push`** : `git pull && docker compose up -d --build`
**Logs** : `docker compose logs -f app`

### Bedrock

1. Console Bedrock (région **us-west-2**) → *Model catalog* : vérifier que le modèle (ex. Claude Haiku) est accessible.
2. Tester une question dans le *Playground*.
3. Copier l'ID du modèle (ou du profil d'inférence) dans `BEDROCK_MODEL_ID`.
4. `curl localhost/api/health` doit afficher `"assistant": "bedrock"`.

---

## 5. Plans B (sans toucher au code)

| Problème | Solution |
|---|---|
| Bedrock inaccessible | `BEDROCK_MODEL_ID=` vide → repli automatique sur la FAQ par mots-clés (en cas d'erreur Bedrock aussi) |
| S3 bloqué | `S3_BUCKET=` vide → photos sur le disque de l'EC2 |
| RDS bloqué | Lancer `docker compose --profile local up -d` sur l'EC2 et laisser `DATABASE_URL=` vide |

---

## 6. Scénario de démo (5 min)

1. **Léa** signale « vidéoprojecteur ne s'allume pas » en B204 avec une photo → n° INC-xxxxx, statut Nouveau.
2. **Karim** le voit dans sa file → passe En cours → tente Résolu sans commentaire (refusé, RG-08) → Résolu avec « Lampe remplacée ».
3. **Léa** ouvre le ticket : historique complet avec le commentaire de Karim.
4. **Léa** demande à l'assistant « Comment je me connecte au Wi-Fi ? » → réponse + source FAQ.
   Puis « Le Wi-Fi ne marche pas du tout en salle A12 » → bouton *Créer un signalement* pré-rempli (A12, Problème réseau).
5. **Tom** essaie d'ouvrir le ticket de Léa → accès refusé (RG-05).
6. **Sophie** ouvre le tableau de bord : alerte critique, tickets en retard (RG-06), répartition par catégorie et lieu, délai moyen, filtre semaine/mois/semestre.
7. Montrer un ticket « En retard » : la relance automatique « Système » apparaît dans son historique.

---

## 7. Hors MVP → roadmap (cf. schéma d'architecture)

| Évolution | Remplacée dans le MVP par |
|---|---|
| Route 53 + HTTPS | HTTP sur l'IP publique de l'EC2 |
| Cognito | Comptes de démo + JWT |
| Amazon SES (e-mails, relance 24 h) | Relance dans l'historique + badge « En retard » |
| Amazon SNS (alerte sécurité) | Priorité critique en tête de file + bandeau sur le tableau de bord |
| Secrets Manager | Variables d'environnement sur l'EC2 (`.env`) |
| CloudWatch (logs) | `docker compose logs` + métriques EC2 par défaut |
| VPC dédié + sous-réseau privé | VPC par défaut + RDS non public |
| Bedrock Knowledge Base | FAQ dans le prompt |
| ECS Fargate, RDS Multi-AZ, Terraform | 1 EC2, RDS Single-AZ, console AWS |
