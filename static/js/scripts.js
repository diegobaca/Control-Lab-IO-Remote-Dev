var is_sending = false; // Initialize the is_sending variable if needed

function sendCommand(url, output_id) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
        console.log('Command sent: ' + url);
        updateButtonStates(output_id);
        updateDirectionLabels();
        updateOnOffLabels();
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
            document.getElementById('increase-' + i).disabled = (powerLevels[i - 1] == 7);
            document.getElementById('decrease-' + i).disabled = (powerLevels[i - 1] == 0);
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
            directionIcon.textContent = directionStates[i - 1] ? 'rotate_right' : 'rotate_left';
        }
    };
    xhr.send();
}

function updateOnOffLabels() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/get_on_off_states", true);
    xhr.onload = function () {
        var data = JSON.parse(xhr.responseText);
        var onOffStates = data.on_off_states;

        for (var i = 1; i <= 8; i++) {
            var onOffButton = document.getElementById('on-off-' + i);
            var onOffLabel = onOffStates[i - 1] ? 'On' : 'Off';
            onOffButton.textContent = onOffLabel;

            onOffButton.classList.remove('red', 'green', 'orange', 'pulse');
            if (onOffLabel === 'On') {
                onOffButton.classList.add(is_sending ? 'green' : 'orange');
                if (is_sending) onOffButton.classList.add('pulse');
            } else {
                onOffButton.classList.add('red');
            }
        }
        updateButtonStates();
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
        is_sending = data.is_sending;
        var sendingButton = document.getElementById('sending-btn');
        var sendingIcon = document.getElementById('sending-icon');

        if (is_sending) {
            sendingButton.classList.add('green', 'pulse');
            sendingIcon.textContent = 'play_arrow';
        } else {
            sendingButton.classList.add('orange');
            sendingIcon.textContent = 'pause';
        }

        for (var i = 1; i <= 8; i++) {
            var onOffButton = document.getElementById('on-off-' + i);
            if (onOffButton.textContent === 'On') {
                onOffButton.classList.add(is_sending ? 'green' : 'orange');
                onOffButton.classList.toggle('pulse', is_sending);
            }
        }
    };
    xhr.send();
}

function updateButtonAccessibility(isConnected) {
    var buttons = document.querySelectorAll('.btn-floating');
    buttons.forEach(function (button) {
        button.disabled = !isConnected;
    });
}

// Simplified initialization and event listener setup
window.onload = function () {
    updateSendingStatus();
    updateButtonStates();
    updateDirectionLabels();
    updateOnOffLabels();
    updateButtonAccessibility(true); // Assume always connected for simplification
};

window.addEventListener('load', () => {
    requestAnimationFrame(() => {
        document.body.classList.remove('no-transition');
    });
});
