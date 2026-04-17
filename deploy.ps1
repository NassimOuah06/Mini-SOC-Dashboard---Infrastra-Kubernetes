Write-Host "--- Démarrage de Minikube ---" -ForegroundColor Cyan
minikube start --addons ingress

Write-Host "--- Configuration de l'environnement Docker ---" -ForegroundColor Cyan
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

Write-Host "--- Build des images (Backend & Frontend) ---" -ForegroundColor Cyan
docker build -t backend-service:latest ./backend
docker build -t frontend-service:latest ./frontend

Write-Host "--- Déploiement Kubernetes ---" -ForegroundColor Cyan
kubectl apply -f k8s/

Write-Host "--- Déploiement terminé ! ---" -ForegroundColor Green
Write-Host "N'oubliez pas de lancer 'minikube tunnel' dans un autre terminal." -ForegroundColor Yellow