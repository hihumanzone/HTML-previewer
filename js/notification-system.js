/**
 * Notification System
 * Handles displaying toast notifications to the user
 */

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - The notification type ('info', 'success', 'warn', 'error')
 */
export function show(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: var(--secondary-color);
            color: var(--primary-color); padding: 1rem; border-radius: 8px;
            border: 1px solid var(--border-color); z-index: 2000; opacity: 0;
            transform: translateX(100%); transition: all 0.3s ease; max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.className = `notification-${type}`;
    
    const colors = {
        success: { border: 'var(--accent-color)', bg: 'rgba(137, 180, 250, 0.1)' },
        warn: { border: 'var(--warn-color)', bg: 'rgba(250, 179, 135, 0.1)' },
        error: { border: 'var(--error-color)', bg: 'rgba(243, 139, 168, 0.1)' }
    };
    
    if (colors[type]) {
        notification.style.borderColor = colors[type].border;
        notification.style.background = colors[type].bg;
    }
    
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
    }, 3000);
}
