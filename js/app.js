/**
 * ==========================================================================
 * SPENSE - Group Expense Tracker Main Controller Engine
 * ==========================================================================
 */

console.log("%c[SPENSE] Engine & Controller Loaded Successfully.", "color: #059669; font-weight: bold;");

let currentTab = null;
let currentPin = null;
let currentLang = 'en';
let currentCurrency = 'USD';
let currentTheme = 'Silk';
let ledgerData = { members: [], expenses: [] };

let selectedModalLang = 'en';
let selectedModalCurrency = 'USD';
let selectedModalTheme = 'Silk';

let unsavedMembers = [];
let editingExpenseId = null;

function TRANSLATIONS() {
    return (typeof I18N_TRANSLATIONS !== 'undefined' ? I18N_TRANSLATIONS : {})[currentLang] || 
           (typeof I18N_TRANSLATIONS !== 'undefined' ? I18N_TRANSLATIONS['en'] : {});
}

function formatToISODate(rawDate) {
    if (!rawDate) {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    if (rawDate instanceof Date) {
        if (isNaN(rawDate.getTime())) rawDate = new Date();
        return `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, '0')}-${String(rawDate.getDate()).padStart(2, '0')}`;
    }
    const str = rawDate.toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
}

function findMemberCanonical(targetName) {
    if (!targetName) return targetName;
    const match = ledgerData.members.find(m => m.toLowerCase() === targetName.toLowerCase());
    return match || targetName;
}

function selectSettingsLang(lang) {
    selectedModalLang = lang;
    ['tr', 'en', 'de'].forEach(l => {
        const btn = document.getElementById(`setLang${l.toUpperCase()}`);
        if (btn) {
            btn.className = l === lang 
                ? "theme-btn py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-extrabold rounded-xl transition cursor-pointer option-btn-selected"
                : "theme-btn py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-extrabold border-2 border-slate-200 rounded-xl hover:border-slate-400 bg-slate-50 transition cursor-pointer opacity-50";
        }
    });
}

function selectSettingsCurrency(curr) {
    selectedModalCurrency = curr;
    ['USD', 'EUR', 'TRY'].forEach(c => {
        const btn = document.getElementById(`setCurr${c}`);
        if (btn) {
            btn.className = c === curr 
                ? "theme-btn py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer option-btn-selected"
                : "theme-btn py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold border-2 border-slate-200 rounded-xl hover:border-slate-400 bg-slate-50 transition cursor-pointer opacity-50";
        }
    });
}

function selectSettingsTheme(theme) {
    selectedModalTheme = theme;
    const themeStyles = { Silk: 'bg-slate-50 text-slate-900', Toon: 'bg-amber-100 text-slate-900', Neon: 'bg-slate-950 text-cyan-400' };

    ['Silk', 'Toon', 'Neon'].forEach(t => {
        const btn = document.getElementById(`setTheme${t}`);
        if (btn) {
            const baseBg = themeStyles[t] || 'bg-slate-50';
            btn.className = t === theme 
                ? `theme-btn py-3 px-2 ${baseBg} rounded-xl text-center transition cursor-pointer option-btn-selected`
                : `theme-btn py-3 px-2 border-2 border-slate-200 ${baseBg} rounded-xl text-center transition cursor-pointer opacity-50`;
        }
    });
}

function openSettingsModal() { 
    selectedModalLang = currentLang;
    selectedModalCurrency = currentCurrency;
    selectedModalTheme = currentTheme;
    selectSettingsLang(selectedModalLang);
    selectSettingsCurrency(selectedModalCurrency);
    selectSettingsTheme(selectedModalTheme);
    document.getElementById('settingsModal')?.classList.remove('hidden'); 
}

function closeSettingsModal() { 
    document.getElementById('settingsModal')?.classList.add('hidden'); 
}

async function saveSettings() {
    currentLang = selectedModalLang;
    currentCurrency = selectedModalCurrency;
    applyTheme(selectedModalTheme);
    document.getElementById('settingsModal')?.classList.add('hidden');
    render();
    initTaglineCarousel();

    if (currentTab) {
        await callBackend('updateSettings', { language: currentLang, currency: currentCurrency, theme: currentTheme });
    }
}

let taglineTimer = null;
let currentTaglineIndex = 0;

function initTaglineCarousel() {
    const spot = document.getElementById('taglineSpot');
    if (!spot) return;
    if (taglineTimer) clearInterval(taglineTimer);
    const motionClasses = ['motion-left', 'motion-right', 'motion-top', 'motion-bottom'];

    function cycleTagline() {
        const t = TRANSLATIONS();
        const activeTaglines = t.taglines || [];
        if (activeTaglines.length === 0) return;
        spot.className = "w-full text-center leading-snug";
        void spot.offsetWidth;
        spot.innerHTML = activeTaglines[currentTaglineIndex % activeTaglines.length];
        spot.className = "w-full text-center leading-snug " + motionClasses[Math.floor(Math.random() * motionClasses.length)];
        currentTaglineIndex++;
    }

    cycleTagline();
    taglineTimer = setInterval(cycleTagline, 3200);
}

function initCardDragging() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    container.querySelectorAll('.card-drag-handle').forEach(handle => {
        const card = handle.closest('.theme-card');
        if (!card) return;
        handle.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', '');
            card.classList.add('opacity-40', 'scale-95');
            window._draggedCard = card;
        });
        handle.addEventListener('dragend', () => {
            card.classList.remove('opacity-40', 'scale-95');
            container.querySelectorAll('.theme-card').forEach(c => c.classList.remove('border-amber-400', 'border-4', 'border-dashed'));
            window._draggedCard = null;
        });
        card.addEventListener('dragover', (e) => { e.preventDefault(); });
        card.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (window._draggedCard && window._draggedCard !== card) card.classList.add('border-amber-400', 'border-4', 'border-dashed');
        });
        card.addEventListener('dragleave', () => card.classList.remove('border-amber-400', 'border-4', 'border-dashed'));
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('border-amber-400', 'border-4', 'border-dashed');
            if (window._draggedCard && window._draggedCard !== card) {
                const dragged = window._draggedCard;
                const parent = card.parentNode;
                const tempNode = document.createTextNode('');
                parent.replaceChild(tempNode, dragged);
                parent.replaceChild(dragged, card);
                parent.replaceChild(card, tempNode);
                document.getElementById('layoutActionBar')?.classList.remove('hidden');
            }
        });
    });
}

function getCurrentCardOrder() {
    const container = document.getElementById('appContainer');
    if (!container) return [];
    return Array.from(container.querySelectorAll('.theme-card')).map(card => card.getAttribute('data-card-id')).filter(Boolean);
}

function applyCardOrder(orderArray) {
    if (!Array.isArray(orderArray) || orderArray.length === 0) return;
    const container = document.getElementById('appContainer');
    if (!container) return;
    orderArray.forEach(id => {
        const card = container.querySelector(`[data-card-id="${id}"]`);
        if (card) container.appendChild(card);
    });
}

async function saveCardLayout() {
    if (!currentTab) return;
    const res = await callBackend('updateSettings', { cardOrder: getCurrentCardOrder() });
    if (res && res.status === "success") {
        document.getElementById('layoutActionBar')?.classList.add('hidden');
        alert("Layout saved successfully!");
    }
}

async function getConfig() {
    try {
        const configRes = await fetch('config.json');
        if (!configRes.ok) throw new Error("config.json missing");
        const config = await configRes.json();
        return config.sheetUrl || config.googleSheetApiUrl || config.apiUrl;
    } catch (err) {
        return null;
    }
}

async function callBackend(action, payload = {}) {
    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) return { status: "error", message: "Missing config.json sheetUrl" };
        const response = await fetch(sheetUrl, {
            method: 'POST',
            body: JSON.stringify({ action, tab: currentTab, pin: currentPin, ...payload })
        });
        return await response.json();
    } catch (err) {
        return { status: "error", message: err.toString() };
    }
}

async function loadGoogleSheetsArchive() {
    const select = document.getElementById('archiveSelect');
    if (!select) return;
    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) return;
        const res = await fetch(sheetUrl);
        const rawData = await res.json();
        let ledgers = Array.isArray(rawData) ? rawData : (rawData.archives || rawData.sheets || Object.keys(rawData));
        
        ledgers = ledgers.filter(Boolean).filter(name => {
            const lower = name.toString().trim().toLowerCase();
            return lower !== 'metadata' && lower !== 'counter';
        });

        select.innerHTML = `<option value="">-- Select a Ledger Tab --</option>` + 
            ledgers.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
    } catch (error) {
        select.innerHTML = `<option value="">-- Error loading archives --</option>`;
    }
}

function switchModalTab(tabMode) {
    const createSec = document.getElementById('createSection');
    const recallSec = document.getElementById('recallSection');
    const tabCreateBtn = document.getElementById('tabCreateBtn');
    const tabRecallBtn = document.getElementById('tabRecallBtn');
    if (!createSec || !recallSec) return;

    if (tabMode === 'create') {
        createSec.classList.remove('hidden');
        recallSec.classList.add('hidden');
        if (tabCreateBtn) tabCreateBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        if (tabRecallBtn) tabRecallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-transparent text-slate-500 rounded-xl cursor-pointer";
    } else {
        createSec.classList.add('hidden');
        recallSec.classList.remove('hidden');
        if (tabRecallBtn) tabRecallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        if (tabCreateBtn) tabCreateBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-transparent text-slate-500 rounded-xl cursor-pointer";
        loadGoogleSheetsArchive();
    }
}

async function createNewLedger() {
    const nameVal = document.getElementById('newLedgerName')?.value.trim().toLowerCase().replace(/\s+/g, '-');
    const pinVal = document.getElementById('newLedgerPin')?.value.trim();
    if (!nameVal || pinVal.length !== 4) {
        alert("Please enter a valid ledger name and a 4-digit PIN.");
        return;
    }
    const res = await callBackend('createLedger', { name: nameVal, pin: pinVal, theme: currentTheme, currency: currentCurrency, language: currentLang, cardOrder: getCurrentCardOrder() });
    if (res && res.status === "success") {
        currentTab = res.createdTab;
        currentPin = pinVal;
        ledgerData = { members: [], expenses: [] };
        unsavedMembers = [];
        document.getElementById('welcomeModal')?.classList.add('hidden');
        render();
    } else {
        alert("Failed to create ledger: " + (res?.message || "Unknown error"));
    }
}

async function recallLedger() {
    const targetLedger = document.getElementById('archiveSelect')?.value;
    const pinVal = document.getElementById('recallLedgerPin')?.value.trim();
    if (!targetLedger || pinVal.length !== 4) {
        alert("Please select a ledger and enter your 4-digit PIN.");
        return;
    }
    try {
        const sheetUrl = await getConfig();
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
            ledgerData.members = data.members || [];
            ledgerData.expenses = data.expenses || [];
            document.getElementById('welcomeModal')?.classList.add('hidden');
            render();
        } else {
            alert("Authentication failed: " + (data.message || "Invalid PIN"));
        }
    } catch (err) {
        alert("Failed to connect to backend ledger archive.");
    }
}

function openShareModal() {
    document.getElementById('shareModal')?.classList.remove('hidden');
    const input = document.getElementById('shareLinkInput');
    if (input && currentTab) input.value = `${window.location.origin}${window.location.pathname}?ledger=${encodeURIComponent(currentTab)}`;
}
function closeShareModal() { document.getElementById('shareModal')?.classList.add('hidden'); }
function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    if (input) { input.select(); navigator.clipboard.writeText(input.value); alert("Copied share link!"); }
}

function goHome() {
    currentTab = null;
    currentPin = null;
    ledgerData = { members: [], expenses: [] };
    unsavedMembers = [];
    editingExpenseId = null;
    document.getElementById('welcomeModal')?.classList.remove('hidden');
    render();
    initTaglineCarousel();
}

async function deleteActiveLedger() {
    if (!confirm("Delete active ledger?")) return;
    await callBackend('deleteLedger');
    goHome();
}

async function addMemberDirect() {
    const input = document.getElementById('memberName');
    if (!input) return;
    const name = input.value.trim();
    if (!name || !currentTab) return;
    if (ledgerData.members.some(m => m.toLowerCase() === name.toLowerCase())) {
        alert("Participant already exists.");
        input.value = '';
        return;
    }
    ledgerData.members.push(name);
    if (!unsavedMembers.includes(name)) unsavedMembers.push(name);
    input.value = '';
    render();
    const res = await callBackend('addMembers', { names: [name] });
    if (res && res.status === "success") {
        unsavedMembers = unsavedMembers.filter(m => m !== name);
        render();
    }
}

async function saveMembers() {
    if (unsavedMembers.length === 0) return;
    const res = await callBackend('addMembers', { names: unsavedMembers });
    if (res && res.status === "success") {
        unsavedMembers = [];
        render();
        alert("Participants saved to sheet!");
    }
}

async function deleteMember(name, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const canonicalName = findMemberCanonical(name);
    if (!confirm(`Remove participant '${canonicalName}'?`)) return;
    ledgerData.members = ledgerData.members.filter(m => m.toLowerCase() !== canonicalName.toLowerCase());
    unsavedMembers = unsavedMembers.filter(m => m.toLowerCase() !== canonicalName.toLowerCase());
    render();
    await callBackend('removeMember', { name: canonicalName });
}

function startEditExpense(id) {
    const exp = ledgerData.expenses.find(e => e.id.toString() === id.toString());
    if (!exp) return;
    editingExpenseId = id.toString();
    document.getElementById('expenseDate').value = formatToISODate(exp.date);
    document.getElementById('expenseDesc').value = exp.desc || '';
    document.getElementById('expenseAmount').value = exp.amount || '';
    document.getElementById('expenseCategory').value = exp.category || 'Food & Drink';
    document.getElementById('expensePaidBy').value = findMemberCanonical(exp.paidBy) || '';
    const splitArr = (Array.isArray(exp.splitWith) ? exp.splitWith : []).map(s => s.toLowerCase());
    document.querySelectorAll('.split-checkbox').forEach(cb => { cb.checked = splitArr.includes(cb.value.toLowerCase()); });
    render();
    document.getElementById('expenseFormSection')?.scrollIntoView({ behavior: 'smooth' });
}

function cancelEditExpense() {
    editingExpenseId = null;
    resetExpenseForm();
    render();
}

function resetExpenseForm() {
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = formatToISODate(new Date());
    document.querySelectorAll('.split-checkbox').forEach(cb => cb.checked = true);
}

async function updateExpense() {
    if (!editingExpenseId) return;
    const date = formatToISODate(document.getElementById('expenseDate')?.value);
    const desc = document.getElementById('expenseDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount')?.value);
    const paidBy = findMemberCanonical(document.getElementById('expensePaidBy')?.value);
    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) { alert("Fill all fields properly."); return; }
    const splitWith = Array.from(document.querySelectorAll('.split-checkbox:checked')).map(cb => findMemberCanonical(cb.value));
    if (splitWith.length === 0) { alert("Select at least one participant."); return; }
    const category = document.getElementById('expenseCategory')?.value || "General";
    
    const idx = ledgerData.expenses.findIndex(e => e.id.toString() === editingExpenseId);
    if (idx !== -1) ledgerData.expenses[idx] = { id: editingExpenseId, date, category, desc, amount, paidBy, splitWith };
    const targetId = editingExpenseId;
    editingExpenseId = null;
    resetExpenseForm();
    render();
    await callBackend('updateExpense', { id: targetId, date, category, desc, amount, paidBy, splitWith });
}

async function deleteExpenseFromEdit() {
    if (!editingExpenseId || !confirm("Delete expense?")) return;
    const targetId = editingExpenseId;
    ledgerData.expenses = ledgerData.expenses.filter(e => e.id.toString() !== targetId);
    editingExpenseId = null;
    resetExpenseForm();
    render();
    await callBackend('deleteExpense', { id: targetId });
}

async function addExpense() {
    const date = formatToISODate(document.getElementById('expenseDate')?.value);
    const desc = document.getElementById('expenseDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount')?.value);
    const paidBy = findMemberCanonical(document.getElementById('expensePaidBy')?.value);
    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) { alert("Fill all fields correctly."); return; }
    const splitWith = Array.from(document.querySelectorAll('.split-checkbox:checked')).map(cb => findMemberCanonical(cb.value));
    if (splitWith.length === 0) { alert("Select at least one participant."); return; }
    const category = document.getElementById('expenseCategory')?.value || "General";
    const id = Date.now().toString();

    ledgerData.expenses.push({ id, date, category, desc, amount, paidBy, splitWith });
    resetExpenseForm();
    render();
    await callBackend('addExpense', { id, date, category, desc, amount, paidBy, splitWith });
}

function calculateSettlement() {
    const balances = {};
    const lowerMap = {};
    ledgerData.members.forEach(m => { balances[m.toLowerCase()] = 0; lowerMap[m.toLowerCase()] = m; });
    ledgerData.expenses.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        const splitList = (Array.isArray(e.splitWith) ? e.splitWith : []).map(s => s.toLowerCase());
        if (splitList.length === 0) return;
        const share = amt / splitList.length;
        const payerKey = (e.paidBy || '').toLowerCase();
        if (balances[payerKey] !== undefined) balances[payerKey] += amt;
        splitList.forEach(mKey => { if (balances[mKey] !== undefined) balances[mKey] -= share; });
    });

    const debtors = [], creditors = [];
    Object.keys(balances).forEach(key => {
        const bal = balances[key];
        const name = lowerMap[key] || key;
        if (bal < -0.01) debtors.push({ member: name, amount: -bal });
        else if (bal > 0.01) creditors.push({ member: name, amount: bal });
    });

    const transactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const minAmt = Math.min(debtors[i].amount, creditors[j].amount);
        transactions.push(`${debtors[i].member} owes ${creditors[j].member} ${getCurrencySymbol()}${minAmt.toFixed(2)}`);
        debtors[i].amount -= minAmt;
        creditors[j].amount -= minAmt;
        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }
    return transactions;
}

function copySettlementSummary() {
    const txs = calculateSettlement();
    if (txs.length === 0) { alert("No balances to copy."); return; }
    const text = `=== SETTLEMENT ===\n` + txs.join('\n');
    navigator.clipboard.writeText(text).then(() => alert("Summary copied!"));
}

function generateLedgerReport() {
    if (!currentTab) return;
    const sym = getCurrencySymbol();
    let total = 0;
    ledgerData.expenses.forEach(e => total += (parseFloat(e.amount) || 0));
    const settlement = calculateSettlement();
    let report = `SPENSE REPORT\nLedger: ${currentTab}\nTotal: ${sym}${total.toFixed(2)}\n\nSETTLEMENT:\n` + settlement.join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
}

function getCurrencySymbol() {
    return currentCurrency === 'EUR' ? '€' : currentCurrency === 'TRY' ? '₺' : '$';
}

function applyTheme(themeName) {
    currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName.toLowerCase());
}

function switchLanguage(lang) {
    currentLang = lang;
    render();
    initTaglineCarousel();
}

function selectAllSplits() {
    document.querySelectorAll('.split-checkbox').forEach(cb => cb.checked = true);
}

function render() {
    const t = TRANSLATIONS();
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if (t[k]) el.innerText = t[k]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { const k = el.getAttribute('data-i18n-ph'); if (t[k]) el.placeholder = t[k]; });
    
    const symEl = document.getElementById('currencySymbol');
    if (symEl) symEl.innerText = getCurrencySymbol();

    const indicatorEl = document.getElementById('viewModeIndicator');
    if (indicatorEl) {
        indicatorEl.innerHTML = currentTab ? 
            `<span class="text-sm font-medium uppercase tracking-wider opacity-70">Active ledger:</span><span class="text-2xl sm:text-4xl font-extrabold break-words leading-tight mt-0.5 block">${currentTab.toUpperCase()}</span>` :
            `<span class="text-sm font-medium uppercase tracking-wider opacity-70">Active ledger:</span><span class="text-2xl sm:text-4xl font-extrabold break-words leading-tight mt-0.5 block">AWAITING AUTHENTICATION...</span>`;
    }

    ['btnDeleteLedger', 'btnOpenShare', 'btnOpenSettings'].forEach(id => {
        document.getElementById(id)?.classList.toggle('hidden', !currentTab);
    });

    renderMembers();
    renderExpenseFormHeader();
    renderDropdowns();
    renderSplitCheckboxes();
    renderHistory();
    renderSettlement();
}

function renderMembers() {
    const container = document.getElementById('memberList');
    const saveBtn = document.getElementById('btnSaveMembers');
    if (!container) return;
    container.innerHTML = ledgerData.members.length > 0 
        ? ledgerData.members.map(m => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl ${unsavedMembers.includes(m) ? 'bg-amber-200 text-amber-900 border border-amber-400' : 'bg-slate-200 text-slate-800'} font-bold">
                ${escapeHTML(m)}
                <button type="button" data-member="${escapeHTML(m)}" onclick="window.deleteMember(this.getAttribute('data-member'), event)" class="text-rose-600 font-black text-xs ml-1 cursor-pointer">×</button>
            </span>
        `).join('') : '<span class="opacity-60 italic">No participants yet.</span>';
    if (saveBtn) saveBtn.classList.toggle('hidden', unsavedMembers.length === 0);
}

function renderExpenseFormHeader() {
    const titleEl = document.getElementById('expenseFormTitle');
    const subEl = document.getElementById('expenseFormSub');
    const actionsContainer = document.getElementById('expenseFormActions');
    if (!titleEl || !subEl || !actionsContainer) return;
    const t = TRANSLATIONS();

    if (editingExpenseId) {
        titleEl.innerText = t.editExpenseTitle;
        subEl.innerText = t.editExpenseSub;
        actionsContainer.innerHTML = `
            <div class="grid grid-cols-3 gap-2">
                <button type="button" onclick="window.deleteExpenseFromEdit()" class="theme-btn bg-rose-500 text-white py-3 text-xs font-black uppercase rounded-xl cursor-pointer">${t.deleteExpenseBtn}</button>
                <button type="button" onclick="window.cancelEditExpense()" class="theme-btn bg-slate-200 text-slate-800 py-3 text-xs font-black uppercase rounded-xl cursor-pointer">${t.cancelEditBtn}</button>
                <button type="button" onclick="window.updateExpense()" class="theme-btn bg-emerald-400 text-slate-900 py-3 text-xs font-black uppercase rounded-xl cursor-pointer">${t.updateExpenseBtn}</button>
            </div>
        `;
    } else {
        titleEl.innerText = t.newExpenseTitle;
        subEl.innerText = t.newExpenseSub;
        actionsContainer.innerHTML = `<button type="button" onclick="window.addExpense()" class="w-full theme-btn py-3 text-sm font-extrabold cursor-pointer">${t.recordExpenseBtn}</button>`;
    }
}

function renderDropdowns() {
    const catSelect = document.getElementById('expenseCategory');
    const paidSelect = document.getElementById('expensePaidBy');
    if (!catSelect || !paidSelect) return;
    catSelect.innerHTML = ["Food & Drink", "Transport", "Accommodation", "Shopping", "Entertainment", "Other"].map(c => `<option value="${c}">${c}</option>`).join('');
    paidSelect.innerHTML = ledgerData.members.length > 0 ? ledgerData.members.map(m => `<option value="${escapeHTML(m)}">${escapeHTML(m)}</option>`).join('') : '<option value="">No participants</option>';
}

function renderSplitCheckboxes() {
    const container = document.getElementById('splitCheckboxes');
    if (!container) return;
    const selected = Array.from(document.querySelectorAll('.split-checkbox:checked')).map(cb => cb.value.toLowerCase());
    container.innerHTML = ledgerData.members.length > 0 ? ledgerData.members.map(m => `
        <label class="flex items-center gap-1.5 cursor-pointer bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-300 font-semibold">
            <input type="checkbox" value="${escapeHTML(m)}" ${selected.length === 0 || selected.includes(m.toLowerCase()) ? 'checked' : ''} class="split-checkbox accent-slate-900 cursor-pointer"> ${escapeHTML(m)}
        </label>
    `).join('') : '<span class="opacity-60 italic">Add participants first.</span>';
}

function renderHistory() {
    const list = document.getElementById('expenseHistory');
    if (!list) return;
    list.innerHTML = ledgerData.expenses.length > 0 ? ledgerData.expenses.map(e => `
        <li class="p-2.5 rounded-xl border border-current/15 flex justify-between items-center bg-current/5 gap-2">
            <div class="flex-1 min-w-0">
                <span class="font-bold truncate block">${escapeHTML(e.desc)} (${escapeHTML(e.category)})</span>
                <div class="text-[10px] opacity-70">Paid by ${escapeHTML(findMemberCanonical(e.paidBy))} • ${formatToISODate(e.date)}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                <span class="font-extrabold text-sm">${getCurrencySymbol()}${parseFloat(e.amount).toFixed(2)}</span>
                <button type="button" data-id="${e.id}" onclick="window.startEditExpense(this.getAttribute('data-id'))" class="theme-btn px-2.5 py-1 text-[10px] font-black uppercase bg-amber-300 text-slate-900 cursor-pointer">Edit</button>
            </div>
        </li>
    `).join('') : '<li class="opacity-60 italic text-center py-4">No expenses recorded yet.</li>';
}

function renderSettlement() {
    const container = document.getElementById('settlementList');
    if (!container) return;
    if (ledgerData.expenses.length === 0 || ledgerData.members.length === 0) {
        container.innerHTML = '<p class="opacity-60 italic text-center py-4">Settlement matrix will appear once expenses are added.</p>';
        return;
    }
    const txs = calculateSettlement();
    container.innerHTML = txs.length > 0 ? txs.map(t => `<div class="p-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-bold">${escapeHTML(t)}</div>`).join('') : '<p class="font-bold text-center py-2 text-emerald-600">All balances are settled!</p>';
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

window.switchModalTab = switchModalTab;
window.createNewLedger = createNewLedger;
window.recallLedger = recallLedger;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.selectSettingsLang = selectSettingsLang;
window.selectSettingsCurrency = selectSettingsCurrency;
window.selectSettingsTheme = selectSettingsTheme;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.copyShareLink = copyShareLink;
window.goHome = goHome;
window.deleteActiveLedger = deleteActiveLedger;
window.addMemberDirect = addMemberDirect;
window.saveMembers = saveMembers;
window.deleteMember = deleteMember;
window.addExpense = addExpense;
window.startEditExpense = startEditExpense;
window.cancelEditExpense = cancelEditExpense;
window.updateExpense = updateExpense;
window.deleteExpenseFromEdit = deleteExpenseFromEdit;
window.copySettlementSummary = copySettlementSummary;
window.generateLedgerReport = generateLedgerReport;
window.switchLanguage = switchLanguage;
window.saveCardLayout = saveCardLayout;
window.selectAllSplits = selectAllSplits;
window.saveSettings = saveSettings;

document.addEventListener('DOMContentLoaded', () => {
    initTaglineCarousel();
    initCardDragging();
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) dateInput.value = formatToISODate(new Date());
    render();
    loadGoogleSheetsArchive();
});
