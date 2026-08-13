async function saveSettings() {
    const newCur = document.getElementById('settingsCurrencySelect').value;
    const selectedRadio = document.querySelector('input[name="modalThemeSelect"]:checked');
    const newTheme = selectedRadio ? selectedRadio.value : currentTheme;

    // Apply locally first for immediate user feedback
    currentCurrency = newCur;
    applyTheme(newTheme);
    updateCurrencyDisplays();
    closeSettingsModal();

    // Send BOTH values in a single network request to prevent race conditions in Google Apps Script
    await sendAction({ 
        action: "updateSettings", 
        currency: newCur, 
        theme: newTheme 
    });
}
