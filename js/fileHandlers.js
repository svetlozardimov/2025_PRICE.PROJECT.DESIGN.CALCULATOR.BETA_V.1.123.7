import { appState, saveState, updateAppState } from './state.js';
import { defaultState } from './config.js';
import { renderAll } from './ui.js';
import { calculateRowData, updateLogoDisplay, sanitizeSpecialties, updateStatusNotification, generateFilename } from './utils.js';

// --- FILE OPERATIONS ---
export function handleFileExport() {
    appState.isDirty = false;
    appState.lastFileName = generateFilename('json');
    appState.lastModified = new Date().toISOString();
    
    const data = JSON.stringify(appState, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement('a');
    a.download = appState.lastFileName;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);

    updateStatusNotification();
}

export function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        try {
            const importedData = JSON.parse(event.target.result);
            
            if (importedData.specialties) {
                importedData.specialties = sanitizeSpecialties(importedData.specialties);
            }
            
            const finalState = Object.assign({}, defaultState, importedData);
            updateAppState(finalState);

            appState.isDirty = false;
            appState.lastFileName = file.name;
            
            renderAll();
            saveState(); 
            
            appState.isDirty = false; 
            updateStatusNotification(); 

        } catch(err) {
            alert("Грешка: Невалиден файл или проблем с данните. " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

export function handleTemplateSave() {
    const template = { specialties: appState.specialties, contractors: appState.contractors };
    const data = JSON.stringify(template, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement('a');
    a.download = generateFilename('json', 'Шаблон');
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
}

export function handleTemplateLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data.specialties)) throw new Error("Невалиден шаблон.");
            if (confirm(`Сигурни ли сте? Това ще замени текущите специалности и изпълнители.`)) {
                
                appState.specialties = sanitizeSpecialties(data.specialties);
                appState.contractors = data.contractors || {};

                renderAll();
                saveState();
            }
        } catch (err) {
            alert("Грешка: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

export function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = re => {
        appState.logoSrc = re.target.result;
        updateLogoDisplay(appState.logoSrc);
        saveState();
    };
    reader.readAsDataURL(file);
}

export function removeLogo() {
    appState.logoSrc = '';
    updateLogoDisplay('');
    saveState();
}

export function handleExportCsv() {
    let csvContent = "Специалност,Тип,Цена,Изчислена сума (BGN)";
    if (appState.showAdvanceCheck) {
        csvContent += ",Платено (BGN),Остатък (BGN)";
    }
    csvContent += "\r\n";

    appState.specialties.forEach(s => {
        const data = calculateRowData(s);
        let row = [s.name, s.type, s.value, data.calc_sum_bgn];
        if (appState.showAdvanceCheck) {
            row.push(data.totalPaidBGN, data.remaining_bgn);
        }
        csvContent += `"${row.join('","')}"\r\n`;
    });

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", generateFilename('csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function handleExportTxt() {
    let txtContent = `СПРАВКА ПО ПРОЕКТ\n`;
    txtContent += `==================================\n`;
    txtContent += `Проект: ${appState.projectName || 'Неозаглавен'}\n`;
    txtContent += `Възложител: ${appState.vazlozhitel || 'Невъведен'}\n`;
    txtContent += `Изпълнител: ${appState.izpalnitel || 'Невъведен'}\n`;
    txtContent += `РЗП: ${(parseFloat(appState.area) || 0).toFixed(2)} м²\n\n`;

    appState.specialties.forEach((s, index) => {
        const data = calculateRowData(s);
        txtContent += `--- ${index + 1}. ${s.name} ---\n`;
        txtContent += `  Тип: ${s.type === 'sqm' ? 'на м²' : 'твърда сума'}\n`;
        txtContent += `  Цена: ${parseFloat(s.value).toFixed(2)}\n`;
        txtContent += `  Изчислена сума: ${data.calc_sum_bgn.toFixed(2)} лв\n`;
        if (appState.showAdvanceCheck) {
            txtContent += `  Платено: ${data.totalPaidBGN.toFixed(2)} лв\n`;
            txtContent += `  Остатък: ${data.remaining_bgn.toFixed(2)} лв\n`;
        }
        txtContent += `\n`;
    });

    let baseTotal = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    appState.specialties.forEach(s => {
        const data = calculateRowData(s);
        baseTotal += data.calc_sum_bgn;
        if (s.isPaid) {
            totalPaid += data.calc_sum_bgn;
        } else {
            totalPaid += data.totalPaidBGN;
            totalRemaining += data.remaining_bgn;
        }
    });

    txtContent += `==================================\n`;
    txtContent += `ОБОБЩЕНИЕ\n`;
    txtContent += `==================================\n`;
    txtContent += `Общо по проект: ${baseTotal.toFixed(2)} лв\n`;
    
    if (appState.showAdvanceCheck) {
         txtContent += `Общо платени суми: ${totalPaid.toFixed(2)} лв\n`;
         txtContent += `Общо остатък: ${totalRemaining.toFixed(2)} лв\n`;
    }
    
    if (appState.bonusCheck && appState.bonusPercent > 0) {
        const bonusAmount = baseTotal * (appState.bonusPercent / 100);
        const totalWithBonus = baseTotal + bonusAmount;
        txtContent += `Бонус (${appState.bonusPercent}%): ${bonusAmount.toFixed(2)} лв\n`;
        txtContent += `ОБЩО С БОНУС: ${totalWithBonus.toFixed(2)} лв\n`;
    }

    const blob = new Blob([`\uFEFF${txtContent}`], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", generateFilename('txt', 'Справка'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}