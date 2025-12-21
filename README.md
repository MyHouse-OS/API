# 🏠 BunServer - Backend Domotique (MyHouse OS)

Ce projet est un serveur backend pour un système domotique, conçu pour être rapide, modulaire et orienté événements. Il gère l'état de la maison (lumières, chauffage, portes, température), conserve un historique des événements et automatise certaines tâches via un moteur de règles intelligent.

## 🛠 Stack Technique

*   **Runtime:** [Bun](https://bun.sh/) (JavaScript/TypeScript runtime ultra-rapide)
*   **Framework Web:** [ElysiaJS](https://elysiajs.com/)
*   **Base de données:** PostgreSQL
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Outils:** Biome (Linter/Formatter), Lefthook (Git Hooks), Docker

## 🚀 Installation et Démarrage

### Prérequis
*   Bun installé (`curl -fsSL https://bun.sh/install | bash`)
*   Docker et Docker Compose (pour la base de données)

### Configuration

1.  **Cloner le projet** et installer les dépendances :
    ```bash
    bun install
    ```

2.  **Configurer les variables d'environnement** :
    Copiez le fichier d'exemple et adaptez-le (notamment l'URL de la base de données).
    ```bash
    cp .env.example .env
    ```

3.  **Démarrer la base de données** :
    ```bash
    docker compose up -d
    ```

### Lancer le serveur

*   **Mode développement** (avec rechargement automatique) :
    ```bash
    bun run dev
    ```
*   **Mode production** :
    ```bash
    bun start
    ```

## 🔐 Authentification

L'API utilise un système d'authentification personnalisé basé sur un couple `ClientID` et `ClientToken`.

*   **Header requis :** `Authorization`
*   **Format :** `ClientID:ClientToken`
*   **Validation :** Le serveur vérifie que le `ClientID` existe et que le token fourni correspond au token chiffré stocké en base.

> ⚠️ **Note :** La route `/status` est publique. Toutes les autres routes (`/check`, `/history`, `/temp`, `/toggle`, `/auth`) sont protégées par le middleware d'authentification.

## 📡 API Reference

### Endpoints REST

#### Système
*   `GET /status` : Vérifier l'état du serveur (Public).
*   `GET /check` : Vérification de santé avancée (Protégé).

#### Contrôle (Toggle)
Ces routes permettent de modifier l'état des appareils.
*   `POST /toggle/light` : Allumer/Éteindre la lumière.
*   `POST /toggle/door` : Ouvrir/Fermer la porte.
*   `POST /toggle/heat` : Activer/Désactiver le chauffage.

#### Température
*   `POST /temp` : Mettre à jour la température actuelle de la maison.
    *   *Body :* `{ "temp": "number" }`

#### Historique
*   `GET /history` : Récupérer l'historique des événements (changements d'état, règles déclenchées).

### WebSocket (`/ws`)

Le serveur expose un endpoint WebSocket pour les mises à jour en temps réel.
*   **Topic :** `home-updates`
*   **Fonctionnement :** Le dashboard reçoit automatiquement les changements d'état (nouvelle température, lumière allumée, etc.) dès qu'ils se produisent.

## 🧠 Moteur de Règles (Automation)

Le système intègre un moteur de règles (`src/rules/engine.ts`) qui réagit aux changements d'état (`EVENTS.STATE_CHANGE`).

### Règles Actives (`src/rules/definitions.ts`)

1.  **HEAT_ON_COLD (Chauffage Auto)**
    *   *Condition :* Température < 19°C **ET** Porte fermée **ET** Chauffage éteint.
    *   *Action :* Allume le chauffage.

2.  **HEAT_OFF_HOT (Économie Chauffage)**
    *   *Condition :* Température > 23°C **ET** Chauffage allumé.
    *   *Action :* Éteint le chauffage.

3.  **LIGHT_ON_ENTRY (Lumière Entrée)**
    *   *Condition :* Porte ouverte **ET** Lumière éteinte.
    *   *Action :* Allume la lumière (Bienvenue !).

4.  **ECO_GUARD_DOOR (Sécurité Énergie)**
    *   *Condition :* Porte ouverte **ET** Chauffage allumé.
    *   *Action :* Coupe le chauffage pour ne pas chauffer l'extérieur.

## 📂 Architecture du Code

```
.
├── prisma/             # Schéma DB, Migrations et Seeds
├── src/
│   ├── middleware/     # AuthMiddleware (vérification token)
│   ├── routes/         # Définition des routes API (Elysia)
│   ├── rules/          # Moteur de règles et définitions
│   ├── services/       # Logique métier (HomeStateService)
│   ├── utils/          # Utilitaires (Crypto, EventBus)
│   ├── enums.ts        # Types d'événements (TEMPERATURE, LIGHT...)
│   └── index.ts        # Point d'entrée serveur
└── tests/              # Tests unitaires et d'intégration
```

## ✅ Tests et Qualité

*   **Linter le code :** `bun run lint` (via Biome)
*   **Lancer les tests :** `bun test`
