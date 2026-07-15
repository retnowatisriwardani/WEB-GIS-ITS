// ======================
// MEMBUAT PETA
// ======================

// Koordinat tampilan awal
const homeView = {
    center: [-7.282, 112.794],
    zoom: 20
};

// Membuat peta
const map = L.map('map', {
    zoomControl: false
}).setView(homeView.center, homeView.zoom);

// Tambahkan zoom control di kanan bawah
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// ======================
// TOOL UKUR JARAK
// ======================

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
    draw: {
        polygon: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: true
    },
    edit: {
        featureGroup: drawnItems,
        remove: true
    }
});

map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (e) {
    drawnItems.addLayer(e.layer);
});

// ======================
// BASEMAP
// ======================

// Google Satellite
const googleSatellite = L.tileLayer(
    'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    {
        attribution: '&copy; Google',
        maxZoom: 22
    }
);

// Drone Orthophoto
const orthoDrone = L.tileLayer(
    'Tiles/{z}/{x}/{y}.png',
    {
        attribution: 'Drone Orthophoto',
        minZoom: 15,
        maxZoom: 22,
        opacity: 0.95
    }
);

// Google Labels
const googleLabels = L.tileLayer(
    'https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
    {
        attribution: '&copy; Google',
        maxZoom: 22
    }
);

// Basemap default
googleSatellite.addTo(map);
googleLabels.addTo(map);

// ======================
// URUTAN LAYER
// ======================

// Google Satellite paling bawah
googleSatellite.setZIndex(1);

// Drone Orthophoto di atas Google Satellite
orthoDrone.setZIndex(2);

// Label jalan paling atas
googleLabels.setZIndex(1000);

// ======================
// LAYER CONTROL
// ======================

// Basemap (radio button)
const baseMaps = {
    "Google Satellite": googleSatellite
};

// Overlay (checkbox)
const overlayMaps = {
    "Drone Orthophoto": orthoDrone,
    "Street Labels": googleLabels
};

// ======================
// HOME BOUNDS
// ======================

let homeBounds = null;

// ======================
// DAFTAR GEOJSON
// ======================

const layers = [
    'ITS_Sukolilo',
    'ITS_Manyar',
    'ITS_Cokroaminoto',
    'ITS_Buncitan',
    'Cover_Planted',
    'Forest',
    'Water_Absorption',
    'Building',
    'Water',
    'Rooftop',
    'REIDI',
    'Urban Farming'
];

// ======================
// WARNA LAYER
// ======================

const colors = {
    Cover_Planted: '#90EE90',
    Forest: '#228B22',
    Water_Absorption: '#00CED1',
    Building: '#ff0000',
    Water: '#1E90FF',
    Rooftop: '#FF8C00',
    REIDI: '#800080',
    'Urban Farming': '#FFD700'
};
// ======================
// MEMUAT SEMUA GEOJSON
// ======================

layers.forEach(layerName => {

    fetch(`GeoJSON/${layerName}.geojson`)
        .then(response => response.json())
        .then(data => {

            const geoLayer = L.geoJSON(data, {

    style: function () {

        // Boundary ITS
        if (
            layerName === 'ITS_Sukolilo' ||
            layerName === 'ITS_Manyar' ||
            layerName === 'ITS_Cokroaminoto' ||
            layerName === 'ITS_Buncitan'
        ) {

            return {
                color: '#ff0000',
                weight: 4,
                fillOpacity: 0
            };

        }

        // Layer lainnya
        return {
            fillColor: colors[layerName],
            fillOpacity: 0.8,
            stroke: false
        };

    },   

    onEachFeature: function(feature, layer){

        if(feature.properties && feature.properties.Luas){

            layer.bindPopup(
                "<b>Luas</b><br>" +
                Number(feature.properties.Luas).toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) +
                " m²"
            );

        }

    }

});

            // Tambahkan ke peta
            geoLayer.addTo(map);
            geoLayer.bringToFront();

            // Simpan layer ke overlay
            overlayMaps[layerName] = geoLayer;

            // Hitung Home Bounds
            if (
                layerName === 'ITS_Sukolilo' ||
                layerName === 'ITS_Manyar' ||
                layerName === 'ITS_Cokroaminoto' ||
                layerName === 'ITS_Buncitan'
            ) {

                if (homeBounds === null) {
                    homeBounds = geoLayer.getBounds();
                } else {
                    homeBounds.extend(geoLayer.getBounds());
                }

            }

            // Semua layer selesai dimuat
            if (Object.keys(overlayMaps).length === layers.length + 2) {

                // Zoom awal
                if (homeBounds) {
                    map.fitBounds(homeBounds, {
                        padding: [30, 30]
                    });
                }

                // Layer Control
                L.control.layers(
                    baseMaps,
                    overlayMaps,
                    {
                        collapsed: false
                    }
                ).addTo(map);

                // ======================
                // SELECT ALL / UNSELECT ALL
                // ======================

                const selectControl = L.control({
                    position: 'topright'
                });

                selectControl.onAdd = function () {

                    const div = L.DomUtil.create('div');

                    div.innerHTML = `
                        <div style="
                            background:white;
                            padding:8px;
                            border-radius:5px;
                            box-shadow:0 1px 5px rgba(0,0,0,0.4);
                            margin-bottom:5px;
                        ">
                            <button id="selectAllBtn">
                                Select All
                            </button>

                            <br><br>

                            <button id="unselectAllBtn">
                                Unselect All
                            </button>
                        </div>
                    `;

                    L.DomEvent.disableClickPropagation(div);

                    return div;

                };

                selectControl.addTo(map);

            }

        })

        .catch(error => {
            console.log(`Gagal memuat ${layerName}:`, error);
        });

});
// ======================
// TOMBOL SELECT ALL
// ======================

document.addEventListener('click', function (e) {

    // ======================
    // SELECT ALL
    // ======================
    if (e.target.id === 'selectAllBtn') {

        Object.keys(overlayMaps).forEach(key => {

            // Jangan aktifkan Orthophoto & Street Labels
            if (
                key !== "Drone Orthophoto" &&
                key !== "Street Labels"
            ) {
                map.addLayer(overlayMaps[key]);
            }

        });

        // Centang checkbox overlay GeoJSON saja
        document.querySelectorAll(
            '.leaflet-control-layers-overlays input'
        ).forEach((checkbox, index) => {

            const label = document.querySelectorAll(
                '.leaflet-control-layers-overlays span'
            )[index].textContent.trim();

            if (
                label !== "Drone Orthophoto" &&
                label !== "Street Labels"
            ) {
                checkbox.checked = true;
            }

        });

    }

    // ======================
    // UNSELECT ALL
    // ======================
    if (e.target.id === 'unselectAllBtn') {

        Object.keys(overlayMaps).forEach(key => {

            if (
                key !== "Street Labels" &&
                key !== "Drone Orthophoto"
            ) {
                map.removeLayer(overlayMaps[key]);
            }

        });

        document.querySelectorAll(
            '.leaflet-control-layers-overlays input'
        ).forEach((checkbox, index) => {

            const label = document.querySelectorAll(
                '.leaflet-control-layers-overlays span'
            )[index].textContent.trim();

            if (
                label !== "Drone Orthophoto" &&
                label !== "Street Labels"
            ) {
                checkbox.checked = false;
            }

        });

    }

});
// ======================
// SCALE
// ======================

L.control.scale({
    metric: true,
    imperial: false
}).addTo(map);
// ======================
// HOME BUTTON
// ======================

const homeControl = L.control({
    position: 'topleft'
});

homeControl.onAdd = function () {

    const div = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control'
    );

    div.innerHTML = `
        <a href="#"
           title="Home"
           style="
                width:30px;
                height:30px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:white;
                text-decoration:none;
                font-size:18px;
                cursor:pointer;
           ">
            🏠
        </a>
    `;

    L.DomEvent.disableClickPropagation(div);

    div.onclick = function (e) {

        e.preventDefault();

        if (homeBounds) {

            map.fitBounds(homeBounds, {
                padding: [30, 30]
            });

        }

    };

    return div;

};

homeControl.addTo(map);
map.on('overlayadd', function(e){

    if(e.layer === orthoDrone){

        Object.keys(overlayMaps).forEach(function(key){

            if(
                key !== "Drone Orthophoto" &&
                key !== "Street Labels"
            ){

                if(map.hasLayer(overlayMaps[key])){
                    overlayMaps[key].bringToFront();
                }

            }

        });

        googleLabels.bringToFront();

    }

});

// ======================
// INFO ZOOM LEVEL
// ======================
const zoomInfo = L.control({
    position: 'bottomright'
});
const div = L.DomUtil.create('div', 'zoom-info leaflet-control');

zoomInfo.onAdd = function () {

    const div = L.DomUtil.create('div', 'zoom-info');

    div.style.background = 'white';
    div.style.padding = '6px 10px';
    div.style.borderRadius = '4px';
    div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    div.style.fontWeight = 'bold';

    div.innerHTML = 'Zoom : ' + map.getZoom();

    map.on('zoomend', function () {
        div.innerHTML = 'Zoom : ' + map.getZoom();
    });

    return div;
};

zoomInfo.addTo(map);

