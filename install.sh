#!/bin/bash

# Define variables
REPO_URL="https://github.com/diegobaca/Control-Lab-IO-Remote.git"
APP_DIR="/home/$(whoami)/Control-Lab-IO-Remote"
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

# Create check_control_lab.sh script
cat << 'EOF' > /home/pi/check_control_lab.sh
#!/bin/bash

# Fetch the IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Print the message with the IP address
echo "Control Lab IO Remote is now running. Type $IP_ADDRESS:5001 on a browser to control your LEGO Interface B."
EOF

# Make the script executable
chmod +x /home/pi/check_control_lab.sh

# Create exit_control_lab.sh script
cat << 'EOF' > /home/pi/exit_control_lab.sh
#!/bin/bash

# Stop the controllabio-remote service
sudo systemctl stop controllabio-remote.service

echo "Control Lab IO Remote has been stopped."
EOF

# Make the script executable
chmod +x /home/pi/exit_control_lab.sh

# Create start_control_lab.sh script
cat << 'EOF' > /home/pi/start_control_lab.sh
#!/bin/bash

# Check if controllabio-remote service is active
if systemctl is-active --quiet controllabio-remote.service; then
    echo "Control Lab IO Remote is already running."
else
    # Start the controllabio-remote service
    sudo systemctl start controllabio-remote.service
    echo "Control Lab IO Remote has started."
fi
EOF

# Make the script executable
chmod +x /home/pi/start_control_lab.sh

# Add aliases to .bashrc for easy access
{
    echo "alias checkcontrollab='/home/pi/check_control_lab.sh'"
    echo "alias exitcontrollab='/home/pi/exit_control_lab.sh'"
    echo "alias startcontrollab='/home/pi/start_control_lab.sh'"
} >> /home/pi/.bashrc

# Reload .bashrc to apply the changes
source /home/pi/.bashrc

# Final message
echo "Installation of Control Lab IO Remote is complete."
echo "Use the following commands to manage the service:"
echo "  - 'checkcontrollab' to check the status."
echo "  - 'exitcontrollab' to stop the service."
echo "  - 'startcontrollab' to start the service."
