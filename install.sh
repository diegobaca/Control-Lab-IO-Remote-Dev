#!/bin/bash

# Define variables
REPO_URL="https://github.com/diegobaca/Control-Lab-IO-Remote.git"
APP_DIR="/home/$(whoami)/Control-Lab-IO-Remote"
SERVICE_NAME="controllabio-remote"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_USER=$(whoami)

# Update and Upgrade, just in case
sudo apt-get update -y
sudo apt-get upgrade -y

# Install necessary system packages
sudo apt-get install -y git python3-pip python3-venv

# Clone the repository if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    git clone $REPO_URL $APP_DIR
else
    echo "Directory $APP_DIR already exists. Pulling latest changes."
    git -C $APP_DIR pull
fi

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

# Reload the systemd daemon to recognize the new service
sudo systemctl daemon-reload

# Enable the service
sudo systemctl enable $SERVICE_NAME.service

# Start the service
sudo systemctl start $SERVICE_NAME.service

# Fetch the IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Print the message with the IP address
echo "Control Lab IO Remote is now running. Type $IP_ADDRESS:5001 on a browser to control your LEGO Interface B."
