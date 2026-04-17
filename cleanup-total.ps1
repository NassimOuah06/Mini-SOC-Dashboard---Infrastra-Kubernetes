Write-Host "--- ⚠️ NETTOYAGE TOTAL (Suppression des données) ---" -ForegroundColor Red

# 1. Supprime toutes les ressources définies dans le dossier k8s
Write-Host "Suppression de toutes les ressources Kubernetes (Apps, DB, Volumes)..." -ForegroundColor Yellow
kubectl delete -f k8s/ --ignore-not-found=true

# 2. Nettoyage Docker profond
Write-Host "Suppression des images et nettoyage du cache Docker..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker system prune -a -f

Write-Host "Système totalement vierge. Tout est effacé." -ForegroundColor Green