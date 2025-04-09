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