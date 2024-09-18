// Stockage des activités par jour (chargement depuis le LocalStorage si existant)
let activitiesByDay = {
  lundi: [],
  mardi: [],
  mercredi: [],
  jeudi: [],
  vendredi: [],
  samedi: [],
  dimanche: []
};

// Stockage des noms d'activités réutilisables
let activityNames = [];

if (localStorage.getItem('activities')) {
  activitiesByDay = JSON.parse(localStorage.getItem('activities'));
  Object.keys(activitiesByDay).forEach(day => displayActivitiesForDay(day));
}

if (localStorage.getItem('activityNames')) {
  activityNames = JSON.parse(localStorage.getItem('activityNames'));
  populateActivityNames();
}

// Fonction pour ajouter les noms d'activités dans le menu déroulant
function populateActivityNames() {
  const select = document.getElementById('activity-name');
  select.innerHTML = `<option value="" disabled selected>Choisissez ou entrez un nom</option>`;
  activityNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// Fonction pour vérifier si une activité chevauche une autre
function hasOverlap(day, startTime, endTime, excludeActivity = null) {
  return activitiesByDay[day].some(activity => {
    if (excludeActivity && activity === excludeActivity) return false; // Ignorer l'activité en cours de déplacement
    return (startTime < activity.endTime && endTime > activity.startTime);
  });
}

// Gestion de l'affichage de la modale pour ajouter une activité
document.getElementById('add-event').onclick = function () {
  document.getElementById('modal').style.display = 'block'; // Afficher la modale
};

// Fermeture de la modale
document.querySelector('.close').onclick = function () {
  document.getElementById('modal').style.display = 'none'; // Cacher la modale
};

// Fermer la modale si on clique en dehors
window.onclick = function (event) {
  if (event.target == document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
};

// Sauvegarde d'une activité avec gestion de la couleur et ajout du tri par heure de début
document.getElementById('save-event').onclick = function () {
  const select = document.getElementById('activity-name');
  const newActivityName = document.getElementById('new-activity-name').value;

  // Si l'utilisateur a saisi un nouveau nom, on le prend, sinon on prend celui du menu déroulant
  const activityName = newActivityName !== '' ? newActivityName : select.value;

  const activityStartTime = document.getElementById('activity-time-start').value;
  const activityEndTime = document.getElementById('activity-time-end').value;
  const activityColor = document.getElementById('activity-color').value;

  // Sauvegarde des jours sélectionnés
  const selectedDays = Array.from(document.querySelectorAll('#activity-days input:checked')).map(input => input.value);

  // Vérification des champs
  if (activityName && selectedDays.length && activityStartTime && activityEndTime && activityColor) {
    let overlapDetected = false;
    selectedDays.forEach(day => {
      // Vérification du chevauchement
      if (hasOverlap(day, activityStartTime, activityEndTime)) {
        alert(`L'activité pour le ${day} chevauche une autre activité.`);
        overlapDetected = true;
        return;
      }
    });

    // Si aucun chevauchement n'est détecté, ajouter l'activité
    if (!overlapDetected) {
      // Si l'activité est nouvelle, ajouter le nom dans le menu déroulant
      if (newActivityName && !activityNames.includes(newActivityName)) {
        activityNames.push(newActivityName);
        localStorage.setItem('activityNames', JSON.stringify(activityNames));
        populateActivityNames();
      }

      selectedDays.forEach(day => {
        // Ajouter l'activité dans le tableau correspondant au jour
        activitiesByDay[day].push({
          name: activityName,
          startTime: activityStartTime,
          endTime: activityEndTime,
          color: activityColor
        });

        // Trier les activités par heure de début
        activitiesByDay[day].sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });

        // Réafficher les activités triées dans le calendrier
        displayActivitiesForDay(day);
      });

      // Sauvegarder dans le LocalStorage
      localStorage.setItem('activities', JSON.stringify(activitiesByDay));

      // Vider les champs après l'enregistrement
      document.getElementById('new-activity-name').value = ''; // Réinitialiser le champ de nouveau nom
      document.getElementById('activity-time-start').value = '';
      document.getElementById('activity-time-end').value = '';
      document.querySelectorAll('#activity-days input').forEach(input => input.checked = false);
      document.getElementById('modal').style.display = 'none'; // Cacher la modale après l'enregistrement
    }
  } else {
    alert("Veuillez remplir tous les champs.");
  }
};

// Fonction pour démarrer le drag-and-drop
let draggedActivity = null;
let draggedDay = null;

function dragStart(event, day, activity) {
  draggedActivity = activity;
  draggedDay = day;
  event.dataTransfer.setData('text/plain', null); // Nécessaire pour le drag-and-drop dans certains navigateurs
}

document.querySelectorAll('.day').forEach(dayElement => {
  const day = dayElement.dataset.day;

  dayElement.addEventListener('dragover', function (event) {
    event.preventDefault();
  });

  dayElement.addEventListener('drop', function (event) {
    event.preventDefault();
    if (draggedActivity) {
      const activityStartTime = draggedActivity.startTime;
      const activityEndTime = draggedActivity.endTime;

      // Vérification des chevauchements dans le jour cible
      if (hasOverlap(day, activityStartTime, activityEndTime, draggedActivity)) {
        alert("Cette activité chevauche une autre activité sur ce jour.");
        return; // Empêche le déplacement si chevauchement
      }

      // Retirer l'activité de la journée d'origine
      activitiesByDay[draggedDay] = activitiesByDay[draggedDay].filter(a => a !== draggedActivity);

      // Ajouter l'activité à la nouvelle journée
      activitiesByDay[day].push(draggedActivity);

      // Trier les activités dans la nouvelle journée
      activitiesByDay[day].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });

      // Réafficher les activités pour les deux jours
      displayActivitiesForDay(draggedDay);
      displayActivitiesForDay(day);

      // Sauvegarder dans le LocalStorage après le drag-and-drop
      localStorage.setItem('activities', JSON.stringify(activitiesByDay));

      // Réinitialiser le drag
      draggedActivity = null;
      draggedDay = null;
    }
  });
});

// Fonction pour afficher les activités d'un jour dans l'ordre
function displayActivitiesForDay(day) {
  const dayElement = document.querySelector(`.day[data-day=${day}]`);
  dayElement.innerHTML = ''; // Vider le contenu actuel

  // Ajouter chaque activité triée dans l'élément correspondant
  activitiesByDay[day].forEach(activity => {
    const activityDiv = document.createElement('div');
    activityDiv.textContent = `${activity.name} de ${activity.startTime} à ${activity.endTime}`;
    activityDiv.style.backgroundColor = activity.color;
    activityDiv.classList.add('activity');
    activityDiv.setAttribute('draggable', true);

    // Ajout de la gestion du drag-and-drop
    activityDiv.addEventListener('dragstart', function (event) {
      dragStart(event, day, activity);
    });
    dayElement.appendChild(activityDiv);
  });
}

// Fonction pour obtenir le numéro de la semaine
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

// Fonction pour générer les dates de la semaine courante
function getWeekDates() {
  const currentDate = new Date();
  const currentDay = currentDate.getDay() || 7; // Lundi = 1, Dimanche = 7
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - currentDay + 1);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDates.push(day);
  }
  return weekDates;
}

// Affichage des jours avec date et numéro de semaine
function displayWeek() {
  const weekDates = getWeekDates();
  const weekNumber = getWeekNumber(new Date());

  // Affichage du numéro de semaine
  document.getElementById('week-number').textContent = `Semaine ${weekNumber}`;

  // Affichage des dates dans le calendrier
  document.querySelectorAll('.calendar-header div').forEach((header, index) => {
    const date = weekDates[index];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    header.textContent = `${header.textContent.split(' ')[0]} ${day}/${month}`;
  });
}

// Appeler la fonction pour afficher la semaine au chargement
displayWeek();
