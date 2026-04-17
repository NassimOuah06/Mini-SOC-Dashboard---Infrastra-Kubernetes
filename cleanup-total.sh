#!/bin/bash

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}--- ⚠️ NETTOYAGE TOTAL (Suppression des données) ---${NC}"

# 1. Suppression de toutes les ressources Kubernetes via les fichiers YAML
echo -e "${YELLOW}Suppression de toutes les ressources via k8s/...${NC}"
kubectl delete -f k8s/ --ignore-not-found=true

# 2. Nettoyage profond de Docker
echo -e "${YELLOW}Suppression des images et du cache Docker...${NC}"
eval $(minikube docker-env)
docker system prune -a -f

echo -e "${GREEN}🚀 Système totalement vierge. Tout est effacé.${NC}"