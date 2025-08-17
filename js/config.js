// --- CONSTANTS ---
export const BGN_TO_EUR = 1.95583;
export const PHASES = ["Идеен проект", "Технически проект", "Работен проект"];

export const THEMES = [
    'theme-light', 'theme-dark', 'theme-blue',
    'theme-forest', 'theme-gray', 'theme-mint'
];

export const LOCKED_SPECIALTIES = [
    "Архитектура",
    "СК-Строителни конструкции",
    "Геодезия",
    "Електро",
    "ВиК",
    "ПБ-Пожарна безопасност"
];

export const defaultSpecialties = [
    { name: "Архитектура", type: "sqm", value: 12, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "СК-Строителни конструкции", type: "sqm", value: 8, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "Геодезия", type: "fixed", value: 2500, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "Електро", type: "sqm", value: 2, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "ВиК", type: "sqm", value: 1.5, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "ПБ-Пожарна безопасност", type: "fixed", value: 1900, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "ОВК", type: "sqm", value: 2.5, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "" , note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "ГАЗ", type: "fixed", value: 2000, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "ЕЕ", type: "fixed", value: 2000, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "Озеленяване", type: "fixed", value: 500, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "ПБЗ", type: "fixed", value: 500, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "ПУСО", type: "fixed", value: 500, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "Технология", type: "sqm", value: 1, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "Съгласуване и управление", type: "sqm", value: 1, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] },
    { name: "Буфер", type: "sqm", value: 1, isPaid: false, notes: [], status: "not-started", contractorName: "", payments: [ { label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" } ] }
];

export const defaultState = {
    projectName: "", vazlozhitel: "", izpalnitel: "", area: 1000,
    currencyMode: "bgn_eur", projectPhase: "Технически проект",
    showAdvanceCheck: true, bonusCheck: false, bonusPercent: 10,
    bonusIsPaidCheck: false, logoSrc: "",
    theme: "theme-light",
    specialties: JSON.parse(JSON.stringify(defaultSpecialties)),
    contractors: {}, projectNotes: [],
    filters: { unpaid: false, remaining: false },
    miniCalcState: {
        projectType: '', area: '', wallSections: 1, additionalLength: 0,
        hasCrane: false, hasComplexity: false, complexityPercentage: '', includeSupervision: false
    },
    isDirty: false, // Ново поле за следене на промени
    lastFileName: '' // Ново поле за името на последния файл
};