// js/core/prior-sessions.js
// Prior Sessions viewer — opens from lobby, queries all sessions the current user participated in

async function priorSessions() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;
    const userEmail = currentUser.email;
    const db = firebase.firestore();

    // Build modal shell immediately so user sees loading state
    const overlay = document.createElement('div');
    overlay.id = 'priorSessionsModal';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 1002;
        display: flex; align-items: center; justify-content: center;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
        background: linear-gradient(135deg, #2c3e50, #34495e);
        border-radius: 15px; border: 2px solid #ffd700;
        max-width: 700px; width: 92%; max-height: 85vh; overflow-y: auto;
        color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        padding: 30px; text-align: center;
    `;
    box.innerHTML = `<p style="color:#ffd700; font-size:16px;">Loading sessions...</p>`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Fetch sessions — requires Firestore composite index on (players array-contains, startedAt desc)
    // If missing, Firestore logs a console link to create it automatically
    let sessions = [];
    try {
        const snap = await db.collection('sessions')
            .where('players', 'array-contains', userEmail)
            .orderBy('startedAt', 'desc')
            .get();
        sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('❌ Prior sessions fetch failed:', err);
        box.innerHTML = `
            <h2 style="color:#ffd700; margin-bottom:16px;">📋 Prior Sessions</h2>
            <p style="color:#ff6b6b;">Failed to load sessions.</p>
            <p style="color:#95a5a6; font-size:12px; margin-top:8px;">${err.message}</p>
            <button id="psClose" style="margin-top:20px; background:#4ecdc4; color:white; border:none; padding:10px 24px; border-radius:8px; font-size:15px; cursor:pointer;">Close</button>
        `;
        box.querySelector('#psClose').addEventListener('click', () => overlay.remove());
        return;
    }

    if (sessions.length === 0) {
        box.innerHTML = `
            <h2 style="color:#ffd700; margin-bottom:16px;">📋 Prior Sessions</h2>
            <p style="color:#95a5a6; margin-top:16px;">No sessions found.</p>
            <button id="psClose" style="margin-top:20px; background:#4ecdc4; color:white; border:none; padding:10px 24px; border-radius:8px; font-size:15px; cursor:pointer;">Close</button>
        `;
        box.querySelector('#psClose').addEventListener('click', () => overlay.remove());
        return;
    }

    // Group by local date (YYYY-MM-DD) to avoid UTC midnight timezone issues
    const byDate = {};
    sessions.forEach(s => {
        const d = new Date(s.startedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(s);
    });

    // Dates ascending (oldest first); start at most recent
    const dates = Object.keys(byDate).sort();
    let dateIdx = dates.length - 1;
    let sessionIdx = 0; // 0 = most recent session within that date (desc order from query)

    function buildSessionTable(session) {
        const { players, tournaments } = session;
        const tournamentNumbers = Object.keys(tournaments).map(Number).sort((a, b) => a - b);

        const playerTotals = {};
        players.forEach(p => { playerTotals[p] = 0; });
        tournamentNumbers.forEach(n => {
            players.forEach(p => {
                playerTotals[p] += (tournaments[n]?.scores?.[p] || 0);
            });
        });

        let t = `<table style="width:100%; border-collapse:collapse; margin-top:8px;">
            <thead><tr>
                <th style="padding:8px; color:#ffd700; border-bottom:2px solid #4ecdc4; text-align:left;">Tournament</th>`;
        players.forEach(p => {
            const name = p.includes('@') ? p.split('@')[0] : p;
            t += `<th style="padding:8px; color:#ffd700; border-bottom:2px solid #4ecdc4;">${name}</th>`;
        });
        t += `</tr></thead><tbody>`;
        tournamentNumbers.forEach(n => {
            t += `<tr><td style="padding:8px; color:#ffd700; text-align:left;">Tournament ${n}</td>`;
            players.forEach(p => {
                const score = tournaments[n]?.scores?.[p] || 0;
                const color = score > 0 ? '#4ecdc4' : score < 0 ? '#ff6b6b' : '#95a5a6';
                t += `<td style="padding:8px; color:${color};">${score > 0 ? '+' : ''}${score}</td>`;
            });
            t += `</tr>`;
        });
        t += `</tbody><tfoot><tr style="border-top:2px solid #ffd700;">
            <td style="padding:8px; color:#ffd700; font-weight:bold; text-align:left;">TOTAL</td>`;
        players.forEach(p => {
            const total = playerTotals[p];
            const color = total > 0 ? '#4ecdc4' : total < 0 ? '#ff6b6b' : '#95a5a6';
            t += `<td style="padding:8px; color:${color}; font-weight:bold;">${total > 0 ? '+' : ''}${total}</td>`;
        });
        t += `</tr></tfoot></table>`;
        return t;
    }

    function render() {
        const dateKey = dates[dateIdx];
        const dateSessions = byDate[dateKey];
        const session = dateSessions[sessionIdx];

        // Format date for display using local date parts to avoid timezone drift
        const [yr, mo, day] = dateKey.split('-').map(Number);
        const displayDate = new Date(yr, mo - 1, day).toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });

        const tableName = session.tableName || 'Table';
        const numTournaments = Object.keys(session.tournaments || {}).length;
        const multiSession = dateSessions.length > 1;

        const canOlder = dateIdx > 0;
        const canNewer = dateIdx < dates.length - 1;
        const canEarlier = sessionIdx < dateSessions.length - 1; // earlier in time = higher index (desc order)
        const canLater = sessionIdx > 0;                          // later in time = lower index

        box.innerHTML = `
            <h2 style="color:#ffd700; margin-bottom:12px; font-size:20px;">📋 Prior Sessions</h2>

            <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:12px;">
                <button id="psOlder"
                    style="background:transparent; color:${canOlder ? '#4ecdc4' : '#555'}; border:1px solid ${canOlder ? '#4ecdc4' : '#555'}; padding:6px 14px; border-radius:8px; cursor:${canOlder ? 'pointer' : 'default'}; font-size:14px;"
                    ${canOlder ? '' : 'disabled'}>← Older</button>
                <span style="color:#ffd700; font-size:15px; min-width:180px; display:inline-block;">${displayDate}</span>
                <button id="psNewer"
                    style="background:transparent; color:${canNewer ? '#4ecdc4' : '#555'}; border:1px solid ${canNewer ? '#4ecdc4' : '#555'}; padding:6px 14px; border-radius:8px; cursor:${canNewer ? 'pointer' : 'default'}; font-size:14px;"
                    ${canNewer ? '' : 'disabled'}>Newer →</button>
            </div>

            <div style="color:#95a5a6; font-size:13px; margin-bottom:${multiSession ? '8px' : '16px'};">
                ${tableName} · ${numTournaments} tournament${numTournaments !== 1 ? 's' : ''}${multiSession ? ` · Session ${sessionIdx + 1} of ${dateSessions.length}` : ''}
            </div>

            ${multiSession ? `
            <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:16px;">
                <button id="psEarlier"
                    style="background:transparent; color:${canEarlier ? '#4ecdc4' : '#555'}; border:1px solid ${canEarlier ? '#4ecdc4' : '#555'}; padding:4px 12px; border-radius:6px; cursor:${canEarlier ? 'pointer' : 'default'}; font-size:13px;"
                    ${canEarlier ? '' : 'disabled'}>← Earlier</button>
                <button id="psLater"
                    style="background:transparent; color:${canLater ? '#4ecdc4' : '#555'}; border:1px solid ${canLater ? '#4ecdc4' : '#555'}; padding:4px 12px; border-radius:6px; cursor:${canLater ? 'pointer' : 'default'}; font-size:13px;"
                    ${canLater ? '' : 'disabled'}>Later →</button>
            </div>` : ''}

            <div style="background:rgba(52,73,94,0.5); padding:16px; border-radius:10px; margin-bottom:20px; overflow-x:auto;">
                <h3 style="color:#4ecdc4; margin-bottom:8px; font-size:16px;">Session Totals</h3>
                ${buildSessionTable(session)}
            </div>

            <button id="psClose" style="background:#4ecdc4; color:white; border:none; padding:10px 24px; border-radius:8px; font-size:15px; cursor:pointer;">Close</button>
        `;

        box.querySelector('#psClose').addEventListener('click', () => overlay.remove());

        if (canOlder) {
            box.querySelector('#psOlder').addEventListener('click', () => {
                dateIdx--;
                sessionIdx = 0;
                render();
            });
        }
        if (canNewer) {
            box.querySelector('#psNewer').addEventListener('click', () => {
                dateIdx++;
                sessionIdx = 0;
                render();
            });
        }
        if (multiSession) {
            if (canEarlier) {
                box.querySelector('#psEarlier').addEventListener('click', () => {
                    sessionIdx++;
                    render();
                });
            }
            if (canLater) {
                box.querySelector('#psLater').addEventListener('click', () => {
                    sessionIdx--;
                    render();
                });
            }
        }
    }

    render();
}
