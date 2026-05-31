// js/core/session-modal.js
// Session modal — shows cross-tournament scores and owner controls

async function showSessionModal() {
    if (document.getElementById('sessionModal')) return;
    if (window.isOwner) {
        await setTableState(TABLE_STATES.SHOW_SESSION_MODAL);
    }
    const db = firebase.firestore();
    const tableId = window.game?.currentTableId?.toString();

    let sessionId = window.currentSessionId;
    if (!sessionId) {
        console.log('🔍 sessionId missing, querying by tableId:', tableId);
        try {
            const tableIdNum = Number(tableId);
            const querySnapshot = await db.collection('sessions')
                .where('tableId', '==', tableIdNum)
                .orderBy('startedAt', 'desc')
                .limit(1)
                .get();
            if (querySnapshot.empty) {
                console.error('❌ No session found for table:', tableId);
                return;
            }
            sessionId = querySnapshot.docs[0].id;
        } catch (err) {
            console.error('❌ Session query failed:', err);
            return;
        }
    }

    // Fetch session doc from Firestore
    let sessionData;
    try {
        const sessionDoc = await db.collection('sessions').doc(sessionId).get();
        if (!sessionDoc.exists) {
            console.error('❌ Session doc not found:', sessionId);
            return;
        }
        sessionData = sessionDoc.data();
    } catch (err) {
        console.error('❌ Failed to fetch session doc:', err);
        return;
    }

    const { players, tournaments } = sessionData;
    const tournamentNumbers = Object.keys(tournaments).map(Number).sort((a, b) => a - b);

    // Calculate totals per player
    const playerTotals = {};
    players.forEach(p => playerTotals[p] = 0);
    tournamentNumbers.forEach(n => {
        players.forEach(p => {
            playerTotals[p] += tournaments[n].scores[p] || 0;
        });
    });

    // Build modal
    const modal = document.createElement('div');
    modal.id = 'sessionModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 1002;
        display: flex; align-items: center; justify-content: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #2c3e50, #34495e);
        border-radius: 15px; border: 2px solid #ffd700;
        max-width: 700px; width: 92%; max-height: 85vh; overflow-y: auto;
        color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        padding: 30px; text-align: center;
    `;

    // Table HTML
    let tableHtml = `
        <h1 style="color:#ffd700; margin-bottom:20px; font-size:20px;">📊 SESSION RESULTS</h1>
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <thead>
                <tr>
                    <th style="padding:10px; color:#4ecdc4; border-bottom:2px solid #4ecdc4; text-align:left;">Tournament</th>
    `;
    players.forEach(p => {
        const displayName = p.includes('@') ? p.split('@')[0] : p;
        tableHtml += `<th style="padding:10px; color:#4ecdc4; border-bottom:2px solid #4ecdc4;">${displayName}</th>`;
    });
    tableHtml += `</tr></thead><tbody>`;

    tournamentNumbers.forEach(n => {
        tableHtml += `<tr><td style="padding:10px; color:#ffd700; text-align:left;">Tournament ${n}</td>`;
        players.forEach(p => {
            const score = tournaments[n].scores[p] || 0;
            const color = score > 0 ? '#4ecdc4' : score < 0 ? '#ff6b6b' : '#95a5a6';
            tableHtml += `<td style="padding:10px; color:${color};">${score > 0 ? '+' : ''}${score}</td>`;
        });
        tableHtml += `</tr>`;
    });

    // Totals row
    tableHtml += `<tr style="border-top:2px solid #ffd700;">
        <td style="padding:10px; color:#ffd700; font-weight:bold; text-align:left;">TOTAL</td>`;
    players.forEach(p => {
        const total = playerTotals[p];
        const color = total > 0 ? '#4ecdc4' : total < 0 ? '#ff6b6b' : '#95a5a6';
        tableHtml += `<td style="padding:10px; color:${color}; font-weight:bold;">${total > 0 ? '+' : ''}${total}</td>`;
    });
    tableHtml += `</tr></tbody></table>`;

    // Buttons
    if (window.isOwner) {
        tableHtml += `
            <div style="display:flex; gap:16px; justify-content:center; margin-top:10px;">
                <button onclick="handleNextTournament();"
                        style="background:#4ecdc4; color:white; border:none; padding:15px 30px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;">
                    Next Tournament
                </button>
                <button onclick="handleEndSession();"
                        style="background:#ff6b6b; color:white; border:none; padding:15px 30px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;">
                    End Session
                </button>
            </div>
        `;
    } else {
        tableHtml += `<p style="color:#ffd700; font-size:16px; margin-top:20px;">Waiting for owner...</p>`;
    }

    content.innerHTML = tableHtml;
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function clearAllModals() {
    document.getElementById('sessionModal')?.remove();
    document.querySelectorAll('div[style*="position: fixed"]').forEach(modal => {
        if (modal.textContent.includes('TOURNAMENT COMPLETE')) modal.remove();
    });
}

function handleNextTournament() {
    clearAllModals();
    setTableState(TABLE_STATES.NEW_TOURNAMENT);
}

async function handleEndSession() {
    const db = firebase.firestore();
    await db.collection('sessions').doc(window.currentSessionId).update({
        ended: true,
        endedAt: new Date().toISOString()
    });
    clearAllModals();
    setTableState(TABLE_STATES.SESSION_ENDED);
}
