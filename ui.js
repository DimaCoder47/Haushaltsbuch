const UI = {
    renderStartKontostand(appData) {
        document.getElementById("startKontostand").textContent = Number(appData.startKontostand).toFixed(2);
        document.getElementById("startMonatSelect").value = appData.startMonat;
        document.getElementById("startJahrInput").value = appData.startJahr;
    },

    renderList(category, dataArray) {
        const ul = document.getElementById(`list-${category}`);
        if (!ul) return;
        ul.innerHTML = "";

        if (!dataArray || dataArray.length === 0) {
            ul.innerHTML = "<p class='empty-hint'>Keine Einträge vorhanden.</p>";
            this.renderCategorySum(category, 0);
            return;
        }

        let totalSum = 0;

        dataArray.forEach((item, index) => {
            const li = document.createElement("li");
            
            let monatHtml = "";
            if (category === "unregelmaessigeFixkosten") {
                monatHtml = `Monat (1-12): <span class="editable-monat" contenteditable="true" data-index="${index}" data-cat="${category}" data-field="monatAbsolut">${item.monatAbsolut || 1}</span> | `;
            }

            totalSum += Number(item.betrag) || 0;

            li.innerHTML = `
                <span class="editable-name" contenteditable="true" data-index="${index}" data-cat="${category}" data-field="name">${item.name}</span>: 
                ${monatHtml}
                <span class="editable-value" contenteditable="true" data-index="${index}" data-cat="${category}" data-field="betrag">${Number(item.betrag).toFixed(2)} €</span>
                <button class="btn-small btn-danger" onclick="App.removeItem('${category}', ${index})">Löschen</button>
            `;
            ul.appendChild(li);
        });

        this.renderCategorySum(category, totalSum);
    },

    renderCategorySum(category, sum) {
        const card = document.querySelector(`#list-${category}`).closest('.card');
        if (!card) return;

        let sumContainer = card.querySelector('.category-sum');
        if (!sumContainer) {
            sumContainer = document.createElement('div');
            sumContainer.className = 'category-sum';
            card.appendChild(sumContainer);
        }

        let label = "Zwischensumme";
        if (category === "monatlicheEinnahmen") label = "Gesamteinnahmen";
        else if (category === "monatlicheFixkosten") label = "Gesamt-Fixkosten";
        else if (category === "unregelmaessigeFixkosten") label = "Gesamt-U.-Fixkosten";

        sumContainer.innerHTML = `${label}: <span>${sum.toFixed(2)} €</span>`;
    },

    renderPrognose(appData) {
        const tbody = document.querySelector("#prognose-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        let currentKontostand = Number(appData.startKontostand);
        const namenMonate = [
            "Januar", "Februar", "März", "April", "Mai", "Juni", 
            "Juli", "August", "September", "Oktober", "November", "Dezember"
        ];

        const sumEinnahmen = appData.monatlicheEinnahmen.reduce((acc, curr) => acc + Number(curr.betrag || 0), 0);
        const sumFixkosten = appData.monatlicheFixkosten.reduce((acc, curr) => acc + Number(curr.betrag || 0), 0);

        let labels = [];
        let dataPoints = [];

        let startM = parseInt(appData.startMonat) || 1;
        let startY = parseInt(appData.startJahr) || new Date().getFullYear();

        let previousKontostand = currentKontostand;

        for (let i = 0; i < 12; i++) {
            let aktuellerMonatIndex = (startM - 1 + i) % 12;
            let aktuellesJahr = startY + Math.floor((startM - 1 + i) / 12);
            let monatNameStr = `${namenMonate[aktuellerMonatIndex]} ${aktuellesJahr}`;
            let absoluterMonatNummer = aktuellerMonatIndex + 1;

            let unregelmaessigDiesenMonat = appData.unregelmaessigeFixkosten
                .filter(item => Number(item.monatAbsolut) === absoluterMonatNummer)
                .reduce((acc, curr) => acc + Number(curr.betrag || 0), 0);

            const monatsEndstand = currentKontostand + sumEinnahmen - sumFixkosten - unregelmaessigDiesenMonat;
            
            // Monatsbilanz (Differenz zum Vormonat)
            let monatsBilanz = monatsEndstand - previousKontostand;
            let bilanzVorzeichen = monatsBilanz >= 0 ? "+" : "";
            let bilanzKlasse = monatsBilanz >= 0 ? "bilanz-positiv" : "bilanz-negativ";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${monatNameStr}</td>
                <td class="${bilanzKlasse}">${bilanzVorzeichen}${monatsBilanz.toFixed(2)} €</td>
                <td><strong>${monatsEndstand.toFixed(2)} €</strong></td>
            `;
            tbody.appendChild(tr);

            labels.push(monatNameStr);
            dataPoints.push(monatsEndstand.toFixed(2));

            previousKontostand = monatsEndstand;
            currentKontostand = monatsEndstand;
        }

        UI.updateChart(labels, dataPoints);
    },

    updateChart(labels, dataPoints) {
        const ctx = document.getElementById("prognoseChart").getContext("2d");
        
        if (prognoseChartInstance) {
            prognoseChartInstance.destroy();
        }

        prognoseChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Kontostand Prognose (€)',
                    data: dataPoints,
                    borderColor: '#00f0ff',
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ff007f',
                    pointBorderColor: '#00f0ff',
                    pointRadius: 5,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: { labels: { color: '#e2e8f0' } }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
                }
            }
        });
    },

    toggleModal(show) {
        document.getElementById("setup-modal").classList.toggle("hidden", !show);
    }
};

// 3-Schritte Wizard Steuerung
const Wizard = {
    currentStep: 1,

    start() {
        wizardData = JSON.parse(JSON.stringify(appData));
        this.currentStep = 1;
        UI.toggleModal(true);
        this.renderStep();
    },

    renderStep() {
        const title = document.getElementById("wizard-title");
        const body = document.getElementById("wizard-body");
        body.innerHTML = "";

        if (this.currentStep === 1) {
            title.textContent = "Schritt 1/3: Monatliche Einnahmen";
            body.innerHTML = `
                <p>Trage deine Einnahmen ein oder überspringe Posten.</p>
                <ul id="w-list-einnahmen" class="wizard-list"></ul>
                <button class="btn-secondary" onclick="Wizard.addItem('monatlicheEinnahmen')">+ Einnahme hinzufügen</button>
                <div class="wizard-buttons">
                    <button class="btn-secondary" onclick="Wizard.skipStep()">Diesen Schritt überspringen</button>
                    <button class="btn-primary" onclick="Wizard.nextStep()">Weiter zu Fixkosten</button>
                </div>
            `;
            this.renderWizardList("monatlicheEinnahmen", "w-list-einnahmen");
        } 
        else if (this.currentStep === 2) {
            title.textContent = "Schritt 2/3: Monatliche Fixkosten";
            body.innerHTML = `
                <p>Trage deine monatlichen Fixkosten ein oder überspringe sie.</p>
                <ul id="w-list-fixkosten" class="wizard-list"></ul>
                <button class="btn-secondary" onclick="Wizard.addItem('monatlicheFixkosten')">+ Fixkosten hinzufügen</button>
                <div class="wizard-buttons">
                    <button class="btn-secondary" onclick="Wizard.skipStep()">Diesen Schritt überspringen</button>
                    <button class="btn-primary" onclick="Wizard.nextStep()">Weiter zu Unregelmäßig</button>
                </div>
            `;
            this.renderWizardList("monatlicheFixkosten", "w-list-fixkosten");
        } 
        else if (this.currentStep === 3) {
            title.textContent = "Schritt 3/3: Unregelmäßige Fixkosten";
            body.innerHTML = `
                <p>Trage unregelmäßige Ausgaben ein (mit Angabe des Monats 1-12) oder schließe das Setup ab.</p>
                <ul id="w-list-unregelmaessig" class="wizard-list"></ul>
                <button class="btn-secondary" onclick="Wizard.addItem('unregelmaessigeFixkosten')">+ Kosten hinzufügen</button>
                <div class="wizard-buttons">
                    <button class="btn-secondary" onclick="Wizard.skipStep()">Überspringen</button>
                    <button class="btn-primary" onclick="Wizard.finish()">Setup abschließen</button>
                </div>
            `;
            this.renderWizardList("unregelmaessigeFixkosten", "w-list-unregelmaessig");
        }
    },

    renderWizardList(category, elementId) {
        const ul = document.getElementById(elementId);
        if (!ul) return;
        ul.innerHTML = "";

        wizardData[category].forEach((item, index) => {
            const li = document.createElement("li");
            let monatHtml = "";
            if (category === "unregelmaessigeFixkosten") {
                monatHtml = `Monat (1-12): <input type="number" min="1" max="12" value="${item.monatAbsolut || 1}" onchange="Wizard.updateItem('${category}', ${index}, 'monatAbsolut', this.value)" style="width:60px">`;
            }

            li.innerHTML = `
                <input type="text" value="${item.name}" onchange="Wizard.updateItem('${category}', ${index}, 'name', this.value)" placeholder="Name">
                ${monatHtml}
                <input type="number" step="0.01" value="${item.betrag}" onchange="Wizard.updateItem('${category}', ${index}, 'betrag', this.value)" placeholder="Betrag"> €
                <button class="btn-small btn-danger" onclick="Wizard.removeItem('${category}', ${index})">Löschen</button>
            `;
            ul.appendChild(li);
        });
    },

    addItem(category) {
        let newItem = { name: "Neuer Posten", betrag: 0 };
        if (category === "unregelmaessigeFixkosten") newItem.monatAbsolut = 1;
        wizardData[category].push(newItem);
        this.renderStep();
    },

    removeItem(category, index) {
        wizardData[category].splice(index, 1);
        this.renderStep();
    },

    updateItem(category, index, field, value) {
        if (field === "betrag" || field === "monatAbsolut") {
            wizardData[category][index][field] = parseFloat(value) || 0;
        } else {
            wizardData[category][index][field] = value;
        }
    },

    nextStep() {
        this.currentStep++;
        this.renderStep();
    },

    skipStep() {
        this.currentStep++;
        if (this.currentStep > 3) {
            this.finish();
        } else {
            this.renderStep();
        }
    },

    finish() {
        appData = JSON.parse(JSON.stringify(wizardData));
        appData.setupCompleted = true;
        saveData();
        UI.toggleModal(false);
    }
};