// DynamoDB Webview Shared JavaScript Utilities

(function() {
    'use strict';

    // VS Code API
    const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

    /**
     * Format a DynamoDB value for display
     * @param {Object} value - DynamoDB AttributeValue
     * @returns {string} - Formatted display string
     */
    function formatDynamoDBValue(value) {
        if (!value) return '<span class="null-value">-</span>';
        
        const type = Object.keys(value)[0];
        const val = value[type];
        
        switch (type) {
            case 'NULL':
                return '<span class="null-value">NULL</span>';
            case 'S':
                return escapeHtml(String(val));
            case 'N':
                return '<span class="number-value">' + val + '</span>';
            case 'BOOL':
                return '<span class="bool-value">' + (val ? 'true' : 'false') + '</span>';
            case 'B':
                return '<span class="binary-value">[Binary]</span>';
            case 'SS':
            case 'NS':
            case 'BS':
                return '<span class="set-value">' + escapeHtml(JSON.stringify(val)) + '</span>';
            case 'M':
            case 'L':
                const jsonStr = JSON.stringify(val);
                const truncated = jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
                return '<span class="complex-value" title="' + escapeHtml(jsonStr) + '">' + escapeHtml(truncated) + '</span>';
            default:
                return escapeHtml(JSON.stringify(value));
        }
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Convert JavaScript value to DynamoDB AttributeValue format
     * @param {any} value - Value to convert
     * @param {string} type - DynamoDB type (S, N, BOOL, etc.)
     * @returns {Object} - DynamoDB AttributeValue
     */
    function toDynamoDBFormat(value, type) {
        switch (type) {
            case 'S':
                return { S: String(value) };
            case 'N':
                return { N: String(value) };
            case 'BOOL':
                return { BOOL: value === true || value === 'true' };
            case 'NULL':
                return { NULL: true };
            case 'B':
                return { B: value };
            case 'SS':
                return { SS: Array.isArray(value) ? value : [value] };
            case 'NS':
                return { NS: Array.isArray(value) ? value.map(String) : [String(value)] };
            case 'M':
                return { M: typeof value === 'string' ? JSON.parse(value) : value };
            case 'L':
                return { L: typeof value === 'string' ? JSON.parse(value) : value };
            default:
                return { S: String(value) };
        }
    }

    /**
     * Extract raw value from DynamoDB AttributeValue
     * @param {Object} dynamoValue - DynamoDB AttributeValue
     * @returns {any} - Raw value
     */
    function fromDynamoDBFormat(dynamoValue) {
        if (!dynamoValue) return null;
        
        const type = Object.keys(dynamoValue)[0];
        const val = dynamoValue[type];
        
        switch (type) {
            case 'NULL':
                return null;
            case 'BOOL':
                return val;
            case 'N':
                return parseFloat(val);
            case 'S':
            case 'B':
                return val;
            case 'SS':
            case 'NS':
            case 'BS':
            case 'M':
            case 'L':
                return val;
            default:
                return val;
        }
    }

    /**
     * Get the DynamoDB type from an AttributeValue
     * @param {Object} dynamoValue - DynamoDB AttributeValue
     * @returns {string} - Type code
     */
    function getDynamoDBType(dynamoValue) {
        if (!dynamoValue) return 'NULL';
        return Object.keys(dynamoValue)[0];
    }

    /**
     * Show error message in the UI
     * @param {string} message - Error message
     */
    function showError(message) {
        const el = document.getElementById('errorMessage');
        if (el) {
            el.textContent = message;
            el.classList.add('show');
        }
    }

    /**
     * Hide error message
     */
    function hideError() {
        const el = document.getElementById('errorMessage');
        if (el) {
            el.classList.remove('show');
        }
    }

    /**
     * Show success message in the UI
     * @param {string} message - Success message
     */
    function showSuccess(message) {
        const el = document.getElementById('successMessage');
        if (el) {
            el.textContent = message;
            el.classList.add('show');
        }
    }

    /**
     * Hide success message
     */
    function hideSuccess() {
        const el = document.getElementById('successMessage');
        if (el) {
            el.classList.remove('show');
        }
    }

    /**
     * Post message to VS Code extension
     * @param {Object} message - Message object
     */
    function postMessage(message) {
        if (vscode) {
            vscode.postMessage(message);
        }
    }

    /**
     * Format bytes to human readable string
     * @param {number} bytes - Bytes count
     * @returns {string} - Formatted string
     */
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date to locale string
     * @param {Date|string|number} date - Date to format
     * @returns {string} - Formatted date string
     */
    function formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleString();
    }

    // Expose utilities globally
    window.DynamoDBUtils = {
        formatDynamoDBValue,
        escapeHtml,
        toDynamoDBFormat,
        fromDynamoDBFormat,
        getDynamoDBType,
        showError,
        hideError,
        showSuccess,
        hideSuccess,
        postMessage,
        formatBytes,
        formatDate
    };
})();
