class Settings {
    constructor() {
        this.settings = {
            language: 'en-US',
            autoSave: false,
            theme: 'light',
            fontSize: 'medium'
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Language selection
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.setSetting('language', e.target.value);
                this.saveSettings();
            });
        }

        // Auto-save toggle
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('change', (e) => {
                this.setSetting('autoSave', e.target.checked);
                this.saveSettings();
            });
        }

        // Theme selection
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setSetting('theme', e.target.value);
                this.applyTheme(e.target.value);
                this.saveSettings();
            });
        }

        // Font size selection
        const fontSizeSelect = document.getElementById('font-size-select');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.setSetting('fontSize', e.target.value);
                this.applyFontSize(e.target.value);
                this.saveSettings();
            });
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('dictionarySettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...parsed };
                this.applySettings();
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('dictionarySettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    getSetting(key) {
        return this.settings[key];
    }

    setSetting(key, value) {
        this.settings[key] = value;
    }

    applySettings() {
        // Apply all current settings
        this.applyTheme(this.settings.theme);
        this.applyFontSize(this.settings.fontSize);
        
        // Update UI elements to match current settings
        this.updateUIElements();
    }

    applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
    }

    applyFontSize(size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
    }

    updateUIElements() {
        // Update language select
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = this.settings.language;
        }

        // Update auto-save toggle
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        if (autoSaveToggle) {
            autoSaveToggle.checked = this.settings.autoSave;
        }

        // Update theme select
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.settings.theme;
        }

        // Update font size select
        const fontSizeSelect = document.getElementById('font-size-select');
        if (fontSizeSelect) {
            fontSizeSelect.value = this.settings.fontSize;
        }
    }
}