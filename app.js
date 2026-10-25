let appData = loadData();

function loadData() {
    const saved = localStorage.getItem("haushaltsbuchData");
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultData));
}

function saveData() {
    localStorage.setItem("haushaltsbuchData", JSON.stringify(appData));
    render();
}

function render() {
    UI.renderStartKontostand(appData);
    UI.renderList("monatlicheEinnahmen", appData.monatlicheEinnahmen);
    UI.renderList("monatlicheFixkosten", appData.monatlicheFixkosten);
    UI.renderList("unregelmaessigeFixkosten", appData.unregelmaessigeFixkosten);
    UI.renderPrognose(appData);
}

const App = {
    addItem(category) {
        let newItem = { name: "Neuer Eintrag", betrag: 0.00 };
        if (category === "unregelmaessigeFixkosten") newItem.monatAbsolut = 1;
        appData[category].push(newItem);
        saveData();
    },
    removeItem(category, index) {
        appData[category].splice(index, 1);
        saveData();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (!appData.setupCompleted) {
        Wizard.start();
    } else {
        render();
    }

    // Start-Monat & Jahr Änderungen
    document.getElementById("startMonatSelect").addEventListener("change", (e) => {
        appData.startMonat = parseInt(e.target.value) || 1;
        saveData();
    });

    document.getElementById("startJahrInput").addEventListener("input", (e) => {
        appData.startJahr = parseInt(e.target.value) || new Date().getFullYear();
        saveData();
    });

    // Event Listener für Inline-Editing
    document.addEventListener("blur", (e) => {
        if (e.target.id === "startKontostand") {
            appData.startKontostand = parseFloat(e.target.textContent) || 0;
            saveData();
        } else if (
            e.target.classList.contains("editable-name") || 
            e.target.classList.contains("editable-value") ||
            e.target.classList.contains("editable-monat")
        ) {
            const index = e.target.getAttribute("data-index");
            const cat = e.target.getAttribute("data-cat");
            const field = e.target.getAttribute("data-field");

            let val = e.target.textContent;
            if (field === "betrag" || field === "monatAbsolut") {
                val = parseFloat(val) || 0;
            }

            appData[cat][index][field] = val;
            saveData();
        }
    }, true);

    document.getElementById("wizard-restart-btn").addEventListener("click", () => {
        Wizard.start();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        if (confirm("Möchtest du wirklich alle Daten zurücksetzen?")) {
            localStorage.removeItem("haushaltsbuchData");
            appData = JSON.parse(JSON.stringify(defaultData));
            Wizard.start();
        }
    });
});