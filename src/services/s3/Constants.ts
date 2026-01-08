/**
 * Application Constants
 * 
 * Centralized location for all magic numbers and strings
 * 
 * @module Constants
 */

/**
 * AWS S3 related constants
 */
export const S3_CONSTANTS = {
    /** Maximum number of keys to fetch per S3 ListObjects request */
    MAX_KEYS_PER_REQUEST: 100,
    
    /** Default region for S3 operations */
    DEFAULT_REGION: 'us-east-1',
    
    /** S3 URI scheme */
    URI_SCHEME: 's3://',
    
    /** S3 HTTPS URL base */
    HTTPS_URL_BASE: 'https://',
    
    /** S3 URL suffix */
    URL_SUFFIX: '.s3.amazonaws.com/',
    
    /** ARN prefix */
    ARN_PREFIX: 'arn:aws:s3:::',
    
    /** Folder delimiter */
    FOLDER_DELIMITER: '/',
    
    /** Root folder key */
    ROOT_FOLDER_KEY: '',
} as const;

/**
 * Search and pagination constants
 */
export const SEARCH_CONSTANTS = {
    /** Default maximum number of search results */
    DEFAULT_MAX_RESULTS: 100,
    
    /** Maximum search depth for recursive operations */
    MAX_SEARCH_DEPTH: 10,
} as const;

/**
 * UI related constants
 */
export const UI_CONSTANTS = {
    /** Output channel name for general output */
    OUTPUT_CHANNEL_NAME: 'AwsS3-Extension',
    
    /** Output channel name for logs */
    LOG_CHANNEL_NAME: 'AwsS3-Log',
    
    /** Separator for multi-line messages */
    MESSAGE_SEPARATOR: ' | ',
    
    /** Maximum lines to display in tree view */
    MAX_TREE_VIEW_LINES: 800,
} as const;

/**
 * File operation constants
 */
export const FILE_CONSTANTS = {
    /** Invalid filename characters regex */
    INVALID_FILENAME_CHARS: /[<>:"/\\|?*\x00-\x1F]/g,
    
    /** Invalid unicode control characters regex */
    INVALID_UNICODE_CHARS: /[\u{80}-\u{9F}]/gu,
    
    /** Replacement character for invalid chars */
    REPLACEMENT_CHAR: '_',
    
    /** File extension separator */
    EXTENSION_SEPARATOR: '.',
} as const;

/**
 * Size units for file size display
 */
export const SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * AWS environment variable names
 */
export const AWS_ENV_VARS = {
    /** AWS profile environment variable */
    PROFILE: 'AWS_PROFILE',
    
    /** AWS shared credentials file path */
    CREDENTIALS_PATH: 'AWS_SHARED_CREDENTIALS_FILE',
    
    /** Home directory environment variables */
    HOME: 'HOME',
    USER_PROFILE: 'USERPROFILE',
    HOME_PATH: 'HOMEPATH',
    HOME_DRIVE: 'HOMEDRIVE',
} as const;

/**
 * AWS configuration file paths
 */
export const AWS_CONFIG = {
    /** Default credentials file name */
    CREDENTIALS_FILE: 'credentials',
    
    /** Default config file name */
    CONFIG_FILE: 'config',
    
    /** AWS config directory */
    CONFIG_DIR: '.aws',
    
    /** Default home drive for Windows */
    DEFAULT_HOME_DRIVE: 'C:',
} as const;

/**
 * Extension state keys
 */
export const STATE_KEYS = {
    AWS_PROFILE: 'AwsProfile',
    FILTER_STRING: 'FilterString',
    SHOW_ONLY_FAVORITE: 'ShowOnlyFavorite',
    SHOW_HIDDEN_NODES: 'ShowHiddenNodes',
    BUCKET_LIST: 'BucketList',
    SHORTCUT_LIST: 'ShortcutList',
    VIEW_TYPE: 'ViewType',
    AWS_ENDPOINT: 'AwsEndPoint',
    AWS_REGION: 'AwsRegion',
    BUCKET_PROFILE_LIST: 'BucketProfileList',
} as const;

/**
 * Command names
 */
export const COMMANDS = {
    REFRESH: 'aws-workbench.s3.Refresh',
    FILTER: 'aws-workbench.s3.Filter',
    SHOW_ONLY_FAVORITE: 'aws-workbench.s3.ShowOnlyFavorite',
    SHOW_HIDDEN_NODES: 'aws-workbench.s3.ShowHiddenNodes',
    ADD_TO_FAV: 'aws-workbench.s3.AddToFav',
    DELETE_FROM_FAV: 'aws-workbench.s3.DeleteFromFav',
    HIDE_NODE: 'aws-workbench.s3.HideNode',
    UNHIDE_NODE: 'aws-workbench.s3.UnHideNode',
    SHOW_ONLY_IN_THIS_PROFILE: 'aws-workbench.s3.ShowOnlyInThisProfile',
    SHOW_IN_ANY_PROFILE: 'aws-workbench.s3.ShowInAnyProfile',
    ADD_BUCKET: 'aws-workbench.s3.AddBucket',
    REMOVE_BUCKET: 'aws-workbench.s3.RemoveBucket',
    GOTO: 'aws-workbench.s3.Goto',
    REMOVE_SHORTCUT: 'aws-workbench.s3.RemoveShortcut',
    ADD_SHORTCUT: 'aws-workbench.s3.AddShortcut',
    COPY_SHORTCUT: 'aws-workbench.s3.CopyShortcut',
    SHOW_S3_EXPLORER: 'aws-workbench.s3.ShowS3Explorer',
    SHOW_S3_SEARCH: 'aws-workbench.s3.ShowS3Search',
    SELECT_AWS_PROFILE: 'aws-workbench.s3.SelectAwsProfile',
    UPDATE_AWS_ENDPOINT: 'aws-workbench.s3.UpdateAwsEndPoint',
    SET_AWS_REGION: 'aws-workbench.s3.SetAwsRegion',
    TEST_AWS_CONNECTION: 'aws-workbench.s3.TestAwsConnection',
} as const;

/**
 * Tree item context values
 */
export const CONTEXT_VALUES = {
    BUCKET: 'Bucket',
    SHORTCUT: 'Shortcut',
    FAV: 'Fav',
    NOT_FAV: '!Fav',
    HIDDEN: 'Hidden',
    NOT_HIDDEN: '!Hidden',
    PROFILE: 'Profile',
    NO_PROFILE: 'NoProfile',
} as const;

/**
 * Icon names
 */
export const ICONS = {
    PACKAGE: 'package',
    FILE_SYMLINK_DIRECTORY: 'file-symlink-directory',
    CIRCLE_OUTLINE: 'circle-outline',
    REFRESH: 'refresh',
    FILTER: 'filter',
    BOOKMARK: 'bookmark',
    EYE_CLOSED: 'eye-closed',
    ADD: 'add',
    PREVIEW: 'preview',
    SEARCH: 'search',
    ACCOUNT: 'account',
} as const;

/**
 * Time constants
 */
export const TIME_CONSTANTS = {
    /** Milliseconds in a second */
    MS_PER_SECOND: 1000,
    
    /** Seconds in a minute */
    SECONDS_PER_MINUTE: 60,
    
    /** Minutes in an hour */
    MINUTES_PER_HOUR: 60,
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
    /** Maximum number of retry attempts */
    MAX_RETRIES: 3,
    
    /** Initial retry delay in milliseconds */
    INITIAL_DELAY_MS: 1000,
    
    /** Backoff multiplier */
    BACKOFF_MULTIPLIER: 2,
    
    /** Maximum delay in milliseconds */
    MAX_DELAY_MS: 10000,
} as const;

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
    /** Date format YYYY-MM-DD */
    DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
    /** Default AWS profile name */
    AWS_PROFILE: 'default',
    
    /** Default filter string */
    FILTER_STRING: '',
    
    /** Default show only favorite */
    SHOW_ONLY_FAVORITE: false,
    
    /** Default show hidden nodes */
    SHOW_HIDDEN_NODES: false,
} as const;

/**
 * Webview panel IDs
 */
export const WEBVIEW_PANELS = {
    S3_EXPLORER: 'S3Explorer',
    S3_SEARCH: 'S3Search',
} as const;

/**
 * Webview panel titles
 */
export const WEBVIEW_TITLES = {
    S3_EXPLORER: 'S3 Explorer',
    S3_SEARCH: 'S3 Search',
} as const;

/**
 * User confirmation strings
 */
export const CONFIRMATIONS = {
    DELETE: ['delete', 'd'],
} as const;

/**
 * Type guard to check if a value is a valid confirmation
 */
export function isValidDeleteConfirmation(value: string): boolean {
    return CONFIRMATIONS.DELETE.includes(value.toLowerCase() as any);
}
