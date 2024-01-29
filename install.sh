#!/bin/bash

# Define variables
APP_DIR="$(pwd)"
SERVICE_NAME="controllabio-remote"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_USER=$(whoami)

# Ask user if they want to update and upgrade the system packages
read -p "Do you want to update and upgrade system packages? (yes/no) " update_upgrade_choice
if [[ $update_upgrade_choice == "yes" || $update_upgrade_choice == "y" ]]; then
    # Update and Upgrade
    sudo apt-get update -y
    sudo apt-get upgrade -y
else
    echo "Skipping system update and upgrade."
fi

# Install necessary system packages
sudo apt-get install -y python3-pip python3-venv

# Change to the app directory
cd $APP_DIR

# Create a virtual environment if it doesn't exist
if [ ! -d "$APP_DIR/venv" ]; then
    python3 -m venv $APP_DIR/venv
fi

# Activate the virtual environment
source $APP_DIR/venv/bin/activate

# Install Python dependencies within the virtual environment
pip3 install -r requirements.txt

# Deactivate the virtual environment
deactivate

# Create the systemd service file
cat << EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Control Lab IO Remote App
After=network.target

[Service]
ExecStart=$APP_DIR/venv/bin/python $APP_DIR/main.py
WorkingDirectory=$APP_DIR
StandardOutput=inherit
StandardError=inherit
Restart=always
User=$CURRENT_USER

[Install]
WantedBy=multi-user.target
EOF

# Make sure utility scripts are executable
chmod +x $APP_DIR/check_control_lab.sh
chmod +x $APP_DIR/exit_control_lab.sh
chmod +x $APP_DIR/start_control_lab.sh

# Export aliases for easy access
export checkcontrollab="$APP_DIR/check_control_lab.sh"
export exitcontrollab="$APP_DIR/exit_control_lab.sh"
export startcontrollab="$APP_DIR/start_control_lab.sh"

# Carriage return before the final message
echo

# Final message with border and color
{
echo "********************************************************************************"
echo -e "\033[1;32mInstallation of Control Lab IO Remote is complete.\033[0m"
echo -e "\033[1;32mUse the following commands to manage the service:\033[0m"
echo -e "\033[1;32m  - 'checkcontrollab' to check the status.\033[0m"
echo -e "\033[1;32m  - 'exitcontrollab' to stop the service.\033[0m"
echo -e "\033[1;32m  - 'startcontrollab' to start the service.\033[0m"
echo "********************************************************************************"
} 

# Reset text color back to default
echo -e "\033[0m"

# Reload the systemd daemon to recognize the new service
sudo systemctl daemon-reload

# Enable the service
sudo systemctl enable $SERVICE_NAME.service

# Start the service
sudo systemctl start $SERVICE_NAME.service
