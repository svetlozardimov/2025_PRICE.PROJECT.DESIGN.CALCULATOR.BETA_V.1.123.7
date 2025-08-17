import dom from './dom.js';
import { appState, saveState, createNewProject } from './state.js';
import { BGN_TO_EUR, PHASES, defaultSpecialties, THEMES } from './config.js'; 
import { renderAll, handlePrint } from './ui.js';
import { showBreakdownModal, showNoteModal, showContractorModal, showProjectNoteModal, savePayments, saveContractor, removeContractor, addNote, addProjectNote, showPaymentModal, printBreakdown, exportBreakdownToTxt, printSpecialtyNotes, exportSpecialtyNotesToTxt } from './modals.js';
import { showContactsReport, showSummaryReport, showNotesReport, exportReportToTxt, printReport, printProjectNotes, exportProjectNotesToTxt } from './reports.js';
import { handleFileImport, handleFileExport, handleExportCsv, handleExportTxt, handleTemplateSave, handleTemplateLoad, handleLogoUpload, removeLogo } from './fileHandlers.js';
import { setupDragAndDrop, updateStatusNotification } from './utils.js';
import { manualHTML } from './manual.js';
import { miniCalcHTML, initializeMiniCalc } from './mini-calculator.js';

// --- ACTION HANDLERS ---

function toggleTheme() {
    const currentIndex = THEMES.indexOf(appState.theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    appState.theme = THEMES[nextIndex];
    document.body.className = appState.theme;
    saveState();
}

function showHelp() {
    const helpWindow = window.open('', 'HelpWindow', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (helpWindow) {
        helpWindow.document.open();
        helpWindow.document.write(manualHTML);
        helpWindow.document.close();
        helpWindow.focus();
    } else {
        alert("Моля, разрешете изскачащите прозорци, за да видите упътването.");
    }
}

function openMiniCalc() {
    dom.miniCalcBody.innerHTML = miniCalcHTML;
    initializeMiniCalc();
    dom.miniCalcModal.style.display = 'block';
}

function saveMiniCalcState() {
    const modal = dom.miniCalcModal;
    if (!appState.miniCalcState) {
        appState.miniCalcState = {};
    }
    appState.miniCalcState.projectType = modal.querySelector('#projectType').value;
    appState.miniCalcState.area = modal.querySelector('#area').value;
    appState.miniCalcState.wallSections = modal.querySelector('#wallSections').value;
    appState.miniCalcState.additionalLength = modal.querySelector('#additionalLength').value;
    appState.miniCalcState.hasCrane = modal.querySelector('#hasCrane').checked;
    appState.miniCalcState.hasComplexity = modal.querySelector('#hasComplexity').checked;
    appState.miniCalcState.complexityPercentage = modal.querySelector('#complexityPercentage').value;
    appState.miniCalcState.includeSupervision = modal.querySelector('#includeSupervision').checked;
    saveState();
}

function addRowFromMiniCalc() {
    const areaInput = dom.miniCalcModal.querySelector('#area');
    const areaFromMiniCalc = parseFloat(areaInput.value) || 0;

    const totalPriceText = dom.miniCalcModal.querySelector('#totalPrice').textContent;
    const price = parseFloat(totalPriceText.replace(' лв.', '')) || 0;

    if (price <= 0) {
        alert("Моля, изчислете валидна цена преди да я добавите.");
        return;
    }

    if (areaFromMiniCalc > 0) {
        appState.area = areaFromMiniCalc;
    }

    const targetSpecialtyName = "СК-Строителни конструкции";
    const skIndex = appState.specialties.findIndex(s => s.name === targetSpecialtyName);

    if (skIndex !== -1) {
        appState.specialties[skIndex].type = "fixed";
        appState.specialties[skIndex].value = price;
    } else {
        const newSkSpecialty = JSON.parse(JSON.stringify(defaultSpecialties.find(s => s.name === targetSpecialtyName) || defaultSpecialties[1]));
        newSkSpecialty.name = targetSpecialtyName;
        newSkSpecialty.type = "fixed";
        newSkSpecialty.value = price;
        appState.specialties.push(newSkSpecialty);
    }
    
    saveMiniCalcState();
    renderAll();
    saveState();
    dom.miniCalcModal.style.display = 'none';
}

function handleAction(target) {
    const { action, idx } = target.dataset;
    const index = parseInt(idx);

    const actions = {
        'toggle-menu': () => {
            const dropdown = target.nextElementSibling;
            const isVisible = dropdown.classList.contains('show');
            document.querySelectorAll('.actions-dropdown.show').forEach(menu => menu.classList.remove('show'));
            if (!isVisible) dropdown.classList.add('show');
        },
        'toggle-status': () => {
            const statuses = ['not-started', 'in-progress', 'completed'];
            const currentIndex = statuses.indexOf(appState.specialties[index].status);
            appState.specialties[index].status = statuses[(currentIndex + 1) % statuses.length];
            renderAll();
            saveState();
        },
        'toggle-type': () => {
            const specialty = appState.specialties[index];
            if (specialty.type === 'sqm') {
                specialty.value = (specialty.value || 0) * (appState.area || 0);
                specialty.type = 'fixed';
            } else {
                specialty.value = appState.area > 0 ? (specialty.value || 0) / appState.area : 0;
                specialty.type = 'sqm';
            }
            renderAll();
            saveState();
        },
        'breakdown': () => showBreakdownModal(index),
        'note': () => showNoteModal(index),
        'assign-contractor': () => showContractorModal(index),
        'duplicate': () => {
            const duplicated = JSON.parse(JSON.stringify(appState.specialties[index]));
            duplicated.name += " - Копие";
            appState.specialties.splice(index + 1, 0, duplicated);
            renderAll();
            saveState();
        },
        'delete': () => {
            if (confirm(`Изтриване на "${appState.specialties[index].name}"?`)) {
                appState.specialties.splice(index, 1);
                renderAll();
                saveState();
            }
        }
    };
    if (actions[action]) actions[action]();
}

function handleNewProjectClick() {
    if (createNewProject()) {
        renderAll();
    }
}

function addSpecialty() {
    const newSpecialty = JSON.parse(JSON.stringify(defaultSpecialties[0]));
    newSpecialty.name = "Нова специалност";
    newSpecialty.value = 0;
    appState.specialties.push(newSpecialty);
    renderAll();
    saveState();
    
    setTimeout(() => {
        const lastRowInput = dom.rows.querySelector(`tr:last-child .specialty-name-input`);
        if (lastRowInput) {
            lastRowInput.focus();
            lastRowInput.select();
        }
    }, 0);
}

function toggleProjectPhase() {
    const currentIndex = PHASES.indexOf(appState.projectPhase);
    appState.projectPhase = PHASES[(currentIndex + 1) % PHASES.length];
    renderAll();
    saveState();
}

function handleSavePayments() { savePayments(); renderAll(); }
function handleSaveContractor() { saveContractor(); renderAll(); }
function handleRemoveContractor() { removeContractor(); renderAll(); }
function handleAddNote() { addNote(); renderAll(); }
function handleAddProjectNote() { addProjectNote(); renderAll(); }

function handleBodyClick(e) {
    if (!e.target.closest('.actions-cell')) {
        document.querySelectorAll('.actions-dropdown.show').forEach(menu => menu.classList.remove('show'));
    }
    const actionTarget = e.target.closest('[data-action]');
    if (actionTarget) {
        handleAction(actionTarget);
    }
    const paymentCell = e.target.closest('.payment-cell');
    if (paymentCell) {
        showPaymentModal(parseInt(paymentCell.dataset.idx));
    }
    if (e.target.matches('.modal-close, .modal, .modal-close-btn, #paymentCancelBtn, #contractorCancelBtn, #noteSaveBtn, #projectNoteSaveBtn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            if (modal.id === 'miniCalcModal') {
                saveMiniCalcState();
            }
            modal.style.display = 'none';
        }
    }
}

export function setupEventListeners() {
    dom.area.addEventListener('input', () => {
        appState.area = parseFloat(dom.area.value) || 0;
        renderAll(); 
        saveState(); 
    });

    document.getElementById('sidebar').addEventListener('change', e => {
        const target = e.target;
        if (appState.hasOwnProperty(target.id) && target.id !== 'area') {
            appState[target.id] = target.type === 'checkbox' ? target.checked : target.value;
            renderAll();
            saveState();
        }
    });

    dom.filterActiveOnly.addEventListener('change', e => { appState.filters.activeOnly = e.target.checked; renderAll(); saveState(); });
    dom.filterUnfinishedOnly.addEventListener('change', e => { appState.filters.unfinishedOnly = e.target.checked; renderAll(); saveState(); });

    dom.rows.addEventListener('change', e => {
        const { idx, field } = e.target.dataset;
        if (idx === undefined || !field) return;
        let value = e.target.type === 'checkbox' ? e.target.checked : (e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value);
        if (appState.currencyMode === 'eur' && field === 'value') {
            value *= BGN_TO_EUR;
        }
        appState.specialties[parseInt(idx)][field] = value;
        renderAll();
        saveState();
    });

    document.body.addEventListener('click', handleBodyClick);

    document.body.addEventListener('input', e => {
        const target = e.target;
        if (target.type !== 'number' || appState.currencyMode !== 'bgn_eur') return;
        const infoDisplay = target.parentElement.querySelector('.info-display');
        if (!infoDisplay) return;
        let newText = '(' + (parseFloat(target.value) / BGN_TO_EUR).toFixed(2) + ' €)';
        const equivalentMatch = infoDisplay.innerText.match(/\(Екв:.*?\)/);
        if (equivalentMatch) { newText += ' ' + equivalentMatch[0]; }
        infoDisplay.innerText = newText;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.id === 'miniCalcModal') {
                    saveMiniCalcState();
                }
                modal.style.display = 'none';
            });
        }
    });

    // НОВО СЪБИТИЕ ЗА ПРЕДУПРЕЖДЕНИЕ ПРИ ЗАТВАРЯНЕ
    window.addEventListener('beforeunload', (e) => {
        if (appState.isDirty) {
            e.preventDefault();
            e.returnValue = ''; // Това е необходимо за повечето браузъри
        }
    });

    dom.newNoteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleAddNote(); } });
    dom.newProjectNoteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleAddProjectNote(); } });

    // Button clicks
    dom.sidebarToggleBtn.addEventListener('click', () => dom.mainLayout.classList.toggle('sidebar-collapsed'));
    dom.themeToggleBtn.addEventListener('click', toggleTheme);
    dom.openMiniCalcBtn.addEventListener('click', openMiniCalc);
    dom.addFromMiniCalcBtn.addEventListener('click', addRowFromMiniCalc);
    dom.newProjectBtn.addEventListener('click', handleNewProjectClick);
    dom.importBtn.addEventListener('click', () => dom.importFile.click());
    dom.exportBtn.addEventListener('click', handleFileExport);
    dom.exportCsvBtn.addEventListener('click', handleExportCsv);
    dom.exportTxtBtn.addEventListener('click', handleExportTxt);
    dom.saveTemplateBtn.addEventListener('click', handleTemplateSave);
    dom.loadTemplateBtn.addEventListener('click', () => dom.templateFile.click());
    dom.addSpecialtyBtn.addEventListener('click', addSpecialty);
    dom.printBtn.addEventListener('click', handlePrint);
    dom.projectPhaseBtn.addEventListener('click', toggleProjectPhase);
    dom.uploadLogoBtn.addEventListener('click', () => dom.logoUploadInput.click());
    dom.removeLogoBtn.addEventListener('click', removeLogo);
    dom.generateContactsBtn.addEventListener('click', showContactsReport);
    dom.generateSummaryReportBtn.addEventListener('click', showSummaryReport);
    dom.generateNotesReportBtn.addEventListener('click', showNotesReport);
    dom.projectNotesBtn.addEventListener('click', showProjectNoteModal);
    dom.printReportBtn.addEventListener('click', printReport);
    dom.exportReportTxtBtn.addEventListener('click', exportReportToTxt);
    dom.helpBtn.addEventListener('click', showHelp);
    
    // Modal Button Clicks
    dom.paymentSaveBtn.addEventListener('click', handleSavePayments);
    dom.contractorSaveBtn.addEventListener('click', handleSaveContractor);
    dom.contractorRemoveBtn.addEventListener('click', handleRemoveContractor);
    dom.addNoteBtn.addEventListener('click', handleAddNote);
    dom.addProjectNoteBtn.addEventListener('click', handleAddProjectNote);
    dom.printBreakdownBtn.addEventListener('click', printBreakdown);
    dom.exportBreakdownTxtBtn.addEventListener('click', exportBreakdownToTxt);
    dom.printProjectNotesBtn.addEventListener('click', printProjectNotes);
    dom.exportProjectNotesTxtBtn.addEventListener('click', exportProjectNotesToTxt);
    dom.printNoteBtn.addEventListener('click', printSpecialtyNotes);
    dom.exportNoteTxtBtn.addEventListener('click', exportSpecialtyNotesToTxt);

    // File inputs
    dom.importFile.addEventListener('change', handleFileImport);
    dom.templateFile.addEventListener('change', handleTemplateLoad);
    dom.logoUploadInput.addEventListener('change', handleLogoUpload);

    dom.rows.addEventListener('focusin', (e) => {
        document.querySelectorAll('.table-row-active').forEach(row => row.classList.remove('table-row-active'));
        const activeRow = e.target.closest('tr');
        if (activeRow) { activeRow.classList.add('table-row-active'); }
    });
    dom.rows.addEventListener('focusout', (e) => {
        const activeRow = e.target.closest('tr');
        if (activeRow) { activeRow.classList.remove('table-row-active'); }
    });

    setupDragAndDrop(dom.rows, () => appState.specialties, () => {
        renderAll();
        saveState();
    });
}