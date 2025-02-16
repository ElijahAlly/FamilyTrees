// * Color generation utilities

import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../../tailwind.config';
import type { DefaultColors } from 'tailwindcss/types/generated/colors';
import type { TailwindColorObject } from '../types';

const fullConfig = resolveConfig(tailwindConfig) as unknown as {
    theme: { colors: DefaultColors }
};

export const generateBackgroundOptions = () => {
    const colors = fullConfig.theme.colors as unknown as TailwindColorObject;
    const colorGroups: { name: string; class: string; }[][] = [];

    Object.entries(colors).forEach(([colorName, colorValue]) => {
        if (typeof colorValue === 'object' && !Array.isArray(colorValue)) {
            const colorShades = Object.entries(colorValue)
                .filter(([shade]) => !isNaN(Number(shade)) || shade === '950')
                .map(([shade]) => ({
                    name: `${colorName}-${shade}`,
                    class: `bg-${colorName}-${shade}`
                }));

            if (colorShades.length > 0) {
                colorGroups.push(colorShades);
            }
        }
    });

    return colorGroups;
};

export const generateTextColorOptions = () => {
    const colors = fullConfig.theme.colors as unknown as TailwindColorObject;
    const colorGroups: { name: string; class: string; }[][] = [];

    Object.entries(colors).forEach(([colorName, colorValue]) => {
        if (typeof colorValue === 'object' && !Array.isArray(colorValue)) {
            const colorShades = Object.entries(colorValue)
                .filter(([shade]) => !isNaN(Number(shade)) || shade === '950')
                .map(([shade]) => ({
                    name: `${colorName}-${shade}`,
                    class: `text-${colorName}-${shade}`
                }));

            if (colorShades.length > 0) {
                colorGroups.push(colorShades);
            }
        }
    });

    return colorGroups;
};

export const STYLE_OPTIONS = {
    backgrounds: generateBackgroundOptions(),
    text: generateTextColorOptions()
};