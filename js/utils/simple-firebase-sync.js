// js/utils/simple-firebase-sync.js
// Simplified Firebase sync for single-player Table 6 (no MultiDeviceIntegration complexity)

class SimpleFirebaseSync {
    constructor(tableId) {
        this.tableId = tableId;
        this.tablesRef = firebase.firestore().collection('tables');
    }

    // Store all dealt hands to Firebase (simplified version)
    async storeAllHandsToFirebase() {
        if (!window.game?.playerHands || window.game.playerHands.size === 0) {
            console.log('⚠️ No hands to sync to Firebase');
            return;
        }

        console.log('☁️ [Single-Player] Syncing dealt hands to Firebase...');

        const handsData = {};

        // Convert all player hands to Firebase format
        window.game.playerHands.forEach((hand, playerName) => {
            handsData[playerName] = {
                cards: hand.originalCards || hand.cards, // Use original dealt cards
                timestamp: Date.now()
            };
        });

        try {
            await this.tablesRef.doc(this.tableId.toString()).set({
                'currentGame': {
                    'dealtHands': handsData,
                    'round': window.game.currentRound,
                    'status': 'cardsDealt',
                    'gameMode': 'single-player-vs-ai',
                    'lastUpdated': Date.now()
                }
            }, { merge: true });

            console.log(`✅ [Single-Player] Synced ${Object.keys(handsData).length} hands to Firebase`);
            console.log('🔍 Sample data:', Object.keys(handsData)[0], handsData[Object.keys(handsData)[0]]?.cards?.slice(0, 3));

        } catch (error) {
            console.error('❌ Error syncing hands to Firebase:', error);
        }
    }

    // Retrieve all hands from Firebase (simplified version)
    async retrieveAllHandsFromFirebase() {
        if (!this.tableId) {
            console.log('⚠️ No table ID for Firebase retrieval');
            return;
        }

        console.log('☁️ [Single-Player] Retrieving hands from Firebase...');

        try {
            const tableDoc = await this.tablesRef.doc(this.tableId.toString()).get();
            const dealtHands = tableDoc.data()?.currentGame?.dealtHands;

            if (!dealtHands) {
                console.log('ℹ️ No dealt hands found in Firebase (first time or cleared)');
                return;
            }

            // Clear current hands and repopulate from Firebase
            window.game.playerHands.clear();

            Object.entries(dealtHands).forEach(([playerName, handData]) => {
                window.game.playerHands.set(playerName, {
                    cards: handData.cards,
                    originalCards: [...handData.cards], // Copy for safety
                    back: [],
                    middle: [],
                    front: []
                });
            });

            console.log(`✅ [Single-Player] Retrieved ${Object.keys(dealtHands).length} hands from Firebase`);
            console.log('🔍 After retrieval - playerHands size:', window.game.playerHands.size);

            // Debug log each player's hand count
            window.game.playerHands.forEach((hand, playerName) => {
                console.log(`🔍 ${playerName} has ${hand.cards.length} cards from Firebase`);
            });

        } catch (error) {
            console.error('❌ Error retrieving hands from Firebase:', error);
        }
    }

    // Store current round arrangements (for persistence across browser refreshes)
    async storeGameStateToFirebase() {
        if (!window.game) return;

        console.log('☁️ [Single-Player] Storing game state to Firebase...');

        const gameState = {
            currentRound: window.game.currentRound,
            maxRounds: window.game.maxRounds,
            gameState: window.game.gameState,
            tournamentScores: window.game.tournamentScores ? Object.fromEntries(window.game.tournamentScores) : {},
            roundHistory: window.game.roundHistory || [],
            lastUpdated: Date.now()
        };

        try {
            await this.tablesRef.doc(this.tableId.toString()).set({
                'currentGame': {
                    'gameState': gameState
                }
            }, { merge: true });

            console.log('✅ [Single-Player] Game state synced to Firebase');

        } catch (error) {
            console.error('❌ Error storing game state:', error);
        }
    }

    // Retrieve game state (for resuming after browser refresh)
    async retrieveGameStateFromFirebase() {
        console.log('☁️ [Single-Player] Retrieving game state from Firebase...');

        try {
            const tableDoc = await this.tablesRef.doc(this.tableId.toString()).get();
            const gameState = tableDoc.data()?.currentGame?.gameState;

            if (!gameState) {
                console.log('ℹ️ No game state found in Firebase');
                return null;
            }

            console.log('✅ [Single-Player] Retrieved game state from Firebase');
            return gameState;

        } catch (error) {
            console.error('❌ Error retrieving game state:', error);
            return null;
        }
    }

    // Clear Firebase data when tournament completes
    async clearFirebaseData() {
        console.log('🧹 [Single-Player] Clearing Firebase data...');

        try {
            await this.tablesRef.doc(this.tableId.toString()).update({
                'currentGame': firebase.firestore.FieldValue.delete()
            });

            console.log('✅ [Single-Player] Firebase data cleared');

        } catch (error) {
            console.error('❌ Error clearing Firebase data:', error);
        }
    }
}

// Create global instance for Table 6
window.createSimpleFirebaseSync = function(tableId) {
    return new SimpleFirebaseSync(tableId);
};

// Usage example:
// const firebaseSync = window.createSimpleFirebaseSync(6);
// await firebaseSync.storeAllHandsToFirebase();
// await firebaseSync.retrieveAllHandsFromFirebase();
