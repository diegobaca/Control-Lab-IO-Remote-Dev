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

# Install Git and Python3 Pip if they aren't already installed
sudo apt-get install -y git python3-pip

# Clone the repository if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    git clone $REPO_URL $APP_DIR
else
    echo "Directory $APP_DIR already exists. Pulling latest changes."
    git -C $APP_DIR pull
fi

# Change to the app directory
cd $APP_DIR

# Install Python dependencies
pip3 install -r requirements.txt

# Create the systemd service file
cat << EOF | sudo tee $SERVICE_FILE
[Unit]
Description=Control Lab IO Remote App
After=network.target

[Service]
ExecStart=/usr/bin/python3 $APP_DIR/main.py
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

echo "Installation completed. The service is now running."
