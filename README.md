# Voice Dictionary App

A voice-activated dictionary app that allows you to look up word definitions by speaking and save them for later reference.

## Features

- **Voice Recognition**: Say a word to look up its definition
- **Accept/Reject Control**: Choose which words to save to your dictionary
- **Save and Organize**: View your saved words with pagination (15 words per page)
- **Expandable Definitions**: Click on words to see their definitions in a dropdown
- **Backup and Restore**: Export and import your dictionary
- **Dark Mode**: Choose between light and dark themes
- **Multiple Languages**: Set voice recognition language preference
- **Mobile Friendly**: Responsive design works on all devices

## How to Use

### Installation

1. Clone this repository or download the ZIP file
2. Open the `index.html` file in your web browser (Chrome recommended for best speech recognition support)

### Looking Up Words

1. Click the microphone button
2. Say a word clearly
3. The app will look up the definition and display it
4. Click "Accept" to save the word to your dictionary or "Reject" to discard it
5. Alternatively, enable "Auto-save Words" in Settings to skip the Accept/Reject step

### Browsing Saved Words

1. Click "Saved Words" in the top menu
2. Your saved words will be listed 15 per page
3. Click on any word to view its definition
4. Click the "×" button to close a definition
5. Use the "Previous" and "Next" buttons to navigate between pages

### Managing Your Dictionary

- **Delete Individual Words**: Hover over a word and click "Delete"
- **Backup Dictionary**: Go to Settings → Data Management → "Backup Dictionary"
- **Import Backup**: Go to Settings → Data Management → "Import Backup"
- **Clear All Words**: Go to Settings → Data Management → "Clear All Words"

### Settings

- **Voice Recognition Language**: Choose from several languages for speech recognition
- **Theme**: Switch between Light and Dark themes
- **Auto-save Words**: Automatically save words without Accept/Reject prompt

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses IndexedDB for client-side storage
- Uses the Web Speech API for voice recognition
- Uses the free [Dictionary API](https://dictionaryapi.dev/) for word definitions

## Browser Compatibility

This app works best in:
- Google Chrome
- Microsoft Edge
- Firefox (with limited speech recognition support)

## License

MIT
