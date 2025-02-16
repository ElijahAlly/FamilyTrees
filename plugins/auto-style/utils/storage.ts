// * LocalStorage handling

import { STORAGE_KEY } from '../constants';
import type { StyleChange } from '../types';

export const loadHistory = (): StyleChange[] => {
    if (typeof window === 'undefined') return [];

    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Error loading style history:', e);
        return [];
    }
};

export const saveHistory = (history: StyleChange[]) => {
    if (typeof window === 'undefined') return;
    
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Error saving style history:', e);
    }
};