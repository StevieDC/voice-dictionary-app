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