document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Default to dark mode if no preference saved
    let currentTheme = localStorage.getItem('theme') || 'dark';

    // Apply the saved/default theme initially
    applyTheme(currentTheme);

    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
            localStorage.setItem('theme', currentTheme);
        });
    }

    function applyTheme(theme) {
        const icon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
        if (theme === 'dark') {
            htmlEl.setAttribute('data-theme', 'dark');
            if (icon) icon.textContent = 'light_mode';
        } else {
            htmlEl.setAttribute('data-theme', 'light');
            if (icon) icon.textContent = 'dark_mode';
        }
    }
    // Demo toggle interactivity
    const demoToggle = document.querySelector('.toggle-bg');
    if (demoToggle) {
        demoToggle.addEventListener('click', () => {
            demoToggle.classList.toggle('active');
            const card = demoToggle.closest('.popup-card');
            const subtitle = card.querySelector('.card-subtitle');
            if (demoToggle.classList.contains('active')) {
                subtitle.textContent = 'TV Mode Active';
            } else {
                subtitle.textContent = 'Enable YouTube TV interface';
            }
        });
    }
});
