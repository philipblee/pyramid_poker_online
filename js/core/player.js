// js/core/player.js
// Player management functionality extracted from game.js

class PlayerManager {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.scores = new Map();
    }

    addDefaultPlayers() {
        const defaultPlayers = ['Player 1', 'Player 2'];

        defaultPlayers.forEach(playerName => {
            this.players.push({
                name: playerName,
                id: Date.now() + Math.random(),
                ready: false
            });
            this.scores.set(playerName, 0);
        });

        console.log('Auto-added default players:', defaultPlayers);
    }

    addPlayer(playerName) {
        if (!playerName) {
            playerName = prompt('Enter player name:') || `Player ${this.players.length + 1}`;
        }
        
        this.players.push({
            name: playerName,
            id: Date.now() + Math.random(),
            ready: false
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
}