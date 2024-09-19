// Charger les logs d'activités depuis le LocalStorage
const activityLogs = JSON.parse(localStorage.getItem('activityLogs')) || [];

// Fonction pour convertir le temps en millisecondes en heures, minutes, secondes
function formatTime(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Récupérer l'élément tbody du tableau
const activitiesLogTable = document.getElementById('activities-log');

// Remplir le tableau avec les données des logs
activityLogs.forEach(log => {
  const row = document.createElement('tr');

  // Nom de l'activité
  const nameCell = document.createElement('td');
  nameCell.textContent = log.name;
  row.appendChild(nameCell);

  // Temps programmé
  const originalTimeCell = document.createElement('td');
  originalTimeCell.textContent = formatTime(log.originalDuration);
  row.appendChild(originalTimeCell);

  // Temps réel passé
  const timeSpentCell = document.createElement('td');
  timeSpentCell.textContent = formatTime(log.timeSpent);
  row.appendChild(timeSpentCell);

  // Ajouter la ligne au tableau
  activitiesLogTable.appendChild(row);
});
