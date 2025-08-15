// New file: js/firebase/leaderboards.js
class LeaderboardManager {
    async getTopPlayers(limit = 10) {
        const q = query(
            collection(db, 'userStats'),
            orderBy('highScore', 'desc'),
            limit(limit)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            userId: doc.id
        }));
    }

    async getUserRank(userId) {
        // Get user's high score
        const userDoc = await getDoc(doc(db, 'userStats', userId));
        const userScore = userDoc.data().highScore;

        // Count how many users have higher scores
        const q = query(
            collection(db, 'userStats'),
            where('highScore', '>', userScore)
        );

        const snapshot = await getDocs(q);
        return snapshot.size + 1; // User's rank
    }
}