const LOBBY_STATES = {
    WAITING_FOR_PLAYERS: 'waiting',     // < 2 players
    READY_TO_START: 'ready',            // 2-6 players, can start
    STARTING_COUNTDOWN: 'countdown',    // 3-2-1 countdown active
    DEALING_CARDS: 'dealing'            // Cards being dealt
};