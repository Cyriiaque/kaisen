## Habit Tracker – Documentation (Mobile Only)

### Vision

Application mobile-first de suivi d'habitudes axée sur la constance, la simplicité et la motivation sociale. L'objectif est de permettre aux utilisateurs de créer, suivre et partager leurs habitudes au quotidien, avec un design optimisé pour mobile et un backend intégré via Next.js.

### Stack technique

- **Next.js 15 (App Router)**: front + back (routes/app, actions serveur)
- **TypeScript**: typage statique
- **Prisma**: ORM – base PostgreSQL (prod & dev)
- **Tailwind CSS v4**: design system en tokens et utilitaires
- **shadcn/ui**: composants UI (boutons, inputs, etc.)

### Cibles & plateformes

- **Mobile only** (UI responsive, breakpoints concentrés sur <640px)
- PWA optionnelle pour notifications push et offline ultérieurement

## Démarrage du projet

- Installer les dépendances: `pnpm install`
- Variables d'environnement: `.env`
  - `DATABASE_URL` / `DIRECT_URL` (PostgreSQL)
- Prisma
  - Migrations: `pnpm exec prisma migrate dev`
  - Générer le client: `pnpm exec prisma generate`
- Développement: `pnpm dev`
- Build de prod: `pnpm build`

### Organisation du code

- `src/app` – App Router (pages, layouts, actions serveur)
- `src/components/ui` – composants shadcn/ui
- `src/lib` – utilitaires (ex: `prisma.ts`)
- `prisma/` – schéma Prisma et migrations

## Modèle de données (proposition initiale)

Remarque: schéma minimal à enrichir au fil des EPICs.

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions      Session[]
  habits        Habit[]
  followers     Follow[] @relation("followers")
  following     Follow[] @relation("following")
  friendshipsA  Friendship[] @relation("friendA")
  friendshipsB  Friendship[] @relation("friendB")
  messagesSent  Message[] @relation("sender")
  messagesRecv  Message[] @relation("recipient")
  notifications Notification[]
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime @default(now())
  expiresAt DateTime
}

model Category {
  id    String  @id @default(cuid())
  name  String  @unique
  color String
  habits Habit[]
}

enum Frequency {
  DAILY
  WEEKLY
  CUSTOM
}

model Habit {
  id          String     @id @default(cuid())
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  name        String
  description String?
  color       String
  frequency   Frequency
  // Jours actifs (0-6) – sérialisé en JSON, ou bitmask entier
  activeDays  String?    // ex: "[1,2,3,4,5]" pour Lun-Ven
  category    Category?  @relation(fields: [categoryId], references: [id])
  categoryId  String?
  reminders   Reminder[]
  logs        HabitLog[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Reminder {
  id       String   @id @default(cuid())
  habit    Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  habitId  String
  atTime   String   // HH:mm (24h)
  timezone String   // IANA TZ id
}

model HabitLog {
  id       String   @id @default(cuid())
  habit    Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  habitId  String
  date     DateTime // stocké à minuit UTC
  done     Boolean  @default(false)
  // Optionnel: completedAt DateTime?

  @@unique([habitId, date])
}

model Follow {
  id         String @id @default(cuid())
  follower   User   @relation("following", fields: [followerId], references: [id], onDelete: Cascade)
  followerId String
  followed   User   @relation("followers", fields: [followedId], references: [id], onDelete: Cascade)
  followedId String
  createdAt  DateTime @default(now())

  @@unique([followerId, followedId])
}

model Friendship {
  id      String @id @default(cuid())
  friendA User   @relation("friendA", fields: [friendAId], references: [id], onDelete: Cascade)
  friendAId String
  friendB User   @relation("friendB", fields: [friendBId], references: [id], onDelete: Cascade)
  friendBId String
  status  String // pending | accepted | blocked
  createdAt DateTime @default(now())

  @@unique([friendAId, friendBId])
}

model Message {
  id          String   @id @default(cuid())
  sender      User     @relation("sender", fields: [senderId], references: [id], onDelete: Cascade)
  senderId    String
  recipient   User     @relation("recipient", fields: [recipientId], references: [id], onDelete: Cascade)
  recipientId String
  content     String
  createdAt   DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  type      String   // reminder | friend_activity | social
  payload   String   // JSON
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

## Routes & UX (mobile)

- Auth: `/signup`, `/login`, `/logout`
- Application: `/` (home), `/habits`, `/habits/[id]`, `/stats`, `/calendar`, `/social`
- Profil: `/profile`
- Motifs UI: navigation bottom bar (mobile), formulaires gros touch targets, skeletons, transitions

## Composants UI (shadcn/ui)

- Boutons, inputs, select, dialog/sheet (mobile-friendly), toasts (feedback), badges (catégories)
- Thème clair/sombre via tokens Tailwind v4 (`globals.css`)

## Auth & sécurité

- Inscription/connexion par e-mail + mot de passe (hash **bcrypt**)
- Sessions persistées (table `Session`) – cookies httpOnly à implémenter
- Suppression de compte: cascade sur habitudes/logs/relations
- RGPD: export/suppression des données (backlog)

## Notifications (itérations futures)

- Rappels d'habitudes: Web Push (PWA) + fallback e-mail
- Activités d'amis: notifications in-app + push
- Gestion fuseaux horaires dans `Reminder`

## Performance & accessibilité

- RSC + streaming là où pertinent, images optimisées, cache des requêtes
- Sémantique, contrastes, tailles tap-targets, focus states visibles

## Roadmap (suggestion)

1. EPIC 1 (Auth de base, profil minimal)
2. EPIC 2 (CRUD habitudes + logs quotidiens)
3. EPIC 3 (stats, calendrier)
4. EPIC 4 (rappels/notifications)
5. EPIC 5 (social: follow, amis, messages, activité)

## User Stories

### EPIC 1 — Connexion, inscription et gestion de profil

- **US01 – Inscription**: En tant qu’utilisateur, je veux pouvoir créer un compte avec mon adresse e-mail et un mot de passe, afin d’accéder à mes données personnelles et synchroniser mes habitudes.
- **US02 – Connexion**: En tant qu’utilisateur, je veux pouvoir me connecter à mon compte existant, afin d’accéder à mes habitudes et mes statistiques.
- **US03 – Déconnexion**: En tant qu’utilisateur, je veux pouvoir me déconnecter facilement, afin de sécuriser mon compte.
- **US04 – Suppression de compte**: En tant qu’utilisateur, je veux pouvoir supprimer définitivement mon compte et mes données, afin de gérer ma vie privée.
- **US05 – Consultation du profil**: En tant qu’utilisateur, je veux consulter mon profil (photo, nom, e-mail, préférences), afin de vérifier mes informations personnelles.
- **US06 – Modification du profil**: En tant qu’utilisateur, je veux modifier mes informations personnelles et mes préférences (photo, pseudo, thème, notifications), afin de personnaliser mon expérience.

### EPIC 2 — Habitudes

- **US07 – Création d’une habitude**: En tant qu’utilisateur, je veux pouvoir créer une habitude en lui donnant un nom, une description, une couleur et une fréquence, afin de la suivre régulièrement.
- **US08 – Modification d’une habitude**: En tant qu’utilisateur, je veux pouvoir modifier les informations d’une habitude existante, afin d’adapter mes objectifs.
- **US09 – Suppression d’une habitude**: En tant qu’utilisateur, je veux pouvoir supprimer une habitude définitivement, afin de garder ma liste propre.
- **US10 – Catégoriser une habitude**: En tant qu’utilisateur, je veux pouvoir attribuer une catégorie à chaque habitude (santé, productivité, bien-être…), afin de mieux organiser mon suivi.
- **US11 – Définir les jours actifs d’une habitude**: En tant qu’utilisateur, je veux pouvoir choisir les jours de la semaine où une habitude est active, afin de personnaliser ma routine.
- **US12 – Tri et filtres des habitudes**: En tant qu’utilisateur, je veux pouvoir trier et filtrer mes habitudes par catégorie, fréquence ou progression, afin d’avoir une vue claire et ciblée.
- **US13 – Barre de recherche des habitudes**: En tant qu’utilisateur, je veux pouvoir rechercher une habitude par son nom, afin de la retrouver rapidement.

### EPIC 3 — Suivi quotidien et progression

- **US14 – Cocher / décocher une habitude du jour**: En tant qu’utilisateur, je veux pouvoir marquer une habitude comme faite ou non faite pour la journée, afin de suivre ma progression.
- **US15 – Calendrier des habitudes**: En tant qu’utilisateur, je veux visualiser mes habitudes sous forme de calendrier (jour / semaine / mois), afin de voir ma constance dans le temps.
- **US16 – Statistiques de progression**: En tant qu’utilisateur, je veux voir mes statistiques (chaîne de réussite, taux de réussite, graphiques), par période (jour / semaine / mois / année), afin de mesurer mes progrès.

### EPIC 4 — Notifications et motivation

- **US17 – Définir une heure de rappel pour une habitude**: En tant qu’utilisateur, je veux définir une heure de rappel pour chaque habitude, afin de ne pas oublier de la réaliser.
- **US18 – Recevoir des notifications de rappel**: En tant qu’utilisateur, je veux recevoir une notification lorsque le moment de faire une habitude arrive, afin de rester constant.
- **US19 – Notifications liées à l’activité d’amis**: En tant qu’utilisateur, je veux recevoir des notifications sur les activités de mes amis (ex : ils ont terminé une habitude), afin d’être inspiré et encouragé.
- **US20 – Notifications liées aux relations (suivi, amis)**: En tant qu’utilisateur, je veux être notifié lorsqu’un ami me suit, m’ajoute ou interagit avec mes activités, afin de rester connecté à ma communauté.

### EPIC 5 — Multi-utilisateurs et interactions sociales

- **US21 – Suivre un utilisateur**: En tant qu’utilisateur, je veux pouvoir suivre un autre utilisateur, afin de voir ses progrès et me motiver.
- **US22 – Ne plus suivre un utilisateur**: En tant qu’utilisateur, je veux pouvoir me désabonner d’un utilisateur, afin de gérer mes relations.
- **US23 – Bloquer un utilisateur**: En tant qu’utilisateur, je veux pouvoir bloquer quelqu’un, afin d’éviter toute interaction indésirable.
- **US24 – Ajouter un ami**: En tant qu’utilisateur, je veux pouvoir ajouter un autre utilisateur comme ami, afin de partager nos progrès mutuels.
- **US25 – Supprimer un ami**: En tant qu’utilisateur, je veux pouvoir retirer quelqu’un de ma liste d’amis, afin de gérer mes relations.
- **US26 – Envoyer des messages entre amis**: En tant qu’utilisateur, je veux pouvoir envoyer des messages à mes amis, afin d’échanger sur nos habitudes et progrès.
- **US27 – Partager des statistiques**: En tant qu’utilisateur, je veux pouvoir partager mes statistiques ou chaînes de réussite avec mes amis, afin de me motiver ensemble.
- **US28 – Partager un calendrier**: En tant qu’utilisateur, je veux pouvoir partager mon calendrier d’habitudes avec mes amis, afin d’organiser des routines communes.
- **US29 – Collaborer avec un autre utilisateur pour une activité**: En tant qu’utilisateur, je veux pouvoir suivre une habitude à plusieurs, afin de progresser en équipe.
- **US30 – Activité des amis**: En tant qu’utilisateur, je veux voir un fil d’activité de mes amis (habitudes réalisées, nouveaux défis, etc.), afin de garder une dynamique sociale.

## Notes d'implémentation

- Actions serveur Next.js pour Auth (inscription/connexion), puis gestion de sessions (cookies httpOnly) dans une itération suivante.
- Composants shadcn/ui pour formulaires (inputs, selects, date pickers), navigation (sheet/bottom nav), toasts.
- Calendrier/stats: chart lib légère (ex: Recharts/Chart.js) – chargement dynamique côté client.
- Notifications: intégrer Web Push (PWA) + CRON/scheduled jobs pour rappels.
