// Stockage des activités par date (chargement depuis le LocalStorage si existant)
let activitiesByDate = JSON.parse(localStorage.getItem('activitiesByDate')) || {};
let activityNames = JSON.parse(localStorage.getItem('activityNames')) || [];
let activityLogs = JSON.parse(localStorage.getItem('activityLogs')) || [];
let timerInterval;
let timeRemaining;
let currentWeekOffset = 0; // Par défaut, affiche la semaine courante

// Population des activités existantes dans le menu déroulant
function populateActivityNames() {
  const select = document.getElementById('activity-name-existing');
  select.innerHTML = `<option value="" disabled selected>Choisissez ou entrez un nom</option>`;
  activityNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// Affichage de la modale
document.getElementById('add-event').onclick = function () {
  document.getElementById('modal').style.display = 'block'; // Afficher la modale
  populateActivityNames(); // Remplir le menu déroulant avec les activités existantes
};

document.querySelector('.close').onclick = function () {
  document.getElementById('modal').style.display = 'none'; // Cacher la modale
};

window.onclick = function (event) {
  if (event.target == document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
};

// Sauvegarde d'une activité avec gestion de la couleur et des dates
document.getElementById('save-event').onclick = function () {
  const activityName = document.getElementById('new-activity-name').value.trim();
  const selectedExistingActivity = document.getElementById('activity-name-existing').value;

  const finalActivityName = activityName !== '' ? activityName : selectedExistingActivity;

  const activityStartTime = document.getElementById('activity-time-start').value;
  const activityEndTime = document.getElementById('activity-time-end').value;
  const activityColor = document.getElementById('activity-color').value;
  const activityStartDate = document.getElementById('activity-start-date').value;
  const activityEndDate = document.getElementById('activity-end-date').value;

  if (!finalActivityName || !activityStartTime || !activityEndTime || !activityColor || !activityStartDate || !activityEndDate) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  // Ajout d'un nouveau nom d'activité à la liste
  if (activityName && !activityNames.includes(activityName)) {
    activityNames.push(activityName);
    localStorage.setItem('activityNames', JSON.stringify(activityNames));
  }

  const startDate = new Date(activityStartDate);
  const endDate = new Date(activityEndDate);
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const formattedDate = currentDate.toISOString().split('T')[0]; // Format YYYY-MM-DD

    if (!activitiesByDate[formattedDate]) {
      activitiesByDate[formattedDate] = [];
    }

    activitiesByDate[formattedDate].push({
      name: finalActivityName,
      startTime: activityStartTime,
      endTime: activityEndTime,
      color: activityColor
    });

    // Avancer d'un jour
    currentDate.setDate(currentDate.getDate() + 1);
  }

  localStorage.setItem('activitiesByDate', JSON.stringify(activitiesByDate));

  // Vider les champs après l'enregistrement
  document.getElementById('new-activity-name').value = '';
  document.getElementById('activity-time-start').value = '';
  document.getElementById('activity-time-end').value = '';
  document.getElementById('activity-start-date').value = '';
  document.getElementById('activity-end-date').value = '';
  document.getElementById('modal').style.display = 'none';

  // Actualiser l'affichage du calendrier
  displayWeek(currentWeekOffset); // Actualise la semaine courante après ajout
};

// Fonction pour afficher les activités pour la semaine courante et future
function displayWeek(weekOffset = 0) {
  const weekDates = getWeekDates(weekOffset); // Obtenir les dates de la semaine courante avec offset
  const calendarBody = document.querySelector('.calendar-body');
  const weekNumber = getWeekNumber(new Date(), weekOffset);

  calendarBody.innerHTML = ''; // Vider l'ancien contenu
  document.getElementById('week-number').textContent = `Semaine ${weekNumber}`;

  weekDates.forEach(date => {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');
    dayElement.dataset.date = date.toISOString().split('T')[0]; // Format YYYY-MM-DD

    // Afficher la date dans le header correctement
    const formattedDate = date.toISOString().split('T')[0];
    const header = document.querySelector(`.calendar-header div:nth-child(${(date.getDay() || 7)})`);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    header.textContent = `${header.textContent.split(' ')[0]} ${day}/${month}`;

    if (activitiesByDate[formattedDate]) {
      activitiesByDate[formattedDate].forEach((activity, index) => {
        const activityDiv = document.createElement('div');
        activityDiv.textContent = `${activity.name} de ${activity.startTime} à ${activity.endTime}`;
        activityDiv.style.backgroundColor = activity.color;
        activityDiv.classList.add('activity');

        // Ajout du bouton "Démarrer"
        const startButton = document.createElement('button');
        startButton.textContent = 'Démarrer';
        startButton.onclick = function () {
          startTimer(activity, formattedDate, index);
        };

        // Ajout du bouton "Supprimer"
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.classList.add('delete-button');
        deleteButton.onclick = function () {
          deleteActivity(formattedDate, index);
        };

        // Ajouter les boutons à l'activité
        activityDiv.appendChild(startButton);
        activityDiv.appendChild(deleteButton);
        dayElement.appendChild(activityDiv);
      });
    }

    calendarBody.appendChild(dayElement);
  });
}

// Fonction pour obtenir les dates de la semaine courante ou future
function getWeekDates(weekOffset = 0) {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + (weekOffset * 7)); // Décale la semaine si nécessaire
  const currentDay = currentDate.getDay() || 7; // Dimanche = 0, donc on utilise 7
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - currentDay + 1); // Corriger le décalage des dates

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDates.push(day);
  }
  return weekDates;
}

// Gestion du Timer avec pause et reprise
function startTimer(activity, date, index) {
  clearInterval(timerInterval);

  const now = new Date(); // Heure actuelle
  const startTime = new Date(); // Début réel de l'activité
  const endTime = new Date(); // Fin de l'activité

  const [startHour, startMinute] = activity.startTime.split(':');
  const [endHour, endMinute] = activity.endTime.split(':');

  startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
  endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1); // Gestion des activités qui se terminent après minuit
  }

  timeRemaining = endTime - now;

  if (isNaN(timeRemaining) || timeRemaining <= 0) {
    alert("L'activité est déjà terminée ou a une durée incorrecte !");
    deleteActivity(date, index);
    return;
  }

  const originalDuration = endTime - startTime; // Durée programmée
  const actualStartTime = new Date(); // Moment où l'utilisateur commence l'activité

  showTimer(timeRemaining);

  timerInterval = setInterval(() => {
    timeRemaining -= 1000;

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      const actualEndTime = new Date();
      const timeSpent = actualEndTime - actualStartTime; // Temps réellement passé

      // Sauvegarde dans le tableau des logs
      activityLogs.push({
        name: activity.name,
        originalDuration: originalDuration,
        timeSpent: timeSpent
      });

      // Met à jour le LocalStorage
      localStorage.setItem('activityLogs', JSON.stringify(activityLogs));

      alert(`L'activité "${activity.name}" est terminée !`);
      playSound();
      deleteActivity(date, index);
    } else {
      showTimer(timeRemaining);
    }
  }, 1000);
}

// Fonction pour afficher le timer
function showTimer(timeRemaining) {
  const timerDisplay = document.getElementById('timer-display');

  if (!timerDisplay) {
    const newTimerDisplay = document.createElement('div');
    newTimerDisplay.id = 'timer-display';
    document.body.appendChild(newTimerDisplay);
  }

  const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
  const seconds = Math.floor((timeRemaining / 1000) % 60);
  document.getElementById('timer-display').textContent = `${hours}h ${minutes}m ${seconds}s`;
}

// Fonction pour supprimer une activité
function deleteActivity(date, index) {
  activitiesByDate[date].splice(index, 1);
  localStorage.setItem('activitiesByDate', JSON.stringify(activitiesByDate));
  displayWeek(currentWeekOffset); // Actualise l'affichage après suppression
}

function playSound() {
  const audio = new Audio('path/to/sound.mp3');
  audio.play();
}

// Afficher le numéro de la semaine avec offset
function displayWeekNumber(weekOffset = 0) {
  const weekNumber = getWeekNumber(new Date(), weekOffset);
  document.getElementById('week-number').textContent = `Semaine ${weekNumber}`;
}

// Calculer le numéro de la semaine avec offset
function getWeekNumber(date, weekOffset = 0) {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + (weekOffset * 7)); // Ajuster la date pour la semaine future
  const firstDayOfYear = new Date(adjustedDate.getFullYear(), 0, 1);
  const pastDaysOfYear = (adjustedDate - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Initialiser l'affichage de la semaine courante
displayWeekNumber(currentWeekOffset);
displayWeek(currentWeekOffset);

// Navigation entre semaines
document.getElementById('next-week').addEventListener('click', () => {
  currentWeekOffset++;
  displayWeek(currentWeekOffset); // Affiche la semaine suivante
  displayWeekNumber(currentWeekOffset); // Met à jour le numéro de semaine
});

document.getElementById('previous-week').addEventListener('click', () => {
  currentWeekOffset--;
  displayWeek(currentWeekOffset); // Affiche la semaine précédente
  displayWeekNumber(currentWeekOffset); // Met à jour le numéro de semaine
});
