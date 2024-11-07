// Scripts
document.addEventListener('DOMContentLoaded', () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
   
    setDarkTheme(isDarkMode);
});


document.getElementById('theme-toggle').addEventListener('click', function() {
    var darkStyles = document.getElementById('dark-styles');
    if (darkStyles.disabled) {
        setDarkTheme(true);
    } else {
        setDarkTheme(false);
    }
});


function setDarkTheme(isDarkMode){
    var themeToggleBtn = document.getElementById('theme-toggle');
    var darkStyles = document.getElementById('dark-styles');
    if (isDarkMode) {
        // If it is, enable it and change the button text
        darkStyles.disabled = false;
        localStorage.setItem('darkMode', isDarkMode);
        console.log("Stored dark theme in local storage");
        themeToggleBtn.textContent = 'Light Mode';
    } else {
        // If it isn't, disable it and change the button text
        darkStyles.disabled = true;
        localStorage.setItem('darkMode', isDarkMode);
        console.log("Stored light theme in local storage");
        themeToggleBtn.textContent = 'Dark Mode';
    }
}


