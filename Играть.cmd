@echo off
if exist "%~dp0build\StrangeBattle.exe" (
    start "" "%~dp0build\StrangeBattle.exe"
) else (
    start "" "%~dp0..\editor\Godot_v4.7.2-stable_win64.exe" --path "%~dp0."
)
