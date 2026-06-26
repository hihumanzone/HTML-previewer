class NotificationSystem {
    constructor() {
        this.container = null;
        this.progressId = 0;
    }


    /**
     * Returns (and lazily creates) the notification container element.
     * The container is appended once to document.body and reused for all notifications.
     * @returns {HTMLElement}
     */
    getContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.setAttribute('role', 'status');
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'false');
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    show(message, type = 'info') {
        const container = this.getContainer();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-message">${escapeHtml(message)}</span>
                <button class="notification-close-btn" aria-label="Close notification" title="Close">${SVG_ICONS.close}</button>
            </div>
        `;

        container.appendChild(notification);

        // Define dismiss before attaching the close-button listener so the
        // reference is unambiguously resolved (avoids temporal dead zone).
        const dismiss = () => {
            if (notification.classList.contains('notification-hiding')) return;
            notification.classList.add('notification-hiding');
            notification.addEventListener('animationend', () => {
                notification.remove();
            }, { once: true });
        };

        const closeBtn = notification.querySelector('.notification-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', dismiss);
        }

        setTimeout(dismiss, 3000);
    }

    showProgress(message, { type = 'info', total = 100 } = {}) {
        const container = this.getContainer();
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} notification-progress`;
        notification.dataset.progressId = String(++this.progressId);

        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-message">${escapeHtml(message)}</span>
                <button class="notification-close-btn" aria-label="Close notification" title="Close">${SVG_ICONS.close}</button>
            </div>
            <div class="notification-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${Math.max(total, 1)}" aria-valuenow="0">
                <div class="notification-progress-fill"></div>
            </div>
        `;

        container.appendChild(notification);

        const messageEl = notification.querySelector('.notification-message');
        const progressBar = notification.querySelector('.notification-progress-track');
        const progressFill = notification.querySelector('.notification-progress-fill');
        const closeBtn = notification.querySelector('.notification-close-btn');
        let maxValue = Math.max(total, 1);
        let currentValue = 0;

        const dismiss = () => {
            if (notification.classList.contains('notification-hiding')) return;
            notification.classList.add('notification-hiding');
            notification.addEventListener('animationend', () => notification.remove(), { once: true });
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', () => dismiss());
        }

        const update = ({ current, total: nextTotal, message: nextMessage, type: nextType } = {}) => {
            if (typeof nextTotal === 'number' && nextTotal >= 1) {
                maxValue = nextTotal;
                progressBar.setAttribute('aria-valuemax', String(maxValue));
            }
            if (typeof current === 'number') {
                currentValue = Math.max(0, Math.min(current, maxValue));
                const percentage = (currentValue / maxValue) * 100;
                progressFill.style.width = `${percentage}%`;
                progressBar.setAttribute('aria-valuenow', String(currentValue));
            }
            if (typeof nextMessage === 'string' && messageEl) {
                messageEl.textContent = nextMessage;
            }
            if (typeof nextType === 'string') {
                notification.classList.remove('notification-info', 'notification-success', 'notification-warn', 'notification-error');
                notification.classList.add(`notification-${nextType}`);
            }
        };

        update({ current: 0, message });

        return {
            update,
            complete: (doneMessage = 'Completed') => {
                update({ current: maxValue, message: doneMessage, type: 'success' });
                setTimeout(dismiss, 1200);
            },
            fail: (errorMessage = 'Failed') => {
                update({ message: errorMessage, type: 'error' });
                setTimeout(dismiss, 3000);
            },
            dismiss
        };
    }
}
