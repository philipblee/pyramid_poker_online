// js/ui/edit-settings-modal.js

function openEditSettingsModal(tableId) {
    const table = defaultTables.find(t => t.id === tableId);
    if (!table) return;

    const settings = table.settings;

    // Populate form
    document.getElementById('gameVariant').value = settings.gameVariant;
    document.getElementById('rounds').value = settings.rounds;
    document.getElementById('deckCount').value = settings.deckCount;
    document.getElementById('wildCardCount').value = settings.wildCardCount;
    document.getElementById('automaticsAllowed').value = settings.automaticsAllowed || 'yes';
    document.getElementById('autoArrangeAllowed').value = settings.autoArrangeAllowed || 'yes';
    document.getElementById('countdownTime').value = settings.countdownTime;
    document.getElementById('computerPlayers').value = settings.computerPlayers;
    document.getElementById('winProbabilityMethod').value = settings.winProbabilityMethod;
    document.getElementById('stakesAnteAmount').value = settings.stakesAnteAmount;
    document.getElementById('stakesMultiplierAmount').value = settings.stakesMultiplierAmount;
    document.getElementById('stakesSurrenderAmount').value = settings.stakesSurrenderAmount;
    document.getElementById('maxPlayers').value = settings.maxPlayers;

    // Show/hide sections based on table type
    const isSinglePlayer = settings.gameMode === 'single-human';
    const isKitty = settings.gameVariant === 'kitty';

    document.getElementById('aiSection').style.display = isSinglePlayer ? 'block' : 'none';
    document.getElementById('multiplayerSection').style.display = isSinglePlayer ? 'none' : 'block';
    document.getElementById('surrenderRow').style.display = isKitty ? 'flex' : 'none';

    // Store table ID for saving
    window.currentEditingTableId = tableId;

    // Show modal
    document.getElementById('editSettingsModal').style.display = 'flex';
}

function closeEditSettingsModal() {
    document.getElementById('editSettingsModal').style.display = 'none';
    window.currentEditingTableId = null;
}

function saveTableSettings() {
    const tableId = window.currentEditingTableId;
    if (!tableId) return;

    const table = defaultTables.find(t => t.id === tableId);
    if (!table) return;

    // Update settings from form
    table.settings.rounds = parseInt(document.getElementById('rounds').value);
    table.settings.deckCount = parseInt(document.getElementById('deckCount').value);
    table.settings.wildCardCount = parseInt(document.getElementById('wildCardCount').value);
    table.settings.automaticsAllowed = document.getElementById('automaticsAllowed').value;
    table.settings.autoArrangeAllowed = document.getElementById('autoArrangeAllowed').value;
    table.settings.countdownTime = parseInt(document.getElementById('countdownTime').value);
    table.settings.computerPlayers = parseInt(document.getElementById('computerPlayers').value);
    table.settings.winProbabilityMethod = document.getElementById('winProbabilityMethod').value;
    table.settings.stakesAnteAmount = parseInt(document.getElementById('stakesAnteAmount').value);
    table.settings.stakesMultiplierAmount = parseInt(document.getElementById('stakesMultiplierAmount').value);
    table.settings.stakesSurrenderAmount = parseInt(document.getElementById('stakesSurrenderAmount').value);
    table.settings.maxPlayers = parseInt(document.getElementById('maxPlayers').value);

    // Save to localStorage for persistence
    localStorage.setItem('defaultTables', JSON.stringify(defaultTables));

    // Refresh lobby display
    renderLobby();

    // Close modal
    closeEditSettingsModal();

    console.log('✅ Table settings saved:', table.settings);
}

function saveTableSettings() {
    const tableId = window.currentEditingTableId;
    if (!tableId) return;

    const table = defaultTables.find(t => t.id === tableId);
    if (!table) return;

    // Update settings from form
    table.settings.rounds = parseInt(document.getElementById('rounds').value);
    table.settings.deckCount = parseInt(document.getElementById('deckCount').value);
    table.settings.wildCardCount = parseInt(document.getElementById('wildCardCount').value);
    table.settings.automaticsAllowed = document.getElementById('automaticsAllowed').value;
    table.settings.autoArrangeAllowed = document.getElementById('autoArrangeAllowed').value;
    table.settings.countdownTime = parseInt(document.getElementById('countdownTime').value);
    table.settings.computerPlayers = parseInt(document.getElementById('computerPlayers').value);
    table.settings.winProbabilityMethod = document.getElementById('winProbabilityMethod').value;
    table.settings.stakesAnteAmount = parseInt(document.getElementById('stakesAnteAmount').value);
    table.settings.stakesMultiplierAmount = parseInt(document.getElementById('stakesMultiplierAmount').value);
    table.settings.stakesSurrenderAmount = parseInt(document.getElementById('stakesSurrenderAmount').value);
    table.settings.maxPlayers = parseInt(document.getElementById('maxPlayers').value);

    // NEW: Save to localStorage for persistence
    saveTableSettingsToLocalStorage();

    // Refresh lobby display
    renderLobby();

    // Close modal
    closeEditSettingsModal();

    console.log('✅ Table settings saved:', table.settings);
}

// NEW: Helper functions for localStorage
function saveTableSettingsToLocalStorage() {
    const settingsMap = {};
    defaultTables.forEach(table => {
        settingsMap[table.id] = table.settings;
    });
    localStorage.setItem('tableSettings', JSON.stringify(settingsMap));
}

function loadTableSettingsFromLocalStorage() {
    const saved = localStorage.getItem('tableSettings');
    if (!saved) return;

    try {
        const settingsMap = JSON.parse(saved);
        defaultTables.forEach(table => {
            if (settingsMap[table.id]) {
                // Merge saved settings with defaults (in case new settings were added)
                table.settings = { ...table.settings, ...settingsMap[table.id] };
            }
        });
        console.log('✅ Loaded table settings from localStorage');
    } catch (error) {
        console.error('❌ Failed to load settings:', error);
    }
}
