/* ==========================================
   SPENSE - Main Application Logic & Controller (Instrumented Debug Build)
   ========================================== */

console.log("SPENSE app.js loaded successfully.");

let currentTab = null;
let currentPin = null;
let currentLang = 'en';
let currentCurrency = 'USD';
let currentTheme = 'Silk';
let stagedMembersList = [];
let ledgerData = { members: [], expenses: [] };

// --- Translations Definition ---
const TRANSLATIONS = {
    en: {
        settingsBtn: "⚙ Settings", shareLinkBtn: "Share Link", deleteBtn: "Delete",
        participantsTitle: "Participants", participantsSub: "Add or remove people from this group.",
        namePlaceholder: "Name...", addBtn: "Add", saveMembersBtn: "Save New Participants",
        newExpenseTitle: "New Expense", newExpenseSub: "Log a transaction to split.",
        dateLabel: "Date", categoryLabel: "Category", descLabel: "Description", descPlaceholder: "e.g. Dinner",
        amountLabel: "Amount", paidByLabel: "Paid By", splitBetweenLabel: "Split Between:", selectAllBtn: "Select All", recordExpenseBtn: "Record Expense",
        settlementTitle: "Settlement Matrix", copySummaryBtn: "Copy Summary",
        historyTitle: "Ledger History", clickToEditSub: "(Click item to edit)", generateReportBtn: "Generate Report",
        modalSub: "Create or open a confidential group ledger.", tabCreate: "Create New", tabRecall: "Recall Existing",
        ledgerNameLabel: "Ledger Name", ledgerNamePh: "e.g. dinner-club", setPinLabel: "Set 4-Digit PIN", initializeBtn: "Initialize Ledger",
        selectArchiveLabel: "Select Archive", enterPinLabel: "Enter 4-Digit PIN", accessLedgerBtn: "Access Ledger",
        shareLinkHeader: "Share Ledger Link", shareLinkSub: "Anyone with this link will only need to enter PIN.", copyBtn: "Copy", processingMsg: "Processing...",
        taglines: [
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Spend simply.</strong><span class="block text-slate-700 mt-0.5">Enjoy the moment. / Leave tracking to SPENSE.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Just add what you spent.</strong><span class="block text-slate-700 mt-0.5">Who paid? Who shares? / SPENSE does math.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Settle easily.</strong><span class="block text-slate-700 mt-0.5">See who owes whom — and how much.</span>`
        ]
    },
    tr: {
        settingsBtn: "⚙ Ayarlar", shareLinkBtn: "Bağlantıyı Paylaş", deleteBtn: "Sil",
        participantsTitle: "Katılımcılar", participantsSub: "Bu gruba kişi ekleyin veya çıkarın.",
        namePlaceholder: "İsim...", addBtn: "Ekle", saveMembersBtn: "Yeni Katılımcıları Kaydet",
        newExpenseTitle: "Yeni Harcama", newExpenseSub: "Bölüştürmek için işlem kaydedin.",
        dateLabel: "Tarih", categoryLabel: "Kategori", descLabel: "Açıklama", descPlaceholder: "ör. Akşam Yemeği",
        amountLabel: "Tutar", paidByLabel: "Ödeyen", splitBetweenLabel: "Paylaşanlar:", selectAllBtn: "Tümünü Seç", recordExpenseBtn: "Harcamayı Kaydet",
        settlementTitle: "Ödeme Matrisi", copySummaryBtn: "Özeti Kopyala",
        historyTitle: "Geçmiş Kayıtlar", clickToEditSub: "(Düzenlemek için tıkla)", generateReportBtn: "Rapor Oluştur",
        modalSub: "Gizli bir grup defteri oluşturun veya açın.", tabCreate: "Yeni Oluştur", tabRecall: "Var Olanı Aç",
        ledgerNameLabel: "Defter Adı", ledgerNamePh: "ör. aksam-yemegi", setPinLabel: "4 Haneli PIN Belirleyin", initializeBtn: "Defteri Başlat",
        selectArchiveLabel: "Arşiv Seç", enterPinLabel: "4 Haneli PIN Girin", accessLedgerBtn: "Deftere Eriş",
        shareLinkHeader: "Defter Bağlantısını Paylaş", shareLinkSub: "Bu bağlantıya sahip herkes PIN girmelidir.", copyBtn: "Kopyala", processingMsg: "İşleniyor...",
        taglines: [
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Kolayca harca.</strong><span class="block text-slate-700 mt-0.5">Anın tadını çıkar. / Takibi SPENSE'e bırak.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Sadece harcamanı ekle.</strong><span class="block text-slate-700 mt-0.5">Kim ödedi? Kimler paylaşıyor? / SPENSE yapar.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Rahatça hesabı kapat.</strong><span class="block text-slate-700 mt-0.5">Kimin kime borcu var — anında gör.</span>`
        ]
    },
    de: {
        settingsBtn: "⚙ Einstellungen", shareLinkBtn: "Link Teilen", deleteBtn: "Löschen",
        participantsTitle: "Teilnehmer", participantsSub: "Personen hinzufügen oder entfernen.",
        namePlaceholder: "Name...", addBtn: "Hinzufügen", saveMembersBtn: "Speichern",
        newExpenseTitle: "Neue Ausgabe", newExpenseSub: "Transaktion eintragen.",
        dateLabel: "Datum", categoryLabel: "Kategorie", descLabel: "Beschreibung", descPlaceholder: "z.B. Abendessen",
        amountLabel: "Betrag", paidByLabel: "Bezahlt von", splitBetweenLabel: "Aufteilen:", selectAllBtn: "Alle", recordExpenseBtn: "Speichern",
        settlementTitle: "Abrechnungsmatrix", copySummaryBtn: "Kopieren",
        historyTitle: "Verlauf", clickToEditSub: "(Bearbeiten)", generateReportBtn: "Bericht",
        modalSub: "Gruppenbuch öffnen.", tabCreate: "Neu", tabRecall: "Öffnen",
        ledgerNameLabel: "Name", ledgerNamePh: "z.B. club", setPinLabel: "PIN", initializeBtn: "Starten",
        selectArchiveLabel: "Archiv Wählen", enterPinLabel: "PIN Eingeben", accessLedgerBtn: "Zugreifen",
        shareLinkHeader: "Teilen", shareLinkSub: "PIN erforderlich.", copyBtn: "Kopieren", processingMsg: "Laden...",
        taglines: [
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Einfach ausgeben.</strong><span class="block text-slate-700 mt-0.5">Genieße den Moment.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Einfach eintragen.</strong><span class="block text-slate-700 mt-0.5">SPENSE macht die Rechnung.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Einfach abrechnen.</strong><span class="block text-slate-700 mt-0.5">Sehen Sie wer wem schuldet.</span>`
        ]
    }
};

let taglineInterval = null;
let currentTaglineIndex = 0;

function initTaglineCarousel() {
    const spot = document.getElementById('taglineSpot');
    if (!spot) return;

    if (taglineInterval) {
        clearInterval(taglineInterval);
        taglineInterval = null;
    }

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const activeTaglines = t.taglines;

    spot.innerHTML = activeTaglines[currentTaglineIndex % activeTaglines.length];
    spot.classList.add('slide-reset');

    function rotateTagline() {
        spot.classList.remove('slide-reset');
        spot.classList.add('slide-out-left');

        setTimeout(() => {
            currentTaglineIndex = (currentTaglineIndex + 1) % activeTaglines.length;
            spot.innerHTML = activeTaglines[currentTaglineIndex];
            
            spot.classList.remove('slide-out-left');
            spot.classList.add('slide-in-right');

            void spot.offsetWidth;

            setTimeout(() => {
                spot.classList.remove('slide-in-right');
                spot.classList.add('slide-reset');
            }, 50);

        }, 400);
    }

    taglineInterval = setInterval(rotateTagline, 3000);
}

// --- Config Fetcher ---
async function getConfig() {
    try {
        const configRes = await fetch('config.json');
        if (!configRes.ok) throw new Error("config.json not found");
        const config = await configRes.json();
        return config.sheetUrl || config.googleSheetApiUrl || config.apiUrl;
    } catch (err) {
        console.warn("Config fetch warning:", err);
        return null;
    }
}

async function loadGoogleSheetsArchive() {
    console.log("loadGoogleSheetsArchive() called.");
    const select = document.getElementById('archiveSelect');
    if (!select) return;

    select.innerHTML = `<option value="">-- Fetching Sheets Archives... --</option>`;

    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) {
            select.innerHTML = `<option value="">-- Error: Missing sheetUrl in config.json --</option>`;
            return;
        }

        const res = await fetch(sheetUrl);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        
        const rawData = await res.json();
        let ledgers = [];
        if (Array.isArray(rawData)) {
            ledgers = rawData.map(item => typeof item === 'object' ? (item.name || item.ledger || item.title || Object.values(item)[0]) : item);
        } else if (typeof rawData === 'object' && rawData !== null) {
            ledgers = rawData.sheets || rawData.ledgers || Object.keys(rawData);
        }

        ledgers = ledgers.filter(Boolean);

        if (ledgers.length === 0) {
            select.innerHTML = `<option value="">-- No tabs/ledgers found in Sheet --</option>`;
            return;
        }

        select.innerHTML = `<option value="">-- Select a Ledger Tab --</option>` + 
            ledgers.map(name => `<option value="${name}">${name}</option>`).join('');

    } catch (error) {
        console.error("Archive fetch error:", error);
        select.innerHTML = `<option value="">-- Error loading archives (Check CORS / config.json) --</option>`;
    }
}

async function callBackend(action, payload = {}) {
    console.log(`callBackend() action: ${action}`, payload);
    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) {
            alert("Configuration error: Google Sheets API URL is not defined in config.json.");
            return null;
        }

        const response = await fetch(sheetUrl, {
            method: 'POST',
            body: JSON.stringify({ action, tab: currentTab, pin: currentPin, ...payload })
        });
        return await response.json();
    } catch (err) {
        console.error("Backend communication error:", err);
        return { status: "error", message: err.toString() };
    }
}

// --- Modal & Navigation Controllers with Console Tracing ---
function switchModalTab(tab) {
    console.log("switchModalTab triggered with:", tab);
    const createSec = document.getElementById('createSection');
    const recallSec = document.getElementById('recallSection');
    const tabCreateBtn = document.getElementById('tabCreateBtn');
    const tabRecallBtn = document.getElementById('tabRecallBtn');

    if (!createSec || !recallSec) {
        console.error("Modal sections #createSection or #recallSection not found in DOM!");
        return;
    }

    if (tab === 'create') {
        createSec.classList.remove('hidden');
        recallSec.classList.add('hidden');
        if (tabCreateBtn) tabCreateBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        if (tabRecallBtn) tabRecallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-xl cursor-pointer";
    } else {
        createSec.classList.add('hidden');
        recallSec.classList.remove('hidden');
        if (tabRecallBtn) tabRecallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        if (tabCreateBtn) tabCreateBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-xl cursor-pointer";
        
        loadGoogleSheetsArchive();
    }
}

async function createNewLedger() {
    console.log("createNewLedger triggered.");
    const nameInput = document.getElementById('newLedgerName');
    const pinInput = document.getElementById('newLedgerPin');
    if (!nameInput || !pinInput) {
        console.error("Inputs #newLedgerName or #newLedgerPin missing.");
        return;
    }

    const nameVal = nameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
    const pinVal = pinInput.value.trim();

    if (!nameVal || pinVal.length !== 4) {
        alert("Please enter a valid ledger name and a 4-digit PIN.");
        return;
    }

    const res = await callBackend('createLedger', { 
        name: nameVal, 
        pin: pinVal, 
        theme: currentTheme, 
        currency: currentCurrency, 
        language: currentLang,
        cardOrder: ["header", "participants", "expense", "settlement", "history"]
    });

    if (res && res.status === "success") {
        currentTab = res.createdTab || nameVal;
        currentPin = pinVal;
        const modal = document.getElementById('welcomeModal');
        if (modal) modal.classList.add('hidden');
        render();
    } else {
        alert("Failed to create ledger: " + (res?.message || "Unknown error or missing config.json"));
    }
}

async function recallLedger() {
    console.log("recallLedger triggered.");
    const archiveSelect = document.getElementById('archiveSelect');
    const pinInput = document.getElementById('recallLedgerPin');
    if (!pinInput) {
        console.error("Input #recallLedgerPin missing.");
        return;
    }

    const targetLedger = archiveSelect ? archiveSelect.value : '';
    const pinVal = pinInput.value.trim();
    if (!targetLedger || pinVal.length !== 4) {
        alert("Please select a ledger and enter your 4-digit PIN.");
        return;
    }

    try {
        const sheetUrl = await getConfig();
        if (!sheetUrl) {
            alert("Configuration error: Google Sheets API URL is not defined in config.json.");
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

            ledgerData.members = data.members || [];
            ledgerData.expenses = data.expenses || [];

            const modal = document.getElementById('welcomeModal');
            if (modal) modal.classList.add('hidden');
            render();
        } else {
            alert("Authentication failed: " + (data.message || "Invalid PIN"));
        }
    } catch (err) {
        console.error("Recall error:", err);
        alert("Failed to connect to sheet backend.");
    }
}

function openSettingsModal() { document.getElementById('settingsModal')?.classList.remove('hidden'); }
function closeSettingsModal() { document.getElementById('settingsModal')?.classList.add('hidden'); }
function openShareModal() { document.getElementById('shareModal')?.classList.remove('hidden'); }
function closeShareModal() { document.getElementById('shareModal')?.classList.add('hidden'); }
function goHome() {
    currentTab = null;
    currentPin = null;
    ledgerData = { members: [], expenses: [] };
    document.getElementById('welcomeModal')?.classList.remove('hidden');
    render();
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

function render() {
    console.log("render() called. Active tab:", currentTab);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });

    const indicatorEl = document.getElementById('viewModeIndicator');
    if (indicatorEl) {
        indicatorEl.innerHTML = currentTab ? 
            `<span class="text-sm font-medium uppercase tracking-wider opacity-70">Active ledger:</span><span class="text-2xl font-extrabold">${currentTab.toUpperCase()}</span>` :
            `<span class="text-sm font-medium uppercase tracking-wider opacity-70">Active ledger:</span><span class="text-2xl font-extrabold">AWAITING AUTHENTICATION...</span>`;
    }
}

// --- Explicit Global Scope Binding ---
window.switchModalTab = switchModalTab;
window.createNewLedger = createNewLedger;
window.recallLedger = recallLedger;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.goHome = goHome;
window.switchLanguage = switchLanguage;

// --- Initialization Hook ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");
    initTaglineCarousel();
    render();
});
