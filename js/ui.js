// UI class for handling DOM interactions
class UI {
    constructor() {
        // DOM Elements - Navigation
        this.menuToggle = document.getElementById('menu-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.homeLink = document.getElementById('home-link');
        // No more logo link
        this.savedWordsLink = document.getElementById('saved-words-link');
        this.settingsLink = document.getElementById('settings-link');
        
        // DOM Elements - Sections
        this.homeSection = document.getElementById('home-section');
        this.savedWordsSection = document.getElementById('saved-words-section');
        this.settingsSection = document.getElementById('settings-section');
        
        // DOM Elements - Pagination
        this.prevPageButton = document.getElementById('prev-page');
        this.nextPageButton = document.getElementById('next-page');
        this.currentPageElement = document.getElementById('current-page');
        this.totalPagesElement = document.getElementById('total-pages');
        
        // DOM Elements - Dictionary
        this.micButton = document.getElementById('mic-button');
        this.statusElement = document.getElementById('status');
        this.wordDisplayElement = document.getElementById('word-display');
        this.definitionDisplayElement = document.getElementById('definition-display');
        this.loadingContainer = document.getElementById('loading-container');
        this.historyListElement = document.getElementById('history-list');
        this.actionButtonsContainer = document.getElementById('action-buttons');
        this.acceptButton = document.getElementById('accept-button');
        this.rejectButton = document.getElementById('reject-button');
        
        // DOM Elements - Settings
        this.voiceLanguageSelect = document.getElementById('voice-language');
        this.themeSelect = document.getElementById('theme-select');
        this.autoSaveToggle = document.getElementById('auto-save');
        this.saveSettingsButton = document.getElementById('save-settings');
        this.backupDataButton = document.getElementById('backup-data');
        this.importDataButton = document.getElementById('import-data');
        this.importFileInput = document.getElementById('import-file');
        this.clearHistoryButton = document.getElementById('clear-history');
    }

    init() {
        // Store app reference for later use
        this.app = null;
        
        // Make sure loading container is hidden initially
        this.hideLoadingSpinner();
        console.log('UI initialized, loading spinner hidden');
    }

    bindEvents(app) {
        // Store app reference
        this.app = app;
        console.log('App reference stored in UI');
        
        // Navigation Menu Handlers
        this.menuToggle.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
        });

        this.homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection(this.homeSection);
            this.setActiveNavLink(this.homeLink);
        });

        this.savedWordsLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection(this.savedWordsSection);
            this.setActiveNavLink(this.savedWordsLink);
            app.dictionary.loadSavedWords(app.db, this); // Refresh the saved words list
        });

        this.settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection(this.settingsSection);
            this.setActiveNavLink(this.settingsLink);
        });

        // Event Handlers
        this.micButton.addEventListener('click', () => {
            if (!app.dictionary.recognition) {
                app.dictionary.initSpeechRecognition(app.settings.getSetting('language'), this);
            }
            
            if (this.micButton.classList.contains('listening')) {
                app.dictionary.recognition.stop();
            } else {
                app.startListening();
            }
        });
        
        // Pagination event handlers
        this.prevPageButton.addEventListener('click', () => {
            if (app.dictionary.currentPage > 1) {
                app.dictionary.currentPage--;
                app.dictionary.displayPagedWords(this);
            }
        });
        
        this.nextPageButton.addEventListener('click', () => {
            if (app.dictionary.currentPage < app.dictionary.totalPages) {
                app.dictionary.currentPage++;
                app.dictionary.displayPagedWords(this);
            }
        });
        
        // Accept button event
        this.acceptButton.addEventListener('click', () => {
            console.log('Accept button clicked');
            console.log('Current word data in app:', app.currentWordData);
            app.saveWord();
        });
        
        // Reject button event
        this.rejectButton.addEventListener('click', () => {
            console.log('Reject button clicked');
            app.rejectWord();
        });
        
        this.saveSettingsButton.addEventListener('click', () => {
            app.saveSettings();
        });
        
        this.backupDataButton.addEventListener('click', () => {
            app.backupDictionary();
        });
        
        this.importDataButton.addEventListener('click', () => {
            this.importFileInput.click();
        });
        
        this.importFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                app.importDictionary(e.target.files[0]);
            }
        });
        
        this.clearHistoryButton.addEventListener('click', () => {
            app.clearHistory();
        });
        
        console.log('UI event bindings complete');
    }

    // Navigation methods
    showSection(section) {
        // Hide all sections
        this.homeSection.classList.add('hidden');
        this.savedWordsSection.classList.add('hidden');
        this.settingsSection.classList.add('hidden');
        
        // Show the requested section
        section.classList.remove('hidden');
        
        // Close mobile menu
        this.navMenu.classList.remove('active');
    }
    
    setActiveNavLink(link) {
        // Remove active class from all links
        this.homeLink.classList.remove('active');
        this.savedWordsLink.classList.remove('active');
        this.settingsLink.classList.remove('active');
        
        // Add active class to the clicked link
        link.classList.add('active');
    }

    // UI state methods
    showActionButtons() {
        this.actionButtonsContainer.classList.remove('hidden');
        console.log('Action buttons shown');
    }
    
    hideActionButtons() {
        this.actionButtonsContainer.classList.add('hidden');
        console.log('Action buttons hidden');
    }
    
    showLoadingSpinner(word) {
        if (!this.loadingContainer) {
            console.error('Loading container not found in the DOM');
            return;
        }
        
        // Get the loading text element directly
        const loadingText = this.loadingContainer.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `Looking up definition for "${word}"...`;
        } else {
            console.error('Loading text element not found inside loading container');
        }
        
        // Ensure we clear the definition display
        if (this.definitionDisplayElement) {
            this.definitionDisplayElement.innerHTML = '';
        }
        
        // Show the loading container by removing hidden and adding visible
        this.loadingContainer.classList.remove('hidden');
        this.loadingContainer.classList.add('visible');
        console.log(`Loading spinner shown for word: ${word}`);
    }
    
    hideLoadingSpinner() {
        if (!this.loadingContainer) {
            console.error('Loading container not found in the DOM');
            return;
        }
        
        // Get the loading text element directly
        const loadingText = this.loadingContainer.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = '';
        }
        
        // Hide the loading container by adding hidden and removing visible
        this.loadingContainer.classList.remove('visible');
        console.log('Loading spinner hidden');
    }

    updateStatus(message) {
        this.statusElement.textContent = message;
        console.log(`Status updated: ${message}`);
    }

    showWord(word) {
        this.wordDisplayElement.textContent = word;
    }

    // Display methods
    displayDefinition(word, definitions) {
        if (!definitions || definitions.length === 0) {
            this.definitionDisplayElement.innerHTML = `<p>No definitions found for "${word}".</p>`;
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

        this.definitionDisplayElement.innerHTML = html;
        console.log(`Definition displayed for word: ${word}`);
    }

    clearHistoryList() {
        this.historyListElement.innerHTML = '';
    }

    updatePaginationInfo(currentPage, totalPages) {
        this.currentPageElement.textContent = currentPage;
        this.totalPagesElement.textContent = totalPages;
    }

    updatePaginationControls(currentPage, totalPages) {
        // Update previous button state
        this.prevPageButton.disabled = currentPage <= 1;
        
        // Update next button state
        this.nextPageButton.disabled = currentPage >= totalPages;
    }

    addWordToHistory(wordData, deleteCallback) {
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
                this.renderDefinitionContent(definitionContent, wordData.definitions);
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
            deleteCallback(wordData.word);
        });

        this.historyListElement.appendChild(historyItem);
    }
    
    renderDefinitionContent(container, definitions) {
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
    
    // Settings UI methods
    updateSettingsUI(settings) {
        this.voiceLanguageSelect.value = settings.language;
        this.themeSelect.value = settings.theme;
        this.autoSaveToggle.checked = settings.autoSave;
    }
    
    getSettingsFromUI() {
        return {
            language: this.voiceLanguageSelect.value,
            theme: this.themeSelect.value,
            autoSave: this.autoSaveToggle.checked
        };
    }
    
    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}