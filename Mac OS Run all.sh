#!/bin/bash

# Start the React app using npm in a new Terminal window
osascript -e 'tell app "Terminal"
    do script "cd ~/Developer/University/Spendy.A/react-app && npm start"
end tell'

# Start the Flask backend (app.py) in a new Terminal window, activating the Spendy.AI venv first
osascript -e 'tell app "Terminal"
    do script "cd ~/Developer/University/Spendy.A && source Spendy.AI/bin/activate && python3 app.py"
end tell'

# Start the third Python server (run.py) in a new Terminal window, activating the Spendy.AI venv first
osascript -e 'tell app "Terminal"
    do script "cd ~/Developer/University/Spendy.A/react-app/public && source ~/Developer/University/Spendy.A/Spendy.AI/bin/activate && python3 run.py"
end tell'
