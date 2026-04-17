#!/bin/bash

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}--- 🛠️ Nettoyage Applicatif (Conservation DB) ---${NC}"

# On ne supprime QUE les composants qui changent
echo -e "${YELLOW}Suppression des Deployments, Services et Ingress...${NC}"
kubectl delete deployment backend-soc frontend-soc --ignore-not-found=true
kubectl delete service backend-service frontend-service --ignore-not-found=true
kubectl delete ingress soc-ingress --ignore-not-found=true

# Nettoyage des images pour forcer le rebuild au prochain deploy
echo -e "${YELLOW}Purge des images Docker dans Minikube...${NC}"
eval $(minikube docker-env)
docker rmi -f backend-service:latest frontend-service:latest 2>/dev/null

echo -e "${GREEN}✅ Prêt pour redéployer. Tes logs MySQL sont préservés.${NC}"