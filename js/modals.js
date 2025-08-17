import dom from './dom.js';
import { appState, saveState } from './state.js';
import { BGN_TO_EUR } from './config.js';
import { calculateRowData, formatCurrencyForTotals, formatCurrencyForSummary, generatePrintAndExport, generateFilename } from './utils.js';

// --- MODAL WINDOWS LOGIC ---
export function showBreakdownModal(index) {
    const specialty = appState.specialties[index];
    const data = calculateRowData(specialty);
    dom.modalSpecialtyName.innerHTML = `<h3 style="margin:0;">Справка за: ${specialty.name}</h3><p style="margin: 5px 0 15px 0; color: #888;">Изпълнител: ${specialty.contractorName || 'Невъведен'}</p>`;
    
    let html = `<tr><td>Изчисление:</td><td>${specialty.type === 'sqm' ? `${(parseFloat(appState.area) || 0).toFixed(2)} м² x ${(specialty.value || 0).toFixed(2)} лв/м²` : "Твърда сума"}</td></tr>
                <tr><td>Дължимо:</td><td>${formatCurrencyForTotals(data.calc_sum_bgn)}</td></tr>
                <tr><td>Платено:</td><td>${formatCurrencyForTotals(data.totalPaidBGN)}</td></tr>
                <tr><td><b>Остатък:</b></td><td><b>${formatCurrencyForTotals(data.remaining_bgn)}</b></td></tr>
                <tr><td colspan="2" style="text-align:center;background-color:#f2f5f8;padding:5px"><b>Плащания</b></td></tr>`;
    
    specialty.payments.forEach(p => {
        html += `<tr><td>${p.label || 'Етап'} (${p.date || 'няма дата'}):</td><td>${formatCurrencyForTotals(p.amount || 0)} ${p.note ? `(${p.note})` : ''}</td></tr>`
    });
    
    dom.breakdownModal.dataset.currentIndex = index;
    dom.breakdownModalBody.innerHTML = html;
    dom.breakdownModal.style.display = 'block';
}

function generateBreakdownTXT(index) {
    const specialty = appState.specialties[index];
    const data = calculateRowData(specialty);
    let txt = `СПРАВКА ЗА: ${specialty.name}\n`;
    txt += `Проект: ${appState.projectName || 'Неозаглавен'}\n`;
    txt += `Изпълнител: ${specialty.contractorName || 'Невъведен'}\n`;
    txt += "==================================\n\n";
    
    const calculationText = specialty.type === 'sqm' 
        ? `${(parseFloat(appState.area) || 0).toFixed(2)} м² x ${(specialty.value || 0).toFixed(2)} лв/м²` 
        : "Твърда сума";
    
    txt += `Изчисление: ${calculationText}\n`;
    txt += `Дължимо: ${data.calc_sum_bgn.toFixed(2)} лв\n`;
    txt += `Платено: ${data.totalPaidBGN.toFixed(2)} лв\n`;
    txt += `Остатък: ${data.remaining_bgn.toFixed(2)} лв\n\n`;
    
    txt += "--- ПЛАЩАНИЯ ---\n";
    specialty.payments.forEach(p => {
        txt += `  - ${p.label || 'Етап'} (${p.date || 'няма дата'}): ${(p.amount || 0).toFixed(2)} лв ${p.note ? `(${p.note})` : ''}\n`;
    });

    return txt;
}

export function exportBreakdownToTxt() {
    const index = parseInt(dom.breakdownModal.dataset.currentIndex);
    if (isNaN(index)) return;
    
    const specialty = appState.specialties[index];
    const txt = generateBreakdownTXT(index);
    const blob = new Blob([`\uFEFF${txt}`], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a');
    const safeSpecialtyName = specialty.name.replace(/\s+/g, '_');
    a.download = generateFilename('txt', `Справка_${safeSpecialtyName}`);
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
}

export function printBreakdown() {
    const index = parseInt(dom.breakdownModal.dataset.currentIndex);
    if (isNaN(index)) return;

    const specialtyName = appState.specialties[index].name;
    const title = `Справка за: ${specialtyName}`;
    
    const contentHTML = dom.modalSpecialtyName.innerHTML + '<table>' + dom.breakdownModalBody.innerHTML + '</table>';

    generatePrintAndExport(contentHTML, title);
}


export function showPaymentModal(index) {
    const specialty = appState.specialties[index];
    const data = calculateRowData(specialty);
    
    dom.paymentModal.dataset.currentIndex = index;
    dom.paymentModalTitle.textContent = `Плащания за: ${specialty.name}`;
    dom.paymentModalTotal.innerHTML = formatCurrencyForSummary(data.calc_sum_bgn);
    dom.paymentModalPaid.innerHTML = formatCurrencyForSummary(data.totalPaidBGN);
    dom.paymentModalRemaining.innerHTML = formatCurrencyForSummary(data.remaining_bgn);
    
    let stagesHTML = '';
    specialty.payments.forEach((p, pIdx) => {
        let amount = (appState.currencyMode === 'eur') ? ((p.amount || 0) / BGN_TO_EUR) : (p.amount || 0);
        const euroInfo = appState.currencyMode === 'bgn_eur' ? `<small class="info-display">(${(parseFloat(amount) || 0 / BGN_TO_EUR).toFixed(2)} €)</small>` : '';
        stagesHTML += `<div class="payment-stage"><label>${p.label}</label><div class="input-wrapper"><input type="number" step="0.01" value="${amount.toFixed(2)}" data-p-idx="${pIdx}" data-p-field="amount">${euroInfo}</div><input type="date" value="${p.date || ''}" data-p-idx="${pIdx}" data-p-field="date"><input type="text" value="${p.note || ''}" data-p-idx="${pIdx}" data-p-field="note" placeholder="Бележка..."></div>`;
    });
    
    dom.paymentStagesContainer.innerHTML = stagesHTML;
    dom.paymentModal.style.display = 'block';
}

export function savePayments() {
    const index = parseInt(dom.paymentModal.dataset.currentIndex);
    if (isNaN(index)) return;
    
    dom.paymentModal.querySelectorAll('[data-p-idx]').forEach(input => {
        const p_idx = parseInt(input.dataset.pIdx);
        const field = input.dataset.pField;
        
        if (field === 'amount') {
            let amount = parseFloat(input.value) || 0;
            if (appState.currencyMode === 'eur') {
                amount *= BGN_TO_EUR;
            }
            appState.specialties[index].payments[p_idx][field] = amount;
        } else {
            appState.specialties[index].payments[p_idx][field] = input.value;
        }
    });
    
    dom.paymentModal.style.display = 'none';
    saveState();
}

export function showContractorModal(index) {
    const specialty = appState.specialties[index];
    dom.contractorModal.dataset.currentIndex = index;
    dom.contractorModalTitle.textContent = `Изпълнител за: ${specialty.name}`;
    
    const name = specialty.contractorName || '';
    const details = appState.contractors[name] || { email: '', phone: '' };
    
    dom.contractorName.value = name;
    dom.contractorEmail.value = details.email;
    dom.contractorPhone.value = details.phone;
    
    dom.existingContractors.innerHTML = Object.keys(appState.contractors).map(n => `<option value="${n}"></option>`).join('');
    dom.contractorModal.style.display = 'block';
}

export function saveContractor() {
    const index = parseInt(dom.contractorModal.dataset.currentIndex);
    if (isNaN(index)) return;
    
    const name = dom.contractorName.value.trim();
    appState.specialties[index].contractorName = name;
    
    if (name) {
        appState.contractors[name] = {
            email: dom.contractorEmail.value.trim(),
            phone: dom.contractorPhone.value.trim()
        };
    }
    
    dom.contractorModal.style.display = 'none';
    saveState();
}

export function removeContractor() {
    const index = parseInt(dom.contractorModal.dataset.currentIndex);
    if (isNaN(index)) return;
    
    appState.specialties[index].contractorName = '';
    
    dom.contractorModal.style.display = 'none';
    saveState();
}

function setupNoteList(listEl, type) {
    let getNotes = (type === 'project') 
        ? () => appState.projectNotes 
        : () => {
            const i = parseInt(dom.noteModal.dataset.currentIndex);
            if(isNaN(i) || !appState.specialties[i]) return [];
            if(!appState.specialties[i].notes) appState.specialties[i].notes=[];
            return appState.specialties[i].notes;
        };

    const render = () => {
        const notes = getNotes();
        notes.sort((a, b) => a.completed - b.completed);
        listEl.innerHTML = '';
        notes.forEach((n, i) => {
            const li = document.createElement('li');
            li.className = n.completed ? 'completed' : '';
            li.draggable = true;
            li.dataset.noteIndex = i;
            li.innerHTML = `<span class="drag-handle-note">☰</span><span class="note-number">${i + 1}.</span><input type="checkbox" ${n.completed ? 'checked' : ''}><span class="note-text-label">${n.text}</span><button class="delete-note-btn">&times;</button>`;
            listEl.appendChild(li);
        });
    };
    
    listEl.renderNotes = render;

    listEl.addEventListener('change', e => {
        if (e.target.type === 'checkbox') {
            getNotes()[parseInt(e.target.closest('li').dataset.noteIndex)].completed = e.target.checked;
            render();
            saveState();
        }
    });

    listEl.addEventListener('click', e => {
        if (e.target.classList.contains('delete-note-btn')) {
            getNotes().splice(parseInt(e.target.closest('li').dataset.noteIndex), 1);
            render();
            saveState();
        } else if (e.target.classList.contains('note-text-label')) {
            const label = e.target;
            const index = parseInt(label.closest('li').dataset.noteIndex);
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'note-edit-input';
            input.value = getNotes()[index].text;
            label.replaceWith(input);
            input.focus();
            
            const saveNote = () => {
                const newText = input.value.trim();
                if (newText) {
                    getNotes()[index].text = newText;
                }
                render();
                saveState();
            };
            
            input.addEventListener('blur', saveNote);
            input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
        }
    });

    let draggedNote = null;
    listEl.addEventListener('dragstart', e => { if(e.target.tagName === 'LI') { draggedNote = e.target; setTimeout(() => draggedNote.classList.add('dragging'), 0); }});
    listEl.addEventListener('dragover', e => { e.preventDefault(); const target = e.target.closest('li'); if (target && target !== draggedNote) { listEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); target.classList.add('drag-over'); }});
    listEl.addEventListener('dragleave', e => e.target.closest('li')?.classList.remove('drag-over'));
    listEl.addEventListener('drop', e => {
        e.preventDefault();
        listEl.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        const target = e.target.closest('li');
        if (target && draggedNote) {
            const fromIndex = parseInt(draggedNote.dataset.noteIndex);
            const toIndex = parseInt(target.dataset.noteIndex);
            const item = getNotes().splice(fromIndex, 1)[0];
            getNotes().splice(toIndex, 0, item);
            render();
            saveState();
        }
    });
    listEl.addEventListener('dragend', () => { draggedNote?.classList.remove('dragging'); draggedNote = null; });
}

export function showNoteModal(index) {
    dom.noteModal.dataset.currentIndex = index;
    dom.noteModalTitle.textContent = `Бележки за: ${appState.specialties[index].name}`;
    dom.noteList.renderNotes();
    dom.newNoteInput.value = '';
    dom.noteModal.style.display = 'block';
    dom.newNoteInput.focus();
}

export function addNote() {
    const index = parseInt(dom.noteModal.dataset.currentIndex);
    const text = dom.newNoteInput.value.trim();
    if (text) {
        if (!appState.specialties[index].notes) {
            appState.specialties[index].notes = [];
        }
        appState.specialties[index].notes.push({ text: text, completed: false });
        dom.noteList.renderNotes();
        saveState();
        dom.newNoteInput.value = '';
        dom.newNoteInput.focus();
    }
}

export function showProjectNoteModal() {
    dom.projectNoteList.renderNotes();
    dom.newProjectNoteInput.value = '';
    dom.projectNoteModal.style.display = 'block';
    dom.newProjectNoteInput.focus();
}

export function addProjectNote() {
    const text = dom.newProjectNoteInput.value.trim();
    if (text) {
        appState.projectNotes.push({ text: text, completed: false });
        dom.projectNoteList.renderNotes();
        saveState();
        dom.newProjectNoteInput.value = '';
        dom.newProjectNoteInput.focus();
    }
}

export function initializeNoteModals() {
    setupNoteList(dom.noteList, 'specialty');
    setupNoteList(dom.projectNoteList, 'project');
}

function generateNoteReportContent(index) {
    if (isNaN(index)) return null;
    const specialty = appState.specialties[index];
    if (!specialty) return null;

    const title = `Бележки за: ${specialty.name}`;
    let html = `<h3>${title}</h3><h4>Проект: ${appState.projectName || 'Неозаглавен'}</h4>`;
    let txt = `СПРАВКА ПО БЕЛЕЖКИ\nСпециалност: ${specialty.name}\nПроект: ${appState.projectName || 'Неозаглавен'}\n==========================\n`;

    if (specialty.notes && specialty.notes.length > 0) {
        html += '<ul>';
        specialty.notes.forEach(n => {
            html += `<li class="${n.completed ? 'completed' : ''}">${n.text}</li>`;
            txt += `  - [${n.completed ? 'X' : ' '}] ${n.text}\n`;
        });
        html += '</ul>';
    } else {
        const noNotesMsg = 'Няма въведени бележки за тази специалност.';
        html += `<p>${noNotesMsg}</p>`;
        txt += `\n${noNotesMsg}`;
    }
    
    return { html, txt, title, specialtyName: specialty.name };
}

export function printSpecialtyNotes() {
    const index = parseInt(dom.noteModal.dataset.currentIndex);
    const content = generateNoteReportContent(index);
    if (content) {
        generatePrintAndExport(content.html, content.title);
    }
}

export function exportSpecialtyNotesToTxt() {
    const index = parseInt(dom.noteModal.dataset.currentIndex);
    const content = generateNoteReportContent(index);
    if (content) {
        const blob = new Blob([`\uFEFF${content.txt}`], { type: 'text/plain;charset=utf-8;' });
        const a = document.createElement('a');
        const safeSpecialtyName = content.specialtyName.replace(/\s+/g, '_');
        a.download = generateFilename('txt', `Бележки_${safeSpecialtyName}`);
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
    }
}