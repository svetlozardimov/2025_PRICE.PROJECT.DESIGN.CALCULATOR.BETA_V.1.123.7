import { appState } from './state.js';
import { BGN_TO_EUR } from './config.js';
import { generatePrintAndExport, generateFilename } from './utils.js';

export const miniCalcHTML = `
    <div class="card !p-0 !shadow-none !m-0">
        <h1 class="text-xl font-bold mb-4">МИНИМАЛНА ЦЕНА НА ПРОЕКТИРАНЕ ПО ЧАСТ КОНСТРУКТИВНА</h1>
        
        <div class="input-group">
            <label class="input-label">Вид строителен проект</label>
            <select id="projectType" class="select-input"></select>
        </div>
        <div id="areaInput" class="input-group" style="display: none;">
            <label class="input-label">Площ (м²)</label>
            <input type="number" id="area" class="number-input" min="0" placeholder="Въведете площ">
        </div>
        
        <div id="wallSectionsGroup" class="input-group" style="display: none;">
            <div class="mb-4">
                <label class="input-label">Брой сечения</label>
                <input type="number" id="wallSections" class="number-input" min="1" value="1">
            </div>
            <div>
                <label class="input-label">Допълнителна дължина (м)</label>
                <input type="number" id="additionalLength" class="number-input" min="0" value="0">
            </div>
        </div>
        
        <div id="craneCheckbox" class="checkbox-group" style="display: none;">
            <input type="checkbox" id="hasCrane">
            <label>Добави 1,5 лв/м² за хале с кран</label>
        </div>
        
        <div id="complexityGroup" class="input-group">
            <div class="checkbox-group">
                <input type="checkbox" id="hasComplexity">
                <label>Добавка при сложна геометрия или терен</label>
            </div>
            <div id="complexityPercentageGroup" style="display: none;">
                <input type="number" id="complexityPercentage" class="number-input" min="0" max="100" placeholder="Процент добавка">
            </div>
        </div>

        <div class="checkbox-group">
            <input type="checkbox" id="includeSupervision">
            <label>Включи авторски надзор (15%)</label>
        </div>
        
        <div id="errorMessage" class="error-message" style="display: none;">
            ВЪВЕДИ СЪОТВЕТСТВАЩА НА КАТЕГОРИЯТА КВАДРАТУРА
        </div>

        <div class="price-summary">
            <div class="flex justify-between mb-2">
                <span>Базова цена:</span>
                <span id="basePrice" class="font-medium text-right">0.00 лв.</span>
            </div>
            <div id="supervisionPrice" class="flex justify-between mb-2" style="display: none;">
                <span>Авторски надзор:</span>
                <span id="supervisionPriceValue" class="font-medium text-right">0.00 лв.</span>
            </div>
            <div class="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Крайна цена:</span>
                <span id="totalPrice" class="text-right">0.00 лв.</span>
            </div>
            <div class="text-sm text-gray-500 mt-2">
                *Всички цени са без включен ДДС
            </div>
        </div>
    </div>
`;

export function initializeMiniCalc() {
    const modal = document.getElementById('miniCalcModal');
    if (!modal) return;

    const formatMiniCalcCurrency = (amount) => {
        const bgn = parseFloat(amount) || 0;
        const eur = bgn / BGN_TO_EUR;
        switch (appState.currencyMode) {
            case 'bgn_eur': return `${bgn.toFixed(2)} лв <span class="currency-secondary">(${eur.toFixed(2)} €)</span>`;
            case 'eur': return `${eur.toFixed(2)} €`;
            default: return `${bgn.toFixed(2)} лв`;
        }
    };

    const constructionTypes = {
        'I.1': { name: 'Становище само с текстова част (делба)', basePrice: 300, type: 'fixed' },
        'I.3': { name: 'Становище за фотоволтаични централи до 1 MWh', basePrice: 1800, type: 'fixed' },
        'II.1': { name: 'Еднофамилни жилищни сгради-стоманобетон (до 100 м²)', basePrice: 1500, type: 'fixed' },
        'II.2': { name: 'Еднофамилни жилищни сгради-стоманобетон (100-200 м²)', basePrice: 2000, type: 'fixed' },
        'II.3': { name: 'Еднофамилни жилищни сгради-стоманобетон (над 200 м²)', basePrice: 10, type: 'per_m2', minArea: 200 },
        'III.1': { name: 'Еднофамилни жилищни сгради-дървени/стоманени (до 100 м²)', basePrice: 2000, type: 'fixed' },
        'III.2': { name: 'Еднофамилни жилищни сгради-дървени/стоманени (100-200 м²)', basePrice: 2500, type: 'fixed' },
        'III.3': { name: 'Еднофамилни жилищни сгради-дървени/стоманени (над 200 м²)', basePrice: 12.5, type: 'per_m2', minArea: 200 },
        'IV.1': { name: 'Многофамилни жилищни сгради-стоманобетон (500-1000 м²)', basePrice: 9, type: 'per_m2', minArea: 500, maxArea: 1000 },
        'IV.2': { name: 'Многофамилни жилищни сгради-стоманобетон (1000-3000 м²)', basePrice: 8, type: 'per_m2', minArea: 1000, maxArea: 3000 },
        'IV.3': { name: 'Многофамилни жилищни сгради-стоманобетон (над 3000 м²)', basePrice: 7, type: 'per_m2', minArea: 3000 },
        'V.1': { name: 'Стоманени конструкции - складово хале (до 600 м²)', basePrice: 12, type: 'per_m2', maxArea: 600 },
        'V.2': { name: 'Стоманени конструкции - складово хале (600-1200 м²)', basePrice: 10, type: 'per_m2', minArea: 600, maxArea: 1200 },
        'V.3': { name: 'Стоманени конструкции - складово хале (над 1200 м²)', basePrice: 9, type: 'per_m2', minArea: 1200 },
        'VI.1': { name: 'Сглобяеми стоманобетонни - складово хале (до 1500 м²)', basePrice: 12, type: 'per_m2', maxArea: 1500 },
        'VI.2': { name: 'Сглобяеми стоманобетонни - складово хале (над 1500 м²)', basePrice: 10, type: 'per_m2', minArea: 1500 },
        'VII.1': { name: 'План за безопасност и здраве - Еднофамилни жилищни сгради', basePrice: 250, type: 'fixed' },
        'VII.2': { name: 'План за безопасност и здраве - Многофамилни жилищни сгради', basePrice: 400, type: 'fixed' },
        'VII.3': { name: 'План за безопасност и здраве - Събаряне на съществуващи сгради', basePrice: 600, type: 'fixed' },
        'VIII.1': { name: 'Обследване на съществуващи сгради - Пълно обследване', basePrice: 8, type: 'per_m2' },
        'X.1': { name: 'Подпорни стени - До 4м височина', basePrice: 500, type: 'retaining_wall' },
        'X.2': { name: 'Подпорни стени - Над 4м височина', basePrice: 1000, type: 'retaining_wall' }
    };

    const categoryNames = {
        'I': 'Становища', 'II': 'Еднофамилни жилищни сгради (стоманобетон)',
        'III': 'Еднофамилни жилищни сгради (дървени/стоманени)', 'IV': 'Многофамилни жилищни сгради',
        'V': 'Стоманени конструкции', 'VI': 'Сглобяеми стоманобетонни конструкции',
        'VII': 'План за безопасност и здраве', 'VIII': 'Обследване на съществуващи сгради',
        'X': 'Подпорни стени'
    };

    const select = modal.querySelector('#projectType');
    select.innerHTML = '<option value="">Изберете вид проект</option>';

    const groupedTypes = {};
    Object.entries(constructionTypes).forEach(([key, value]) => {
        const category = key.split('.')[0];
        if (!groupedTypes[category]) groupedTypes[category] = [];
        groupedTypes[category].push({ key, ...value });
    });

    Object.entries(groupedTypes).forEach(([category, types]) => {
        const group = document.createElement('optgroup');
        group.label = categoryNames[category] || category;
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.key;
            option.textContent = type.name;
            group.appendChild(option);
        });
        select.appendChild(group);
    });

    function calculatePriceDetails() {
        const details = {
            baseCalc: 0,
            craneAddition: 0,
            complexityAddition: 0,
            subTotal: 0,
            supervision: 0,
            total: 0
        };

        const selectedType = modal.querySelector('#projectType').value;
        const typeData = constructionTypes[selectedType];
        if (!typeData) return details;

        let area = parseFloat(modal.querySelector('#area').value) || 0;
        const errorMessage = modal.querySelector('#errorMessage');
        errorMessage.style.display = 'none';

        if (typeData.type === 'per_m2' && ((typeData.minArea && area < typeData.minArea) || (typeData.maxArea && area > typeData.maxArea))) {
            errorMessage.style.display = 'block';
            return details;
        }

        details.baseCalc = typeData.basePrice;
        if (typeData.type === 'per_m2') {
            details.baseCalc *= area;
        } else if (typeData.type === 'retaining_wall') {
            const wallSections = parseInt(modal.querySelector('#wallSections').value) || 1;
            const additionalLength = parseFloat(modal.querySelector('#additionalLength').value) || 0;
            details.baseCalc *= wallSections;
            details.baseCalc += details.baseCalc * 0.2 * Math.ceil(additionalLength / 10);
        }
        
        details.subTotal = details.baseCalc;

        if (modal.querySelector('#hasCrane').checked && (selectedType.startsWith('V') || selectedType.startsWith('VI'))) {
            details.craneAddition = area * 1.5;
            details.subTotal += details.craneAddition;
        }
        
        if (modal.querySelector('#hasComplexity').checked) {
            const complexityPercentage = parseFloat(modal.querySelector('#complexityPercentage').value) || 0;
            details.complexityAddition = details.subTotal * (complexityPercentage / 100);
            details.subTotal += details.complexityAddition;
        }

        if (modal.querySelector('#includeSupervision').checked) {
            details.supervision = details.subTotal * 0.15;
        }
        
        details.total = details.subTotal + details.supervision;
        return details;
    }

    function updatePrices() {
        const priceDetails = calculatePriceDetails();
        modal.querySelector('#basePrice').innerHTML = formatMiniCalcCurrency(priceDetails.subTotal);
        modal.querySelector('#supervisionPrice').style.display = priceDetails.supervision > 0 ? 'flex' : 'none';
        modal.querySelector('#supervisionPriceValue').innerHTML = formatMiniCalcCurrency(priceDetails.supervision);
        modal.querySelector('#totalPrice').innerHTML = formatMiniCalcCurrency(priceDetails.total);
    }
    
    function resetAndCalculate() {
        const selectedType = modal.querySelector('#projectType').value;
        const type = constructionTypes[selectedType];

        const showArea = type && (type.type === 'per_m2' || selectedType.startsWith('V') || selectedType.startsWith('VI'));
        modal.querySelector('#areaInput').style.display = showArea ? 'block' : 'none';

        modal.querySelector('#wallSectionsGroup').style.display = type?.type === 'retaining_wall' ? 'block' : 'none';
        modal.querySelector('#complexityGroup').style.display = !!type ? 'block' : 'none';
        
        const isCraneEligible = selectedType && (selectedType.startsWith('V') || selectedType.startsWith('VI'));
        modal.querySelector('#craneCheckbox').style.display = isCraneEligible ? 'flex' : 'none';

        modal.querySelector('#complexityPercentageGroup').style.display = modal.querySelector('#hasComplexity').checked ? 'block' : 'none';
        
        modal.querySelector('#errorMessage').style.display = 'none';

        updatePrices();
    }
    
    modal.querySelector('#projectType').addEventListener('change', resetAndCalculate);
    ['area', 'wallSections', 'additionalLength', 'complexityPercentage'].forEach(id => {
        modal.querySelector('#' + id).addEventListener('input', updatePrices);
    });
    ['hasCrane', 'hasComplexity', 'includeSupervision'].forEach(id => {
        modal.querySelector('#' + id).addEventListener('change', resetAndCalculate);
    });
    
    if (appState.miniCalcState) {
        const state = appState.miniCalcState;
        modal.querySelector('#projectType').value = state.projectType || '';
        modal.querySelector('#area').value = state.area || '';
        modal.querySelector('#wallSections').value = state.wallSections || 1;
        modal.querySelector('#additionalLength').value = state.additionalLength || 0;
        modal.querySelector('#hasCrane').checked = state.hasCrane || false;
        modal.querySelector('#hasComplexity').checked = state.hasComplexity || false;
        modal.querySelector('#complexityPercentage').value = state.complexityPercentage || '';
        modal.querySelector('#includeSupervision').checked = state.includeSupervision || false;
    }
    resetAndCalculate();

    function generateReportContent() {
        const selectedTypeKey = modal.querySelector('#projectType').value;
        const selectedTypeData = constructionTypes[selectedTypeKey];
        const projectName = selectedTypeData ? selectedTypeData.name : "Неизбран проект";
        const title = `Калкулация за: ${projectName}`;

        const area = parseFloat(modal.querySelector('#area').value) || 0;
        const wallSections = parseInt(modal.querySelector('#wallSections').value) || 1;
        const additionalLength = parseFloat(modal.querySelector('#additionalLength').value) || 0;
        const complexityPercentage = parseFloat(modal.querySelector('#complexityPercentage').value) || 0;

        const details = calculatePriceDetails();
        
        let html = `<h3>${title}</h3>`;
        let txt = `${title.toUpperCase()}\n==========================\n`;

        html += `<p><strong>Вид проект:</strong> ${projectName}</p>`;
        txt += `Вид проект: ${projectName}\n`;

        if (selectedTypeData) {
            if (selectedTypeData.type === 'per_m2') {
                html += `<p><strong>Изчисление:</strong> ${area.toFixed(2)} м² x ${selectedTypeData.basePrice.toFixed(2)} лв/м² = ${details.baseCalc.toFixed(2)} лв.</p>`;
                txt += `Изчисление: ${area.toFixed(2)} м² x ${selectedTypeData.basePrice.toFixed(2)} лв/м² = ${details.baseCalc.toFixed(2)} лв.\n`;
            } else if (selectedTypeData.type === 'retaining_wall') {
                html += `<p><strong>Изчисление:</strong> ${wallSections} сечения x ${selectedTypeData.basePrice.toFixed(2)} лв. + ${additionalLength}м доп. дължина = ${details.baseCalc.toFixed(2)} лв.</p>`;
                txt += `Изчисление: ${wallSections} сечения x ${selectedTypeData.basePrice.toFixed(2)} лв. + ${additionalLength}м доп. дължина = ${details.baseCalc.toFixed(2)} лв.\n`;
            } else {
                html += `<p><strong>Базова цена (твърда):</strong> ${details.baseCalc.toFixed(2)} лв.</p>`;
                txt += `Базова цена (твърда): ${details.baseCalc.toFixed(2)} лв.\n`;
            }
        }
        
        if (details.craneAddition > 0) {
            html += `<p><strong>+ Добавка за кран:</strong> ${details.craneAddition.toFixed(2)} лв.</p>`;
            txt += `+ Добавка за кран: ${details.craneAddition.toFixed(2)} лв.\n`;
        }
        if (details.complexityAddition > 0) {
            html += `<p><strong>+ Добавка за сложност (${complexityPercentage}%):</strong> ${details.complexityAddition.toFixed(2)} лв.</p>`;
            txt += `+ Добавка за сложност (${complexityPercentage}%): ${details.complexityAddition.toFixed(2)} лв.\n`;
        }

        html += `<hr><p><strong>Междинна сума:</strong> ${details.subTotal.toFixed(2)} лв.</p>`;
        txt += `--------------------------\nМеждинна сума: ${details.subTotal.toFixed(2)} лв.\n`;

        if (details.supervision > 0) {
            html += `<p><strong>+ Авторски надзор (15%):</strong> ${details.supervision.toFixed(2)} лв.</p>`;
            txt += `+ Авторски надзор (15%): ${details.supervision.toFixed(2)} лв.\n`;
        }

        html += `<h4 style="margin-top:15px;"><strong>Крайна цена: ${details.total.toFixed(2)} лв. (без ДДС)</strong></h4>`;
        txt += `\nКрайна цена: ${details.total.toFixed(2)} лв. (без ДДС)\n`;

        return { html, txt, title: projectName };
    }

    modal.querySelector('#printMiniCalcBtn').addEventListener('click', () => {
        const { html, title } = generateReportContent();
        generatePrintAndExport(html, `Калкулация - ${title}`);
    });

    modal.querySelector('#exportMiniCalcTxtBtn').addEventListener('click', () => {
        const { txt, title } = generateReportContent();
        const blob = new Blob([`\uFEFF${txt}`], { type: 'text/plain;charset=utf-8;' });
        const a = document.createElement('a');
        const safeTitle = title.replace(/\s/g, '_');
        a.download = generateFilename('txt', `Калкулация_СК_${safeTitle}`);
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
    });
}