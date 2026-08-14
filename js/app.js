function generateLedgerReport() {
    if (!currentTab) {
        alert("Please open an active ledger first.");
        return;
    }

    const sym = getCurrencySymbol();
    let totalSpent = 0;
    ledgerData.expenses.forEach(e => totalSpent += (parseFloat(e.amount) || 0));

    const settlement = calculateSettlement();

    let report = `====================================================\n`;
    report += `               SPENSE LEDGER REPORT                 \n`;
    report += `====================================================\n`;
    report += `Ledger Name  : ${currentTab}\n`;
    report += `Generated On : ${new Date().toLocaleString()}\n`;
    report += `Participants : ${ledgerData.members.join(', ') || 'None'}\n`;
    report += `Total Spend  : ${sym}${totalSpent.toFixed(2)}\n`;
    report += `====================================================\n\n`;

    report += `--- SETTLEMENT MATRIX ---\n`;
    if (settlement.length > 0) {
        settlement.forEach(s => report += `• ${s}\n`);
    } else {
        report += `All balances are currently settled!\n`;
    }
    report += `\n----------------------------------------------------\n\n`;

    report += `--- ITEMIZED TRANSACTION HISTORY ---\n`;
    if (ledgerData.expenses.length > 0) {
        ledgerData.expenses.forEach((e, idx) => {
            const splitStr = Array.isArray(e.splitWith) ? e.splitWith.join(', ') : (e.splitBetween ? e.splitBetween.join(', ') : 'All');
            report += `${idx + 1}. [${e.date}] ${e.desc} (${e.category})\n`;
            report += `   Amount: ${sym}${parseFloat(e.amount).toFixed(2)} | Paid By: ${e.paidBy}\n`;
            report += `   Split With: ${splitStr}\n\n`;
        });
    } else {
        report += `No expenses recorded.\n`;
    }
    report += `====================================================\n`;

    // Create a Blob containing the plain text report
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const reportUrl = URL.createObjectURL(blob);

    // Open the generated Blob directly in a new browser tab
    const reportWindow = window.open(reportUrl, '_blank');

    if (!reportWindow) {
        alert("Pop-up blocked! Please allow pop-ups for this site to view the report in a new tab.");
    }
}
