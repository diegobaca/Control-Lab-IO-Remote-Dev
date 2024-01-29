#!/bin/bash

# Ensure the script is run with root privileges
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root."
    exit 1
fi

# Define variables
APP_DIR="$(dirname "$(realpath "$0")")"
SERVICE_NAME="controllabio-remote"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_USER=$(whoami)

# Welcome message and usage instructions
echo "Starting installation of ${SERVICE_NAME}..."
echo "Script directory: ${APP_DIR}"

# Ask user if they want to update and upgrade the system packages
read -p "Do you want to update and upgrade system packages? (yes/no) " update_upgrade_choice
if [[ $update_upgrade_choice == "yes" || $update_upgrade_choice == "y" ]]; then
    # Update and Upgrade
    sudo apt-get update -y
    sudo apt-get upgrade -y
    if [ $? -ne 0 ]; then
        echo "Failed to update and upgrade system packages."
        exit 1
    fi
else
    echo "Skipping system update and upgrade."
fi

# Install necessary system packages
sudo apt-get install -y python3-pip python3-venv
if [ $? -ne 0 ]; then
    echo "Failed to install required packages."
    exit 1
fi

# Create a virtual environment if it doesn't exist
if [ ! -d "${APP_DIR}/venv" ]; then
    python3 -m venv "${APP_DIR}/venv"
fi

# Activate the virtual environment
source "${APP_DIR}/venv/bin/activate"

# Install Python dependencies within the virtual environment
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install Python dependencies."
    deactivate
    exit 1
fi

# Deactivate the virtual environment
deactivate

# Check if the service already exists
if [ -f "$SERVICE_FILE" ]; then
    echo "$SERVICE_FILE already exists."
    # Optional: Prompt for action or automatically handle it
fi

# Create the systemd service file
cat << EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Control Lab IO Remote App
After=network.target

[Service]
ExecStart=${APP_DIR}/venv/bin/python ${APP_DIR}/main.py
WorkingDirectory=${APP_DIR}
StandardOutput=inherit
StandardError=inherit
Restart=always
User=$CURRENT_USER

[Install]
WantedBy=multi-user.target
EOF

# Reload the systemd daemon to recognize the new service
sudo systemctl daemon-reload

# Enable the service
sudo systemctl enable "$SERVICE_NAME.service"

# Start the service
sudo systemctl start "$SERVICE_NAME.service"

# Final message with border and color
echo
echo "********************************************************************************"
echo -e "\033[1;32mInstallation of Control Lab IO Remote is complete.\033[0m"
echo -e "\033[1;32mUse the following commands to manage the service:\033[0m"
echo -e "\033[1;32m  - 'systemctl status $SERVICE_NAME' to check the status.\033[0m"
echo -e "\033[1;32m  - 'systemctl stop $SERVICE_NAME' to stop the service.\033[0m"
echo -e "\033[1;32m  - 'systemctl start $SERVICE_NAME' to start the service.\033[0m"
echo "********************************************************************************"

# Reset text color back to default
echo -e "\033[0m"
