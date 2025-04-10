// Dictionary class for handling word lookups and storage
class Dictionary {
    constructor() {
        // Pagination state
        this.wordsPerPage = 7; // Updated from 10 to 7 in v1.3
        this.currentPage = 1;
        this.totalPages = 1;
        this.allWords = [];
        
        // Speech recognition
        this.recognition = null;
    }

    initSpeechRecognition(language, ui) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            ui.updateStatus('Speech recognition is not supported in your browser.');
            ui.micButton.disabled = true;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = language;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            ui.micButton.classList.add('listening');
            ui.updateStatus('Listening... Say a word');
            ui.showWord('');
            ui.definitionDisplayElement.textContent = '';
            ui.hideActionButtons();
        };

        this.recognition.onend = () => {
            ui.micButton.classList.remove('listening');
            ui.updateStatus('Click the mic button and say a word to look up its definition');
        };

        this.recognition.onresult = (event) => {
            const word = event.results[0][0].transcript.trim().toLowerCase();
            ui.showWord(word);
            ui.updateStatus(`Looking up: "${word}"`);
            this.lookupWord(word, null, ui, null, null);
        };

        this.recognition.onerror = (event) => {
            ui.micButton.classList.remove('listening');
            ui.updateStatus(`Error: ${event.error}`);
        };
    }

    startListening(language) {
        try {
            if (this.recognition.lang !== language) {
                this.recognition.lang = language;
            }
            this.recognition.start();
        } catch (error) {
            console.error('Recognition error:', error);
            ui.updateStatus('Error starting recognition. Try again.');
        }
    }

    async lookupWord(word, db, ui, settings, callback) {
        try {
            // Show loading spinner
            ui.showLoadingSpinner();
            
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
                
                // Create word data
                const currentWordData = {
                    word: wordData.word,
                    definitions: definitions
                };
                
                // If callback provided, send back the word data
                if (callback) {
                    callback(currentWordData);
                }
                
                // Display definition
                ui.displayDefinition(wordData.word, definitions);
                
                // Hide loading spinner
                ui.hideLoadingSpinner();
                
                // If settings and db provided, handle auto-save
                if (settings && db) {
                    // If auto-save is enabled, save the word automatically
                    if (settings.getSetting('autoSave')) {
                        this.saveWord(wordData.word, definitions, db, ui);
                        ui.updateStatus(`"${wordData.word}" automatically saved to dictionary`);
                    } else {
                        ui.showActionButtons();
                    }
                } else {
                    ui.showActionButtons();
                }
            } else {
                throw new Error('No definitions found');
            }
        } catch (error) {
            console.error('Lookup error:', error);
            ui.hideLoadingSpinner();
            ui.definitionDisplayElement.innerHTML = `<p>Sorry, couldn't find a definition for "${word}". Please try another word.</p>`;
            ui.hideActionButtons();
        }
    }

    saveWord(word, definitions, db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        const wordData = {
            word: word,
            definitions: definitions,
            timestamp: new Date().getTime()
        };

        const request = store.put(wordData);

        request.onsuccess = () => {
            console.log(`Word "${word}" saved successfully`);
            this.loadSavedWords(db, ui);
        };

        request.onerror = (event) => {
            console.error('Error saving word:', event.target.error);
        };
    }

    deleteWord(word, db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        const request = store.delete(word);

        request.onsuccess = () => {
            console.log(`Word "${word}" deleted successfully`);
            
            // Remove from our array
            const indexToRemove = this.allWords.findIndex(item => item.word === word);
            if (indexToRemove !== -1) {
                this.allWords.splice(indexToRemove, 1);
                
                // Recalculate total pages
                this.totalPages = Math.ceil(this.allWords.length / this.wordsPerPage);
                ui.totalPagesElement.textContent = this.totalPages;
                
                // Adjust current page if needed
                if (this.currentPage > this.totalPages && this.totalPages > 0) {
                    this.currentPage = this.totalPages;
                }
                
                // If we're on page 0 (no words), set page to 1 but show empty list
                if (this.totalPages === 0) {
                    this.currentPage = 1;
                    this.totalPages = 1;
                }
                
                // Update display
                this.displayPagedWords(ui);
            }
        };

        request.onerror = (event) => {
            console.error('Error deleting word:', event.target.error);
        };
    }

    loadSavedWords(db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev'); // Sort by newest first

        this.allWords = []; // Reset the array
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                this.allWords.push(cursor.value);
                cursor.continue();
            } else {
                // All words have been collected
                this.totalPages = Math.ceil(this.allWords.length / this.wordsPerPage);
                ui.totalPagesElement.textContent = this.totalPages;
                
                // Reset to first page when loading/reloading words
                this.currentPage = 1;
                ui.currentPageElement.textContent = this.currentPage;
                
                // Update pagination buttons state
                ui.updatePaginationControls(this.currentPage, this.totalPages);
                
                // Display the first page
                this.displayPagedWords(ui);
            }
        };

        request.onerror = (event) => {
            console.error('Error loading words:', event.target.error);
        };
    }
    
    displayPagedWords(ui) {
        // Clear the history list
        ui.clearHistoryList();
        
        // Calculate the index range for the current page
        const startIndex = (this.currentPage - 1) * this.wordsPerPage;
        const endIndex = Math.min(startIndex + this.wordsPerPage, this.allWords.length);
        
        // Display words for the current page
        for (let i = startIndex; i < endIndex; i++) {
            ui.addWordToHistory(this.allWords[i], (word) => this.deleteWord(word, ui.app.db, ui));
        }
        
        // Update current page display
        ui.updatePaginationInfo(this.currentPage, this.totalPages);
        
        // Update pagination controls
        ui.updatePaginationControls(this.currentPage, this.totalPages);
    }

    clearHistory(db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        const request = store.clear();

        request.onsuccess = () => {
            console.log('History cleared successfully');
            this.allWords = [];
            this.totalPages = 1;
            this.currentPage = 1;
            this.displayPagedWords(ui);
            ui.updatePaginationControls(this.currentPage, this.totalPages);
        };

        request.onerror = (event) => {
            console.error('Error clearing history:', event.target.error);
        };
    }
}