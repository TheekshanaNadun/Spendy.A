@echo off

REM Start the first CMD server
start "" "C:\Program Files\Git\git-bash.exe" -c "cd /l/Projects/Spendy.A/react-app && npm start"

REM Start the second CMD server
start cmd.exe /k "python L:\Projects\Spendy.A\app.py"

REM Start the third CMD server
start cmd.exe /k python "L:\Projects\Spendy.A\react-app\public\run.py"


