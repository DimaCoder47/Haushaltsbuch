const defaultData = {
    setupCompleted: false,
    name: "Max Mustermann",
    adresse: "Musterstraße 1, 12345 Musterstadt",
    startKontostand: 1500.00,
    startMonat: 1,
    startJahr: new Date().getFullYear(),
    monatlicheEinnahmen: [
        { name: "Gehalt", betrag: 2200.00 },
        { name: "Nebeneinkünfte / Bonuszahlungen", betrag: 0.00 },
        { name: "Sonstiges", betrag: 0.00 }
    ],
    monatlicheFixkosten: [
        { name: "Miete / Nebenkosten", betrag: 750.00 },
        { name: "Strom / Gas", betrag: 120.00 },
        { name: "Internet / Handy", betrag: 50.00 },
        { name: "Abos (Streaming, Gym, etc.)", betrag: 25.00 },
        { name: "Lebensmittel / Haushalt", betrag: 300.00 },
        { name: "Mobilität (ÖPNV / Tanken)", betrag: 100.00 },
        { name: "Freizeit / Hobby", betrag: 150.00 },
        { name: "Sparen / Investment", betrag: 200.00 }
    ],
    unregelmaessigeFixkosten: [
        { name: "KFZ-Steuer / Versicherung", betrag: 300.00, monatAbsolut: 3 },
        { name: "Haftpflicht- / Hausratversicherung", betrag: 120.00, monatAbsolut: 6 },
        { name: "GEZ (Rundfunkbeitrag)", betrag: 55.00, monatAbsolut: 2 },
        { name: "Jahres-Abos / Wartung", betrag: 90.00, monatAbsolut: 11 }
    ]
};

window.wizardData = {};
window.prognoseChartInstance = null;