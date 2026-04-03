console.log("Script Loaded");

let currentTab = "day1";
let sortables = [];
let slotCounter = 1;

/* ---------- SORTABLE ---------- */
function initSortable() {
    sortables.forEach(s => s.destroy());
    sortables = [];

    sortables.push(new Sortable(document.getElementById('matchContainer'), {
        group: 'shared',
        animation: 150,
        onEnd: saveSchedule
    }));

    document.querySelectorAll('.slot').forEach(slot => {
        sortables.push(new Sortable(slot, {
            group: 'shared',
            animation: 150,
            onEnd: saveSchedule
        }));
    });
}

/* ---------- MATCH ---------- */
function createMatchElement(text) {
    const div = document.createElement("div");
    div.className = "match";

    div.innerHTML = `
        ${text}
        <span class="delete-btn" onclick="deleteMatch(this)">❌</span>
    `;

    document.getElementById("matchContainer").appendChild(div);
}

function addMatch() {
    const input = document.getElementById("matchInput");
    const value = input.value.trim();
    if (!value) return;

    createMatchElement(value);
    input.value = "";

    initSortable();
}

function deleteMatch(el) {
    el.parentElement.remove();
    saveSchedule();
}

/* ---------- GROUP GENERATOR ---------- */
function generateMatchesForGroup(teams) {
    let matches = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matches.push(teams[i] + " vs " + teams[j]);
        }
    }
    return matches;
}

function generateGroupMatches() {
    let groupA = document.getElementById("groupA").value.split(",").map(t => t.trim()).filter(Boolean);
    let groupB = document.getElementById("groupB").value.split(",").map(t => t.trim()).filter(Boolean);

    let matches = [
        ...generateMatchesForGroup(groupA),
        ...generateMatchesForGroup(groupB)
    ];

    document.getElementById("matchContainer").innerHTML = "";

    matches.forEach(m => createMatchElement(m));

    initSortable();
    saveSchedule();
}

/* ---------- SLOT ---------- */
function addSlot() {
    const date = document.getElementById("dateInput").value;
    const time = document.getElementById("timeInput").value;

    if (!date || !time) return;

    const id = currentTab + "-" + slotCounter++;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${date}</td>
        <td>${time}</td>
        <td class="slot" data-id="${id}"></td>
        <td><button onclick="deleteSlot(this)">❌</button></td>
    `;

    document.querySelector("tbody").appendChild(row);

    initSortable();
    saveSchedule();
}

function deleteSlot(btn) {
    btn.parentElement.parentElement.remove();
    saveSchedule();
}

/* ---------- SAVE ---------- */
function saveSchedule() {
    const data = { matches: {}, slots: [] };

    document.querySelectorAll('.slot').forEach(slot => {
        const id = slot.dataset.id;

        const match = slot.querySelector('.match');
        if (match) {
            data.matches[id] = match.childNodes[0].textContent.trim();
        }

        const row = slot.parentElement;
        data.slots.push({
            id,
            date: row.children[0].innerText,
            time: row.children[1].innerText
        });
    });

    localStorage.setItem("dplSchedule_" + currentTab, JSON.stringify(data));
}

/* ---------- LOAD ---------- */
function loadSchedule() {
    let stored = localStorage.getItem("dplSchedule_" + currentTab);

    let data = stored ? JSON.parse(stored) : { matches: {}, slots: [] };

    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    data.slots.forEach(s => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${s.date}</td>
            <td>${s.time}</td>
            <td class="slot" data-id="${s.id}"></td>
            <td><button onclick="deleteSlot(this)">❌</button></td>
        `;

        tbody.appendChild(row);
    });

    document.querySelectorAll('.slot').forEach(slot => {
        const id = slot.dataset.id;

        if (data.matches[id]) {
            createMatchElement(data.matches[id]);
            const match = document.getElementById("matchContainer").lastChild;
            slot.appendChild(match);
        }
    });

    initSortable();
}

/* ---------- TAB ---------- */
function switchTab(tab, event) {
    currentTab = tab;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    loadSchedule();
}

/* ---------- INIT ---------- */
window.onload = () => {
    loadSchedule();
};
function formatTime(hour, minute) {
    let h = hour % 12 || 12;
    let ampm = hour >= 12 ? "PM" : "AM";
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function generateSmartSlots() {

    const duration = parseInt(document.getElementById("duration").value);
    const dates = document.getElementById("dates").value.split(",").map(d => d.trim());

    const morningStart = parseInt(document.getElementById("morningStart").value);
    const morningMatches = parseInt(document.getElementById("morningMatches").value);

    const eveningStart = parseInt(document.getElementById("eveningStart").value);
    const eveningMatches = parseInt(document.getElementById("eveningMatches").value);

    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    dates.forEach(date => {

        // Morning slots
        let currentHour = morningStart;
        let currentMin = 0;

        for (let i = 0; i < morningMatches; i++) {
            createSlotRow(date, currentHour, currentMin);
            currentMin += duration;

            currentHour += Math.floor(currentMin / 60);
            currentMin = currentMin % 60;
        }

        // Evening slots
        currentHour = eveningStart;
        currentMin = 0;

        for (let i = 0; i < eveningMatches; i++) {
            createSlotRow(date, currentHour, currentMin);
            currentMin += duration;

            currentHour += Math.floor(currentMin / 60);
            currentMin = currentMin % 60;
        }

    });

    initSortable();
    saveSchedule();
}

function createSlotRow(date, hour, minute) {
    const id = currentTab + "-" + slotCounter++;

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${date}</td>
        <td>${formatTime(hour, minute)}</td>
        <td class="slot" data-id="${id}"></td>
        <td><button onclick="deleteSlot(this)">❌</button></td>
    `;

    document.querySelector("tbody").appendChild(row);
}
// DOWNLOAD IMAGE
function downloadImage() {
    html2canvas(document.querySelector(".schedule")).then(canvas => {
        const link = document.createElement("a");
        link.download = "DPL_Schedule.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}

// DOWNLOAD PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;

    html2canvas(document.querySelector(".schedule")).then(canvas => {
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 10, 10, 180, 100);
        pdf.save("DPL_Schedule.pdf");
    });
}