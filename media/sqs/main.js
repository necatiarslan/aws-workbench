// SQS Webview JavaScript Utilities
// Provides utility functions for SQS message viewing and interaction

const vscode = acquireVsCodeApi();

// Format JSON string with proper indentation
function formatJson(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return jsonString;
    }
}

// Check if string is valid JSON
function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

// Escape HTML special characters
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Copy text to clipboard via VS Code API
function copyToClipboard(text) {
    vscode.postMessage({ 
        command: 'copy', 
        text: text 
    });
}

// Show error message in the UI
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    }
}

// Show success message in the UI
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.add('show');
        setTimeout(() => {
            successEl.classList.remove('show');
        }, 3000);
    }
}

// Truncate string with ellipsis
function truncate(str, maxLength) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

// Format timestamp to readable date
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
}

// Format bytes to human readable size
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle incoming messages from extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'error':
            showError(message.message);
            break;
        case 'success':
            showSuccess(message.message);
            break;
        case 'updateContent':
            // Handle content updates
            break;
    }
});
