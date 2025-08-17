// js/multiplayer/table-manager.js
// Firestore table management system for Pyramid Poker Online

class TableManager {
    constructor() {
        this.currentTable = null;
        this.currentUser = null;
        this.listeners = [];

        // Initialize Firestore refs
        this.db = window.firebaseDb;
        this.tablesRef = this.db.collection('tables');
        this.activePlayersRef = this.db.collection('activePlayers');
    }

    // Initialize with current user
    async initialize(userId, userName) {
        this.currentUser = { id: userId, name: userName };

        // Set user as active in Firestore
        await this.activePlayersRef.doc(userId).set({
            name: userName,
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            currentTable: null
        });
    }

    // Create new table with custom settings
    async createTable(customSettings = {}) {
        const defaultSettings = {
            name: `${this.currentUser.name}'s Table`,
            maxPlayers: 6,
            fillWithAI: true,  // Fill remaining spots with AI at start
            wildCards: 2,
            roundTimeLimit: 180000, // 3 minutes
            isPrivate: false
        };

        const tableSettings = { ...defaultSettings, ...customSettings };

        const tableData = {
            settings: tableSettings,
            status: 'waiting', // waiting | inProgress | finished
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: this.currentUser.id,
            players: {
                [this.currentUser.id]: {
                    name: this.currentUser.name,
                    type: 'human',
                    ready: false,
                    connected: true,
                    totalScore: 0,
                    currentTournamentScore: 0,
                    roundScores: [],
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                }
            },
            currentTournament: null
        };

        // Create table in Firestore
        const newTableRef = await this.tablesRef.add(tableData);
        const tableId = newTableRef.id;

        // Update user's current table
        await this.activePlayersRef.doc(this.currentUser.id).update({
            currentTable: tableId
        });

        this.currentTable = tableId;
        this.setupTableListeners(tableId);

        return tableId;
    }

    // Join existing table
    async joinTable(tableId) {
        const tableDoc = await this.tablesRef.doc(tableId).get();

        if (!tableDoc.exists) {
            throw new Error('Table not found');
        }

        const tableData = tableDoc.data();

        if (tableData.status !== 'waiting') {
            throw new Error('Cannot join table - tournament in progress');
        }

        const currentPlayerCount = this.getHumanPlayerCount(tableData.players);
        if (currentPlayerCount >= tableData.settings.maxPlayers) {
            throw new Error('Table is full');
        }

        // Add player to table
        const playerData = {
            name: this.currentUser.name,
            type: 'human',
            ready: false,
            connected: true,
            totalScore: 0,
            currentTournamentScore: 0,
            roundScores: [],
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.tablesRef.doc(tableId).update({
            [`players.${this.currentUser.id}`]: playerData
        });

        // Update user's current table
        await this.activePlayersRef.doc(this.currentUser.id).update({
            currentTable: tableId
        });

        this.currentTable = tableId;
        this.setupTableListeners(tableId);

        return tableId;
    }

    // Leave current table
    async leaveTable() {
        if (!this.currentTable) return;

        // Remove player from table
        await this.tablesRef.doc(this.currentTable).update({
            [`players.${this.currentUser.id}`]: firebase.firestore.FieldValue.delete()
        });

        // Update user's status
        await this.activePlayersRef.doc(this.currentUser.id).update({
            currentTable: null
        });

        // Clean up listeners
        this.cleanupListeners();

        this.currentTable = null;
    }

    // Update player ready status
    async updatePlayerReady(ready) {
        if (!this.currentTable) return;

        await this.tablesRef.doc(this.currentTable).update({
            [`players.${this.currentUser.id}.ready`]: ready
        });
    }

    // Add AI players when tournament starts
    async addAIPlayersAtStart() {
        if (!this.currentTable) return;

        const tableDoc = await this.tablesRef.doc(this.currentTable).get();
        const tableData = tableDoc.data();

        if (!tableData.settings.fillWithAI) return;

        const humanCount = this.getHumanPlayerCount(tableData.players);
        const aiNeeded = tableData.settings.maxPlayers - humanCount;

        const aiNames = ['Bot Alice', 'Bot Bob', 'Bot Charlie', 'Bot Diana', 'Bot Eve', 'Bot Frank'];

        const aiUpdates = {};
        for (let i = 0; i < aiNeeded; i++) {
            const aiId = `ai_${Date.now()}_${i}`;
            aiUpdates[`players.${aiId}`] = {
                name: aiNames[i] || `Bot ${i + 1}`,
                type: 'ai',
                ready: true,
                connected: true,
                totalScore: 0,
                currentTournamentScore: 0,
                roundScores: [],
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
        }

        if (Object.keys(aiUpdates).length > 0) {
            await this.tablesRef.doc(this.currentTable).update(aiUpdates);
        }
    }

    // Manual tournament start (player initiated)
    async startTournament() {
        if (!this.currentTable) return;

        const tableDoc = await this.tablesRef.doc(this.currentTable).get();
        const tableData = tableDoc.data();

        if (tableData.status !== 'waiting') {
            throw new Error('Tournament already in progress');
        }

        const humanPlayers = Object.values(tableData.players).filter(p => p.type === 'human');
        const readyHumans = humanPlayers.filter(p => p.ready);

        // Only check that all humans are ready (no minimum requirement)
        if (readyHumans.length !== humanPlayers.length) {
            throw new Error('All human players must be ready');
        }

        // Add AI players to fill remaining spots
        await this.addAIPlayersAtStart();

        // Update table status and start tournament
        await this.tablesRef.doc(this.currentTable).update({
            status: 'inProgress',
            currentTournament: {
                id: Date.now(),
                round: 1,
                roundStartTime: firebase.firestore.FieldValue.serverTimestamp(),
                roundEndTime: null, // Will be set when round starts
                totalRounds: 3,
                roundSubmissions: {},
                roundResults: {}
            }
        });
    }

    // Set up real-time listeners for current table
    setupTableListeners(tableId) {
        // Listen for table changes
        const unsubscribe = this.tablesRef.doc(tableId).onSnapshot((doc) => {
            if (doc.exists) {
                const tableData = doc.data();
                this.onPlayersChanged(tableData.players);
                this.onTableStatusChanged(tableData.status);
                this.onTournamentStateChanged(tableData.currentTournament);
            }
        });

        this.listeners.push(unsubscribe);
    }

    // Clean up Firestore listeners
    cleanupListeners() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }

    // Utility functions
    getHumanPlayerCount(players) {
        if (!players) return 0;
        return Object.values(players).filter(p => p.type === 'human').length;
    }

    // Callback functions (to be overridden by game integration)
    onPlayersChanged(players) {
        console.log('Table players changed:', players);
    }

    onTableStatusChanged(status) {
        console.log('Table status changed:', status);
    }

    onTournamentStateChanged(tournament) {
        console.log('Tournament state changed:', tournament);
    }
}

// Lobby browsing functions (separate from table management)
class LobbyBrowser {
    constructor() {
        this.db = window.firebaseDb;
        this.tablesRef = this.db.collection('tables');
    }

    // Get list of available tables for browsing
    async getAvailableTables() {
        // Get tables that are waiting for players
        const snapshot = await this.tablesRef
            .where('status', '==', 'waiting')
            .get();

        const tables = [];
        snapshot.forEach(doc => {
            const tableData = doc.data();
            // Filter public tables client-side
            if (!tableData.settings.isPrivate) {
                tables.push({
                    id: doc.id,
                    ...tableData,
                    humanPlayerCount: this.getHumanPlayerCount(tableData.players),
                    spotsRemaining: tableData.settings.maxPlayers - this.getHumanPlayerCount(tableData.players)
                });
            }
        });

        // Sort by creation time client-side
        return tables.sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
        });
    }

    // Utility function
    getHumanPlayerCount(players) {
        if (!players) return 0;
        return Object.values(players).filter(p => p.type === 'human').length;
    }
}

// Export for use in other modules
window.TableManager = TableManager;
window.LobbyBrowser = LobbyBrowser;