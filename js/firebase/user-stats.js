class UserStatsManager {
    constructor() {
        this.db = window.firebaseDb;
        this.auth = window.firebaseAuth;
    }

    // Initialize user stats when they first register
    async initializeUserStats(userId, email) {
        const userStatsRef = this.db.collection('userStats').doc(userId);

        const initialStats = {
            email: email,
            createdAt: new Date(),
            lastGameAt: null,

            // Game Statistics
            gamesPlayed: 0,
            totalScore: 0,
            averageScore: 0,
            highScore: 0,
            lowScore: null,

            // Win Statistics
            roundsWon: 0,
            roundsLost: 0,
            winRate: 0,

            // Achievement Tracking
            achievements: [],
            currentStreak: 0,
            bestStreak: 0,

            // Game Mode Stats
            singlePlayerGames: 0,
            multiPlayerGames: 0,

            // Wild Card Performance
            noWildGames: 0,
            oneWildGames: 0,
            twoWildGames: 0,

            updatedAt: new Date()
        };

        try {
            await userStatsRef.set(initialStats);
            console.log('📊 User stats initialized for:', email);
            return initialStats;
        } catch (error) {
            console.error('❌ Failed to initialize user stats:', error);
            throw error;
        }
    }

    // Save game result
    async saveGameResult(gameData) {
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            console.log('📊 No user logged in, skipping stats save');
            return;
        }

        try {
            // Save individual game record
            await this.saveGameHistory(currentUser.uid, gameData);

            // Update user statistics
            await this.updateUserStats(currentUser.uid, gameData);

//            console.log('📊 Game stats saved successfully');
        } catch (error) {
            console.error('❌ Failed to save game stats:', error);
        }
    }

    async saveGameHistory(userId, gameData) {
        const gameRef = this.db.collection('gameHistory').doc();

        const gameRecord = {
            userId: userId,
            gameId: gameRef.id,
            playedAt: new Date(),

            // Game Configuration
            gameMode: gameData.gameMode || 'multiplayer',
            wildCardCount: gameData.wildCardCount || 0,
            playerCount: gameData.playerCount || 4,

            // Player Results
            playerScore: gameData.playerScore || 0,
            playerRank: gameData.playerRank || 1,

            // Hand Details (optional)
            ...(gameData.finalHands && { finalHands: gameData.finalHands }),

            // Opponents (optional)
            ...(gameData.opponents && { opponents: gameData.opponents }),

            // All player scores (optional)
            ...(gameData.allPlayerScores && { allPlayerScores: gameData.allPlayerScores }),

            // Performance Metrics (optional)
            ...(gameData.gameLength && { gameLength: gameData.gameLength })
        };

        // REMOVE THIS LINE:
        // const cleanedData = removeUndefinedFields(gameRecord);

        // Just save gameRecord directly:
        await gameRef.set(gameRecord);
        return gameRecord;
    }


    // Update aggregated user statistics
    async updateUserStats(userId, gameData) {
        const userStatsRef = this.db.collection('userStats').doc(userId);

        // Get current stats
        const currentStatsDoc = await userStatsRef.get();
        const currentStats = currentStatsDoc.exists ? currentStatsDoc.data() : null;

        if (!currentStats) {
            // Initialize stats if they don't exist
            const userEmail = this.auth.currentUser.email;
            return await this.initializeUserStats(userId, userEmail);
        }

        // Calculate updated statistics
        const newGamesPlayed = currentStats.gamesPlayed + 1;
        const newTotalScore = currentStats.totalScore + gameData.playerScore;
        const newAverageScore = newTotalScore / newGamesPlayed;

        const wonGame = gameData.playerRank === 1;
        const newRoundsWon = currentStats.roundsWon + (wonGame ? 1 : 0);
        const newRoundsLost = currentStats.roundsLost + (wonGame ? 0 : 1);
        const newWinRate = (newRoundsWon / newGamesPlayed) * 100;

        // Update streak
        let newCurrentStreak, newBestStreak;
        if (wonGame) {
            newCurrentStreak = currentStats.currentStreak + 1;
            newBestStreak = Math.max(currentStats.bestStreak, newCurrentStreak);
        } else {
            newCurrentStreak = 0;
            newBestStreak = currentStats.bestStreak;
        }

        const updatedStats = {
            lastGameAt: new Date(),
            gamesPlayed: newGamesPlayed,
            totalScore: newTotalScore,
            averageScore: Math.round(newAverageScore * 100) / 100,
            highScore: Math.max(currentStats.highScore, gameData.playerScore),
            lowScore: currentStats.lowScore === null ? gameData.playerScore : Math.min(currentStats.lowScore, gameData.playerScore),

            roundsWon: newRoundsWon,
            roundsLost: newRoundsLost,
            winRate: Math.round(newWinRate * 100) / 100,

            currentStreak: newCurrentStreak,
            bestStreak: newBestStreak,

            // Game mode tracking
            singlePlayerGames: currentStats.singlePlayerGames + (gameData.gameMode === 'singleplayer' ? 1 : 0),
            multiPlayerGames: currentStats.multiPlayerGames + (gameData.gameMode === 'multiplayer' ? 1 : 0),

            // Wild card tracking
            noWildGames: currentStats.noWildGames + (gameData.wildCardCount === 0 ? 1 : 0),
            oneWildGames: currentStats.oneWildGames + (gameData.wildCardCount === 1 ? 1 : 0),
            twoWildGames: currentStats.twoWildGames + (gameData.wildCardCount === 2 ? 1 : 0),

            updatedAt: new Date()
        };

        await userStatsRef.update(updatedStats);
        return updatedStats;
    }


    // Helper function to remove undefined fields
    async removeUndefinedFields(obj) {
        const cleaned = {};

        Object.keys(obj).forEach(key => {
            const value = obj[key];

            if (value !== undefined && value !== null) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    // Recursively clean nested objects
                    const cleanedNested = removeUndefinedFields(value);
                    if (Object.keys(cleanedNested).length > 0) {
                        cleaned[key] = cleanedNested;
                    }
                } else {
                    cleaned[key] = value;
                }
            }
        });

        return cleaned;
    }

    // Get user statistics
    async getUserStats(userId = null) {
        const targetUserId = userId || (this.auth.currentUser ? this.auth.currentUser.uid : null);
        if (!targetUserId) return null;

        try {
            const userStatsDoc = await this.db.collection('userStats').doc(targetUserId).get();
            return userStatsDoc.exists ? userStatsDoc.data() : null;
        } catch (error) {
            console.error('❌ Failed to get user stats:', error);
            return null;
        }
    }

    // Get recent game history
    async getGameHistory(userId = null, limit = 10) {
        const targetUserId = userId || (this.auth.currentUser ? this.auth.currentUser.uid : null);
        if (!targetUserId) return [];

        try {
            const gamesQuery = this.db.collection('gameHistory')
                .where('userId', '==', targetUserId)
                .orderBy('playedAt', 'desc')
                .limit(limit);

            const snapshot = await gamesQuery.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('❌ Failed to get game history:', error);
            return [];
        }
    }
}

// Initialize when page loads
window.userStatsManager = new UserStatsManager();
//console.log('📊 User Stats Manager initialized');
