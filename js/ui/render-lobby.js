// js/lobby/lobby-renderer.js

function renderLobby() {
    const lobbyContainer = document.getElementById('lobbyTables');
    if (!lobbyContainer) return;

    lobbyContainer.innerHTML = '';

    defaultTables.forEach(table => {
        const isSinglePlayer = table.settings.gameMode === 'single-human';

        const tableCard = document.createElement('div');
        tableCard.className = 'table-card';
        tableCard.dataset.tableId = table.id;

        tableCard.innerHTML = `
            <!-- Table Type Badge -->
            <div class="table-type-badge ${isSinglePlayer ? 'single-player' : 'multi-player'}">
                ${isSinglePlayer ? '🎮 SINGLE-PLAYER' : '👥 MULTI-PLAYER'}
            </div>

            <!-- Table Name -->
            <h3 class="table-name">${table.name}</h3>

            <!-- Quick Settings Display -->
            <div class="table-settings-summary">
                <div class="setting-pill">
                    <span class="setting-label">Variant:</span>
                    <span class="setting-value">${table.settings.gameVariant}</span>
                </div>

                <div class="setting-pill">
                    <span class="setting-label">Rounds:</span>
                    <span class="setting-value">${table.settings.rounds}</span>
                </div>

                <div class="setting-pill">
                    <span class="setting-label">Stakes:</span>
                    <span class="setting-value">${table.settings.stakesAnteAmount}/${table.settings.stakesMultiplierAmount}x</span>
                </div>

                <div class="setting-pill">
                    <span class="setting-label">Automatics:</span>
                    <span class="setting-value">${table.settings.automaticsAllowed === 'yes' ? 'Yes' : 'No'}</span>
                </div>

                <div class="setting-pill">
                    <span class="setting-label">Wilds:</span>
                    <span class="setting-value">${table.settings.wildCardCount}</span>
                </div>

                ${!isSinglePlayer ? `
                    <div class="setting-pill">
                        <span class="setting-label">Players:</span>
                        <span class="setting-value">${table.settings.humanPlayers || 0}/${table.settings.maxPlayers}</span>
                    </div>
                ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="table-actions">
                <button class="btn-edit" onclick="openEditSettingsModal(${table.id})">
                    ⚙️ Edit Settings
                </button>
                <button class="btn-join" onclick="joinTable(${table.id})">
                    ▶️ Join Table
                </button>
            </div>
        `;

        lobbyContainer.appendChild(tableCard);
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    renderLobby();
});
