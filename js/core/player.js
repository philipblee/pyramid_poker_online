// In js/core/player.js - Add to PlayerManager class

class PlayerManager {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.scores = new Map();
        this.activeEmails = new Set(); // Add this to track unique emails
    }

    async generateUniquePlayerName(originalEmail, tableId) {
        console.log(`🔧 generateUniquePlayerName called with: ${originalEmail}`);

        // Get current active emails from Firebase
        const activeEmailsRef = firebase.database().ref(`tables/${tableId}/activeEmails`);
        const snapshot = await activeEmailsRef.once('value');
        const activeEmailsArray = snapshot.val() || [];

//        console.log(`🔧 Current activeEmails from Firebase:`, activeEmailsArray);

        // If the base email doesn't exist, use it as-is
        if (!activeEmailsArray.includes(originalEmail)) {
            activeEmailsArray.push(originalEmail);
            await activeEmailsRef.set(activeEmailsArray);
//            console.log(`🔧 Using original email: ${originalEmail}`);
            return originalEmail;
        }

        // Generate unique email
        const [localPart, domainPart] = originalEmail.split('@');
        let counter = 1;
        let uniquePlayerName;

        do {
            const paddedCounter = counter.toString().padStart(2, '0');
            uniquePlayerName = `${localPart}_${paddedCounter}@${domainPart}`;
            counter++;
        } while (activeEmailsArray.includes(uniquePlayerName));

        // Add to Firebase
        activeEmailsArray.push(uniquePlayerName);
        await activeEmailsRef.set(activeEmailsArray);
        console.log(`🔧 Generated unique player name: ${uniquePlayerName}`);
        return uniquePlayerName;
    }

    // Update addDefaultPlayers() method - Firebase auth section
    async addDefaultPlayers() {

        const config = window.gameConfig.getConfig();
        console.log('gameConfig:', config);

        if (config.gameMode === 'single-human') {
            // Create 1 human player + configured number of AI players
            // Get the actual logged-in user
            const user = window.firebaseAuthManager.currentUser;
            let humanPlayerName = user?.email || 'Player 1'; // Use real email or fallback

            // ✅ LOAD CHIPS (ADD THIS LINE!)
            const humanPlayerData = await this.loadPlayerChips(humanPlayerName);
            console.log('🔍 humanPlayerData:', humanPlayerData);

            // Create human player with actual email as the name
            this.players.push({
                name: humanPlayerName,          // This will now be your actual email
                originalEmail: user?.email,     // Keep original for reference
                id: Date.now() + Math.random(),
                ready: false,
                type: 'human',
                chips: humanPlayerData.chips,    // ✅ ADD
                lastKnownChips: humanPlayerData.lastKnownChips,    // ✅ ADD
                reloads: humanPlayerData.reloads // ✅ ADD
            });

            this.scores.set(humanPlayerName, 0); // Uses the unique email as key

            // Add AI players
            const aiNames = ['Peter_AI', 'Tony_AI', 'Johnny_AI', 'Phil_AI',
                        'Tse_Ming_AI', 'Edmond_AI', 'Ming_AI', 'Jill_AI',
                        'Stephanie_AI', 'Victoria_AI', 'Clare_AI', 'Linda_AI',
                        'Terry_AI', 'Moonie_AI'];

            // Create new shuffled array each time
            for (let i = 0; i < config.computerPlayers; i++) {
                // Remove a random name from the array
                const randomIndex = Math.floor(Math.random() * aiNames.length);
                const aiName = aiNames.splice(randomIndex, 1)[0] || `AI Player ${i + 1}`;

                // ✅ Load chips for AI player
                const aiPlayerData = await this.loadPlayerChips(aiName);

                this.players.push({
                    name: aiName,
                    id: Date.now() + Math.random() + i,
                    ready: false,
                    type: 'ai',
                    chips: aiPlayerData.chips,    // ✅ ADD
                    lastKnownChips: aiPlayerData.lastKnownChips,    // ✅ ADD
                    reloads: aiPlayerData.reloads // ✅ ADD
                });
                this.scores.set(aiName, 0);
            }

            console.log(`Auto-added single player mode: 1 human + ${config.computerPlayers} AI players (${this.players.length} total)`);
        } else {
            // Multiplayer mode - create default human players
            if (config.gameDeviceMode === 'single-device'){

                const defaultPlayers = ['Player 1', 'Player 2'];

                defaultPlayers.forEach(playerName => {
                    this.players.push({
                        name: playerName,
                        id: Date.now() + Math.random(),
                        ready: false,
                        type: 'human'
                    });
                    this.scores.set(playerName, 0);
                });

            console.log('Auto-added default players:', defaultPlayers);}
        }
    }

    // Update other methods to use email as key where appropriate
    setPlayerReady(playerIdentifier, ready = true) {
        const player = this.players.find(p => p.email === playerIdentifier || p.name === playerIdentifier);
        if (player) {
            player.ready = ready;
        }
    }

    // Add cleanup method for when players leave
    removePlayerEmail(email) {
        this.activeEmails.delete(email);
    }

    // Update removePlayer to clean up email tracking
    removePlayer(index) {
        if (index >= 0 && index < this.players.length) {
            const removedPlayer = this.players[index];

            // Clean up email tracking
            if (removedPlayer.email) {
                this.removePlayerEmail(removedPlayer.email);
            }

            // Remove from players array
            this.players.splice(index, 1);

            // Remove from scores if they exist
            const scoreKey = removedPlayer.email || removedPlayer.name;
            if (this.scores.has(scoreKey)) {
                this.scores.delete(scoreKey);
            }


            // Adjust current player index if necessary
            if (this.currentPlayerIndex >= index && this.currentPlayerIndex > 0) {
                this.currentPlayerIndex--;
            }

            console.log(`Removed player: ${removedPlayer.name}`);
            return removedPlayer;
        }
        return null;
    }

    async resetPlayers() {
        this.players = [];
        this.scores.clear();
        await this.addDefaultPlayers();
//        console.log('Players reset with current config');
    }

    addPlayer(playerName) {
        if (!playerName) {
            playerName = prompt('Enter player name:') || `Player ${this.players.length + 1}`;
        }
        
        this.players.push({
            name: playerName,
            id: Date.now() + Math.random(),
            ready: false,
            type: 'human'
        });
        this.scores.set(playerName, 0);
        
        return playerName;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        return this.getCurrentPlayer();
    }

    getPlayerNames() {
        return this.players.map(p => p.name);
    }


    areAllPlayersReady() {
        return this.players.every(p => p.ready);
    }

    getReadyCount() {
        return this.players.filter(p => p.ready).length;
    }

    resetPlayersReady() {
        this.players.forEach(player => {
            player.ready = false;
        });
    }

    getPlayerScore(playerName) {
        return this.scores.get(playerName) || 0;
    }

    updatePlayerScore(playerName, roundScore) {
        const currentScore = this.scores.get(playerName) || 0;
        this.scores.set(playerName, currentScore + roundScore);
    }

    getAllScores() {
        const scoreMap = new Map();
        this.players.forEach(player => {
            scoreMap.set(player.name, this.scores.get(player.name) || 0);
        });
        return scoreMap;
    }

    async validateMinimumPlayers() {
        const isMultiDevice = window.gameConfig?.config?.gameDeviceMode === 'multi-device';

        if (isMultiDevice) {
            // Get shared player count from Firebase
            const snapshot = await firebase.database().ref(`tables/${currentTable.id}/state/${TABLE_STATES.NUM_HUMAN_PLAYERS}`).once('value');
            const playerCount = snapshot.val() || 0;

//            if (playerCount < 2) {
//                throw new Error(`Need at least 2 players to start! Currently have ${playerCount} players.`);
//            }
        } else {
            // Single-device validation
//            if (this.players.length < 2) {
//                throw new Error('Need at least 2 players to start in validateMinimumPlayers!');
            }
    }

    async ensurePlayersExist() {
        if (this.players.length === 0) {
            // Check if we're in multi-device mode - don't add test players
            const isMultiDevice = window.gameConfig?.config?.gameDeviceMode === 'multi-device';

            if (isMultiDevice) {
                console.log('🌐 Multi-device mode - not adding default test players, using real players from Firebase');
                return false; // Don't auto-add players in multi-device
            } else {
                console.log('No players found - adding default players for testing');
                await this.addDefaultPlayers();
                return true; // Indicates players were auto-added
            }
        }
        return false;
    }

    removePlayer(index) {
        if (index >= 0 && index < this.players.length) {
            const removedPlayer = this.players[index];

            // Remove from players array
            this.players.splice(index, 1);

            // Remove from scores if they exist
            if (this.scores.has(removedPlayer.name)) {
                this.scores.delete(removedPlayer.name);
            }

            // Adjust current player index if necessary
            if (this.currentPlayerIndex >= index && this.currentPlayerIndex > 0) {
                this.currentPlayerIndex--;
            }

            console.log(`Removed player: ${removedPlayer.name}`);
            return removedPlayer;
        }
        return null;
    }

    async loadPlayerChips(playerName) {
        // Encode for Firebase: replace special chars and spaces
        const encodedName = playerName
            .replace(/\./g, ',')
            .replace('@', '_at_')
            .replace(/ /g, '_');

        try {
            const snapshot = await firebase.database()
                .ref(`players/${encodedName}/chips`)
                .once('value');

            if (snapshot.val() === null) {
                // Auto-initialize new player
                await firebase.database().ref(`players/${encodedName}/chips`).set(10000);
                await firebase.database().ref(`players/${encodedName}/lastKnownChips`).set(10000);
                await firebase.database().ref(`players/${encodedName}/reloads`).set(0);
                console.log(`💰 Auto-initialized ${playerName} with 10,000 chips and 0 reloads`);
                return { chips: 10000, lastKnownChips: 10000, reloads: 0 };
            }

            const reloadsSnapshot = await firebase.database()
                .ref(`players/${encodedName}/reloads`)
                .once('value');

            console.log(`💰 Loaded ${playerName}: ${snapshot.val()} chips`);
            const lastKnownChipsSnapshot = await firebase.database()
                .ref(`players/${encodedName}/lastKnownChips`)
                .once('value');

            return {
                chips: snapshot.val(),
                lastKnownChips: lastKnownChipsSnapshot.val() || snapshot.val(),
                reloads: reloadsSnapshot.val() || 0
            };

        } catch (error) {
            console.error(`Error loading chips for ${playerName}:`, error);
            return { chips: 10000, lastKnownChips: 10000, reloads: 0 };  //fall back
        }
    }

    }
