
function openSidebar(name, description) {
    const sidebar = document.getElementById('infoSidebar');
    document.getElementById('sidebarTitle').textContent = name;
    document.getElementById('sidebarDescription').textContent = description;
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

function submitTraditional() {
    // Your logic for processing the search...
    // Once the search completes, show the results
    const resultsSection = document.getElementById('results');
    resultsSection.classList.remove('hidden'); // Show the results

    // Generate map and directions (replace with your actual logic)
    showMapAndDirections();
}

function submitNatural() {
    // Your logic for processing the smart search...
    // Once the search completes, show the results
    const resultsSection = document.getElementById('results');
    resultsSection.classList.remove('hidden'); // Show the results

    // Generate map and directions (replace with your actual logic)
    showMapAndDirections();
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

