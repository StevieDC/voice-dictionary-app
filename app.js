document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Navigation
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const homeLink = document.getElementById('home-link');
    const savedWordsLink = document.getElementById('saved-words-link');
    const settingsLink = document.getElementById('settings-link');
    
    // DOM Elements - Sections
    const homeSection = document.getElementById('home-section');
    const savedWordsSection = document.getElementById('saved-words-section');
    const settingsSection = document.getElementById('settings-section');
    
    // DOM Elements - Pagination
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const currentPageElement = document.getElementById('current-page');
    const totalPagesElement = document.getElementById('total-pages');
    
    // DOM Elements - Dictionary
    const micButton = document.getElementById('mic-button');
    const statusElement = document.getElementById('status');
    const wordDisplayElement = document.getElementById('word-display');
    const definitionDisplayElement = document.getElementById('definition-display');
    const historyListElement = document.getElementById('history-list');
    const actionButtonsContainer = document.getElementById('action-buttons');
    const acceptButton = document.getElementById('accept-button');
    const rejectButton = document.getElementById('reject-button');
    
    // Pagination state
    const wordsPerPage = 15;
    let currentPage = 1;
    let totalPages = 1;
    let allWords = [];
    
    // DOM Elements - Settings
    const voiceLanguageSelect = document.getElementById('voice-language');
    const themeSelect = document.getElementById('theme-select');
    const autoSaveToggle = document.getElementById('auto-save');
    const saveSettingsButton = document.getElementById('save-settings');
    const backupDataButton = document.getElementById('backup-data');
    const importDataButton = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file');
    const clearHistoryButton = document.getElementById('clear-history');

    // Current lookup state
    let currentWordData = null;
    
    // Settings state
    let settings = {
        language: 'en-US',
        theme: 'light',
        autoSave: false
    };

    // Initialize IndexedDB
    let db;
    const dbName = 'dictionaryDB';
    const dbVersion = 1;
    const storeNames = {
        words: 'words',
        settings: 'settings'
    };

    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        statusElement.textContent = 'Error: Could not open database.';
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        
        // Create words store if it doesn't exist
        if (!db.objectStoreNames.contains(storeNames.words)) {
            const wordsStore = db.createObjectStore(storeNames.words, { keyPath: 'word' });
            wordsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Create settings store if it doesn't exist
        if (!db.objectStoreNames.contains(storeNames.settings)) {
            db.createObjectStore(storeNames.settings, { keyPath: 'id' });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Database opened successfully');
        loadSavedWords();
        loadSettings();
    };

    // Speech Recognition Setup
    let recognition;
    
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            statusElement.textContent = 'Speech recognition is not supported in your browser.';
            micButton.disabled = true;
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = settings.language;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            micButton.classList.add('listening');
            statusElement.textContent = 'Listening... Say a word';
            wordDisplayElement.textContent = '';
            definitionDisplayElement.textContent = '';
            hideActionButtons();
            currentWordData = null;
        };

        recognition.onend = () => {
            micButton.classList.remove('listening');
            statusElement.textContent = 'Click the mic button and say a word to look up its definition';
        };

        recognition.onresult = (event) => {
            const word = event.results[0][0].transcript.trim().toLowerCase();
            wordDisplayElement.textContent = word;
            statusElement.textContent = `Looking up: "${word}"`;
            lookupWord(word);
        };

        recognition.onerror = (event) => {
            micButton.classList.remove('listening');
            statusElement.textContent = `Error: ${event.error}`;
        };
    }

    // Navigation Menu Handlers
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(homeSection);
        setActiveNavLink(homeLink);
    });

    savedWordsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(savedWordsSection);
        setActiveNavLink(savedWordsLink);
        loadSavedWords(); // Refresh the saved words list
    });

    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(settingsSection);
        setActiveNavLink(settingsLink);
    });

    // Event Handlers
    micButton.addEventListener('click', () => {
        if (!recognition) {
            initSpeechRecognition();
        }
        
        if (micButton.classList.contains('listening')) {
            recognition.stop();
        } else {
            startListening();
        }
    });
    
    // Pagination event handlers
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayPagedWords();
        }
    });
    
    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayPagedWords();
        }
    });
    
    acceptButton.addEventListener('click', () => {
        if (currentWordData) {
            saveWord(currentWordData.word, currentWordData.definitions);
            hideActionButtons();
            statusElement.textContent = `"${currentWordData.word}" saved to dictionary`;
            currentWordData = null;
        }
    });
    
    rejectButton.addEventListener('click', () => {
        hideActionButtons();
        statusElement.textContent = `"${currentWordData ? currentWordData.word : ''}" rejected`;
        currentWordData = null;
    });
    
    saveSettingsButton.addEventListener('click', () => {
        saveSettings();
    });
    
    backupDataButton.addEventListener('click', () => {
        backupDictionary();
    });
    
    importDataButton.addEventListener('click', () => {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importDictionary(e.target.files[0]);
        }
    });
    
    clearHistoryButton.addEventListener('click', () => {
        clearHistory();
    });

    // Functions - Navigation
    function showSection(section) {
        // Hide all sections
        homeSection.classList.add('hidden');
        savedWordsSection.classList.add('hidden');
        settingsSection.classList.add('hidden');
        
        // Show the requested section
        section.classList.remove('hidden');
        
        // Close mobile menu
        navMenu.classList.remove('active');
    }
    
    function setActiveNavLink(link) {
        // Remove active class from all links
        homeLink.classList.remove('active');
        savedWordsLink.classList.remove('active');
        settingsLink.classList.remove('active');
        
        // Add active class to the clicked link
        link.classList.add('active');
    }

    // Functions - Dictionary
    function startListening() {
        try {
            recognition.start();
        } catch (error) {
            console.error('Recognition error:', error);
            statusElement.textContent = 'Error starting recognition. Try again.';
        }
    }

    function showActionButtons() {
        if (!settings.autoSave) {
            actionButtonsContainer.classList.remove('hidden');
        }
    }
    
    function hideActionButtons() {
        actionButtonsContainer.classList.add('hidden');
    }

    async function lookupWord(word) {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) {
                throw new Error('Word not found');
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const wordData = data[0];
                const definitions = [];
                
                if (wordData.meanings && wordData.meanings.length > 0) {
                    wordData.meanings.forEach(meaning => {
                        const partOfSpeech = meaning.partOfSpeech;
                        
                        if (meaning.definitions && meaning.definitions.length > 0) {
                            meaning.definitions.forEach(def => {
                                definitions.push({
                                    partOfSpeech,
                                    definition: def.definition,
                                    example: def.example
                                });
                            });
                        }
                    });
                }
                
                // Save current word data for accept/reject buttons
                currentWordData = {
                    word: wordData.word,
                    definitions: definitions
                };
                
                displayDefinition(wordData.word, definitions);
                
                // If auto-save is enabled, save the word automatically
                if (settings.autoSave) {
                    saveWord(wordData.word, definitions);
                    statusElement.textContent = `"${wordData.word}" automatically saved to dictionary`;
                } else {
                    showActionButtons();
                }
            } else {
                throw new Error('No definitions found');
            }
        } catch (error) {
            console.error('Lookup error:', error);
            definitionDisplayElement.innerHTML = `<p>Sorry, couldn't find a definition for "${word}". Please try another word.</p>`;
            hideActionButtons();
        }
    }

    function displayDefinition(word, definitions) {
        if (!definitions || definitions.length === 0) {
            definitionDisplayElement.innerHTML = `<p>No definitions found for "${word}".</p>`;
            return;
        }

        let html = `<h3>${word}</h3>`;

        // Group definitions by part of speech
        const groupedDefs = {};
        definitions.forEach(def => {
            if (!groupedDefs[def.partOfSpeech]) {
                groupedDefs[def.partOfSpeech] = [];
            }
            groupedDefs[def.partOfSpeech].push(def);
        });

        // Display each part of speech and its definitions
        for (const [pos, defs] of Object.entries(groupedDefs)) {
            html += `<p><span class="part-of-speech">${pos}</span></p><ol>`;
            
            defs.forEach(def => {
                html += `<li>${def.definition}`;
                if (def.example) {
                    html += `<br><em>Example: "${def.example}"</em>`;
                }
                html += `</li>`;
            });
            
            html += `</ol>`;
        }

        definitionDisplayElement.innerHTML = html;
    }

    function saveWord(word, definitions) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction([storeNames.words], 'readwrite');
        const store = transaction.objectStore(storeNames.words);

        const wordData = {
            word: word,
            definitions: definitions,
            timestamp: new Date().getTime()
        };

        const request = store.put(wordData);

        request.onsuccess = () => {
            console.log(`Word "${word}" saved successfully`);
            loadSavedWords();
        };

        request.onerror = (event) => {
            console.error('Error saving word:', event.target.error);
        };
    }

    function deleteWord(word) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction([storeNames.words], 'readwrite');
        const store = transaction.objectStore(storeNames.words);
        const request = store.delete(word);

        request.onsuccess = () => {
            console.log(`Word "${word}" deleted successfully`);
            
            // Remove from our array
            const indexToRemove = allWords.findIndex(item => item.word === word);
            if (indexToRemove !== -1) {
                allWords.splice(indexToRemove, 1);
                
                // Recalculate total pages
                totalPages = Math.ceil(allWords.length / wordsPerPage);
                totalPagesElement.textContent = totalPages;
                
                // Adjust current page if needed
                if (currentPage > totalPages && totalPages > 0) {
                    currentPage = totalPages;
                }
                
                // If we're on page 0 (no words), set page to 1 but show empty list
                if (totalPages === 0) {
                    currentPage = 1;
                    totalPages = 1;
                }
                
                // Update display
                displayPagedWords();
            }
        };

        request.onerror = (event) => {
            console.error('Error deleting word:', event.target.error);
        };
    }

    function loadSavedWords() {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction([storeNames.words], 'readonly');
        const store = transaction.objectStore(storeNames.words);
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev'); // Sort by newest first

        allWords = []; // Reset the array
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                allWords.push(cursor.value);
                cursor.continue();
            } else {
                // All words have been collected
                totalPages = Math.ceil(allWords.length / wordsPerPage);
                totalPagesElement.textContent = totalPages;
                
                // Reset to first page when loading/reloading words
                currentPage = 1;
                currentPageElement.textContent = currentPage;
                
                // Update pagination buttons state
                updatePaginationControls();
                
                // Display the first page
                displayPagedWords();
            }
        };

        request.onerror = (event) => {
            console.error('Error loading words:', event.target.error);
        };
    }
    
    function displayPagedWords() {
        // Clear the history list
        historyListElement.innerHTML = '';
        
        // Calculate the index range for the current page
        const startIndex = (currentPage - 1) * wordsPerPage;
        const endIndex = Math.min(startIndex + wordsPerPage, allWords.length);
        
        // Display words for the current page
        for (let i = startIndex; i < endIndex; i++) {
            addWordToHistory(allWords[i]);
        }
        
        // Update current page display
        currentPageElement.textContent = currentPage;
        
        // Update pagination controls
        updatePaginationControls();
    }
    
    function updatePaginationControls() {
        // Update previous button state
        prevPageButton.disabled = currentPage <= 1;
        
        // Update next button state
        nextPageButton.disabled = currentPage >= totalPages;
    }

    function addWordToHistory(wordData) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.word = wordData.word;

        historyItem.innerHTML = `
            <h3>
                ${wordData.word}
                <div class="history-item-actions">
                    <button class="delete-word" data-word="${wordData.word}">Delete</button>
                </div>
            </h3>
            <div class="history-item-definition" id="def-${wordData.word.replace(/\s+/g, '-')}">
                <button class="close-btn">×</button>
                <div class="definition-content"></div>
            </div>
        `;

        // Add click event for viewing word (toggle definition)
        historyItem.querySelector('h3').addEventListener('click', (e) => {
            // Don't trigger if clicking the delete button
            if (e.target.classList.contains('delete-word')) {
                return;
            }
            
            const definitionElement = historyItem.querySelector('.history-item-definition');
            const definitionContent = definitionElement.querySelector('.definition-content');
            
            // Close any other open definitions
            document.querySelectorAll('.history-item-definition.expanded').forEach(el => {
                if (el !== definitionElement) {
                    el.classList.remove('expanded');
                }
            });
            
            // Toggle this definition
            if (definitionElement.classList.contains('expanded')) {
                definitionElement.classList.remove('expanded');
            } else {
                // Only render the definition content if we're opening it
                definitionElement.classList.add('expanded');
                renderDefinitionContent(definitionContent, wordData.definitions);
            }
        });

        // Add close button event
        const closeButton = historyItem.querySelector('.close-btn');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the historyItem click
            const definitionElement = historyItem.querySelector('.history-item-definition');
            definitionElement.classList.remove('expanded');
        });

        // Add delete button event
        const deleteButton = historyItem.querySelector('.delete-word');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the historyItem click
            deleteWord(wordData.word);
        });

        historyListElement.appendChild(historyItem);
    }
    
    function renderDefinitionContent(container, definitions) {
        if (!definitions || definitions.length === 0) {
            container.innerHTML = '<p>No definitions available.</p>';
            return;
        }

        let html = '';

        // Group definitions by part of speech
        const groupedDefs = {};
        definitions.forEach(def => {
            if (!groupedDefs[def.partOfSpeech]) {
                groupedDefs[def.partOfSpeech] = [];
            }
            groupedDefs[def.partOfSpeech].push(def);
        });

        // Display each part of speech and its definitions
        for (const [pos, defs] of Object.entries(groupedDefs)) {
            html += `<p><span class="part-of-speech">${pos}</span></p><ol>`;
            
            defs.forEach(def => {
                html += `<li>${def.definition}`;
                if (def.example) {
                    html += `<br><em>Example: "${def.example}"</em>`;
                }
                html += `</li>`;
            });
            
            html += `</ol>`;
        }

        container.innerHTML = html;
    }

    function clearHistory() {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        if (confirm('Are you sure you want to clear all saved words?')) {
            const transaction = db.transaction([storeNames.words], 'readwrite');
            const store = transaction.objectStore(storeNames.words);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('History cleared successfully');
                allWords = [];
                totalPages = 1;
                currentPage = 1;
                displayPagedWords();
                updatePaginationControls();
            };

            request.onerror = (event) => {
                console.error('Error clearing history:', event.target.error);
            };
        }
    }
    
    // Functions - Settings
    function loadSettings() {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction([storeNames.settings], 'readonly');
        const store = transaction.objectStore(storeNames.settings);
        const request = store.get('user-settings');

        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result) {
                settings = result.data;
                
                // Apply settings to UI
                voiceLanguageSelect.value = settings.language;
                themeSelect.value = settings.theme;
                autoSaveToggle.checked = settings.autoSave;
                
                // Apply theme
                applyTheme(settings.theme);
                
                // Initialize speech recognition with saved language
                initSpeechRecognition();
            } else {
                // No saved settings, use defaults and initialize
                saveSettings();
                initSpeechRecognition();
            }
        };

        request.onerror = (event) => {
            console.error('Error loading settings:', event.target.error);
            // Initialize with defaults
            initSpeechRecognition();
        };
    }
    
    // Functions - Backup & Restore
    function backupDictionary() {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction([storeNames.words], 'readonly');
        const store = transaction.objectStore(storeNames.words);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const words = event.target.result;
            
            if (words && words.length > 0) {
                // Create backup object with metadata
                const backup = {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    words: words
                };
                
                // Convert to JSON
                const backupJson = JSON.stringify(backup, null, 2);
                
                // Create download link
                const blob = new Blob([backupJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Generate filename with timestamp
                const now = new Date();
                const filename = `vd_${now.getFullYear().toString().substring(2)}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}-${padZero(now.getHours())}-${padZero(now.getMinutes())}`;
                
                // Create and click download link
                const link = document.createElement('a');
                link.href = url;
                link.download = `${filename}.json`;
                document.body.appendChild(link);
                link.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 100);
                
                statusElement.textContent = `Dictionary backed up to ${filename}.json`;
            } else {
                statusElement.textContent = 'No words to backup';
            }
        };

        request.onerror = (event) => {
            console.error('Error backing up data:', event.target.error);
            statusElement.textContent = 'Error backing up dictionary';
        };
    }
    
    function importDictionary(file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                
                // Validate backup data format
                if (!backupData.words || !Array.isArray(backupData.words)) {
                    throw new Error('Invalid backup file format');
                }
                
                // Confirm import with user
                if (confirm(`This will import ${backupData.words.length} words. Continue?`)) {
                    restoreFromBackup(backupData.words);
                }
            } catch (error) {
                console.error('Error parsing backup file:', error);
                statusElement.textContent = 'Error: Invalid backup file format';
            }
        };
        
        reader.onerror = () => {
            console.error('Error reading backup file');
            statusElement.textContent = 'Error reading backup file';
        };
        
        reader.readAsText(file);
    }
    
    function restoreFromBackup(words) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }
        
        const transaction = db.transaction([storeNames.words], 'readwrite');
        const store = transaction.objectStore(storeNames.words);
        
        // Keep track of import progress
        let importedCount = 0;
        let errorCount = 0;
        
        // Process each word
        words.forEach(wordData => {
            const request = store.put(wordData);
            
            request.onsuccess = () => {
                importedCount++;
                if (importedCount + errorCount === words.length) {
                    finishImport(importedCount, errorCount);
                }
            };
            
            request.onerror = (event) => {
                console.error('Error importing word:', event.target.error);
                errorCount++;
                if (importedCount + errorCount === words.length) {
                    finishImport(importedCount, errorCount);
                }
            };
        });
        
        transaction.oncomplete = () => {
            console.log('Import transaction completed');
        };
        
        transaction.onerror = (event) => {
            console.error('Import transaction error:', event.target.error);
        };
    }
    
    function finishImport(importedCount, errorCount) {
        statusElement.textContent = `Import complete: ${importedCount} words imported, ${errorCount} errors`;
        loadSavedWords(); // Refresh the word list
        
        // Go to the saved words page to show the imported words
        showSection(savedWordsSection);
        setActiveNavLink(savedWordsLink);
    }
    
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    function saveSettings() {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        // Get current settings from UI
        settings = {
            language: voiceLanguageSelect.value,
            theme: themeSelect.value,
            autoSave: autoSaveToggle.checked
        };

        const transaction = db.transaction([storeNames.settings], 'readwrite');
        const store = transaction.objectStore(storeNames.settings);

        const settingsData = {
            id: 'user-settings',
            data: settings
        };

        const request = store.put(settingsData);

        request.onsuccess = () => {
            console.log('Settings saved successfully');
            
            // Apply theme
            applyTheme(settings.theme);
            
            // Re-initialize speech recognition with new language
            if (recognition) {
                recognition.lang = settings.language;
            } else {
                initSpeechRecognition();
            }
            
            // Show notification
            statusElement.textContent = 'Settings saved successfully';
            
            // Return to home screen
            showSection(homeSection);
            setActiveNavLink(homeLink);
        };

        request.onerror = (event) => {
            console.error('Error saving settings:', event.target.error);
        };
    }
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    // Initialize the app
    initSpeechRecognition();
});