var map = L.map('map').setView([48.0196, 66.9237], 5);
var geojsonLayer;
var csvDataGlobal;
var districtLayers = {}; 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Функция группировки данных из CSV
function groupByRegion(data) {
    return data.reduce((acc, row) => {
        // Если в CSV нет колонки Region, используем "Прочие"
        let region = row.Region || "Другие регионы";
        if (!acc[region]) acc[region] = [];
        acc[region].push(row);
        return acc;
    }, {});
}

async function init() {
    try {
        const [csvRes, geoRes] = await Promise.all([fetch('data.csv'), fetch('data.geojson')]);
        const csvText = await csvRes.text();
        csvDataGlobal = parseCSV(csvText); 
        const geojsonData = await geoRes.json();

        const container = document.getElementById('items-container');
        container.innerHTML = '';

        // Группируем районы по областям
        const grouped = groupByRegion(csvDataGlobal);

        // Создаем элементы в списке
        Object.keys(grouped).sort().forEach(regionName => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'region-group';

            const header = document.createElement('div');
            header.className = 'region-header';
            header.innerHTML = `<span>📍 ${regionName}</span>`;
            groupDiv.appendChild(header);

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'region-content';

            grouped[regionName].sort((a, b) => a.District.localeCompare(b.District)).forEach(row => {
                const item = document.createElement('div');
                // Если в названии есть "City" или "г.", выделяем визуально
                const isCity = row.District.toLowerCase().includes('city') || row.District.toLowerCase().includes('г.');
                item.className = `district-item ${isCity ? 'city-item' : ''}`;
                item.innerText = row.District;
                item.onclick = () => zoomToDistrict(row.District);
                itemsDiv.appendChild(item);
            });

            groupDiv.appendChild(itemsDiv);
            container.appendChild(groupDiv);
        });

        // Отрисовка карты (код остается прежним)
        geojsonLayer = L.geoJson(geojsonData, {
            style: styleFeature,
            onEachFeature: (feature, layer) => {
                let dName = feature.properties.district || feature.properties.ADM2_EN;
                districtLayers[dName] = layer;
                layer.bindPopup(`<b>${dName}</b>`);
            }
        }).addTo(map);

    } catch (e) { console.error(e); }
}

function zoomToDistrict(name) {
    var layer = districtLayers[name];
    if (layer) {
        map.fitBounds(layer.getBounds(), { padding: [50, 50] });
        layer.openPopup();
    } else {
        alert("Район " + name + " не найден на карте");
    }
}

// Вспомогательная функция для CSV (та же, что была раньше)
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : "");
        return obj;
    });
}

function styleFeature(feature) {
    return { weight: 0.5, color: 'black', fillColor: '#FEB24C', fillOpacity: 0.7 };
}

init();
