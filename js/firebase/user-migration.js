// New file: js/firebase/user-migration.js
class UserMigrationManager {
    async syncFromLocalStorage() {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const currentLocalUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

        if (currentLocalUser && this.currentUser) {
            console.log('🔄 Migrating user data to Firebase...');

            // Create user stats in Firestore
            await this.createFirebaseUserStats(currentLocalUser);

            // Mark as migrated
            localStorage.setItem('migratedToFirebase', 'true');

            console.log('✅ User data migration complete!');
        }
    }

    async createFirebaseUserStats(localUser) {
        const userStatsRef = doc(db, 'userStats', this.currentUser.uid);
        await setDoc(userStatsRef, {
            gamesPlayed: localUser.gamesPlayed || 0,
            totalScore: localUser.totalScore || 0,
            highScore: localUser.highScore || 0,
            createdAt: new Date(),
            migratedFromLocal: true
        });
    }
}