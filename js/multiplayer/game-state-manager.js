//game-state-manager.js handles game transitions for multi-human, multi-device coordination

async function handleTableStateChange(tableState) {
//    console.log('🎮 Handling table state change:', tableState);

    switch(tableState) {


        case TABLE_STATES.LOBBY:
            console.log('🎮 Returning to lobby/table screen...');
            window.game.returnToTable();
            break;

        case TABLE_STATES.NEW_TOURNAMENT:
            console.log('🎮 Handling NEW_TOURNAMENT state...');
            window.game.initializeTournament();

            // since it's a new tournament, call transition from lobby to dealing
            transitionFromLobbyToDealing();

            // Then transition to DEALING
            setTableState(TABLE_STATES.DEALING);
            break;

        case TABLE_STATES.DEALING:
            console.log('🎮 Game started! Moving to dealing phase...');
            transitionToDealingPhase();

            // After dealing setup, immediately advance to playing
            setTimeout(() => {
//                console.log('🎮 Dealing complete, moving to playing phase...');
                transitionToPlayingPhase();
            }, 1000);
            break;

        case TABLE_STATES.PLAYING:
//            console.log('🎮 Cards dealt! Players can now arrange hands...');
            // transitionToPlayingPhase();

            break;

        case TABLE_STATES.ALL_SUBMITTED:
//            console.log('🎮 All players submitted! Moving to scoring...');
            transitionToScoringPhase();
            break;

        case TABLE_STATES.SCORING:
            if (!window.isOwner) {
                console.log('Non-owner proceeding to scoring with Firebase data...');
                await window.multiDeviceIntegration.proceedToScoring();
            }
            break;

        case TABLE_STATES.ROUND_COMPLETE:
            if (!window.isOwner) {
                closeScoringPopup();
                const waitingEl = document.getElementById('waiting-for-table-owner');
                if (waitingEl) waitingEl.remove();
            }
            break;

        case TABLE_STATES.TOURNAMENT_COMPLETE:
            game.showTournamentSummary();
            break;

                default:
                    console.log('🎮 Unknown table state:', tableState);
            }
        }

function transitionFromLobbyToDealing() {
//    console.log('🎮 Transitioning from lobby to dealing phase...');

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
//        console.log('✅ Game view shown');
    }

    // Update status
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = 'Game started! Cards are being dealt...';
    }

    // Trigger the game start for this device
    if (typeof launchGameInterface === 'function') {
//        console.log('🚀 Launching game interface...');
        launchGameInterface();
    }

//    console.log('✅ Transition complete - Player should see game interface');
}

function transitionToDealingPhase() {
//    console.log('🎮 Transitioning to dealing phase...');

    // ADD THIS - Set state to SCORING:
    if (window.multiDeviceIntegration && window.multiDeviceIntegration.isOwner) {
        setTableState(TABLE_STATES.PLAYING);
    }
}

function transitionToPlayingPhase() {
//    console.log('=== ENTERING transitionToPlayingPhase ===');
//    console.log('🎮 Transitioning to playing phase...');
//
//    console.log('🎮 Transitioning to playing phase...');
//    console.log('🎮 About to call setTableState(PLAYING)');
//
//    console.log('Owner check:', window.isOwner);
    if (window.multiDeviceIntegration && window.isOwner) {
//       console.log('Owner confirmed - setting state to PLAYING');
       setTableState(TABLE_STATES.PLAYING);
    } else {
       console.log('In transitionToPlayingPhase this instance is Not the owner');
    }
    // Enable game controls, show "arrange your cards" message
}

function transitionToScoringPhase() {
//    console.log('🎮 Transitioning to scoring phase...');

    // ADD THIS - Set state to SCORING:
    if (window.multiDeviceIntegration && window.multiDeviceIntegration.isOwner) {
        setTableState(TABLE_STATES.SCORING);
    }
}

// v2 of setTableState which adds a delay
async function setTableState(newState, delayMs = 1000) {
    if (!window.multiDeviceIntegration || !window.isOwner) {
        console.log('❌ Only owner can change table state');
        return;
    }

    const tableId = window.multiDeviceIntegration.tableId;

    console.log('👑 Setting table state (1 second delay)to:', newState, 'for table:', tableId);

    // Delay before writing to Realtime DB
    await new Promise(resolve => setTimeout(resolve, delayMs));

    try {
        await firebase.database().ref(`tables/${tableId}/tableState`).set(newState);
        console.log('✅ State set successfully after delay');
    } catch (error) {
        console.log('❌ Error setting state:', error);
    }
}
``

// Add this function to lobby.js
async function setupLobbyStateListener(tableId) {
    firebase.database().ref(`tables/${tableId}/state/LOBBY_STATE`).on('value', (snapshot) => {
        const lobbyState = snapshot.val();
//        console.log('🏛️ Lobby state changed:', lobbyState);

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

//// In the Continue button click handler
//function TransitionToRoundComplete() {
//    if (window.isOwner) {
//        console.log('Owner clicked Continue on Scoring Popup');
//        transitionToRoundComplete();
//    } else {
//        console.log('Non-owner waiting for owner to click Continue');
//        closeScoringPopup();
//    }
//}
//
//// In game-state-manager.js (or wherever state transitions are defined)
//async function transitionToRoundComplete() {
//    console.log('🔄 Transitioning to ROUND_COMPLETE state...');
//
//    // Only update Realtime Database (what listeners actually read)
//    await firebase.database().ref(`tables/${this.currentTableId}/tableState`).set('round_complete');
//
//    console.log('✅ Successfully transitioned to ROUND_COMPLETE state');
//}
