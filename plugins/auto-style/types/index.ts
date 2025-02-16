export * from './global';

export interface StyleChange {
    elementId: string;
    elementPath: string;
    filePath: string;
    oldStyle: string;
    newStyle: string;
    timestamp: number;
}

export interface StyleState {
    isActive: boolean;
    selectedElement: HTMLElement | null;
    originalStyles: Map<HTMLElement, string>;
    styleHistory: StyleChange[];
    styleMenuVisible: boolean;
    showingWarningToast: boolean;
    currentOpenDropdown: HTMLDivElement | null;
    menuBlurLevel: number;
}

export interface StyleUpdateResponse {
    success: boolean;
    message: string;
}

export type ColorValue = string | Record<string, string>;
export type TailwindColorObject = Record<string, ColorValue>;
