// New file: js/firebase/firebase-auth.js
class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    async initAuth() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.isInitialized = true;

                this.updateLoginButtonText();

                resolve(user);
            });
        });
    }

    // Gradual migration: try Firebase first, fallback to localStorage
    async login(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await this.syncFromLocalStorage(); // Migrate local data
            return { success: true, user: result.user };
        } catch (error) {
            console.log('Firebase login failed, trying localStorage...');
            return this.localStorageLogin(email, password);
        }
    }

    async register(email, password) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await this.createUserProfile(result.user);
            return { success: true, user: result.user };
        } catch (error) {
            console.log('Firebase registration failed, using localStorage...');
            return this.localStorageRegister(email, password);
        }
    }

    // Keep existing localStorage methods as fallback
    localStorageLogin(email, password) {
        // Your existing localStorage login code
    }

    localStorageRegister(email, password) {
        // Your existing localStorage registration code
    }
}

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
                console.log('🔥 User signed in:', user.email);
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
            console.log('🔥 Update UI to show logged-in state');
        } else {
            console.log('🔥 Update UI to show logged-out state');
        }
    }
}

// IMPORTANT: Initialize the Firebase Auth Manager
window.firebaseAuthManager = new FirebaseAuth();
console.log('🔥 Firebase Auth Manager initialized');
