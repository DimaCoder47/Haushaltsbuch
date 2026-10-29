const UI = {
    renderStartKontostand(appData) {
        const kontostandSpan = document.getElementById("startKontostandSpan");
        if (kontostandSpan && document.activeElement !== kontostandSpan) {
            kontostandSpan.textContent = Number(appData.startKontostand).toFixed(2);
        }

        const monatSelect = document.getElementById("startMonatSelect");
        if (monatSelect) monatSelect.value = appData.startMonat;

        const jahrInput = document.getElementById("startJahrInput");
        if (jahrInput && document.activeElement !== jahrInput) {
            jahrInput.value = appData.startJahr;
        }

        const nameInput = document.getElementById("inputName");
        if (nameInput && document.activeElement !== nameInput) {
            nameInput.value = appData.name || "";
        }

        const adresseInput = document.getElementById("inputAdresse");
        if (adresseInput && document.activeElement !== adresseInput) {
            adresseInput.value = appData.adresse || "";
        }
    },

    renderList(category, dataArray) {
        const ul = document.getElementById(`list-${category}`);
        if (!ul) return;
        
        const active = document.activeElement;
        if (ul.contains(active) && !active.classList.contains('btn-danger')) {
            return;
        }

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
                monatHtml = ` | Monat: <span class="editable-monat" contenteditable="true" data-index="${index}" data-cat="${category}" data-field="monatAbsolut">${item.monatAbsolut || 1}</span>`;
            }

            totalSum += Number(item.betrag) || 0;

            // Interaktive Ansicht (screen-only) & saubere Druckzeile ohne führenden Doppelpunkt
            li.innerHTML = `
                <span class="screen-only">
                    <span class="editable-name" contenteditable="true" data-index="${index}" data-cat="${category}" data-field="name">${item.name}</span>: 
                    <span class="editable-value" contenteditable="true" data-index="${index}" data-cat="${category}" data-field="betrag">${Number(item.betrag).toFixed(2)}</span>
                    ${monatHtml}
                </span>
                <button type="button" class="btn-small btn-danger no-print" onclick="App.removeItem('${category}', ${index})">Löschen</button>
                
                <!-- Strukturierte Druck- und PDF-Zeile -->
                <span class="print-cell-name">${item.name}</span>
                <span class="print-cell-value">${Number(item.betrag).toFixed(2)} €</span>
            `;
            ul.appendChild(li);
        });

        this.renderCategorySum(category, totalSum);
    },

    renderCategorySum(category, sum) {
        const listEl = document.querySelector(`#list-${category}`);
        if (!listEl) return;
        const card = listEl.closest('.card');
        if (!card) return;

        let sumContainer = card.querySelector('.category-sum');
        if (!sumContainer) {
            sumContainer = document.createElement('div');
            sumContainer.className = 'category-sum';
            card.appendChild(sumContainer);
        }

        let label = "Zwischensumme";
        if (category === "monatlicheEinnahmen") label = "Gesamteinnahmen";
        else if (category === "monatlicheFixkosten") label = "Gesamte mtl Ausgaben";
        else if (category === "unregelmaessigeFixkosten") label = "Gesamte unr. Ausgaben";

        sumContainer.innerHTML = `${label}: <span class="sum-value">${sum.toFixed(2)} €</span>`;
    },

    renderPrognose(appData, isPrintMode = false) {
        const tbody = document.querySelector("#prognose-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        let currentKontostand = Number(appData.startKontostand);
        const namenMonate = [
            "Januar", "Februar", "März", "April", "Mai", "Juni", 
            "Juli", "August", "September", "Oktober", "November", "Dezember"
        ];
        
        // Kompakte Monatsnamen für Druck/PDF
        const namenMonateKurz = [
            "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", 
            "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
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
            let monatNameTabelle = `${namenMonate[aktuellerMonatIndex]} ${aktuellesJahr}`;
            let monatNameChart = isPrintMode 
                ? `${namenMonateKurz[aktuellerMonatIndex]} ${String(aktuellesJahr).slice(-2)}`
                : monatNameTabelle;

            let absoluterMonatNummer = aktuellerMonatIndex + 1;

            let unregelmaessigDiesenMonat = appData.unregelmaessigeFixkosten
                .filter(item => Number(item.monatAbsolut) === absoluterMonatNummer)
                .reduce((acc, curr) => acc + Number(curr.betrag || 0), 0);

            const monatsEndstand = currentKontostand + sumEinnahmen - sumFixkosten - unregelmaessigDiesenMonat;
            
            let monatsBilanz = monatsEndstand - previousKontostand;
            let bilanzVorzeichen = monatsBilanz >= 0 ? "+" : "";
            let bilanzKlasse = monatsBilanz >= 0 ? "bilanz-positiv" : "bilanz-negativ";
            let endstandKlasse = monatsEndstand < 0 ? "bilanz-negativ" : "";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${monatNameTabelle}</td>
                <td class="${bilanzKlasse}">${bilanzVorzeichen}${monatsBilanz.toFixed(2)} €</td>
                <td><strong class="${endstandKlasse}">${monatsEndstand.toFixed(2)} €</strong></td>
            `;
            tbody.appendChild(tr);

            labels.push(monatNameChart);
            dataPoints.push(monatsEndstand.toFixed(2));

            previousKontostand = monatsEndstand;
            currentKontostand = monatsEndstand;
        }

        UI.updateChart(labels, dataPoints, isPrintMode);
    },

    updateChart(labels, dataPoints, isPrintMode = false) {
        const canvas = document.getElementById("prognoseChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        
        if (window.prognoseChartInstance) {
            window.prognoseChartInstance.destroy();
        }

        const borderColor = isPrintMode ? '#000000' : '#00f0ff';
        const backgroundColor = isPrintMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 240, 255, 0.1)';
        const pointBg = isPrintMode ? '#000000' : '#ff007f';
        const pointBorder = isPrintMode ? '#000000' : '#00f0ff';
        const textColor = isPrintMode ? '#000000' : '#94a3b8';
        const gridColor = isPrintMode ? '#dddddd' : '#1e293b';

        window.prognoseChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Kontostand Prognose (€)',
                    data: dataPoints,
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    borderWidth: 2,
                    pointBackgroundColor: pointBg,
                    pointBorderColor: pointBorder,
                    pointRadius: isPrintMode ? 3.5 : 4,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 5,
                        left: 5,
                        right: isPrintMode ? 20 : 10,
                        bottom: isPrintMode ? 15 : 0
                    }
                },
                animation: false,
                plugins: {
                    legend: { 
                        labels: { 
                            color: textColor,
                            boxWidth: 20,
                            font: { size: isPrintMode ? 10 : 12 }
                        } 
                    }
                },
                scales: {
                    x: { 
                        ticks: { 
                            color: textColor,
                            maxRotation: isPrintMode ? 35 : 45,
                            minRotation: isPrintMode ? 35 : 0,
                            autoSkip: false,
                            padding: 6,
                            font: {
                                size: isPrintMode ? 9 : 11
                            }
                        }, 
                        grid: { color: gridColor } 
                    },
                    y: { 
                        ticks: { 
                            color: textColor,
                            font: {
                                size: isPrintMode ? 9 : 11
                            }
                        }, 
                        grid: { color: gridColor } 
                    }
                }
            }
        });
    },

    toggleModal(show) {
        document.getElementById("setup-modal").classList.toggle("hidden", !show);
    }
};

const Wizard = {
    currentStep: 1,

    start() {
        window.wizardData = JSON.parse(JSON.stringify(window.appData));
        this.currentStep = 1;
        UI.toggleModal(true);
        this.renderStep();
    },

    renderStep() {
        const title = document.getElementById("wizard-title");
        const body = document.getElementById("wizard-body");
        if (!title || !body) return;
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

        window.wizardData[category].forEach((item, index) => {
            const li = document.createElement("li");
            let monatHtml = "";
            if (category === "unregelmaessigeFixkosten") {
                monatHtml = `Monat (1-12): <input type="number" min="1" max="12" value="${item.monatAbsolut || 1}" onchange="Wizard.updateItem('${category}', ${index}, 'monatAbsolut', this.value)" style="width:60px">`;
            }

            li.innerHTML = `
                <input type="text" value="${item.name}" onchange="Wizard.updateItem('${category}', ${index}, 'name', this.value)" placeholder="Name">
                ${monatHtml}
                <input type="number" step="0.01" value="${item.betrag}" onchange="Wizard.updateItem('${category}', ${index}, 'betrag', this.value)" placeholder="Betrag"> €
                <button type="button" class="btn-small btn-danger" onclick="Wizard.removeItem('${category}', ${index})">Löschen</button>
            `;
            ul.appendChild(li);
        });
    },

    addItem(category) {
        let newItem = { name: "Neuer Posten", betrag: 0 };
        if (category === "unregelmaessigeFixkosten") newItem.monatAbsolut = 1;
        window.wizardData[category].push(newItem);
        this.renderStep();
    },

    removeItem(category, index) {
        window.wizardData[category].splice(index, 1);
        this.renderStep();
    },

    updateItem(category, index, field, value) {
        if (field === "betrag" || field === "monatAbsolut") {
            window.wizardData[category][index][field] = parseFloat(String(value).replace(',', '.')) || 0;
        } else {
            window.wizardData[category][index][field] = value;
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
        window.appData = JSON.parse(JSON.stringify(window.wizardData));
        window.appData.setupCompleted = true;
        saveData();
        UI.toggleModal(false);
    }
};