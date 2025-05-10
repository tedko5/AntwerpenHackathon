
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
