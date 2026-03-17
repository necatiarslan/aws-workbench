import * as vscode from 'vscode';
import * as ui from './UI';
import { Session } from './Session';

// License status interface that represents the current state
export interface LicenseStatus {
    valid: boolean;
    error: string | null;
    product_id: number | null;
    product_name: string | null;
    variant_id: number | null;
    variant_name: string | null;
    customer_name: string | null;
    customer_email: string | null;
    expires_at: string | null; // ISO date string or null for lifetime
    checked_at: number; // Unix timestamp of last validation in seconds
}

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

// In-memory cache of the current license status
let cachedStatus: LicenseStatus | null = null;
let extensionContext: vscode.ExtensionContext | null = null;

export function RegisterLicenseManagementCommands(): void {

    vscode.commands.registerCommand('AwsWorkbench.ActivatePro', () => {
        if (Session.Current?.IsProVersion) {
            ui.showInfoMessage('You already have an active Pro license!');
            return;
        }

        let buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/0aa33140-6754-4a23-bc21-72b2d72ec9ad';
        if (Session.Current?.IsDebugMode()) {
            buyUrl = 'https://necatiarslan.lemonsqueezy.com/checkout/buy/8289ec8d-2343-4e8a-9a03-f398e54881ad';
        }

        vscode.env.openExternal(vscode.Uri.parse(buyUrl));
        vscode.commands.executeCommand('AwsWorkbench.EnterLicenseKey');
    }),

    vscode.commands.registerCommand('AwsWorkbench.EnterLicenseKey', async () => {
        if (Session.Current?.IsProVersion) {
            ui.showInfoMessage('You already have an active Pro license!');
            return;
        }

        await promptForLicense(Session.Current?.Context);
        if (Session.Current) {
            Session.Current.IsProVersion = isLicenseValid();
        }
    }),

    vscode.commands.registerCommand('AwsWorkbench.ResetLicenseKey', async () => {
        await clearLicense();
        ui.showInfoMessage('License key has been reset. Please enter a new license key to activate Pro features.');
        if (Session.Current) {
            Session.Current.IsProVersion = false;
        }
    })

}

/**
 * Initialize the license system
 * Called once from activate()
 * Loads cached license and performs online validation if needed
 */
export async function initializeLicense(context: vscode.ExtensionContext): Promise<void> {
    extensionContext = context;
    
    // Load cached status from globalState
    cachedStatus = context.globalState.get<LicenseStatus | null>(LICENSE_STATUS_KEY, null);
    
    // Check if we have a license key
    const licenseKey = await context.secrets.get(LICENSE_KEY_SECRET);
    if (!licenseKey) {
        // No license key stored, mark as invalid
        cachedStatus = {
            valid: false,
            error: null,
            product_id: null,
            product_name: null,
            variant_id: null,
            variant_name: null,
            customer_name: null,
            customer_email: null,
            expires_at: null,
            checked_at: Date.now(),
        };
        return;
    }
    
    // If we have no cached status or it's been more than 24 hours, validate online
    const now = Date.now();
    if (!cachedStatus || (now - cachedStatus.checked_at) > VALIDATION_INTERVAL_MS) {
        try {
            await validateLicenseOnline(context);
        } catch (error) {
            // Network error - rely on cached status with grace period
            ui.logToOutput('License validation failed, using cached status:', error as Error);
        }
    }
}

/**
 * Validate license online by calling WordPress REST API
 * Updates the cache and returns validation result
 */
export async function validateLicenseOnline(context: vscode.ExtensionContext): Promise<boolean> {
    const licenseKey = await context.secrets.get(LICENSE_KEY_SECRET);
    if (!licenseKey) {
        // No license key, update cache to invalid
        cachedStatus = {
            valid: false,
            error: null,
            product_id: null,
            product_name: null,
            variant_id: null,
            variant_name: null,
            customer_name: null,
            customer_email: null,
            expires_at: null,
            checked_at: Date.now(),
        };
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
        
        const data = await response.json() as { 
            valid: boolean; 
            error?: string | null; 
            product_id?: number; 
            product_name?: string;
            variant_id?: number;
            variant_name?: string;
            customer_name?: string;
            customer_email?: string;
            expires_at?: string; 
            checked_at?: number; 
        };
        
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
            checked_at: data.checked_at || Date.now(),
        };
        
        if(cachedStatus.product_id !== PRODUCT_ID && cachedStatus.product_id !== PRODUCT_ID_QA) {
            ui.logToOutput('License product ID does not match this product.');
            cachedStatus.valid = false;
            cachedStatus.error = 'License is not valid for this product.';
        }

        // Persist to globalState
        await context.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
        
        return cachedStatus.valid;
        
    } catch (error) {
        // Network error or server error - don't update cache
        // Return false if we have no cached status
        ui.logToOutput('License validation error:', error as Error);
        
        if (!cachedStatus) {
            cachedStatus = {
                valid: false,
                error: null,
                product_id: null,
                product_name: null,
                variant_id: null,
                variant_name: null,
                customer_name: null,
                customer_email: null,
                expires_at: null,
                checked_at: Date.now(),
            };
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
export function isLicenseValid(): boolean {
    if (Session.Current?.IsDebugMode()) {
        return true;
    }
    
    if (!cachedStatus) {
        return false;
    }
    
    // Check if server marked license as invalid
    if (!cachedStatus.valid) {
        return false;
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
    const now = Date.now() / 1000; // in seconds
    const daysSinceCheck = (now - cachedStatus.checked_at) / (60 * 60 * 24);
    
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
export function getLicensePlan(): string | null {
    if (!cachedStatus || !isLicenseValid()) {
        return null;
    }
    return cachedStatus.product_name;
}

/**
 * Clear all license data
 * Removes stored license key and cached status
 */
export async function clearLicense(): Promise<void> {
    if (!extensionContext) {
        return;
    }
    
    // Clear license key from secrets
    await extensionContext.secrets.delete(LICENSE_KEY_SECRET);
    
    // Clear cached status
    cachedStatus = {
        valid: false,
        error: null,
        product_id: null,
        product_name: null,
        variant_id: null,
        variant_name: null,
        customer_name: null,
        customer_email: null,
        expires_at: null,
        checked_at: Date.now(),
    };
    
    await extensionContext.globalState.update(LICENSE_STATUS_KEY, cachedStatus);
}

/**
 * Prompt user to enter license key
 * Shows VS Code input box, stores key securely, and validates online
 */
export async function promptForLicense(context: vscode.ExtensionContext): Promise<void> {
    // Show input box for license key
    const licenseKey = await vscode.window.showInputBox({
        prompt: 'Enter your license key',
        placeHolder: 'XXXX-XXXX-XXXX-XXXX',
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
    
    // Store license key securely
    await context.secrets.store(LICENSE_KEY_SECRET, licenseKey.trim());
    
    // Show progress indicator while validating
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Validating license...',
        cancellable: false
    }, async () => {
        // Validate online
        const isValid = await validateLicenseOnline(context);
        
        if(cachedStatus?.customer_email) {
            const email = await vscode.window.showInputBox({
            prompt: 'Enter your Email associated with license key',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Email cannot be empty';
                }
                return null;
                }
            });
            
            if (!email) {
                await clearLicense();
                return;
            }
            if(email.trim() !== cachedStatus.customer_email) {
                vscode.window.showErrorMessage('The provided email does not match the license record.');
                await clearLicense();
                return;
            }
        }
        if (isValid) {
            vscode.window.showInformationMessage(`License activated successfully! Product: ${cachedStatus?.product_name || 'Unknown'}`);
        } else {
            ui.logToOutput('License validation failed:', new Error(cachedStatus?.error || 'Unknown error'));
            vscode.window.showErrorMessage('License validation failed. Please check your license key.');
            // Clear the invalid license
            await clearLicense();
        }
    });
}
