# Kaisen - Suivi d'Habitudes

Application mobile-first de suivi d'habitudes. Permet de créer, suivre et améliorer vos habitudes au quotidien.

## Fonctionnalités

### Pages principales

#### 1. **Dashboard (Accueil)** - `/`

- Vue d'ensemble de toutes vos habitudes
- Affichage des streaks (séries de jours consécutifs)
- Compteur de notifications non lues
- Filtrage et recherche d'habitudes
- Toggle rapide pour marquer une habitude comme complétée

#### 2. **Gestion des Habitudes** - `/habits`

- Création, modification et suppression d'habitudes
- Configuration de la fréquence :
  - **Quotidienne** : tous les jours
  - **Hebdomadaire** : une fois par semaine
  - **Personnalisée** : jours spécifiques de la semaine
- Définition de dates de début et de fin
- Ajout de rappels avec heure et fuseau horaire
- Activation/désactivation des notifications
- Organisation par catégories

#### 3. **Calendrier** - `/calendar`

- Vue calendrier mensuelle
- Visualisation des habitudes complétées par jour
- Navigation entre les mois
- Indicateurs visuels pour les jours avec habitudes complétées

#### 4. **Statistiques** - `/stats`

- Graphiques de progression
- Statistiques par période (semaine, mois, année)
- Taux de complétion
- Évolution des streaks

#### 5. **Profil** - `/profile`

- Gestion du profil utilisateur
- Upload de photo de profil (stockage en base64)
- Configuration du thème (clair/sombre)
- Activation/désactivation des notifications globales
- Modification du nom et de l'email
- Suppression du compte

### Fonctionnalités avancées

#### **Catégories**

- Création de catégories personnalisées
- Attribution de couleurs aux catégories
- Organisation des habitudes par catégorie
- Modification et suppression de catégories

#### **Authentification**

- Inscription avec email et mot de passe
- Connexion sécurisée
- Sessions persistantes (30 jours)
- Déconnexion

#### **Notifications**

- Notifications de rappel pour les habitudes
- Planification automatique basée sur :
  - L'heure de rappel configurée
  - La fréquence de l'habitude
  - Les jours actifs (pour les habitudes personnalisées)
  - Les dates de début/fin
- Polling automatique toutes les 60 secondes
- Badge de compteur de notifications non lues
- Marquage comme lues
- Suppression de notifications

## Tester les Notifications

Pour créer une habitude avec notifications :

1. Aller sur `/habits`
2. Créer une nouvelle habitude
3. Activer "Notifications activées"
4. Définir une heure de rappel (ex: 14:00)
5. Sauvegarder

**Important** : Le rappel est envoyé **20 minutes avant** l'heure renseignée. Par exemple, si vous définissez 14:00, la notification sera créée à partir de 13:40.

Le système vérifie automatiquement les notifications toutes les 60 secondes. Les notifications apparaissent dans le badge de notification en haut à droite de l'écran.

## 🛠️ Stack Technique

- **Next.js 15** (App Router) - Framework React
- **TypeScript** - Typage statique
- **Prisma** - ORM pour PostgreSQL
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Composants UI
- **PostgreSQL** - Base de données
