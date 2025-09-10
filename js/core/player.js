// js/core/player.js
// Player management functionality extracted from game.js

class PlayerManager {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.scores = new Map();
    }

    resetPlayers() {
        this.players = [];
        this.scores.clear();
        this.addDefaultPlayers();
        console.log('Players reset with current config');
    }

    // add default AI players
    addDefaultPlayers() {
        console.log('gameConfig object:', window.gameConfig);
        console.log('getConfig function:', typeof window.gameConfig?.getConfig);

        const config = window.gameConfig.getConfig();
        console.log('Retrieved config:', config);
        
        if (config.gameMode === 'single-human') {
            // Create 1 human player + configured number of AI players
            // Get the actual logged-in user's name
            let humanPlayerName = 'Player 1'; // Default fallback

            if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                const user = window.firebaseAuth.currentUser;
                humanPlayerName = user.displayName || user.email.split('@')[0] || 'Player 1';
            }

            // Create human player with actual name
            this.players.push({
                name: humanPlayerName,
                id: Date.now() + Math.random(),
                ready: false,
                type: 'human'
            });
            this.scores.set(humanPlayerName, 0);

            // Add AI players
            const aiNames = ['Peter AI', 'Tony AI', 'Johnny AI', 'Phil AI',
                        'Tse Ming AI', 'Edmond AI', 'Ming AI', 'Jill AI',
                        'Stephanie AI', 'Victoria AI', 'Clare AI', 'Linda AI',
                        'Tse Ming AI', 'Edmond AI', 'Ming AI', 'Terry AI',
                        'Moonie AI'];

            // Create new shuffled array each time
            for (let i = 0; i < config.computerPlayers; i++) {
                // Remove a random name from the array
                const randomIndex = Math.floor(Math.random() * aiNames.length);
                const aiName = aiNames.splice(randomIndex, 1)[0] || `AI Player ${i + 1}`;

                this.players.push({
                    name: aiName,
                    id: Date.now() + Math.random() + i,
                    ready: false,
                    type: 'ai'
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

    setPlayerReady(playerName, ready = true) {
        const player = this.players.find(p => p.name === playerName);
        if (player) {
            player.ready = ready;
        }
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

    validateMinimumPlayers() {
        if (this.players.length < 2) {
            throw new Error('Need at least 2 players to start!');
        }
    }

    ensurePlayersExist() {
        if (this.players.length === 0) {
            console.log('No players found - adding default players for testing');
            this.addDefaultPlayers();
            return true; // Indicates players were auto-added
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
}