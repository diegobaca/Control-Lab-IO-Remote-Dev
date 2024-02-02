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
GLOBAL_BIN_DIR="/usr/local/bin"

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
sudo apt-get install -y python3-pip python3-venv avahi-daemon # Added avahi-daemon here
if [ $? -ne 0 ]; then
    echo "Failed to install required packages."
    exit 1
fi

# Start and enable Avahi daemon for .local domain resolution
sudo systemctl start avahi-daemon
sudo systemctl enable avahi-daemon
echo "Avahi daemon has been started and enabled for .local domain resolution."

# Optionally adjust firewall, only if you're using UFW and it's active
# sudo ufw allow 5353/udp

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

# Get the current IP address and the hostname
CURRENT_IP=$(hostname -I | awk '{print $1}')
HOSTNAME=$(hostname)

# Update /etc/hosts file
if grep -q "$HOSTNAME" /etc/hosts; then
    echo "Updating existing hostname entry."
    # Use sed to replace the line that contains the hostname
    sudo sed -i "/$HOSTNAME/c\\$CURRENT_IP $HOSTNAME" /etc/hosts
else
    echo "Adding new hostname entry."
    # Append new host entry at the end of /etc/hosts
    echo "$CURRENT_IP $HOSTNAME" | sudo tee -a /etc/hosts
fi

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

# Copy utility scripts to /usr/local/bin and make them executable
for script in statuscontrollab.sh stopcontrollab.sh startcontrollab.sh; do
    src="${APP_DIR}/${script}"
    dest="${GLOBAL_BIN_DIR}/${script%.*}" # Removes the '.sh' extension
    
    sudo cp "$src" "$dest"
    sudo chmod +x "$dest"
    echo "Updated $dest"
done

# Append the statuscontrollab command to /etc/profile to run it when any user logs in via SSH
# First, check if the line already exists to avoid duplicates
if ! grep -q "/usr/local/bin/statuscontrollab" /etc/profile; then
    echo "/usr/local/bin/statuscontrollab" | sudo tee -a /etc/profile
    echo "Added statuscontrollab command to /etc/profile."
else
    echo "statuscontrollab command is already in /etc/profile."
fi

# Final message with border and color
echo
printf "\033[1;32m" # Start coloring
echo "********************************************************************************"
echo "Installation of Control Lab IO Remote is complete."
echo "The device's IP has been mapped to its hostname. You can access the device on port 5001 using:"
echo "  - Hostname: http://$HOSTNAME.local" # Modified to use .local
echo "  - IP Address: http://$CURRENT_IP"
echo "This allows you to connect to your device more easily within your network."
echo
echo "You can now manage the Control Lab IO Remote service using the following commands:"
echo "  - 'statuscontrollab' to check the status of the Control Lab IO Remote."
echo "  - 'stopcontrollab' to stop the Control Lab IO Remote service."
echo "  - 'startcontrollab' to start the Control Lab IO Remote service."
echo
echo "Enjoy and Play Well!"
echo "********************************************************************************"
printf "\033[0m" # Reset text color back to default
