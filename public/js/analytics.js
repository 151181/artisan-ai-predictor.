document.getElementById("totalProducts").innerText = 12;
document.getElementById("aiSuggestions").innerText = 34;
document.getElementById("campaignReach").innerText = 542;

const ctx = document.getElementById("chart");

new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Engagement",
        data: [30, 45, 60, 40, 75],
        borderWidth: 3,
      },
    ],
  },
});
document.addEventListener("DOMContentLoaded", () => {
  // Demo values — replace with fetchJSON to real data
  document.querySelectorAll(".card h3").forEach(el => { /* placeholder */ });

  const ctx = document.getElementById("chart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Week 1","Week 2","Week 3","Week 4"],
      datasets: [{ label:"Engagement", data:[40,75,55,95], borderWidth:3, fill:false, borderColor:"#6A0DAD" }]
    },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });
});
