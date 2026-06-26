class EventManager {
    /**
     * @param {typeof CodePreviewer} app
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Entry point — wires every category of events.
     * Called once during init().
     */
    bindAll() {
        this.bindPrimaryActions();
        this.bindConsoleActions();
        this.bindPreviewDock();
        this.bindModalOverlay();
        this.bindKeyboard();
        this.bindCodeModal();
        this.bindMediaModal();
        this.bindFileActions();
        this.bindSettingsModal();
        this.bindViewportResize();
    }

    // ─── Preview ──────────────────────────────────────────────────────────────

    /**
     * Binds the primary preview action buttons (modal / tab).
     */
    bindPrimaryActions() {
        this.app.dom.modalBtn.addEventListener('click', () => this.app.renderPreview('modal'));
        this.app.dom.tabBtn.addEventListener('click', () => this.app.renderPreview('tab'));
        this.app.dom.closeModalBtn.addEventListener('click', () => this.app.toggleModal(false));
        this.app.dom.refreshPreviewBtn?.addEventListener('click', () => this.app.refreshModalPreview());
    }

    // ─── Console ──────────────────────────────────────────────────────────────

    /**
     * Binds console toggle button and console resize divider.
     */
    bindConsoleActions() {
        this.app.dom.toggleConsoleBtn.addEventListener('click', () => this.app.toggleConsole());
        this.app.dom.consoleResizeDivider?.addEventListener(
            'pointerdown',
            (e) => this.app.startConsoleResize(e)
        );
    }

    // ─── Preview Dock ─────────────────────────────────────────────────────────

    /**
     * Binds dock toggle and resize-divider drag events.
     */
    bindPreviewDock() {
        this.app.dom.dockPreviewBtn?.addEventListener('click', () => this.app.togglePreviewDock());
        this.app.dom.previewDockDivider?.addEventListener(
            'pointerdown',
            (e) => this.app.startPreviewDockResize(e)
        );
    }

    // ─── Modal Overlay ────────────────────────────────────────────────────────

    /**
     * Closes the preview modal when the backdrop is clicked (undocked mode only).
     */
    bindModalOverlay() {
        this.app.dom.modalOverlay.addEventListener('click', (e) => {
            if (this.app.state.isPreviewDocked) return;
            if (e.target === this.app.dom.modalOverlay) this.app.toggleModal(false);
        });
    }

    // ─── Global Keyboard ──────────────────────────────────────────────────────

    /**
     * Binds application-wide keyboard shortcuts.
     */
    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            const { app } = this;
            const activePanel = app.getActiveEditorPanel();

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                app.renderPreview('modal');
                return;
            }

            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                app.focusSidebarSearch();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
                const codeModal = app.dom.codeModal;
                const isCodeModalOpen = codeModal?.getAttribute('aria-hidden') === 'false';
                if (isCodeModalOpen) {
                    e.preventDefault();
                    app.openCodeModalSearch();
                } else if (activePanel) {
                    e.preventDefault();
                    app.openPanelSearch(activePanel);
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e' && activePanel) {
                e.preventDefault();
                app.expandCode(activePanel);
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f' && activePanel) {
                e.preventDefault();
                app.formatPanelCode(activePanel);
                return;
            }

            if (e.key === 'Escape') {
                if (app.dom.modalOverlay.getAttribute('aria-hidden') === 'false') {
                    app.toggleModal(false);
                }
                app.toggleSettingsModal(false);
                if (app.dom.codeModal?.getAttribute('aria-hidden') === 'false') {
                    app.closeCodeModal();
                }
                if (app.dom.mediaModal?.getAttribute('aria-hidden') === 'false') {
                    app.closeMediaModal();
                }
            }
        });
    }

    // ─── Code Modal ───────────────────────────────────────────────────────────

    /**
     * Binds code-view modal close and search actions.
     */
    bindCodeModal() {
        const { app } = this;
        const codeModalCloseBtn = app.dom.codeModal?.querySelector('.close-btn');

        if (codeModalCloseBtn) {
            codeModalCloseBtn.addEventListener('click', () => app.closeCodeModal());
        }

        if (app.dom.codeModal) {
            app.dom.codeModal.addEventListener('click', (e) => {
                if (e.target === app.dom.codeModal) app.closeCodeModal();
            });
        }

        if (app.dom.codeModalDockBtn) {
            app.dom.codeModalDockBtn.addEventListener('click', () => app.toggleCodeModalDockLeft());
        }

        if (app.dom.codeModalSearchBtn) {
            app.dom.codeModalSearchBtn.addEventListener('click', () => app.toggleCodeModalSearch());
        }

        if (app.dom.codeModalSearchInput) {
            app.dom.codeModalSearchInput.addEventListener('input', () => app.searchInCodeModal(false));
            app.dom.codeModalSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    app.searchInCodeModal(true);
                }
            });
        }

        if (app.dom.codeModalSearchNextBtn) {
            app.dom.codeModalSearchNextBtn.addEventListener('click', () => app.searchInCodeModal(true));
        }

        if (app.dom.codeModalSearchCloseBtn) {
            app.dom.codeModalSearchCloseBtn.addEventListener('click', () => app.closeCodeModalSearch());
        }

    }

    // ─── Media Modal ──────────────────────────────────────────────────────────

    /**
     * Binds media preview modal close action.
     */
    bindMediaModal() {
        const { app } = this;
        const mediaModalCloseBtn = app.dom.mediaModal?.querySelector('.close-btn');

        if (mediaModalCloseBtn) {
            mediaModalCloseBtn.addEventListener('click', () => app.closeMediaModal());
        }

        if (app.dom.mediaModal) {
            app.dom.mediaModal.addEventListener('click', (e) => {
                if (e.target === app.dom.mediaModal) app.closeMediaModal();
            });
        }
    }

    // ─── File Actions ─────────────────────────────────────────────────────────

    /**
     * Binds file management toolbar buttons (add, import, export, clear).
     */
    bindFileActions() {
        const { app } = this;

        app.dom.addFileBtn.addEventListener('click', () => app.addNewFile());
        app.dom.addFolderBtn?.addEventListener('click', () => app.addNewFolder());
        app.dom.clearAllFilesBtn?.addEventListener('click', () => app.clearAllFiles());
        app.dom.importFileBtn.addEventListener('click', () => app.importFile());
        app.dom.importFolderBtn?.addEventListener('click', () => app.importFolder());
        app.dom.importZipBtn.addEventListener('click', () => app.importArchive());
        app.dom.exportZipBtn.addEventListener('click', () => app.exportZip());

        app.setupMainHtmlDropdownEvents();

        // Close custom dropdowns when clicking outside their boundaries
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.file-type-dropdown')) app.closeAllFileTypeDropdowns();
            if (!e.target.closest('.settings-select-dropdown')) app.closeAllSettingsSelectDropdowns();
        });

        // Clear active editor panel focus when clicking outside of any file panel
        document.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.editor-panel')) {
                app.clearActiveEditorPanel();
            }
        });

        // Clear active editor panel focus when the user interacts with the preview iframe
        window.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.activeElement === app.dom.previewFrame) {
                    app.clearActiveEditorPanel();
                }
            }, 0);
        });
    }

    // ─── Settings Modal ───────────────────────────────────────────────────────

    /**
     * Binds settings button, settings modal close/backdrop, and all setting controls.
     * Uses a declarative binding table to eliminate repetitive handler blocks.
     */
    bindSettingsModal() {
        const { app } = this;

        app.dom.settingsBtn?.addEventListener('click', () => app.toggleSettingsModal(true));

        if (!app.dom.settingsModal) return;

        // Settings navigation / tab switching
        const navButtons = app.dom.settingsModal.querySelectorAll('.settings-nav-btn');
        const panes = app.dom.settingsModal.querySelectorAll('.settings-pane');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                navButtons.forEach(b => {
                    const isActive = b === btn;
                    b.classList.toggle('active', isActive);
                    b.setAttribute('aria-selected', String(isActive));
                });
                panes.forEach(pane => {
                    const isTarget = pane.id === targetId;
                    pane.hidden = !isTarget;
                });
            });
        });

        // Close on backdrop click / dismiss tooltip on outside click
        app.dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === app.dom.settingsModal) {
                app.toggleSettingsModal(false);
            } else if (!e.target.closest('.settings-info-btn') && !e.target.closest('.settings-tooltip-popover')) {
                app.hideSettingsTooltip();
            }
        });

        // Bind settings info buttons (tooltip toggle, hover, focus)
        const infoBtns = app.dom.settingsModal.querySelectorAll('.settings-info-btn');
        infoBtns.forEach((btn) => {
            btn.setAttribute('aria-expanded', 'false');

            let suppressSyntheticClickUntil = 0;

            btn.addEventListener('pointerup', (e) => {
                if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

                e.preventDefault();
                e.stopPropagation();
                suppressSyntheticClickUntil = Date.now() + 750;
                app.toggleSettingsTooltip(btn);
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (Date.now() < suppressSyntheticClickUntil) {
                    return;
                }
                app.toggleSettingsTooltip(btn);
            });
            btn.addEventListener('mouseenter', () => {
                if (!app.state.settingsTooltip.isPinned) {
                    app.showSettingsTooltip(btn);
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (!app.state.settingsTooltip.isPinned) {
                    app.hideSettingsTooltip();
                }
            });
            btn.addEventListener('focus', () => {
                if (!app.state.settingsTooltip.isPinned) {
                    app.showSettingsTooltip(btn);
                }
            });
            btn.addEventListener('blur', () => {
                if (!app.state.settingsTooltip.isPinned) {
                    app.hideSettingsTooltip();
                }
            });
        });

        // Custom dropdown: open/select
        app.dom.settingsModal.addEventListener('click', (e) => {
            const trigger = e.target.closest('.settings-select-dropdown-trigger');
            if (trigger) {
                app.toggleSettingsSelectDropdown(trigger.closest('.settings-select-dropdown'));
                return;
            }
            const option = e.target.closest('.settings-select-dropdown-option');
            if (option) {
                app.selectSettingsDropdownOption(option.closest('.settings-select-dropdown'), option);
            }
        });

        // Custom dropdown: keyboard navigation
        app.dom.settingsModal.addEventListener('keydown', (e) => {
            const dropdown = e.target.closest('.settings-select-dropdown');
            if (!dropdown) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                app.toggleSettingsSelectDropdown(dropdown, true);
                app.moveSettingsDropdownFocus(dropdown, 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                app.toggleSettingsSelectDropdown(dropdown, true);
                app.moveSettingsDropdownFocus(dropdown, -1);
            } else if (e.key === 'Enter' || e.key === ' ') {
                const option = e.target.closest('.settings-select-dropdown-option');
                if (option) {
                    e.preventDefault();
                    app.selectSettingsDropdownOption(dropdown, option);
                } else if (e.target.closest('.settings-select-dropdown-trigger')) {
                    e.preventDefault();
                    app.toggleSettingsSelectDropdown(dropdown);
                }
            }
        });

        // Close button
        const settingsCloseBtn = app.dom.settingsModal.querySelector('.close-btn');
        if (settingsCloseBtn) {
            settingsCloseBtn.addEventListener('click', () => app.toggleSettingsModal(false));
        }

        // ESC to close (registered once on document to avoid duplicates)
        if (!app.state.settingsEscHandler) {
            app.state.settingsEscHandler = (e) => {
                if (e.key === 'Escape' && app.isSettingsModalOpen()) {
                    const hasOpenDropdown = !!app.dom.settingsModal?.querySelector(
                        '.settings-select-dropdown-trigger[aria-expanded="true"]'
                    );
                    if (hasOpenDropdown) {
                        app.closeAllSettingsSelectDropdowns();
                        return;
                    }
                    app.toggleSettingsModal(false);
                }
            };
            document.addEventListener('keydown', app.state.settingsEscHandler);
        }

        this._bindSettingControls();
    }

    /**
     * Declarative table-driven binding for individual setting controls.
     * Each entry maps a DOM element to a state property and a value reader.
     * This replaces nine near-identical if-block handlers.
     * @private
     */
    _bindSettingControls() {
        const { app } = this;

        /** @type {Array<{domKey: string, stateKey: string, readValue: function, refreshEditors?: boolean}>} */
        const SETTING_BINDINGS = [
            { domKey: 'settingLineNumbers',    stateKey: 'lineNumbers',       readValue: (el) => el.checked,                  refreshEditors: true  },
            { domKey: 'settingLineWrap',        stateKey: 'lineWrapping',      readValue: (el) => el.checked,                  refreshEditors: true  },
            { domKey: 'settingFontSize',        stateKey: 'fontSize',          readValue: (el) => Number(el.value) || 14,      refreshEditors: true  },
            { domKey: 'settingEditorTheme',     stateKey: 'theme',             readValue: (el) => el.value || 'dracula',       refreshEditors: true  },
            { domKey: 'settingTabSize',         stateKey: 'tabSize',           readValue: (el) => Number(el.value) || 4,       refreshEditors: true  },
            { domKey: 'settingIndentWithTabs',  stateKey: 'indentWithTabs',    readValue: (el) => el.checked,                  refreshEditors: true  },
            { domKey: 'settingAutoCloseBrackets', stateKey: 'autoCloseBrackets', readValue: (el) => el.checked,               refreshEditors: true  },
            { domKey: 'settingMatchBrackets',   stateKey: 'matchBrackets',     readValue: (el) => el.checked,                  refreshEditors: true  },
        ];

        const applySetting = (updateFn, { refreshEditors = false } = {}) => {
            updateFn();
            app.state.settings = app.normalizeSettings(app.state.settings);
            app.syncSettingsUI();
            if (refreshEditors) app.applyEditorSettingsToAllEditors();
            app.saveSettings();
        };

        SETTING_BINDINGS.forEach(({ domKey, stateKey, readValue, refreshEditors }) => {
            const el = app.dom[domKey];
            if (!el) return;
            el.addEventListener('change', () => {
                applySetting(() => { app.state.settings[stateKey] = readValue(el); }, { refreshEditors });
            });
        });
    }

    // ─── Viewport Resize ──────────────────────────────────────────────────────

    /**
     * Registers debounced window-resize and visualViewport-resize handlers.
     * Guards against duplicate registration.
     */
    bindViewportResize() {
        const { app } = this;

        if (!app.state.viewportResizeHandler) {
            app.state.viewportResizeHandler = () => {
                clearTimeout(app.state.viewportResizeTimer);
                app.state.viewportResizeTimer = setTimeout(() => {
                    app.updatePanelMoveButtonDirections();
                    app.updateCodeModalHeaderAndButtons();
                    app.updateAdaptiveLayoutMode();
                    app.updateDockedModalCompactModes();
                    if (app.state.settingsTooltip?.activeBtn) {
                        app.positionSettingsTooltip(app.state.settingsTooltip.activeBtn);
                    }
                    app.positionOpenCustomDropdowns();
                }, 80);
            };

            // A single named handler avoids creating a second anonymous wrapper for dock resize.
            const onWindowResize = () => {
                app.state.viewportResizeHandler();
                app.handleDockViewportResize();
            };
            window.addEventListener('resize', onWindowResize);
        }

        if (!app.state.visualViewportResizeHandler && window.visualViewport) {
            app.state.visualViewportResizeHandler = () => {
                app.updatePreviewViewportHeight();
                app.handleDockViewportResize();
                if (app.state.settingsTooltip?.activeBtn) {
                    app.positionSettingsTooltip(app.state.settingsTooltip.activeBtn);
                }
                app.positionOpenCustomDropdowns();
            };
            window.visualViewport.addEventListener('resize', app.state.visualViewportResizeHandler);
            window.visualViewport.addEventListener('scroll', app.state.visualViewportResizeHandler);
        }
    }
}
