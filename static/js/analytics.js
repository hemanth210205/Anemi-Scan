const chartInstances = [];

function themeColors() {
    const styles = getComputedStyle(document.documentElement);
    const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
    return {
        text: read("--muted", "#5B6B7F"),
        grid: read("--chart-grid", "rgba(15, 23, 42, 0.08)"),
        surface: read("--surface", "#FFFFFF"),
        primary: read("--primary", "#0F766E"),
        accent: read("--accent", "#06B6D4"),
        anemic: read("--anemic", "#E11D48"),
        healthy: read("--non-anemic", "#10B981")
    };
}

function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    if (value.length !== 6) return hex;
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function markChartReady(canvasId) {
    const canvas = document.getElementById(canvasId);
    const shell = canvas?.closest("[data-chart-shell]");
    if (shell) {
        shell.classList.remove("is-loading");
    }
}

function baseOptions(colors, extra = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: colors.text, usePointStyle: true, boxWidth: 8, padding: 16 }
            },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                padding: 12,
                cornerRadius: 10,
                titleFont: { weight: "600" }
            }
        },
        ...extra
    };
}

function axes(colors, valueAxis = "y") {
    const categoryAxis = valueAxis === "y" ? "x" : "y";
    return {
        [valueAxis]: {
            beginAtZero: true,
            ticks: { precision: 0, color: colors.text },
            grid: { color: colors.grid },
            border: { display: false }
        },
        [categoryAxis]: {
            ticks: { color: colors.text },
            grid: { display: false },
            border: { display: false }
        }
    };
}

function renderAnalyticsChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    chartInstances.push(new Chart(canvas, config));
    markChartReady(canvasId);
}

function renderAll(payload) {
    chartInstances.splice(0).forEach((chart) => chart.destroy());
    const colors = themeColors();
    const gradientFill = (context) => {
        const { chart } = context;
        const { ctx, chartArea } = chart;
        if (!chartArea) return hexToRgba(colors.primary, 0.18);
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, hexToRgba(colors.accent, 0.35));
        gradient.addColorStop(1, hexToRgba(colors.accent, 0));
        return gradient;
    };

    renderAnalyticsChart("pieChart", {
        type: "doughnut",
        data: {
            labels: payload.pie.labels,
            datasets: [{
                data: payload.pie.values,
                backgroundColor: [colors.anemic, colors.healthy],
                borderColor: colors.surface,
                borderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: baseOptions(colors, {
            cutout: "62%",
            plugins: {
                legend: { position: "bottom", labels: { color: colors.text, usePointStyle: true, padding: 18 } }
            }
        })
    });

    renderAnalyticsChart("lineChart", {
        type: "line",
        data: {
            labels: payload.line.labels,
            datasets: [{
                label: "Scans",
                data: payload.line.values,
                borderColor: colors.accent,
                backgroundColor: gradientFill,
                pointBackgroundColor: colors.surface,
                pointBorderColor: colors.accent,
                pointBorderWidth: 2,
                pointRadius: 4,
                borderWidth: 2.5,
                fill: true,
                tension: 0.38
            }]
        },
        options: baseOptions(colors, { scales: axes(colors, "y") })
    });

    renderAnalyticsChart("ageBarChart", {
        type: "bar",
        data: {
            labels: payload.age_bar.labels,
            datasets: [{
                label: "Anemic cases",
                data: payload.age_bar.values,
                backgroundColor: hexToRgba(colors.anemic, 0.85),
                borderRadius: 8,
                maxBarThickness: 44
            }]
        },
        options: baseOptions(colors, { scales: axes(colors, "y") })
    });

    renderAnalyticsChart("confidenceBarChart", {
        type: "bar",
        data: {
            labels: payload.confidence_bar.labels,
            datasets: [{
                label: "Scans",
                data: payload.confidence_bar.values,
                backgroundColor: hexToRgba(colors.primary, 0.85),
                borderRadius: 8,
                maxBarThickness: 32
            }]
        },
        options: baseOptions(colors, { indexAxis: "y", scales: axes(colors, "x") })
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const payloadElement = document.getElementById("analyticsPayload");
    if (!payloadElement) return;

    const payload = JSON.parse(payloadElement.textContent);
    renderAll(payload);
    document.addEventListener("anemiavision:themechange", () => renderAll(payload));
});
