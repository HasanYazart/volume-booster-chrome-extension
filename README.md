# Volume Booster

A Manifest V3 extension that uses the Web Audio API to boost Chrome tab volume from `100%` to `600%`.

## Installation

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** in the upper-right corner.
3. Click **Load unpacked**.
4. Select this folder.

Click the extension icon, choose a volume level, and turn on the switch in the upper-right corner. Audio is sent to the output device selected in Windows, so it will play through your headphones when they are connected and selected.

## Notes

- Chrome internal pages (`chrome://...`) and protected pages such as the Chrome Web Store cannot be captured.
- Audio capture may stop when a tab is refreshed or closed. Turn the switch on again to restart it.
- Volume levels above `200%` increase the risk of hearing damage and audio distortion.
