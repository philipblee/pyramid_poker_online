// New file: js/firebase/firebase-auth.js
class FirebaseAuth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        window.firebaseAuth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
//                console.log('🔥 User signed in:', user.email);
                this.updateUI(true);
            } else {
                console.log('🔥 User signed out');
                this.updateUI(false);
            }
        });
    }

    async register(email, password) {
        try {
            const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('🔥 Registration successful:', result.user.email);

            // ✅ Encode email for Firebase (replace . and @)
            const encodedEmail = email.replace(/\./g, ',').replace('@', '_at_');

            await firebase.database().ref(`players/${encodedEmail}/chips`).set(10000);
            await firebase.database().ref(`players/${encodedEmail}/reloads`).set(0);
            console.log(`💰 New player ${email} initialized with 10,000 chips`);

            return { success: true, user: result.user };
        } catch (error) {
            console.error('🔥 Registration failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('🔥 Login successful:', result.user.email);
            return { success: true, user: result.user };
        } catch (error) {
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
//console.log('🔥 Firebase Auth Manager initialized');
