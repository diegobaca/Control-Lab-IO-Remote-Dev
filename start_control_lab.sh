#!/bin/bash

# Check if controllabio-remote service is active
if systemctl is-active --quiet controllabio-remote.service; then
    echo "Control Lab IO Remote is already running."
else
    # Start the controllabio-remote service
    sudo systemctl start controllabio-remote.service
    echo "Control Lab IO Remote has started."
fi
