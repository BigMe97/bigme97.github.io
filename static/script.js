// Scripts

document.addEventListener('DOMContentLoaded', () => {
    // Theme handling
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkTheme(isDarkMode);

    // Handle tab highlighting and smooth scrolling
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    const updateActiveTab = () => {
        let currentSection = null;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            
            if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
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

    // Add smooth scrolling to nav tabs specifically
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const targetPosition = targetElement.offsetTop;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Handle all other internal links for smooth scrolling to center
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (!anchor.classList.contains('nav-link')) { // Exclude nav-links
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').slice(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const targetPosition = targetElement.offsetTop - (window.innerHeight / 2) + 60;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });

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

    // Expand/collapse functionality
    document.querySelectorAll('.expand-code').forEach(button => {
        button.addEventListener('click', () => {
            const codeSnippetContent = button.parentElement;
            codeSnippetContent.classList.toggle('expanded');
            button.querySelector('i').classList.toggle('fa-chevron-down');
            button.querySelector('i').classList.toggle('fa-chevron-up');
        });
    });

    // Load code files into snippets
    document.querySelectorAll('.code-snippet-content[data-code-src]').forEach(async snippet => {
        const codePath = snippet.dataset.codeSrc;
        const codeBlock = snippet.querySelector('code');
        
        try {
            const response = await fetch(codePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const code = await response.text();
            
            // Set the code content
            codeBlock.textContent = code;
            
            // Force Prism to highlight
            Prism.highlightElement(codeBlock);
            
        } catch (error) {
            console.error('Error loading code file:', error);
            codeBlock.textContent = '// Error loading code file';
        }
    });

    // Simple header collapse with smooth transition
    const headerTop = document.querySelector('.header-top');
    
    // Initial check in case page is loaded scrolled down
    if (window.scrollY > 0) {
        headerTop.classList.add('collapsed');
    }
    
    window.addEventListener('scroll', () => {
        if (window.scrollY === 0) {
            // At the top of the page
            headerTop.classList.remove('collapsed');
        } else {
            // Scrolled away from top
            headerTop.classList.add('collapsed');
        }
    }, { passive: true });

    // Tab switching functionality inside code snippet
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            // Get the parent code snippet container
            const codeSnippetContainer = tab.closest('.code-snippet');
            
            // Only affect tabs and content within this container
            codeSnippetContainer.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            codeSnippetContainer.querySelectorAll('.code-snippet-content').forEach(snippet => snippet.style.display = 'none');

            // Activate the clicked tab and show the corresponding snippet content
            tab.classList.add('active');
            codeSnippetContainer.querySelector(`#${target}`).style.display = 'block';
        });
    });

    // Handle both code snippets and image references
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (!targetElement) return; // Exit if target doesn't exist
            
            e.preventDefault();
            e.stopPropagation();
            
            // Handle code snippets
            if (targetId.startsWith('snippet-')) {
                const codeContainer = targetElement.closest('.code-snippet');
                const tabItem = codeContainer.querySelector(`[data-tab="${targetId}"]`);
                
                if (tabItem) {
                    codeContainer.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
                    codeContainer.querySelectorAll('.code-snippet-content').forEach(content => content.style.display = 'none');
                    
                    tabItem.classList.add('active');
                    targetElement.style.display = 'block';
                    
                    setTimeout(() => {
                        targetElement.classList.add('highlight-effect');
                        codeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        setTimeout(() => {
                            targetElement.classList.remove('highlight-effect');
                        }, 1500);
                    }, 50);
                }
            } 
            // Handle image containers
            else if (targetId.startsWith('img_')) {
                targetElement.classList.add('highlight-effect');
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    targetElement.classList.remove('highlight-effect');
                }, 1500);
            }
            
            return false;
        });
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

// Map file extensions to Prism language classes and labels
switch(fileExt) {
    case 'ino':
        languageClass += 'arduino';
        languageLabel = 'Arduino';
        languageIcon = 'fas fa-microchip';
        break;
    case 'cpp':
    case 'h':
    case 'hpp':
        languageClass += 'cpp';
        languageLabel = 'C++';
        languageIcon = 'fas fa-code';
        break;
    case 'py':
        languageClass += 'python';
        languageLabel = 'Python';
        languageIcon = 'fab fa-python';
        break;
    case 'sql':
        languageClass += 'sql';
        languageLabel = 'SQL';
        languageIcon = 'fas fa-database';
        break;
    case 'html':
        languageClass += 'markup';
        languageLabel = 'HTML';
        languageIcon = 'fab fa-html5';
        break;
    case 'css':
        languageClass += 'css';
        languageLabel = 'CSS';
        languageIcon = 'fab fa-css3-alt';
        break;
    case 'js':
        languageClass += 'javascript';
        languageLabel = 'JavaScript';
        languageIcon = 'fab fa-js';
        break;
    default:
        languageClass += fileExt;
        languageLabel = fileExt.toUpperCase();
        languageIcon = 'fas fa-file-code';
}


