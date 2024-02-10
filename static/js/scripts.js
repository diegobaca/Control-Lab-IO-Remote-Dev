// Utility functions for common operations
const utils = {
    updateClassList: function (elementId, addClasses, removeClasses) {
        const element = document.getElementById(elementId);
        element.classList.add(...addClasses);
        element.classList.remove(...removeClasses);
    },
    setDisabledState: function (elementId, state) {
        document.getElementById(elementId).disabled = state;
    },
    sendRequest: function (method, url, callback, data = null) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (method === "POST") {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        xhr.onload = function () {
            if (callback) callback(xhr);
        };
        xhr.send(data);
    }
};

// Simplified connection management
const connection = {
    isConnected: false,
    isAttempting: false,
    isDisconnecting: false,
    isSending: false,

    toggleConnection: function () {
        utils.sendRequest('POST', '/toggle_connection', this.handleToggleConnectionResponse.bind(this));
    },

    handleToggleConnectionResponse: function (xhr) {
        const response = JSON.parse(xhr.responseText);
        this.isConnected = response.is_connected;
        this.updateConnectionUI();
        buttonHandlers.updateAllButtonStates();
    },

    updateConnectionUI: function () {
        // Update connection button based on current state
        const connectionClasses = this.isConnected ? ['green', 'pulse'] : ['red'];
        const connectionIcon = this.isConnected ? 'power_settings_new' : 'link';
        utils.updateClassList('connection-btn', connectionClasses, ['black', 'red', 'pulse']);
        utils.updateClassList('connection-icon', [], []);
        document.getElementById('connection-icon').textContent = connectionIcon;

        // Update other UI elements based on connection state
        document.querySelectorAll('.btn-floating').forEach(button => {
            if (button.id !== 'connection-btn') {
                button.disabled = !this.isConnected;
            }
        });

        const color = this.isConnected ? 'black' : '#DFDFDF';
        document.querySelectorAll('.output-label, .power-level-display').forEach(element => {
            element.style.color = color;
        });
    }
};

// Handlers for UI updates and interactions
const buttonHandlers = {
    updateAllButtonStates: function () {
        this.updatePowerLevels();
        this.updateDirectionLabels();
        this.updateOnOffLabels();
    },

    updatePowerLevels: function () {
        utils.sendRequest('GET', '/get_power_levels', xhr => {
            const data = JSON.parse(xhr.responseText);
            data.power_levels.forEach((level, i) => {
                document.getElementById(`power-level-${i+1}`).innerHTML = `<span class="material-symbols-outlined">counter_${level + 1}</span>`;
                utils.setDisabledState(`increase-${i+1}`, !connection.isConnected || level === 7);
                utils.setDisabledState(`decrease-${i+1}`, !connection.isConnected || level === 0);
            });
        });
    },

    updateDirectionLabels: function () {
        utils.sendRequest('GET', '/get_direction_states', xhr => {
            const data = JSON.parse(xhr.responseText);
            data.direction_states.forEach((state, i) => {
                document.getElementById(`direction-icon-${i+1}`).textContent = state ? 'rotate_right' : 'rotate_left';
            });
        });
    },

    updateOnOffLabels: function () {
        utils.sendRequest('GET', '/get_on_off_states', xhr => {
            const data = JSON.parse(xhr.responseText);
            data.on_off_states.forEach((state, i) => {
                const onOffButton = document.getElementById(`on-off-${i+1}`);
                onOffButton.textContent = state ? 'On' : 'Off';
                utils.updateClassList(`on-off-${i+1}`, [state ? 'green' : 'red'], ['orange', 'pulse']);
            });
        });
    },

    toggleSending: function () {
        utils.sendRequest('POST', '/toggle_sending', xhr => {
            const data = JSON.parse(xhr.responseText);
            connection.isSending = data.is_sending;
            this.updateSendingStatus();
        });
    },

    updateSendingStatus: function () {
        // Simplified updating of sending status UI
        const sendingStatus = connection.isSending ? ['green', 'pulse'] : ['orange'];
        const sendingIconText = connection.isSending ? 'play_arrow' : 'pause';
        utils.updateClassList('sending-btn', sendingStatus, ['black', 'orange']);
        document.getElementById('sending-icon').textContent = sendingIconText;
    }
};

// Initial setup and event listeners
window.onload = function () {
    connection.updateConnectionUI();
    buttonHandlers.updateAllButtonStates();
    setInterval(() => {
        utils.sendRequest('GET', '/check_connection', xhr => {
            const data = JSON.parse(xhr.responseText);
            if (data.is_connected !== connection.isConnected) {
                connection.isConnected = data.is_connected;
                connection.updateConnectionUI();
            }
            if (data.is_sending !== connection.isSending) {
                connection.isSending = data.is_sending;
                buttonHandlers.updateSendingStatus();
            }
            buttonHandlers.updateAllButtonStates();
        });
    }, 1000); // Check connection status every second
};

// Add more event listeners as needed for user interactions
