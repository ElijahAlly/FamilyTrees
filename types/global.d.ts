export {};

declare global {
    interface Window {
        MyTreesUtils: {
            isDev: boolean;
            confirmDev: () => void;
            isConfirmedDev: () => boolean;
            submitSolution: (solution: (numbers: number[]) => { sum: number, length: number }) => void;
            getLocalStorage: (key: 'family' | 'nuxt-color-mode') => any;
            clearLocalStorage: () => void;
            getAppVersion: () => string | undefined;
            getCurrentTheme: () => 'dark' | 'light' | undefined;
            getAC: () => void;
        }
    }
}

declare module 'pinia' {
    export interface DefineStoreOptionsBase<S, Store> {
        persist?: boolean | {
            key?: string
            pick?: string[] | Path<StateTree>[],
        }
    }
}