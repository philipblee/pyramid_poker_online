// js/constants/game-states.js
const LOBBY_STATES = {
    TABLE_OWNED: 'false',
    WAITING_FOR_PLAYERS: 'waiting',
    READY_TO_START: 'ready',
    STARTING_COUNTDOWN: 'countdown',
    DEALING_CARDS: 'dealing'
};

// In js/constants/game-states.js - add this state
const TABLE_STATES = {
    LOBBY: 'lobby',
    NEW_TOURNAMENT: 'new_tournament',
    COUNTDOWN: 'countdown',
    DEALING: 'dealing',
    DECIDE_PLAYING: 'decide_playing',  // NEW: play/surrender decision phase
    ALL_DECIDED: 'all_decided',        // NEW: all players submitted decisions
    PLAYING: 'playing',
    ALL_SUBMITTED: 'all_submitted',
    SCORING: 'scoring',
    ROUND_COMPLETE: 'round_complete',
    TOURNAMENT_COMPLETE: 'tournament_complete',
    NUM_HUMAN_PLAYERS: 'num_human_players'
};

// Export for use in other modules
window.LOBBY_STATES = LOBBY_STATES;
window.TABLE_STATES = TABLE_STATES;
