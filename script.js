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
            type: 'dragdrop', title: "Achterrümschritt Grundform", task: "Ordne die Phasen des Grundschritts.",
            images: [ // WICHTIG: Bildpfade hier korrekt angeben!
                { id: 'step1a', src: 'images/step1a.png', correctOrder: 1 },
                { id: 'step1b', src: 'images/step1b.png', correctOrder: 2 },
                { id: 'step1c', src: 'images/step1c.png', correctOrder: 3 },
                { id: 'step1d', src: 'images/step1d.png', correctOrder: 4 },
            ], numberOfSteps: 4
        },
        lessonQuiz1: {
            type: 'quiz', title: "Theorie-Check", task: "Beantworte die Frage:",
            questions: [
                { question: "Von wo haben die Niederländer den Tanz geklaut?", options: [ { text: "Schottland", correct: false }, { text: "Timbuktu", correct: false }, { text: "Deutschland", correct: true } ] },
                { question: "Warum wurde dieser Tanz getanzt?", options: [ { text: "Bei Geburtstagen", correct: false }, { text: "Zum Abschied der Seemänner", correct: false }, { text: "Zum Willkommen heißen der Seemänner", correct: true } ] }
            ]
        },
        lesson2: {
            type: 'dragdrop', title: "Achterrümschritt mit Hüpfschwung", task: "Sortiere die Schritte des Schrittes.",
            images: [ // Beispiel-Pfade!
                 { id: 'step2a', src: 'images/step2a.png', correctOrder: 1 }, { id: 'step2b', src: 'images/step2b.png', correctOrder: 2 },
                 { id: 'step2c', src: 'images/step2c.png', correctOrder: 3 }, { id: 'step2d', src: 'images/step2d.png', correctOrder: 4 },
            ], numberOfSteps: 4
        },
        lesson3: {
            type: 'dragdrop', title: "Ritornell", task: "Welche Schritte führen zum Ritornell?",
            images: [ // Beispiel-Pfade!
                { id: 'step3a', src: 'images/step3a.png', correctOrder: 1 }, { id: 'step3b', src: 'images/step3b.png', correctOrder: 2 },{ id: 'step3c', src: 'images/step3c.png', correctOrder: 3 },
            ], numberOfSteps: 3
        },
        lessonQuiz2: {
             type: 'quiz', title: "Fakten-Quiz", task: "Teste dein Wissen!",
             questions: [
                 { question: "Wie viele Personen stehen traditionell in einer Reihe?", options: [ { text: "1 Person", correct: false }, { text: "2 Personen", correct: false }, { text: "3 Personen", correct: true }, { text: "4 Personen", correct: false } ] },
                  { question: "Welche Kleidung wird traditionell beim Tanz getragen?", options: [ { text: "Kurze Hose und Hut", correct: false }, { text: "Lange Schürtze und Trachtenhut", correct: true }, { text: "Lackschuhe und Strohhut", correct: false } ] }
             ]
         }
        // Füge hier ggf. Daten für 'unit1Trophy' hinzu, falls nötig
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
    const sourceZone = imageSource; // Definieren der Quellzone
    let currentDraggables = [];     // Initialisieren als leere Arrays
    let currentDropzones = [];

    // --- Konstanten für Layout ---
    const LESSON_NODE_HEIGHT = 75 + 4 * 2; // Knotenhöhe + 2*Border
    const CONNECTOR_BASE_HEIGHT = 40;
    const VERTICAL_SPACING = LESSON_NODE_HEIGHT + CONNECTOR_BASE_HEIGHT + 35; // Gesamter vertikaler Abstand
    const HORIZONTAL_WAVE_AMPLITUDE_BASE = 60; // Base amplitude for desktop
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
            // Exclude trophies from being saved as 'completable' lessons
            const node = learningPathContainer.querySelector(`.lesson-node[data-lesson-id="${lessonId}"]`);
            if (node && !node.classList.contains('type-trophy')) {
                completedLessons.push(lessonId);
                try {
                    localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(completedLessons));
                    if (node) node.classList.add('lesson-completed');
                } catch (e) {
                    console.error("Error saving completed lessons to localStorage:", e);
                }
            }
        }
    }

    function applyCompletionStyles() {
        const lessonNodes = learningPathContainer.querySelectorAll('.lesson-node[data-lesson-id]'); // Nur Nodes mit ID
        lessonNodes.forEach(node => {
            const lessonId = node.dataset.lessonId;
            node.classList.remove('lesson-completed'); // Sicherstellen, dass es nicht fälschlicherweise da ist
            if (completedLessons.includes(lessonId) && !node.classList.contains('type-trophy')) {
                node.classList.add('lesson-completed');
            }
        });
    }

    function layoutLearningPath() {
        const lessonNodes = Array.from(learningPathContainer.querySelectorAll('.lesson-node'));
        const connectors = Array.from(learningPathContainer.querySelectorAll('.connector'));
        let totalHeight = 0;
        let connectorIndex = 0;

        if (!lessonNodes.length) return;

        // Responsive Amplitude Calculation
        let amplitude;
        const windowWidth = window.innerWidth;
        if (windowWidth < 500) {
            amplitude = HORIZONTAL_WAVE_AMPLITUDE_BASE * 0.35; // Reduced amplitude for small screens
        } else if (windowWidth < 768) {
            amplitude = HORIZONTAL_WAVE_AMPLITUDE_BASE * 0.6; // Medium amplitude
        } else {
            amplitude = HORIZONTAL_WAVE_AMPLITUDE_BASE; // Full amplitude
        }

        lessonNodes.forEach((node, index) => {
            const topPosition = index * VERTICAL_SPACING;
            const waveFactor = Math.sin((index / HORIZONTAL_WAVE_LENGTH) * Math.PI * 2 + Math.PI / 2); // Same wave calculation
            const horizontalOffset = waveFactor * amplitude;

            // *** FIX: Combine translateX for centering AND offset ***
            const transformValue = `translateX(calc(-50% + ${horizontalOffset}px))`;
            node.style.position = 'absolute'; // Ensure it's set
            node.style.top = `${topPosition}px`;
            node.style.left = '50%'; // Keep left at 50% for the translateX base
            node.style.transform = transformValue; // Apply the combined transform
            // Store the base transform in a CSS variable for hover/active states
            node.style.setProperty('--js-transform', transformValue);


            totalHeight = topPosition + LESSON_NODE_HEIGHT; // Update total height based on node position

            // --- Connector Positioning ---
            if (connectors[connectorIndex] && index < lessonNodes.length - 1) {
                const connector = connectors[connectorIndex];
                const connectorTop = topPosition + LESSON_NODE_HEIGHT - 2; // Position below the node
                const connectorHeight = VERTICAL_SPACING - LESSON_NODE_HEIGHT + 4; // Height to reach next node's top

                // Calculate average horizontal offset for connector placement
                const nextNodeIndex = index + 1;
                const nextWaveFactor = Math.sin((nextNodeIndex / HORIZONTAL_WAVE_LENGTH) * Math.PI * 2 + Math.PI / 2);
                const nextHorizontalOffset = nextWaveFactor * amplitude;
                const avgHorizontalOffset = (horizontalOffset + nextHorizontalOffset) / 2;

                // *** FIX: Combine translateX for centering AND offset ***
                const connectorTransformValue = `translateX(calc(-50% + ${avgHorizontalOffset}px))`;

                connector.style.position = 'absolute'; // Ensure it's set
                connector.style.top = `${connectorTop}px`;
                connector.style.left = '50%';
                connector.style.height = `${connectorHeight}px`;
                connector.style.transform = connectorTransformValue; // Apply combined transform

                connectorIndex++;
            } else if (connectors[connectorIndex]) {
                // Hide any extra connectors
                connectors[connectorIndex].style.display = 'none';
            }
        });

        // Set the container height dynamically
        learningPathContainer.style.height = `${totalHeight + 50}px`; // Add some padding at the bottom
    }


    function checkOrientation() {
        // Simple check: assume landscape is wider than portrait
        const isLandscape = window.innerWidth > window.innerHeight;
        // Only show warning on wider screens in landscape
        const isWideScreen = window.innerWidth > 768;

        if (isLandscape && isWideScreen) {
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
            // Allow replaying completed lessons, but don't 'complete' them again
            // if (completedLessons.includes(lessonNode.dataset.lessonId)) {
            //     console.log("Replaying completed lesson:", lessonNode.dataset.lessonId);
            // }

            lessonActive = true; // Mark as active
            currentLessonId = lessonNode.dataset.lessonId;
            const lesson = lessonData[currentLessonId];

            if (lesson) {
                currentLessonType = lesson.type;
                if (currentLessonType === 'quiz') {
                    currentLessonTotalSteps = lesson.questions.length;
                } else if (currentLessonType === 'dragdrop') {
                    currentLessonTotalSteps = 1; // Drag/drop is one step to check
                } else {
                    currentLessonTotalSteps = 0; // Should not happen for clickable nodes
                }
                currentQuizQuestionIndex = 0;
                currentProgress = 0;
                updateProgressBar();
                loadLessonContent();
                openOverlay();
            } else {
                console.error("Lesson data not found for ID:", currentLessonId);
                lessonActive = false; // Reset if data is missing
            }
        }
    });

    closeButton.addEventListener('click', closeOverlay);
    checkButton.addEventListener('click', handleCheck);
    window.addEventListener('resize', () => { checkOrientation(); layoutLearningPath(); });
    // Use screen.orientation API if available for more robust change detection
    if (screen.orientation) {
         screen.orientation.addEventListener('change', checkOrientation);
    } else {
        // Fallback for older browsers
        window.addEventListener('orientationchange', checkOrientation);
    }

    // --- Overlay Management ---
    function openOverlay() {
        heartCountSpan.innerHTML = '<i class="fas fa-infinity"></i>'; // Example: Infinite hearts
        overlay.classList.remove('hidden');
        // Optional: Set focus for accessibility
        // closeButton.focus();
    }

    function closeOverlay() {
        overlay.classList.add('hidden');
        feedbackDiv.classList.remove('visible');
        // Reset any temporary states from interactions
        if (selectedImageForPlacement) {
            selectedImageForPlacement.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
        }
        removeTargetableClassFromPlaceholders();

        // Short delay before resetting lesson state allows transition to finish
        setTimeout(() => {
            resetLessonState();
            lessonActive = false; // Mark lesson as inactive AFTER closing
        }, 350); // Match transition duration
    }

     // --- Lesson Content & Setups ---
     function resetLessonState() {
        // Clear areas
        imageSource.innerHTML = '<p>Verfügbare Schritte:</p>';
        dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>';
        quizOptionsContainer.innerHTML = '';
        quizQuestionText.textContent = 'Fragetext hier...';
        lessonTaskDescription.textContent = 'Lade Lektion...';

        // Reset variables
        currentLessonId = null;
        currentLessonType = null;
        currentQuizQuestionIndex = 0;
        currentLessonTotalSteps = 0;
        currentProgress = 0;
        selectedQuizOption = null;
        draggedItem = null;
        selectedImageForPlacement = null;

        // Reset UI elements
        progressBarInner.style.width = '0%';
        checkButton.disabled = true;
        feedbackDiv.className = 'feedback'; // Remove feedback classes
        feedbackDiv.textContent = '';
        overlay.querySelector('.overlay-footer').style.backgroundColor = 'var(--duo-overlay-bg)'; // Reset footer bg

        // Ensure correct areas are hidden/shown (though loadLessonContent will handle this)
        dragArea.classList.add('hidden');
        quizArea.classList.add('hidden');

        // Remove any lingering drag/drop listeners (important!)
        removeDragAndDropListeners();
    }

    function loadLessonContent() {
        const data = lessonData[currentLessonId];
        if (!data) {
             console.error("Could not load lesson data for:", currentLessonId);
             closeOverlay(); // Close if data is bad
             return;
        }

        lessonTaskDescription.textContent = data.task || data.title; // Use task or fallback to title
        resetInteractionAreas(); // Clear previous state before setting up new one
        checkButton.disabled = true; // Disable check button initially
        feedbackDiv.className = 'feedback'; // Reset feedback appearance
        feedbackDiv.classList.remove('visible');

        // Setup based on lesson type
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

    // --- Drag & Drop Specific Functions ---
     function setupDragDropLesson(data) {
        imageSource.innerHTML = '<p>Verfügbare Schritte:</p>';
        dropTargetContainer.innerHTML = '<p>Deine Reihenfolge:</p>';

        // Shuffle images before displaying
        const shuffledImages = [...data.images].sort(() => Math.random() - 0.5);
        shuffledImages.forEach(imgData => {
            const img = createDraggableImage(imgData);
            imageSource.appendChild(img);
        });

        // Create placeholders
        for (let i = 1; i <= data.numberOfSteps; i++) {
            const placeholder = createDropPlaceholder(i);
            dropTargetContainer.appendChild(placeholder);
        }

        // Add listeners AFTER elements are in the DOM
        addDragAndDropListeners();
    }

    function createDraggableImage(imgData) {
         const img = document.createElement('img');
         img.src = imgData.src;
         img.alt = `Schritt ${imgData.correctOrder}`; // Alt text for accessibility
         img.id = imgData.id; // Unique ID is crucial
         img.className = 'dance-step-img';
         img.draggable = true; // Make it draggable
         img.dataset.correctOrder = imgData.correctOrder; // Store correct order
         // Click listener handled globally/added in addDragAndDropListeners
         return img;
    }

    function createDropPlaceholder(order) {
        const placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        placeholder.dataset.order = order; // Store the target order number
        placeholder.textContent = order; // Display the number initially
         // Click listener handled globally/added in addDragAndDropListeners
        return placeholder;
    }

    function addTargetableClassToEmptyPlaceholders() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        placeholders.forEach(p => {
            if (!p.querySelector('.dance-step-img')) { // Only target empty ones
                p.classList.add('targetable');
            }
        });
    }

    function removeTargetableClassFromPlaceholders() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder.targetable');
        placeholders.forEach(p => p.classList.remove('targetable'));
    }

     function areAllPlaceholdersFilled() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        for (const p of placeholders) {
            if (!p.querySelector('.dance-step-img')) {
                return false; // Found an empty one
            }
        }
        return true; // All are filled
    }

    // --- Quiz Specific Functions ---
    function setupQuizLesson(data) {
         displayQuizQuestion(data.questions[currentQuizQuestionIndex]);
         checkButton.disabled = true; // Button disabled until option selected
     }

     function displayQuizQuestion(questionData) {
         if (!questionData) return; // Safety check

         quizQuestionText.textContent = questionData.question;
         quizOptionsContainer.innerHTML = ''; // Clear previous options
         selectedQuizOption = null; // Reset selection

         // Shuffle options for variety
         const shuffledOptions = [...questionData.options].sort(() => Math.random() - 0.5);

         shuffledOptions.forEach(option => {
             const button = document.createElement('button');
             button.type = "button"; // Prevent form submission behavior
             button.className = 'quiz-option-button';
             button.textContent = option.text;
             button.dataset.correct = option.correct; // Store if correct
             button.addEventListener('click', handleQuizOptionSelect);
             quizOptionsContainer.appendChild(button);
         });
         checkButton.disabled = true; // Ensure button is disabled initially
     }


    // --- Event Handlers (Check Button, Clicks, Drag & Drop, Quiz Selection) ---
    function handleCheck() {
        if (checkButton.disabled || !currentLessonType) return; // Prevent accidental checks

        let isCorrect = false;
        if (currentLessonType === 'dragdrop') {
            isCorrect = checkDragDropOrder();
        } else if (currentLessonType === 'quiz') {
            isCorrect = checkQuizAnswer();
        }

        showFeedback(isCorrect);

        if (isCorrect) {
            playSound(correctSound);
            currentProgress++;
            updateProgressBar();
            // Disable check button until next action/question
            checkButton.disabled = true;

            // Add a delay before proceeding or finishing
            setTimeout(() => {
                feedbackDiv.classList.remove('visible'); // Hide feedback bar
                // Reset footer background in case it was colored
                overlay.querySelector('.overlay-footer').style.backgroundColor = 'var(--duo-overlay-bg)';

                if (currentLessonType === 'quiz' && currentQuizQuestionIndex < lessonData[currentLessonId].questions.length - 1) {
                    // Load next quiz question
                    currentQuizQuestionIndex++;
                    displayQuizQuestion(lessonData[currentLessonId].questions[currentQuizQuestionIndex]);
                } else {
                    // Lesson finished
                    saveCompletedLesson(currentLessonId);
                    closeOverlay();
                }
            }, 1500); // Adjust delay as needed (e.g., 1.5 seconds)

        } else {
            playSound(incorrectSound);
            // Maybe decrement hearts here if using them
            // Keep check button enabled for retry? Or disable temporarily?
            // For now, keep it enabled to allow changing answer.
            // Or, if feedback shows correct answer, disable it and force "Continue"
            // Let's disable interaction on incorrect for now and show a 'Continue' perhaps?
            // For simplicity: just show feedback, user needs to click correct answer / re-arrange then check again
            // OR: Simpler: Disable button, force close/retry? No, Duolingo lets you retry.
            // Let's disable options after incorrect check
            if (currentLessonType === 'quiz') {
                disableQuizOptions(); // Disable buttons after incorrect check
            }
             // How to proceed? Add a 'continue' button? Or just show feedback briefly?
             // Let's keep it simple: Incorrect feedback shown, user must manually retry (if drag/drop)
             // or maybe select the correct answer in quiz?
             // For now: incorrect feedback shows, user can try again (re-enable button after delay?)
             setTimeout(() => {
                 // Optional: Re-enable button to allow another try after seeing feedback
                 // checkButton.disabled = false;
                 // Or just hide feedback and let them try again
                 feedbackDiv.classList.remove('visible');
                 overlay.querySelector('.overlay-footer').style.backgroundColor = 'var(--duo-overlay-bg)';

             }, 2000); // Longer delay for incorrect
        }
    }

    function checkDragDropOrder() {
        const placeholders = dropTargetContainer.querySelectorAll('.drop-placeholder');
        for (const placeholder of placeholders) {
            const image = placeholder.querySelector('.dance-step-img');
            if (!image || image.dataset.correctOrder !== placeholder.dataset.order) {
                return false; // Mismatch found
            }
        }
        return true; // All match
    }

    function checkQuizAnswer() {
        if (!selectedQuizOption) return false; // No option selected
        return selectedQuizOption.dataset.correct === 'true';
    }

    function handleQuizOptionSelect(event) {
        if (feedbackDiv.classList.contains('visible')) return; // Don't allow selection while feedback is shown

        playSound(clickSound);
        const selectedButton = event.target;

        // Deselect previous if any
        if (selectedQuizOption) {
            selectedQuizOption.classList.remove('selected');
        }

        // Select new one
        selectedButton.classList.add('selected');
        selectedQuizOption = selectedButton;

        // Enable check button
        checkButton.disabled = false;
    }

    function disableQuizOptions() {
        const buttons = quizOptionsContainer.querySelectorAll('.quiz-option-button');
        buttons.forEach(button => {
            button.disabled = true;
            // Optionally remove hover effects etc. if needed via CSS or JS
        });
    }

    // Click handlers for drag-drop alternative
    function handleSourceImageClick(event) {
        const clickedImage = event.target;
        if (!clickedImage.classList.contains('dance-step-img') || !clickedImage.closest('#image-source')) return;

        playSound(clickSound);

        if (selectedImageForPlacement === clickedImage) {
            // Deselect
            clickedImage.classList.remove('selected-for-placement');
            selectedImageForPlacement = null;
            removeTargetableClassFromPlaceholders();
        } else {
            // Select new image
            if (selectedImageForPlacement) {
                selectedImageForPlacement.classList.remove('selected-for-placement'); // Deselect old
            }
            clickedImage.classList.add('selected-for-placement');
            selectedImageForPlacement = clickedImage;
            addTargetableClassToEmptyPlaceholders(); // Highlight empty placeholders
        }
    }

    function handlePlaceholderClick(event) {
        const clickedPlaceholder = event.target.closest('.drop-placeholder');
        if (!clickedPlaceholder) return;

        const imageInside = clickedPlaceholder.querySelector('.dance-step-img');

        if (selectedImageForPlacement && !imageInside) {
            // Place selected image into empty placeholder
            playSound(clickSound);
            clickedPlaceholder.innerHTML = ''; // Clear the number
            clickedPlaceholder.appendChild(selectedImageForPlacement);
            selectedImageForPlacement.classList.remove('selected-for-placement'); // Image is no longer selected
            clickedPlaceholder.classList.remove('targetable'); // Placeholder is no longer targetable
            selectedImageForPlacement = null; // Clear selection state
            removeTargetableClassFromPlaceholders(); // Remove highlights from others
            checkButton.disabled = !areAllPlaceholdersFilled(); // Enable check if all are filled
        } else if (!selectedImageForPlacement && imageInside) {
            // Return image from placeholder to source
            playSound(clickSound);
            const pTag = imageSource.querySelector('p');
             if(pTag) imageSource.insertBefore(imageInside, pTag.nextSibling); // Place after <p>
             else imageSource.appendChild(imageInside); // Fallback if no <p>
            clickedPlaceholder.textContent = clickedPlaceholder.dataset.order; // Restore number
            checkButton.disabled = true; // Always disable check when returning an image
        } else if (selectedImageForPlacement && imageInside) {
            // Swap image in placeholder with selected image
            playSound(clickSound);
            const pTag = imageSource.querySelector('p');
            // Put the placeholder's current image back into the source list
            if (pTag) imageSource.insertBefore(imageInside, pTag.nextSibling);
            else imageSource.appendChild(imageInside);
            // Put the selected image into the placeholder
            clickedPlaceholder.innerHTML = '';
            clickedPlaceholder.appendChild(selectedImageForPlacement);
            selectedImageForPlacement.classList.remove('selected-for-placement'); // Image is placed
            selectedImageForPlacement = null; // Clear selection state
            removeTargetableClassFromPlaceholders(); // Remove highlights
            checkButton.disabled = !areAllPlaceholdersFilled(); // Check if complete after swap
        }
    }


    // --- Drag & Drop Event Handlers ---
    function dragStart(event) {
         // If an image was selected via click, deselect it when drag starts
         if (selectedImageForPlacement) {
             selectedImageForPlacement.classList.remove('selected-for-placement');
             selectedImageForPlacement = null; removeTargetableClassFromPlaceholders();
         }
         draggedItem = event.target;
         event.dataTransfer.effectAllowed = 'move';
         // Use the item's ID for data transfer
         try { // Safety check for setData
             event.dataTransfer.setData('text/plain', event.target.id);
         } catch (e) {
             console.error("Error setting drag data:", e);
             // Fallback for IE or older browsers might be needed if targeted
             event.dataTransfer.setData('Text', event.target.id);
         }
         // Add dragging class slightly later to ensure it's picked up
         setTimeout(() => { if (draggedItem) draggedItem.classList.add('dragging'); }, 0);
     }

     function dragEnd() {
         // Remove dragging class regardless of where it was dropped
         if (draggedItem) draggedItem.classList.remove('dragging');
         // Remove drag-over styles from all potential dropzones
         const allZones = [...dropTargetContainer.querySelectorAll('.drop-placeholder'), sourceZone];
         allZones.forEach(zone => zone.classList.remove('drag-over'));
         draggedItem = null; // Clear the dragged item reference
     }

      function dragOver(event) {
         event.preventDefault(); // Necessary to allow dropping
         const targetPotential = event.target;
         // Find the closest valid drop zone (placeholder or source area)
         const targetZone = targetPotential.closest('.drop-placeholder, #image-source');

         if (!targetZone || !draggedItem) return; // Must be dragging something over a valid zone

          // Remove 'drag-over' from other zones first
          const allZones = [...dropTargetContainer.querySelectorAll('.drop-placeholder'), sourceZone];
          allZones.forEach(zone => { if(zone !== targetZone) zone.classList.remove('drag-over');});

          // Add 'drag-over' style ONLY if dropping is valid here:
          // 1. Target is an EMPTY placeholder
          // 2. Target is the source area (returning the item)
         let canDrop = false;
         if (targetZone.classList.contains('drop-placeholder')) {
             if (!targetZone.querySelector('.dance-step-img')) { // Is it empty?
                 canDrop = true;
             }
         } else if (targetZone.id === 'image-source') {
              canDrop = true; // Can always return to source
         }

         if (canDrop) {
             targetZone.classList.add('drag-over');
             event.dataTransfer.dropEffect = 'move'; // Indicate 'move' operation
         } else {
             event.dataTransfer.dropEffect = 'none'; // Indicate invalid drop
         }
      }

     function dragLeave(event) {
        const zone = event.target.closest('.drop-placeholder, #image-source');
         // Only remove highlight if the mouse truly left the zone, not just moved over a child element
        if (zone && (!event.relatedTarget || !zone.contains(event.relatedTarget))) {
             zone.classList.remove('drag-over');
        }
     }

     function drop(event) {
         event.preventDefault(); // Prevent default drop behavior (like opening link)
         const targetZone = event.target.closest('.drop-placeholder, #image-source');

         if (targetZone && draggedItem) {
             targetZone.classList.remove('drag-over'); // Remove highlight

             const targetIsPlaceholder = targetZone.classList.contains('drop-placeholder');
             const targetIsSource = targetZone.id === 'image-source';

             if (targetIsPlaceholder) {
                 // Drop onto a placeholder
                 if (!targetZone.querySelector('.dance-step-img')) { // Only if empty
                     targetZone.innerHTML = ''; // Clear number
                     targetZone.appendChild(draggedItem); // Move image here
                     checkButton.disabled = !areAllPlaceholdersFilled(); // Check completion
                 } else {
                     // Placeholder already filled - do nothing or maybe swap?
                     // Current behavior: Drop fails if placeholder occupied (handled by dragOver)
                 }
             } else if (targetIsSource) {
                 // Drop onto the source area (return image)
                 const pTag = targetZone.querySelector('p');
                 if (pTag) targetZone.insertBefore(draggedItem, pTag.nextSibling); // Insert after <p>
                 else targetZone.appendChild(draggedItem); // Fallback
                 checkButton.disabled = true; // Disable check button when returning item
             }
         }
         // draggedItem is cleared in dragEnd
     }

    // --- Listener Management ---
    function resetInteractionAreas() {
        // Remove old listeners before adding new ones to prevent duplicates
        removeDragAndDropListeners();
        // No quiz listeners to remove here as options are rebuilt each time
    }

    function addDragAndDropListeners() {
        removeDragAndDropListeners(); // Belt-and-suspenders: ensure clean state

        currentDraggables = Array.from(document.querySelectorAll('.dance-step-img')); // Get ALL images now
        currentDraggables.forEach(draggable => {
            draggable.addEventListener('dragstart', dragStart);
            draggable.addEventListener('dragend', dragEnd);
            draggable.addEventListener('click', handleSourceImageClick); // Keep click handler
        });

        currentDropzones = Array.from(dropTargetContainer.querySelectorAll('.drop-placeholder'));
        const allZones = [...currentDropzones, sourceZone]; // Include source area
        allZones.forEach(zone => {
            zone.addEventListener('dragover', dragOver);
            zone.addEventListener('dragleave', dragLeave);
            zone.addEventListener('drop', drop);
            // Add click listener to placeholders too
            if (zone.classList.contains('drop-placeholder')) {
                zone.addEventListener('click', handlePlaceholderClick);
            }
        });
    }

    function removeDragAndDropListeners() {
        // Remove from potentially existing draggables
        currentDraggables.forEach(draggable => {
            draggable.removeEventListener('dragstart', dragStart);
            draggable.removeEventListener('dragend', dragEnd);
            draggable.removeEventListener('click', handleSourceImageClick);
        });
        currentDraggables = []; // Clear array

        // Remove from potentially existing dropzones
        currentDropzones.forEach(zone => {
             zone.removeEventListener('dragover', dragOver);
             zone.removeEventListener('dragleave', dragLeave);
             zone.removeEventListener('drop', drop);
             zone.removeEventListener('click', handlePlaceholderClick);
        });
        currentDropzones = []; // Clear array

        // Remove from source zone specifically if it exists
        if (sourceZone) {
            sourceZone.removeEventListener('dragover', dragOver);
            sourceZone.removeEventListener('dragleave', dragLeave);
            sourceZone.removeEventListener('drop', drop);
        }
    }

    // --- UI Feedback & Updates ---
     function updateProgressBar() {
        const progressPercentage = currentLessonTotalSteps > 0 ? (currentProgress / currentLessonTotalSteps) * 100 : 0;
        progressBarInner.style.width = `${progressPercentage}%`;
    }

    function showFeedback(isCorrect) {
        feedbackDiv.classList.remove('feedback-correct', 'feedback-incorrect'); // Remove previous classes
        const footer = overlay.querySelector('.overlay-footer');

        if (isCorrect) {
            feedbackDiv.textContent = "Sehr gut!"; // Customize messages
            feedbackDiv.classList.add('feedback-correct');
            footer.style.backgroundColor = '#a1ec7a'; // Match feedback background color
        } else {
            feedbackDiv.textContent = "Nicht ganz richtig. Versuche es nochmal!"; // Customize
            feedbackDiv.classList.add('feedback-incorrect');
            footer.style.backgroundColor = '#fdb1b1'; // Match feedback background color

            // Highlight correct answer in quiz if needed
            if (currentLessonType === 'quiz' && selectedQuizOption) {
                const correctOption = quizOptionsContainer.querySelector('.quiz-option-button[data-correct="true"]');
                if (correctOption) correctOption.classList.add('correct'); // Show correct one
                 if(selectedQuizOption.dataset.correct !== "true"){
                     selectedQuizOption.classList.add('incorrect'); // Show selected was incorrect
                 }
                 disableQuizOptions(); // Prevent further clicks after showing result
            }
        }
        feedbackDiv.classList.add('visible'); // Make feedback bar slide up
    }

    // --- Initialisierung beim Laden ---
    console.log("App initializing...");
    checkOrientation();       // Check initial orientation
    loadCompletedLessons();   // Load progress from storage
    layoutLearningPath();     // Calculate and apply node positions
    resetLessonState();       // Ensure clean state for overlay
    console.log("App ready.");

}); // End DOMContentLoaded
