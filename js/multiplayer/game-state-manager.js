//game-state-manager.js handles game transitions for multi-human, multi-device coordination

async function handleTableStateChange(tableState) {
    console.log('🎮 Handling table state change:', tableState);

    switch(tableState) {

        case TABLE_STATES.NEW_TOURNAMENT:
            console.log('🎮 Move to NEW_TOURNAMENT phase...');
            window.game.initializeTournament();

            // transition from Lobby to dealing
            transitionFromLobbyToDealing();

            // Then transition to DEALING
            setTableState(TABLE_STATES.DEALING);
            break;

        case TABLE_STATES.DEALING:
            console.log('🎮 Move to DEALING phase...');
            transitionToDealingPhase();

            // After dealing setup, immediately advance to playing
            setTimeout(() => {
                console.log('🎮 Transition to PLAYING ...');
                transitionToPlaying();
            }, 1000);
            break;

        case TABLE_STATES.PLAYING:
            console.log('🎮 Moved to PLAYING phase. Players can arrange hands...');

            // ADD THIS:
            if (window.multiDeviceIntegration && window.multiDeviceIntegration.isOwner) {
                window.multiDeviceIntegration.setupSubmissionListener();
            }
            break;

        case TABLE_STATES.ALL_SUBMITTED:
            console.log('🎮 All players submitted! Transition to scoring...');
            transitionToScoringPhase();
            break;

        case TABLE_STATES.SCORING:
            if (!window.isOwner) {
                console.log('Non-owner proceed to SCORING phase...');
                await window.multiDeviceIntegration.proceedToScoring();
            }

            else {
                console.log('Owner proceed to SCORING phase...');
            }
            break;

        case TABLE_STATES.ROUND_COMPLETE:
            if (!window.isOwner) {
                closeScoringPopup();
                console.log('Owner closeScoringPopup proceed to ROUND COMPLETE...');
                const waitingEl = document.getElementById('waiting-for-table-owner');
                if (waitingEl) waitingEl.remove();
            }
            break;

        case TABLE_STATES.TOURNAMENT_COMPLETE:
            console.log('TOURNAMENT_COMPLETE showTournamentSummary...');
            game.showTournamentSummary();
            break;

                default:
                    console.log('🎮 Unknown table state:', tableState);
            }
        }

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

function transitionToDealingPhase() {
    console.log('🎮 Transitioning to dealing phase...');

    // ADD THIS - Set state to SCORING:
    if (window.multiDeviceIntegration && window.multiDeviceIntegration.isOwner) {
        setTableState(TABLE_STATES.PLAYING);
    }
}

function transitionToPlaying() {
    console.log('=== ENTERING transitionToPlaying ===');

    console.log('🎮 About to call setTableState(PLAYING)');

    console.log('Owner check:', window.isOwner);
    if (window.multiDeviceIntegration && window.isOwner) {
       console.log('Owner confirmed - set tableState to PLAYING');
       setTableState(TABLE_STATES.PLAYING);
    } else {
       console.log('In transitionToPlaying this instance is not the owner');
    }
    // Enable game controls, show "arrange your cards" message
}

function transitionToScoringPhase() {
    console.log('🎮 TransitionToScoringPhase...');

    // ADD THIS - Set state to SCORING:
    if (window.multiDeviceIntegration && window.multiDeviceIntegration.isOwner) {
        setTableState(TABLE_STATES.SCORING);
    }
}

// In game-state-manager.js or wherever global functions are:
async function setTableState(newState) {
    console.log('👑 setTableState called with:', newState);

    if (!window.multiDeviceIntegration || !window.isOwner) {
        console.log('❌ Only owner can change table state');
        return;
    }

    const tableId = window.multiDeviceIntegration.tableId;
    console.log('👑 Setting table state to:', newState, 'for table:', tableId);

    try {
        await firebase.database().ref(`tables/${tableId}/tableState`).set(newState);
        console.log('✅ State set successfully');
    } catch (error) {
        console.log('❌ Error setting state:', error);
    }
}
// Add this function to lobby.js
async function setupLobbyStateListener(tableId) {
    firebase.database().ref(`tables/${tableId}/state/LOBBY_STATE`).on('value', (snapshot) => {
        const lobbyState = snapshot.val();
        console.log('🏛️ Lobby state changed:', lobbyState);

        if (lobbyState === 'ready') {
            // Trigger button update for all players
            const playersSnapshot = firebase.database().ref(`tables/${tableId}/players`).once('value');
            playersSnapshot.then(snapshot => {
                const players = snapshot.val() || {};
                const playersArray = Object.values(players);
                updateStartGameButton(playersArray.length, playersArray);
            });
        }
    });
}

// In the Continue button click handler
function onScoringComplete() {
    if (window.isOwner) {
        console.log('Owner clicked Continue on Scoring Popup');
        transitionToRoundComplete();
    } else {
        console.log('Non-owner waiting for owner to click Continue');
        closeScoringPopup();
    }
}

// In game-state-manager.js (or wherever state transitions are defined)
async function transitionToRoundComplete() {
    console.log('🔄 Transitioning to ROUND_COMPLETE state...');

    // Only update Realtime Database (what listeners actually read)
    await firebase.database().ref(`tables/${this.currentTableId}/tableState`).set('round_complete');

    console.log('✅ Successfully transitioned to ROUND_COMPLETE state');
}
