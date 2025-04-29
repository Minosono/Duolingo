// script.js
'use strict'; // Strengerer Modus für sichereren Code

document.addEventListener('DOMContentLoaded', () => {
    // --- Elemente holen ---
    const learningPathContainer = document.querySelector('.learning-path');
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
    const clickSound = document.getElementById('click-sound');
    const orientationWarning = document.getElementById('orientation-warning');
    const appContainer = document.getElementById('app-container');
    // const duoCharacter = document.getElementById('duo-character'); // Nicht direkt manipuliert, nur per CSS

    // --- Lektionsdaten (Beispiele - Anpassen!) ---
    const lessonData = {
        lesson1: {
            type: 'dragdrop', title: "Grundschritt lernen", task: "Ordne die Phasen des Grundschritts.",
            images: [ // WICHTIG: Bildpfade hier korrekt angeben!
                { id: 'step1a', src: 'images/step1a.png', correctOrder: 1 },
                { id: 'step1b', src: 'images/step1b.png', correctOrder: 2 },
                { id: 'step1c', src: 'images/step1c.png', correctOrder: 3 },
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
            images: [ // Beispiel-Pfade!
                 { id: 'step2a', src: 'images/step2a.png', correctOrder: 1 }, { id: 'step2b', src: 'images/step2b.png', correctOrder: 2 },
                 { id: 'step2c', src: 'images/step2c.png', correctOrder: 3 }, { id: 'step2d', src: 'images/step2d.png', correctOrder: 4 },
            ], numberOfSteps: 4
        },
        lesson3: {
            type: 'dragdrop', title: "Pose einnehmen", task: "Welche Schritte führen zur Pose?",
            images: [ // Beispiel-Pfade!
                { id: 'step3a', src: 'images/step3a.png', correctOrder: 1 }, { id: 'step3b', src: 'images/step3b.png', correctOrder: 2 },
            ], numberOfSteps: 2
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
    let selectedImageForPlacement = null;
    let completedLessons = [];

    // --- Konstanten für Layout ---
    const LESSON_NODE_HEIGHT = 75 + 4 * 2; // Knotenhöhe + 2*Border
    const CONNECTOR_BASE_HEIGHT = 40;
    const VERTICAL_SPACING = LESSON_NODE_HEIGHT + CONNECTOR_BASE_HEIGHT + 35; // Gesamter vertikaler Abstand (etwas mehr Puffer)
    const HORIZONTAL_WAVE_AMPLITUDE = 60; // Etwas mehr Ausschlag
    const HORIZONTAL_WAVE_LENGTH = 4; // Welle über 4 Nodes

    // --- localStorage Schlüssel ---
    const COMPLETED_LESSONS_KEY = 'tanzAppCompletedLessons_v1'; // Eindeutiger Schlüssel

    // --- Hilfsfunktionen ---
    function playSound(soundElement) {
        if (soundElement && soundElement.readyState >= 2) { // Check if ready
            soundElement.currentTime = 0;
            soundElement.play().catch(error => console.error("Sound play error:", error));
        }
    }

    // --- Initialisierungsfunktionen ---
    function loadCompletedLessons() {
        try {
            const storedData = localStorage.getItem(COMPLETED_LESSONS_KEY);
            completedLessons = storedData ? JSON.parse(storedData) : [];
            applyCompletionStyles();
        } catch (e) {
            console.error("Error loading completed lessons from localStorage:", e);
            completedLessons = []; // Fallback auf leeres Array
        }
    }

    function saveCompletedLesson(lessonId) {
        if (lessonId && !completedLessons.includes(lessonId)) {
            completedLessons.push(lessonId);
            try {
                localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(completedLessons));
                const node = learningPathContainer.querySelector(`.lesson-node[data-lesson-id="${lessonId}"]`);
                if (node) node.classList.add('lesson-completed');
            } catch (e) {
                console.error("Error saving completed lessons to localStorage:", e);
            }
        }
    }

    function applyCompletionStyles() {
        const lessonNodes = learningPathContainer.querySelectorAll('.lesson-node[data-lesson-id]'); // Nur Nodes mit ID
        lessonNodes.forEach(node => {
            const lessonId = node.dataset.lessonId;
            node.classList.remove('lesson-completed'); // Sicherstellen, dass es nicht fälschlicherweise da ist
            if (completedLessons.includes(lessonId)) {
                node.classList.add('lesson-completed');
            }
        });
    }

    function layoutLearningPath() {
        const lessonNodes = Array.from(learningPathContainer.querySelectorAll('.lesson-node'));
        const connectors = Array.from(learningPathContainer.querySelectorAll('.connector'));
        let totalHeight = 0;
        let connectorIndex = 0;

        if (!lessonNodes.length) return; // Nichts tun, wenn keine Nodes da sind

        lessonNodes.forEach((node, index) => {
            const topPosition = index * VERTICAL_SPACING;
            node.style.top = `${topPosition}px`;

            const waveFactor = Math.sin((index / HORIZONTAL_WAVE_LENGTH) * Math.PI * 2 + Math.PI / 2); // Start in Mitte oben
            const horizontalOffset = waveFactor * HORIZONTAL_WAVE_AMPLITUDE;
            const translateXValue = `calc(-50% + ${horizontalOffset}px)`;
            node.style.transform = `translateX(${translateXValue})`;
            node.style.setProperty('--js-translate-x', translateXValue); // Für :hover

            totalHeight = topPosition + LESSON_NODE_HEIGHT;

            if (connectors[connectorIndex] && index < lessonNodes.length - 1) {
                const connector = connectors[connectorIndex];
                const connectorTop = topPosition + LESSON_NODE_HEIGHT - 2; // Knapp unter Node ansetzen
                connector.style.top = `${connectorTop}px`;
                connector.style.height = `${CONNECTOR_BASE_HEIGHT + 7}px`; // Verbinder etwas länger

                const nextNode = lessonNodes[index + 1];
                const nextWaveFactor = Math.sin(((index + 1) / HORIZONTAL_WAVE_LENGTH) * Math.PI * 2 + Math.PI / 2);
                const nextHorizontalOffset = nextWaveFactor * HORIZONTAL_WAVE_AMPLITUDE;
                const avgHorizontalOffset = (horizontalOffset + nextHorizontalOffset) / 2;
                 connector.style.transform = `translateX(calc(-50% + ${avgHorizontalOffset}px))`;

                connectorIndex++;
            } else if (connectors[connectorIndex]) {
                 // Letzten Connector ausblenden oder entfernen
                 connectors[connectorIndex].style.display = 'none';
            }
        });
        learningPathContainer.style.height = `${totalHeight + 50}px`; // Höhe für Scrollbarkeit
    }

    function checkOrientation() {
        // Verwende matchMedia für zuverlässigere Orientierungsprüfung
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        const isWide = window.innerWidth > 768; // Schwellenwert für "breit"

        if (isLandscape && isWide) {
            orientationWarning.classList.remove('hidden');
            appContainer.classList.add('hidden');
        } else {
            orientationWarning.classList.add('hidden');
            appContainer.classList.remove('hidden');
        }
    }

    // --- Event Listener ---
    learningPathContainer.addEventListener('click', (event) => {
        const lessonNode = event.target.closest('.lesson-node:not(.type-trophy)');
        if (lessonNode && !lessonActive) {
             // Optional: Erneutes Spielen erlauben, aber ohne erneutes Speichern?
            // if (completedLessons.includes(lessonNode.dataset.lessonId)) {
            //     console.log("Lektion wird erneut gespielt.");
            // }

            lessonActive = true; // Sofort als aktiv markieren
            currentLessonId = lessonNode.dataset.lessonId;
            const lesson = lessonData[currentLessonId];
            if (lesson) {
                currentLessonType = lesson.type;
                if(currentLessonType === 'quiz'){ currentLessonTotalSteps = lesson.questions.length; }
                else if (currentLessonType === 'dragdrop'){ currentLessonTotalSteps = 1; }
                else { currentLessonTotalSteps = 0; }
                currentQuizQuestionIndex = 0; currentProgress = 0;
                updateProgressBar();
                loadLessonContent();
                openOverlay();
            } else {
                console.error("Lektionsdaten nicht gefunden für:", currentLessonId);
                lessonActive = false; // Zurücksetzen, wenn Laden fehlschlägt
            }
        }
    });

    closeButton.addEventListener('click', closeOverlay);
    checkButton.addEventListener('click', handleCheck);
    window.addEventListener('resize', () => { checkOrientation(); layoutLearningPath(); });
    window.addEventListener('orientationchange', checkOrientation); // Zusätzlich bei Orientierungswechsel

    // --- Overlay Management ---
    function openOverlay() {
        heartCountSpan.innerHTML = '<i class="fas fa-infinity"></i>'; // Oder echte Zahl
        overlay.classList.remove('hidden');
        // Fokus auf Schließen-Button setzen für Zugänglichkeit
        closeButton.focus();
    }

    function closeOverlay() {
        overlay.classList.add('hidden');
        feedbackDiv.classList.remove('visible');
        if (selectedImageForPlacement) {
            selectedImageForPlacement.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
        }
        removeTargetableClassFromPlaceholders();
        // Kurze Verzögerung vor dem Reset, um Transition abzuwarten
        setTimeout(() => {
            resetLessonState();
            lessonActive = false;
        }, 350); // Etwas länger als Transition-Dauer
    }

    // --- Lektionsinhalte & Setups ---
    function loadLessonContent() {
        const data = lessonData[currentLessonId];
        if (!data) return;

        lessonTaskDescription.textContent = data.task || data.title;
        resetInteractionAreas(); // Alte Listener etc. entfernen
        checkButton.disabled = true;
        feedbackDiv.className = 'feedback'; // Nur Basisklassen
        feedbackDiv.classList.remove('visible');

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

    function setupDragDropLesson(data) {
        imageSource.innerHTML = '<p>Verfügbare Schritte:</p>';
        const shuffledImages = [...data.images].sort(() => Math.random() - 0.5);
        shuffledImages.forEach(imgData => {
            const img = createDraggableImage(imgData);
            imageSource.appendChild(img);
        });

        dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>';
        for (let i = 1; i <= data.numberOfSteps; i++) {
            const placeholder = createDropPlaceholder(i);
            dropTargetContainer.appendChild(placeholder);
        }
        addDragAndDropListeners(); // Wichtig: NACH Erstellung der Elemente
    }

    function createDraggableImage(imgData) {
         const img = document.createElement('img');
         img.src = imgData.src;
         img.alt = `Schritt ${imgData.correctOrder}`;
         img.id = imgData.id;
         img.className = 'dance-step-img';
         img.draggable = true;
         img.dataset.correctOrder = imgData.correctOrder;
         img.addEventListener('click', handleSourceImageClick);
         // Touch-Events für grundlegende Mobil-Unterstützung (vereinfacht)
         // img.addEventListener('touchstart', handleTouchStart, { passive: true });
         return img;
    }

    function createDropPlaceholder(order) {
        const placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        placeholder.dataset.order = order;
        placeholder.textContent = order;
        placeholder.addEventListener('click', handlePlaceholderClick);
        // placeholder.addEventListener('touchend', handleTouchEnd);
        return placeholder;
    }

     function setupQuizLesson(data) {
         displayQuizQuestion(data.questions[currentQuizQuestionIndex]);
         checkButton.disabled = true;
     }

     function displayQuizQuestion(questionData) {
         if (!questionData) return;
         quizQuestionText.textContent = questionData.question;
         quizOptionsContainer.innerHTML = '';
         selectedQuizOption = null;

         const shuffledOptions = [...questionData.options].sort(() => Math.random() - 0.5);
         shuffledOptions.forEach(option => {
             const button = document.createElement('button');
             button.type = "button"; // Wichtig für Formularfreiheit
             button.className = 'quiz-option-button';
             button.textContent = option.text;
             button.dataset.correct = option.correct;
             button.addEventListener('click', handleQuizOptionSelect);
             quizOptionsContainer.appendChild(button);
         });
         checkButton.disabled = true;
     }

    // --- Event Handler (Klick, Check, Drag&Drop, Quiz Auswahl) ---

    function handleSourceImageClick(event) {
        const clickedImage = event.target;
        if (!clickedImage.classList.contains('dance-step-img') || !clickedImage.closest('#image-source')) return;

        playSound(clickSound);

        if (selectedImageForPlacement === clickedImage) {
            clickedImage.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
            removeTargetableClassFromPlaceholders();
        } else {
            if (selectedImageForPlacement) {
                selectedImageForPlacement.classList.remove('selected-for-placement');
            }
            clickedImage.classList.add('selected-for-placement');
            selectedImageForPlacement = clickedImage;
            addTargetableClassToEmptyPlaceholders();
        }
    }

    function handlePlaceholderClick(event) {
        const clickedPlaceholder = event.target.closest('.drop-placeholder');
        if (!clickedPlaceholder) return;

        const imageInside = clickedPlaceholder.querySelector('.dance-step-img');

        if (selectedImageForPlacement && !imageInside) { // Platzieren
            playSound(clickSound);
            clickedPlaceholder.innerHTML = '';
            clickedPlaceholder.appendChild(selectedImageForPlacement);
            selectedImageForPlacement.classList.remove('selected-for-placement'); // Wichtig: Hier entfernen!
            selectedImageForPlacement = null;
            removeTargetableClassFromPlaceholders();
            checkButton.disabled = !areAllPlaceholdersFilled();
        } else if (!selectedImageForPlacement && imageInside) { // Zurücklegen
            playSound(clickSound);
            const pTag = imageSource.querySelector('p');
             if(pTag) imageSource.insertBefore(imageInside, pTag.nextSibling);
             else imageSource.appendChild(imageInside); // Fallback
            clickedPlaceholder.innerHTML = clickedPlaceholder.dataset.order;
            checkButton.disabled = true; // Immer deaktivieren beim Zurücklegen
        }
    }

     function handleQuizOptionSelect(event) {
         const selectedButton = event.target;
         if (selectedButton.classList.contains('quiz-option-button') && !selectedButton.disabled) {
             playSound(clickSound);
             if (selectedQuizOption) { selectedQuizOption.classList.remove('selected'); }
             selectedButton.classList.add('selected');
             selectedQuizOption = selectedButton;
             checkButton.disabled = false;
         }
     }

    function handleCheck() {
         if (checkButton.disabled) return; // Zusätzliche Sicherheit

         if (currentLessonType === 'dragdrop') { checkDragDrop(); }
         else if (currentLessonType === 'quiz') { checkQuizAnswer(); }
         // Button wird in der jeweiligen Check-Funktion oder bei Fehler-Reset wieder (de)aktiviert
     }

    // --- Überprüfungslogik ---
     function checkDragDrop() {
        let isCorrect = true;
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        const sourceImages = imageSource.querySelectorAll('.dance-step-img');

        if (placeholders.length === 0 || sourceImages.length > 0) { // Keine Platzhalter oder Bilder übrig
            isCorrect = false;
        } else {
            placeholders.forEach(placeholder => {
                const img = placeholder.querySelector('.dance-step-img');
                const placeholderOrder = parseInt(placeholder.dataset.order, 10);
                if (!img || parseInt(img.dataset.correctOrder, 10) !== placeholderOrder) {
                    isCorrect = false;
                }
            });
        }

        showFeedback(isCorrect);

        if (isCorrect) {
             // Check-Button kurz deaktivieren, während Feedback läuft
             checkButton.disabled = true;
            currentProgress++;
            updateProgressBar();
            saveCompletedLesson(currentLessonId);
            setTimeout(closeOverlay, 1500); // Overlay nach Erfolg schließen
        } else {
            // Check-Button deaktivieren, bis Reset erfolgt ist
             checkButton.disabled = true;
            setTimeout(resetDragDropArea, 1300); // Reset nach falschem Feedback
        }
    }

     function checkQuizAnswer() {
         if (!selectedQuizOption) return;

         const isCorrect = selectedQuizOption.dataset.correct === 'true';
         const allOptionButtons = quizOptionsContainer.querySelectorAll('.quiz-option-button');

         allOptionButtons.forEach(button => {
             button.disabled = true; // Buttons nach Antwort deaktivieren
             button.classList.remove('selected');
             if (button.dataset.correct === 'true') {
                 button.classList.add('correct');
             } else if (button === selectedQuizOption && !isCorrect) {
                 button.classList.add('incorrect');
             }
         });

         showFeedback(isCorrect);
         checkButton.disabled = true; // Check Button nach Prüfung deaktivieren

         if (isCorrect) {
             currentProgress++;
             updateProgressBar();
             currentQuizQuestionIndex++;
             const data = lessonData[currentLessonId];
             if (data && currentQuizQuestionIndex < data.questions.length) {
                 setTimeout(() => {
                     feedbackDiv.classList.remove('visible');
                     displayQuizQuestion(data.questions[currentQuizQuestionIndex]);
                      // Check Button bleibt deaktiviert, bis neue Antwort gewählt wird
                 }, 1800); // Etwas längere Pause
             } else {
                 saveCompletedLesson(currentLessonId);
                 setTimeout(closeOverlay, 1800);
             }
         } else {
             // Bei falscher Antwort: Overlay bleibt offen, User muss schließen
         }
     }

    // --- Feedback & Zustand ---
    function showFeedback(isCorrect) {
        feedbackDiv.textContent = isCorrect ? 'Sehr gut!' : 'Das ist nicht ganz richtig.';
        feedbackDiv.className = 'feedback';
        feedbackDiv.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
        feedbackDiv.classList.add('visible');
        playSound(isCorrect ? correctSound : incorrectSound);
    }

    function updateProgressBar() {
        const percentage = currentLessonTotalSteps > 0 ? (currentProgress / currentLessonTotalSteps) * 100 : 0;
        progressBarInner.style.width = `${Math.max(5, percentage)}%`; // Minimum 5% sichtbar
    }

    function resetDragDropArea() {
        feedbackDiv.classList.remove('visible');
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        const pTagSource = imageSource.querySelector('p');

        placeholders.forEach(p => {
            const img = p.querySelector('.dance-step-img');
            if (img) {
                if(pTagSource) imageSource.insertBefore(img, pTagSource.nextSibling);
                else imageSource.appendChild(img);
            }
            p.innerHTML = p.dataset.order;
        });

        checkButton.disabled = true; // Bleibt deaktiviert bis neu angeordnet

        if (selectedImageForPlacement) {
            selectedImageForPlacement.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
        }
        removeTargetableClassFromPlaceholders();
    }

     function addTargetableClassToEmptyPlaceholders() {
        dropTargetContainer.querySelectorAll('.drop-placeholder').forEach(p => {
            p.classList.toggle('targetable', !p.querySelector('.dance-step-img'));
        });
    }

     function removeTargetableClassFromPlaceholders() {
        dropTargetContainer.querySelectorAll('.drop-placeholder.targetable').forEach(p => {
            p.classList.remove('targetable');
        });
    }

    function areAllPlaceholdersFilled() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        if (placeholders.length === 0) return false;
        return Array.from(placeholders).every(p => p.querySelector('.dance-step-img'));
    }

    function resetLessonState() {
        resetInteractionAreas(); // Räumt Listener und Inhalte auf
        currentLessonId = null; currentLessonType = null; currentQuizQuestionIndex = 0;
        selectedQuizOption = null; draggedItem = null; selectedImageForPlacement = null;
        currentProgress = 0; currentLessonTotalSteps = 0;
        feedbackDiv.className = 'feedback'; feedbackDiv.classList.remove('visible');
        progressBarInner.style.width = '0%';
        checkButton.disabled = true;
        // lessonActive wird in closeOverlay nach Timeout zurückgesetzt
    }

    function resetInteractionAreas() {
         removeDragAndDropListeners(); // Entfernt D&D *und* Klick-Listener
         imageSource.innerHTML = '<p>Verfügbare Schritte:</p>';
         dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>';
         quizQuestionText.textContent = '';
         quizOptionsContainer.innerHTML = '';
         dragArea.classList.add('hidden');
         quizArea.classList.add('hidden');
    }

    // --- Drag & Drop Listener Management ---
    // Globale Referenzen für Listener, um sie sicher entfernen zu können
    const dragStartHandler = (event) => { /*...*/ }; // Platzhalter für Implementierung
    const dragEndHandler = () => { /*...*/ };
    const dragOverHandler = (event) => { /*...*/ };
    const dragLeaveHandler = (event) => { /*...*/ };
    const dropHandler = (event) => { /*...*/ };

    function addDragAndDropListeners() {
        removeDragAndDropListeners(); // WICHTIG: Immer zuerst alte entfernen

        currentDraggables = Array.from(imageSource.querySelectorAll('.dance-step-img'));
        currentDraggables.forEach(draggable => {
            draggable.addEventListener('dragstart', dragStart);
            draggable.addEventListener('dragend', dragEnd);
            // Klick-Listener werden schon in createDraggableImage hinzugefügt
        });

        currentDropzones = Array.from(dropTargetContainer.querySelectorAll('.drop-placeholder'));
        const allZones = [...currentDropzones, sourceZone];
        allZones.forEach(zone => {
            zone.addEventListener('dragover', dragOver);
            zone.addEventListener('dragleave', dragLeave);
            zone.addEventListener('drop', drop);
             // Klick-Listener werden schon in createDropPlaceholder hinzugefügt
        });
    }

     // Angepasste remove Funktion
    function removeDragAndDropListeners() {
        // Listener von Bildern entfernen
        const sourceImages = imageSource.querySelectorAll('.dance-step-img');
        sourceImages.forEach(img => {
            img.removeEventListener('dragstart', dragStart);
            img.removeEventListener('dragend', dragEnd);
             img.removeEventListener('click', handleSourceImageClick); // Klick auch weg
        });

         // Listener von Placeholder entfernen
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        placeholders.forEach(p => {
            p.removeEventListener('dragover', dragOver);
            p.removeEventListener('dragleave', dragLeave);
            p.removeEventListener('drop', drop);
             p.removeEventListener('click', handlePlaceholderClick); // Klick auch weg
        });

         // Listener von Source Zone (nur Drag-bezogen)
        sourceZone.removeEventListener('dragover', dragOver);
        sourceZone.removeEventListener('dragleave', dragLeave);
        sourceZone.removeEventListener('drop', drop);

         // Referenzen im Skript zurücksetzen (optional, aber sauber)
         currentDraggables = [];
         currentDropzones = [];
     }

     // Implementiere die D&D Handler hier... (bleiben inhaltlich wie vorherige Version)
     function dragStart(event) {
         if (selectedImageForPlacement) {
             selectedImageForPlacement.classList.remove('selected-for-placement');
             selectedImageForPlacement = null; removeTargetableClassFromPlaceholders();
         }
         draggedItem = event.target;
         event.dataTransfer.effectAllowed = 'move';
         event.dataTransfer.setData('text/plain', event.target.id);
         setTimeout(() => { if (draggedItem) draggedItem.classList.add('dragging'); }, 0);
     }
     function dragEnd() {
         if (draggedItem) draggedItem.classList.remove('dragging');
         const allZones = [...dropTargetContainer.querySelectorAll('.drop-placeholder'), sourceZone];
         allZones.forEach(zone => zone.classList.remove('drag-over'));
         draggedItem = null;
     }
      function dragOver(event) {
         event.preventDefault();
         const targetPotential = event.target;
         const targetZone = targetPotential.closest('.drop-placeholder, #image-source');
         if (!targetZone || !draggedItem) return; // Nur wenn etwas gezogen wird

          const allZones = [...dropTargetContainer.querySelectorAll('.drop-placeholder'), sourceZone];
          allZones.forEach(zone => { if(zone !== targetZone) zone.classList.remove('drag-over');});

          // Highlight nur, wenn Droppen gültig ist (leerer Placeholder oder Source)
         if (targetZone.classList.contains('drop-placeholder')) {
             if(!targetZone.querySelector('.dance-step-img')) { targetZone.classList.add('drag-over'); }
         } else if (targetZone.id === 'image-source') {
              targetZone.classList.add('drag-over');
         }
      }
     function dragLeave(event) {
        const zone = event.target.closest('.drop-placeholder, #image-source');
         // Prüfen, ob die Maus wirklich die Zone verlässt
        if(zone && (!event.relatedTarget || !zone.contains(event.relatedTarget))) {
             zone.classList.remove('drag-over');
        }
     }
     function drop(event) {
         event.preventDefault();
         const targetZone = event.target.closest('.drop-placeholder, #image-source');
         if (targetZone && draggedItem) {
             targetZone.classList.remove('drag-over');

             if (targetZone.classList.contains('drop-placeholder')) {
                 if (!targetZone.querySelector('.dance-step-img')) {
                     targetZone.innerHTML = ''; targetZone.appendChild(draggedItem);
                     checkButton.disabled = !areAllPlaceholdersFilled();
                 }
             } else if (targetZone.id === 'image-source') {
                 const pTag = targetZone.querySelector('p');
                  if (pTag) targetZone.insertBefore(draggedItem, pTag.nextSibling);
                  else targetZone.appendChild(draggedItem); // Fallback
                 checkButton.disabled = true;
             }
             // draggedItem wird in dragEnd() zurückgesetzt
         }
     }

    // --- Initialisierung beim Laden ---
    console.log("App initializing...");
    checkOrientation();
    loadCompletedLessons();
    layoutLearningPath();
    resetLessonState(); // Initialen Zustand sicherstellen
    console.log("App ready.");
});
