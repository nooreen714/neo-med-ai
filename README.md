# NeoMed AI Smart Health Assistant

NeoMed AI is a browser-based health assistant interface with ten workspace views. The project is made up of static HTML, CSS, and JavaScript files and uses Tailwind CSS, Lucide icons, and Google Fonts from their CDNs.

## Run locally

1. Make sure Python is installed, then open a terminal in this project folder.
2. Start a local web server:

   ```sh
   python -m http.server 8000
   ```

3. Open [http://localhost:8000](http://localhost:8000) in a browser.

Opening `index.html` directly may also display the interface, but a local server is recommended for consistent browser API behavior.

## Configure Gemini

1. Create a Gemini API key in Google AI Studio.
2. Open the **Gemini AI Config** control or the API key prompt in the app.
3. Paste the key and save it. The app stores it in this browser's `localStorage`; it is not written to the project files. You can also update or clear it from **Settings → Gemini AI Configuration**.
4. Use the AI-powered chat, symptom checker, medicine search/photo scan, wellness support, and health coach features.

The app calls the Gemini 2.5 Flash API directly from the browser. A browser-stored key is accessible to anyone using that browser profile, and client-side API calls expose the key to the browser. Do not use a personal or production key in a publicly hosted deployment; use a trusted backend to protect production credentials.

## Workspace pages

Use the sidebar to switch among all ten views:

1. **Home** — Dr. Neo greeting, chat and voice controls, quick actions, and a skin-photo analysis entry point.
2. **Symptom Checker** — choose a chat slot, use common symptom shortcuts, and ask follow-up questions.
3. **Health Dashboard** — view health metrics in interactive SVG area charts with hover tooltips.
4. **Medicine Scanner** — search for medication information or upload a package photo for multimodal analysis.
5. **Mental Wellness** — record a mood, request supportive guidance, and use timed wellness exercises.
6. **Emergency SOS** — access emergency service actions and nearby-help shortcuts.
7. **Health Records** — view sample health records and manage medication reminders.
8. **Find Hospitals** — browse the listed hospital and clinic information.
9. **AI Health Coach** — choose a coaching chat slot and discuss wellness goals with Dr. Neo.
10. **Settings** — configure the Gemini API key and application preferences.

## Project files

- `index.html` — HTML5 application markup and external CDN/font references.
- `style.css` — custom styling, animations, scrollbar rules, and formatted AI response styles.
- `script.js` — application state, navigation, Gemini integration, speech APIs, charts, sessions, modals, and event handlers.
