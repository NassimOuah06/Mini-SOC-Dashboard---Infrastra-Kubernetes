Write-Host "--- 🧹 Nettoyage des ressources Kubernetes ---" -ForegroundColor Red
# On ne supprime que le code qui change
kubectl delete deployment backend-soc frontend-soc --ignore-not-found=true
kubectl delete service backend-service frontend-service --ignore-not-found=true
kubectl delete ingress soc-ingress --ignore-not-found=true

Write-Host "--- Nettoyage forcé des images locales ---" -ForegroundColor Red
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# On ajoute -f (force) pour supprimer même si un reste de conteneur traîne
docker rmi -f backend-service:latest frontend-service:latest 2>$null

Write-Host "--- Terminé ! ---" -ForegroundColor Green