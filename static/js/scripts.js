var isConnected = false;  // Initialize the isConnected variable
var isAttemptingConnection = false; // Global flag to track connection attempts
var isDisconnecting = false; // Global flag to track disconnection attempts
var is_sending = false; // Initialize the is_sending variable if needed
var isErrorState = false;

function sendCommand(url, output_id) {
    if (url === '/toggle_connection' && !isConnected) {
        checkConnectionAttemptStatus(function(isAttempting) {
            if (isAttempting) {
                alert('Another connection attempt is already in progress.');
            } else {
                // Immediate UI feedback for attempting to connect
                var connectionButton = document.getElementById('connection-btn');
                var connectionIcon = document.getElementById('connection-icon');
                connectionButton.classList.add('black', 'pulse', 'disable-pointer');
                connectionButton.classList.remove('red', 'green');
                connectionIcon.textContent = 'link'; // Assuming 'link' is the icon for attempting to connect
                isAttemptingConnection = true; // Assuming you track connection attempt status

                // Proceed with the actual connection attempt
                proceedWithConnectionAttempt(url, output_id);
            }
        });
    } else {
        // For disconnection and all other commands, proceed as before
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            console.log('Command sent: ' + url);
            if (output_id === 0) {
                if (url === '/toggle_connection' && isConnected) {
                    // Your original disconnection logic...
                    handleDisconnection(); // Make sure this function is defined as per your original logic
                } else {
                    updateConnectionStatus(); // Update the connection status accordingly
                }
            } else {
                // Handling for other commands remains unchanged
                updateButtonStates(output_id);
                updateDirectionLabels();
                updateOnOffLabels();
            }
        };
        xhr.send();
    }
}

function handleDisconnection() {
    // Begin "Is Disconnecting" state with a 6-second delay
    isDisconnecting = true;
    var connectionButton = document.getElementById('connection-btn');
    var connectionIcon = document.getElementById('connection-icon');
    connectionButton.classList.add('black', 'pulse');
    connectionButton.classList.remove('green', 'red');
    connectionIcon.textContent = 'link_off';
    connectionButton.disabled = true;

    updateButtonAccessibility(false);

    // Additional UI updates here as before...

    // Wait for 6 seconds before resetting the disconnecting state and updating the UI
    setTimeout(function() {
        var checkConnectionXhr = new XMLHttpRequest();
        checkConnectionXhr.open("GET", "/get_connection_status", true);
        checkConnectionXhr.onload = function() {
            var statusData = JSON.parse(checkConnectionXhr.responseText);
            if (!statusData.is_connected) {
                if (isErrorState) {
                    handleConnectionError(); // Handle the error state if set during the wait
                } else {
                    // Successfully disconnected
                    isDisconnecting = false;
                    connectionButton.disabled = false;
                    updateConnectionStatus();
                }
            } else {
                console.error("Disconnection failed, checking for concurrent attempts...");
                if (isAttemptingConnection || isDisconnecting) {
                    // If another attempt was made during the disconnection process, enter an error state
                    isErrorState = true;
                    handleConnectionError();
                } else {
                    // Optionally, insert retry logic or user notification here
                }
            }
        };
        checkConnectionXhr.send();
    }, 6000); // Check status after 6 seconds delay
}

function handleConnectionError() {
    var connectionButton = document.getElementById('connection-btn');
    var connectionIcon = document.getElementById('connection-icon');
    // Update the UI to reflect the error state
    connectionButton.classList.add('red'); // Use red to indicate error
    connectionButton.classList.remove('black', 'pulse', 'disable-pointer');
    connectionIcon.textContent = 'error'; // Assuming 'error' is the icon for error state
    connectionButton.disabled = false; // Re-enable the button for retry
    alert('A connection error occurred. Please try again.');
    // Reset error state after handling
    isErrorState = false;
}

function checkConnectionAttemptStatus(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/get_connection_attempt_status", true);
    xhr.onload = function() {
        var status = JSON.parse(xhr.responseText);
        callback(status.is_attempting_connection);
    };
    xhr.send();
}

function proceedWithConnectionAttempt(url, output_id) {
    // This function should be defined as you provided, handling the connection attempt
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        console.log('Command sent: ' + url);
        // Your logic for after attempting to connect goes here
        if (url === '/toggle_connection') {
            isAttemptingConnection = false; // Reset this flag once the attempt is complete
            updateConnectionStatus(); // Reflect the new connection status in the UI
        }
        if (output_id === 0) {
            // Additional logic if needed
        } else {
            updateButtonStates(output_id);
            updateDirectionLabels();
            updateOnOffLabels();
        }
    };
    xhr.send();
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
