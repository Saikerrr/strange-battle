@echo off
if exist "%~dp0build\StickFight.exe" (
    start "" "%~dp0build\StickFight.exe"
) else (
    start "" "%~dp0..\editor\Godot_v4.7.2-stable_win64.exe" --path "%~dp0."
)
