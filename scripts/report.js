// Pie chart for a category breakdown; data is {labels: [...], values: [...]}.
var REPORT_COLORS = ["#C50000", "#1000C5", "#14C500", "#C5AE00", "#AB00C5", "#04B7B1", "#B75504",
    "#FF00EF", "#00FFE6", "#9EFF00", "#FF5100", "#0000FF", "#CC0000"];

function renderPieChart(canvasId, data) {
    new Chart(document.getElementById(canvasId), {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.labels.map(function (_, i) {
                    return REPORT_COLORS[i % REPORT_COLORS.length];
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {legend: {position: 'right'}}
        }
    });
}
