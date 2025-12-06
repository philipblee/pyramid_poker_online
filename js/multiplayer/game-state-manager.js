//game-state-manager.js handles game transitions for multi-human, multi-device coordination

async function handleTableStateChange(tableState) {
    // ⭐ ADD THIS LINE:
    window.game.tableState = tableState;

    console.log('🎮 Handling table state change:', tableState);

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
            setTableState(TABLE_STATES.COUNTDOWN);
            break;

        case TABLE_STATES.COUNTDOWN:
            console.log('⏱️ Starting countdown phase...');
            if (window.isOwner) {
                await transitionToCountdownPhase();
            } else {
                await displayCountdownOnly();  // ADD THIS
            }
            break;

        case TABLE_STATES.DEALING:
            console.log('🎮 Game started! Moving to dealing phase...');
            transitionToDealingPhase();

            setTimeout(() => {
                // Check variant and branch state flow
                if (gameConfig.config.gameVariant === 'kitty') {
                    console.log('🎮 kitty variant - moving to decision phase');
                    setTableState(TABLE_STATES.DECIDE_PLAYING);
                } else {
                    console.log('🎮 No-surrender - moving directly to playing phase');
                    transitionToPlayingPhase();
                }
            }, 1000);
            break;

        case TABLE_STATES.DECIDE_PLAYING:
            console.log('🎮 Decision phase - players can see 13 cards and decide');
            if (window.game) {
                window.game.loadCurrentPlayerHand();
            }
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
            console.log('🔍 ROUND_COMPLETE - currentRound:', window.game?.currentRound, 'maxRounds:', window.game?.maxRounds);
            console.log('🔍 isOwner:', window.isOwner);

            if (!window.isOwner) {
                closeScoringPopup();
                const waitingEl = document.getElementById('waiting-for-table-owner');
                if (waitingEl) waitingEl.remove();
            } else {
                // Check if tournament is complete
                if (window.game?.currentRound >= window.game?.maxRounds) {
                    console.log('🏆 Tournament complete! Transitioning to TOURNAMENT_COMPLETE');
                    setTableState(TABLE_STATES.TOURNAMENT_COMPLETE);
                } else {
                    console.log('🔍 Owner transitioning to COUNTDOWN for next round');
                    setTableState(TABLE_STATES.COUNTDOWN);
                }
            }
            break;

        case TABLE_STATES.TOURNAMENT_COMPLETE:
            game.showTournamentSummary();
            break;

                default:
                    console.log('🎮 Unknown table state:', tableState);
            }
        }


async function transitionToCountdownPhase() {
    console.log('🔍 transitionToCountdownPhase CALLED');
    const config = window.gameConfig?.config;

    // Only transition UI on first round (coming from NEW_TOURNAMENT)
    // For subsequent rounds, we're already in the game interface
    if (window.game?.currentRound === 0 || !window.game?.currentRound) {
        transitionFromLobbyToDealing();
    }

    const countdownTime = config.countdownTime || 0;
    if (countdownTime > 0) {
        showCountdownModal(countdownTime);

        for (let i = countdownTime; i > 0; i--) {
            updateCountdownNumber(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        hideCountdownModal();
    }

    setTableState(TABLE_STATES.DEALING);
}

async function displayCountdownOnly() {
    console.log('🔍 displayCountdownOnly CALLED (non-owner)');  // ADD THIS
    const config = window.gameConfig?.config;
    const countdownTime = config.countdownTime || 0;
    console.log('🔍 countDownTime:', countdownTime);  // ADD THIS

    if (countdownTime > 0) {
        showCountdownModal(countdownTime);

        for (let i = countdownTime; i > 0; i--) {
            updateCountdownNumber(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        hideCountdownModal();
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
