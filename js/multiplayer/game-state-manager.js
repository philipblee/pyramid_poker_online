//game-state-manager.js handles game transitions for multi-human, multi-device coordination

async function handleTableStateChange(tableState) {
    // ⭐ ADD THIS LINE:
    window.game.tableState = tableState;

    console.log('🎮 Handling table state change:', tableState);

    switch(tableState) {

        case TABLE_STATES.LOBBY:
            console.log('🎮 Tournament complete - staying at table...');
            // Close tournament summary
            const modals = document.querySelectorAll('div[style*="position: fixed"]');
            modals.forEach(modal => {
                if (modal.textContent.includes('TOURNAMENT COMPLETE')) {
                    modal.remove();
                }
            });
            // Show table screen (NOT lobby screen)
            showTableScreen();
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
            transitionToDealingPhase();  // Just UI prep, no state change

            setTimeout(() => {
                if (gameConfig.config.gameVariant === 'kitty') {
                    setTableState(TABLE_STATES.DECIDE_PLAYING);  // ✅ Correct
                } else {
                    transitionToPlayingPhase();
                }
            }, 1000);
            break;

        case TABLE_STATES.HANDS_DEALT:
            console.log('✅ Cards dealt and synced - ready for retrieval');
            if (!window.isOwner) {
                await game.handleNonOwnerCardRetrieval();
            }
            // Owner continues to countdown automatically
            break;

        case TABLE_STATES.DECIDE_PLAYING:
            console.log('🎮 Decision phase - players can see 13 cards and decide');

            // Owner sets up listener to monitor decisions
            if (window.isOwner && typeof setupOwnerDecisionListener === 'function') {
                setupOwnerDecisionListener();
            }

            // Reload current player's hand to trigger 13-card slice
            if (window.game) {
                window.game.loadCurrentPlayerHand();
            }
            break;

         case TABLE_STATES.PLAYING:
            console.log('🎮 Moving to playing phase - showing all cards');

            if (window.game?.multiDeviceMode && window.game.currentTableId) {
                // Load surrender decisions from Firebase
                const surrenderSnapshot = await firebase.database()
                    .ref(`tables/${window.game.currentTableId}/surrenderDecisions`)
                    .once('value');
                const surrenderDecisions = surrenderSnapshot.val() || {};

                window.game.surrenderDecisions = window.game.surrenderDecisions || new Map();
                Object.entries(surrenderDecisions).forEach(([playerKey, decision]) => {
                    const playerName = playerKey.replace(/_at_/g, '@').replace(/,/g, '.');
                    window.game.surrenderDecisions.set(playerName, decision);
                    console.log(`🔑 Loaded surrender decision: ${playerName} = ${decision}`);
                });

                // Check if LOCAL player surrendered
                const localDecision = window.game.surrenderDecisions.get(window.uniquePlayerName);

                if (localDecision === 'surrender') {
                    console.log(`🏳️ ${window.uniquePlayerName} surrendered - hiding cards`);
                    const handArea = document.getElementById('hand-area');
                    if (handArea) handArea.style.display = 'none';
                } else {
                    console.log(`🎴 ${window.uniquePlayerName} playing - loading their hand`);
                    // Find local player's index and set as current player
                    const playerNames = window.game.playerManager.getPlayerNames();
                    const localIndex = playerNames.indexOf(window.uniquePlayerName);

                    if (localIndex >= 0) {
                        window.game.playerManager.currentPlayerIndex = localIndex;
                        window.game.loadCurrentPlayerHand();
                    }
                }
                updateDisplay(window.game);

            } else {
                // Single-device mode
                if (window.game) {
                    window.game.loadCurrentPlayerHand();
                    updateDisplay(window.game);
                }
            }
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
            console.log('🔍 ROUND_COMPLETE handler called');
            console.log('🔍 currentRound:', game.currentRound, 'maxRounds:', game.maxRounds);
            console.log('🔍 isOwner:', window.isOwner);
            console.log('🔍 About to check if more rounds needed');


            if (!window.isOwner) {
                closeScoringPopup();
                const waitingEl = document.getElementById('waiting-for-table-owner');
                if (waitingEl) waitingEl.remove();
            } else {
                // Check if tournament is complete
                // Where owner decides COUNTDOWN or TOURNAMENT_COMPLETE
                console.log('🔍 Owner deciding next state - currentRound:', game.currentRound);

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

// Listen for status message updates from owner
function listenForStatusUpdates(tableId) {
    console.log(`🎧 Setting up status message listener for table ${tableId}`);

    firebase.database()
        .ref(`tables/${tableId}/statusMessage`)
        .on('value', (snapshot) => {
            const statusMessage = snapshot.val();
            console.log(`📨 Status message received: ${statusMessage}`);

            if (statusMessage) {
                const statusDiv = document.getElementById('status');
                if (statusDiv) {
                    statusDiv.innerHTML = statusMessage;
                    console.log(`✅ Updated status div`);
                }
            }
        });
}
