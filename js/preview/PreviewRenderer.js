class PreviewRenderer {
    /**
     * @param {typeof CodePreviewer} app
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Debounce preview refresh requests to reduce expensive iframe updates while typing.
     */
    scheduleRefresh() {
        const { state } = this.app;
        clearTimeout(state.previewRefreshTimer);

        state.previewRefreshTimer = setTimeout(() => {
            state.previewRefreshTimer = null;
            this.safeRefreshOpenPreviews();
        }, state.previewRefreshDelay);
    }

    /**
     * Triggers a preview render to the requested target.
     * Validates HTML availability before proceeding.
     * @param {'modal'|'tab'} target - Where to display the preview
     */
    render(target) {
        const availability = this.app.getPreviewAvailability();
        if (!availability.allowed) {
            this.app.showNotification('No HTML file found. Import or create an HTML file to preview.', 'warn');
            this.app.updatePreviewActionButtons();
            return;
        }

        // Always revoke previous asset URLs before generating new ones to avoid leaks.
        this.app.revokeTrackedObjectUrls(this.app.state.previewAssetUrls);
        this.app.state.previewBlobUrlCache.clear();
        const content = this.app.generatePreviewContent();

        if (target === 'modal') {
            this.app.consoleBridge.clear();
            this.safeWritePreviewFrame(content);
            this.app.toggleModal(true);
            return;
        }

        if (target === 'tab') {
            try {
                this.app.updatePreviewTab(content, true);
                this.app.showNotification('Preview opened in a new tab.', 'success');
            } catch (error) {
                console.error('Failed to create or open new tab:', error);
                this.app.showNotification('Unable to open preview tab. Check popup settings and try again.', 'error');
            }
        }
    }

    /**
     * Safely refresh already-open preview targets (modal and/or tab).
     * On failure, writes an error document to the iframe instead of silently breaking.
     */
    safeRefreshOpenPreviews() {
        try {
            this.app.refreshOpenPreviews();
        } catch (error) {
            console.error('Preview refresh failed:', error);
            this.app.showNotification('Preview refresh failed. The editor content is unchanged.', 'error');
            this.safeWritePreviewFrame(this.buildPreviewErrorDocument(error));
        }
    }

    /**
     * Writes an HTML string to the preview iframe's srcdoc.
     * On failure, replaces the content with a formatted error document.
     * @param {string} content - Complete HTML document string
     */
    safeWritePreviewFrame(content) {
        if (!this.app.dom.previewFrame) return;

        try {
            this.app.dom.previewFrame.srcdoc = content;
        } catch (error) {
            console.error('Unable to render preview iframe:', error);
            this.app.dom.previewFrame.srcdoc = this.buildPreviewErrorDocument(error);
            this.app.showNotification('Unable to render preview content. See details in preview pane.', 'error');
        }
    }

    /**
     * Builds a self-contained HTML error document for display inside the preview iframe.
     * @param {unknown} error - The caught error value
     * @returns {string} A minimal HTML document string
     */
    buildPreviewErrorDocument(error) {
        const errorText = escapeHtml(error instanceof Error ? error.message : String(error));
        return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Preview Error</title></head><body style="font-family:Arial,sans-serif;background:#121219;color:#f8f8ff;padding:16px;"><h2 style="margin-top:0;">Preview rendering error</h2><p>The preview could not be generated safely.</p><pre style="white-space:pre-wrap;background:#1d1f2e;padding:12px;border-radius:8px;border:1px solid #34364d;">${errorText}</pre></body></html>`;
    }
}

/**
 * Persists and restores user preferences via localStorage.
 * All I/O is wrapped in try/catch so a corrupt or missing entry never
 * prevents the application from starting.
 */