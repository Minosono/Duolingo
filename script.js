document.addEventListener('DOMContentLoaded', () => {
    const learningPath = document.querySelector('.learning-path');
    const overlay = document.getElementById('lesson-overlay');
    const closeButton = overlay.querySelector('.close-button');
    const imageSource = document.getElementById('image-source');
    const dropTarget = document.getElementById('drop-target');
    const checkButton = document.getElementById('check-button');
    const feedbackDiv = document.getElementById('feedback');
    const lessonTitle = document.getElementById('lesson-title');
    const dropPlaceholders = dropTarget.querySelectorAll('.drop-placeholder');

    // --- Beispiel-Lektionsdaten ---
    // Du würdest hier normalerweise die Daten für JEDE Lektion speichern
    // Schlüssel ist die data-lesson-id aus dem HTML
    const lessonData = {
        lesson1: {
            title: "Lektion 1: Grundschritt",
            images: [
                { id: 'step1a', src: 'images/step1a.png', correctOrder: 1 }, // Ersetze 'images/...' mit DEINEN Bildpfaden
                { id: 'step1b', src: 'images/step1b.png', correctOrder: 2 },
                { id: 'step1c', src: 'images/step1c.png', correctOrder: 3 },
            ],
            numberOfSteps: 3
        },
        lesson2: {
            title: "Lektion 2: Drehung",
            images: [
                { id: 'step2a', src: 'images/step2a.png', correctOrder: 1 },
                { id: 'step2b', src: 'images/step2b.png', correctOrder: 2 },
                { id: 'step2c', src: 'images/step2c.png', correctOrder: 3 },
                { id: 'step2d', src: 'images/step2d.png', correctOrder: 4 }, // Beispiel mit 4 Schritten
            ],
            numberOfSteps: 4
        },
         lesson3: {
            title: "Lektion 3: Pose",
            images: [
                { id: 'step3a', src: 'images/step3a.png', correctOrder: 1 },
                { id: 'step3b', src: 'images/step3b.png', correctOrder: 2 },
            ],
             numberOfSteps: 2
        }
        // Füge hier Daten für andere Lektionen hinzu...
    };

    let currentLessonId = null; // Um zu wissen, welche Lektion aktiv ist
    let draggedItem = null; // Element, das gerade gezogen wird

    // --- Event Listener für Lernpfad ---
    learningPath.addEventListener('click', (event) => {
        const lessonNode = event.target.closest('.lesson-node');
        if (lessonNode) {
            const lessonId = lessonNode.dataset.lessonId;
            currentLessonId = lessonId; // ID speichern
            loadLesson(lessonId);
            overlay.classList.remove('hidden');
        }
    });

    // --- Event Listener zum Schließen des Overlays ---
    closeButton.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (event) => {
        // Schließe nur, wenn auf den Hintergrund geklickt wird, nicht auf den Inhalt
        if (event.target === overlay) {
            closeOverlay();
        }
    });

    // --- Lektion laden ---
    function loadLesson(lessonId) {
        const data = lessonData[lessonId];
        if (!data) {
            console.error("Keine Daten für Lektion gefunden:", lessonId);
            lessonTitle.textContent = "Fehler: Lektion nicht gefunden";
            imageSource.innerHTML = '<p>Verfügbare Schritte:</p>'; // Leeren
            setupPlaceholders(0); // Keine Platzhalter anzeigen
            return;
        }

        lessonTitle.textContent = data.title;
        feedbackDiv.textContent = ''; // Altes Feedback löschen
        feedbackDiv.className = ''; // Klassen entfernen

        // Bilderquelle (gemischt) vorbereiten
        imageSource.innerHTML = '<p>Verfügbare Schritte:</p>'; // Vorherige Bilder entfernen
        const shuffledImages = [...data.images].sort(() => Math.random() - 0.5); // Mischen
        shuffledImages.forEach(imgData => {
            const img = document.createElement('img');
            img.src = imgData.src;
            img.alt = `Schritt ${imgData.correctOrder}`;
            img.id = imgData.id;
            img.className = 'dance-step-img';
            img.draggable = true;
            img.dataset.correctOrder = imgData.correctOrder; // Korrekte Reihenfolge speichern
            imageSource.appendChild(img);
        });

        setupPlaceholders(data.numberOfSteps);
        addDragAndDropListeners();
    }

    // --- Platzhalter anpassen ---
    function setupPlaceholders(count) {
        // Alle vorhandenen Platzhalter leeren und ggf. verstecken
         dropPlaceholders.forEach(p => {
            p.innerHTML = p.dataset.order; // Nummer wiederherstellen
            p.style.display = 'none'; // Standardmäßig verstecken
            p.classList.remove('drag-over');
         });

         // Benötigte Anzahl anzeigen und leeren
        for (let i = 0; i < count; i++) {
             if (dropPlaceholders[i]) {
                 dropPlaceholders[i].innerHTML = (i + 1).toString(); // Nummer anzeigen
                 dropPlaceholders[i].style.display = 'inline-flex'; // Sichtbar machen
            }
        }
    }


    // --- Overlay schließen Funktion ---
    function closeOverlay() {
        overlay.classList.add('hidden');
        // Optional: Bilder und Platzhalter zurücksetzen, wenn das Overlay geschlossen wird
        currentLessonId = null; // Aktive Lektion zurücksetzen
    }


    // --- Drag & Drop Event Listener ---
    function addDragAndDropListeners() {
        const draggables = imageSource.querySelectorAll('.dance-step-img');

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', dragStart);
        });

        // Event Listener für das Fallenlassen entfernen, falls noch welche da sind
        dropPlaceholders.forEach(zone => {
            zone.removeEventListener('dragover', dragOver);
            zone.removeEventListener('dragleave', dragLeave);
            zone.removeEventListener('drop', drop);
        });

        // Neue Event Listener hinzufügen (nur für sichtbare Platzhalter)
         dropPlaceholders.forEach(zone => {
             if(zone.style.display !== 'none') {
                zone.addEventListener('dragover', dragOver);
                zone.addEventListener('dragleave', dragLeave);
                zone.addEventListener('drop', drop);
             }
        });

        // Wichtig: Auch die Quelle (imageSource) als Drop-Ziel hinzufügen,
        // damit Bilder zurückgelegt werden können.
        imageSource.addEventListener('dragover', dragOver);
        imageSource.addEventListener('dragleave', dragLeave);
        imageSource.addEventListener('drop', drop);

    }


    function dragStart(event) {
        draggedItem = event.target; // Das gezogene Element merken
        // Optional: Datenübertragung (hier ID) für komplexere Szenarien
        event.dataTransfer.setData('text/plain', event.target.id);
        // Kleines Timeout, damit das Element "verschwindet", bevor der Screenshot für das Drag-Image gemacht wird
        setTimeout(() => {
            // event.target.style.opacity = '0.5'; // Oder ausblenden statt opacity
        }, 0);
    }

    function dragOver(event) {
        event.preventDefault(); // Notwendig, um 'drop' zu ermöglichen
        // Nur auf Platzhalter oder die Quelle reagieren
        const targetZone = event.target.closest('.drop-placeholder, #image-source');
         if (targetZone && targetZone.classList.contains('drop-placeholder')) {
             targetZone.classList.add('drag-over');
         }
    }

    function dragLeave(event) {
        // Nur von Platzhaltern die Klasse entfernen
         const targetZone = event.target.closest('.drop-placeholder');
        if (targetZone) {
           targetZone.classList.remove('drag-over');
        }
    }

    function drop(event) {
        event.preventDefault();
        const targetZone = event.target.closest('.drop-placeholder, #image-source'); // Zielzone finden

         if (targetZone && draggedItem) {
             // Alte 'drag-over' Klasse entfernen (wichtig für alle Zonen)
             document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            // Prüfen, ob das Ziel ein Platzhalter ist
             if (targetZone.classList.contains('drop-placeholder')) {
                 // Prüfen, ob der Platzhalter leer ist oder bereits ein Bild enthält
                 const existingImage = targetZone.querySelector('.dance-step-img');
                 if (!existingImage) { // Nur droppen, wenn leer
                     targetZone.innerHTML = ''; // Nummer entfernen
                     targetZone.appendChild(draggedItem); // Gezogenes Bild hinzufügen
                 } else {
                     // Optional: Bild zurück zur Quelle schicken oder tauschen?
                     // Einfachste Lösung: Drop verhindern, wenn nicht leer.
                     // Nichts tun oder Feedback geben.
                     console.log("Platzhalter ist bereits belegt.");
                     // Optional das gezogene Element sichtbar machen, falls es ausgeblendet war
                    // draggedItem.style.opacity = '1';
                 }
             }
            // Prüfen, ob das Ziel die ursprüngliche Quelle ist
             else if (targetZone.id === 'image-source') {
                 // Sicherstellen, dass das p-Tag erhalten bleibt
                 const pTag = targetZone.querySelector('p');
                 if (pTag) {
                    targetZone.insertBefore(draggedItem, pTag.nextSibling); // Nach dem p-Tag einfügen
                 } else {
                    targetZone.appendChild(draggedItem); // Falls p-Tag fehlt
                 }
             }

            // draggedItem.style.opacity = '1'; // Wieder voll sichtbar machen
            draggedItem = null; // Gezogenes Element zurücksetzen
        }
    }

    // --- Event Listener für den "Überprüfen"-Button ---
    checkButton.addEventListener('click', () => {
         if (!currentLessonId) return; // Keine Lektion aktiv

         const data = lessonData[currentLessonId];
         if (!data) return;

        let isCorrect = true;
        const placedImages = [];

        // Gehe durch die *sichtbaren* Platzhalter der aktuellen Lektion
         for(let i = 0; i < data.numberOfSteps; i++) {
            const placeholder = dropPlaceholders[i];
             const img = placeholder.querySelector('.dance-step-img');

             if (!img) { // Platzhalter ist leer
                 isCorrect = false;
                 // Frühzeitig abbrechen, wenn einer fehlt (optional, man könnte auch nur falsch markieren)
                 // break;
             } else {
                placedImages.push(img);
                 // Vergleiche die erwartete Order (data-order des Platzhalters)
                 // mit der gespeicherten korrekten Order des Bildes
                 const placeholderOrder = parseInt(placeholder.dataset.order, 10);
                 const imageCorrectOrder = parseInt(img.dataset.correctOrder, 10);

                 if (placeholderOrder !== imageCorrectOrder) {
                     isCorrect = false;
                     // Optional: Markiere falsche Bilder oder Platzhalter
                 }
             }
         }

        // Stelle sicher, dass auch *alle* Bilder platziert wurden (nicht nur die ersten)
        if (placedImages.length !== data.numberOfSteps) {
            isCorrect = false;
        }


        // Feedback geben
        if (isCorrect) {
            feedbackDiv.textContent = 'Super! Reihenfolge korrekt!';
            feedbackDiv.className = 'feedback-correct';
            // Optional: Nächste Lektion freischalten o.ä.
            // Optional: Overlay nach kurzer Zeit schließen
             setTimeout(closeOverlay, 1500);
        } else {
            feedbackDiv.textContent = 'Noch nicht ganz richtig. Versuche es erneut!';
            feedbackDiv.className = 'feedback-incorrect';
            // Optional: Bilder zurücksetzen oder nur Feedback geben
        }
    });

    // --- Initial Setup ---
    // addDragAndDropListeners(); // Initial Event Listener für evtl. Standardinhalt (hier nicht nötig, da dynamisch)

});
