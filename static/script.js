// Scripts

document.addEventListener('DOMContentLoaded', () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkTheme(isDarkMode);

    // Highlight current tab based on section in view
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    const updateActiveTab = () => {
        let currentSection = null;

        // Find the currently visible section
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2.5 && rect.bottom >= window.innerHeight / 2.5) {
                currentSection = section.id;
            }
        });

        // Update the nav links
        navLinks.forEach(link => {
            if (link.getAttribute("href").substring(1) === currentSection) {
                link.classList.add("active");
                link.setAttribute("aria-selected", "true");
            } else {
                link.classList.remove("active");
                link.setAttribute("aria-selected", "false");
            }
        });
    };

    // Update tabs on scroll and on page load
    window.addEventListener("scroll", updateActiveTab);
    updateActiveTab();
});

document.getElementById('theme-toggle').addEventListener('click', function() {
    var darkStyles = document.getElementById('dark-styles');
    if (darkStyles.disabled) {
        setDarkTheme(true);
    } else {
        setDarkTheme(false);
    }
});


function setDarkTheme(isDarkMode) {
    var themeToggleBtn = document.getElementById('theme-toggle');
    var darkStyles = document.getElementById('dark-styles');
    var icon = themeToggleBtn.querySelector('i');
    
    if (isDarkMode) {
        darkStyles.disabled = false;
        localStorage.setItem('darkMode', isDarkMode);
        console.log("Setting dark theme");
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        darkStyles.disabled = true;
        localStorage.setItem('darkMode', isDarkMode);
        console.log("Setting light theme");
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Add this function to update SVG colors on page load
document.addEventListener('DOMContentLoaded', () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkTheme(isDarkMode);
});

document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('mqtt-popup');
    const topicName = document.getElementById('mqtt-topic-name');
    const example = document.getElementById('mqtt-example');

    document.querySelectorAll('.mqtt-topic').forEach(topic => {
        topic.addEventListener('click', function(e) {
            e.preventDefault();
            topicName.textContent = this.dataset.topic;
            example.textContent = JSON.stringify(JSON.parse(this.dataset.example), null, 2);
            popup.style.display = 'block';
        });
    });

    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
        if (!popup.contains(e.target) && !e.target.classList.contains('mqtt-topic')) {
            popup.style.display = 'none';
        }
    });
});



