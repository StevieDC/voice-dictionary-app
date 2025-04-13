class UI {
    constructor(app) {
        this.app = app;
        
        // Input elements
        this.wordInput = document.getElementById('word-input');
        this.definitionDisplayElement = document.getElementById('definition-display');
        this.historyListElement = document.getElementById('history-list');
        this.statusElement = document.getElementById('status');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.loadingWord = document.getElementById('loading-word');
        
        // Action buttons
        this.actionButtonsContainer = document.getElementById('action-buttons');
        this.acceptWordButton = document.getElementById('accept-word');
        this.rejectWordButton = document.getElementById('reject-word');
        
        // Pagination elements
        this.currentPageElement = document.getElementById('current-page');
        this.totalPagesElement = document.getElementById('total-pages');
        this.prevPageButton = document.getElementById('prev-page');
        this.nextPageButton = document.getElementById('next-page');
        
        // Voice input button
        this.voiceInputButton = document.getElementById('voice-input');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Word input handling
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const word = this.wordInput.value.trim();
                if (word) {
                    this.app.dictionary.lookupWord(word, this.app.db, this, this.app.settings);
                }
            }
        });

        // Action button handlers
        this.acceptWordButton.addEventListener('click', () => {
            const word = this.wordInput.value.trim();
            const definitions = this.getCurrentDefinitions();
            if (word && definitions) {
                this.app.dictionary.saveWord(word, definitions, this.app.db, this);
                this.hideActionButtons();
                this.updateStatus(`"${word}" saved to dictionary`);
            }
        });

        this.rejectWordButton.addEventListener('click', () => {
            this.hideActionButtons();
            this.clearDefinitionDisplay();
            this.updateStatus('Word rejected');
        });

        // Pagination handlers
        this.prevPageButton.addEventListener('click', () => {
            if (this.app.dictionary.currentPage > 1) {
                this.app.dictionary.currentPage--;
                this.app.dictionary.displayPagedWords(this);
            }
        });

        this.nextPageButton.addEventListener('click', () => {
            if (this.app.dictionary.currentPage < this.app.dictionary.totalPages) {
                this.app.dictionary.currentPage++;
                this.app.dictionary.displayPagedWords(this);
            }
        });

        // Voice input handler
        this.voiceInputButton.addEventListener('click', () => {
            const language = this.app.settings.getSetting('language') || 'en-US';
            this.app.dictionary.startListening(language);
        });
    }

    getCurrentDefinitions() {
        // Extract definitions from the current display
        const definitions = [];
        const definitionElements = this.definitionDisplayElement.querySelectorAll('.definition-item');
        
        definitionElements.forEach(item => {
            const partOfSpeech = item.querySelector('.part-of-speech')?.textContent;
            const definition = item.querySelector('.definition-text')?.textContent;
            const example = item.querySelector('.example')?.textContent;
            
            if (definition) {
                definitions.push({
                    partOfSpeech: partOfSpeech || '',
                    definition: definition,
                    example: example || ''
                });
            }
        });
        
        return definitions.length > 0 ? definitions : null;
    }

    displayDefinition(word, definitions) {
        let html = `<h2>${word}</h2>`;
        
        if (definitions && definitions.length > 0) {
            definitions.forEach((def, index) => {
                html += `
                    <div class="definition-item">
                        <p class="part-of-speech">${def.partOfSpeech || ''}</p>
                        <p class="definition-text">${def.definition}</p>
                        ${def.example ? `<p class="example">${def.example}</p>` : ''}
                    </div>
                `;
            });
        } else {
            html += '<p>No definitions found.</p>';
        }
        
        this.definitionDisplayElement.innerHTML = html;
    }

    addWordToHistory(wordData, deleteCallback) {
        const li = document.createElement('li');
        li.classList.add('history-item');
        
        const word = document.createElement('span');
        word.textContent = wordData.word;
        word.classList.add('history-word');
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.classList.add('delete-button');
        deleteButton.title = 'Delete word';
        
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${wordData.word}" from history?`)) {
                deleteCallback(wordData.word);
            }
        });
        
        li.appendChild(word);
        li.appendChild(deleteButton);
        
        // Add click handler to display definition
        li.addEventListener('click', () => {
            this.wordInput.value = wordData.word;
            this.displayDefinition(wordData.word, wordData.definitions);
        });
        
        this.historyListElement.appendChild(li);
    }

    clearHistoryList() {
        while (this.historyListElement.firstChild) {
            this.historyListElement.removeChild(this.historyListElement.firstChild);
        }
    }

    updatePaginationInfo(currentPage, totalPages) {
        this.currentPageElement.textContent = currentPage;
        this.totalPagesElement.textContent = totalPages;
    }

    updatePaginationControls(currentPage, totalPages) {
        this.prevPageButton.disabled = currentPage <= 1;
        this.nextPageButton.disabled = currentPage >= totalPages;
    }

    showLoadingSpinner(word) {
        if (this.loadingWord) {
            this.loadingWord.textContent = word;
        }
        this.loadingSpinner.classList.remove('hidden');
    }

    hideLoadingSpinner() {
        this.loadingSpinner.classList.add('hidden');
    }

    showActionButtons() {
        this.actionButtonsContainer.classList.remove('hidden');
    }

    hideActionButtons() {
        this.actionButtonsContainer.classList.add('hidden');
    }

    clearDefinitionDisplay() {
        this.definitionDisplayElement.innerHTML = '';
    }

    updateStatus(message) {
        this.statusElement.textContent = message;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            if (this.statusElement.textContent === message) {
                this.statusElement.textContent = '';
            }
        }, 3000);
    }
}