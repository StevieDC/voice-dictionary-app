// Storage class for handling data persistence
class Storage {
    constructor() {
        this.dbName = 'dictionaryDB';
        this.dbVersion = 1;
        this.storeNames = {
            words: 'words',
            settings: 'settings'
        };
    }

    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create words store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeNames.words)) {
                    const wordsStore = db.createObjectStore(this.storeNames.words, { keyPath: 'word' });
                    wordsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create settings store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeNames.settings)) {
                    db.createObjectStore(this.storeNames.settings, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    backupDictionary(db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction([this.storeNames.words], 'readonly');
        const store = transaction.objectStore(this.storeNames.words);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const words = event.target.result;

            if (words && words.length > 0) {
                // Create backup object with metadata
                const backup = {
                    version: '1.5',
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
                const filename = `vd_${now.getFullYear().toString().substring(2)}-${this.padZero(now.getMonth() + 1)}-${this.padZero(now.getDate())}-${this.padZero(now.getHours())}-${this.padZero(now.getMinutes())}`;

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

                ui.updateStatus(`Dictionary backed up to ${filename}.json`);
            } else {
                ui.updateStatus('No words to backup');
            }
        };

        request.onerror = (event) => {
            console.error('Error backing up data:', event.target.error);
            ui.updateStatus('Error backing up dictionary');
        };
    }

    importDictionary(file, db, ui, dictionary) {
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
                    this.restoreFromBackup(backupData.words, db, ui, dictionary);
                }
            } catch (error) {
                console.error('Error parsing backup file:', error);
                ui.updateStatus('Error: Invalid backup file format');
            }
        };

        reader.onerror = () => {
            console.error('Error reading backup file');
            ui.updateStatus('Error reading backup file');
        };

        reader.readAsText(file);
    }

    restoreFromBackup(words, db, ui, dictionary) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction([this.storeNames.words], 'readwrite');
        const store = transaction.objectStore(this.storeNames.words);

        // Keep track of import progress
        let importedCount = 0;
        let errorCount = 0;

        // Process each word
        words.forEach(wordData => {
            const request = store.put(wordData);

            request.onsuccess = () => {
                importedCount++;
                if (importedCount + errorCount === words.length) {
                    this.finishImport(importedCount, errorCount, ui, dictionary, db);
                }
            };

            request.onerror = (event) => {
                console.error('Error importing word:', event.target.error);
                errorCount++;
                if (importedCount + errorCount === words.length) {
                    this.finishImport(importedCount, errorCount, ui, dictionary, db);
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

    finishImport(importedCount, errorCount, ui, dictionary, db) {
        ui.updateStatus(`Import complete: ${importedCount} words imported, ${errorCount} errors`);
        dictionary.loadSavedWords(db, ui); // Refresh the word list

        // Go to the saved words page to show the imported words
        ui.showSection(ui.savedWordsSection);
        ui.setActiveNavLink(ui.savedWordsLink);
    }

    padZero(num) {
        return num.toString().padStart(2, '0');
    }
}