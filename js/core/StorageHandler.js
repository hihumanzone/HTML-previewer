class StorageHandler {
    /**
     * @param {typeof CodePreviewer} app
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Reads settings from localStorage and merges them into the current state.
     * Silently ignores missing, malformed, or unreadable data.
     * @returns {void}
     */
    loadSettings() {
        try {
            const raw = localStorage.getItem(this.app.constants.SETTINGS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            this.app.state.settings = this.app.normalizeSettings({
                ...this.app.state.settings,
                ...parsed,
            });
        } catch (error) {
            console.warn('Unable to load settings:', error);
        }
    }

    /**
     * Serializes the current settings object to localStorage.
     * Silently ignores QuotaExceededError and other write failures.
     * @returns {void}
     */
    saveSettings() {
        try {
            localStorage.setItem(
                this.app.constants.SETTINGS_STORAGE_KEY,
                JSON.stringify(this.app.state.settings)
            );
        } catch (error) {
            console.warn('Unable to save settings:', error);
        }
    }
}
