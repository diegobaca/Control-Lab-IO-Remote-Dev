// Initialize global variables
var isConnected = false;  // Initialize the isConnected variable
var isAttemptingConnection = false; // Global flag to track connection attempts
var isDisconnecting = false; // Global flag to track disconnection attempts
var is_sending = false; // Initialize the is_sending variable if needed

function sendCommand(url, output_id) {
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(() => {
        console.log('Command sent: ' + url);
        // Depending on the command sent, you may want to update the UI or connection status
        if (output_id === 0) {
            // Specific logic for handling responses to certain commands, if necessary
            // For example, updating UI elements related to connection status
            updateConnectionStatus();
        } else {
            // Handle other types of commands and their responses here
            // Possibly update UI elements that are not directly related to connection status
        }
    })
    .catch(error => {
        console.error('Error sending command:', error);
        // Handle errors, for example, by showing an error message to the user
    });
}

function updateButtonStates() {
    var xhrPowerLevels = new XMLHttpRequest();
    xhrPowerLevels.open("GET", "/get_power_levels", true);
    xhrPowerLevels.onload = function () {
        var dataPower = JSON.parse(xhrPowerLevels.responseText);
        var powerLevels = dataPower.power_levels;

        for (var i = 1; i <= 8; i++) {
            var powerLevelIcon = 'counter_' + (powerLevels[i - 1] + 1);
            document.getElementById('power-level-' + i).innerHTML = '<span class="material-symbols-outlined">' + powerLevelIcon + '</span>';
            // Enable/disable increase and decrease buttons based only on connection status and power levels
            document.getElementById('increase-' + i).disabled = !isConnected || (powerLevels[i - 1] == 7);
            document.getElementById('decrease-' + i).disabled = !isConnected || (powerLevels[i - 1] == 0);
        }
    };
    xhrPowerLevels.send();
}

function updateDirectionLabels() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/get_direction_states", true);
    xhr.onload = function () {
        var data = JSON.parse(xhr.responseText);
        var directionStates = data.direction_states;

        for (var i = 1; i <= 8; i++) {
            var directionIcon = document.getElementById('direction-icon-' + i);
            if (directionStates[i - 1]) {
                directionIcon.textContent = 'rotate_right'; // Icon for "Right"
            } else {
                directionIcon.textContent = 'rotate_left'; // Icon for "Left"
            }
        }
    };
    xhr.send();
}

function updateOnOffLabels() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/get_on_off_states", true);
    xhr.onload = function () {
        var data = JSON.parse(xhr.responseText);
        console.log("Received On/Off States:", data);  // Debugging line
        var onOffStates = data.on_off_states;

        for (var i = 1; i <= 8; i++) {
            var onOffButton = document.getElementById('on-off-' + i);
            var onOffLabel = onOffStates[i - 1] ? 'On' : 'Off';
            onOffButton.textContent = onOffLabel;

            onOffButton.classList.remove('red', 'green', 'orange', 'pulse'); // Remove all classes
            if (onOffLabel === 'On') {
                if (is_sending) {
                    onOffButton.classList.add('green');
                    if (is_sending) onOffButton.classList.add('pulse');  // Add pulse only if is_sending is true
                } else {
                    onOffButton.classList.add('orange');
                }
            } else {
                onOffButton.classList.add('red');
            }
        }

        // Call updateButtonStates after updating on-off labels to ensure buttons reflect the new on-off states
        updateButtonStates();
    };
    xhr.send();
}

// Update Connection Status with refactored logic for simplicity
function updateConnectionStatus() {
    fetch('/get_connection_status')
        .then(response => response.json())
        .then(data => {
            isConnected = data.is_connected;
            is_sending = data.is_sending;  // Assuming your backend sends this
            updateConnectionButtonState(data); // Pass the entire data object for processing
        })
        .catch(error => console.error('Error fetching connection status:', error));
}

// Refactored to dynamically update based on the server's response
function updateConnectionButtonState(data) {
    const connectionButton = document.getElementById('connection-btn');
    const connectionIcon = document.getElementById('connection-icon');

    // Reset styles and disable state
    connectionButton.classList.remove('black', 'green', 'red', 'pulse', 'disable-pointer');
    connectionIcon.textContent = 'link'; // Default icon
    connectionButton.disabled = false; // Enabled by default

    if (data.is_connected) {
        connectionButton.classList.add('green');
        connectionIcon.textContent = 'power_settings_new';
    } else if (data.is_disconnecting) {
        connectionButton.classList.add('black', 'pulse');
        connectionIcon.textContent = 'link_off';
        connectionButton.disabled = true;
    } else if (data.error) {
        connectionButton.classList.add('red');
        connectionIcon.textContent = 'refresh';
    } else {
        connectionButton.classList.add('black');
        connectionIcon.textContent = 'link';
    }
}

function toggleSending() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/toggle_sending", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        console.log('Sending state toggled');
        updateSendingStatus();
    };
    xhr.send();
}

function updateSendingStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/get_sending_status", true);
    xhr.onload = function () {
        var data = JSON.parse(xhr.responseText);
        is_sending = data.is_sending;  // Update the is_sending variable
        var sendingButton = document.getElementById('sending-btn');
        var sendingIcon = document.getElementById('sending-icon');

        // Update button classes and icon based on sending status
        if (is_sending) {
            sendingButton.classList.add('green', 'pulse'); // Add green color and pulse effect
            sendingButton.classList.remove('black', 'orange'); // Remove black and orange color
            sendingIcon.textContent = 'play_arrow'; // Use the play_arrow icon

            // Change any orange on/off buttons to green and add pulse
            for (var i = 1; i <= 8; i++) {
                var onOffButton = document.getElementById('on-off-' + i);
                if (onOffButton.textContent === 'On') {
                    onOffButton.classList.add('green', 'pulse');
                    onOffButton.classList.remove('orange');
                }
            }
        } else {
            sendingButton.classList.add('orange'); // Add orange color
            sendingButton.classList.remove('green', 'black', 'pulse'); // Remove green color, black color, and pulse effect
            sendingIcon.textContent = 'pause'; // Use the pause icon

            // Change any green on/off buttons to orange and remove pulse
            for (var i = 1; i <= 8; i++) {
                var onOffButton = document.getElementById('on-off-' + i);
                if (onOffButton.textContent === 'On') {
                    onOffButton.classList.add('orange');
                    onOffButton.classList.remove('green', 'pulse');
                }
            }
        }
    };
    xhr.send();
}

// Global variable to store the saved state
var savedState = {
    On: [],
    Dir: [],
    Pow: []
};

function saveOutputValues() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/save_state", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log("State saved successfully.");
        } else {
            console.log("Failed to save state.");
        }
    };
    xhr.send();
}

function loadOutputValues() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/load_state", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log("State loaded successfully.");
            // Update UI based on the loaded state
            updateButtonStates(0);
            updateDirectionLabels();
            updateOnOffLabels();
        } else {
            console.log("Failed to load state.");
        }
    };
    xhr.send();
}

function updateButtonAccessibility(isConnected) {
    var buttons = document.querySelectorAll('.btn-floating'); // Select all floating buttons
    var outputLabels = document.querySelectorAll('.output-label'); // Select all output labels
    var powerIcons = document.querySelectorAll('.power-level-display'); // Select all power level display icons

    buttons.forEach(function (button) {
        // Disable all buttons except the connection button when disconnected
        if (button.id !== 'connection-btn') {
            button.disabled = !isConnected;
        }
    });

    // Change color of output labels and power icons based on connection status
    outputLabels.forEach(function (label) {
        label.style.color = isConnected ? 'black' : '#DFDFDF'; // Default color when connected, grey when disconnected
    });

    powerIcons.forEach(function (icon) {
        icon.style.color = isConnected ? 'black' : '#DFDFDF'; // Default color when connected, grey when disconnected
    });
}

// Periodically Check Connection with simplified logic
function periodicallyCheckConnection() {
    setInterval(updateConnectionStatus, 1000); // Check every 1 second
}

// Simplified window.onload and event listener setup
window.onload = function () {
    updateSendingStatus(); // Fetch and update sending status on page load
    periodicallyCheckConnection(); // Start checking the connection status periodically
};

window.addEventListener('load', () => {
    requestAnimationFrame(() => {
        document.body.classList.remove('no-transition');
    });
});
