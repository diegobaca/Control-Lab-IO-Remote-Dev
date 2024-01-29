#!/bin/bash

# Fetch the service status
service_status=$(systemctl is-active controllabio-remote.service)

if [ "$service_status" == "active" ]; then
    # Fetch the IP address
    IP_ADDRESS=$(hostname -I | awk '{print $1}')

    # Start coloring and print the message with the IP address and utility script information
    printf "\033[1;32m" # Start coloring with green
    echo
    echo "********************************************************************************"
    echo "Control Lab IO Remote is now running."
    echo "Access the Control Lab IO Remote by typing one of the following URLs into your browser:"
    echo "  - Hostname: http://$(hostname):5001"
    echo "  - IP Address: http://$IP_ADDRESS:5001"
    echo "This will allow you to control your LEGO Interface B."
    echo
    echo "Manage the Control Lab IO Remote service using the following commands:"
    echo "  - 'statuscontrollab' to check the status of the Control Lab IO Remote."
    echo "  - 'stopcontrollab' to stop the Control Lab IO Remote service."
    echo "  - 'startcontrollab' to start the Control Lab IO Remote service."
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
