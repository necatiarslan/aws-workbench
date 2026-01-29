// Glue webview main.js
// This file is shared by both GlueJobRunView and GlueJobRunsReportView
// The view type is determined by the HTML content

(function() {
    'use strict';
    
    // Common utilities
    function formatDuration(seconds) {
        if (!seconds) return '';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    }
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString();
    }
    
    function getStatusIcon(status) {
        switch (status) {
            case 'SUCCEEDED':
                return 'pass';
            case 'FAILED':
                return 'error';
            case 'RUNNING':
                return 'sync~spin';
            case 'STOPPED':
            case 'STOPPING':
                return 'stop';
            case 'TIMEOUT':
                return 'clock';
            case 'STARTING':
            case 'WAITING':
                return 'loading~spin';
            default:
                return 'circle-outline';
        }
    }
    
    // Export utilities for inline scripts
    window.glueUtils = {
        formatDuration,
        formatDate,
        getStatusIcon
    };
})();
