# Control-Lab-IO-Remote
Web-Based Control Interface for Motors on the LEGO Interface B.

Installation on Raspberry Pi (takes ~15 min):

1. Install Raspberry Pi OS Lite using Raspberry Pi Imager:  https://www.raspberrypi.com/software/
2. Apply OS customization when asked. Edit Settings to configure, hostname, username, password, wireless network information, and enable SSH (under services).
3. SSH into Raspberry Pi, e.g. "ssh pi@raspberrypi.local" using Terminal.
NOTE: pi = username, and raspberrypi = hostname
4. Install Git: "sudo apt install git"
5. Clone Control Lab IO Remote: "git clone https://github.com/diegobaca/Control-Lab-IO-Remote.git"
6. Navigate to Control Lab IO Remote folder: "cd /home/pi/Control-Lab-IO-Remote", replace pi with your own username if you changed it during OS customization.
7. Run Script "sudo ./install.sh" (This can take a while if you choose 'yes' to the system updates - look for the following message when istallation is complete: Installation of Control Lab IO Remote is complete.)
8. Open a web browser with a device on the same network and type the Raspberry Pi's IP followed by :5001 to connect.

You can use the following commands via SSH after installation:
- 'statuscontrollab' to check the status of the Control Lab IO Remote service."
- 'stopcontrollab' to stop the Control Lab IO Remote service."
- 'startcontrollab' to start the Control Lab IO Remote service."
