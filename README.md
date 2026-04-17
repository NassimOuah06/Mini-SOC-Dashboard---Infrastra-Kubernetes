# 🛡️ Mini SOC Dashboard - Infrastructure Kubernetes

Ce projet est une plateforme de gestion de logs de sécurité (SOC) déployée sur un cluster Kubernetes local (**Minikube**). Il permet de collecter, stocker (MySQL) et visualiser des événements réseau via une architecture micro-services.

## Architecture

- **Frontend** : React.js servi par Nginx.
- **Backend** : Node.js Express (API REST).
- **Base de données** : MySQL 8.0 pour la persistance.
- **Ingress** : Nginx Ingress Controller (Gateway)

Voici le schéma de flux du Mini SOC :

``` Plaintext
┌──────────────────────────────────────────────────────────┐
│                  KUBERNETES (Minikube)                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │      NGINX Ingress Controller (Gateway)            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Routage :                                    │  │  │
│  │  │ - /    → frontend-service (port 80)          │  │  │
│  │  │ - /api → backend-service  (port 8000)        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                 │                        │               │
│                 ▼                        ▼               │
│      ┌──────────────────┐      ┌──────────────────┐      │
│      │   Frontend Pod   │      │   Backend Pod    │      │
│      │     (React)      │      │    (Node.js)     │      │
│      │     port 80      │      │    port 8000     │      │
│      └──────────────────┘      └────────┬─────────┘      │
│                                         │                │
│                                         │ TCP/SQL (3306) │
│                                         ▼                │
│                                ┌──────────────────┐      │
│                                │    MySQL Pod     │      │
│                                │   (mysql-soc)    │      │
│                                │    port 3306     │      │
│                                │ + PersistentVol  │      │
│                                └──────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

---

## Guide de déploiement

- Lancement Rapide (Automatisation)
- Lancement Manuel (pas a pas)

### Lancement Rapide

#### 1. Déploiement complet

Ce script démarre Minikube (avec Ingress), configure le démon Docker, build les images du SOC et déploie l'infrastructure.

Sur Windows (PowerShell) :

```PowerShell
./deploy.ps1
```

Sur Linux / macOS :

```Bash
chmod +x deploy.sh
./deploy.sh
```

Note importante : Une fois le déploiement terminé, n'oubliez pas d'ouvrir un terminal dédié et de lancer la commande minikube tunnel pour rendre l'interface accessible sur votre navigateur à l'adresse <http://localhost>.

#### 2. Nettoyage (garde la percistance)

Ce script supprime proprement toutes les ressources Kubernetes (Pods, Services, Ingress, Secrets) créées pour ce projet.

Sur Windows (PowerShell) :

```PowerShell
./cleanup.ps1
```

Sur Linux / macOS :

```Bash
chmod +x cleanup.sh
./cleanup.sh
```

#### 3. Nettoyage total

Ce script supprime toutes les ressources Kubernetes créées pour ce projet ainsi que les données en persistence sur la Base de Donnée.

Sur Windows (PowerShell) :

```PowerShell
./cleanup-total.ps1
```

Sur Linux / macOS :

```Bash
chmod +x cleanup-total.sh
./cleanup-total.sh
```

### Lancement Manuel

#### 1. Prérequis

Assurez-vous d'avoir installé :

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

#### 2. Démarrage de l'environnement

Ouvrez un terminal (PowerShell en mode Administrateur) et lancez le cluster :

```powershell
minikube start
minikube addons enable ingress
```

#### 3. Préparation des images Docker (Locale)

Pour que Kubernetes utilise vos images sans passer par Docker Hub (locale), il faut construire les images directement dans le démon Docker de Minikube. Choisissez la commande selon votre système :

Sur Windows (PowerShell) :

```PowerShell
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
```

Sur Linux / macOS / Git Bash :

```Bash
eval $(minikube docker-env)
```

Ensuite, buildez les images :

```PowerShell
# Build du Backend
docker build -t backend-service:latest ./backend

# Build du Frontend
docker build -t frontend-service:latest ./frontend
```

#### 4. Déploiement des micro-services

Appliquez les configurations Kubernetes présentes dans le dossier k8s/ :

```PowerShell
kubectl apply -f k8s/
```

Cette commande déploie MySQL, les Services, les Deployments et l'Ingress

#### 5. Accès à l'application

Le comportement de l'Ingress varie selon le système d'exploitation :

- Sur Windows / macOS : Minikube tourne dans une VM isolée. Vous devez lancer un tunnel dans un terminal séparé pour accéder à localhost :

````PowerShell
minikube tunnel
````

- Sur Linux : L'IP de l'Ingress est généralement accessible directement :

```Bash
# Récupérer l'IP
kubectl get ingress
```

Accès final : Ouvrez votre navigateur sur <http://localhost> (ou l'IP retournée).
