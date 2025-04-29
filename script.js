document.addEventListener('DOMContentLoaded', () => {
    // Elemente holen
    const learningPath = document.querySelector('.learning-path');
    const overlay = document.getElementById('lesson-overlay');
    const closeButton = overlay.querySelector('.close-button');
    const checkButton = document.getElementById('check-button');
    const feedbackDiv = document.getElementById('feedback');
    const lessonTaskDescription = document.getElementById('lesson-task-description');
    const progressBarInner = overlay.querySelector('.progress-bar-inner');
    const heartCountSpan = overlay.querySelector('.heart-count');

    // Lektionsbereiche holen
    const dragArea = document.getElementById('drag-area');
    const imageSource = document.getElementById('image-source');
    const dropTargetContainer = document.getElementById('drop-target'); // Container für Placeholder

    const quizArea = document.getElementById('quiz-area');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsContainer = document.getElementById('quiz-options');

    // Audio Elemente
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');

    // Orientierungs-Warnung
    const orientationWarning = document.getElementById('orientation-warning');
    const appContainer = document.getElementById('app-container');

    // --- Lektionsdaten (erweitert) ---
    const lessonData = {
        lesson1: {
            type: 'dragdrop', // Typ explizit machen
            title: "Grundschritt lernen",
            task: "Ordne die Phasen des Grundschritts.",
            images: [
                { id: 'step1a', src: 'images/step1a.png', correctOrder: 1 },
                { id: 'step1b', src: 'images/step1b.png', correctOrder: 2 },
                { id: 'step1c', src: 'images/step1c.png', correctOrder: 3 },
            ],
            numberOfSteps: 3 // = Anzahl der Platzhalter
        },
        lessonQuiz1: {
            type: 'quiz',
            title: "Theorie-Check",
            task: "Beantworte die Frage:",
            questions: [ // Array für mehrere Fragen pro Quiz
                {
                    question: "Welcher Takt ist typisch für Walzer?",
                    options: [
                        { text: "4/4 Takt", correct: false },
                        { text: "3/4 Takt", correct: true },
                        { text: "2/4 Takt", correct: false }
                    ]
                },
                {
                    question: "Wie nennt man die Standard-Tanzhaltung?",
                    options: [
                        { text: "Offene Haltung", correct: false },
                        { text: "Promenadenposition", correct: false },
                        { text: "Geschlossene Haltung", correct: true }
                    ]
                }
            ]
        },
        lesson2: {
            type: 'dragdrop',
            title: "Drehung üben",
            task: "Sortiere die Schritte der Drehung.",
            images: [
                { id: 'step2a', src: 'images/step2a.png', correctOrder: 1 },
                { id: 'step2b', src: 'images/step2b.png', correctOrder: 2 },
                { id: 'step2c', src: 'images/step2c.png', correctOrder: 3 },
                { id: 'step2d', src: 'images/step2d.png', correctOrder: 4 },
            ],
            numberOfSteps: 4
        },
        // lesson3 kann bleiben wie bisher oder angepasst werden
        lesson3: {
            type: 'dragdrop',
             title: "Pose einnehmen",
             task: "Welche Schritte führen zur Pose?",
             images: [
                 { id: 'step3a', src: 'images/step3a.png', correctOrder: 1 },
                 { id: 'step3b', src: 'images/step3b.png', correctOrder: 2 },
             ],
             numberOfSteps: 2
        },
         lessonQuiz2: {
             type: 'quiz',
             title: "Rhythmus-Quiz",
             task: "Teste dein Rhythmusgefühl!",
             questions: [
                 {
                     question: "Zähle den Cha-Cha-Cha Grundrhythmus:",
                     options: [
                         { text: "Lang, Lang, Schnell-Schnell", correct: false },
                         { text: "Schnell, Schnell, Lang, Lang", correct: false },
                         { text: "2, 3, Cha-Cha-Cha (4 und 1)", correct: true },
                         { text: "Lang, Schnell, Schnell, Lang", correct: false }
                     ]
                 },
                  {
                    question: "Welcher Tanz hat einen 'Slow, Quick, Quick' Rhythmus?",
                    options: [
                        { text: "Samba", correct: false },
                        { text: "Foxtrott", correct: true },
                        { text: "Jive", correct: false }
                    ]
                }
                // Füge weitere Fragen hinzu
             ]
         }
        // Füge hier Daten für weitere Lektionen hinzu...
    };

    // Zustand der aktuellen Lektion
    let currentLessonId = null;
    let currentLessonType = null;
    let currentQuizQuestionIndex = 0;
    let currentLessonTotalSteps = 0; // Für Fortschrittsbalken
    let currentProgress = 0;
    let selectedQuizOption = null; // Button, der im Quiz gewählt wurde
    let lessonActive = false; // Verhindert doppeltes Öffnen

    // --- Drag & Drop Zustand ---
    let draggedItem = null;

    // --- Orientierungs-Check ---
    function checkOrientation() {
        if (window.innerHeight < window.innerWidth && window.innerWidth > 768) { // Landscape auf breiter als typisches Tablet
            orientationWarning.classList.remove('hidden');
            appContainer.classList.add('hidden'); // Haupt-App ausblenden
        } else {
            orientationWarning.classList.add('hidden');
            appContainer.classList.remove('hidden'); // Haupt-App anzeigen
        }
    }

    // --- Event Listener ---

    // Lektionen im Lernpfad anklicken
    learningPath.addEventListener('click', (event) => {
        const lessonNode = event.target.closest('.lesson-node:not(.type-trophy)'); // Trophäen nicht klickbar
        if (lessonNode && !lessonActive) {
            lessonActive = true;
            currentLessonId = lessonNode.dataset.lessonId;
            const lesson = lessonData[currentLessonId];
            if (lesson) {
                 currentLessonType = lesson.type;
                 // Bestimme Gesamtschritte für Fortschrittsbalken
                 if(currentLessonType === 'quiz'){
                    currentLessonTotalSteps = lesson.questions.length;
                 } else if (currentLessonType === 'dragdrop'){
                     currentLessonTotalSteps = 1; // DragDrop zählt als ein Schritt
                 } else {
                     currentLessonTotalSteps = 0;
                 }
                 currentQuizQuestionIndex = 0; // Reset für Quiz
                 currentProgress = 0; // Reset für Fortschritt
                 updateProgressBar(); // Auf 0 setzen
                 loadLessonContent();
                 openOverlay();
            } else {
                 console.error("Lektionsdaten nicht gefunden für:", currentLessonId);
                 lessonActive = false;
            }
        }
    });

    // Overlay schließen
    closeButton.addEventListener('click', closeOverlay);
    // Klick ausserhalb des Contents schliesst nicht (im Gegensatz zu vorher)

    // Überprüfen-Button
    checkButton.addEventListener('click', handleCheck);

    // Fenstergröße ändern (für Orientierung)
    window.addEventListener('resize', checkOrientation);

    // --- Overlay öffnen / schließen ---
    function openOverlay() {
        // Setze "unendlich" Herzen oder eine Zahl (hier hardcoded für Demo)
        heartCountSpan.innerHTML = '<i class="fas fa-infinity"></i>'; // Oder z.B. '5'
        overlay.classList.remove('hidden');
    }

    function closeOverlay() {
        overlay.classList.add('hidden');
        feedbackDiv.classList.remove('visible'); // Feedback ausblenden
        // Reset nach Schließen, damit es sauber ist beim nächsten Öffnen
        setTimeout(() => { // Kleine Verzögerung, damit Ausblenden fertig ist
            resetLessonState();
             lessonActive = false;
        }, 300); // Muss zur CSS transition passen
    }

    // --- Lektionsinhalt laden ---
    function loadLessonContent() {
        const data = lessonData[currentLessonId];
        if (!data) return;

        lessonTaskDescription.textContent = data.task || data.title; // Aufgabenstellung oder Titel anzeigen
        resetInteractionAreas(); // Alte Inhalte/Listener löschen
        checkButton.disabled = true; // Erst aktivieren, wenn interagiert wurde
        feedbackDiv.classList.remove('visible');
        feedbackDiv.className = 'feedback'; // Nur Basisklasse

        // Je nach Lektionstyp den richtigen Bereich anzeigen und befüllen
        if (currentLessonType === 'dragdrop') {
            dragArea.classList.remove('hidden');
            quizArea.classList.add('hidden');
            setupDragDropLesson(data);
        } else if (currentLessonType === 'quiz') {
            dragArea.classList.add('hidden');
            quizArea.classList.remove('hidden');
            setupQuizLesson(data);
        }
    }

    // --- Drag & Drop Lektion vorbereiten ---
    function setupDragDropLesson(data) {
        // Bilderquelle (gemischt)
        imageSource.innerHTML = '<p>Verfügbare Schritte:</p>'; // Leeren
        const shuffledImages = [...data.images].sort(() => Math.random() - 0.5);
        shuffledImages.forEach(imgData => {
            const img = document.createElement('img');
            img.src = imgData.src;
            img.alt = `Schritt ${imgData.correctOrder}`;
            img.id = imgData.id;
            img.className = 'dance-step-img';
            img.draggable = true;
            img.dataset.correctOrder = imgData.correctOrder;
            imageSource.appendChild(img);
        });

        // Drop-Ziel-Platzhalter generieren
        dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>'; // Leeren
        for (let i = 1; i <= data.numberOfSteps; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'drop-placeholder';
            placeholder.dataset.order = i;
            placeholder.textContent = i; // Nummer anzeigen
            dropTargetContainer.appendChild(placeholder);
        }

        addDragAndDropListeners();
    }

     // --- Quiz Lektion vorbereiten ---
    function setupQuizLesson(data) {
         displayQuizQuestion(data.questions[currentQuizQuestionIndex]);
         checkButton.disabled = true; // Deaktivieren, bis eine Option gewählt wird
    }

     // --- Quiz Frage anzeigen ---
    function displayQuizQuestion(questionData) {
         if (!questionData) {
             console.error("Keine Quizfrage gefunden für Index:", currentQuizQuestionIndex);
             // Vielleicht Lektion beendet? Hier könnte man eine Zusammenfassung zeigen.
             return;
         }
         quizQuestionText.textContent = questionData.question;
         quizOptionsContainer.innerHTML = ''; // Alte Optionen entfernen
         selectedQuizOption = null; // Auswahl zurücksetzen

         // Optionen mischen (optional, aber besser für's Lernen)
         const shuffledOptions = [...questionData.options].sort(() => Math.random() - 0.5);

         shuffledOptions.forEach(option => {
             const button = document.createElement('button');
             button.className = 'quiz-option-button';
             button.textContent = option.text;
             // Wichtig: Information speichern, ob die Option korrekt ist
             button.dataset.correct = option.correct;
             button.addEventListener('click', handleQuizOptionSelect);
             quizOptionsContainer.appendChild(button);
         });
         checkButton.disabled = true; // Erneut deaktivieren für neue Frage
     }

    // --- Quiz Option auswählen ---
    function handleQuizOptionSelect(event) {
        const selectedButton = event.target;

        // Alte Auswahl deselektieren
         if (selectedQuizOption) {
             selectedQuizOption.classList.remove('selected');
         }

         // Neue Auswahl markieren
         selectedButton.classList.add('selected');
         selectedQuizOption = selectedButton;

         checkButton.disabled = false; // Button aktivieren
         // Optional: Sound für Klick spielen
    }


    // --- Handler für "Überprüfen" Button ---
    function handleCheck() {
         if (currentLessonType === 'dragdrop') {
             checkDragDrop();
         } else if (currentLessonType === 'quiz') {
             checkQuizAnswer();
         }
         checkButton.disabled = true; // Nach dem Check wieder deaktivieren
     }

     // --- Drag & Drop Überprüfung ---
     function checkDragDrop() {
         const data = lessonData[currentLessonId];
         if (!data) return;

         let isCorrect = true;
         const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');

         if (placeholders.length !== data.numberOfSteps) {
              console.error("Anzahl der Platzhalter stimmt nicht überein!");
              isCorrect = false;
         } else {
             placeholders.forEach(placeholder => {
                 const img = placeholder.querySelector('.dance-step-img');
                 const placeholderOrder = parseInt(placeholder.dataset.order, 10);

                 if (!img || parseInt(img.dataset.correctOrder, 10) !== placeholderOrder) {
                     isCorrect = false;
                 }
             });
             // Prüfen, ob auch alle Bilder verwendet wurden (keine mehr in der Source sind)
             if (imageSource.querySelectorAll('.dance-step-img').length > 0){
                 isCorrect = false;
             }
         }


         showFeedback(isCorrect);

         if (isCorrect) {
             currentProgress++;
             updateProgressBar();
             // Drag&Drop ist oft nur 1 Schritt, daher hier direkt zum Schließen
             setTimeout(closeOverlay, 1500);
         } else {
            // Optional: Fehlerhafte Elemente hervorheben
         }
     }

     // --- Quiz Antwort überprüfen ---
    function checkQuizAnswer() {
         if (!selectedQuizOption) return; // Sollte nicht passieren, da Button deaktiviert ist

        const isCorrect = selectedQuizOption.dataset.correct === 'true';
        const allOptionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-button');

        // Visuelles Feedback auf Buttons geben
         allOptionButtons.forEach(button => {
             button.disabled = true; // Keine weiteren Klicks zulassen
             button.classList.remove('selected'); // Auswahl-Markierung entfernen
             if (button.dataset.correct === 'true') {
                 button.classList.add('correct'); // Korrekte Antwort grün markieren
             } else if (button === selectedQuizOption && !isCorrect) {
                 button.classList.add('incorrect'); // Falsch gewählte Antwort rot markieren
             }
         });


        showFeedback(isCorrect);

         if (isCorrect) {
             currentProgress++;
             updateProgressBar();
             // Nächste Frage laden oder Lektion beenden
             currentQuizQuestionIndex++;
             const data = lessonData[currentLessonId];
             if (currentQuizQuestionIndex < data.questions.length) {
                 // Kurze Pause, dann nächste Frage
                 setTimeout(() => {
                      feedbackDiv.classList.remove('visible'); // Feedback ausblenden
                     displayQuizQuestion(data.questions[currentQuizQuestionIndex]);
                 }, 1500); // Wartezeit nach korrektem Feedback
             } else {
                 // Lektion abgeschlossen
                 setTimeout(closeOverlay, 1500); // Schließe nach letzter Frage
             }
         } else {
             // Optional: Herzen abziehen etc.
             // Hier: Nur Feedback anzeigen, User muss Lektion evtl. neu starten oder korrigieren (je nach Design)
             // Fürs erste: Nichts tun, Feedback bleibt sichtbar, bis geschlossen wird.
         }
    }

    // --- Feedback anzeigen und Sound spielen ---
    function showFeedback(isCorrect) {
        feedbackDiv.textContent = isCorrect ? 'Sehr gut!' : 'Das ist nicht ganz richtig.';
        feedbackDiv.className = 'feedback'; // Reset
        feedbackDiv.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
        feedbackDiv.classList.add('visible'); // Sichtbar machen

         // Passenden Sound abspielen
         try {
             if (isCorrect) {
                correctSound.currentTime = 0; // Zurückspulen falls noch spielt
                correctSound.play();
             } else {
                incorrectSound.currentTime = 0;
                incorrectSound.play();
             }
         } catch (error) {
             console.error("Fehler beim Abspielen des Sounds:", error);
             // Oft auf Mobilgeräten: Nutzerinteraktion nötig, bevor Sound geht
         }
    }

    // --- Fortschrittsbalken aktualisieren ---
    function updateProgressBar() {
         const percentage = currentLessonTotalSteps > 0 ? (currentProgress / currentLessonTotalSteps) * 100 : 0;
         progressBarInner.style.width = `${Math.max(10, percentage)}%`; // Mind. 10% damit man was sieht
    }


    // --- Lektionszustand zurücksetzen ---
    function resetLessonState() {
        resetInteractionAreas();
        currentLessonId = null;
        currentLessonType = null;
        currentQuizQuestionIndex = 0;
        selectedQuizOption = null;
        feedbackDiv.className = 'feedback';
        feedbackDiv.classList.remove('visible');
        progressBarInner.style.width = '0%';
        checkButton.disabled = true;
        lessonActive = false; // Wichtig
    }

    // --- Interaktionsbereiche leeren ---
    function resetInteractionAreas() {
        // Drag&Drop Bereich
        imageSource.innerHTML = '<p>Verfügbare Schritte:</p>';
        dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>';
        removeDragAndDropListeners(); // Alte Listener sicher entfernen

        // Quiz Bereich
        quizQuestionText.textContent = '';
        quizOptionsContainer.innerHTML = '';

        // Bereiche wieder verstecken
        dragArea.classList.add('hidden');
        quizArea.classList.add('hidden');
    }


    // --- Drag & Drop Event Listener hinzufügen / entfernen ---
    // (Etwas komplexer wegen dynamischer Elemente und cleanup)
    let currentDraggables = [];
    let currentDropzones = [];
    const sourceZone = imageSource; // Die Quellzone ist auch ein Dropzone

     function dragStart(event) {
        draggedItem = event.target;
        event.dataTransfer.setData('text/plain', event.target.id);
         // Verzögertes Styling, um Drag-Effekt zu ermöglichen
        setTimeout(() => {
            if (draggedItem) draggedItem.classList.add('dragging');
        }, 0);
     }

    function dragEnd() {
         if (draggedItem) {
            draggedItem.classList.remove('dragging');
         }
         // Alle drag-over Effekte entfernen, falls hängen geblieben
          currentDropzones.forEach(zone => zone.classList.remove('drag-over'));
          sourceZone.classList.remove('drag-over'); // Auch Quelle zurücksetzen
          draggedItem = null;
     }


     function dragOver(event) {
         event.preventDefault(); // Erlaubt das Droppen
         const targetZone = event.target.closest('.drop-placeholder, #image-source');
         if (targetZone && targetZone.classList.contains('drop-placeholder')) {
            // Alte Highlights entfernen und neues setzen
            currentDropzones.forEach(zone => zone.classList.remove('drag-over'));
            targetZone.classList.add('drag-over');
         } else if (targetZone && targetZone.id === 'image-source') {
            // Highlight für Quellzone (optional)
             currentDropzones.forEach(zone => zone.classList.remove('drag-over')); // Andere deselektieren
             targetZone.classList.add('drag-over');
         }
     }

    function dragLeave(event) {
        // Nur Highlight entfernen, wenn man das Element *verlässt*
        // Dies wird komplexer bei verschachtelten Elementen, dragOver ist oft robuster
        const relatedTarget = event.relatedTarget;
        const targetZone = event.target.closest('.drop-placeholder, #image-source');

        // Wenn die Maus zu einem Element außerhalb der Zone oder keinem gültigen Ziel geht
        if (targetZone && (!relatedTarget || !targetZone.contains(relatedTarget))) {
            targetZone.classList.remove('drag-over');
        }
    }


    function drop(event) {
        event.preventDefault();
        const targetZone = event.target.closest('.drop-placeholder, #image-source');

        if (targetZone && draggedItem) {
            targetZone.classList.remove('drag-over'); // Highlight weg

            if (targetZone.classList.contains('drop-placeholder')) {
                // Nur ein Element pro Platzhalter erlauben
                if (!targetZone.querySelector('.dance-step-img')) {
                    targetZone.innerHTML = ''; // Nummer entfernen
                    targetZone.appendChild(draggedItem);
                    checkButton.disabled = !areAllPlaceholdersFilled(); // Check-Button ggf. aktivieren
                } else {
                    // Platzhalter schon belegt, nichts tun oder Item zurückschicken?
                    // Einfachste Variante: nichts tun. Das Element bleibt, wo es war.
                    console.log("Platzhalter belegt.");
                 }
            } else if (targetZone.id === 'image-source') {
                // Zurück zur Quelle legen
                 const pTag = targetZone.querySelector('p');
                 targetZone.insertBefore(draggedItem, pTag.nextSibling); // Nach dem p-Tag
                 checkButton.disabled = true; // Wenn etwas zurückgelegt wird, kann nicht mehr korrekt sein
            }
        }
        // dragEnd() wird automatisch aufgerufen und räumt auf.
    }

    // Hilfsfunktion: Prüft, ob alle Drop-Zonen gefüllt sind
    function areAllPlaceholdersFilled() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        if (placeholders.length === 0) return false; // Keine Plaetzhalter da
        let allFilled = true;
        placeholders.forEach(p => {
            if (!p.querySelector('.dance-step-img')) {
                allFilled = false;
            }
        });
        return allFilled;
    }


    function addDragAndDropListeners() {
         removeDragAndDropListeners(); // Sicherstellen, dass keine alten Listener da sind

         currentDraggables = Array.from(imageSource.querySelectorAll('.dance-step-img'));
         currentDropzones = Array.from(dropTargetContainer.querySelectorAll('.drop-placeholder'));

         currentDraggables.forEach(draggable => {
             draggable.addEventListener('dragstart', dragStart);
             draggable.addEventListener('dragend', dragEnd); // Wichtig zum Aufräumen
         });

        // Event Listener für Drop Zones (Platzhalter + Quelle)
        const allZones = [...currentDropzones, sourceZone];
         allZones.forEach(zone => {
             zone.addEventListener('dragover', dragOver);
             zone.addEventListener('dragleave', dragLeave); // Kann problematisch sein, siehe oben
             zone.addEventListener('drop', drop);
         });
    }

    function removeDragAndDropListeners() {
        // Alte Listener entfernen (wichtig bei dynamischer Generierung!)
        currentDraggables.forEach(draggable => {
             draggable.removeEventListener('dragstart', dragStart);
              draggable.removeEventListener('dragend', dragEnd);
         });
         const allZones = [...currentDropzones, sourceZone];
         allZones.forEach(zone => {
             zone.removeEventListener('dragover', dragOver);
             zone.removeEventListener('dragleave', dragLeave);
             zone.removeEventListener('drop', drop);
         });
         currentDraggables = [];
         currentDropzones = [];
    }


    // --- Initialisierung ---
    checkOrientation(); // Beim Laden prüfen
    resetLessonState(); // Sicherstellen, dass alles sauber ist

});
