class LeaderboardManager {
    constructor() {
        this.db = window.firebaseDb;
        this.auth = window.firebaseAuth;
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
    }

    // Get top players by high score
    async getTopPlayersByHighScore(limit = 10) {
        return this.getCachedOrFetch('highScore', async () => {
            // Simple query - just order by highScore, filter out 0s in processing
            const query = this.db.collection('userStats')
                .orderBy('highScore', 'desc')
                .limit(limit * 2); // Get extra to filter out inactive players

            const snapshot = await query.get();
            const results = this.processLeaderboardResults(snapshot, 'highScore');

            // Filter out players with 0 games and return top results
            return results
                .filter(player => player.gamesPlayed > 0)
                .slice(0, limit);
        });
    }

    // Get top players by win rate (minimum 5 games)
    async getTopPlayersByWinRate(limit = 10) {
        return this.getCachedOrFetch('winRate', async () => {
            // Order by gamesPlayed first (for the filter), then sort by winRate in processing
            const query = this.db.collection('userStats')
                .where('gamesPlayed', '>=', 5)
                .orderBy('gamesPlayed', 'desc')
                .limit(limit * 3); // Get extra to sort by winRate

            const snapshot = await query.get();
            const results = this.processLeaderboardResults(snapshot, 'winRate');

            // Sort by winRate and return top results
            return results
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        });
    }

    // Get top players by games played
    async getTopPlayersByGamesPlayed(limit = 10) {
        return this.getCachedOrFetch('gamesPlayed', async () => {
            const query = this.db.collection('userStats')
                .orderBy('gamesPlayed', 'desc')
                .limit(limit);

            const snapshot = await query.get();
            return this.processLeaderboardResults(snapshot, 'gamesPlayed');
        });
    }

    // Get top players by best streak
    async getTopPlayersByBestStreak(limit = 10) {
        return this.getCachedOrFetch('bestStreak', async () => {
            const query = this.db.collection('userStats')
                .orderBy('bestStreak', 'desc')
                .limit(limit * 2); // Get extra to filter out 0s

            const snapshot = await query.get();
            const results = this.processLeaderboardResults(snapshot, 'bestStreak');

            // Filter out players with 0 streak
            return results
                .filter(player => player.value > 0)
                .slice(0, limit);
        });
    }

    // Get top players by average score (minimum 10 games)
    async getTopPlayersByAverageScore(limit = 10) {
        return this.getCachedOrFetch('averageScore', async () => {
            // Order by gamesPlayed first, then sort by averageScore in processing
            const query = this.db.collection('userStats')
                .where('gamesPlayed', '>=', 10)
                .orderBy('gamesPlayed', 'desc')
                .limit(limit * 3); // Get extra to sort by averageScore

            const snapshot = await query.get();
            const results = this.processLeaderboardResults(snapshot, 'averageScore');

            // Sort by averageScore and return top results
            return results
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        });
    }

    // Get all leaderboards for display
    async getAllLeaderboards() {
        try {
            const [highScore, winRate, gamesPlayed, bestStreak, averageScore] = await Promise.all([
                this.getTopPlayersByHighScore(5),
                this.getTopPlayersByWinRate(5),
                this.getTopPlayersByGamesPlayed(5),
                this.getTopPlayersByBestStreak(5),
                this.getTopPlayersByAverageScore(5)
            ]);

            return {
                highScore,
                winRate,
                gamesPlayed,
                bestStreak,
                averageScore
            };
        } catch (error) {
            console.error('❌ Failed to load leaderboards:', error);
            throw error;
        }
    }


    // Get user's rank in specific category
    async getUserRank(category, userId = null) {
        const targetUserId = userId || (this.auth.currentUser ? this.auth.currentUser.uid : null);
        if (!targetUserId) return null;

        try {
            // Get user's stats
            const userStatsDoc = await this.db.collection('userStats').doc(targetUserId).get();
            if (!userStatsDoc.exists) return null;

            const userStats = userStatsDoc.data();
            const userValue = userStats[category];

            if (userValue === undefined || userValue === null) return null;

            // Get all eligible players and calculate rank in memory
            let query;
            const minGamesFilter = this.getMinGamesForCategory(category);

            if (minGamesFilter > 0) {
                query = this.db.collection('userStats')
                    .where('gamesPlayed', '>=', minGamesFilter)
                    .orderBy('gamesPlayed', 'desc');
            } else {
                query = this.db.collection('userStats')
                    .orderBy(category, 'desc');
            }

            const snapshot = await query.get();
            const allPlayers = snapshot.docs.map(doc => doc.data());

            // Sort by the actual category value
            allPlayers.sort((a, b) => b[category] - a[category]);

            // Find user's rank
            const userRank = allPlayers.findIndex(player =>
                player.email === userStats.email // Or use another unique identifier
            ) + 1;

            return {
                rank: userRank || allPlayers.length + 1,
                value: userValue,
                category: category,
                totalPlayers: allPlayers.length
            };
        } catch (error) {
            console.error(`❌ Failed to get user rank for ${category}:`, error);
            return null;
        }
    }

    // Helper methods
    processLeaderboardResults(snapshot, category) {
        return snapshot.docs.map((doc, index) => {
            const data = doc.data();
            // Check if email is saved under different name
            console.log('All Firebase fields:', data);
            console.log('Looking for email-like fields:', Object.keys(data).filter(key =>
                key.includes('email') || key.includes('Email') || key.includes('user')
            ));

            // Calculate missing fields from available data
            const winRate = data.gamesPlayed > 0 ? Math.round((data.wins / data.gamesPlayed) * 100) : 0;
            const lastActive = data.lastPlayed && data.lastPlayed.toDate ? data.lastPlayed.toDate() : new Date();

            return {
                rank: index + 1,
                userId: doc.id,
                email: doc.id + '@firebase.local', // Generate fake email from userId
//                displayName: `Player_${doc.id.substring(0, 8)}`, // Short player ID
                displayName: data.email ? this.getDisplayName(data.email) : 'Anonymous',
                value: data[category] || 0,
                gamesPlayed: data.gamesPlayed || 0,
                winRate: winRate,
                highScore: data.totalScore || 0, // Use totalScore as proxy for highScore
                lastActive: lastActive
            };
        });
    }

    getDisplayName(email) {
        // Extract username from email for display
        if (!email || typeof email !== 'string') {
            return 'Anonymous';
        }
        return email.split('@')[0];
    }

    getMinGamesForCategory(category) {
        const minGames = {
            'winRate': 5,
            'averageScore': 10,
            'highScore': 0,
            'gamesPlayed': 0,
            'bestStreak': 0
        };
        return minGames[category] || 0;
    }

    async getTotalPlayersInCategory(category) {
        try {
            const minGames = this.getMinGamesForCategory(category);
            let query;
            
            if (minGames > 0) {
                query = this.db.collection('userStats').where('gamesPlayed', '>=', minGames);
            } else {
                query = this.db.collection('userStats').where('gamesPlayed', '>', 0);
            }
            
            const snapshot = await query.get();
            return snapshot.size;
        } catch (error) {
            console.error('Failed to get total players:', error);
            return 0;
        }
    }

    // Caching system
    async getCachedOrFetch(key, fetchFunction) {
        const cached = this.cache.get(key);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < this.cacheTimeout) {
            console.log(`📊 Using cached ${key} leaderboard`);
            return cached.data;
        }
        
        console.log(`📊 Fetching fresh ${key} leaderboard`);
        const data = await fetchFunction();
        this.cache.set(key, { data, timestamp: now });
        return data;
    }

    // Clear cache (useful for testing)
    clearCache() {
        this.cache.clear();
        console.log('📊 Leaderboard cache cleared');
    }
}

// Initialize when page loads
window.leaderboardManager = new LeaderboardManager();
console.log('🏆 Leaderboard Manager initialized');