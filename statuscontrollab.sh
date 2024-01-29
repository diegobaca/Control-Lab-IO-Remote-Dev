#!/bin/bash

# Fetch the service status
service_status=$(systemctl is-active controllabio-remote.service)

if [ "$service_status" == "active" ]; then
    # Fetch the IP address
    IP_ADDRESS=$(hostname -I | awk '{print $1}')

    # Start coloring and print the message with the IP address
    printf "\033[1;32m" # Start coloring with green
    echo
    echo "********************************************************************************"
    echo "Control Lab IO Remote is now running."
    echo "Type $IP_ADDRESS:5001 on a browser to control your LEGO Interface B."
    echo "********************************************************************************"
    echo
    printf "\033[0m" # Reset text color back to default
elif [ "$service_status" == "inactive" ] || [ "$service_status" == "failed" ]; then
    # Start coloring and print the message that the service is not running
    printf "\033[0;31m" # Start coloring with red
    echo
    echo "********************************************************************************"
    echo "Control Lab IO Remote is not running."
    echo "Type command 'startcontrollab' to restart the Control Lab IO Remote service."
    echo "********************************************************************************"
    echo
    printf "\033[0m" # Reset text color back to default
else
    # Handle unexpected status
    printf "\033[0;31m" # Start coloring with red for warning
    echo
    echo "********************************************************************************"
    echo "Control Lab IO Remote is in an unexpected state: '$service_status'."
    echo "Please check the service status manually."
    echo "********************************************************************************"
    echo
    printf "\033[0m" # Reset text color back to default
fi
