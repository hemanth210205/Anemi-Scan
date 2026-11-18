function updateCurrentDateTime() {
    const target = document.getElementById("currentDateTime");
    if (!target) return;

    const formatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });
    target.textContent = formatter.format(new Date());
}

function applyStoredPreferences() {
    const html = document.documentElement;
    const body = document.body;
    let storedTheme = null;
    let largeText = false;
    try {
        storedTheme = localStorage.getItem("anemiscan-theme");
        largeText = localStorage.getItem("anemiscan-large-text") === "true";
    } catch (error) {
        /* storage unavailable */
    }

    if (storedTheme === "dark") {
        html.setAttribute("data-theme", "dark");
    }
    if (largeText) {
        body.classList.add("large-text");
    }
}

function bindPreferences() {
    const html = document.documentElement;
    const body = document.body;
    const darkModeToggle = document.getElementById("darkModeToggle");
    const largeTextToggle = document.getElementById("largeTextToggle");

    if (darkModeToggle) {
        darkModeToggle.setAttribute("aria-pressed", String(html.getAttribute("data-theme") === "dark"));
        darkModeToggle.addEventListener("click", () => {
            const isDark = html.getAttribute("data-theme") === "dark";
            html.setAttribute("data-theme", isDark ? "light" : "dark");
            localStorage.setItem("anemiscan-theme", isDark ? "light" : "dark");
            darkModeToggle.setAttribute("aria-pressed", String(!isDark));
            document.dispatchEvent(new CustomEvent("anemiscan:themechange"));
        });
    }

    if (largeTextToggle) {
        largeTextToggle.setAttribute("aria-pressed", String(body.classList.contains("large-text")));
        largeTextToggle.addEventListener("click", () => {
            body.classList.toggle("large-text");
            const enabled = body.classList.contains("large-text");
            localStorage.setItem("anemiscan-large-text", String(enabled));
            largeTextToggle.setAttribute("aria-pressed", String(enabled));
        });
    }
}

function bindSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const setOpen = (open) => {
        sidebar.classList.toggle("open", open);
        document.body.classList.toggle("sidebar-open", open);
    };

    document.querySelectorAll("[data-sidebar-open]").forEach((button) => {
        button.addEventListener("click", () => setOpen(true));
    });
    document.querySelectorAll("[data-sidebar-close]").forEach((button) => {
        button.addEventListener("click", () => setOpen(false));
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
    });
}

function animateConfidenceMeters() {
    document.querySelectorAll(".confidence-fill[data-progress]").forEach((bar) => {
        const progress = Number(bar.dataset.progress || 0);
        requestAnimationFrame(() => {
            bar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        });
    });
}

function bindToasts() {
    if (!window.bootstrap) return;
    document.querySelectorAll(".toast").forEach((toastElement) => {
        const toast = new window.bootstrap.Toast(toastElement);
        toast.show();
    });
}

function bindKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
        const target = event.target;
        const tagName = target?.tagName?.toLowerCase();
        const isTypingField =
            tagName === "input" ||
            tagName === "textarea" ||
            tagName === "select" ||
            Boolean(target?.isContentEditable);

        if (isTypingField || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (event.key === "n" || event.key === "N") {
            window.location.href = "/scan";
        }
        if (event.key === "h" || event.key === "H") {
            window.location.href = "/history";
        }
    });
}

function bindPrintButtons() {
    ["printReportButton", "printReportButtonSecondary"].forEach((id) => {
        const button = document.getElementById(id);
        if (!button) return;
        button.addEventListener("click", () => window.print());
    });
}

function revealSkeletons() {
    window.setTimeout(() => {
        document.querySelectorAll("[data-chart-shell]").forEach((shell) => {
            shell.classList.remove("is-loading");
        });
    }, 1200);
}

document.addEventListener("DOMContentLoaded", () => {
    applyStoredPreferences();
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000 * 30);
    bindPreferences();
    bindSidebar();
    animateConfidenceMeters();
    bindToasts();
    bindKeyboardShortcuts();
    bindPrintButtons();
    revealSkeletons();

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
