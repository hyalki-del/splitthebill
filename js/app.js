/**
 * ==========================================================================
 * SPENSE - Group Expense Tracker Main Controller
 * CS Senior Architecture: Modular State Machine + Case-Insensitive Balance Resolution 
 *                        + Compact Contiguous Memory Sync + Equal Grid Controls
 * ==========================================================================
 */

console.log("%c[SPENSE] Engine & Controller Loaded Successfully.", "color: #059669; font-weight: bold;");

// --- Global Application State ---
let currentTab = null;
let currentPin = null;
let currentCurrency = 'USD';
let currentTheme = 'Silk';
let ledgerData = { members: [], expenses: [] };

// Settings Modal Staging State
let selectedModalLang = 'en';
let selectedModalCurrency = 'USD';
let selectedModalTheme = 'Silk';

// Staging & Edit State Variables
let unsavedMembers = [];
let editingExpenseId = null;

// --- DETERMINISTIC DATE NORMALIZATION HELPER ---
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

    const dmyMatch = str.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})$/);
    if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
    }

    const ymdMatch = str.match(/^(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})$/);
    if (ymdMatch) {
        const year = ymdMatch[1];
        const month = ymdMatch[2].padStart(2, '0');
        const day = ymdMatch[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
}

// Case-Insensitive Canonical Name Matcher
function findMemberCanonical(targetName) {
    if (!targetName) return targetName;
    const match = ledgerData.members.find(m => m.toLowerCase() === targetName.toLowerCase());
    return match || targetName;
}

// --- SETTINGS SELECTION ENGINE ---
function selectSettingsLang(lang) {
    selectedModalLang = lang;
    ['tr', 'en', 'de'].forEach(l => {
        const btn = document.getElementById(`setLang${l.toUpperCase()}`);
        if (btn) {
            if (l === lang) {
                btn.className = "theme-btn py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-extrabold rounded-xl transition cursor-pointer option-btn-selected";
            } else {
                btn.className = "theme-btn py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-extrabold border-2 border-slate-200 rounded-xl hover:border-slate-400 bg-slate-50 transition cursor-pointer opacity-50";
            }
        }
    });
}

function selectSettingsCurrency(curr) {
    selectedModalCurrency = curr;
    ['USD', 'EUR', 'TRY'].forEach(c => {
        const btn = document.getElementById(`setCurr${c}`);
        if (btn) {
            if (c === curr) {
                btn.className = "theme-btn py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer option-btn-selected";
            } else {
                btn.className = "theme-btn py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-extrabold border-2 border-slate-200 rounded-xl hover:border-slate-400 bg-slate-50 transition cursor-pointer opacity-50";
            }
        }
    });
}

function selectSettingsTheme(theme) {
    selectedModalTheme = theme;
    
    const themeStyles = {
        Silk: 'bg-slate-50 text-slate-900',
        Toon: 'bg-amber-100 text-slate-900',
        Neon: 'bg-slate-950 text-cyan-400'
    };

    ['Silk', 'Toon', 'Neon'].forEach(t => {
        const btn = document.getElementById(`setTheme${t}`);
        if (btn) {
            const baseBg = themeStyles[t] || 'bg-slate-50';
            if (t === theme) {
                btn.className = `theme-btn py-3 px-2 ${baseBg} rounded-xl text-center transition cursor-pointer option-btn-selected`;
            } else {
                btn.className = `theme-btn py-3 px-2 border-2 border-slate-200 ${baseBg} rounded-xl text-center transition cursor-pointer opacity-50`;
            }
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
        const res = await callBackend('updateSettings', {
            language: currentLang,
            currency: currentCurrency,
            theme: currentTheme
        });

        if (res && res.status !== "success") {
            console.warn("[SPENSE Warning] Backend settings save notice:", res?.message);
        }
    }
}

// --- GUARANTEED 4-DIRECTIONAL KEYFRAME TAGLINE ENGINE ---
let taglineTimer = null;
let currentTaglineIndex = 0;

function initTaglineCarousel() {
    const spot = document.getElementById('taglineSpot');
    if (!spot) return;

    if (taglineTimer) clearInterval(taglineTimer);

    const motionClasses = ['motion-left', 'motion-right', 'motion-top', 'motion-bottom'];

    function cycleTagline() {
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
        const activeTaglines = t.taglines;

        spot.className = "w-full text-center leading-snug";
        void spot.offsetWidth; // Synchronous DOM reflow force

        spot.innerHTML = activeTaglines[currentTaglineIndex % activeTaglines.length];

        const randomMotion = motionClasses[Math.floor(Math.random() * motionClasses.length)];
        spot.className = "w-full text-center leading-snug " + randomMotion;

        currentTaglineIndex++;
    }

    cycleTagline();
    taglineTimer = setInterval(cycleTagline, 3200);
}

// --- CARD REORDERING DRAG ENGINE ---
function initCardDragging() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    const handles = container.querySelectorAll('.card-drag-handle');

    handles.forEach(handle => {
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
            if (window._draggedCard && window._draggedCard !== card) {
                card.classList.add('border-amber-400', 'border-4', 'border-dashed');
            }
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('border-amber-400', 'border-4', 'border-dashed');
        });

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
    return Array.from(container.querySelectorAll('.theme-card'))
        .map(card => card.getAttribute('data-card-id'))
        .filter(Boolean);
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
    const newOrder = getCurrentCardOrder();
    const res = await callBackend('updateSettings', { cardOrder: newOrder });
    if (res && res.status === "success") {
        document.getElementById('layoutActionBar')?.classList.add('hidden');
        alert("Layout saved successfully to Google Sheet!");
    } else {
        alert("Failed to save layout: " + (res?.message || "Unknown error"));
    }
}

// --- GOOGLE SHEETS CONNECTOR ---
async function getConfig() {
    try {
        const configRes = await fetch('config.json');
        if (!configRes.ok) throw new Error("config.json missing");
        const config = await configRes.json();
        return config.sheetUrl || config.googleSheetApiUrl || config.apiUrl;
    } catch (err) {
        console.warn("[SPENSE Config Notice]", err.message);
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
        console.error("Backend error:", err);
        return { status: "error", message: err.toString() };
    }
}

// --- ARCHIVE LOADER WITH METADATA EXCLUSION ---
async function loadGoogleSheetsArchive() {
    const select = document.getElementById('archiveSelect');
    if (!select) return;

    if (select.options.length <= 1) {
        select.innerHTML = `<option value="">-- Reading Google Sheets... --</option>`;
    }

    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) {
            select.innerHTML = `<option value="">-- Missing sheetUrl in config.json --</option>`;
            return;
        }

        const res = await fetch(sheetUrl);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        
        const rawData = await res.json();
        let ledgers = [];
        
        if (Array.isArray(rawData)) {
            ledgers = rawData;
        } else if (typeof rawData === 'object' && rawData !== null) {
            ledgers = rawData.archives || rawData.sheets || rawData.ledgers || Object.keys(rawData);
        }

        ledgers = ledgers
            .filter(Boolean)
            .filter(name => name.toString().trim().toLowerCase() !== 'metadata');

        if (ledgers.length === 0) {
            select.innerHTML = `<option value="">-- No archives found --</option>`;
            return;
        }

        select.innerHTML = `<option value="">-- Select a Ledger Tab --</option>` + 
            ledgers.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');

    } catch (error) {
        console.error("Archive fetch error:", error);
        select.innerHTML = `<option value="">-- Error loading archives --</option>`;
    }
}

// --- WELCOME MODAL CORE NAVIGATION ---
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
        
        const select = document.getElementById('archiveSelect');
        if (select && (select.options.length <= 1 || select.value === "")) {
            loadGoogleSheetsArchive();
        }
    }
}

async function createNewLedger() {
    const nameInput = document.getElementById('newLedgerName');
    const pinInput = document.getElementById('newLedgerPin');

    const nameVal = nameInput?.value.trim().toLowerCase().replace(/\s+/g, '-');
    const pinVal = pinInput?.value.trim();

    if (!nameVal || pinVal.length !== 4) {
        alert("Please enter a valid ledger name and a 4-digit PIN.");
        return;
    }

    currentTab = nameVal;
    currentPin = pinVal;

    const initialOrder = getCurrentCardOrder();
    const res = await callBackend('createLedger', { 
        name: nameVal, 
        pin: pinVal, 
        theme: currentTheme, 
        currency: currentCurrency, 
        language: currentLang,
        cardOrder: initialOrder 
    });

    if (res && res.status === "success") {
        ledgerData = { members: [], expenses: [] };
        unsavedMembers = [];
        document.getElementById('welcomeModal')?.classList.add('hidden');
        render();
    } else {
        ledgerData = { members: [], expenses: [] };
        unsavedMembers = [];
        document.getElementById('welcomeModal')?.classList.add('hidden');
        render();
    }
}

async function recallLedger() {
    const archiveSelect = document.getElementById('archiveSelect');
    const pinInput = document.getElementById('recallLedgerPin');

    const targetLedger = archiveSelect?.value;
    const pinVal = pinInput?.value.trim();

    if (!targetLedger || pinVal.length !== 4) {
        alert("Please select a ledger and enter your 4-digit PIN.");
        return;
    }

    currentTab = targetLedger;
    currentPin = pinVal;

    try {
        const res = await callBackend('recallLedger', { tab: targetLedger, pin: pinVal });

        if (res && res.status === "success") {
            currentTheme = res.theme || "Silk";
            currentCurrency = res.currency || "USD";
            currentLang = res.language || "en";
            applyTheme(currentTheme);

            if (res.cardOrder) applyCardOrder(res.cardOrder);

            const rawMembers = Array.isArray(res.members) ? res.members : [];
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
            ledgerData.expenses = res.expenses || [];

            document.getElementById('welcomeModal')?.classList.add('hidden');
            render();
        } else {
            currentTab = null;
            currentPin = null;
            alert("Authentication failed: " + (res?.message || "Invalid PIN"));
        }
    } catch (err) {
        console.error("Recall error:", err);
        currentTab = null;
        currentPin = null;
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
}

async function deleteActiveLedger() {
    if (!confirm("Delete active ledger?")) return;
    await callBackend('deleteLedger');
    goHome();
}

// --- PARTICIPANTS STAGING & AUTO-PERSIST MODULE ---
async function addMemberDirect() {
    const input = document.getElementById('memberName');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    if (!currentTab) { 
        alert("Access or initialize a ledger first."); 
        return; 
    }
    
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
    } else {
        console.warn("[SPENSE Warning] Background sync failed for participant:", name);
    }
}

async function saveMembers() {
    if (unsavedMembers.length === 0) return;

    const btn = document.getElementById('btnSaveMembers');
    if (btn) btn.innerText = "Saving...";

    const res = await callBackend('addMembers', { names: unsavedMembers });
    if (res && res.status === "success") {
        unsavedMembers = [];
        render();
        alert("Participants saved to sheet!");
    } else {
        alert("Failed to save participants: " + (res?.message || "Error"));
        render();
    }
}

async function deleteMember(name, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    if (!name) return;
    
    const canonicalName = findMemberCanonical(name);

    if (!confirm(`Are you sure you want to remove participant '${canonicalName}'?`)) return;

    const targetLower = canonicalName.toLowerCase();
    
    ledgerData.members = ledgerData.members.filter(m => m.toLowerCase() !== targetLower);
    unsavedMembers = unsavedMembers.filter(m => m.toLowerCase() !== targetLower);

    render();

    const res = await callBackend('removeMember', { name: canonicalName });
    if (res && res.status !== "success") {
        console.warn("[SPENSE Notice] Backend deletion notice:", res?.message);
    }
}

// --- EXPENSE EDITING & VALIDATION ---
function startEditExpense(id) {
    const exp = ledgerData.expenses.find(e => e.id.toString() === id.toString());
    if (!exp) return;

    editingExpenseId = id.toString();

    const dateInput = document.getElementById('expenseDate');
    const descInput = document.getElementById('expenseDesc');
    const amountInput = document.getElementById('expenseAmount');
    const catInput = document.getElementById('expenseCategory');
    const paidByInput = document.getElementById('expensePaidBy');

    if (dateInput) {
        dateInput.value = formatToISODate(exp.date);
    }

    if (descInput) descInput.value = exp.desc || '';
    if (amountInput) amountInput.value = exp.amount || '';
    if (catInput) catInput.value = exp.category || 'Food & Drink';
    if (paidByInput) paidByInput.value = findMemberCanonical(exp.paidBy) || '';

    const splitArr = (Array.isArray(exp.splitWith) ? exp.splitWith : (exp.splitBetween || [])).map(s => s.toLowerCase());
    document.querySelectorAll('.split-checkbox').forEach(cb => {
        cb.checked = splitArr.includes(cb.value.toLowerCase());
    });

    render();
    document.getElementById('expenseFormSection')?.scrollIntoView({ behavior: 'smooth' });
}

function cancelEditExpense() {
    editingExpenseId = null;
    resetExpenseForm();
    render();
}

function resetExpenseForm() {
    const descInput = document.getElementById('expenseDesc');
    const amountInput = document.getElementById('expenseAmount');
    if (descInput) descInput.value = '';
    if (amountInput) amountInput.value = '';
    
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) dateInput.value = formatToISODate(new Date());

    document.querySelectorAll('.split-checkbox').forEach(cb => cb.checked = true);
}

async function updateExpense() {
    if (!editingExpenseId) return;

    const rawDate = document.getElementById('expenseDate')?.value;
    const date = formatToISODate(rawDate);
    const desc = document.getElementById('expenseDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount')?.value);
    const rawPaidBy = document.getElementById('expensePaidBy')?.value;
    const paidBy = findMemberCanonical(rawPaidBy);

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) {
        alert("Please fill out all expense fields properly.");
        return;
    }

    const checkboxes = document.querySelectorAll('.split-checkbox:checked');
    const splitWith = Array.from(checkboxes).map(cb => findMemberCanonical(cb.value));

    if (splitWith.length === 0) {
        alert("Select at least one participant to split with.");
        return;
    }

    const category = document.getElementById('expenseCategory')?.value || "General";

    const idx = ledgerData.expenses.findIndex(e => e.id.toString() === editingExpenseId);
    if (idx !== -1) {
        ledgerData.expenses[idx] = { id: editingExpenseId, date, category, desc, amount, paidBy, splitWith };
    }

    const targetId = editingExpenseId;
    editingExpenseId = null;
    resetExpenseForm();
    render();

    await callBackend('updateExpense', { id: targetId, date, category, desc, amount, paidBy, splitWith });
}

async function deleteExpenseFromEdit() {
    if (!editingExpenseId) return;
    if (!confirm("Are you sure you want to delete this expense entry?")) return;

    const targetId = editingExpenseId;
    ledgerData.expenses = ledgerData.expenses.filter(e => e.id.toString() !== targetId);
    
    editingExpenseId = null;
    resetExpenseForm();
    render();

    await callBackend('deleteExpense', { id: targetId });
}

async function addExpense() {
    const rawDate = document.getElementById('expenseDate')?.value;
    const date = formatToISODate(rawDate);
    const desc = document.getElementById('expenseDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount')?.value);
    const rawPaidBy = document.getElementById('expensePaidBy')?.value;
    const paidBy = findMemberCanonical(rawPaidBy);

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) {
        alert("Fill all expense fields correctly.");
        return;
    }

    const checkboxes = document.querySelectorAll('.split-checkbox:checked');
    const splitWith = Array.from(checkboxes).map(cb => findMemberCanonical(cb.value));

    if (splitWith.length === 0) {
        alert("Select at least one participant to split with.");
        return;
    }

    const category = document.getElementById('expenseCategory')?.value || "General";
    const id = Date.now().toString();

    ledgerData.expenses.push({ id, date, category, desc, amount, paidBy, splitWith });
    resetExpenseForm();
    render();

    await callBackend('addExpense', { id, date, category, desc, amount, paidBy, splitWith });
}

// --- CASE-INSENSITIVE SETTLEMENT COMPUTATION ALGORITHM ---
function calculateSettlement() {
    const balances = {};
    const lowerMap = {};

    ledgerData.members.forEach(m => {
        const lower = m.toLowerCase();
        balances[lower] = 0;
        lowerMap[lower] = m;
    });

    ledgerData.expenses.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        const rawSplitList = Array.isArray(e.splitWith) ? e.splitWith : (e.splitBetween || []);
        const splitList = rawSplitList.map(s => s.toLowerCase());

        if (splitList.length === 0) return;

        const share = amt / splitList.length;
        const payerKey = (e.paidBy || '').toLowerCase();

        if (balances[payerKey] !== undefined) {
            balances[payerKey] += amt;
        }

        splitList.forEach(mKey => {
            if (balances[mKey] !== undefined) {
                balances[mKey] -= share;
            }
        });
    });

    const debtors = [], creditors = [];
    Object.keys(balances).forEach(lowerKey => {
        const bal = balances[lowerKey];
        const displayName = lowerMap[lowerKey] || lowerKey;
        if (bal < -0.01) debtors.push({ member: displayName, amount: -bal });
        else if (bal > 0.01) creditors.push({ member: displayName, amount: bal });
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
    if (txs.length === 0) {
        alert("No settlement balances to copy.");
        return;
    }

    const summaryText = `=== SPENSE SETTLEMENT MATRIX ===\nLedger: ${currentTab || 'General'}\nDate: ${new Date().toLocaleDateString()}\n--------------------------------\n` + 
        txs.join('\n') + 
        `\n================================`;

    navigator.clipboard.writeText(summaryText).then(() => {
        alert("Settlement summary copied to clipboard as plain text!");
    }).catch(err => {
        console.error("Copy failed:", err);
        alert("Failed to copy automatically. Summary:\n\n" + summaryText);
    });
}

// --- REPORT GENERATOR (NEW TAB RENDERER) ---
function generateLedgerReport() {
    if (!currentTab) {
        alert("Please open an active ledger first.");
        return;
    }

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const sym = getCurrencySymbol();
    let totalSpent = 0;
    ledgerData.expenses.forEach(e => totalSpent += (parseFloat(e.amount) || 0));

    const settlement = calculateSettlement();

    let report = `====================================================\n`;
    report += `               ${t.reportTitle}                     \n`;
    report += `====================================================\n`;
    report += `${t.reportNameLabel.padEnd(13)} : ${currentTab}\n`;
    report += `${t.reportGeneratedOn.padEnd(13)} : ${new Date().toLocaleString(currentLang)}\n`;
    report += `${t.reportParticipants.padEnd(13)} : ${ledgerData.members.join(', ') || 'None'}\n`;
    report += `${t.reportTotalSpend.padEnd(13)} : ${sym}${totalSpent.toFixed(2)}\n`;
    report += `====================================================\n\n`;

    report += `--- ${t.reportSettlementMatrix} ---\n`;
    if (settlement.length > 0) {
        settlement.forEach(s => report += `• ${s}\n`);
    } else {
        report += `${t.reportAllSettled}\n`;
    }
    report += `\n----------------------------------------------------\n\n`;

    report += `--- ${t.reportHistoryTitle} ---\n`;
    if (ledgerData.expenses.length > 0) {
        ledgerData.expenses.forEach((e, idx) => {
            const splitArr = Array.isArray(e.splitWith) ? e.splitWith : (e.splitBetween || []);
            const splitStr = splitArr.map(s => findMemberCanonical(s)).join(', ');
            report += `${idx + 1}. [${formatToISODate(e.date)}] ${e.desc} (${e.category})\n`;
            report += `   ${t.amountLabel}: ${sym}${parseFloat(e.amount).toFixed(2)} | ${t.reportPaidBy}: ${findMemberCanonical(e.paidBy)}\n`;
            report += `   ${t.reportSplitWith}: ${splitStr}\n\n`;
        });
    } else {
        report += `${t.reportNoExpenses}\n`;
    }
    report += `====================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const reportUrl = URL.createObjectURL(blob);
    const reportWindow = window.open(reportUrl, '_blank');

    if (!reportWindow) {
        alert("Pop-up blocked! Please allow pop-ups for this site to view the report in a new tab.");
    }
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

// --- MASTER UI RENDERING ENGINE ---
function render() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if (t[k]) el.innerText = t[k];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const k = el.getAttribute('data-i18n-ph');
        if (t[k]) el.placeholder = t[k];
    });

    const currSym = getCurrencySymbol();
    const symbolEl = document.getElementById('currencySymbol');
    if (symbolEl) symbolEl.innerText = currSym;

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
                <button type="button" data-member="${escapeHTML(m)}" onclick="window.deleteMember(this.getAttribute('data-member'), event)" class="text-rose-600 hover:text-rose-800 font-black text-xs ml-1 cursor-pointer" title="Remove participant">×</button>
            </span>
        `).join('') 
        : '<span class="opacity-60 italic">No participants yet.</span>';

    if (saveBtn) {
        if (unsavedMembers.length > 0) {
            saveBtn.classList.remove('hidden');
        } else {
            saveBtn.classList.add('hidden');
        }
    }
}

function renderExpenseFormHeader() {
    const titleEl = document.getElementById('expenseFormTitle');
    const subEl = document.getElementById('expenseFormSub');
    const actionsContainer = document.getElementById('expenseFormActions');
    if (!titleEl || !subEl || !actionsContainer) return;

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    if (editingExpenseId) {
        titleEl.innerText = t.editExpenseTitle;
        subEl.innerText = t.editExpenseSub;
        actionsContainer.innerHTML = `
            <div class="grid grid-cols-3 gap-2">
                <button type="button" onclick="window.deleteExpenseFromEdit()" class="theme-btn bg-rose-500 hover:bg-rose-600 text-white py-3 text-xs font-black uppercase tracking-wider cursor-pointer rounded-xl">${t.deleteExpenseBtn}</button>
                <button type="button" onclick="window.cancelEditExpense()" class="theme-btn bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 text-xs font-black uppercase tracking-wider cursor-pointer rounded-xl">${t.cancelEditBtn}</button>
                <button type="button" onclick="window.updateExpense()" class="theme-btn bg-emerald-400 hover:bg-emerald-500 text-slate-900 py-3 text-xs font-black uppercase tracking-wider cursor-pointer rounded-xl">${t.updateExpenseBtn}</button>
            </div>
        `;
    } else {
        titleEl.innerText = t.newExpenseTitle;
        subEl.innerText = t.newExpenseSub;
        actionsContainer.innerHTML = `
            <button id="btnRecordExpense" type="button" onclick="window.addExpense()" data-i18n="recordExpenseBtn" class="w-full theme-btn py-3 text-sm font-extrabold cursor-pointer rounded-xl">${t.recordExpenseBtn}</button>
        `;
    }
}

function renderDropdowns() {
    const catSelect = document.getElementById('expenseCategory');
    const paidSelect = document.getElementById('expensePaidBy');
    if (!catSelect || !paidSelect) return;

    catSelect.innerHTML = ["Food & Drink", "Transport", "Accommodation", "Shopping", "Entertainment", "Other"].map(c => `<option value="${c}">${c}</option>`).join('');
    paidSelect.innerHTML = ledgerData.members.length > 0 
        ? ledgerData.members.map(m => `<option value="${escapeHTML(m)}">${escapeHTML(m)}</option>`).join('')
        : '<option value="">No participants</option>';
}

function renderSplitCheckboxes() {
    const container = document.getElementById('splitCheckboxes');
    if (!container) return;

    const selectedValues = Array.from(document.querySelectorAll('.split-checkbox:checked')).map(cb => cb.value.toLowerCase());

    container.innerHTML = ledgerData.members.length > 0
        ? ledgerData.members.map(m => `
            <label class="flex items-center gap-1.5 cursor-pointer bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-300 font-semibold">
                <input type="checkbox" value="${escapeHTML(m)}" ${selectedValues.length === 0 || selectedValues.includes(m.toLowerCase()) ? 'checked' : ''} class="split-checkbox accent-slate-900 cursor-pointer"> ${escapeHTML(m)}
            </label>
        `).join('')
        : '<span class="opacity-60 italic">Add participants first.</span>';
}

function renderHistory() {
    const list = document.getElementById('expenseHistory');
    if (!list) return;

    list.innerHTML = ledgerData.expenses.length > 0
        ? ledgerData.expenses.map(e => {
            const displayDate = formatToISODate(e.date);
            const canonicalPayer = findMemberCanonical(e.paidBy);
            const rawSplits = Array.isArray(e.splitWith) ? e.splitWith : (e.splitBetween || []);
            const displaySplits = rawSplits.map(s => findMemberCanonical(s)).join(', ');

            return `
            <li class="p-2.5 rounded-xl border border-current/15 flex justify-between items-center bg-current/5 gap-2">
                <div class="flex-1 min-w-0">
                    <span class="font-bold truncate block">${escapeHTML(e.desc)} (${escapeHTML(e.category)})</span>
                    <div class="text-[10px] opacity-70">Paid by <span class="font-bold">${escapeHTML(canonicalPayer)}</span> • ${displayDate} • Split: ${escapeHTML(displaySplits)}</div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="font-extrabold text-sm">${getCurrencySymbol()}${parseFloat(e.amount).toFixed(2)}</span>
                    <button type="button" data-id="${e.id}" onclick="window.startEditExpense(this.getAttribute('data-id'))" class="theme-btn px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-300 text-slate-900 cursor-pointer hover:bg-amber-400">Edit</button>
                </div>
            </li>
        `;
        }).join('')
        : '<li class="opacity-60 italic text-center py-4">No expenses recorded yet.</li>';
}

function renderSettlement() {
    const container = document.getElementById('settlementList');
    if (!container) return;

    if (ledgerData.expenses.length === 0 || ledgerData.members.length === 0) {
        container.innerHTML = '<p class="opacity-60 italic text-center py-4">Settlement matrix will appear once expenses are added.</p>';
        return;
    }

    const txs = calculateSettlement();
    container.innerHTML = txs.length > 0 
        ? txs.map(t => `<div class="p-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-bold">${escapeHTML(t)}</div>`).join('')
        : '<p class="font-bold text-center py-2 text-emerald-600">All balances are currently settled!</p>';
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// --- GLOBAL WINDOW EXPORTS ---
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

// --- INITIALIZE SYSTEM ENGINE ---
document.addEventListener('DOMContentLoaded', () => {
    initTaglineCarousel();
    initCardDragging();

    const dateInput = document.getElementById('expenseDate');
    if (dateInput) dateInput.value = formatToISODate(new Date());

    render();
    loadGoogleSheetsArchive();
});
