// js/core/tournament-summary.js
// Tournament summary display and post-tournament navigation

PyramidPoker.prototype.showTournamentSummary = function() {
        console.log('🏆 Showing tournament summary...');
//        console.log('📊 roundHistory.length:', this.roundHistory.length);
//        console.log('📊 Full roundHistory:', JSON.stringify(this.roundHistory, null, 2));
//
//        console.log('📊 TOURNAMENT SUMMARY DATA:');
//        console.log('  - roundHistory.length:', this.roundHistory.length);
        this.roundHistory.forEach((round, idx) => {
            console.log(`  - Round ${idx + 1}: roundNumber=${round.roundNumber}, hasChipChanges=${!!round.chipChanges}`);
        });

        // Calculate cumulative chip changes from all completed rounds
        const chipTotals = new Map();
        this.playerManager.players.forEach(player => {
            chipTotals.set(player.name, 0);
        });

        this.roundHistory.forEach(roundData => {
            if (roundData.chipChanges) {
                roundData.chipChanges.forEach((chipChange, playerName) => {
                    const current = chipTotals.get(playerName) || 0;
                    chipTotals.set(playerName, current + chipChange);
                });
            }
        });

        // Create sorted tournament standings by chip changes
        const standings = [...chipTotals.entries()]
            .sort((a, b) => b[1] - a[1])
            .map((entry, index) => ({
                position: index + 1,
                playerName: entry[0],
                totalChipChange: entry[1]
            }));

        // Create tournament summary modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); z-index: 1001;
            display: flex; align-items: center; justify-content: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border-radius: 15px; border: 2px solid #ffd700;
            max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
            color: white; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            padding: 30px; text-align: center;
        `;

        // Build HTML content
        let html = `
            <h1 style="color: #ffd700; margin-bottom: 24px; font-size: 20px;">
                🏆 TOURNAMENT COMPLETE! 🏆
            </h1>
            <div style="background: rgba(255, 215, 0, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                <h2 style="color: #4ecdc4; margin-bottom: 20px;">Final Standings</h2>
        `;

        standings.forEach(standing => {
            const medal = standing.position === 1 ? '🥇' :
                         standing.position === 2 ? '🥈' :
                         standing.position === 3 ? '🥉' : '🏅';
            const bgColor = standing.position === 1 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
            const color = standing.totalChipChange >= 0 ? '#4ecdc4' : '#ff6b6b';
            html += `
                <div style="background: ${bgColor}; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 16px;">${medal} ${standing.position}. ${standing.playerName}</span>
                    <span style="font-size: 14px; font-weight: bold; color: ${color};">${standing.totalChipChange > 0 ? '+' : ''}${standing.totalChipChange}</span>
                </div>
            `;
        });

        html += `</div><div style="background: rgba(52, 73, 94, 0.5); padding: 20px; border-radius: 10px; margin-bottom: 24px;">
            <h3 style="color: #4ecdc4; margin-bottom: 15px;">Round-by-Round Breakdown</h3>
        `;

        for (let round = 1; round <= this.roundHistory.length; round++) {
            const roundData = this.roundHistory[round - 1];
            html += `<div style="margin-bottom: 15px;"><h4 style="color: #ffd700;">Round ${round}</h4>`;

            if (roundData.chipChanges) {
                roundData.chipChanges.forEach((chipChange, playerName) => {
                    const sign = chipChange > 0 ? '+' : '';
                    const color = chipChange > 0 ? '#4ecdc4' : chipChange < 0 ? '#ff6b6b' : '#95a5a6';
                    html += `<div style="color: ${color};">${playerName}: ${sign}${chipChange}</div>`;
                });
            }
            html += `</div>`;
        }

        html += `</div>`;

        const canReturn = gameConfig.config.gameDeviceMode !== 'multi-device' || window.isOwner;

        if (canReturn) {
            html += `
                <button onclick="game.returnToLobbyAfterTournament();"
                        style="background: #4ecdc4; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                    Return to Table
                </button>
            `;
        } else {
            html += `
                <p style="color: #ffd700; margin-top: 20px; font-size: 16px;">
                    Waiting for table owner to continue...
                </p>
            `;
        }

        content.innerHTML = html;
        modal.appendChild(content);
        document.body.appendChild(modal);
    };


PyramidPoker.prototype.returnToLobbyAfterTournament = function() {
        console.log('🔙 Returning to table/lobby...');

        // Close the tournament summary modal
        const modals = document.querySelectorAll('div[style*="position: fixed"]');
        modals.forEach(modal => {
            if (modal.textContent.includes('TOURNAMENT COMPLETE')) {
                modal.remove();
            }
        });

        if (gameConfig.config.gameDeviceMode === 'multi-device') {
            // MULTIPLAYER: Only owner sets state, non-owners just do cleanup
            if (window.isOwner) {
                setTableState(TABLE_STATES.LOBBY);
                console.log('✅ Owner set tableState back to LOBBY');
            } else {
                // Non-owner just does local cleanup
                console.log('✅ Non-owner cleaned up locally');
            }
        } else {
            // SINGLE PLAYER: Reset to waiting state
            this.gameState = 'waiting';
            this.currentRound = 0;
            updateDisplay(this);
            console.log('✅ Single-player returned to waiting');
        }

        // Show table screen for everyone
        showTableScreen();
    };
