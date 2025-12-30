
export const LEVELS = [
    { min: 0, name: 'Aprendiz', emoji: '🐣', color: '#fbbf24' },
    { min: 1000, name: 'Organizado', emoji: '📝', color: '#60a5fa' },
    { min: 5000, name: 'Poupador', emoji: '🐷', color: '#34d399' },
    { min: 15000, name: 'Investidor', emoji: '📈', color: '#8b5cf6' },
    { min: 50000, name: 'Magnata', emoji: '👑', color: '#f43f5e' },
];

export function calculateLevel(balance, transactionsCount) {
    // XP Calculation: 
    // 1 BRL Balance = 1 XP
    // 1 Transaction = 50 XP (Encourage usage)
    const xp = Math.max(0, Math.floor(balance + (transactionsCount * 50)));

    const levelIndex = LEVELS.findIndex((lvl, i) => {
        const nextLvl = LEVELS[i + 1];
        return xp >= lvl.min && (!nextLvl || xp < nextLvl.min);
    });

    const currentLevel = LEVELS[levelIndex] || LEVELS[0];
    const nextLevel = LEVELS[levelIndex + 1];

    let progress = 0;
    if (nextLevel) {
        progress = Math.min(100, Math.max(0, ((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100));
    } else {
        progress = 100; // Max level
    }

    return {
        xp,
        currentLevel,
        nextLevel,
        progress
    };
}
