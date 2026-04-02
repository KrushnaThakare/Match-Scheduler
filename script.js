console.log("Script Loaded");

let currentTab = "day1";
let sortables = [];
let slotCounter = 1;

// INIT SORTABLE
function initSortable() {
    sortables.forEach(s => s.destroy());
    sortables = [];

    sortables.push(new Sortable(document.querySelector('.match-list'), {
        group: 'shared',
        animation: 150,
        onEnd: () => {
            console.log("Drag ended");
            saveSchedule();
        }
    }));

    document.querySelectorAll('.slot').forEach(slot => {
        sortables.push(new Sortable(slot, {
            group: 'shared',
            animation: 150,
            onEnd: () => {
                console.log("Drag ended");
                saveSchedule();
            }
        }));
    });
}

// ADD MATCH
function addMatch() {
    const input = document.getElementById("matchInput");
    const value = input.value.trim();

    if (!value) return;

    const div = document.createElement("div");
    div.className = "match";
    div.innerHTML = `
        ${value}
        <span class="delete-btn" onclick="deleteMatch(this)">❌</span>
    `;

    document.querySelector(".match-list").appendChild(div);

    input.value = "";
    initSortable();
}

// DELETE MATCH
function deleteMatch(el) {
    el.parentElement.remove();
    saveSchedule();
}

// ADD SLOT
function addSlot() {
    const date = document.getElementById("dateInput").value;
    const time = document.getElementById("timeInput").value;

    if (!date || !time) return;

    const tbody = document.querySelector("tbody");

    const id = currentTab + "-" + slotCounter++;

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${date}</td>
        <td>${time}</td>
        <td class="slot" data-id="${id}"></td>
        <td><button onclick="deleteSlot(this)">❌</button></td>
    `;

    tbody.appendChild(row);

    initSortable();
    saveSchedule();
}

// DELETE SLOT
function deleteSlot(btn) {
    btn.parentElement.parentElement.remove();
    saveSchedule();
}

// SAVE
function saveSchedule() {
    const data = {
        matches: {},
        slots: []
    };

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

    console.log("Saving data:", data);

    localStorage.setItem("dplSchedule_" + currentTab, JSON.stringify(data));
}

// LOAD
function loadSchedule() {
    const data = JSON.parse(localStorage.getItem("dplSchedule_" + currentTab)) || { matches: {}, slots: [] };

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

    // Reset match pool
    const pool = document.querySelector(".match-list");
    document.querySelectorAll('.match').forEach(m => pool.appendChild(m));

    // Place matches
    document.querySelectorAll('.slot').forEach(slot => {
        const id = slot.dataset.id;

        if (data.matches[id]) {
            const match = Array.from(document.querySelectorAll('.match'))
                .find(m => m.childNodes[0].textContent.trim() === data.matches[id]);

            if (match) slot.appendChild(match);
        }
    });

    initSortable();
}

// TAB SWITCH
function switchTab(tab, event) {
    currentTab = tab;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    loadSchedule();
}

// EXPORT IMAGE
function downloadImage() {
    html2canvas(document.querySelector(".schedule")).then(canvas => {
        const link = document.createElement("a");
        link.download = "schedule.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}

// EXPORT PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;

    html2canvas(document.querySelector(".schedule")).then(canvas => {
        const img = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.addImage(img, 'PNG', 10, 10, 180, 100);
        pdf.save("schedule.pdf");
    });
}

// INIT
window.onload = () => {
    loadSchedule();
};