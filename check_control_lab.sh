#!/bin/bash

# Fetch the IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Start coloring and print the message with the IP address
printf "\033[1;32m" # Start coloring
echo
echo "********************************************************************************"
echo "Control Lab IO Remote is now running."
echo "Type $IP_ADDRESS:5001 on a browser to control your LEGO Interface B."
echo "********************************************************************************"
echo
printf "\033[0m" # Reset text color back to default
