var isConnected = false;  // Initialize the isConnected variable
var isAttemptingConnection = false; // Global flag to track connection attempts
var isDisconnecting = false; // Global flag to track disconnection attempts
var is_sending = false; // Initialize the is_sending variable if needed

function sendCommand(url, output_id) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        console.log('Command sent: ' + url);
        if (output_id === 0) {
            if (url === '/toggle_connection' && !isConnected) {
                var connectionButton = document.getElementById('connection-btn');
                var connectionIcon = document.getElementById('connection-icon');

                // Visually indicate an attempt to connect without disabling the button
                connectionButton.classList.add('black', 'pulse');
                connectionButton.classList.remove('red', 'green');
                connectionIcon.textContent = 'link';

                // Apply disable-pointer without setting disabled to true
                connectionButton.classList.add('disable-pointer');

                isAttemptingConnection = true;
                checkAndUpdateConnectionStatus(); // Ensure this function is properly defined and called
            } else if (url === '/toggle_connection' && isConnected) {
                handleDisconnection(url);
            } else {
                updateConnectionStatus();
            }
        } else {
            updateButtonStates(output_id);
            updateDirectionLabels();
            updateOnOffLabels();
        }
    };
    xhr.send();
}

function handleDisconnection(url) {
    if (url === '/toggle_connection' && isConnected) {
        // Begin "Is Disconnecting" state with a 6-second delay
        isDisconnecting = true; // Mark as disconnecting
        var connectionButton = document.getElementById('connection-btn');
        var connectionIcon = document.getElementById('connection-icon');
        connectionButton.classList.add('black', 'pulse');
        connectionButton.classList.remove('green', 'red');
        connectionIcon.textContent = 'link_off';
        connectionButton.disabled = true; // Disable the button immediately to prevent further clicks
    
        updateButtonAccessibility(false); // Disable all other buttons immediately
    
        // Update the sending button icon to indicate sending is paused/stopped
        var sendingButton = document.getElementById('sending-btn');
        var sendingIcon = document.getElementById('sending-icon');
        sendingIcon.textContent = 'pause'; // Update to reflect the paused/stopped state
        sendingButton.classList.add('orange'); // Change color to indicate paused/stopped state
        sendingButton.classList.remove('green', 'pulse'); // Remove classes that indicate active sending
    
        // Immediately update on/off buttons to reflect they are disabled
        for (var i = 1; i <= 8; i++) {
            var onOffButton = document.getElementById('on-off-' + i);
            onOffButton.classList.add('red'); // Use red to indicate off or disabled
            onOffButton.classList.remove('green', 'orange', 'pulse'); // Remove any classes that indicate on or active state
        }
    
        // Wait for 6 seconds before resetting the disconnecting state and updating the UI
        setTimeout(function() {
            // Send a request to the server to confirm if the connection has been successfully closed
            var checkConnectionXhr = new XMLHttpRequest();
            checkConnectionXhr.open("GET", "/get_connection_status", true);
            checkConnectionXhr.onload = function () {
                var statusData = JSON.parse(checkConnectionXhr.responseText);
                if (!statusData.is_connected) {
                    // Successfully disconnected
                    isDisconnecting = false; // Reset disconnecting flag
                    connectionButton.disabled = false; // Re-enable the button
                    updateConnectionStatus(); // Reflect disconnected state in the UI
                } else {
                    // Handle unsuccessful disconnection, e.g., retry or notify user
                    console.error("Disconnection failed, retrying...");
                    // Optionally, insert retry logic or user notification here
                }
            };
            checkConnectionXhr.send();
        }, 6000); // Check status after 6 seconds delay
    }
}

function checkAndUpdateConnectionStatus() {
    var checkConnectionXhr = new XMLHttpRequest();
    checkConnectionXhr.open("GET", "/get_connection_status", true);
    checkConnectionXhr.onload = function () {
        var statusData = JSON.parse(checkConnectionXhr.responseText);
        if (statusData.is_connected) {
            // If server says connected but UI is disconnected, update UI to connected state
            isConnected = true; // Update isConnected flag
            updateConnectionStatus(); // Update UI to reflect correct connection status
        } else {
            // If not connected, proceed with normal connection attempt logic
            isAttemptingConnection = true; // Set flag to indicate connection attempt
            // Update UI to show connection attempt state if needed
            var connectionButton = document.getElementById('connection-btn');
            var connectionIcon = document.getElementById('connection-icon');
            connectionButton.classList.add('black', 'pulse', 'disable-pointer'); // Also disable pointer events
            connectionButton.classList.remove('red', 'green');
            connectionIcon.textContent = 'link';
        }
    };
    checkConnectionXhr.send();
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

function updateConnectionStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/get_connection_status", true);
    xhr.onload = function () {
        var data = JSON.parse(xhr.responseText);
        var connectionButton = document.getElementById('connection-btn');
        var connectionIcon = document.getElementById('connection-icon');

        if (data.is_connected) {
            // "Connected" state
            connectionButton.classList.add('green');
            connectionButton.classList.remove('black', 'red', 'pulse', 'disable-pointer'); // Also re-enable pointer events
            connectionIcon.textContent = 'power_settings_new';
            isConnected = true;
        } else {
            if (isDisconnecting) {
                // "Is Disconnecting" state
                connectionButton.classList.add('black', 'pulse');
                connectionButton.classList.remove('green', 'red');
                connectionIcon.textContent = 'link_off';
            } else if (isAttemptingConnection) {
                // Here, you check if the attempt to connect has failed
                // "No connection found" state should be handled here
                connectionButton.classList.add('red');
                connectionButton.classList.remove('black', 'green', 'pulse', 'disable-pointer');
                connectionIcon.textContent = 'refresh'; // Indicate no connection found
                // Optionally, you can add a delay or a mechanism to revert the icon back to 'link' after some time
            } else {
                // "Default / Disconnected" state
                connectionButton.classList.add('black');
                connectionButton.classList.remove('green', 'red', 'pulse', 'disable-pointer');
                connectionIcon.textContent = 'link';
            }
            isConnected = false;
        }

        isAttemptingConnection = false;
        // Do not reset isDisconnecting here; let the setTimeout handle it to respect the 6-second duration

        // Only re-enable the button if not in the process of disconnecting
        if (!isDisconnecting) {
            connectionButton.disabled = false;
        }

        updateButtonAccessibility(data.is_connected);
        updateButtonStates();

        // Now also handle sending status
        is_sending = data.is_sending;  // Update is_sending based on the server response
        updateSendingStatus();  // Update the sending button UI
    };
    xhr.send();
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

// Function to check the connection status periodically
function periodicallyCheckConnection() {
    setInterval(function () {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/check_connection", true);
        xhr.onload = function () {
            var data = JSON.parse(xhr.responseText);

            // If the connection was lost and now it's back
            if (data.is_connected && !isConnected) {
                isConnected = true;
                is_sending = data.is_sending; // Update is_sending based on the server response
                updateConnectionStatus(); // Update UI to reflect connection is back
                updateButtonAccessibility(isConnected);
                updateSendingStatus(); // Update the sending button UI
            } 
            
            // If the connection was there and now it's lost
            else if (!data.is_connected && isConnected) {
                isConnected = false;
                is_sending = data.is_sending; // Update is_sending based on the server response
                updateConnectionStatus(); // Update UI to reflect connection is lost
                updateButtonAccessibility(isConnected);
                updateSendingStatus(); // Update the sending button UI
            }

            // Regardless of connection status, update the UI with the latest system states
            updateOnOffLabels();
            updateDirectionLabels();
            updateButtonStates();
            updateSendingStatus();  // Make sure this is called here to update sending status regularly
        };
        xhr.send();
    }, 1000); // Check every 1000 milliseconds (1 second)
}

window.onload = function () {
    // Fetch and set the initial state of is_sending
    updateSendingStatus(); // Fetch and update sending status on page load

    // Update other UI elements based on the initial state
    updateButtonStates(0);
    updateConnectionStatus();
    updateDirectionLabels();
    updateOnOffLabels();

    // Initially, assume disconnected and disable buttons
    updateButtonAccessibility(false);
    // Start checking the connection status periodically
    periodicallyCheckConnection();

};

window.addEventListener('load', () => {
    requestAnimationFrame(() => {
        document.body.classList.remove('no-transition');
    });
});
