if (typeof window.appData === 'undefined') {
    window.appData = loadData();
}

function loadData() {
    const saved = localStorage.getItem("haushaltsbuchData");
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultData));
}

function saveData() {
    localStorage.setItem("haushaltsbuchData", JSON.stringify(window.appData));
    render();
}

function render() {
    UI.renderStartKontostand(window.appData);
    UI.renderList("monatlicheEinnahmen", window.appData.monatlicheEinnahmen);
    UI.renderList("monatlicheFixkosten", window.appData.monatlicheFixkosten);
    UI.renderList("unregelmaessigeFixkosten", window.appData.unregelmaessigeFixkosten);
    UI.renderPrognose(window.appData, false);
}

// Wandelt den interaktiven Canvas in ein statisches <img> um, um Canvas-Clipping im PDF/Druck zu verhindern
function prepareChartForExport() {
    const canvas = document.getElementById("prognoseChart");
    if (!canvas || !window.prognoseChartInstance) return null;

    let chartImg = document.getElementById("prognoseChartImg");
    if (!chartImg) {
        chartImg = document.createElement("img");
        chartImg.id = "prognoseChartImg";
        canvas.parentNode.insertBefore(chartImg, canvas);
    }

    chartImg.src = window.prognoseChartInstance.toBase64Image('image/png', 1);
    chartImg.style.width = "100%";
    chartImg.style.height = "auto";
    chartImg.style.display = "block";
    canvas.style.display = "none";

    return chartImg;
}

// Setzt den Chart nach dem Export wieder auf den interaktiven Canvas-Modus zurück
function restoreChartAfterExport() {
    const canvas = document.getElementById("prognoseChart");
    const chartImg = document.getElementById("prognoseChartImg");
    if (chartImg) {
        chartImg.remove();
    }
    if (canvas) {
        canvas.style.display = "block";
    }
}

window.App = {
    addItem(category) {
        let newItem = { name: "Neuer Eintrag", betrag: 0.00 };
        if (category === "unregelmaessigeFixkosten") newItem.monatAbsolut = 1;
        window.appData[category].push(newItem);
        saveData();
    },
    removeItem(category, index) {
        window.appData[category].splice(index, 1);
        saveData();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (!window.appData.setupCompleted) {
        Wizard.start();
    } else {
        render();
    }

    document.getElementById("inputName").addEventListener("input", (e) => {
        window.appData.name = e.target.value;
        saveData();
    });

    document.getElementById("inputAdresse").addEventListener("input", (e) => {
        window.appData.adresse = e.target.value;
        saveData();
    });

    document.getElementById("startMonatSelect").addEventListener("change", (e) => {
        window.appData.startMonat = parseInt(e.target.value) || 1;
        saveData();
    });

    document.getElementById("startJahrInput").addEventListener("input", (e) => {
        window.appData.startJahr = parseInt(e.target.value) || new Date().getFullYear();
        saveData();
    });

    document.addEventListener("blur", (e) => {
        if (e.target.id === "startKontostandSpan") {
            let valStr = e.target.textContent.trim().replace(',', '.');
            window.appData.startKontostand = parseFloat(valStr) || 0;
            saveData();
            return;
        }

        if (
            e.target.classList.contains("editable-name") || 
            e.target.classList.contains("editable-value") ||
            e.target.classList.contains("editable-monat")
        ) {
            const index = e.target.getAttribute("data-index");
            const cat = e.target.getAttribute("data-cat");
            const field = e.target.getAttribute("data-field");

            let val = e.target.textContent.trim().replace(',', '.');
            if (field === "betrag" || field === "monatAbsolut") {
                val = parseFloat(val) || 0;
            }

            window.appData[cat][index][field] = val;
            saveData();
        }
    }, true);

    document.getElementById("wizard-restart-btn").addEventListener("click", () => {
        Wizard.start();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        if (confirm("Möchtest du wirklich alle Daten zurücksetzen?")) {
            localStorage.removeItem("haushaltsbuchData");
            window.appData = JSON.parse(JSON.stringify(defaultData));
            Wizard.start();
        }
    });

    // Automatischer PDF-Download per Button mit 100% sichtbarem Chart
    document.getElementById("download-pdf-btn").addEventListener("click", () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const fileName = `Privates_Haushaltsbuch_${dateStr}.pdf`;

        // 1. Footer-Texte setzen
        document.getElementById("print-footer-name").textContent = document.getElementById("inputName").value || "";
        document.getElementById("print-footer-adresse").textContent = document.getElementById("inputAdresse").value || "";

        // 2. Druck-Design anwenden und Export-Klasse aktivieren
        document.body.classList.add('pdf-exporting');
        window.scrollTo(0, 0);

        // 3. Prognose als Druck-Chart rendern und direkt als verlustfreies <img> einbetten
        UI.renderPrognose(window.appData, true);
        prepareChartForExport();

        const element = document.getElementById("pdf-container");
        const opt = {
            margin:       [10, 10, 12, 10],
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // 4. PDF erstellen und anschließend alles sauber auf interaktiven Normalzustand zurücksetzen
        html2pdf().from(element).set(opt).save().then(() => {
            restoreChartAfterExport();
            document.body.classList.remove('pdf-exporting');
            UI.renderPrognose(window.appData, false);
        }).catch(err => {
            console.error("Fehler beim PDF-Export:", err);
            restoreChartAfterExport();
            document.body.classList.remove('pdf-exporting');
            UI.renderPrognose(window.appData, false);
        });
    });

    // Synchronisation für das Standard-Drucken (Strg+P / Drucken-Button)
    window.addEventListener("beforeprint", () => {
        document.getElementById("print-footer-name").textContent = document.getElementById("inputName").value || "";
        document.getElementById("print-footer-adresse").textContent = document.getElementById("inputAdresse").value || "";
        UI.renderPrognose(window.appData, true);
        prepareChartForExport();
    });

    window.addEventListener("afterprint", () => {
        restoreChartAfterExport();
        UI.renderPrognose(window.appData, false);
    });
});