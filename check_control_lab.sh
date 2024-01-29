#!/bin/bash

# Fetch the IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Print the message with the IP address
echo "Control Lab IO Remote is now running. Type $IP_ADDRESS:5001 on a browser to control your LEGO Interface B."
