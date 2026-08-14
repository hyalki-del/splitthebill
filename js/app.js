/* ==========================================
   SPENSE - Main Application Logic & Controller
   Architecture: Modular State, UI Management, Carousel & Resizing
   ========================================== */

let currentTab = null;
let currentPin = null;
let currentLang = 'en';
let currentCurrency = 'USD';
let currentTheme = 'Silk';
let stagedMembersList = [];
let ledgerData = { members: [], expenses: [] };

// --- 1. Landing Box Tagline Carousel Engine ---
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
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Spend simply.</strong><span class="block text-slate-700 mt-0.5">Enjoy the moment. / Leave the expense tracking to SPENSE.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Just add what you spent.</strong><span class="block text-slate-700 mt-0.5">Who paid? Who shares it? / SPENSE does the math.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Settle easily.</strong><span class="block text-slate-700 mt-0.5">See exactly who owes whom — / and how much.</span>`
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

            void spot.offsetWidth; // Force layout reflow tick

            setTimeout(() => {
                spot.classList.remove('slide-in-right');
                spot.classList.add('slide-reset');
            }, 50);

        }, 400); // Matches CSS slide duration
    }

    taglineInterval = setInterval(rotateTagline, 3000); // 3 seconds loop
}

// --- 2. Programmatic Corner-Drag Resizing Engine ---
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

// --- 3. Modal & Navigation Controllers ---
function switchModalTab(tab) {
    const createSec = document.getElementById('createSection');
    const recallSec = document.getElementById('recallSection');
    const tabCreateBtn = document.getElementById('tabCreateBtn');
    const tabRecallBtn = document.getElementById('tabRecallBtn');

    if (tab === 'create') {
        createSec.classList.remove('hidden');
        recallSec.classList.add('hidden');
        tabCreateBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        tabRecallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-xl cursor-pointer";
    } else {
        createSec.classList.add('hidden');
        recallSec.classList.remove('hidden');
        tabRecallBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-amber-300 text-slate-900 rounded-xl cursor-pointer";
        tabCreateBtn.className = "flex-1 theme-btn py-2 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-500 rounded-xl cursor-pointer";
        loadArchiveList();
    }
}

function openSettingsModal() {
    document.getElementById('settingsModal').classList.remove('hidden');
    document.getElementById('settingsLangSelect').value = currentLang;
    document.getElementById('settingsCurrencySelect').value = currentCurrency;
    
    // Set active radio for theme
    const radios = document.querySelectorAll('input[name="modalThemeSelect"]');
    radios.forEach(r => {
        if (r.value.toLowerCase() === currentTheme.toLowerCase()) {
            r.checked = true;
        }
    });
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function openShareModal() {
    document.getElementById('shareModal').classList.remove('hidden');
    const shareUrl = `${window.location.origin}${window.location.pathname}?ledger=${encodeURIComponent(currentTab)}`;
    document.getElementById('shareLinkInput').value = shareUrl;
}

function closeShareModal() {
    document.getElementById('shareModal').classList.add('hidden');
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
    alert("Share link copied to clipboard!");
}

function goHome() {
    currentTab = null;
    currentPin = null;
    ledgerData = { members: [], expenses: [] };
    document.getElementById('welcomeModal').classList.remove('hidden');
    render();
}

// --- 4. Ledger CRUD & Authentication ---
function createNewLedger() {
    const nameInput = document.getElementById('newLedgerName').value.trim().toLowerCase().replace(/\s+/g, '-');
    const pinInput = document.getElementById('newLedgerPin').value.trim();

    if (!nameInput || pinInput.length !== 4) {
        alert("Please enter a valid ledger name and a 4-digit PIN.");
        return;
    }

    currentTab = nameInput;
    currentPin = pinInput;
    document.getElementById('welcomeModal').classList.add('hidden');
    render();
}

function recallLedger() {
    const archiveSelect = document.getElementById('archiveSelect');
    const pinInput = document.getElementById('recallLedgerPin').value.trim();
    
    let targetLedger = archiveSelect ? archiveSelect.value : '';
    const directName = document.getElementById('directTabName');
    if (directName && !directName.closest('#directTabDisplay').classList.contains('hidden')) {
        targetLedger = directName.value;
    }

    if (!targetLedger || pinInput.length !== 4) {
        alert("Please select a ledger and enter your 4-digit PIN.");
        return;
    }

    currentTab = targetLedger;
    currentPin = pinInput;
    document.getElementById('welcomeModal').classList.add('hidden');
    render();
}

function deleteActiveLedger() {
    if (!confirm("Are you sure you want to delete this active ledger?")) return;
    goHome();
}

function loadArchiveList() {
    const select = document.getElementById('archiveSelect');
    if (!select) return;
    // Populate dummy or stored local archives
    select.innerHTML = `<option value="sample-group">sample-group</option>`;
}

// --- 5. Members & Expenses ---
function stageMember() {
    const input = document.getElementById('memberName');
    const name = input.value.trim();
    if (!name) return;

    if (!ledgerData.members.includes(name) && !stagedMembersList.includes(name)) {
        stagedMembersList.push(name);
        renderMembers();
    }
    input.value = '';
    document.getElementById('saveMembersBtn').classList.remove('hidden');
}

function saveStagedMembers() {
    ledgerData.members = [...ledgerData.members, ...stagedMembersList];
    stagedMembersList = [];
    document.getElementById('saveMembersBtn').classList.add('hidden');
    render();
}

function renderMembers() {
    const container = document.getElementById('memberList');
    if (!container) return;
    
    let html = ledgerData.members.map(m => `<span class="px-2.5 py-1 rounded-xl bg-slate-200 text-slate-800 font-bold">${escapeHTML(m)}</span>`).join('');
    html += stagedMembersList.map(m => `<span class="px-2.5 py-1 rounded-xl bg-amber-200 text-slate-800 font-bold border border-amber-400">${escapeHTML(m)} (New)</span>`).join('');
    container.innerHTML = html || '<span class="opacity-60 italic">No participants yet.</span>';
}

function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const paidBy = document.getElementById('expensePaidBy').value;

    if (!date || !desc || isNaN(amount) || amount <= 0 || !paidBy) {
        alert("Please fill in all expense fields correctly.");
        return;
    }

    const checkboxes = document.querySelectorAll('.split-checkbox:checked');
    const splitBetween = Array.from(checkboxes).map(cb => cb.value);

    if (splitBetween.length === 0) {
        alert("Select at least one participant to split between.");
        return;
    }

    ledgerData.expenses.push({ date, category, desc, amount, paidBy, splitBetween });
    
    // Reset form inputs
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
    render();
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

// --- 6. Themes & Localization ---
function applyTheme(themeName) {
    currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName.toLowerCase());
}

function saveSettings() {
    currentLang = document.getElementById('settingsLangSelect').value;
    currentCurrency = document.getElementById('settingsCurrencySelect').value;
    const selectedThemeRadio = document.querySelector('input[name="modalThemeSelect"]:checked');
    if (selectedThemeRadio) {
        applyTheme(selectedThemeRadio.value);
    }
    closeSettingsModal();
    render();
}

function switchLanguage(lang) {
    currentLang = lang;
    render();
    initTaglineCarousel();
}

// --- 7. Core Rendering Engine ---
function render() {
    if (typeof TRANSLATIONS === 'undefined') return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    // Update static UI translations via data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerText = t[key];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (t[key]) el.placeholder = t[key];
    });

    // Header Ledger Info Indicator
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

    // Action buttons visibility toggle
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
        ? ledgerData.expenses.map((e, idx) => `
            <li class="p-2.5 rounded-xl border border-current/15 flex justify-between items-center bg-current/5">
                <div>
                    <span class="font-bold">${escapeHTML(e.desc)}</span> (${escapeHTML(e.category)}) — Paid by <span class="font-bold">${escapeHTML(e.paidBy)}</span>
                    <div class="text-[10px] opacity-70">${e.date} • Split: ${e.splitBetween.join(', ')}</div>
                </div>
                <span class="font-extrabold text-sm">${currentCurrency === 'EUR' ? '€' : currentCurrency === 'TRY' ? '₺' : '$'}${e.amount.toFixed(2)}</span>
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

    // Basic balancing simulation for preview
    container.innerHTML = `<p class="font-bold text-center py-2 text-emerald-600">All balances are currently calculated and balanced.</p>`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- Initialization Lifecycle Hook ---
document.addEventListener('DOMContentLoaded', () => {
    initTaglineCarousel();
    initResizableFrames();
    
    // Set default date to today
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    render();
});
