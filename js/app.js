// Main App class
class App {
    constructor() {
        // Initialize components
        this.dictionary = new Dictionary();
        this.settings = new Settings();
        this.db = null;
        this.ui = new UI(this);
        
        // Initialize the database
        this.initDatabase();
        
        // Load settings
        this.settings.loadSettings();
        
        // Initialize speech recognition with current language
        const language = this.settings.getSetting('language') || 'en-US';
        this.dictionary.initSpeechRecognition(language, this.ui);
    }
    
    initDatabase() {
        const request = indexedDB.open('dictionary', 1);
        
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
        };
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('Database opened successfully');
            
            // Load saved words after database is initialized
            this.dictionary.loadSavedWords(this.db, this.ui);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store for words if it doesn't exist
            if (!db.objectStoreNames.contains('words')) {
                const store = db.createObjectStore('words', { keyPath: 'word' });
                store.createIndex('timestamp', 'timestamp');
                console.log('Words store created');
            }
        };
    }

    // Speech recognition methods
    startListening() {
        this.dictionary.startListening(this.settings.getSetting('language'));
    }

    // Word actions
    lookupWord(word) {
        this.dictionary.lookupWord(word, this.db, this.ui, this.settings, (wordData) => {
            this.currentWordData = wordData;
        });
    }

    saveWord() {
        if (this.currentWordData) {
            this.dictionary.saveWord(this.currentWordData.word, this.currentWordData.definitions, this.db, this.ui);
            this.ui.hideActionButtons();
            this.ui.updateStatus(`"${this.currentWordData.word}" saved to dictionary`);
            this.currentWordData = null;
        }
    }

    rejectWord() {
        this.ui.hideActionButtons();
        this.ui.updateStatus(`"${this.currentWordData ? this.currentWordData.word : ''}" rejected`);
        this.currentWordData = null;
    }

    deleteWord(word) {
        this.dictionary.deleteWord(word, this.db, this.ui);
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all saved words?')) {
            this.dictionary.clearHistory(this.db, this.ui);
        }
    }

    // Settings actions
    saveSettings() {
        this.settings.saveSettings(this.db, this.ui);
    }

    // Backup/restore actions
    backupDictionary() {
        this.storage.backupDictionary(this.db, this.ui);
    }

    importDictionary(file) {
        this.storage.importDictionary(file, this.db, this.ui, this.dictionary);
    }
}