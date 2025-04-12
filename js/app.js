// Main App class
class App {
    constructor() {
        // Components
        this.db = null;
        this.ui = new UI();
        this.dictionary = new Dictionary();
        this.storage = new Storage();
        this.settings = new Settings();

        // State
        this.currentWordData = null;
    }

    init() {
        // Initialize UI
        this.ui.init();
        this.ui.bindEvents(this);

        // Initialize database
        this.storage.initDatabase()
            .then(db => {
                this.db = db;
                console.log('Database opened successfully');

                // Load data
                this.dictionary.loadSavedWords(this.db, this.ui);
                this.settings.loadSettings(this.db, this.ui);
            })
            .catch(error => {
                console.error('Error initializing database:', error);
                this.ui.updateStatus('Error: Could not open database.');
            });
    }

    // Speech recognition methods
    startListening() {
        this.dictionary.startListening(this.settings.getSetting('language'));
    }

    // Word actions
    lookupWord(word) {
        this.dictionary.lookupWord(
            word,
            this.db,
            this.ui,
            this.settings,
            (wordData) => {
                this.currentWordData = wordData;
            }
        );
    }

    saveWord() {
        if (this.currentWordData) {
            const transaction = this.db.transaction(['words'], 'readwrite');
            const store = transaction.objectStore('words');

            const wordData = {
                word: this.currentWordData.word,
                definitions: this.currentWordData.definitions,
                timestamp: new Date().getTime()
            };

            const request = store.put(wordData);

            request.onsuccess = () => {
                console.log(`Word "${wordData.word}" saved successfully`);
                this.dictionary.loadSavedWords(this.db, this.ui);
                this.ui.hideActionButtons();
                this.ui.updateStatus(`"${wordData.word}" saved to dictionary`);
                this.currentWordData = null;
            };

            request.onerror = (event) => {
                console.error('Error saving word:', event.target.error);
                this.ui.updateStatus('Error saving word to dictionary');
            };
        }
    }

    rejectWord() {
        this.ui.hideActionButtons();
        this.ui.updateStatus(''); // Clear the status message
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