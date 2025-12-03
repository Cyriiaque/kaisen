# Système de Notifications

## Vue d'ensemble

Le système de notifications permet d'envoyer des rappels pour les habitudes. Les notifications sont créées automatiquement selon les règles suivantes :

- Si une heure est renseignée pour l'habitude : notification envoyée 20 minutes avant cette heure
- Si aucune heure n'est renseignée : notification envoyée au début de la journée (8h00 par défaut)

## Configuration

### 1. Activer les notifications pour une habitude

Dans le formulaire de création/modification d'habitude, activez le switch "Notifications" pour activer les notifications pour cette habitude.

### 2. Configuration du cron job

Pour que les notifications soient envoyées automatiquement, vous devez configurer un cron job qui appelle l'API route `/api/notifications/schedule`.

#### Option 1 : Vercel Cron (recommandé pour Vercel)

Ajoutez dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/notifications/schedule",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Cela exécutera la vérification toutes les 5 minutes.

#### Option 2 : Service externe (cron-job.org, etc.)

Configurez un service de cron externe pour appeler :
- URL : `https://votre-domaine.com/api/notifications/schedule`
- Méthode : GET
- Headers : `Authorization: Bearer VOTRE_CRON_SECRET` (si configuré)
- Fréquence : Toutes les 5-15 minutes

#### Option 3 : Développement local

Pour tester en local, vous pouvez créer un script Node.js qui appelle l'API route périodiquement.

### 3. Variable d'environnement (optionnel)

Pour sécuriser l'endpoint de planification, ajoutez dans `.env` :

```
CRON_SECRET=votre_secret_aleatoire
```

## Fonctionnalités

### Interface utilisateur

- **Icône de notification** : Dans la barre du haut, une icône de cloche affiche le nombre de notifications non lues
- **Overlay de notifications** : Cliquez sur l'icône pour ouvrir un overlay affichant toutes les notifications
- **Marquer comme lu** : Cliquez sur une notification individuelle ou utilisez "Tout marquer lu"

### Logique de notification

Les notifications sont créées uniquement si :

1. L'habitude a `notificationsEnabled = true`
2. L'utilisateur a activé les notifications globales (`user.notificationsEnabled = true`)
3. L'habitude est active aujourd'hui (selon la fréquence et les jours actifs)
4. L'habitude n'est pas déjà complétée aujourd'hui
5. L'habitude est dans sa période de validité (startDate/endDate)
6. Aucune notification n'a déjà été créée pour cette habitude aujourd'hui

## API Routes

### GET /api/notifications/schedule

Planifie et crée les notifications pour toutes les habitudes éligibles.

**Headers (optionnel)** :
- `Authorization: Bearer CRON_SECRET`

**Réponse** :
```json
{
  "success": true,
  "notificationsCreated": 5,
  "habits": ["habit-id-1", "habit-id-2", ...]
}
```

### GET /api/notifications/check

Vérifie le nombre de notifications non lues pour un utilisateur.

**Headers** :
- `x-user-id: user-id`

**Réponse** :
```json
{
  "unreadCount": 3
}
```

## Actions serveur

### getNotifications()

Récupère les 50 dernières notifications de l'utilisateur connecté.

### markNotificationAsRead(notificationId)

Marque une notification spécifique comme lue.

### markAllNotificationsAsRead()

Marque toutes les notifications de l'utilisateur comme lues.

### getUnreadNotificationsCount()

Retourne le nombre de notifications non lues pour l'utilisateur connecté.

