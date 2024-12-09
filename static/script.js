// Scripts

document.addEventListener('DOMContentLoaded', () => {
    // Theme handling
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkTheme(isDarkMode);

    // Handle tab highlighting
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    const updateActiveTab = () => {
        let currentSection = null;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2.5 && rect.bottom >= window.innerHeight / 2.5) {
                currentSection = section.id;
            }
        });

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

    window.addEventListener("scroll", updateActiveTab);
    updateActiveTab();

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', function() {
        var darkStyles = document.getElementById('dark-styles');
        setDarkTheme(darkStyles.disabled);
    });

    // MQTT popup handling
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

    document.addEventListener('click', function(e) {
        if (!popup.contains(e.target) && !e.target.classList.contains('mqtt-topic')) {
            popup.style.display = 'none';
        }
    });

    // Code snippet expand/collapse
    document.querySelectorAll('.code-snippet').forEach(snippet => {
        const button = snippet.querySelector('.expand-code');
        if (button) {
            button.addEventListener('click', () => {
                snippet.classList.toggle('expanded');
                button.classList.toggle('expanded');
            });
        }
    });

    // Load code files into snippets
    document.querySelectorAll('.code-snippet[data-code-src]').forEach(async snippet => {
        const codePath = snippet.dataset.codeSrc;
        const codeBlock = snippet.querySelector('code');
        
        try {
            const response = await fetch(codePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const code = await response.text();
            
            // Get language from file extension
            const fileExt = codePath.split('.').pop().toLowerCase();
            let languageClass = 'language-';
            
            // Map file extensions to Prism language classes
            switch(fileExt) {
                case 'ino':
                    languageClass += 'arduino';
                    break;
                case 'cpp':
                case 'h':
                case 'hpp':
                    languageClass += 'cpp';
                    break;
                case 'py':
                    languageClass += 'python';
                    break;
                default:
                    languageClass += fileExt;
            }
            
            // Set the language class and code content
            codeBlock.className = languageClass;
            codeBlock.textContent = code;
            
            // Force Prism to highlight
            Prism.highlightElement(codeBlock);
            
            console.log('Language class:', languageClass);
            console.log('Available Prism languages:', Object.keys(Prism.languages));
            
        } catch (error) {
            console.error('Error loading code file:', error);
            codeBlock.textContent = '// Error loading code file';
        }
    });
});

function setDarkTheme(isDarkMode) {
    var themeToggleBtn = document.getElementById('theme-toggle');
    var darkStyles = document.getElementById('dark-styles');
    var icon = themeToggleBtn.querySelector('i');
    
    if (isDarkMode) {
        darkStyles.disabled = false;
        localStorage.setItem('darkMode', true);
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        darkStyles.disabled = true;
        localStorage.setItem('darkMode', false);
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}


