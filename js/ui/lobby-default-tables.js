// lobby-default-tables.js
// Default table settings and pre-configured tables

(function() {
    'use strict';

let tableSettings = {
    gameConnectMode: 'offline',
    gameDeviceMode: 'single-device',
    gameMode: 'single-human',
    gameVariant: 'no-surrender',
    computerPlayers: 4,
    rounds: 5,
    wildCardCount: 2,
    deckCount: 2,
    winProbabilityMethod: 'tiered2',  // NEW - added AI method
    rounds: 5,           // NEW - changed from totalRounds
    // Table/Lobby settings
    maxPlayers: 6,                   // Maximum players allowed at table (2-6)
    minPlayers: 2,                   // Minimum players to start game
    maxHumanPlayers: 6,              // Maximum number of human players, then join is disabled
    humanPlayers: 0,
    // stakes:
    stakes: 'yes',                   // 'yes', 'no'
    stakesAnteAmount: 10,           // 0, 10, 20, etc.
    stakesMultiplierAmount: 2,      // 0, 1, 2, 3, etc.
    stakesSurrenderAmount: 10,      // 10, 20, etc.
    automaticsAllowed: 'yes',        // NEW
    autoArrangeAllowed: 'yes',       // NEW
    findAutoEnabled: 'yes',       // NEW
    // countdown:
    countdownTime: 3,              // 10, 20, 30, etc.
    tableId: null,                   // For multiplayer table identification
    tableName: ''                   // Display name for table
};

// Update defaultTables array to use new structure:
const defaultTables = [
    {
        id: 1,
        name: '1. SINGLE PLAYER - NO SURRENDER',
        settings: {
                    ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'no-surrender',
                    computerPlayers: 1,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' ,
                    findAutoEnabled: 'yes' },
        icon: '🏓'
    },

    {
        id: 2,
        name: '2. SINGLE PLAYER - KITTY',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'kitty',
                    computerPlayers: 1,
                    rounds: 3,
                    computerPlayers: 2,
                    wildCardCount: 1,
                    winProbabilityMethod: 'netEV' ,
                    findAutoEnabled: 'yes' },
        icon: '🏓'
    },

    {
        id: 3,
        name: '3. SINGLE PLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'no-surrender',
                    computerPlayers: 1,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'tiered2' ,
                    findAutoEnabled: 'no' },
        icon: '🏓'
    },

    {
        id: 4,
        name: '4. SINGLE PLAYER - KITTY',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'kitty',
                    computerPlayers: 1,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'tiered2' ,
                    findAutoEnabled: 'no' },
        icon: '🏓'
    },

    {
        id: 5,
        name: '5. SINGLE PLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'no-surrender',
                    gameConnectMode: 'offline',
                    computerPlayers: 1,
                    rounds: 3,
                    computerPlayers: 5,
                    wildCardCount: 2,
                    winProbabilityMethod: 'tiered2' ,
                    findAutoEnabled: 'yes' },
        icon: '🏓'
    },

    {
        id: 6,
        name: '6. SINGLE PLAYER - NO SURRENDER',
        settings: {

                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'single-human',
                    gameConnectMode: 'offline',
                    gameDeviceMode: 'single-device',
                    gameVariant: 'kitty',
                    computerPlayers: 1,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' ,
                    findAutoEnabled: 'no' },
        icon: '☁️'
    },

    {
        id: 7,
        name: '7. MULTIPLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    gameVariant: 'no-surrender',
                    computerPlayers: 0,
                    wildCardCount: 2,
                    maxPlayers: 6,
                    winProbabilityMethod: 'netEV' ,
                    findAutoEnabled: 'yes' },
        icon: '☁️'
    },

    {
        id: 8,
        name: '8. MULTIPLAYER - KITTY',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    gameVariant: 'kitty',
                    computerPlayers: 0,
                    wildCardCount: 2,
                    maxPlayers: 6,
                    winProbabilityMethod: 'netEV' ,
                    findAutoEnabled: 'yes' },
        icon: '☁️'
    },

    {
        id: 9,
        name: '9. MULTIPLAYER - NO SURRENDER',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    computerPlayers: 5,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' ,
                    findAutoEnabled: 'no' },
        icon: '☁️'
    },

        {
        id: 10,
        name: '10. MULTIPLAYER - KITTY',
        settings: {
                   ...tableSettings,        // ← All defaults (including maxHumanPlayers: 6)
                    gameMode: 'multiple-humans',
                    gameConnectMode: 'online',
                    gameDeviceMode: 'multi-device',
                    computerPlayers: 5,
                    rounds: 3,
                    wildCardCount: 2,
                    winProbabilityMethod: 'netEV' ,
                    findAutoEnabled: 'no' },
        icon: '☁️'
    }

];

    // Export to window
    window.PyramidPokerDefaults = {
        tableSettings: tableSettings,
        defaultTables: defaultTables
    };

})();
