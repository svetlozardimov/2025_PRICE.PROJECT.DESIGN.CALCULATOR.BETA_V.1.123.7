import { appState } from './state.js';
import { BGN_TO_EUR } from './config.js';
import dom from './dom.js';

// --- НОВА ЦЕНТРАЛНА ФУНКЦИЯ ЗА ГЕНЕРИРАНЕ НА ИМЕНА НА ФАЙЛОВЕ ---
export function generateFilename(extension, suffix = '') {
    const now = new Date();
    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
    ].join('-');
    
    const time = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('-');

    const projectName = (appState.projectName || 'Проект').replace(/\s+/g, '_');
    
    let finalName = `${date}_${time}_${projectName}`;
    if (suffix) {
        finalName += `_${suffix}`;
    }
    
    return `${finalName}.${extension}`;
}

export function updateStatusNotification() {
    if (appState.isDirty) {
        const date = appState.lastModified ? new Date(appState.lastModified) : new Date();
        const dateString = date.toLocaleString('bg-BG');
        const message = `<strong>Внимание!</strong> Имате незапазени промени. Данните се пазят в локалната памет на браузъра (Последна промяна: ${dateString}).<br>Препоръчително е да запазите проекта във файл!`;
        showToast(message, 'danger');
    } else {
        const date = appState.lastModified ? new Date(appState.lastModified) : new Date();
        const dateString = date.toLocaleString('bg-BG');
        const fileName = appState.lastFileName || 'нов проект';
        const message = `<strong>Успешно!</strong> Данните са синхронизирани със файл: <strong>${fileName}</strong><br>(Последно запазване: ${dateString})`;
        showToast(message, 'success');
    }
}

export function showToast(message, type = 'danger') {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.innerHTML = message;
    toast.className = '';
    toast.classList.add('toast-' + type);
    toast.classList.add('show');
}

export function hideToast() {
    const toast = document.getElementById('toastNotification');
    if (toast) {
        toast.classList.remove('show');
    }
}

export function sanitizeSpecialties(specialties = []) {
    const defaultPaymentStages = [{ label: "Аванс", amount: 0, date: "", note: "" }, { label: "Междинно", amount: 0, date: "", note: "" }, { label: "Окончателно", amount: 0, date: "", note: "" }];
    
    return specialties.map(s => {
        const sanitized = { ...s };
        
        if (!sanitized.payments) {
            sanitized.payments = JSON.parse(JSON.stringify(defaultPaymentStages));
        }
        if (!sanitized.notes) {
            sanitized.notes = [];
        }
        if (!sanitized.status) {
            sanitized.status = 'not-started';
        }
        if (sanitized.contractorName === undefined) {
            sanitized.contractorName = "";
        }
        return sanitized;
    });
}

export const formatCurrency = (amount) => {
    const bgn = parseFloat(amount) || 0;
    const eur = bgn / BGN_TO_EUR;
    switch (appState.currencyMode) {
        case 'bgn_eur': return `${bgn.toFixed(2)} лв<br><span class="currency-secondary">(${eur.toFixed(2)} €)</span>`;
        case 'eur': return `${eur.toFixed(2)} €`;
        default: return `${bgn.toFixed(2)} лв`;
    }
};

export const formatCurrencyForTotals = (amount) => {
    const bgn = parseFloat(amount) || 0;
    const eur = bgn / BGN_TO_EUR;
    switch (appState.currencyMode) {
        case 'bgn_eur': return `${bgn.toFixed(2)} лв (${eur.toFixed(2)} €)`;
        case 'eur': return `${eur.toFixed(2)} €`;
        default: return `${bgn.toFixed(2)} лв`;
    }
};

export const formatCurrencyForSummary = (amount) => {
    const bgn = parseFloat(amount) || 0;
    const eur = bgn / BGN_TO_EUR;
    switch (appState.currencyMode) {
        case 'bgn_eur': return `${bgn.toFixed(2)} лв (${eur.toFixed(2)} €)`;
        case 'eur': return `${eur.toFixed(2)} €`;
        default: return `${bgn.toFixed(2)} лв`;
    }
};

export const updatePhaseButtonUI = (phase) => {
    dom.projectPhaseBtn.textContent = `Етап: ${phase}`;
};

export const updateLogoDisplay = (src) => {
    const logoWrapper = document.getElementById('logo-preview-wrapper');
    if (src) {
        dom.logoPreview.src = src;
        logoWrapper.style.display = 'block';
        dom.uploadLogoBtn.style.display = 'none';
        dom.removeLogoBtn.style.display = 'block';
    } else {
        dom.logoPreview.src = '';
        logoWrapper.style.display = 'none';
        dom.uploadLogoBtn.style.display = 'block';
        dom.removeLogoBtn.style.display = 'none';
    }
};

export const calculateRowData = (specialty) => {
    const valueInBGN = parseFloat(specialty.value) || 0;
    const area = parseFloat(appState.area) || 0; 
    
    const calculatedSumBGN = (specialty.type === "sqm") ? valueInBGN * area : valueInBGN;
    
    const totalPaidBGN = Array.isArray(specialty.payments) 
        ? specialty.payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)
        : 0;

    const remainingBGN = calculatedSumBGN - totalPaidBGN;
    
    const progress = calculatedSumBGN > 0 ? (totalPaidBGN / calculatedSumBGN) * 100 : (totalPaidBGN > 0 ? 100 : 0);
    
    return {
        valueBGN: valueInBGN,
        calc_sum_bgn: calculatedSumBGN,
        totalPaidBGN: totalPaidBGN,
        remaining_bgn: remainingBGN,
        progress: progress
    };
};

export function setupDragAndDrop(element, getArray, callback) {
    let dragged = null;
    element.addEventListener('dragstart', e => {
        if (e.target.classList.contains('drag-handle')) {
            dragged = e.target.closest('tr');
            setTimeout(() => dragged?.classList.add('dragging'), 0);
        }
    });
    element.addEventListener('dragover', e => {
        e.preventDefault();
        const targetRow = e.target.closest('tr');
        if (targetRow && targetRow !== dragged) {
            element.querySelectorAll('.drag-over').forEach(row => row.classList.remove('drag-over'));
            targetRow.classList.add('drag-over');
        }
    });
    element.addEventListener('dragleave', e => e.target.closest('tr')?.classList.remove('drag-over'));
    element.addEventListener('drop', e => {
        e.preventDefault();
        element.querySelectorAll('.drag-over').forEach(row => row.classList.remove('drag-over'));
        const targetRow = e.target.closest('tr');
        if (targetRow && dragged) {
            const array = getArray();
            const fromIndex = parseInt(dragged.dataset.index);
            const toIndex = parseInt(targetRow.dataset.index);
            if (fromIndex !== toIndex) {
                const item = array.splice(fromIndex, 1)[0]; 
                array.splice(toIndex, 0, item);
                if (callback) callback();
            }
        }
    });
    element.addEventListener('dragend', () => dragged?.classList.remove('dragging'));
}

export function generatePrintAndExport(html, title) {
    const printWindow = window.open('', '', 'height=800,width=1000');
    const copyrightNotice = document.getElementById('copyright-notice').innerHTML;
    const footerHTML = `<footer style="text-align:center; margin-top:30px; font-size:9pt; color:#999;">${copyrightNotice}</footer>`;

    printWindow.document.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{border:1px solid #ccc;padding:8px;text-align:left}h3,h4{margin:15px 0 5px 0;page-break-after:avoid}ul{padding-left:20px}li.completed{text-decoration:line-through;color:#888}</style></head><body>${html}${footerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}