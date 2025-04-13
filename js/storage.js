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

    async backupDictionary(db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        try {
            const transaction = db.transaction(['words'], 'readonly');
            const store = transaction.objectStore('words');
            const words = await this.getAllWords(store);

            const backup = {
                version: 1,
                timestamp: new Date().toISOString(),
                words: words
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dictionary-backup-${backup.timestamp.split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            ui.updateStatus('Backup created successfully');
        } catch (error) {
            console.error('Backup error:', error);
            ui.updateStatus('Error creating backup');
        }
    }

    getAllWords(store) {
        return new Promise((resolve, reject) => {
            const words = [];
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    words.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(words);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async importDictionary(file, db, ui, dictionary) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        try {
            const content = await this.readFile(file);
            const backup = JSON.parse(content);

            if (!this.validateBackup(backup)) {
                throw new Error('Invalid backup file format');
            }

            const transaction = db.transaction(['words'], 'readwrite');
            const store = transaction.objectStore('words');

            // Clear existing words
            await this.clearStore(store);

            // Import new words
            for (const word of backup.words) {
                store.put(word);
            }

            // Wait for transaction to complete
            await new Promise((resolve, reject) => {
                transaction.oncomplete = resolve;
                transaction.onerror = () => reject(transaction.error);
            });

            // Reload words in UI
            dictionary.loadSavedWords(db, ui);
            ui.updateStatus('Dictionary imported successfully');
        } catch (error) {
            console.error('Import error:', error);
            ui.updateStatus('Error importing dictionary');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    validateBackup(backup) {
        return (
            backup &&
            typeof backup === 'object' &&
            Array.isArray(backup.words) &&
            backup.version === 1 &&
            typeof backup.timestamp === 'string'
        );
    }

    clearStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
        });
    }
}