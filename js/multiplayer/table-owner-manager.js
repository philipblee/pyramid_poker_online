function updateStartGameButtonForOwnership(playerCount, playersArray) {
    const startBtn = document.getElementById('startGameBtn') ||
                    document.querySelector('button[onclick*="startGame"]') ||
                    document.getElementById('startGame');

    if (!startBtn || !playersArray || !Array.isArray(playersArray)) {
        return;
    }

    // NEW: Simpler approach - just check if we have exactly 2 players
    // First player in the array is the owner
    const currentUser = firebase.auth().currentUser;
    const currentUserName = currentUser ?
        currentUser.displayName || currentUser.email || 'Anonymous Player' :
        'Guest Player';

    // Sort players by join time, then check if current user is first
    const sortedPlayers = [...playersArray].sort((a, b) => a.joinedAt - b.joinedAt);
    const isFirstPlayer = sortedPlayers.length > 0 && sortedPlayers[0].name === currentUserName;

    if (playerCount >= 2) {
        // For testing: make one browser show owner, other show waiting
        // We can use a simple random assignment temporarily
        const shouldBeOwner = Math.random() > 0.5; // Temporary for testing

        if (shouldBeOwner) {
            startBtn.disabled = false;
            startBtn.textContent = '👑 Start Game';
            startBtn.title = 'You are the table owner';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Waiting for Owner';
            startBtn.title = 'Only the table owner can start';
        }
    }
}