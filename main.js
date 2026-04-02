var map = L.map('map').setView([48.0196, 66.9237], 5);
var geojsonLayer;
var csvDataGlobal;
var currentYear = '2025';

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function getColor(d) {
    return d > 1000000 ? '#4a0000' :
           d > 500000  ? '#800026' :
           d > 300000  ? '#BD0026' :
           d > 150000  ? '#E31A1C' :
           d > 80000   ? '#FC4E2A' :
           d > 40000   ? '#FD8D3C' :
           d > 15000   ? '#FEB24C' :
           d > 5000    ? '#FED976' :
           d > 0       ? '#FFEDA0' : '#e0e0e0'; 
}

function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    const headers = lines[0].split(',').map(h => h.trim());

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const obj = {};
        const currentline = lines[i].split(',');
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j] ? currentline[j].trim() : "";
        }
        result.push(obj);
    }
    return result;
}

async function init() {
    try {
        // Загружаем файлы напрямую из корня сайта
        const [csvRes, geoRes] = await Promise.all([
            fetch('data.csv'), 
            fetch('data.geojson')
        ]);

        const csvText = await csvRes.text();
        csvDataGlobal = parseCSV(csvText); 
        const geojsonData = await geoRes.json();

        geojsonLayer = L.geoJson(geojsonData, {
            style: function(feature) {
                var dName = feature.properties.district || feature.properties.ADM2_EN;
                var row = csvDataGlobal.find(r => r.District === dName);
                var value = row ? parseInt(row[currentYear]) : 0;
                return {
                    fillColor: getColor(value),
                    weight: 0.5, 
                    color: 'black', 
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                var dName = feature.properties.district || feature.properties.ADM2_EN;
                var row = csvDataGlobal.find(r => r.District === dName);
                var value = row ? parseInt(row[currentYear]) : 0;
                layer.bindPopup(`<b>Район:</b> ${dName}<br><b>Население (${currentYear}):</b> ${value.toLocaleString()}`);
                
                layer.on({
                    mouseover: function(e) { e.target.setStyle({ weight: 2, color: '#000', fillOpacity: 0.9 }); },
                    mouseout: function(e) { geojsonLayer.resetStyle(e.target); }
                });
            }
        }).addTo(map);

    } catch (e) {
        console.error("Ошибка инициализации:", e);
    }
}

// Легенда
var legend = L.control({position: 'bottomright'});
legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'info legend');
    var grades = [0, 15000, 40000, 80000, 150000, 300000, 500000, 1000000];
    div.style.background = 'white'; div.style.padding = '10px'; div.style.borderRadius = '5px'; div.style.lineHeight = '18px';
    div.innerHTML = '<b>Население</b><br>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i].toLocaleString() + (grades[i + 1] ? '&ndash;' + grades[i + 1].toLocaleString() + '<br>' : '+');
    }
    return div;
};
legend.addTo(map);

init();