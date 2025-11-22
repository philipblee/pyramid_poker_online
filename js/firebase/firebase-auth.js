// New file: js/firebase/firebase-auth.js
class FirebaseAuth {
    constructor() {
        this.currentUser = null;
        this.isLoggingIn = false;  // ← ADD THIS FLAG
        this.init();
    }

    init() {
        window.firebaseAuth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            if (user) {
                // SKIP chip check if we're in the middle of login
                if (this.isLoggingIn) {
                    console.log('🔄 Login in progress, skipping chip check');
                    this.updateUI(true);
                    return;
                }

                // Check if user has chips
                const encodedEmail = user.email.replace(/\./g, ',').replace('@', '_at_');
                const chipsRef = firebase.database().ref(`players/${encodedEmail}/chips`);
                const snapshot = await chipsRef.once('value');

                if (!snapshot.exists()) {
                    console.log('🔄 No chips found - forcing logout for migration');
                    await window.firebaseAuth.signOut();
                    alert('System updated! Please log in again to continue.');
                    return;
                }

                console.log('✅ User has chips:', snapshot.val());
                this.updateUI(true);
            } else {
                console.log('🔥 User signed out');
                this.updateUI(false);
            }
        });
    }

    async register(email, password) {
        try {
            this.isLoggingIn = true;  // ← ADD THIS

            const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('🔥 Registration successful:', result.user.email);

            // ✅ Encode email for Firebase (replace . and @)
            const encodedEmail = email.replace(/\./g, ',').replace('@', '_at_');

            await firebase.database().ref(`players/${encodedEmail}/chips`).set(10000);
            await firebase.database().ref(`players/${encodedEmail}/reloads`).set(0);
            console.log(`💰 New player ${email} initialized with 10,000 chips`);

            this.isLoggingIn = false;  // ← ADD THIS
            return { success: true, user: result.user };
        } catch (error) {
            this.isLoggingIn = false;  // ← ADD THIS
            console.error('🔥 Registration failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            this.isLoggingIn = true;

            const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('🔥 Login successful:', result.user.email);

            // Ensure chips exist for existing users
            const encodedEmail = email.replace(/\./g, ',').replace('@', '_at_');
            const playerRef = firebase.database().ref(`players/${encodedEmail}`);

            // Check chips
            const chipsSnapshot = await playerRef.child('chips').once('value');
            if (!chipsSnapshot.exists()) {
                await playerRef.child('chips').set(10000);
                console.log('💰 Created chips for existing user:', email);
            }

            // Check reloads
            const reloadsSnapshot = await playerRef.child('reloads').once('value');
            if (!reloadsSnapshot.exists()) {
                await playerRef.child('reloads').set(0);
                console.log('💰 Created reloads for existing user:', email);
            }

            this.isLoggingIn = false;
            return { success: true, user: result.user };
        } catch (error) {
            this.isLoggingIn = false;
            console.error('🔥 Login failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await window.firebaseAuth.signOut();
            console.log('🔥 Logout successful');
            return { success: true };
        } catch (error) {
            console.error('🔥 Logout failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    updateUI(isLoggedIn) {
        // Update your existing UI here
        // This connects to your current login system
        if (isLoggedIn) {
//            console.log('🔥 Update UI to show logged-in state');
        } else {
            console.log('🔥 Update UI to show logged-out state');
        }
    }
}

// IMPORTANT: Initialize the Firebase Auth Manager
window.firebaseAuthManager = new FirebaseAuth();
console.log('🔥 Firebase Auth Manager initialized');
