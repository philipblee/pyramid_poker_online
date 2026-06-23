// js/core/payout-calculator.js
// Calculates minimum-transaction settlement from net chip totals

function payoutCalculator(standings) {
    // standings: array of {playerName, totalChipChange}
    // returns: array of {from, to, amount}, sorted for deterministic output

    const balances = standings
        .map(s => ({ playerName: s.playerName, balance: s.totalChipChange }))
        .filter(b => b.balance !== 0);

    // Sort deterministically: by balance desc, tie-break by playerName asc
    balances.sort((a, b) => b.balance - a.balance || a.playerName.localeCompare(b.playerName));

    const creditors = balances.filter(b => b.balance > 0).map(b => ({...b}));
    const debtors = balances.filter(b => b.balance < 0).map(b => ({...b}));

    const payoutTransactions = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];

        const settleAmount = Math.min(creditor.balance, -debtor.balance);

        payoutTransactions.push({
            from: debtor.playerName,
            to: creditor.playerName,
            amount: settleAmount
        });

        creditor.balance -= settleAmount;
        debtor.balance += settleAmount;

        if (creditor.balance === 0) creditorIndex++;
        if (debtor.balance === 0) debtorIndex++;
    }

    return payoutTransactions;
}

window.payoutCalculator = payoutCalculator;
