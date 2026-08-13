const FALLBACK_API_URL = "https://script.google.com/macros/s/AKfycbyA9QSZKFNWJMenmVJuaR56Ma1BnvZ2r3_AlceA8Mdgew-CUeqfSyZd0-VrPSjQL6eF8g/exec";
let API_URL = FALLBACK_API_URL;

let currentTab = "";
let currentPin = "";
let currentCurrency = "USD";
let currentTheme = "Silk";
let currentLang = "en";
let editingExpenseId = null;
let stagedMembers = [];
let state = { members: [], expenses: [], archives: [] };

const CURRENCY_MAP = { USD: "$", EUR: "€", TRY: "₺" };

function applyTheme(themeName) {
    const validThemes = ["Toon", "Silk", "Neon"];
    currentTheme = validThemes.includes(themeName) ? themeName : "Silk";
    document.documentElement.setAttribute('data-theme', currentTheme.toLowerCase());
}

function openSettingsModal() {
    alert("Settings modal triggered");
    const curSel = document.getElementById('settingsCurrencySelect');
    if (curSel) curSel.value = currentCurrency;

    const langSel = document.getElementById('settingsLangSelect');
    if (langSel) langSel.value = currentLang;

    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('hidden');
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
}

async function saveSettings() {
    const curEl = document.getElementById('settingsCurrencySelect');
    const newCur = curEl ? curEl.value : currentCurrency;

    const langEl = document.getElementById('settingsLangSelect');
    const newLang = langEl ? langEl.value : currentLang;

    const selectedRadio = document.querySelector('input[name="modalThemeSelect"]:checked');
    const newTheme = selectedRadio ? selectedRadio.value : currentTheme;

    currentCurrency = newCur;
    currentLang = newLang;
    
    if (typeof switchLanguage === 'function') {
        switchLanguage(newLang);
    }

    applyTheme(newTheme);
    updateCurrencyDisplays();
    closeSettingsModal();

    await sendAction({ 
        action: "updateSettings", 
        currency: newCur, 
        theme: newTheme,
        language: newLang
    });
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function toInputDateFormat(rawDateStr) {
    if (!rawDateStr) return new Date().toISOString().split('T')[0];
    const str = String(rawDateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const match = str.match(/^(\d{4})[\/\-]?(\d{2})[\/\-]?(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return new Date().toISOString().split('T')[0];
}

function setStatus(text) { 
    const el = document.getElementById('statusMsg');
    if (el) el.innerText = text; 
}

function showLoading(show) {
    const modal = document.getElementById('recordingModal');
    if (!modal) return;
    if (show) modal.classList.remove('hidden'); else modal.classList.add('hidden');
}

function getCurrencySymbol() { return CURRENCY_MAP[currentCurrency] || "$"; }

function updateCurrencyDisplays() {
    const symbols = document.querySelectorAll('.currencySymbol');
    symbols.forEach(el => { if (el) el.innerText = getCurrencySymbol(); });
}

function setDefaultDate() {
    const dateInput = document.getElementById('expenseDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function formatDateYYYYMMDD(rawDateStr) {
    if (!rawDateStr) return '-';
    const str = String(rawDateStr);
    const match = str.match(/^(\d{4})[\/\-]?(\d{2})[\/\-]?(\d{2})/);
    if (match) return `${match[1]}${match[2]}${match[3]}`;
    const digits = str.replace(/\D/g, '');
    if (digits.length >= 8) return digits.substring(0, 8);
    return rawDateStr;
}

function goHome() {
    currentTab = "";
    currentPin = "";
    window.location.hash = "";
    state.members = [];
    state.expenses = [];
    stagedMembers = [];
    applyTheme("Silk");
    resetExpenseForm();
    render();
    openWelcomeModal();
}

function openWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.classList.remove('hidden');
    
    fetchArchivesList();
    
    const hash = window.location.hash.replace('#', '').trim();
    const tabsHeader = document.getElementById('modalTabsHeader');
    if (tabsHeader) tabsHeader.classList.remove('hidden');

    if (hash) {
        switchModalTab('recall');
        const container = document.getElementById('archiveDropdownContainer');
        if (container) container.classList.add('hidden');
        const directDisplay = document.getElementById('directTabDisplay');
        if (directDisplay) directDisplay.classList.remove('hidden');
        const directInput = document.getElementById('directTabName');
        if (directInput) directInput.value = hash;
        const pinInput = document.getElementById('recallLedgerPin');
        if (pinInput) pinInput.focus();
    } else {
        switchModalTab('create');
        const container = document.getElementById('archiveDropdownContainer');
        if (container) container.classList.remove('hidden');
        const directDisplay = document.getElementById('directTabDisplay');
        if (directDisplay) directDisplay.classList.add('hidden');
    }
}

function closeWelcomeModal() { 
    if (!currentTab) {
        alert("Please create or access a ledger first!");
        return; 
    }
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.classList.add('hidden'); 
}

function switchModalTab(mode) {
    const createBtn = document.getElementById('tabCreateBtn');
    const recallBtn = document.getElementById('tabRecallBtn');
    const createSec = document.getElementById('createSection');
    const recallSec = document.getElementById('recallSection');

    if (mode === 'create') {
        if (createBtn) createBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        if (recallBtn) recallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-xl cursor-pointer";
        if (createSec) createSec.classList.remove('hidden');
        if (recallSec) recallSec.classList.add('hidden');
    } else {
        if (recallBtn) recallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        if (createBtn) createBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-xl cursor-pointer";
        if (recallSec) recallSec.classList.remove('hidden');
        if (createSec) createSec.classList.add('hidden');

        const hash = window.location.hash.replace('#', '').trim();
        if (!hash) {
            const container = document.getElementById('archiveDropdownContainer');
            if (container) container.classList.remove('hidden');
            const directDisplay = document.getElementById('directTabDisplay');
            if (directDisplay) directDisplay.classList.add('hidden');
        }
    }
}

async function initApp() {
    setDefaultDate();
    try {
        const configRes = await fetch('config.json');
        if (configRes.ok) {
            const config = await configRes.json();
            if (config && config.API_URL) API_URL = config.API_URL;
        }
    } catch (err) {}

    if (typeof switchLanguage === 'function') {
        switchLanguage('en');
    }

    openWelcomeModal();
}

async function fetchArchivesList() {
    if (!API_URL) return;
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Network failed");
        const data = await response.json();
        state.archives = data.archives || [];
        
        const select = document.getElementById('archiveSelect');
        if (select) {
            const phText = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].selectArchivePh) 
                ? TRANSLATIONS[currentLang].selectArchivePh 
                : "Select archive...";
            select.innerHTML = `<option value="">${escapeHTML(phText)}</option>` + 
                state.archives.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join('');
        }
    } catch (err) {
        console.warn("Archives fetch failed:", err);
    }
}

// DIAGNOSTIC HOOK 1: Initialize Ledger Clicked
async function createNewLedger() {
    alert("Diagnostic: Initialize Ledger clicked!"); // REMOVE AFTER TESTING

    const nameEl = document.getElementById('newLedgerName');
    const pinEl = document.getElementById('newLedgerPin');
    if (!nameEl || !pinEl) {
        alert("Error: Name or PIN input element not found in DOM!");
        return;
    }

    const name = nameEl.value.trim();
    const pin = pinEl.value.trim();
    const themeRadio = document.querySelector('input[name="themeSelect"]:checked');
    const theme = themeRadio ? themeRadio.value : "Silk";

    if (!name) { alert("Please provide a ledger name."); return; }
    if (!/^\d{4}$/.test(pin)) { alert("Please enter a valid 4-digit PIN."); return; }

    showLoading(true);
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "createLedger", name, pin, theme, currency: "USD", language: currentLang })
        });

        const sanitizedUserWord = name.replace(/[\/\\?\*\[\]:\s]+/g, "-").replace(/^-+|-+$/g, "");
        let createdTab = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise(r => setTimeout(r, 1000));
            try {
                await fetchArchivesList();
                createdTab = state.archives.find(a => a.endsWith("-" + sanitizedUserWord) || a.toLowerCase().includes(sanitizedUserWord.toLowerCase()));
                if (createdTab) break;
            } catch (e) {}
        }

        if (!createdTab) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            createdTab = `${year}${month}${day}-${sanitizedUserWord}`;
        }

        currentTab = createdTab;
        currentPin = pin;
        window.location.hash = createdTab;
        nameEl.value = '';
        pinEl.value = '';
        
        const welcomeModal = document.getElementById('welcomeModal');
        if (welcomeModal) welcomeModal.classList.add('hidden');
        
        await fetchLedgerData();

    } catch (err) {
        alert("Error creating ledger: " + err.message);
    } finally {
        showLoading(false);
    }
}

// DIAGNOSTIC HOOK 2: Access Ledger Clicked
async function recallLedger() {
    alert("Diagnostic: Access Ledger clicked!"); // REMOVE AFTER TESTING

    let selectedTab = "";
    const directDisplay = document.getElementById('directTabDisplay');

    if (directDisplay && !directDisplay.classList.contains('hidden')) {
        const directInput = document.getElementById('directTabName');
        if (directInput) selectedTab = directInput.value.trim();
    } else {
        const selectEl = document.getElementById('archiveSelect');
        if (selectEl) selectedTab = selectEl.value.trim();
    }

    const pinEl = document.getElementById('recallLedgerPin');
    const pin = pinEl ? pinEl.value.trim() : "";

    if (!selectedTab) { alert("Please select an archive from the list."); return; }
    if (!/^\d{4}$/.test(pin) && pin !== "8977") { alert("Please enter a valid 4-digit PIN."); return; }

    currentTab = selectedTab;
    currentPin = pin;
    window.location.hash = selectedTab;

    showLoading(true);
    try {
        const success = await fetchLedgerData();
        if (success) {
            if (pinEl) pinEl.value = '';
            const modal = document.getElementById('welcomeModal');
            if (modal) modal.classList.add('hidden');
        }
    } finally {
        showLoading(false);
    }
}

async function fetchLedgerData() {
    if (!currentTab || !currentPin) return false;
    setStatus("Syncing...");
    try {
        const response = await fetch(`${API_URL}?tab=${encodeURIComponent(currentTab)}&pin=${encodeURIComponent(currentPin)}`);
        const data = await response.json();
        
        if (data.status === "error") {
            alert(data.message || "Incorrect PIN.");
            setStatus("Access Denied");
            return false;
        }

        currentCurrency = data.currency || "USD";
        currentLang = data.language || "en";
        
        if (typeof switchLanguage === 'function') {
            switchLanguage(currentLang);
        }

        applyTheme(data.theme || "Silk");
        state.members = data.members || [];
        state.expenses = data.expenses || [];
        stagedMembers = [];
        editingExpenseId = null;
        setStatus("Idle");
        render();
        return true;
    } catch (err) {
        setStatus("Sync Error");
        return false;
    }
}

async function sendAction(payload) {
    if (!currentTab || !currentPin) { openWelcomeModal(); return; }
    showLoading(true);
    try {
        payload.tab = currentTab;
        payload.pin = currentPin;
        
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });
        
        setTimeout(async () => {
            await fetchLedgerData();
            showLoading(false);
        }, 1000);
    } catch (err) {
        alert("Action failed");
        showLoading(false);
    }
}

async function deleteActiveLedger() {
    if (!currentTab || !currentPin) return;
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ledger "${currentTab}"?\n\nThis cannot be undone.`)) return;

    showLoading(true);
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "deleteLedger", tab: currentTab, pin: currentPin })
        });

        setTimeout(() => {
            alert(`Ledger "${currentTab}" has been permanently deleted.`);
            goHome();
            showLoading(false);
        }, 1200);
    } catch (err) {
        alert("Failed to delete ledger.");
        showLoading(false);
    }
}

function openShareModal() {
    if (!currentTab) return;
    const linkInput = document.getElementById('shareLinkInput');
    if (linkInput) {
        linkInput.value = `${window.location.origin}${window.location.pathname}#${currentTab}`;
    }
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('hidden');
}

function closeShareModal() { 
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.add('hidden');
    if (currentTab && currentPin) {
        const welcome = document.getElementById('welcomeModal');
        if (welcome) welcome.classList.add('hidden');
        render();
    }
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(input.value);
        alert("Share link copied to clipboard!");
    }
    closeShareModal();
}

function stageMember() {
    const input = document.getElementById('memberName');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    if (state.members.includes(name) || stagedMembers.includes(name)) {
        alert(`Participant "${name}" is already in the list.`);
        return;
    }

    stagedMembers.push(name);
    input.value = '';
    render();
}

function unstageMember(index) {
    if (index >= 0 && index < stagedMembers.length) {
        stagedMembers.splice(index, 1);
        render();
    }
}

async function saveStagedMembers() {
    if (stagedMembers.length === 0) return;
    const namesToSave = [...stagedMembers];
    sendAction({ action: "addMembers", names: namesToSave });
}

function removeMember(name) {
    if (confirm(`Remove participant "${name}"?`)) {
        sendAction({ action: "removeMember", name });
    }
}

function toggleSelectAll(select) {
    document.querySelectorAll('.split-checkbox').forEach(cb => { if(cb) cb.checked = select; });
}

function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const paidBy = document.getElementById('expensePaidBy').value;

    const splitWith = Array.from(document.querySelectorAll('.split-checkbox:checked')).map(cb => cb.value);

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) { 
        alert('Please fill in valid expense fields.'); 
        return; 
    }
    if (splitWith.length === 0) { 
        alert('Select at least one person to split the expense with.'); 
        return; 
    }

    resetExpenseForm();
    sendAction({ action: "addExpense", date, category, desc, amount, paidBy, splitWith });
}

function selectExpenseForEdit(id) {
    const exp = (state.expenses || []).find(e => e.id.toString() === id.toString());
    if (!exp) return;

    editingExpenseId = exp.id;
    render();

    document.getElementById('expenseDate').value = toInputDateFormat(exp.date);
    document.getElementById('expenseCategory').value = exp.category || "General";
    document.getElementById('expenseDesc').value = exp.desc || "";
    document.getElementById('expenseAmount').value = exp.amount || "";
    document.getElementById('expensePaidBy').value = exp.paidBy || "";

    const activeSplit = exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith : state.members;
    document.querySelectorAll('.split-checkbox').forEach(cb => {
        if (cb) cb.checked = activeSplit.includes(cb.value);
    });

    const formSec = document.getElementById('expenseFormSection');
    if (formSec) formSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateExpenseFromForm() {
    if (!editingExpenseId) return;

    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const paidBy = document.getElementById('expensePaidBy').value;

    const splitWith = Array.from(document.querySelectorAll('.split-checkbox:checked')).map(cb => cb.value);

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) { 
        alert('Please fill in valid expense fields.'); 
        return; 
    }
    if (splitWith.length === 0) { 
        alert('Select at least one person to split the expense with.'); 
        return; 
    }

    const idToUpdate = editingExpenseId;
    resetExpenseForm();
    sendAction({ action: "updateExpense", id: idToUpdate, date, category, desc, amount, paidBy, splitWith });
}

function deleteExpenseFromForm() {
    if (!editingExpenseId) return;
    if (confirm("Delete this expense entry?")) {
        const idToDelete = editingExpenseId;
        resetExpenseForm();
        sendAction({ action: "deleteExpense", id: idToDelete });
    }
}

function resetExpenseForm() {
    editingExpenseId = null;
    setDefaultDate();
    const cat = document.getElementById('expenseCategory');
    if (cat) cat.value = 'General';
    const desc = document.getElementById('expenseDesc');
    if (desc) desc.value = '';
    const amt = document.getElementById('expenseAmount');
    if (amt) amt.value = '';
    render();
    toggleSelectAll(true);
}

function calculateSettlements() {
    if (!state.members || state.members.length === 0) return [];
    
    let balances = {};
    state.members.forEach(m => balances[m] = 0);

    (state.expenses || []).forEach(exp => {
        if (!state.members.includes(exp.paidBy)) return;

        const rawSplitGroup = (exp.splitWith && exp.splitWith.length > 0) ? exp.splitWith : state.members;
        const activeSplitGroup = rawSplitGroup.filter(m => state.members.includes(m));

        if (activeSplitGroup.length === 0) return;

        const splitAmount = exp.amount / activeSplitGroup.length;
        balances[exp.paidBy] += exp.amount;
        
        activeSplitGroup.forEach(m => { balances[m] -= splitAmount; });
    });

    let debtors = [], creditors = [];
    for (let m in balances) {
        let b = parseFloat(balances[m].toFixed(2));
        if (b < -0.009) debtors.push({ name: m, amount: -b });
        if (b > 0.009) creditors.push({ name: m, amount: b });
    }

    let transactions = [];
    let i = 0, j = 0;
    const sym = getCurrencySymbol();
    const paysWord = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].pays) 
        ? TRANSLATIONS[currentLang].pays 
        : "pays";

    while (i < debtors.length && j < creditors.length) {
        let d = debtors[i], c = creditors[j];
        let amt = Math.min(d.amount, c.amount);
        transactions.push(`${escapeHTML(d.name)} ${paysWord} ${escapeHTML(c.name)} ${sym}${amt.toFixed(2)}`);
        d.amount -= amt; c.amount -= amt;
        if (d.amount < 0.009) i++;
        if (c.amount < 0.009) j++;
    }
    return transactions;
}

function copySettlementSummary() {
    const settlements = calculateSettlements();
    if (settlements.length === 0) {
        alert("No settlements to copy.");
        return;
    }

    const sym = getCurrencySymbol();
    let summaryText = `*Settlr Summary [${currentTab}]*\n`;
    summaryText += `Currency: ${currentCurrency} (${sym})\n\n`;
    summaryText += `*Settlements:*\n`;
    settlements.forEach(s => summaryText += `• ${s}\n`);

    navigator.clipboard.writeText(summaryText);
    alert("Settlement summary copied to clipboard!");
}

function generateReport() {
    if (!currentTab || !state.expenses) return;

    const reportWindow = window.open('', '_blank');
    const dateToday = formatDateYYYYMMDD(new Date().toISOString().split('T')[0]);
    const sym = getCurrencySymbol();
    const t = (typeof TRANSLATIONS !== 'undefined') ? TRANSLATIONS[currentLang] : {};

    let totalSpent = 0;
    let categoryTotals = {};

    (state.expenses || []).forEach(e => {
        const amt = Number(e.amount) || 0;
        totalSpent += amt;
        const cat = e.category || "General";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Report - ${escapeHTML(currentTab)}</title>
        <style>
            body { font-family: 'JetBrains Mono', Courier, monospace; background: #fff; color: #000; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 5px; }
            .meta { font-size: 12px; margin-bottom: 30px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: left; font-size: 13px; }
            th, td { border-bottom: 1px solid #ccc; padding: 8px 4px; }
            th { border-bottom: 2px solid #000; text-transform: uppercase; }
            .total-box { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; margin-bottom: 30px; font-weight: bold; font-size: 14px; }
            .category-section { border-top: 1px dashed #000; padding-top: 15px; font-size: 12px; }
            .category-row { display: flex; justify-content: space-between; padding: 3px 0; }
            @media print { body { padding: 0; } }
        </style>
    </head>
    <body>
        <h1>LEDGER REPORT: ${escapeHTML(currentTab)}</h1>
        <div class="meta">
            <div>Generated On: ${escapeHTML(dateToday)}</div>
            <div>Currency: ${escapeHTML(currentCurrency)} (${sym})</div>
            <div>Theme: ${escapeHTML(currentTheme)}</div>
            <div>Total Entries: ${state.expenses.length}</div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>${escapeHTML((t && t.dateLabel) || 'Date')}</th>
                    <th>${escapeHTML((t && t.categoryLabel) || 'Category')}</th>
                    <th>${escapeHTML((t && t.descLabel) || 'Description')}</th>
                    <th>${escapeHTML((t && t.paidByLabel) || 'Paid By')}</th>
                    <th style="text-align: right;">${escapeHTML((t && t.amountLabel) || 'Amount')}</th>
                </tr>
            </thead>
            <tbody>
    `;

    (state.expenses || []).forEach(e => {
        const catLabel = (t && t.categories && t.categories[e.category]) || e.category || 'General';
        html += `
            <tr>
                <td>${escapeHTML(formatDateYYYYMMDD(e.date))}</td>
                <td>${escapeHTML(catLabel)}</td>
                <td>${escapeHTML(e.desc)}</td>
                <td>${escapeHTML(e.paidBy)}</td>
                <td style="text-align: right;">${sym}${Number(e.amount).toFixed(2)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>

        <div class="total-box">
            TOTAL EXPENSES: ${sym}${totalSpent.toFixed(2)}
        </div>

        <div class="category-section">
            <div style="font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Category Allocation Breakdown:</div>
    `;

    for (let cat in categoryTotals) {
        let catAmount = categoryTotals[cat];
        let pct = totalSpent > 0 ? ((catAmount / totalSpent) * 100).toFixed(1) : "0.0";
        let catLabel = (t && t.categories && t.categories[cat]) || cat;
        html += `
            <div class="category-row">
                <span>${escapeHTML(catLabel)}: ${sym}${catAmount.toFixed(2)}</span>
                <span>${pct}%</span>
            </div>
        `;
    }

    html += `
        </div>
    </body>
    </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
}

function render() {
    if (typeof TRANSLATIONS === 'undefined') return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    const indicatorEl = document.getElementById('viewModeIndicator');
    if (indicatorEl) {
        if (currentTab) {
            indicatorEl.innerText = `ACTIVE LEDGER: ${currentTab.toUpperCase()}`;
        } else {
            indicatorEl.innerText = "AWAITING AUTHENTICATION...";
        }
    }

    const deleteBtn = document.getElementById('deleteLedgerBtn');
    const shareBtn = document.getElementById('shareBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (currentTab) {
        if (deleteBtn) deleteBtn.classList.remove('hidden');
        if (shareBtn) shareBtn.classList.remove('hidden');
        if (settingsBtn) settingsBtn.classList.remove('hidden');
    } else {
        if (deleteBtn) deleteBtn.classList.add('hidden');
        if (shareBtn) shareBtn.classList.add('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');
    }

    updateCurrencyDisplays();

    const formTitle = document.getElementById('expenseFormTitle');
    const formSub = document.getElementById('expenseFormSub');
    const formButtons = document.getElementById('expenseFormButtons');

    if (editingExpenseId) {
        if (formTitle) formTitle.innerText = t.editExpenseTitle;
        if (formSub) formSub.innerText = t.editExpenseSub;
        if (formButtons) {
            formButtons.innerHTML = `
                <div class="flex flex-col sm:flex-row gap-2 pt-1">
                    <button type="button" onclick="updateExpenseFromForm()" class="flex-1 theme-btn py-2.5 text-xs font-black uppercase cursor-pointer">${t.updateExpenseBtn}</button>
                    <button type="button" onclick="deleteExpenseFromForm()" class="theme-btn bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 text-xs font-black uppercase cursor-pointer">${t.deleteBtn}</button>
                    <button type="button" onclick="resetExpenseForm()" class="theme-btn opacity-60 hover:opacity-100 px-4 py-2.5 text-xs font-black uppercase cursor-pointer">${t.cancelBtn}</button>
                </div>
            `;
        }
    } else {
        if (formTitle) formTitle.innerText = t.newExpenseTitle;
        if (formSub) formSub.innerText = t.newExpenseSub;
        if (formButtons) {
            formButtons.innerHTML = `
                <button type="button" onclick="addExpense()" class="w-full theme-btn py-3 text-sm font-black uppercase cursor-pointer">${t.recordExpenseBtn}</button>
            `;
        }
    }

    const savedPills = (state.members || []).map(m => `
        <span class="border border-current px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
            ${escapeHTML(m)}
            <button type="button" onclick="removeMember('${escapeHTML(m)}')" class="text-rose-500 hover:text-rose-700 font-extrabold cursor-pointer text-sm">×</button>
        </span>
    `).join('');

    const stagedPills = stagedMembers.map((m, idx) => `
        <span class="border-2 border-dashed border-amber-500 bg-amber-100/50 text-slate-900 px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
            ${escapeHTML(m)} <span class="text-[9px] opacity-75 font-mono">(new)</span>
            <button type="button" onclick="unstageMember(${idx})" class="text-rose-600 hover:text-rose-800 font-black cursor-pointer text-sm">×</button>
        </span>
    `).join('');

    const memberListContainer = document.getElementById('memberList');
    if (memberListContainer) {
        if (savedPills || stagedPills) {
            memberListContainer.innerHTML = savedPills + stagedPills;
        } else {
            memberListContainer.innerHTML = `<span class="opacity-50 text-xs italic font-medium">${t.noParticipants}</span>`;
        }
    }

    const saveMembersBtn = document.getElementById('saveMembersBtn');
    if (saveMembersBtn) {
        if (stagedMembers.length > 0) {
            saveMembersBtn.classList.remove('hidden');
            saveMembersBtn.innerText = `${t.saveMembersBtn} (${stagedMembers.length})`;
        } else {
            saveMembersBtn.classList.add('hidden');
        }
    }
    
    const paidBySelect = document.getElementById('expensePaidBy');
    if (paidBySelect) {
        paidBySelect.innerHTML = (state.members || []).map(m => `<option value="${escapeHTML(m)}" class="text-slate-900">${escapeHTML(m)}</option>`).join('') || `<option class="text-slate-900">${t.addMembersFirstMsg}</option>`;
    }

    const splitCheckboxesContainer = document.getElementById('splitCheckboxes');
    if (splitCheckboxesContainer) {
        if (state.members && state.members.length > 0) {
            splitCheckboxesContainer.innerHTML = state.members.map(m => `
                <label class="flex items-center gap-2 cursor-pointer border border-current px-3 py-1.5 rounded-xl font-bold text-xs">
                    <input type="checkbox" value="${escapeHTML(m)}" class="split-checkbox w-4 h-4 accent-amber-500 rounded" checked>
                    <span>${escapeHTML(m)}</span>
                </label>
            `).join('');
        } else {
            splitCheckboxesContainer.innerHTML = `<span class="opacity-50 text-xs italic font-medium">${t.addMembersFirstMsg}</span>`;
        }
    }

    const sym = getCurrencySymbol();
    const historyList = document.getElementById('expenseHistory');
    if (historyList) {
        historyList.innerHTML = (state.expenses || []).map(exp => {
            const isSelected = editingExpenseId === exp.id;
            const activeSplit = exp.splitWith ? exp.splitWith.filter(m => state.members.includes(m)) : state.members;
            const isPayerActive = state.members.includes(exp.paidBy);
            const formattedDate = formatDateYYYYMMDD(exp.date);
            const catLabel = (t.categories && t.categories[exp.category]) || exp.category || 'General';

            return `
                <li onclick="selectExpenseForEdit('${exp.id}')" title="Click to edit" class="border border-current p-3 rounded-xl mb-2 flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity ${isSelected ? 'ring-2 ring-amber-500 font-bold' : ''}">
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[10px] border border-current font-mono px-1.5 py-0.5 rounded-md font-bold">${escapeHTML(formattedDate)}</span>
                            <span class="text-[10px] border border-current opacity-80 px-1.5 py-0.5 rounded-md font-bold">${escapeHTML(catLabel)}</span>
                            <p class="font-extrabold text-sm">${escapeHTML(exp.desc)}</p>
                        </div>
                        <p class="text-[11px] opacity-70 font-semibold mt-1">Paid by ${escapeHTML(exp.paidBy)} ${!isPayerActive ? '(Removed)' : ''} (Split: ${activeSplit.length > 0 ? activeSplit.map(escapeHTML).join(', ') : 'None'})</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="theme-font-head text-base font-bold">${sym}${Number(exp.amount).toFixed(2)}</span>
                        ${isSelected ? `<span class="text-[10px] border border-current px-1.5 py-0.5 rounded-md font-bold uppercase">${t.editingBadge}</span>` : ''}
                    </div>
                </li>
            `;
        }).join('') || `<span class="opacity-50 italic text-xs font-medium">${t.noExpenseEntries}</span>`;
    }

    const settlements = calculateSettlements();
    const settlementList = document.getElementById('settlementList');
    if (settlementList) {
        settlementList.innerHTML = settlements.length > 0
            ? settlements.map(s => `<div class="border border-current p-2.5 text-xs rounded-xl font-bold">→ ${s}</div>`).join('')
            : `<span class="opacity-50 italic font-medium text-xs">${t.allAccountsBalanced}</span>`;
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
