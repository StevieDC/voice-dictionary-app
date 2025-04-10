// Settings class for handling user preferences
class Settings {
    constructor() {
        // Default settings
        this.settings = {
            language: 'en-US',
            theme: 'light',
            autoSave: false
        };
    }

    getSetting(key) {
        return this.settings[key];
    }

    loadSettings(db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get('user-settings');

        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result) {
                this.settings = result.data;
                
                // Apply settings to UI
                ui.updateSettingsUI(this.settings);
                
                // Apply theme
                ui.applyTheme(this.settings.theme);
                
                // Initialize speech recognition with saved language
                if (!ui.app.dictionary.recognition) {
                    ui.app.dictionary.initSpeechRecognition(this.settings.language, ui);
                }
            } else {
                // No saved settings, use defaults and initialize
                this.saveSettings(db, ui);
                if (!ui.app.dictionary.recognition) {
                    ui.app.dictionary.initSpeechRecognition(this.settings.language, ui);
                }
            }
        };

        request.onerror = (event) => {
            console.error('Error loading settings:', event.target.error);
            // Initialize with defaults
            if (!ui.app.dictionary.recognition) {
                ui.app.dictionary.initSpeechRecognition(this.settings.language, ui);
            }
        };
    }

    saveSettings(db, ui) {
        if (!db) {
            console.error('Database not initialized');
            return;
        }

        // Get current settings from UI
        this.settings = ui.getSettingsFromUI();

        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        const settingsData = {
            id: 'user-settings',
            data: this.settings
        };

        const request = store.put(settingsData);

        request.onsuccess = () => {
            console.log('Settings saved successfully');
            
            // Apply theme
            ui.applyTheme(this.settings.theme);
            
            // Re-initialize speech recognition with new language
            if (ui.app.dictionary.recognition) {
                ui.app.dictionary.recognition.lang = this.settings.language;
            } else {
                ui.app.dictionary.initSpeechRecognition(this.settings.language, ui);
            }
            
            // Show notification
            ui.updateStatus('Settings saved successfully');
            
            // Return to home screen
            ui.showSection(ui.homeSection);
            ui.setActiveNavLink(ui.homeLink);
        };

        request.onerror = (event) => {
            console.error('Error saving settings:', event.target.error);
        };
    }
}