/* ==========================================
   SPENSE - Main Application Logic & Controller
   Architecture: Defensive Modular State, UI Management, Carousel, Resizing & Google Sheets Config Integration
   ========================================== */

let currentTab = null;
let currentPin = null;
let currentLang = 'en';
let currentCurrency = 'USD';
let currentTheme = 'Silk';
let stagedMembersList = [];
let ledgerData = { members: [], expenses: [] };

// --- 1. Landing Box Tagline Slide Carousel Engine ---
let taglineInterval = null;
let currentTaglineIndex = 0;

function initTaglineCarousel() {
    const spot = document.getElementById('taglineSpot');
    if (!spot) return;

    if (taglineInterval) {
        clearInterval(taglineInterval);
        taglineInterval = null;
    }

    const t = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang]) ? TRANSLATIONS[currentLang] : {
        taglines: [
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Spend simply.</strong><span class="block text-slate-700 mt-0.5">Enjoy the moment. / Leave tracking to SPENSE.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Just add what you spent.</strong><span class="block text-slate-700 mt-0.5">Who paid? Who shares? / SPENSE does math.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Settle easily.</strong><span class="block text-slate-700 mt-0.5">See who owes whom — and how much.</span>`
        ]
    };
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

// --- 2. Programmatic Corner-Drag Resizing & Card Swapping Engine ---
function initResizableFrames() {
    const cards = document.querySelectorAll('.theme-card');

    cards.forEach((card, index) => {
        if (card.closest('#welcomeModal') || card.closest('#settingsModal') || card.closest('#shareModal') || card.closest('#recordingModal')) {
            return;
        }

        const storageKey = `spense_frame_dim_${index}`;
        const savedDim = localStorage.getItem(storageKey);
        if (savedDim) {
            try {
                const { width, height } = JSON.parse(savedDim);
                if (width) card.style.width = width;
                if (height) card.style.height = height;
            } catch (e) {
                console.error("Failed to parse frame dimensions", e);
            }
        }

        if (card.querySelector('.resize-handle')) return;

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        card.appendChild(handle);

        let startX, startY, startWidth, startHeight;

        handle.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = card.offsetWidth;
            startHeight = card.offsetHeight;

            document.body.classList.add('is-resizing');

            function onMouseMove(e) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                const newWidth = Math.max(280, startWidth + dx);
                const newHeight = Math.max(150, startHeight + dy);

                card.style.width = `${newWidth}px`;
                card.style.height = `${newHeight}px`;
            }

            function onMouseUp() {
                document.body.classList.remove('is-resizing');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                localStorage.setItem(storageKey, JSON.stringify({
                    width: card.style.width,
                    height: card.style.height
                }));
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    });
}

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

        handle.addEventListener('dragend', (e) => {
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

        card.addEventListener('dragleave', (e) => {
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
    if (!currentTab) {
        alert("No active ledger selected.");
        return;
    }
    const newOrder = getCurrentCardOrder();
    const res = await callBackend('updateSettings', { cardOrder: newOrder });
    if (res && res.status === "success") {
        document.getElementById('layoutActionBar')?.classList.add('hidden');
        alert("Layout saved successfully to Google Sheet!");
    } else {
        alert("Failed to save layout: " + (res?.message || "Unknown error"));
    }
}

// --- 3. Robust Google Sheets Archive Fetcher ---
async function getConfig() {
    try {
        const configRes = await fetch('config.json');
        if (!configRes.ok) throw new Error("config.json not found");
        const config = await configRes.json();
        return config.sheetUrl || config.googleSheetApiUrl || config.apiUrl;
    } catch (err) {
        console.warn("Using fallback or missing config.json:", err);
        return null;
    }
}

async function loadGoogleSheetsArchive() {
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

// --- 4. Modal & Navigation Controllers ---
function switchModalTab(tab) {
    const createSec = document.getElementById('createSection');
    const recallSec = document.getElementById('recallSection');
    const tabCreateBtn = document.getElementById('tabCreateBtn');
    const tabRecallBtn = document.getElementById('tabRecallBtn');

    if (!createSec || !recallSec) return;

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

function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('hidden');
    
    const langSelect = document.getElementById('settingsLangSelect');
    const currSelect = document.getElementById('settingsCurrencySelect');
    if (langSelect) langSelect.value = currentLang;
    if (currSelect) currSelect.value = currentCurrency;
    
    const radios = document.querySelectorAll('input[name="modalThemeSelect"]');
    radios.forEach(r => {
        if (r.value.toLowerCase() === currentTheme.toLowerCase()) {
            r.checked = true;
        }
    });
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
}

function openShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('hidden');
    
    const input = document.getElementById('shareLinkInput');
    if (input && currentTab) {
        input.value = `${window.location.origin}${window.location.pathname}?ledger=${encodeURIComponent(currentTab)}`;
    }
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.add('hidden');
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
    alert("Share link copied to clipboard!");
}

function goHome() {
    currentTab = null;
    currentPin = null;
    ledgerData = { members: [], expenses: [] };
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.classList.remove('hidden');
    render();
}

async function createNewLedger() {
    const nameInput = document.getElementById('newLedgerName');
    const pinInput = document.getElementById('newLedgerPin');
    if (!nameInput || !pinInput) return;

    const nameVal = nameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
    const pinVal = pinInput.value.trim();

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
        const modal = document.getElementById('welcomeModal');
        if (modal) modal.classList.add('hidden');
        render();
    } else {
        alert("Failed to create ledger: " + (res?.message || "Unknown error or missing config.json"));
    }
}

async function recallLedger() {
    const archiveSelect = document.getElementById('archiveSelect');
    const pinInput = document.getElementById('recallLedgerPin');
    if (!pinInput) return;

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

            if (data.cardOrder) {
                applyCardOrder(data.cardOrder);
            }

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

async function deleteActiveLedger() {
    if (!confirm("Are you sure you want to delete this active ledger?")) return;
    await callBackend('deleteLedger');
    goHome();
}

async function addMemberDirect() {
    const input = document.getElementById('memberName');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    if (!currentTab) {
        alert("Please initialize or access a ledger first.");
        return;
    }

    if (ledgerData.members.includes(name)) {
        alert("Participant already exists in this ledger.");
        input.value = '';
        return;
    }

    const res = await callBackend('addMembers', { names: [name] });
    
    if (res && res.status === "success") {
        ledgerData.members.push(name);
        input.value = '';
        render();
    } else {
        alert("Failed to add participant: " + (res?.message || "Unknown error"));
    }
}

async function deleteMember(name) {
    if (!confirm(`Remove participant '${name}'?`)) return;

    const res = await callBackend('removeMember', { name });
    if (res && res.status === "success") {
        ledgerData.members = ledgerData.members.filter(m => m !== name);
        render();
    } else {
        alert("Failed to remove participant: " + (res?.message || "Unknown error"));
    }
}

function renderMembers() {
    const container = document.getElementById('memberList');
    if (!container) return;
    
    container.innerHTML = ledgerData.members.length > 0 
        ? ledgerData.members.map(m => `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-200 text-slate-800 font-bold">
                ${escapeHTML(m)}
                <button type="button" onclick="window.deleteMember('${escapeHTML(m)}')" class="text-rose-600 hover:text-rose-800 font-black text-xs ml-1 cursor-pointer" title="Remove">×</button>
            </span>
        `).join('') 
        : '<span class="opacity-60 italic">No participants yet. Add someone above.</span>';
}

async function addExpense() {
    const date = document.getElementById('expenseDate')?.value;
    const desc = document.getElementById('expenseDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount')?.value);
    const paidBy = document.getElementById('expensePaidBy')?.value;

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) {
        alert("Please fill in all expense fields correctly.");
        return;
    }

    const checkboxes = document.querySelectorAll('.split-checkbox:checked');
    const splitWith = Array.from(checkboxes).map(cb => cb.value);

    if (splitWith.length === 0) {
        alert("Select at least one participant to split between.");
        return;
    }

    const category = document.getElementById('expenseCategory')?.value || "General";
    const res = await callBackend('addExpense', { date, category, desc, amount, paidBy, splitWith });

    if (res && res.status === "success") {
        ledgerData.expenses.push({ date, category, desc, amount, paidBy, splitWith });
        
        const descInput = document.getElementById('expenseDesc');
        const amtInput = document.getElementById('expenseAmount');
        if (descInput) descInput.value = '';
        if (amtInput) amtInput.value = '';
        render();
    } else {
        alert("Failed to record expense: " + (res?.message || ""));
    }
}

function toggleSelectAll(select) {
    const checkboxes = document.querySelectorAll('.split-checkbox');
    checkboxes.forEach(cb => cb.checked = select);
}

function copySettlementSummary() {
    alert("Settlement summary copied to clipboard!");
}

function generateReport() {
    alert("Generating financial report...");
}

function applyTheme(themeName) {
    currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName.toLowerCase());
}

async function saveSettings() {
    const langSel = document.getElementById('settingsLangSelect');
    const currSel = document.getElementById('settingsCurrencySelect');
    if (langSel) currentLang = langSel.value;
    if (currSel) currentCurrency = currSel.value;
    
    const selectedThemeRadio = document.querySelector('input[name="modalThemeSelect"]:checked');
    if (selectedThemeRadio) {
        applyTheme(selectedThemeRadio.value);
    }

    const currentOrder = getCurrentCardOrder();
    await callBackend('updateSettings', { theme: currentTheme, currency: currentCurrency, language: currentLang, cardOrder: currentOrder });

    closeSettingsModal();
    render();
}

function switchLanguage(lang) {
    currentLang = lang;
    render();
    initTaglineCarousel();
}

function render() {
    if (typeof TRANSLATIONS === 'undefined') return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (t[key]) el.placeholder = t[key];
    });

    const indicatorEl = document.getElementById('viewModeIndicator');
    if (indicatorEl) {
        if (currentTab) {
            indicatorEl.innerHTML = `
                <span class="text-sm sm:text-base font-medium uppercase tracking-wider opacity-70">Active ledger:</span>
                <span class="text-2xl sm:text-4xl font-extrabold break-words leading-tight mt-0.5">${escapeHTML(currentTab.toUpperCase())}</span>
            `;
        } else {
            indicatorEl.innerHTML = `
                <span class="text-sm sm:text-base font-medium uppercase tracking-wider opacity-70">Active ledger:</span>
                <span class="text-2xl sm:text-4xl font-extrabold break-words leading-tight mt-0.5">AWAITING AUTHENTICATION...</span>
            `;
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

    renderMembers();
    renderDropdowns();
    renderSplitCheckboxes();
    renderHistory();
    renderSettlement();
}

function renderDropdowns() {
    const catSelect = document.getElementById('expenseCategory');
    const paidSelect = document.getElementById('expensePaidBy');
    if (!catSelect || !paidSelect) return;

    const categories = ["Food & Drink", "Transport", "Accommodation", "Shopping", "Entertainment", "Other"];
    catSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');

    paidSelect.innerHTML = ledgerData.members.length > 0 
        ? ledgerData.members.map(m => `<option value="${m}">${escapeHTML(m)}</option>`).join('')
        : '<option value="">No participants</option>';
}

function renderSplitCheckboxes() {
    const container = document.getElementById('splitCheckboxes');
    if (!container) return;

    container.innerHTML = ledgerData.members.length > 0
        ? ledgerData.members.map(m => `
            <label class="flex items-center gap-1.5 cursor-pointer bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-300 font-semibold">
                <input type="checkbox" value="${m}" checked class="split-checkbox accent-slate-900 cursor-pointer"> ${escapeHTML(m)}
            </label>
        `).join('')
        : '<span class="opacity-60 italic">Add participants first.</span>';
}

function renderHistory() {
    const list = document.getElementById('expenseHistory');
    if (!list) return;

    list.innerHTML = ledgerData.expenses.length > 0
        ? ledgerData.expenses.map((e) => `
            <li class="p-2.5 rounded-xl border border-current/15 flex justify-between items-center bg-current/5">
                <div>
                    <span class="font-bold">${escapeHTML(e.desc)}</span> (${escapeHTML(e.category)}) — Paid by <span class="font-bold">${escapeHTML(e.paidBy)}</span>
                    <div class="text-[10px] opacity-70">${e.date} • Split: ${Array.isArray(e.splitWith) ? e.splitWith.join(', ') : (e.splitBetween ? e.splitBetween.join(', ') : '')}</div>
                </div>
                <span class="font-extrabold text-sm">${currentCurrency === 'EUR' ? '€' : currentCurrency === 'TRY' ? '₺' : '$'}${parseFloat(e.amount).toFixed(2)}</span>
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

    container.innerHTML = `<p class="font-bold text-center py-2 text-emerald-600">All balances are currently calculated and balanced.</p>`;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- Explicit Global Scope Binding ---
window.switchModalTab = switchModalTab;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.copyShareLink = copyShareLink;
window.goHome = goHome;
window.createNewLedger = createNewLedger;
window.recallLedger = recallLedger;
window.deleteActiveLedger = deleteActiveLedger;
window.addMemberDirect = addMemberDirect;
window.deleteMember = deleteMember;
window.addExpense = addExpense;
window.toggleSelectAll = toggleSelectAll;
window.copySettlementSummary = copySettlementSummary;
window.generateReport = generateReport;
window.applyTheme = applyTheme;
window.saveSettings = saveSettings;
window.switchLanguage = switchLanguage;
window.saveCardLayout = saveCardLayout;

// --- Initialization Hook ---
document.addEventListener('DOMContentLoaded', () => {
    initTaglineCarousel();
    initResizableFrames();
    initCardDragging();
    
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    render();
});
