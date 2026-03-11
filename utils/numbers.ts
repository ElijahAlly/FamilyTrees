export const getRandomNumber = (min: number, max: number, decimals: number = 2): number => {
    return Number((Math.random() * (max - min) + min).toFixed(decimals));
}