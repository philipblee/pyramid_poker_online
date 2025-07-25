// js/core/player.js
// Player management functionality extracted from game.js

class PlayerManager {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.scores = new Map();
    }

    addDefaultPlayers() {
        const config = window.gameConfig.getConfig();
        
        if (config.gameMode === 'singleplayer') {
            // Create 1 human player + configured number of AI players
            this.players.push({
                name: 'Player 1',
                id: Date.now() + Math.random(),
                ready: false,
                type: 'human'
            });
            this.scores.set('Player 1', 0);

            // Add AI players
            for (let i = 1; i <= config.computerPlayers; i++) {
                const aiName = `AI Player ${i}`;
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

            console.log('Auto-added default players:', defaultPlayers);
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