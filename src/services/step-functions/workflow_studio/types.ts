/**
 * Types for Workflow Studio View
 */

export enum WorkflowMode {
    Editable = 'editable',
    Readonly = 'readonly',
}

export interface WebviewContext {
    stepFuncName: string
    mode: WorkflowMode
    panel: import('vscode').WebviewPanel
    aslDefinition: any
    extensionUri: import('vscode').Uri
}

export enum MessageType {
    REQUEST = 'REQUEST',
    RESPONSE = 'RESPONSE',
    BROADCAST = 'BROADCAST',
}

export enum Command {
    INIT = 'INIT',
    CLOSE = 'CLOSE',
}

export interface Message {
    command: Command
    messageType: MessageType
}

export interface InitMessage extends Message {
    command: Command.INIT
    messageType: MessageType.REQUEST
}

export interface CloseMessage extends Message {
    command: Command.CLOSE
    messageType: MessageType.REQUEST
}
