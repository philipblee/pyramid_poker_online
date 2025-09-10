// js/constants/game-states.js
const LOBBY_STATES = {
    WAITING_FOR_PLAYERS: 'waiting',
    READY_TO_START: 'ready',
    STARTING_COUNTDOWN: 'countdown',
    DEALING_CARDS: 'dealing'
};

// In js/constants/game-states.js - add this state
const TABLE_STATES = {
    LOBBY: 'lobby',
    COUNTDOWN: 'countdown',  // NEW: 30-second ready timer
    DEALING: 'dealing',
    PLAYING: 'playing',
    ALL_SUBMITTED: 'all_submitted',
    SCORING: 'scoring',
    ROUND_COMPLETE: 'round_complete',
    TOURNAMENT_COMPLETE: 'tournament_complete'
};

// Export for use in other modules
window.LOBBY_STATES = LOBBY_STATES;
window.TABLE_STATES = TABLE_STATES;