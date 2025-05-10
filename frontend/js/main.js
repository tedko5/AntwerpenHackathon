
function openSidebar(name, description) {
    const sidebar = document.getElementById('infoSidebar');
    document.getElementById('sidebarTitle').innerHTML = name;
    document.getElementById('sidebarDescription').innerHTML = description;
    sidebar.classList.remove('hidden');
    sidebar.classList.add('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('infoSidebar');
    sidebar.classList.remove('show');
    sidebar.classList.add('hidden');
}

function toggleMenu() {
    const nav = document.getElementById('navLinks');
    nav.classList.toggle('show');
}

function showForm(mode) {
    const traditional = document.getElementById('traditionalForm');
    const natural = document.getElementById('naturalForm');
    const traditionalBtn = document.getElementById('traditionalBtn');
    const naturalBtn = document.getElementById('naturalBtn');

    if (mode === 'traditional') {
        traditional.classList.remove('hidden');
        natural.classList.add('hidden');
        traditionalBtn.classList.add('active');
        naturalBtn.classList.remove('active');
    } else {
        natural.classList.remove('hidden');
        traditional.classList.add('hidden');
        naturalBtn.classList.add('active');
        traditionalBtn.classList.remove('active');
    }
}

let selectedMode = 'walk'; // default mode

function setMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
}

let map;
let routeLayer;
let startMarker;
let endMarker;

// Initialize map with user's location
function initMap(center) {
    if (!map) {
        map = L.map('map').setView(center, 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/">CartoDB</a>, &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Add click event to get coordinates on click for the end destination
        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            console.log("Clicked coordinates: " + lat + ", " + lon);

            // Remove the existing end marker if it exists
            if (endMarker) {
                endMarker.remove();
            }

            // Place a red circle marker at the clicked location
            endMarker = L.circleMarker([lat, lon], {
                color: 'red',
                radius: 10,
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            // Set the destination field with the clicked coordinates
            document.getElementById("end").value = `${lat},${lon}`;

            // Fetch the nearest tagged object from the backend
            fetch(`http://127.0.0.1:5000/lookup?lat=${lat}&lon=${lon}`)
                .then(res => res.json())
                .then(data => {
                    if (data.tags) {
                        const description = Object.entries(data.tags).map(([k, v]) => {
                                const prettyKey = k.replace(/[:_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                                const prettyValue = typeof v === 'string' ? v.replace(/_/g, " ") : v;
                                return `<strong>${prettyKey}:</strong> ${prettyValue}`;
                            })
                            .join("<br>");
                        const title = data.tags.name || `${data.type.toUpperCase()} @ ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
                        openSidebar(title, description);
                    } else if (data.error) {
                        openSidebar("Nothing here", "No tagged OSM feature was found at this location.");
                    }
                })
                .catch(err => {
                    console.error("Error fetching clicked location info:", err);
                });
        });
    }
}

// Get current geolocation to automatically fill start in traditional form
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            document.getElementById("start").value = `${lat},${lon}`;  // set current coordinates as start
            initMap([lat, lon]);  // Center map on current location
        }, function(error) {
            console.log("Geolocation error: ", error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

// Set current location on page load
window.onload = getCurrentLocation;

async function submitNatural() {
    const start = document.getElementById("start").value;  // Use current location (already set in the form)
    const end = document.getElementById("end").value;
    const userInput = document.getElementById("nlInput").value;  // Get the natural language query

    // Send a request to the backend with the natural query
    const response = await fetch(`http://127.0.0.1:5000/route?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&note=${encodeURIComponent(userInput)}`);
    const data = await response.json();
    console.log("Smart route response:", data);

    // If the route is found, draw the route and show directions
    if (data.route) {
        initMap(data.route[0]);  // Initialize the map at the first coordinate
        drawRoute(data.route);  // Draw the route on the map

        // Display the route directions (turn-by-turn)
        const directionsDiv = document.getElementById('directions');
        directionsDiv.innerHTML = '<h3>Route Directions:</h3>';
        data.directions.forEach((step, index) => {
            directionsDiv.innerHTML += `<p>${index + 1}. ${step}</p>`;
        });
    }
}

async function submitTraditional() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const response = await fetch(`http://127.0.0.1:5000/route?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&note=Prefer lit main roads`);
    const data = await response.json();
    console.log("Traditional route response:", data);
    if (data.route) {
        initMap(data.route[0]);
        drawRoute(data.route);

        // Display the route directions (turn-by-turn)
        const directionsDiv = document.getElementById('directions');
        directionsDiv.innerHTML = '<h3>Route Directions:</h3>';
        data.directions.forEach((step, index) => {
            directionsDiv.innerHTML += `<p>${index + 1}. ${step}</p>`;
        });
    }
}

// Function to draw the route and place markers
function drawRoute(coords) {
    if (routeLayer) {
        routeLayer.remove();
    }
    routeLayer = L.polyline(coords, { color: 'purple', weight: 5 }).addTo(map);

    // Place a blue circle marker at the start location (coords[0] is the start)
    if (startMarker) {
        startMarker.remove();
    }
    startMarker = L.circleMarker([coords[0][0], coords[0][1]], {
        color: 'blue',
        radius: 10,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map).bindPopup('Start Location').openPopup();

    // Place a red circle marker at the end location (coords[coords.length - 1] is the end)
    if (endMarker) {
        endMarker.remove();
    }
    endMarker = L.circleMarker([coords[coords.length - 1][0], coords[coords.length - 1][1]], {
        color: 'red',
        radius: 10,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map).bindPopup('End Location').openPopup();

    map.fitBounds(routeLayer.getBounds());  // Adjust the map view to fit the entire route
}

function showMapAndDirections() {
    // Example directions array
    const directions = [
        "Head west on Meir",
        "Turn left onto Frankrijklei",
        "Turn right onto Pelgrimstraat",
        "Arrive at your destination"
    ];

    // Show the instructions
    showInstructions(directions);
}

function showInstructions(steps) {
    const list = document.getElementById("instructionsList");
    list.innerHTML = ""; // Clear previous instructions
    steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
    });
}

