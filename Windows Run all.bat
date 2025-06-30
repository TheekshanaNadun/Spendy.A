#!/bin/bash

# Make script executable: chmod +x start-servers.sh

# Open new Terminal tab for React app
osascript -e 'tell application "Terminal"
    do script "cd ~/Projects/Spendy.A/react-app && npm start"
end tell'

# Open new Terminal tab for first Python server
osascript -e 'tell application "Terminal"
    do script "cd ~/Projects/Spendy.A && python3 app.py"
end tell'

# Open new Terminal tab for second Python server
osascript -e 'tell application "Terminal"
    do script "cd ~/Projects/Spendy.A/react-app/public && python3 run.py"
end tell'