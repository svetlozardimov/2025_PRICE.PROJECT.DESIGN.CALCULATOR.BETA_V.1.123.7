import { defaultState } from './config.js';
import { sanitizeSpecialties, updateStatusNotification } from './utils.js';

export const appState = {};
export let currentReport = {};

export function updateAppState(newState) {
    Object.keys(appState).forEach(key => delete appState[key]);
    Object.assign(appState, newState);
}

export function getLocalStorageKey() {
    return `projectData_v13_${window.location.pathname.split('/').pop() || 'default'}`;
}

export function saveState() {
    if (!appState.isDirty) {
        appState.isDirty = true;
    }
    appState.lastModified = new Date().toISOString();
    localStorage.setItem(getLocalStorageKey(), JSON.stringify(appState));
    updateStatusNotification(); 
}

export function loadState() {
    const savedStateJSON = localStorage.getItem(getLocalStorageKey());
    let loadedState;
    try {
        loadedState = savedStateJSON ? JSON.parse(savedStateJSON) : JSON.parse(JSON.stringify(defaultState));
    } catch {
        loadedState = JSON.parse(JSON.stringify(defaultState));
    }

    if (savedStateJSON && loadedState.projectName) {
        if (loadedState.isDirty === undefined) {
             loadedState.isDirty = true;
        }
    }

    loadedState.specialties = sanitizeSpecialties(loadedState.specialties);

    (loadedState.specialties || []).forEach(s => {
        if (s.note !== undefined) {
            if (typeof s.note === 'string' && s.note.trim() !== '') {
                if (!s.notes) s.notes = [];
                s.notes.push({ text: s.note, completed: false });
            }
            delete s.note;
        }
    });
    
    if (loadedState.filters && (loadedState.filters.unpaid !== undefined || loadedState.filters.remaining !== undefined)) {
        loadedState.filters = { activeOnly: false, unfinishedOnly: false };
    }

    const finalState = Object.assign({}, defaultState, loadedState);
    
    document.body.className = finalState.theme || 'theme-light';
    updateAppState(finalState);
    updateStatusNotification();
}

export function createNewProject() {
    if (!confirm("Сигурни ли сте? Всички незапазени промени ще бъдат загубени.")) {
        return false;
    }
    const freshState = JSON.parse(JSON.stringify(defaultState));
    updateAppState(freshState);
    
    appState.isDirty = false;
    saveState(); 
    appState.isDirty = false;
    updateStatusNotification();
    
    return true;
}

export function setCurrentReport(report) {
    currentReport = report;
}