/**
 * SPENSE - Main Application Logic & Controller
 * Senior CS Implementation: Pure State Machine + Dynamic Class Sanitizer + Backend Persistence
 */

console.log("%c[SPENSE] Engine & Settings Controller Ready.", "color: #059669; font-weight: bold;");

// --- Global Application State ---
let currentTab = null;
let currentPin = null;
let currentLang = 'en';
let currentCurrency = 'USD';
let currentTheme = 'Silk';
let ledgerData = { members: [], expenses: [] };

// Staging & Modal Selection State
let selectedModalLang = 'en';
let selectedModalCurrency = 'USD';
let selectedModalTheme = 'Silk';

let unsavedMembers = [];
let editingExpenseId = null;

// --- Internationalization Dictionary ---
const TRANSLATIONS = {
    en: {
        settingsBtn: "⚙ Settings", shareLinkBtn: "Share Link", deleteBtn: "Delete",
        participantsTitle: "Participants", participantsSub: "Add or remove people from this group.",
        namePlaceholder: "Name...", addBtn: "Add", saveMembersBtn: "Save Participants",
        newExpenseTitle: "New Expense", editExpenseTitle: "Edit Expense",
        newExpenseSub: "Log a transaction to split.", editExpenseSub: "Modify or delete this expense.",
        dateLabel: "Date", categoryLabel: "Category", descLabel: "Description", descPlaceholder: "e.g. Dinner",
        amountLabel: "Amount", paidByLabel: "Paid By", splitBetweenLabel: "Split Between:", selectAllBtn: "Select All", 
        recordExpenseBtn: "Record Expense", updateExpenseBtn: "Update Expense", cancelEditBtn: "Cancel", deleteExpenseBtn: "Delete Expense",
        settlementTitle: "Settlement Matrix", copySummaryBtn: "Copy Summary",
        historyTitle: "Ledger History", generateReportBtn: "Generate Report",
        modalSub: "Create or open a confidential group ledger.", tabCreate: "Create New", tabRecall: "Recall Existing",
        ledgerNameLabel: "Ledger Name", ledgerNamePh: "e.g. dinner-club", setPinLabel: "Set 4-Digit PIN", initializeBtn: "Initialize Ledger",
        selectArchiveLabel: "Select Archive", enterPinLabel: "Enter 4-Digit PIN", accessLedgerBtn: "Access Ledger",
        shareLinkHeader: "Share Ledger Link", shareLinkSub: "Anyone with this link will only need to enter PIN.", copyBtn: "Copy",
        taglines: [
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Spend simply.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Enjoy the moment. Leave tracking to SPENSE.</span>`,
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Just add what you spent.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Who paid? Who shares? SPENSE does the math.</span>`,
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Settle easily.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">See who owes whom — and how much.</span>`
        ]
    },
    tr: {
        settingsBtn: "⚙ Ayarlar", shareLinkBtn: "Bağlantıyı Paylaş", deleteBtn: "Sil",
        participantsTitle: "Katılımcılar", participantsSub: "Bu gruba kişi ekleyin veya çıkarın.",
        namePlaceholder: "İsim...", addBtn: "Ekle", saveMembersBtn: "Katılımcıları Kaydet",
        newExpenseTitle: "Yeni Harcama", editExpenseTitle: "Harcamayı Düzenle",
        newExpenseSub: "Bölüştürmek için işlem kaydedin.", editExpenseSub: "Bu harcamayı güncelleyin veya silin.",
        dateLabel: "Tarih", categoryLabel: "Kategori", descLabel: "Açıklama", descPlaceholder: "ör. Akşam Yemeği",
        amountLabel: "Tutar", paidByLabel: "Ödeyen", splitBetweenLabel: "Paylaşanlar:", selectAllBtn: "Tümünü Seç", 
        recordExpenseBtn: "Harcamayı Kaydet", updateExpenseBtn: "Harcamayı Güncelle", cancelEditBtn: "İptal", deleteExpenseBtn: "Harcamayı Sil",
        settlementTitle: "Ödeme Matrisi", copySummaryBtn: "Özeti Kopyala",
        historyTitle: "Geçmiş Kayıtlar", generateReportBtn: "Rapor Oluştur",
        modalSub: "Gizli bir grup defteri oluşturun veya açın.", tabCreate: "Yeni Oluştur", tabRecall: "Var Olanı Aç",
        ledgerNameLabel: "Defter Adı", ledgerNamePh: "ör. aksam-yemegi", setPinLabel: "4 Haneli PIN Belirleyin", initializeBtn: "Defteri Başlat",
        selectArchiveLabel: "Arşiv Seç", enterPinLabel: "4 Haneli PIN Girin", accessLedgerBtn: "Deftere Eriş",
        shareLinkHeader: "Defter Bağlantısını Paylaş", shareLinkSub: "Bu bağlantıya sahip herkes PIN girmelidir.", copyBtn: "Kopyala",
        taglines: [
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Kolayca harca.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Anın tadını çıkar. Takibi SPENSE'e bırak.</span>`,
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Sadece harcamanı ekle.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Kim ödedi? Kimler paylaşıyor? Matematik işini SPENSE yapar.</span>`,
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Rahatça hesabı kapat.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Kimin kime borcu var — anında gör.</span>`
        ]
    },
    de: {
        settingsBtn: "⚙ Einstellungen", shareLinkBtn: "Link Teilen", deleteBtn: "Löschen",
        participantsTitle: "Teilnehmer", participantsSub: "Personen hinzufügen oder entfernen.",
        namePlaceholder: "Name...", addBtn: "Hinzufügen", saveMembersBtn: "Teilnehmer Speichern",
        newExpenseTitle: "Neue Ausgabe", editExpenseTitle: "Ausgabe Bearbeiten",
        newExpenseSub: "Transaktion eintragen.", editExpenseSub: "Ändern oder löschen Sie diese Ausgabe.",
        dateLabel: "Datum", categoryLabel: "Kategorie", descLabel: "Beschreibung", descPlaceholder: "z.B. Abendessen",
        amountLabel: "Betrag", paidByLabel: "Bezahlt von", splitBetweenLabel: "Aufteilen:", selectAllBtn: "Alle", 
        recordExpenseBtn: "Speichern", updateExpenseBtn: "Aktualisieren", cancelEditBtn: "Abbrechen", deleteExpenseBtn: "Löschen",
        settlementTitle: "Abrechnungsmatrix", copySummaryBtn: "Kopieren",
        historyTitle: "Verlauf", generateReportBtn: "Bericht Erstellen",
        modalSub: "Gruppenbuch öffnen.", tabCreate: "Neu", tabRecall: "Öffnen",
        ledgerNameLabel: "Name", ledgerNamePh: "z.B. club", setPinLabel: "PIN", initializeBtn: "Starten",
        selectArchiveLabel: "Archiv Wählen", enterPinLabel: "PIN Eingeben", accessLedgerBtn: "Zugreifen",
        shareLinkHeader: "Teilen", shareLinkSub: "PIN erforderlich.", copyBtn: "Kopieren",
        taglines: [
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Einfach ausgeben.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Genieße den Moment. Überlasse die Nachverfolgung SPENSE.</span>`,
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Einfach eintragen.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Wer hat bezahlt? Wer teilt es? SPENSE macht die Rechnung.</span>`,
            `<strong class="block font-black text-slate-900 text-2xl sm:text-3xl leading-tight">Einfach abrechnen.</strong><span class="block text-slate-600 text-xs sm:text-sm font-medium mt-1">Sehen Sie wer wem schuldet — und wie viel.</span>`
        ]
    }
};

// --- SETTINGS SELECTION ENGINE (ROBUST STATE & FRAMING) ---
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
    // 1. Commit Modal Staging State to Global Runtime Engine
    currentLang = selectedModalLang;
    currentCurrency = selectedModalCurrency;
    applyTheme(selectedModalTheme);

    // 2. Hide Modal & Re-render Full Application UI
    document.getElementById('settingsModal')?.classList.add('hidden');
    render();
    initTaglineCarousel(); // Refresh tagline language dynamically

    // 3. Persist to Backend / Google Sheet Metadata if Ledger Active
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

// --- Guaranteed 4-Directional Keyframe Tagline Engine ---
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
        void spot.offsetWidth; // Force synchronous browser DOM layout reflow

        spot.innerHTML = activeTaglines[currentTaglineIndex % activeTaglines.length];

        const randomMotion = motionClasses[Math.floor(Math.random() * motionClasses.length)];
        spot.className = "w-full text-center leading-snug " + randomMotion;

        currentTaglineIndex++;
    }

    cycleTagline();
    taglineTimer = setInterval(cycleTagline, 3200);
}

// --- Card Reordering Engine ---
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

// --- Google Sheets Integration ---
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

async function loadGoogleSheetsArchive() {
    const select = document.getElementById('archiveSelect');
    if (!select) return;

    select.innerHTML = `<option value="">-- Reading Google Sheets... --</option>`;

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

        ledgers = ledgers.filter(Boolean);

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
    const nameInput = document.getElementById('newLedgerName');
    const pinInput = document.getElementById('newLedgerPin');

    const nameVal = nameInput?.value.trim().toLowerCase().replace(/\s+/g, '-');
    const pinVal = pinInput?.value.trim();

    if (!nameVal || pinVal.length !== 4) {
        alert("Please enter a valid ledger name and a 4-digit PIN.");
        return;
    }

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
        currentTab = res.createdTab || nameVal;
        currentPin = pinVal;
        ledgerData = { members: [], expenses: [] };
        unsavedMembers = [];
        document.getElementById('welcomeModal')?.classList.add('hidden');
        render();
    } else {
        currentTab = nameVal;
        currentPin = pinVal;
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

    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) {
            currentTab = targetLedger;
            currentPin = pinVal;
            document.getElementById('welcomeModal')?.classList.add('hidden');
            render();
            return;
        }

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
            unsavedMembers = [];

            document.getElementById('welcomeModal')?.classList.add('hidden');
            render();
        } else {
            alert("Authentication failed: " + (data.message || "Invalid PIN"));
        }
    } catch (err) {
        console.error("Recall error:", err);
        currentTab = targetLedger;
        currentPin = pinVal;
        document.getElementById('welcomeModal')?.classList.add('hidden');
        render();
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

// --- Staging Participant Management ---
function addMemberDirect() {
    const input = document.getElementById('memberName');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    if (!currentTab) { alert("Access or initialize a ledger first."); return; }
    if (ledgerData.members.includes(name)) { alert("Participant already exists."); input.value = ''; return; }

    ledgerData.members.push(name);
    unsavedMembers.push(name);
    input.value = '';
    render();
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

async function deleteMember(name) {
    if (!name) return;
    if (!confirm(`Are you sure you want to remove participant '${name}'?`)) return;

    ledgerData.members = ledgerData.members.filter(m => m !== name);
    unsavedMembers = unsavedMembers.filter(m => m !== name);
    render();

    const res = await callBackend('removeMember', { name: name });
    if (res && res.status !== "success") {
        console.warn("[SPENSE Notice] Backend deletion notice:", res?.message);
    }
}

// --- Expense Editing State Machine ---
function startEditExpense(id) {
    const exp = ledgerData.expenses.find(e => e.id.toString() === id.toString());
    if (!exp) return;

    editingExpenseId = id.toString();

    const dateInput = document.getElementById('expenseDate');
    const descInput = document.getElementById('expenseDesc');
    const amountInput = document.getElementById('expenseAmount');
    const catInput = document.getElementById('expenseCategory');
    const paidByInput = document.getElementById('expensePaidBy');

    if (dateInput) dateInput.value = exp.date || '';
    if (descInput) descInput.value = exp.desc || '';
    if (amountInput) amountInput.value = exp.amount || '';
    if (catInput) catInput.value = exp.category || 'General';
    if (paidByInput) paidByInput.value = exp.paidBy || '';

    const splitArr = Array.isArray(exp.splitWith) ? exp.splitWith : (exp.splitBetween || []);
    document.querySelectorAll('.split-checkbox').forEach(cb => {
        cb.checked = splitArr.includes(cb.value);
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
    if (dateInput) dateInput.valueAsDate = new Date();

    document.querySelectorAll('.split-checkbox').forEach(cb => cb.checked = true);
}

async function updateExpense() {
    if (!editingExpenseId) return;

    const date = document.getElementById('expenseDate')?.value;
    const desc = document.getElementById('expenseDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount')?.value);
    const paidBy = document.getElementById('expensePaidBy')?.value;

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) {
        alert("Fill all expense fields correctly.");
        return;
    }

    const checkboxes = document.querySelectorAll('.split-checkbox:checked');
    const splitWith = Array.from(checkboxes).map(cb => cb.value);

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
    const date = document.getElementById('expenseDate')?.value;
    const desc = document.getElementById('expenseDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount')?.value);
    const paidBy = document.getElementById('expensePaidBy')?.value;

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) {
        alert("Fill all expense fields correctly.");
        return;
    }

    const checkboxes = document.querySelectorAll('.split-checkbox:checked');
    const splitWith = Array.from(checkboxes).map(cb => cb.value);

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

// --- Settlement Math Engine ---
function calculateSettlement() {
    const balances = {};
    ledgerData.members.forEach(m => balances[m] = 0);

    ledgerData.expenses.forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        const splitList = Array.isArray(e.splitWith) ? e.splitWith : (e.splitBetween || []);
        if (splitList.length === 0) return;

        const share = amt / splitList.length;
        if (balances[e.paidBy] !== undefined) balances[e.paidBy] += amt;

        splitList.forEach(m => {
            if (balances[m] !== undefined) balances[m] -= share;
        });
    });

    const debtors = [], creditors = [];
    Object.keys(balances).forEach(m => {
        const bal = balances[m];
        if (bal < -0.01) debtors.push({ member: m, amount: -bal });
        else if (bal > 0.01) creditors.push({ member: m, amount: bal });
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

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentTab}-report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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

// --- Master Rendering Engine ---
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
                <button type="button" data-member="${escapeHTML(m)}" onclick="window.deleteMember(this.getAttribute('data-member'))" class="text-rose-600 hover:text-rose-800 font-black text-xs ml-1 cursor-pointer" title="Remove participant">×</button>
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
            <div class="flex flex-wrap gap-2">
                <button type="button" onclick="window.updateExpense()" class="flex-1 theme-btn bg-emerald-400 hover:bg-emerald-500 text-slate-900 py-3 text-xs font-black uppercase tracking-wider cursor-pointer">${t.updateExpenseBtn}</button>
                <button type="button" onclick="window.cancelEditExpense()" class="theme-btn bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wider cursor-pointer">${t.cancelEditBtn}</button>
                <button type="button" onclick="window.deleteExpenseFromEdit()" class="theme-btn bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 text-xs font-black uppercase tracking-wider cursor-pointer">${t.deleteExpenseBtn}</button>
            </div>
        `;
    } else {
        titleEl.innerText = t.newExpenseTitle;
        subEl.innerText = t.newExpenseSub;
        actionsContainer.innerHTML = `
            <button id="btnRecordExpense" type="button" onclick="window.addExpense()" data-i18n="recordExpenseBtn" class="w-full theme-btn py-3 text-sm font-extrabold cursor-pointer">${t.recordExpenseBtn}</button>
        `;
    }
}

function renderDropdowns() {
    const catSelect = document.getElementById('expenseCategory');
    const paidSelect = document.getElementById('expensePaidBy');
    if (!catSelect || !paidSelect) return;

    catSelect.innerHTML = ["Food & Drink", "Transport", "Accommodation", "Shopping", "Entertainment", "Other"].map(c => `<option value="${c}">${c}</option>`).join('');
    paidSelect.innerHTML = ledgerData.members.length > 0 
        ? ledgerData.members.map(m => `<option value="${m}">${escapeHTML(m)}</option>`).join('')
        : '<option value="">No participants</option>';
}

function renderSplitCheckboxes() {
    const container = document.getElementById('splitCheckboxes');
    if (!container) return;

    const selectedValues = Array.from(document.querySelectorAll('.split-checkbox:checked')).map(cb => cb.value);

    container.innerHTML = ledgerData.members.length > 0
        ? ledgerData.members.map(m => `
            <label class="flex items-center gap-1.5 cursor-pointer bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-300 font-semibold">
                <input type="checkbox" value="${m}" ${selectedValues.length === 0 || selectedValues.includes(m) ? 'checked' : ''} class="split-checkbox accent-slate-900 cursor-pointer"> ${escapeHTML(m)}
            </label>
        `).join('')
        : '<span class="opacity-60 italic">Add participants first.</span>';
}

function renderHistory() {
    const list = document.getElementById('expenseHistory');
    if (!list) return;

    list.innerHTML = ledgerData.expenses.length > 0
        ? ledgerData.expenses.map(e => `
            <li class="p-2.5 rounded-xl border border-current/15 flex justify-between items-center bg-current/5 gap-2">
                <div class="flex-1 min-w-0">
                    <span class="font-bold truncate block">${escapeHTML(e.desc)} (${escapeHTML(e.category)})</span>
                    <div class="text-[10px] opacity-70">Paid by <span class="font-bold">${escapeHTML(e.paidBy)}</span> • ${e.date} • Split: ${Array.isArray(e.splitWith) ? e.splitWith.join(', ') : (e.splitBetween ? e.splitBetween.join(', ') : '')}</div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="font-extrabold text-sm">${getCurrencySymbol()}${parseFloat(e.amount).toFixed(2)}</span>
                    <button type="button" data-id="${e.id}" onclick="window.startEditExpense(this.getAttribute('data-id'))" class="theme-btn px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-300 text-slate-900 cursor-pointer hover:bg-amber-400">Edit</button>
                </div>
            </li>
        `).join('')
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

// --- ABSOLUTE GLOBAL WINDOW EXPORTS ---
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

// --- Initialize Engine ---
document.addEventListener('DOMContentLoaded', () => {
    initTaglineCarousel();
    initCardDragging();

    const dateInput = document.getElementById('expenseDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    render();
});
