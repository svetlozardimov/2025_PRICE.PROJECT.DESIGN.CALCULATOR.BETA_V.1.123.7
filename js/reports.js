import dom from './dom.js';
import { appState, currentReport, setCurrentReport } from './state.js';
import { calculateRowData, formatCurrencyForTotals, generatePrintAndExport, generateFilename } from './utils.js';

// --- REPORTING LOGIC ---
function showReportModal(title, htmlGenerator, textGenerator, filename) {
    setCurrentReport({ htmlGenerator, textGenerator, filename });
    dom.reportModalTitle.textContent = title;
    dom.reportModalBody.innerHTML = htmlGenerator();
    dom.reportModal.style.display = 'block';
}

export function exportReportToTxt() {
    const txt = currentReport.textGenerator();
    const blob = new Blob([`\uFEFF${txt}`], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a');
    a.download = generateFilename('txt', currentReport.filename);
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
}

export function printReport() {
    generatePrintAndExport(dom.reportModalBody.innerHTML, dom.reportModalTitle.textContent);
}

// --- Contacts Report ---
const generateContactsHTML = () => {
    const contractors = {};
    appState.specialties.forEach(s => {
        const name = s.contractorName;
        if (name && appState.contractors[name]) {
            if (!contractors[name]) {
                contractors[name] = { details: appState.contractors[name], specialties: [] };
            }
            contractors[name].specialties.push(s.name);
        }
    });

    let html = '<table class="modal-report-table"><thead><tr><th>Изпълнител</th><th>Имейл</th><th>Телефон</th><th>Специалност(и)</th></tr></thead><tbody>';
    if (Object.keys(contractors).length === 0) {
        html += '<tr><td colspan="4" style="text-align:center">Няма въведени изпълнители.</td></tr>';
    } else {
        for (const name in contractors) {
            html += `<tr><td>${name}</td><td>${contractors[name].details.email || 'Няма'}</td><td>${contractors[name].details.phone || 'Няма'}</td><td>${contractors[name].specialties.join(', ')}</td></tr>`;
        }
    }
    return html + '</tbody></table>';
};

const generateContactsTXT = () => {
    let txt = `Списък с контакти: ${appState.projectName || "Проект"}\n==========================\n\n`;
    const contractors = {};
    appState.specialties.forEach(s => {
        if (s.contractorName && appState.contractors[s.contractorName]) {
            if (!contractors[s.contractorName]) {
                contractors[s.contractorName] = { details: appState.contractors[s.contractorName], specialties: [] };
            }
            contractors[s.contractorName].specialties.push(s.name);
        }
    });
    for (const name in contractors) {
        txt += `ИЗПЪЛНИТЕЛ: ${name}\n  - Имейл: ${contractors[name].details.email || 'Няма'}\n  - Телефон: ${contractors[name].details.phone || 'Няма'}\n  - Специалности: ${contractors[name].specialties.join(', ')}\n\n`;
    }
    return txt;
};

export const showContactsReport = () => showReportModal('Списък с контакти', generateContactsHTML, generateContactsTXT, 'Контакти');


// --- Summary Report ---
const generateSummaryHTML = () => {
    let html = `<h3>Проект: ${appState.projectName || 'Неозаглавен'}</h3><h4>Етап: ${appState.projectPhase}</h4>`;
    let total = 0;
    appState.specialties.forEach(s => {
        const data = calculateRowData(s);
        total += data.calc_sum_bgn;
        html += `<h4 style="border-top:2px solid #ccc;padding-top:15px;">${s.name}</h4><p style="color:#888;margin:0">Изпълнител: ${s.contractorName || 'Невъведен'}</p><table class="modal-breakdown-table"><tr><td>Изчисление:</td><td>${s.type === 'sqm' ? `${(parseFloat(appState.area) || 0).toFixed(2)} м² x ${(s.value || 0).toFixed(2)} лв/м²` : "Твърда сума"}</td></tr><tr><td>Дължимо:</td><td>${formatCurrencyForTotals(data.calc_sum_bgn)}</td></tr><tr><td>Платено:</td><td>${formatCurrencyForTotals(data.totalPaidBGN)}</td></tr><tr><td><b>Остатък:</b></td><td><b>${formatCurrencyForTotals(data.remaining_bgn)}</b></td></tr><tr><td colspan="2" style="text-align:center;background-color:#f2f5f8;padding:5px"><b>Плащания</b></td></tr>`;
        s.payments.forEach(p => { html += `<tr><td>${p.label || 'Етап'} (${p.date || 'няма дата'}):</td><td>${formatCurrencyForTotals(p.amount || 0)} ${p.note ? `(${p.note})` : ''}</td></tr>` });
        html += '</table>';
    });
    html += `<h3 style="text-align:right;border-top:2px solid #333;padding-top:10px">ОБЩО: ${formatCurrencyForTotals(total)}</h3>`;
    return html;
};

const generateSummaryTXT = () => {
    let txt = `ОБЩА СПРАВКА\nПроект: ${appState.projectName || 'Неозаглавен'}\nЕтап: ${appState.projectPhase}\n==========================\n`;
    let total = 0;
    appState.specialties.forEach(s => {
        const data = calculateRowData(s);
        total += data.calc_sum_bgn;
        txt += `\n-- ${s.name} --\nИзпълнител: ${s.contractorName || 'Невъведен'}\n  - Дължимо: ${data.calc_sum_bgn.toFixed(2)} лв\n  - Платено: ${data.totalPaidBGN.toFixed(2)} лв\n  - Остатък: ${data.remaining_bgn.toFixed(2)} лв\n`;
    });
    txt += `\n==========================\nОБЩО: ${total.toFixed(2)} лв`;
    return txt;
};

export const showSummaryReport = () => showReportModal('Обща справка', generateSummaryHTML, generateSummaryTXT, 'Детайлна_Справка');


// --- Notes Report ---
const generateNotesHTML = () => {
    let html = `<h3>Справка по бележки</h3><h4>Проект: ${appState.projectName || 'Неозаглавен'}</h4>`;
    let hasNotes = false;
    if (appState.projectNotes && appState.projectNotes.length > 0) {
        hasNotes = true;
        html += '<h4>Общи бележки</h4><ul>';
        appState.projectNotes.forEach(n => { html += `<li class="${n.completed ? 'completed' : ''}">${n.text}</li>` });
        html += '</ul>'
    }
    appState.specialties.forEach(s => {
        if (s.notes && s.notes.length > 0) {
            hasNotes = true;
            html += `<h4>Бележки за: ${s.name}</h4><ul>`;
            s.notes.forEach(n => { html += `<li class="${n.completed ? 'completed' : ''}">${n.text}</li>` });
            html += '</ul>'
        }
    });
    if (!hasNotes) html += '<p>Няма въведени бележки.</p>';
    return html;
};

const generateNotesTXT = () => {
    let txt = `СПРАВКА ПО БЕЛЕЖКИ\nПроект: ${appState.projectName || 'Неозаглавен'}\n==========================\n`;
    if (appState.projectNotes && appState.projectNotes.length > 0) {
        txt += "\n-- Общи бележки --\n";
        appState.projectNotes.forEach(n => { txt += `  - [${n.completed ? 'X' : ' '}] ${n.text}\n` })
    }
    appState.specialties.forEach(s => {
        if (s.notes && s.notes.length > 0) {
            txt += `\n-- Бележки за: ${s.name} --\n`;
            s.notes.forEach(n => { txt += `  - [${n.completed ? 'X' : ' '}] ${n.text}\n` })
        }
    });
    return txt;
};

export const showNotesReport = () => showReportModal('Справка по бележки', generateNotesHTML, generateNotesTXT, 'Бележки');

// --- Project Notes Report ---
function generateProjectNotesHTML() {
    let html = `<h3>Общи бележки по проекта</h3><h4>Проект: ${appState.projectName || 'Неозаглавен'}</h4>`;
    if (appState.projectNotes && appState.projectNotes.length > 0) {
        html += '<ul>';
        appState.projectNotes.forEach(n => { html += `<li class="${n.completed ? 'completed' : ''}">${n.text}</li>` });
        html += '</ul>'
    } else {
        html += '<p>Няма въведени бележки.</p>';
    }
    return html;
}

function generateProjectNotesTXT() {
    let txt = `ОБЩИ БЕЛЕЖКИ ПО ПРОЕКТА\nПроект: ${appState.projectName || 'Неозаглавен'}\n==========================\n`;
    if (appState.projectNotes && appState.projectNotes.length > 0) {
        appState.projectNotes.forEach(n => { txt += `\n  - [${n.completed ? 'X' : ' '}] ${n.text}` })
    } else {
        txt += "\nНяма въведени бележки.";
    }
    return txt;
}

export function printProjectNotes() {
    const html = generateProjectNotesHTML();
    generatePrintAndExport(html, "Общи бележки по проекта");
}

export function exportProjectNotesToTxt() {
    const txt = generateProjectNotesTXT();
    const blob = new Blob([`\uFEFF${txt}`], { type: 'text/plain;charset=utf-8;' });
    const a = document.createElement('a');
    a.download = generateFilename('txt', 'Общи_бележки');
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
}