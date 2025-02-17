import { defineNuxtPlugin } from "nuxt/app";

export default defineNuxtPlugin(() => {
    if (process.env.NODE_ENV === 'production') {
        const styles = {
            title: 'font-size: 24px; font-weight: bold; color: #a855f7; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);',
            warning: 'font-size: 16px; color: #ef4444; font-weight: bold;',
            message: 'font-size: 14px; color: #22c55e;',
            code: 'font-size: 12px; color: #3b82f6; background: #1e293b; padding: 2px 0px; border-radius: 4px;',
            challenge: 'font-size: 14px; color: #f59e0b; font-family: monospace;'
        };

        console.clear();
        console.log('%cWelcome to MyTrees.Family! 🌲🌳🌴', styles.title);
        console.log('%c⚠️ WARNING:', styles.warning, 'If someone told you to copy or paste something here, STOP! 🛑 There\'s a 99.9% chance you\'re being scammed!');
        console.log('\n%c👩‍💻 Are you a developer?', styles.message);
        console.log('%cType %cMyTreesUtils.confirmDev()%c to access developer utilities',
            styles.message,
            styles.code,
            styles.message
        );

        // Define helper functions
        window.MyTreesUtils = {
            isDev: false,
            confirmDev: () => {
                if (window.MyTreesUtils.isDev) {
                    console.log('%cYou\'re already confirmed as a developer!', styles.message);
                    window.MyTreesUtils.getAC();
                    return;
                }

                const response = confirm('Are you sure you\'re a developer? This will enable developer utilities.');

                if (response) {
                    console.clear();
                    console.log('%cWelcome, potential dev! 🚀', styles.title);
                    console.log('%cLet\'s verify your coding skills with a quick challenge:', styles.message);
                    console.log(`
%cComplete this function:

MyTreesUtils.submitSolution(function(numbers) {  
    // Your code here  
    // Should return an object with:  
    // - sum: sum of all numbers  
    // - length: length of array
});

Example:
Input: [1, 2, 3, 4]
Expected Output: { sum: 10, length: 4 }
`, styles.challenge);
                } else {
                    console.log('%cAccess denied. Only developers should use these utilities.', styles.warning);
                }
            },
            isConfirmedDev: (): boolean => {
                if (!window.MyTreesUtils.isDev) {
                    console.log('%cPlease confirm you\'re a developer first with MyTreesUtils.confirmDev()', styles.warning);
                    return false;
                } else {
                    return true;
                }
            },
            submitSolution: (solution: (numbers: number[]) => { sum: number, length: number }) => {
                try {
                    // Test cases
                    const testCases = [
                        { input: [1, 2, 3, 4], expected: { sum: 10, length: 4 } },
                        { input: [], expected: { sum: 0, length: 0 } },
                        { input: [-1, 1], expected: { sum: 0, length: 2 } }
                    ];

                    let allPassed = true;

                    testCases.forEach((testCase, index) => {
                        const result = solution(testCase.input);
                        const passed = result.sum === testCase.expected.sum &&
                            result.length === testCase.expected.length;

                        console.log(`%cTest case ${index + 1}:`, styles.message);
                        console.log('Input:', testCase.input);
                        console.log('Your output:', result);
                        console.log('Expected:', testCase.expected);
                        console.log(passed ? '%c✓ Passed' : '%c✗ Failed', passed ? styles.message : styles.warning);

                        if (!passed) allPassed = false;
                    });

                    if (allPassed) {
                        window.MyTreesUtils.isDev = true;
                        console.log('%c🎉 Congratulations! You\'ve proven your dev skills!', styles.title);
                        console.log('%cHere are your developer utilities:', styles.message);
                        window.MyTreesUtils.getAC();
                        console.log('\n%c💡 Happy debugging! If you find any issues, please report them at: https://github.com/ElijahAlly/FamilyTrees', styles.message);
                        
                        // TODO: Add harder tests :) add at least 9 more problems with increasing difficulty
                        // console.log('Was that too easy? Ask for a harder one :) ');
                    } else {
                        console.log('%c🤔 Not quite right. Try again!', styles.warning);
                    }
                } catch (error) {
                    console.log('%c❌ Error in your solution:', styles.warning);
                    console.error(error);
                }
            },
            getLocalStorage: (key: 'family' | 'nuxt-color-mode') => {
                if (!window.MyTreesUtils.isConfirmedDev()) return;

                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : null;
                } catch (err) {
                    console.error('Error reading from localStorage:', err);
                    return null;
                }
            },
            clearLocalStorage: () => {
                if (!window.MyTreesUtils.isConfirmedDev()) return;

                try {
                    localStorage.clear();
                    console.log('%cLocalStorage cleared successfully!', styles.message);
                } catch (err) {
                    console.error('Error clearing localStorage:', err);
                }
            },
            getAppVersion: () => {
                if (!window.MyTreesUtils.isConfirmedDev()) return;

                return process.env.NUXT_APP_VERSION || '1.0.0';
            },
            getCurrentTheme: () => {
                if (!window.MyTreesUtils.isConfirmedDev()) return;

                return document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
            },
            getAC: () => {
                if (!window.MyTreesUtils.isConfirmedDev()) return;
                
                console.log(`
%cAvailable Commands:

MyTreesUtils.getLocalStorage(key) - Get item from localStorage
MyTreesUtils.clearLocalStorage() - Clear all localStorage
MyTreesUtils.getAppVersion() - Get current app version
MyTreesUtils.getCurrentTheme() - Get current theme
MyTreesUtils.getAC() - Show this helper message`, 
                    styles.code
                );
            }
        };
    }
});