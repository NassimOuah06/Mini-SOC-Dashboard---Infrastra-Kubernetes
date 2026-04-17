#!/bin/bash
echo "--- Démarrage de Minikube ---"
minikube start --addons ingress

echo "--- Configuration de l'environnement Docker ---"
eval $(minikube docker-env)

echo "--- Build des images ---"
docker build -t backend-service:latest ./backend
docker build -t frontend-service:latest ./frontend

echo "--- Déploiement Kubernetes ---"
kubectl apply -f k8s/

echo "--- Terminé ! ---"