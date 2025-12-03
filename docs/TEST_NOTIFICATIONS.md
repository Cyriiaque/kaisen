# Tester les Notifications

## Problème : Pas de notifications 20 minutes avant l'heure

Si vous ne recevez pas de notifications 20 minutes avant l'heure renseignée, voici comment diagnostiquer et résoudre le problème.

## 1. Vérifier que les notifications sont activées

- Ouvrez une habitude dans le formulaire
- Vérifiez que le switch "Notifications" est activé
- Vérifiez qu'une heure est renseignée dans le champ "Heure"

## 2. Tester manuellement (Développement)

Pour tester sans configurer de cron job, vous pouvez appeler directement l'API route :

### Option A : Via le navigateur

Ouvrez dans votre navigateur (en étant connecté) :

```
http://localhost:3000/api/notifications/schedule
```

### Option B : Via curl

```bash
curl http://localhost:3000/api/notifications/schedule
```

### Option C : Créer un bouton de test (à ajouter dans l'interface)

Vous pouvez ajouter un bouton de test dans votre interface qui appelle l'action `testScheduleNotifications()`.

## 3. Configuration du Cron Job (Production)

Les notifications ne se créent automatiquement que si un cron job appelle régulièrement la route `/api/notifications/schedule`.

### Pour Vercel

Créez un fichier `vercel.json` à la racine du projet :

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

### Pour d'autres plateformes

Utilisez un service de cron externe (cron-job.org, EasyCron, etc.) pour appeler :

- URL : `https://votre-domaine.com/api/notifications/schedule`
- Méthode : GET
- Fréquence : Toutes les 5-15 minutes

## 4. Logique de création des notifications

Une notification est créée si **TOUTES** ces conditions sont remplies :

1. ✅ L'habitude a `notificationsEnabled = true`
2. ✅ L'habitude est active aujourd'hui (selon la fréquence)
3. ✅ L'habitude n'est pas déjà complétée aujourd'hui
4. ✅ L'habitude est dans sa période de validité (startDate/endDate)
5. ✅ Aucune notification n'a déjà été créée pour cette habitude aujourd'hui
6. ✅ On est dans la fenêtre de temps :
   - L'heure actuelle est >= (heure de l'habitude - 20 minutes)
   - L'heure actuelle est <= (heure de l'habitude OU 2 heures après l'heure de notification)

### Exemple

Si votre habitude est programmée à **10h00** :

- L'heure de notification est **9h40** (10h00 - 20 minutes)
- La notification sera créée si le cron job s'exécute entre **9h40** et **10h00**
- Si le cron job s'exécute après 10h00, la notification ne sera pas créée (trop tard)

## 5. Débogage

### Vérifier les logs

Les erreurs sont loggées dans la console du serveur. Vérifiez :

- Les erreurs de base de données
- Les erreurs de parsing des dates
- Les erreurs de timezone

### Vérifier dans la base de données

```sql
-- Voir toutes les notifications créées aujourd'hui
SELECT * FROM "Notification"
WHERE "createdAt" >= CURRENT_DATE
ORDER BY "createdAt" DESC;

-- Voir les habitudes avec notifications activées
SELECT id, name, "notificationsEnabled"
FROM "Habit"
WHERE "notificationsEnabled" = true;
```

### Vérifier les reminders

```sql
-- Voir les reminders associés aux habitudes
SELECT h.id, h.name, r."atTime"
FROM "Habit" h
LEFT JOIN "Reminder" r ON r."habitId" = h.id
WHERE h."notificationsEnabled" = true;
```

## 6. Problèmes courants

### Le cron job ne s'exécute pas

- Vérifiez la configuration dans `vercel.json`
- Vérifiez les logs Vercel pour les erreurs
- Testez manuellement l'endpoint

### Les notifications ne sont pas créées même avec le cron job

- Vérifiez que l'heure actuelle est dans la fenêtre de temps
- Vérifiez que l'habitude n'est pas déjà complétée
- Vérifiez qu'une notification n'a pas déjà été créée aujourd'hui

### Les notifications sont créées trop tôt ou trop tard

- Vérifiez le timezone du serveur
- Vérifiez que l'heure renseignée est correcte (format HH:mm)
