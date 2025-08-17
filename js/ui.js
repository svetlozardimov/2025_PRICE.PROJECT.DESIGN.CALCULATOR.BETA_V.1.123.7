import dom from './dom.js';
import { appState } from './state.js';
import { BGN_TO_EUR, LOCKED_SPECIALTIES } from './config.js';
import { calculateRowData, formatCurrency, formatCurrencyForTotals, updatePhaseButtonUI, updateLogoDisplay } from './utils.js';

// --- MAIN RENDER FUNCTIONS ---
export function renderAll() {
    // Прилагаме темата
    document.body.className = appState.theme || 'theme-light';

    Object.keys(dom).forEach(key => {
        if (appState.hasOwnProperty(key) && dom[key] && typeof dom[key].value !== 'undefined') {
            const element = dom[key];
            if (element.type === 'checkbox') {
                element.checked = appState[key];
            } else if (element.tagName !== 'BUTTON') {
                element.value = appState[key];
            }
        }
    });
    
    dom.filterActiveOnly.checked = appState.filters.activeOnly;
    dom.filterUnfinishedOnly.checked = appState.filters.unfinishedOnly;
    
    updatePhaseButtonUI(appState.projectPhase);
    updateLogoDisplay(appState.logoSrc);
    
    dom.bonusOptions.style.display = appState.bonusCheck ? 'block' : 'none';
    
    renderTableHead();
    renderTableBody();
    renderTotals();
}

function renderTableHead() {
    let headHTML = `<tr>
        <th class="no-print" style="width: 35px;" title="Влачете, за да пренаредите">☰</th>
        <th style="width: 220px; text-align: left;">Специалност / Изпълнител</th>
        <th style="width: 120px;">Тип сума</th>
        <th style="min-width: 120px;">Цена на м² (${appState.currencyMode === 'eur' ? '€' : 'лв'})</th>
        <th style="min-width: 135px;">Твърда сума (${appState.currencyMode === 'eur' ? '€' : 'лв'})</th>
        <th style="min-width: 115px;">Изчислена сума</th>`;
    if (appState.showAdvanceCheck) {
        headHTML += `<th style="min-width: 110px;">Платено</th><th style="min-width: 115px;">Остатък</th>`;
    }
    headHTML += `<th style="width: 60px;" title="Маркирайте, когато е платено изцяло и архивирано">✓</th><th class="no-print" style="width: 70px;">...</th></tr>`;
    dom.tableHead.innerHTML = headHTML;
}

function renderTableBody() {
    let bodyHTML = "";
    appState.specialties.forEach((s, idx) => {
        const data = calculateRowData(s);

        if (appState.filters.activeOnly && s.isPaid) { return; }
        if (appState.filters.unfinishedOnly && s.status === 'completed') { return; }

        let valueForInput = (appState.currencyMode === 'eur') ? ((parseFloat(s.value) || 0) / BGN_TO_EUR) : (s.value || 0);
        
        const euroInfo = appState.currencyMode === 'bgn_eur' ? `<small class="info-display">(${(parseFloat(valueForInput) / BGN_TO_EUR).toFixed(2)} €)</small>` : '';
        let fixedSumInfo = euroInfo;
        if (s.type === 'fixed' && appState.area > 0) {
            const equivalentSqmPrice = data.calc_sum_bgn / appState.area;
            fixedSumInfo += `<small class="info-display">(Екв: ${equivalentSqmPrice.toFixed(2)} лв/м²)</small>`;
        }
        
        const notesIndicator = s.notes && s.notes.some(n => !n.completed) ? ' 📝' : ' 🗒️';

        const isLocked = LOCKED_SPECIALTIES.includes(s.name);
        const nameElementHTML = isLocked 
            ? `<span class="specialty-name-locked">${s.name}</span>`
            : `<input type="text" class="specialty-name-input" value="${s.name}" data-idx="${idx}" data-field="name">`;

        bodyHTML += `
            <tr data-index="${idx}" class="${s.isPaid ? 'paid-row' : ''}">
                <td draggable="true" class="row-number no-print drag-handle" title="Влачете, за да пренаредите">${idx + 1}</td>
                <td class="specialty-name-cell">
                    <div class="specialty-name-wrapper">
                        <span class="status-indicator status-${s.status}" data-idx="${idx}" data-action="toggle-status" title="Кликнете, за да смените статуса (Незапочнат / В процес / Завършен)"></span>
                        ${nameElementHTML}
                    </div>
                    ${s.contractorName ? `<div class="specialty-contractor-name">${s.contractorName}</div>` : ''}
                </td>
                <td><button class="type-toggle-btn" data-idx="${idx}" data-action="toggle-type" title="Превключи между цена на м² и твърда сума">${s.type === 'sqm' ? 'на м²' : 'твърда'}</button></td>
                <td>${s.type === "sqm" ? `<div class="input-wrapper"><input type="number" step="0.01" value="${Number(valueForInput).toFixed(2)}" data-idx="${idx}" data-field="value" min="0">${euroInfo}</div>` : ""}</td>
                <td>${s.type === "fixed" ? `<div class="input-wrapper"><input type="number" step="0.01" value="${Number(valueForInput).toFixed(2)}" data-idx="${idx}" data-field="value" min="0">${fixedSumInfo}</div>` : ""}</td>
                <td style="line-height: 1.3;">${formatCurrency(data.calc_sum_bgn)}</td>
                ${appState.showAdvanceCheck ? `
                    <td class="payment-cell" data-idx="${idx}" style="line-height: 1.3;" title="Кликнете, за да редактирате плащанията">
                        <div class="progress-bar-container"><div class="progress-bar-inner" style="width: ${Math.min(data.progress, 100)}%;"></div></div>
                        <div class="payment-info"><span>${formatCurrency(data.totalPaidBGN)}</span><span class="payment-icon">✏️</span></div>
                    </td>
                    <td style="line-height: 1.3;">${formatCurrency(data.remaining_bgn)}</td>` : ''}
                <td style="text-align: center;"><input type="checkbox" ${s.isPaid ? 'checked' : ''} data-idx="${idx}" data-field="isPaid" title="Маркирайте, когато е платено изцяло и архивирано"></td>
                <td class="no-print actions-cell">
                    <button class="menu-toggle-btn" data-idx="${idx}" data-action="toggle-menu" title="Отворете менюто с действия за този ред">...</button>
                    <div class="actions-dropdown">
                        <a href="#" data-idx="${idx}" data-action="breakdown">Справка 📊</a>
                        <a href="#" data-idx="${idx}" data-action="note">Бележки${notesIndicator}</a>
                        <a href="#" data-idx="${idx}" data-action="assign-contractor">Изпълнител 👤</a>
                        ${!isLocked ? `<a href="#" data-idx="${idx}" data-action="duplicate">Дублирай 📄</a><a href="#" class="delete-link" data-idx="${idx}" data-action="delete">Изтрий 🗑️</a>` : ''}
                    </div>
                </td>
            </tr>`;
    });
    dom.rows.innerHTML = bodyHTML;
}

function renderTotals() {
    let baseTotal = 0, paidTotal = 0, baseRemaining = 0;
    appState.specialties.forEach(s => {
        const data = calculateRowData(s);
        baseTotal += data.calc_sum_bgn;
        if (s.isPaid) {
            paidTotal += data.calc_sum_bgn;
        } else {
            paidTotal += data.totalPaidBGN;
            baseRemaining += data.remaining_bgn;
        }
    });

    let bonusAmount = 0, totalWithBonus = baseTotal, bonusRemaining = 0;
    if (appState.bonusCheck && appState.bonusPercent > 0) {
        bonusAmount = baseTotal * (appState.bonusPercent / 100);
        totalWithBonus = baseTotal + bonusAmount;
        if (appState.bonusIsPaidCheck) {
            paidTotal += bonusAmount;
        } else {
            bonusRemaining = bonusAmount;
        }
    }
    
    const finalRemaining = baseRemaining + bonusRemaining;
    const pricePerSqmBase = appState.area > 0 ? baseTotal / appState.area : 0;
    const pricePerSqmBonus = appState.area > 0 ? totalWithBonus / appState.area : 0;
    
    let html = `<div class="big price">Цена на м²: ${formatCurrencyForTotals(pricePerSqmBase)}/м²</div>`;
    html += `<div class="big sum">Общо по проект: ${formatCurrencyForTotals(baseTotal)}</div>`;
    
    if (appState.bonusCheck && appState.bonusPercent > 0) {
        html += `<div class="big bonus">Цена на м² с бонус ${appState.bonusPercent}%: ${formatCurrencyForTotals(pricePerSqmBonus)}/м²</div>`;
        html += `<div class="big bonus">Общо с бонус ${appState.bonusPercent}%: ${formatCurrencyForTotals(totalWithBonus)}</div>`;
    }
    
    if (appState.showAdvanceCheck) {
        html += `<hr><div class="big paid-total">Общо платени суми: ${formatCurrencyForTotals(paidTotal)}</div>`;
        html += `<div class="big remaining">Общо остатък: ${formatCurrencyForTotals(finalRemaining)}</div>`;
    }
    
    html += `<p class="vat-disclaimer">Всички цени са без ДДС.</p>`;
    dom.totals.innerHTML = html;
}

export function handlePrint() {
    document.getElementById("printVazlozhitel").textContent = appState.vazlozhitel || 'Невъведен';
    document.getElementById("printIzpalnitel").textContent = appState.izpalnitel || 'Невъведен';
    document.getElementById("printProjectPhase").textContent = `Етап: ${appState.projectPhase}`;
    const printLogo = document.getElementById("printLogo");
    if (appState.logoSrc) {
        printLogo.src = appState.logoSrc;
        printLogo.style.display = 'block';
    } else {
        printLogo.style.display = 'none';
    }
    document.getElementById("printProjectName").textContent = appState.projectName || "Неозаглавен обект";
    document.getElementById("printProjectArea").textContent = `РЗП: ${(parseFloat(appState.area) || 0).toFixed(2)} м²`;
    const originalTitle = document.title;
    document.title = "";
    window.print();
    document.title = originalTitle;
}