// Scripts
document.addEventListener('DOMContentLoaded', () => {
    const socket = io.connect(`http://${document.domain}:${location.port}`);
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const slider = document.getElementById('setpoint-slider');
    const setpointDisplay = document.getElementById('setpoint-value');
    const deviceDropdown = document.getElementById('device-dropdown');
    const now = new Date();
    const timeZoneOffset = now.getTimezoneOffset() * 60; // offset minutes to seconds
    console.log('Time zone offset:', timeZoneOffset);
    setDarkTheme(isDarkMode);

    // Listen for updated values
    socket.on('values_updated', (newValues) => {
        const selectedDeviceId = deviceDropdown.value;
        fetch(`/get_device_data/${selectedDeviceId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Updating device data');
                updateDeviceData(data);
            })
            .catch(error => {
                console.error('Error fetching device data:', error);
            });
    });

    // Log and handle dropdown changes
    deviceDropdown.addEventListener('change', (event) => {
        const selectedDeviceId = event.target.value;
        console.log('Selected device ID:', selectedDeviceId);

        // Fetch the device data from the server
        fetch(`/get_device_data/${selectedDeviceId}`)
            .then(response => response.json())
            .then(data => {
                updateDeviceData(data);
            })
            .catch(error => {
                console.error('Error fetching device data:', error);
            });
    });

    // Update the display value when the slider changes
    // Update the display value and handle slider changes
    if (slider) {
        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value).toFixed(1); // Add one decimal place
            setpointDisplay.textContent = value + '°C';

            // Send the updated setpoint value to the server
            const selectedDeviceId = deviceDropdown.value; // Get the currently selected device ID
            if (selectedDeviceId) {
                fetch(`/adjust_setpoint/${selectedDeviceId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ setpoint: value }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update setpoint');
                    }
                    console.log('Setpoint updated successfully!');
                })
                .catch(error => {
                    console.error('Error updating setpoint:', error);
                });
            } else {
                console.error('No device selected to update the setpoint.');
            }
        });
    } else {
        console.error("Setpoint slider not found!");
    }
});

// Constant variables
let lastFetchTime = null; // To store the last fetch timestamp
// Get local time zone offset
let timeZoneOffset;


// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
    const now = Date.now() / 1000; // Current time in seconds
    const timeSince = now - timestamp //+ timeZoneOffset;
    return timeSince < 60 ? `${Math.floor(timeSince)} seconds ago` : "more than 1 minute ago";
};

// Function to update displayed time since last fetch
const updateTimeSinceLastFetch = () => {
    if (lastFetchTime) {
        document.getElementById("last_updated").textContent = formatTimestamp(lastFetchTime);
    }
};


// Function to fetch and display current filter alpha value
const fetchCurrentAlpha = () => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/get_current_alpha/${deviceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.alpha !== undefined) {
                document.getElementById("filter_alpha").textContent = data.alpha;
            } else {
                console.error('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching alpha:', error);
        });
};

// Function to adjust filter alpha
const adjust_filter = (adjustment) => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/adjust_filter_alpha/${deviceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ adjustment })
    })
    .then(response => {
        if (!response.ok) {
            alert("Failed to adjust filter alpha.");
        }
    })
    .finally(fetchCurrentAlpha); // Refresh the alpha value
};


// Function to fetch and display current kp
const fetchCurrentkp = () => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/get_current_kp/${deviceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.kp !== undefined) {
                document.getElementById("pid_kp_value").textContent = data.kp;
            } else {
                console.error('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching kp:', error);
        });
};


// Function to adjust controller kp
const adjust_kp = (adjustment) => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/adjust_kp/${deviceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ adjustment })
    })
    .then(response => {
        if (!response.ok) {
            alert("Failed to adjust kp.");
        }
    })
    .finally(fetchCurrentkp); // Refresh the alpha value
};


// Function to fetch and display current kp
const fetchCurrentti = () => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/get_current_ti/${deviceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.ti !== undefined) {
                document.getElementById("pid_ti_value").textContent = data.ti;
            } else {
                console.error('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching ti:', error);
        });
};


// Function to adjust controller kp
const adjust_ti = (adjustment) => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/adjust_ti/${deviceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ adjustment })
    })
    .then(response => {
        if (!response.ok) {
            alert("Failed to adjust ti.");
        }
    })
    .finally(fetchCurrentti); // Refresh the alpha value
};


// Function to fetch and display current kp
const fetchCurrenttd = () => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/get_current_td/${deviceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.td !== undefined) {
                document.getElementById("pid_td_value").textContent = data.td;
            } else {
                console.error('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching td:', error);
        });
};


// Function to adjust controller kp
const adjust_td = (adjustment) => {
    const deviceId = document.getElementById("device-dropdown").value; // Get selected device ID
    fetch(`/adjust_td/${deviceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ adjustment })
    })
    .then(response => {
        if (!response.ok) {
            alert("Failed to adjust td.");
        }
    })
    .finally(fetchCurrenttd); // Refresh the alpha value
};







// Function to update fields with fetched data
function updateDeviceData(data) {
    // Function to safely get values or return fallback
    const safeGet = (key, fallback = '--') => {
        return (key in data && data[key] != null) ? data[key] : fallback;
    };

    // Update the displayed values on the page
    document.getElementById('current_temperature').textContent = safeGet('temperature');
    // Update last fetch timestamp
    if (safeGet('temperature_recorded_at')) {
        lastFetchTime = safeGet('temperature_recorded_at')
        document.getElementById("last_updated").textContent = formatTimestamp(lastFetchTime);
    } else {
        document.getElementById("last_updated").textContent = "No data";
    }
    document.getElementById('setpoint-value').textContent = safeGet('setpoint') + '°' + safeGet('setpoint_unit');

    const setpoint = safeGet('setpoint');
    document.getElementById('setpoint-slider').value = setpoint != null ? setpoint : 0; // Default to 0 if null

    document.getElementById('filter_alpha').textContent = safeGet('alpha');
    document.getElementById('pid_kp_value').textContent = safeGet('kp');
    document.getElementById('pid_ti_value').textContent = safeGet('ti');
    document.getElementById('pid_td_value').textContent = safeGet('td');

    console.log('Values updated');
}


// Set an interval to update the time display every 200 milliseconds
setInterval(updateTimeSinceLastFetch, 200);

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
