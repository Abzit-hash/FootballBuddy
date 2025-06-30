
FootballBuddy is a web application for football fans, providing real-time match updates, team statistics, video highlights, FIFA world rankings, and an interactive AI chatbot powered by OpenAI. It integrates with SportsDB, SportMonks, Scorebat, and OpenAI APIs to deliver a seamless football experience.
Features

Live Matches: View ongoing football matches worldwide.
Video Highlights: Watch trending match highlights.
FIFA Rankings: Check the latest FIFA world rankings.
Team Search: Search for team details, recent form, fixtures, and compare teams.
AI Chatbot: Ask football-related questions using OpenAI's GPT model.
Responsive Design: Optimized for mobile and desktop.

Tech Stack

Frontend: HTML, CSS, JavaScript, Bootstrap 5, Chart.js
APIs: SportsDB, SportMonks, Scorebat, OpenAI
Fonts/Icons: Google Fonts, Font Awesome
Backend (optional): Node.js, Express (for API proxy)

Setup Instructions

Clone the Repository:git clone https://github.com/your-username/footballbuddy.git
cd footballbuddy


Install Dependencies (if using a backend):npm install express dotenv axios


Configure Environment Variables:
Create a .env file in the root directory.
Add API keys:SPORTS_DB_API_KEY=your_sportsdb_key
SPORTMONKS_API_TOKEN=your_sportmonks_token
SCOREBAT_API_TOKEN=your_scorebat_token
OPENAI_API_KEY=your_openai_api_key




Run Locally:
For client-side only: Open index.html in a browser (note: some APIs may require a server due to CORS).
For backend: Start the server:node server.js




Deploy:
Deploy the frontend to Netlify, Vercel, or GitHub Pages for static hosting.
Deploy the backend (if used) to Heroku, Render, or AWS, and configure environment variables in the platform’s dashboard.



Usage

Search Teams: Enter a team name or ID to view details, recent form, or compare teams.
Widgets: Use the sidebar to fixation access live matches, highlights, rankings, or the AI chatbot.
AI Chatbot: Ask football-related questions (requires OpenAI API key for full functionality).
Share: Share the app via WhatsApp, Facebook, Twitter, or LinkedIn.

Security Notes

API Keys: Store API keys in a .env file and use a backend proxy (e.g., server.js) to hide them from client-side code.
CORS: Some APIs (e.g., SportsDB, SportMonks) may require a server to bypass CORS restrictions in browsers.
OpenAI: Ensure a valid OpenAI API key is configured for the chatbot to work.

Contributing
Contributions are welcome! Please:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m 'Add your feature').
Push to the branch (git push origin feature/your-feature).
Open a Pull Request.

License
This project is licensed under the MIT License. See the LICENSE file for details.
Acknowledgments

SportsDB
SportMonks
Scorebat
OpenAI
Bootstrap
Chart.js
Font Awesome
