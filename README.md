# Voice Dictionary App v1.3

## Overview
A voice-activated dictionary application that allows users to look up word definitions by speaking, with backup and restore functionality.

## Major Changes in v1.3
- Updated pagination to show 7 entries per page (previously 10)
- Refactored app into modular structure with separate JS files for better maintainability
- Updated version number and metadata throughout the app

## Modular Structure
The app has been refactored into the following modules:

- `main.js`: Entry point for the application
- `app.js`: Core application logic and coordination between components
- `ui.js`: User interface interactions and DOM manipulation
- `dictionary.js`: Word lookup and management functionality
- `settings.js`: User preferences management
- `storage.js`: Data persistence and backup/restore features

## Features
- Voice recognition for looking up words
- Word definitions with examples
- Save favorite words to a personal dictionary
- Dark/light theme support
- Multiple language support for voice recognition
- Backup and restore functionality
- Pagination for browsing saved words

## Implementation Details
- Uses IndexedDB for client-side storage
- Web Speech API for voice recognition
- Communicates with the Dictionary API for word definitions
- Responsive design for mobile and desktop usage