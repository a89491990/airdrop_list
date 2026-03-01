const API = "http://localhost:5000/projects";

let chart;

function toggleForm() {
  document.getElementById("form").classList.toggle("hidden");
}

async function loadProjects() {
  const res = await fetch(API);
  const data = await res.json();

  let total = 0, pending = 0, monthly = 0;
  const list = document.getElementById("list");
  list.innerHTML = "";

  const months = {};

  data.forEach(p => {
    total += p.amount;

    if (p.status === "pending") pending += p.amount;

    const month = new Date(p.date).getMonth();
    months[month] = (months[month] || 0) + p.amount;

    list.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>$${p.amount}</td>
        <td>${p.status}</td>
        <td>${new Date(p.date).toLocaleDateString()}</td>
        <td><button onclick="deleteProject('${p._id}')">Delete</button></td>
      </tr>
    `;
  });

  const currentMonth = new Date().getMonth();
  monthly = months[currentMonth] || 0;

  document.getElementById("total").innerText = total;
  document.getElementById("pending").innerText = pending;
  document.getElementById("monthly").innerText = monthly;

  drawChart(months);
}

function drawChart(months) {
  const data = new Array(12).fill(0);
  for (let m in months) {
    data[m] = months[m];
  }

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets: [{
        label: "Monthly Income",
        data: data
      }]
    }
  });
}

async function addProject() {
  const project = {
    name: document.getElementById("name").value,
    amount: Number(document.getElementById("amount").value),
    status: document.getElementById("status").value,
    date: document.getElementById("date").value
  };

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project)
  });

  loadProjects();
}

async function deleteProject(id) {
  await fetch(API + "/" + id, { method: "DELETE" });
  loadProjects();
}

loadProjects();
