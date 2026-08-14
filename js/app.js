async function recallLedger() {
    const archiveSelect = document.getElementById('archiveSelect');
    const pinInput = document.getElementById('recallLedgerPin');

    const targetLedger = archiveSelect?.value;
    const pinVal = pinInput?.value.trim();

    if (!targetLedger || pinVal.length !== 4) {
        alert("Please select a ledger and enter your 4-digit PIN.");
        return;
    }

    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) {
            alert("Missing configuration URL.");
            return;
        }

        // Use your original working GET query string contract that Code.gs's doGet handler expects
        const res = await fetch(`${sheetUrl}?tab=${encodeURIComponent(targetLedger)}&pin=${encodeURIComponent(pinVal)}`);
        const data = await res.json();

        if (data.status === "success") {
            currentTab = targetLedger;
            currentPin = pinVal;
            currentTheme = data.theme || "Silk";
            currentCurrency = data.currency || "USD";
            currentLang = data.language || "en";
            applyTheme(currentTheme);

            if (data.cardOrder) applyCardOrder(data.cardOrder);

            // Sanitize incoming members to prevent sparse gaps and duplicates
            const rawMembers = Array.isArray(data.members) ? data.members : [];
            const cleanServerMembers = rawMembers
                .map(m => (m || '').toString().trim())
                .filter(m => m.length > 0 && m.toLowerCase() !== 'members');

            const memberMap = new Map();
            [...cleanServerMembers, ...unsavedMembers].forEach(m => {
                const lower = m.toLowerCase();
                if (!memberMap.has(lower)) {
                    memberMap.set(lower, m);
                }
            });

            ledgerData.members = Array.from(memberMap.values());
            ledgerData.expenses = data.expenses || [];

            document.getElementById('welcomeModal')?.classList.add('hidden');
            render();
        } else {
            alert("Authentication failed: " + (data.message || "Invalid PIN"));
        }
    } catch (err) {
        console.error("Recall error:", err);
        alert("Failed to connect to backend ledger archive.");
    }
}
