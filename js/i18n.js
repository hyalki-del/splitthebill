/* ==========================================
   SPENSE - Internationalization (i18n) Engine
   Architecture: Centralized Multilingual Dictionaries
   ========================================== */

const TRANSLATIONS = {
    en: {
        // App / Header
        settingsBtn: "⚙ Settings",
        shareLinkBtn: "Share Link",
        deleteBtn: "Delete",
        
        // Participants Frame
        participantsTitle: "Participants",
        participantsSub: "Add or remove people from this group.",
        namePlaceholder: "Name...",
        addBtn: "Add",
        saveMembersBtn: "Save New Participants",

        // Expense Form Frame
        newExpenseTitle: "New Expense",
        newExpenseSub: "Log a transaction to split.",
        dateLabel: "Date",
        categoryLabel: "Category",
        descLabel: "Description",
        descPlaceholder: "e.g. Dinner",
        amountLabel: "Amount",
        paidByLabel: "Paid By",
        splitBetweenLabel: "Split Between:",
        selectAllBtn: "Select All",
        recordExpenseBtn: "Record Expense",

        // Settlement Matrix Frame
        settlementTitle: "Settlement Matrix",
        copySummaryBtn: "Copy Summary",

        // Ledger History Frame
        historyTitle: "Ledger History",
        clickToEditSub: "(Click item to edit)",
        generateReportBtn: "Generate Report",

        // Welcome Modal
        modalSub: "Create or open a confidential group ledger.",
        tabCreate: "Create New",
        tabRecall: "Recall Existing",
        ledgerNameLabel: "Ledger Name",
        ledgerNamePh: "e.g. dinner-club",
        setPinLabel: "Set 4-Digit PIN",
        initializeBtn: "Initialize Ledger",
        selectArchiveLabel: "Select Archive",
        accessingSharedLabel: "Accessing Shared Ledger",
        enterPinLabel: "Enter 4-Digit PIN",
        accessLedgerBtn: "Access Ledger",

        // Modals / Statuses
        shareLinkHeader: "Share Ledger Link",
        shareLinkSub: "Anyone with this link will only need to enter the 4-digit PIN to access this ledger.",
        copyBtn: "Copy",
        processingMsg: "Processing...",

        // Dynamic Tagline Carousel
        taglines: [
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Spend simply.</strong><span class="block text-slate-700 mt-0.5">Enjoy the moment. / Leave the expense tracking to SPENSE.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Just add what you spent.</strong><span class="block text-slate-700 mt-0.5">Who paid? Who shares it? / SPENSE does the math.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Settle easily.</strong><span class="block text-slate-700 mt-0.5">See exactly who owes whom — / and how much.</span>`
        ]
    },

    tr: {
        // App / Header
        settingsBtn: "⚙ Ayarlar",
        shareLinkBtn: "Bağlantıyı Paylaş",
        deleteBtn: "Sil",

        // Participants Frame
        participantsTitle: "Katılımcılar",
        participantsSub: "Bu gruba kişi ekleyin veya çıkarın.",
        namePlaceholder: "İsim...",
        addBtn: "Ekle",
        saveMembersBtn: "Yeni Katılımcıları Kaydet",

        // Expense Form Frame
        newExpenseTitle: "Yeni Harcama",
        newExpenseSub: "Bölüştürmek için işlem kaydedin.",
        dateLabel: "Tarih",
        categoryLabel: "Kategori",
        descLabel: "Açıklama",
        descPlaceholder: "ör. Akşam Yemeği",
        amountLabel: "Tutar",
        paidByLabel: "Ödeyen",
        splitBetweenLabel: "Paylaşanlar:",
        selectAllBtn: "Tümünü Seç",
        recordExpenseBtn: "Harcamayı Kaydet",

        // Settlement Matrix Frame
        settlementTitle: "Ödeme Matrisi",
        copySummaryBtn: "Özeti Kopyala",

        // Ledger History Frame
        historyTitle: "Geçmiş Kayıtlar",
        clickToEditSub: "(Düzenlemek için tıkla)",
        generateReportBtn: "Rapor Oluştur",

        // Welcome Modal
        modalSub: "Gizli bir grup defteri oluşturun veya açın.",
        tabCreate: "Yeni Oluştur",
        tabRecall: "Var Olanı Aç",
        ledgerNameLabel: "Defter Adı",
        ledgerNamePh: "ör. aksam-yemegi",
        setPinLabel: "4 Haneli PIN Belirleyin",
        initializeBtn: "Defteri Başlat",
        selectArchiveLabel: "Arşivden Seç",
        accessingSharedLabel: "Paylaşılan Deftere Erişiliyor",
        enterPinLabel: "4 Haneli PIN Girin",
        accessLedgerBtn: "Deftere Eriş",

        // Modals / Statuses
        shareLinkHeader: "Defter Bağlantısını Paylaş",
        shareLinkSub: "Bu bağlantıya sahip herkes deftere erişmek için yalnızca 4 haneli PIN'i girmelidir.",
        copyBtn: "Kopyala",
        processingMsg: "İşleniyor...",

        // Dynamic Tagline Carousel
        taglines: [
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Kolayca harca.</strong><span class="block text-slate-700 mt-0.5">Anın tadını çıkar. / Masraf takibini SPENSE'e bırak.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Sadece harcamanı ekle.</strong><span class="block text-slate-700 mt-0.5">Kim ödedi? Kimler paylaşıyor? / Matematik işini SPENSE yapar.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Rahatça hesabı kapat.</strong><span class="block text-slate-700 mt-0.5">Kimin kime ne kadar borcu var — / anında gör.</span>`
        ]
    },

    de: {
        // App / Header
        settingsBtn: "⚙ Einstellungen",
        shareLinkBtn: "Link Teilen",
        deleteBtn: "Löschen",

        // Participants Frame
        participantsTitle: "Teilnehmer",
        participantsSub: "Personen zu dieser Gruppe hinzufügen oder entfernen.",
        namePlaceholder: "Name...",
        addBtn: "Hinzufügen",
        saveMembersBtn: "Neue Teilnehmer Speichern",

        // Expense Form Frame
        newExpenseTitle: "Neue Ausgabe",
        newExpenseSub: "Tragen Sie eine Transaktion zum Aufteilen ein.",
        dateLabel: "Datum",
        categoryLabel: "Kategorie",
        descLabel: "Beschreibung",
        descPlaceholder: "z.B. Abendessen",
        amountLabel: "Betrag",
        paidByLabel: "Bezahlt von",
        splitBetweenLabel: "Aufteilen zwischen:",
        selectAllBtn: "Alle Auswählen",
        recordExpenseBtn: "Ausgabe Aufzeichnen",

        // Settlement Matrix Frame
        settlementTitle: "Abrechnungsmatrix",
        copySummaryBtn: "Zusammenfassung Kopieren",

        // Ledger History Frame
        historyTitle: "Verlauf",
        clickToEditSub: "(Zum Bearbeiten anklicken)",
        generateReportBtn: "Bericht Erstellen",

        // Welcome Modal
        modalSub: "Erstellen oder öffnen Sie ein vertrauliches Gruppenbuch.",
        tabCreate: "Neu Erstellen",
        tabRecall: "Vorhandenes Öffnen",
        ledgerNameLabel: "Name des Buches",
        ledgerNamePh: "z.B. abendessen-club",
        setPinLabel: "4-stellige PIN Festlegen",
        initializeBtn: "Buch Initialisieren",
        selectArchiveLabel: "Aus Archiv Auswählen",
        accessingSharedLabel: "Zugriff Auf Geteiltes Buch",
        enterPinLabel: "4-stellige PIN Eingeben",
        accessLedgerBtn: "Auf Buch Zugreifen",

        // Modals / Statuses
        shareLinkHeader: "Buch-Link Teilen",
        shareLinkSub: "Jeder mit diesem Link muss nur die 4-stellige PIN eingeben, um auf dieses Buch zuzugreifen.",
        copyBtn: "Kopieren",
        processingMsg: "Verarbeitung...",

        // Dynamic Tagline Carousel
        taglines: [
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Einfach ausgeben.</strong><span class="block text-slate-700 mt-0.5">Genieße den Moment. / Überlasse die Spesenverfolgung SPENSE.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Einfach eintragen, was ausgegeben wurde.</strong><span class="block text-slate-700 mt-0.5">Wer hat bezahlt? Wer teilt es? / SPENSE macht die Rechnung.</span>`,
            `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Einfach abrechnen.</strong><span class="block text-slate-700 mt-0.5">Sehen Sie genau, wer wem schuldet — / und wie viel.</span>`
        ]
    }
};

// Global default language state
let currentLang = 'en';
