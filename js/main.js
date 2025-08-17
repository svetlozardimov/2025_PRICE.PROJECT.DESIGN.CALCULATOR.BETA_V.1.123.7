import { loadState } from './state.js';
import { renderAll } from './ui.js';
import { setupEventListeners } from './eventListeners.js';
import { initializeNoteModals } from './modals.js';

// --- APP INITIALIZATION ---
// This is the entry point of the application.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load data from localStorage or set defaults
    loadState();
    
    // 2. Render the entire UI based on the loaded state
    renderAll();

    // 3. Initialize modal-specific logic (like note lists)
    initializeNoteModals();

    // 4. Set up all the event listeners for user interaction
    setupEventListeners();
});