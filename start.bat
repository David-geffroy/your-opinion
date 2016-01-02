echo Lancement de l'application en local
@echo off

start cmd /k CALL mongod --dbpath "site/db"
start cmd /k CALL node frontal/app.js

pause

TASKKILL /IM cmd.exe