//game-state-manager.js handles game transitions for multi-human, multi-device coordination

function transitionFromLobbyToDealing() {
    console.log('🎮 Transitioning from lobby to dealing phase...');

    // Hide lobby UI
    const lobbyView = document.getElementById('lobbyView') ||
                     document.querySelector('.lobby-container') ||
                     document.querySelector('.table-selection');

    if (lobbyView) {
        lobbyView.style.display = 'none';
        console.log('✅ Lobby view hidden');
    }

    // Show game UI
    const gameView = document.getElementById('gameView') ||
                     document.querySelector('.game-area') ||
                     document.getElementById('gameArea');

    if (gameView) {
        gameView.style.display = 'block';
        console.log('✅ Game view shown');
    }

    // Update status
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = 'Game started! Cards are being dealt...';
    }

    // Trigger the game start for this device
    if (typeof launchGameInterface === 'function') {
        console.log('🚀 Launching game interface...');
        launchGameInterface();
    }

    console.log('✅ Transition complete - Player should see game interface');
}

function transitionToPlayingPhase() {
    console.log('🎮 Transitioning to playing phase...');
    // TODO: Enable game controls, show "arrange your cards" message
}

function transitionToScoringPhase() {
    console.log('🎮 Transitioning to scoring phase...');
    // TODO: Show scoring results
}

// Add this function (can go in your main game file or wherever your joinTable function is)
async function handleTableStateChange(tableState) {
    console.log('🎮 Handling table state change:', tableState);

    switch(tableState) {
        case TABLE_STATES.DEALING:
            console.log('🎮 Game started! Moving to dealing phase...');
            transitionFromLobbyToDealing();
            break;

        case TABLE_STATES.PLAYING:
            console.log('🎮 Cards dealt! Players can now arrange hands...');
            transitionToPlayingPhase();
            break;

        case TABLE_STATES.ALL_SUBMITTED:
            console.log('🎮 All players submitted! Moving to scoring...');
            transitionToScoringPhase();
            break;

        case TABLE_STATES.SCORING:
            console.log('🎮 Showing scores...');
            await showMultiDeviceScoringResults();
            break;

                default:
                    console.log('🎮 Unknown table state:', tableState);
            }
        }