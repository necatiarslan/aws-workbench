"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterLicenseManagementCommands = RegisterLicenseManagementCommands;
exports.initializeLicense = initializeLicense;
exports.validateLicenseOnline = validateLicenseOnline;
exports.isLicenseValid = isLicenseValid;
exports.getLicensePlan = getLicensePlan;
exports.clearLicense = clearLicense;
exports.promptForLicense = promptForLicense;
const vscode = require("vscode");
const node_crypto_1 = require("node:crypto");
const ui = require("./UI");
const Session_1 = require("./Session");
// Storage keys
const LICENSE_KEY_SECRET = 'aws-workbench.licenseKey';
const LICENSE_STATUS_KEY = 'aws-workbench.licenseStatus';
// API endpoint
const LICENSE_API_URL = 'https://www.sairefe.com/wp-json/vscode/v1/license/validate';
// Validation frequency (7 Days)
const VALIDATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const GRACE_PERIOD_DAYS = 7;
const PRODUCT_NAME = 'Aws Workbench';
const PRODUCT_ID = 807044;
const PRODUCT_ID_QA = 807040;
const OFFLINE_VARIANT_NAME = 'Offline Signed License';
const OFFLINE_TOKEN_PREFIX = 'AWB1';
const OFFLINE_TOKEN_VERSION = 1;
// Replace with your Ed25519 public key (SPKI PEM format).
const OFFLINE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAbTluRXY5udoeh0GRkKmcEdi6eh4zWPSG0N8zSJY4zsI=
-----END PUBLIC KEY-----`;
const TRADITIONAL_LICENSE_KEY_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
// In-memory cache of the current license status
let cachedStatus = null;
let extensionContext = null;
function nowUnixSeconds() {
    return Math.floor(Date.now() / 1000);
}
function normalizeCheckedAtSeconds(checkedAt) {
    if (!checkedAt || !Number.isFinite(checkedAt)) {
        return nowUnixSeconds();
    }
    // Handle previous cached values that may have been stored in milliseconds.
    if (checkedAt > 1_000_000_000_000) {
        return Math.floor(checkedAt / 1000);
    }
    return Math.floor(checkedAt);
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function isTraditionalLicenseKey(licenseKey) {
    return TRADITIONAL_LICENSE_KEY_REGEX.test(licenseKey.trim());
}
function fromBase64Url(value) {
    const padded = value
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const padding = padded.length % 4;
    const finalValue = padding === 0 ? padded : `${padded}${'='.repeat(4 - padding)}`;
    return Buffer.from(finalValue, 'base64');
}
function parseOfflineToken(licenseKey) {
    const token = licenseKey.trim();
    const parts = token.split('.');
    let payloadPart;
    let signaturePart;
    if (parts.length === 3 && parts[0] === OFFLINE_TOKEN_PREFIX) {
        payloadPart = parts[1];
        signaturePart = parts[2];
    }
    else if (parts.length === 2) {
        payloadPart = parts[0];
        signaturePart = parts[1];
    }
    else {
        return null;
    }
    try {
        const payloadBytes = fromBase64Url(payloadPart);
        const signatureBytes = fromBase64Url(signaturePart);
        const payload = JSON.parse(payloadBytes.toString('utf8'));
        if (payload.v !== OFFLINE_TOKEN_VERSION) {
            return null;
        }
        if (!payload.email || typeof payload.email !== 'string' || normalizeEmail(payload.email).length === 0) {
            return null;
        }
        return {
            payloadBytes,
            signatureBytes,
            payload: {
                v: payload.v,
                email: payload.email,
            },
        };
    }
    catch {
        return null;
    }
}
function buildInvalidStatus(error, source) {
    return {
        valid: false,
        error,
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_name: null,
        customer_name: null,
        customer_email: null,
        expires_at: null,
        checked_at: nowUnixSeconds(),
        source,
        token_version: source === 'offline' ? OFFLINE_TOKEN_VERSION : null,
    };
}
function buildOfflineValidStatus(email) {
    return {
        valid: true,
        error: null,
        product_id: PRODUCT_ID,
        product_name: PRODUCT_NAME,
        variant_id: null,
        variant_name: OFFLINE_VARIANT_NAME,
        customer_name: null,
        customer_email: normalizeEmail(email),
        expires_at: null,
        checked_at: nowUnixSeconds(),
        source: 'offline',
        token_version: OFFLINE_TOKEN_VERSION,
    };
}
function getOfflinePublicKey() {
    return OFFLINE_PUBLIC_KEY_PEM;
}
function verifyOfflineLicenseToken(licenseKey) {
    const parsed = parseOfflineToken(licenseKey);
    if (!parsed) {
        return {
            valid: false,
            error: 'Offline license format is invalid.',
        };
    }
    const publicKey = getOfflinePublicKey();
    if (!publicKey) {
        return {
            valid: false,
            error: 'Offline public key is not configured in extension source.',
        };
    }
    try {
        const isValid = (0, node_crypto_1.verify)(null, parsed.payloadBytes, publicKey, parsed.signatureBytes);
        if (!isValid) {
            return {
                valid: false,
                error: 'Offline license signature is invalid.',
            };
        }
        return {
            valid: true,
            email: normalizeEmail(parsed.payload.email),
        };
    }
    catch {
        return {
            valid: false,
            error: 'Offline license signature verification failed.',
        };
    }
}
async function validateLicenseOffline(context, licenseKey, enteredEmail) {
    const verification = verifyOfflineLicenseToken(licenseKey);
    if (!verification.valid || !verification.email) {
        cachedStatus = buildInvalidStatus(verification.error || 'Offline license is invalid.', 'offline');
        await context.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
        return false;
    }
    if (enteredEmail && normalizeEmail(enteredEmail) !== verification.email) {
        cachedStatus = buildInvalidStatus('Entered email does not match offline license email.', 'offline');
        await context.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
        return false;
    }
    cachedStatus = buildOfflineValidStatus(verification.email);
    await context.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
    return true;
}
function RegisterLicenseManagementCommands() {
    vscode.commands.registerCommand('AwsWorkbench.ActivatePro', () => {
        if (Session_1.Session.Current?.IsProVersion) {
            ui.showInfoMessage('You already have an active Pro license!');
            return;
        }
        let buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/0aa33140-6754-4a23-bc21-72b2d72ec9ad';
        if (Session_1.Session.Current?.IsDebugMode()) {
            buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/8289ec8d-2343-4e8a-9a03-f398e54881ad';
        }
        vscode.env.openExternal(vscode.Uri.parse(buyUrl));
        vscode.commands.executeCommand('AwsWorkbench.EnterLicenseKey');
    }),
        vscode.commands.registerCommand('AwsWorkbench.EnterLicenseKey', async () => {
            if (Session_1.Session.Current?.IsProVersion) {
                ui.showInfoMessage('You already have an active Pro license!');
                return;
            }
            await promptForLicense(Session_1.Session.Current?.Context);
            if (Session_1.Session.Current) {
                Session_1.Session.Current.IsProVersion = isLicenseValid();
            }
        }),
        vscode.commands.registerCommand('AwsWorkbench.ResetLicenseKey', async () => {
            await clearLicense();
            ui.showInfoMessage('License key has been reset. Please enter a new license key to activate Pro features.');
            if (Session_1.Session.Current) {
                Session_1.Session.Current.IsProVersion = false;
            }
        });
}
/**
 * Initialize the license system
 * Called once from activate()
 * Loads cached license and performs online validation if needed
 */
async function initializeLicense(context) {
    extensionContext = context;
    // Load cached status from globalState
    cachedStatus = context.globalState.get(LICENSE_STATUS_KEY, null);
    // Check if we have a license key
    const licenseKey = await context.secrets.get(LICENSE_KEY_SECRET);
    if (!licenseKey) {
        // No license key stored, mark as invalid
        cachedStatus = buildInvalidStatus(null);
        return;
    }
    const trimmedLicenseKey = licenseKey.trim();
    if (!isTraditionalLicenseKey(trimmedLicenseKey)) {
        const isOfflineValid = await validateLicenseOffline(context, trimmedLicenseKey);
        if (!isOfflineValid) {
            ui.logToOutput('Offline license could not be validated from local token.');
        }
        return;
    }
    // Online UUID keys keep current behavior.
    const now = Date.now();
    const checkedAtMs = normalizeCheckedAtSeconds(cachedStatus?.checked_at) * 1000;
    if (!cachedStatus || (now - checkedAtMs) > VALIDATION_INTERVAL_MS) {
        try {
            await validateLicenseOnline(context);
        }
        catch (error) {
            // Network error - rely on cached status with grace period
            ui.logToOutput('License validation failed, using cached status:', error);
        }
    }
}
/**
 * Validate license online by calling WordPress REST API
 * Updates the cache and returns validation result
 */
async function validateLicenseOnline(context) {
    const licenseKey = await context.secrets.get(LICENSE_KEY_SECRET);
    if (!licenseKey) {
        // No license key, update cache to invalid
        cachedStatus = buildInvalidStatus(null, 'online');
        await context.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
        return false;
    }
    const env = process.env.VSCODE_DEBUG_MODE === 'true' ? 'QA' : 'PROD';
    try {
        // Call the WordPress REST API
        const response = await fetch(LICENSE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                licenseKey: licenseKey,
                machineId: vscode.env.machineId,
                env: env
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Update cache with server response
        cachedStatus = {
            valid: data.valid,
            error: data.error || null,
            product_id: data.product_id || null,
            product_name: data.product_name || null,
            variant_id: data.variant_id || null,
            variant_name: data.variant_name || null,
            customer_name: data.customer_name || null,
            customer_email: data.customer_email || null,
            expires_at: data.expires_at || null,
            checked_at: normalizeCheckedAtSeconds(data.checked_at),
            source: 'online',
            token_version: null,
        };
        if (cachedStatus.product_id !== PRODUCT_ID && cachedStatus.product_id !== PRODUCT_ID_QA) {
            ui.logToOutput('License product ID does not match this product.');
            cachedStatus.valid = false;
            cachedStatus.error = 'License is not valid for this product.';
        }
        // Persist to globalState
        await context.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
        return cachedStatus.valid;
    }
    catch (error) {
        // Network error or server error - don't update cache
        // Return false if we have no cached status
        ui.logToOutput('License validation error:', error);
        if (!cachedStatus) {
            cachedStatus = buildInvalidStatus(null, 'online');
            await context.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
        }
        return false;
    }
}
/**
 * Check if license is valid based on cached status
 * Considers expiration date and grace period
 * Does NOT make network calls
 */
function isLicenseValid() {
    if (Session_1.Session.Current?.IsDebugMode()) {
        return true;
    }
    if (!cachedStatus) {
        return false;
    }
    // Check if server marked license as invalid
    if (!cachedStatus.valid) {
        return false;
    }
    if (cachedStatus.source === 'offline') {
        return !!cachedStatus.customer_email;
    }
    // Check expiration date
    if (cachedStatus.expires_at) {
        const expirationDate = new Date(cachedStatus.expires_at).getTime();
        const now = Date.now();
        if (now > expirationDate) {
            // License expired
            return false;
        }
    }
    // Check grace period for offline usage
    // If last check was more than grace_days ago, consider invalid
    const now = nowUnixSeconds();
    const checkedAt = normalizeCheckedAtSeconds(cachedStatus.checked_at);
    const daysSinceCheck = (now - checkedAt) / (60 * 60 * 24);
    if (daysSinceCheck > GRACE_PERIOD_DAYS) {
        // Grace period expired
        return false;
    }
    return true;
}
/**
 * Get the current license plan
 * Returns null if no valid license
 */
function getLicensePlan() {
    if (!cachedStatus || !isLicenseValid()) {
        return null;
    }
    return cachedStatus.product_name;
}
/**
 * Clear all license data
 * Removes stored license key and cached status
 */
async function clearLicense() {
    if (!extensionContext) {
        return;
    }
    // Clear license key from secrets
    await extensionContext.secrets.delete(LICENSE_KEY_SECRET);
    // Clear cached status
    cachedStatus = buildInvalidStatus(null);
    await extensionContext.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
}
/**
 * Prompt user to enter license key
 * Shows VS Code input box, stores key securely, and validates online
 */
async function promptForLicense(context) {
    // Show input box for license key
    const licenseKey = await vscode.window.showInputBox({
        prompt: 'Enter your license key (UUID for online validation or signed token for offline)',
        placeHolder: 'UUID or signed offline token',
        ignoreFocusOut: true,
        password: false, // Set to true if you want to hide the input
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'License key cannot be empty';
            }
            return null;
        }
    });
    if (!licenseKey) {
        // User cancelled
        return;
    }
    const email = await vscode.window.showInputBox({
        prompt: 'Enter your email associated with this license',
        ignoreFocusOut: true,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Email cannot be empty';
            }
            return null;
        }
    });
    if (!email) {
        return;
    }
    const normalizedLicenseKey = licenseKey.trim();
    // Store license key securely
    await context.secrets.store(LICENSE_KEY_SECRET, normalizedLicenseKey);
    // Show progress indicator while validating
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Validating license...',
        cancellable: false
    }, async () => {
        const isOnlineKey = isTraditionalLicenseKey(normalizedLicenseKey);
        const isValid = isOnlineKey
            ? await validateLicenseOnline(context)
            : await validateLicenseOffline(context, normalizedLicenseKey, email);
        if (isValid && isOnlineKey) {
            if (!cachedStatus?.customer_email) {
                vscode.window.showErrorMessage('Online license validation returned no customer email.');
                await clearLicense();
                return;
            }
            if (normalizeEmail(email) !== normalizeEmail(cachedStatus.customer_email)) {
                vscode.window.showErrorMessage('The provided email does not match the license record.');
                await clearLicense();
                return;
            }
        }
        if (isValid) {
            vscode.window.showInformationMessage(`License activated successfully! Product: ${cachedStatus?.product_name || 'Unknown'}`);
        }
        else {
            ui.logToOutput('License validation failed:', new Error(cachedStatus?.error || 'Unknown error'));
            vscode.window.showErrorMessage(cachedStatus?.error || 'License validation failed. Please check your license key.');
            // Clear the invalid license
            await clearLicense();
        }
    });
}
//# sourceMappingURL=License.js.map