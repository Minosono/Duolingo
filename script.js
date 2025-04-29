document.addEventListener('DOMContentLoaded', () => {
    // --- Elemente holen (wie vorher) ---
    const learningPathContainer = document.querySelector('.learning-path'); // Container
    const overlay = document.getElementById('lesson-overlay');
    const closeButton = overlay.querySelector('.close-button');
    const checkButton = document.getElementById('check-button');
    const feedbackDiv = document.getElementById('feedback');
    const lessonTaskDescription = document.getElementById('lesson-task-description');
    const progressBarInner = overlay.querySelector('.progress-bar-inner');
    const heartCountSpan = overlay.querySelector('.heart-count');
    const dragArea = document.getElementById('drag-area');
    const imageSource = document.getElementById('image-source');
    const dropTargetContainer = document.getElementById('drop-target');
    const quizArea = document.getElementById('quiz-area');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsContainer = document.getElementById('quiz-options');
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');
    const clickSound = document.getElementById('click-sound'); // Neuer Sound
    const orientationWarning = document.getElementById('orientation-warning');
    const appContainer = document.getElementById('app-container');
    const duoCharacter = document.getElementById('duo-character'); // Charakter-Div

    // --- Lektionsdaten (wie vorher) ---
    const lessonData = {
        // ... (Inhalt von lessonData bleibt gleich) ...
        lesson1: {
            type: 'dragdrop', title: "Grundschritt lernen", task: "Ordne die Phasen des Grundschritts.",
            images: [
                { id: 'step1a', src: 'images/step1a.png', correctOrder: 1 }, { id: 'step1b', src: 'images/step1b.png', correctOrder: 2 }, { id: 'step1c', src: 'images/step1c.png', correctOrder: 3 },
            ], numberOfSteps: 3
        },
        lessonQuiz1: {
            type: 'quiz', title: "Theorie-Check", task: "Beantworte die Frage:",
            questions: [
                { question: "Welcher Takt ist typisch für Walzer?", options: [ { text: "4/4 Takt", correct: false }, { text: "3/4 Takt", correct: true }, { text: "2/4 Takt", correct: false } ] },
                { question: "Wie nennt man die Standard-Tanzhaltung?", options: [ { text: "Offene Haltung", correct: false }, { text: "Promenadenposition", correct: false }, { text: "Geschlossene Haltung", correct: true } ] }
            ]
        },
        lesson2: {
            type: 'dragdrop', title: "Drehung üben", task: "Sortiere die Schritte der Drehung.",
            images: [
                 { id: 'step2a', src: 'images/step2a.png', correctOrder: 1 }, { id: 'step2b', src: 'images/step2b.png', correctOrder: 2 }, { id: 'step2c', src: 'images/step2c.png', correctOrder: 3 }, { id: 'step2d', src: 'images/step2d.png', correctOrder: 4 },
            ], numberOfSteps: 4
        },
         lesson3: {
            type: 'dragdrop', title: "Pose einnehmen", task: "Welche Schritte führen zur Pose?",
            images: [ { id: 'step3a', src: 'images/step3a.png', correctOrder: 1 }, { id: 'step3b', src: 'images/step3b.png', correctOrder: 2 }, ], numberOfSteps: 2
        },
         lessonQuiz2: {
             type: 'quiz', title: "Rhythmus-Quiz", task: "Teste dein Rhythmusgefühl!",
             questions: [
                 { question: "Zähle den Cha-Cha-Cha Grundrhythmus:", options: [ { text: "Lang, Lang, Schnell-Schnell", correct: false }, { text: "Schnell, Schnell, Lang, Lang", correct: false }, { text: "2, 3, Cha-Cha-Cha (4 und 1)", correct: true }, { text: "Lang, Schnell, Schnell, Lang", correct: false } ] },
                  { question: "Welcher Tanz hat einen 'Slow, Quick, Quick' Rhythmus?", options: [ { text: "Samba", correct: false }, { text: "Foxtrott", correct: true }, { text: "Jive", correct: false } ] }
             ]
         }
    };

    // --- Zustandsvariablen ---
    let currentLessonId = null;
    let currentLessonType = null;
    let currentQuizQuestionIndex = 0;
    let currentLessonTotalSteps = 0;
    let currentProgress = 0;
    let selectedQuizOption = null;
    let lessonActive = false;
    let draggedItem = null;
    let selectedImageForPlacement = null; // NEU: Für Klick-Platzierung
    let completedLessons = []; // NEU: Für abgeschlossene Lektionen

    // --- Konstanten für Layout ---
    const LESSON_NODE_HEIGHT = 95; // Höhe eines Knotens (inkl. Border/Padding)
    const CONNECTOR_BASE_HEIGHT = 40; // Basis-Höhe des Verbinders
    const VERTICAL_SPACING = LESSON_NODE_HEIGHT + CONNECTOR_BASE_HEIGHT + 20; // Gesamter vertikaler Abstand
    const HORIZONTAL_WAVE_AMPLITUDE = 50; // Wie weit die Welle ausschlägt (px)
    const HORIZONTAL_WAVE_LENGTH = 4; // Nach wie vielen Nodes die Welle wiederholt

    // --- localStorage Schlüssel ---
    const COMPLETED_LESSONS_KEY = 'tanzAppCompletedLessons';

    // --- Initialisierungsfunktionen ---

    // Lädt erledigte Lektionen aus localStorage
    function loadCompletedLessons() {
        const storedData = localStorage.getItem(COMPLETED_LESSONS_KEY);
        completedLessons = storedData ? JSON.parse(storedData) : [];
        applyCompletionStyles();
    }

    // Speichert eine Lektion als erledigt
    function saveCompletedLesson(lessonId) {
        if (lessonId && !completedLessons.includes(lessonId)) {
            completedLessons.push(lessonId);
            localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(completedLessons));
             // Direkt Stil anwenden, falls der Node sichtbar ist
             const node = learningPathContainer.querySelector(`.lesson-node[data-lesson-id="${lessonId}"]`);
             if (node) {
                node.classList.add('lesson-completed');
             }
        }
    }

    // Wendet 'lesson-completed' Klasse auf Nodes an
    function applyCompletionStyles() {
        const lessonNodes = learningPathContainer.querySelectorAll('.lesson-node');
        lessonNodes.forEach(node => {
            const lessonId = node.dataset.lessonId;
             // Entferne zuerst, falls Klasse schon da war (zur Sicherheit)
             node.classList.remove('lesson-completed');
            if (lessonId && completedLessons.includes(lessonId)) {
                 // Trophäen bekommen auch die Klasse, aber kein Icon (CSS Regel)
                node.classList.add('lesson-completed');
            }
        });
    }

    // Dynamisches Layout für den Lernpfad (Schlangenlinie)
    function layoutLearningPath() {
        const lessonNodes = Array.from(learningPathContainer.querySelectorAll('.lesson-node'));
        const connectors = Array.from(learningPathContainer.querySelectorAll('.connector'));
        let totalHeight = 0;
        let connectorIndex = 0;

        lessonNodes.forEach((node, index) => {
            // Vertikale Position
            const topPosition = index * VERTICAL_SPACING;
            node.style.top = `${topPosition}px`;

            // Horizontale Position (Welle)
            const waveFactor = Math.sin((index / HORIZONTAL_WAVE_LENGTH) * Math.PI * 2); // Sinus für Welle
            const horizontalOffset = waveFactor * HORIZONTAL_WAVE_AMPLITUDE;
            node.style.transform = `translateX(calc(-50% + ${horizontalOffset}px))`;

            totalHeight = topPosition + LESSON_NODE_HEIGHT; // Höhe aktualisieren

             // Positioniere den Verbinder *unterhalb* dieses Knotens (falls vorhanden)
             if (connectors[connectorIndex] && index < lessonNodes.length -1) {
                const connector = connectors[connectorIndex];
                const connectorTop = topPosition + LESSON_NODE_HEIGHT + 5; // Start unter dem Node
                connector.style.top = `${connectorTop}px`;
                connector.style.height = `${CONNECTOR_BASE_HEIGHT}px`; // Feste Höhe vorerst
                 // Horizontale Position des Connectors anpassen, zwischen den Nodes
                const nextNode = lessonNodes[index + 1];
                 if(nextNode){
                     const nextWaveFactor = Math.sin(((index + 1) / HORIZONTAL_WAVE_LENGTH) * Math.PI * 2);
                     const nextHorizontalOffset = nextWaveFactor * HORIZONTAL_WAVE_AMPLITUDE;
                     // Mittelwert der Offsets für den Verbinder
                     const avgHorizontalOffset = (horizontalOffset + nextHorizontalOffset) / 2;
                      connector.style.transform = `translateX(calc(-50% + ${avgHorizontalOffset}px))`;
                 } else {
                     connector.style.transform = `translateX(calc(-50% + ${horizontalOffset}px))`; // Am letzten orientieren
                 }


                connectorIndex++;
            }
        });

        // Setze die Gesamthöhe des Containers, damit gescrollt werden kann
        learningPathContainer.style.height = `${totalHeight + 50}px`; // Extra Platz am Ende
    }

    // --- Orientierungs-Check (wie vorher) ---
    function checkOrientation() { /* ... bleibt gleich ... */
         if (window.innerHeight < window.innerWidth && window.innerWidth > 768) {
            orientationWarning.classList.remove('hidden');
            appContainer.classList.add('hidden');
        } else {
            orientationWarning.classList.add('hidden');
            appContainer.classList.remove('hidden');
        }
    }

    // --- Event Listener ---
    // Lektionen anklicken (wie vorher, aber checkt lessonActive)
    learningPathContainer.addEventListener('click', (event) => {
        const lessonNode = event.target.closest('.lesson-node:not(.type-trophy)');
        if (lessonNode && !lessonActive) { // Nur starten, wenn keine Lektion aktiv ist
             if (completedLessons.includes(lessonNode.dataset.lessonId)) {
                  console.log("Lektion bereits abgeschlossen."); // Optional: Feedback oder erneutes Spielen erlauben?
                 // return; // Verhindert Start, wenn erledigt. Auskommentieren, um erneutes Spielen zu erlauben.
             }

            lessonActive = true;
            currentLessonId = lessonNode.dataset.lessonId;
            const lesson = lessonData[currentLessonId];
            if (lesson) {
                 currentLessonType = lesson.type;
                 // Reset und Lade Logik (wie vorher)
                if(currentLessonType === 'quiz'){ currentLessonTotalSteps = lesson.questions.length; }
                else if (currentLessonType === 'dragdrop'){ currentLessonTotalSteps = 1; }
                else { currentLessonTotalSteps = 0; }
                currentQuizQuestionIndex = 0;
                currentProgress = 0;
                updateProgressBar();
                loadLessonContent();
                openOverlay();
            } else { console.error("Lektionsdaten nicht gefunden:", currentLessonId); lessonActive = false; }
        }
    });

    // Overlay schließen (wie vorher, aber setzt Click-Auswahl zurück)
    closeButton.addEventListener('click', closeOverlay);

    // Überprüfen-Button (Handler bleibt gleich)
    checkButton.addEventListener('click', handleCheck);

    // Fenstergröße ändern (wie vorher)
    window.addEventListener('resize', () => {
        checkOrientation();
         layoutLearningPath(); // Neu layouten bei Resize
    });

    // --- Click-to-Place Listener ---
    // Hinzugefügt in setupDragDropLesson

    // --- Overlay öffnen/schließen (wie vorher) ---
    function openOverlay() { /* ... bleibt gleich ... */
        heartCountSpan.innerHTML = '<i class="fas fa-infinity"></i>';
        overlay.classList.remove('hidden');
     }
    function closeOverlay() { /* ... Modifiziert ... */
        overlay.classList.add('hidden');
        feedbackDiv.classList.remove('visible');
         // Auswahl zurücksetzen
         if (selectedImageForPlacement) {
            selectedImageForPlacement.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
         }
         removeTargetableClassFromPlaceholders(); // Highlight von Zielen entfernen
        setTimeout(() => {
            resetLessonState();
            lessonActive = false;
        }, 300);
    }

    // --- Lektionsinhalt laden (wie vorher) ---
    function loadLessonContent() { /* ... bleibt gleich ... */
         const data = lessonData[currentLessonId];
        if (!data) return;

        lessonTaskDescription.textContent = data.task || data.title;
        resetInteractionAreas();
        checkButton.disabled = true;
        feedbackDiv.classList.remove('visible');
        feedbackDiv.className = 'feedback';

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

    // --- Drag & Drop Lektion vorbereiten (ERWEITERT für Click-to-Place) ---
    function setupDragDropLesson(data) {
        // ... (Bilderquelle und Platzhalter generieren wie vorher) ...
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
            // NEU: Click Listener für Bildauswahl
            img.addEventListener('click', handleSourceImageClick);
            imageSource.appendChild(img);
        });

        // Drop-Ziel-Platzhalter generieren
        dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>'; // Leeren
        for (let i = 1; i <= data.numberOfSteps; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'drop-placeholder';
            placeholder.dataset.order = i;
            placeholder.textContent = i;
            // NEU: Click Listener für Platzhalter-Ziel
            placeholder.addEventListener('click', handlePlaceholderClick);
            dropTargetContainer.appendChild(placeholder);
        }

        addDragAndDropListeners(); // Fügt auch die Drag-Listener hinzu
    }

    // --- Quiz Lektion vorbereiten (wie vorher) ---
    function setupQuizLesson(data) { /* ... bleibt gleich ... */
        displayQuizQuestion(data.questions[currentQuizQuestionIndex]);
         checkButton.disabled = true;
    }

    // --- Quiz Frage anzeigen (wie vorher) ---
    function displayQuizQuestion(questionData) { /* ... bleibt gleich ... */
        if (!questionData) return;
        quizQuestionText.textContent = questionData.question;
        quizOptionsContainer.innerHTML = '';
        selectedQuizOption = null;
        const shuffledOptions = [...questionData.options].sort(() => Math.random() - 0.5);
         shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.className = 'quiz-option-button';
            button.textContent = option.text;
            button.dataset.correct = option.correct;
            button.addEventListener('click', handleQuizOptionSelect);
            quizOptionsContainer.appendChild(button);
        });
        checkButton.disabled = true;
    }

    // --- Quiz Option auswählen (wie vorher) ---
    function handleQuizOptionSelect(event) { /* ... bleibt gleich ... */
         const selectedButton = event.target;
         if (selectedQuizOption) { selectedQuizOption.classList.remove('selected'); }
         selectedButton.classList.add('selected');
         selectedQuizOption = selectedButton;
         checkButton.disabled = false;
    }

    // --- NEU: Handler für Klick auf Quell-Bild ---
    function handleSourceImageClick(event) {
        const clickedImage = event.target;
         // Nur reagieren, wenn das Bild in der Quelle ist
        if (!clickedImage.closest('#image-source')) return;

         try { clickSound.play().catch(e => {}); } catch(e) {} // Klick-Sound

        // Wenn bereits dieses Bild ausgewählt war -> Auswahl aufheben
        if (selectedImageForPlacement === clickedImage) {
            clickedImage.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
            removeTargetableClassFromPlaceholders(); // Ziele nicht mehr hervorheben
        } else {
            // Anderes Bild war ausgewählt -> Alte Auswahl aufheben
            if (selectedImageForPlacement) {
                selectedImageForPlacement.classList.remove('selected-for-placement');
            }
            // Neues Bild auswählen
            clickedImage.classList.add('selected-for-placement');
            selectedImageForPlacement = clickedImage;
            addTargetableClassToEmptyPlaceholders(); // Leere Ziele hervorheben
        }
    }

     // --- NEU: Handler für Klick auf Platzhalter ---
    function handlePlaceholderClick(event) {
        const clickedPlaceholder = event.target.closest('.drop-placeholder');
        if (!clickedPlaceholder) return;

         // Nur reagieren, wenn ein Bild ausgewählt IST und der Platzhalter LEER ist
        if (selectedImageForPlacement && !clickedPlaceholder.querySelector('.dance-step-img')) {
             try { clickSound.play().catch(e => {}); } catch(e) {} // Klick-Sound

             // Bild in Platzhalter verschieben
            clickedPlaceholder.innerHTML = ''; // Nummer entfernen
            clickedPlaceholder.appendChild(selectedImageForPlacement);

            // Auswahl aufheben
            selectedImageForPlacement.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
            removeTargetableClassFromPlaceholders();

            // Check-Button Status aktualisieren
            checkButton.disabled = !areAllPlaceholdersFilled();
        }
         // Optional: Wenn ein Bild im Placeholder angeklickt wird -> zurück in Quelle?
         else if (!selectedImageForPlacement && clickedPlaceholder.querySelector('.dance-step-img')) {
            const imageInPlaceholder = clickedPlaceholder.querySelector('.dance-step-img');
             try { clickSound.play().catch(e => {}); } catch(e) {}

             // Bild zurück zur Quelle
            const pTag = imageSource.querySelector('p');
            imageSource.insertBefore(imageInPlaceholder, pTag.nextSibling);

             // Placeholder zurücksetzen
             clickedPlaceholder.innerHTML = clickedPlaceholder.dataset.order; // Nummer wiederherstellen

             checkButton.disabled = true; // Check nicht mehr möglich
         }
    }

    // --- NEU: Hilfsfunktionen für Klick-Platzierung ---
    function addTargetableClassToEmptyPlaceholders() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        placeholders.forEach(p => {
            if (!p.querySelector('.dance-step-img')) {
                p.classList.add('targetable');
            } else {
                 p.classList.remove('targetable'); // Sicherstellen, dass belegte nicht targetable sind
            }
        });
    }
    function removeTargetableClassFromPlaceholders() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        placeholders.forEach(p => p.classList.remove('targetable'));
    }

    // --- Handler für "Überprüfen" Button (wie vorher) ---
    function handleCheck() { /* ... bleibt gleich ... */
         if (currentLessonType === 'dragdrop') { checkDragDrop(); }
         else if (currentLessonType === 'quiz') { checkQuizAnswer(); }
         checkButton.disabled = true;
    }

    // --- Drag & Drop Überprüfung (MODIFIZIERT für Reset bei Fehler) ---
    function checkDragDrop() {
        const data = lessonData[currentLessonId];
        if (!data) return;
        let isCorrect = true;
        // ... (Überprüfungslogik wie vorher) ...
         const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
         if (placeholders.length !== data.numberOfSteps) { isCorrect = false; }
         else {
             placeholders.forEach(placeholder => {
                 const img = placeholder.querySelector('.dance-step-img');
                 const placeholderOrder = parseInt(placeholder.dataset.order, 10);
                 if (!img || parseInt(img.dataset.correctOrder, 10) !== placeholderOrder) { isCorrect = false; }
             });
             if (imageSource.querySelectorAll('.dance-step-img').length > 0){ isCorrect = false; }
         }

        showFeedback(isCorrect); // Feedback anzeigen (ruft auch Sound auf)

        if (isCorrect) {
            currentProgress++;
            updateProgressBar();
            saveCompletedLesson(currentLessonId); // NEU: Als erledigt speichern
            setTimeout(closeOverlay, 1500);
        } else {
            // NEU: Bei Fehler -> Reset nach kurzer Anzeige
            setTimeout(resetDragDropArea, 1200); // 1.2 Sekunden warten
        }
    }

    // --- NEU: Funktion zum Zurücksetzen des Drag&Drop-Bereichs ---
    function resetDragDropArea() {
        feedbackDiv.classList.remove('visible'); // Feedback wieder ausblenden
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        const pTagSource = imageSource.querySelector('p');

        placeholders.forEach(p => {
            const img = p.querySelector('.dance-step-img');
            if (img) {
                // Bild zurück zur Quelle bewegen
                 imageSource.insertBefore(img, pTagSource.nextSibling);
            }
             // Platzhalter Text wiederherstellen
            p.innerHTML = p.dataset.order;
        });

         // Check-Button wieder deaktivieren
         checkButton.disabled = true;

         // Falls ein Bild per Klick ausgewählt war, Auswahl aufheben
         if (selectedImageForPlacement) {
            selectedImageForPlacement.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
         }
         removeTargetableClassFromPlaceholders();
    }

    // --- Quiz Antwort überprüfen (MODIFIZIERT für Speichern bei Erfolg) ---
    function checkQuizAnswer() {
        if (!selectedQuizOption) return;
        const isCorrect = selectedQuizOption.dataset.correct === 'true';
         // ... (Button Feedback wie vorher) ...
         const allOptionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-button');
         allOptionButtons.forEach(button => {
             button.disabled = true;
             button.classList.remove('selected');
             if (button.dataset.correct === 'true') { button.classList.add('correct'); }
             else if (button === selectedQuizOption && !isCorrect) { button.classList.add('incorrect'); }
         });

        showFeedback(isCorrect);

        if (isCorrect) {
            currentProgress++;
            updateProgressBar();
            currentQuizQuestionIndex++;
            const data = lessonData[currentLessonId];
            if (currentQuizQuestionIndex < data.questions.length) {
                setTimeout(() => {
                    feedbackDiv.classList.remove('visible');
                    displayQuizQuestion(data.questions[currentQuizQuestionIndex]);
                }, 1500);
            } else {
                saveCompletedLesson(currentLessonId); // NEU: Als erledigt speichern (am Ende)
                setTimeout(closeOverlay, 1500);
            }
        } else {
            // Bei falscher Quiz-Antwort: Hier nichts resetten, User muss schließen oder es neu versuchen
            // (Könnte man ändern, z.B. Herzen abziehen und Frage wiederholen)
        }
    }

    // --- Feedback anzeigen und Sound spielen (wie vorher) ---
    function showFeedback(isCorrect) { /* ... bleibt gleich ... */
        feedbackDiv.textContent = isCorrect ? 'Sehr gut!' : 'Das ist nicht ganz richtig.';
        feedbackDiv.className = 'feedback'; // Reset
        feedbackDiv.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
        feedbackDiv.classList.add('visible');
         try {
             if (isCorrect) { correctSound.play().catch(e => {}); }
             else { incorrectSound.play().catch(e => {}); }
         } catch (error) { console.error("Sound Fehler:", error); }
     }

    // --- Fortschrittsbalken aktualisieren (wie vorher) ---
    function updateProgressBar() { /* ... bleibt gleich ... */
        const percentage = currentLessonTotalSteps > 0 ? (currentProgress / currentLessonTotalSteps) * 100 : 0;
         progressBarInner.style.width = `${Math.max(10, percentage)}%`;
    }

    // --- Lektionszustand zurücksetzen (wie vorher) ---
    function resetLessonState() { /* ... bleibt gleich ... */
         resetInteractionAreas();
        currentLessonId = null; currentLessonType = null; currentQuizQuestionIndex = 0;
        selectedQuizOption = null; draggedItem = null; selectedImageForPlacement = null; // Click-Auswahl zurücksetzen
        feedbackDiv.className = 'feedback'; feedbackDiv.classList.remove('visible');
        progressBarInner.style.width = '0%'; checkButton.disabled = true;
        lessonActive = false;
    }

    // --- Interaktionsbereiche leeren (wie vorher) ---
    function resetInteractionAreas() { /* ... bleibt gleich ... */
        imageSource.innerHTML = '<p>Verfügbare Schritte:</p>';
        dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>';
        removeDragAndDropListeners();
        quizQuestionText.textContent = '';
        quizOptionsContainer.innerHTML = '';
        dragArea.classList.add('hidden');
        quizArea.classList.add('hidden');
    }

    // --- Drag & Drop Event Listener (wie vorher, Co-Existenz mit Klick) ---
    // dragStart, dragEnd, dragOver, dragLeave, drop Funktionen bleiben weitgehend gleich
    let currentDraggables = [];
    let currentDropzones = [];
    const sourceZone = imageSource;

     function dragStart(event) {
         // Wenn ein Bild per Klick ausgewählt ist, Auswahl aufheben beim Ziehen
         if (selectedImageForPlacement) {
             selectedImageForPlacement.classList.remove('selected-for-placement');
             selectedImageForPlacement = null;
             removeTargetableClassFromPlaceholders();
         }

         draggedItem = event.target;
         event.dataTransfer.setData('text/plain', event.target.id);
         setTimeout(() => { if (draggedItem) draggedItem.classList.add('dragging'); }, 0);
     }
     function dragEnd() {
         if (draggedItem) { draggedItem.classList.remove('dragging'); }
          const allZones = [...dropTargetContainer.querySelectorAll('.drop-placeholder'), sourceZone];
          allZones.forEach(zone => zone.classList.remove('drag-over'));
          draggedItem = null;
     }
      function dragOver(event) {
         event.preventDefault();
         const targetPotential = event.target;
         const targetZone = targetPotential.closest('.drop-placeholder, #image-source');
         if (!targetZone) return;

         // Highlight entfernen von allen anderen
          const allZones = [...dropTargetContainer.querySelectorAll('.drop-placeholder'), sourceZone];
          allZones.forEach(zone => { if(zone !== targetZone) zone.classList.remove('drag-over');});

         // Highlight auf Ziel setzen (wenn es leer ist oder die Quelle)
         if (targetZone.classList.contains('drop-placeholder')) {
            if(!targetZone.querySelector('.dance-step-img')) { // Nur leere hervorheben
                 targetZone.classList.add('drag-over');
            }
         } else if (targetZone.id === 'image-source') {
              targetZone.classList.add('drag-over');
         }

     }
      function dragLeave(event) {
        const zone = event.target.closest('.drop-placeholder, #image-source');
        if(zone && !zone.contains(event.relatedTarget)) { // Verlassen wenn Maus wirklich raus geht
             zone.classList.remove('drag-over');
        }
      }

     function drop(event) {
         event.preventDefault();
         const targetZone = event.target.closest('.drop-placeholder, #image-source');
         if (targetZone && draggedItem) {
             targetZone.classList.remove('drag-over');

             if (targetZone.classList.contains('drop-placeholder')) {
                 if (!targetZone.querySelector('.dance-step-img')) { // Nur in leere droppen
                     targetZone.innerHTML = '';
                     targetZone.appendChild(draggedItem);
                     checkButton.disabled = !areAllPlaceholdersFilled();
                 }
             } else if (targetZone.id === 'image-source') {
                 const pTag = targetZone.querySelector('p');
                 targetZone.insertBefore(draggedItem, pTag.nextSibling);
                 checkButton.disabled = true;
             }
         }
     }
    // Hilfsfunktion areAllPlaceholdersFilled bleibt gleich
     function areAllPlaceholdersFilled() { /* ... bleibt gleich ... */
         const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
         if (placeholders.length === 0) return false;
         return Array.from(placeholders).every(p => p.querySelector('.dance-step-img'));
     }

    function addDragAndDropListeners() { /* ... (wie vorher, aber selektiert Elemente neu) ... */
         removeDragAndDropListeners(); // Alte entfernen!

         currentDraggables = Array.from(imageSource.querySelectorAll('.dance-step-img'));
         currentDropzones = Array.from(dropTargetContainer.querySelectorAll('.drop-placeholder'));

         currentDraggables.forEach(draggable => {
             draggable.addEventListener('dragstart', dragStart);
             draggable.addEventListener('dragend', dragEnd);
         });

         const allZones = [...currentDropzones, sourceZone];
         allZones.forEach(zone => {
             zone.addEventListener('dragover', dragOver);
             zone.addEventListener('dragleave', dragLeave);
             zone.addEventListener('drop', drop);
         });
    }
     function removeDragAndDropListeners() { /* ... (wie vorher) ... */
          // Entfernt Listener von currentDraggables und currentDropzones + sourceZone
          currentDraggables.forEach(draggable => {
             draggable.removeEventListener('dragstart', dragStart);
             draggable.removeEventListener('dragend', dragEnd);
              draggable.removeEventListener('click', handleSourceImageClick); // Auch Klick-Listener entfernen
         });
         const allZones = [...currentDropzones, sourceZone];
         allZones.forEach(zone => {
             zone.removeEventListener('dragover', dragOver);
             zone.removeEventListener('dragleave', dragLeave);
             zone.removeEventListener('drop', drop);
              zone.removeEventListener('click', handlePlaceholderClick); // Klick-Listener von Platzhaltern entfernen
         });
         currentDraggables = [];
         currentDropzones = []; // Wichtig: Arrays leeren
     }

    // --- Initialisierung ---
    checkOrientation();
    loadCompletedLessons(); // Erledigte Lektionen laden
    layoutLearningPath();   // Lernpfad layouten
    resetLessonState();

});
