# Website Chat - AI-Powered Website Conversations

An intelligent chat application that scrapes website content and allows you to have AI-powered conversations about it.

## Features

- 🌐 **Website Scraping**: Extract content from any website
- 🤖 **AI-Powered Chat**: Ask questions about scraped content using OpenAI
- 🎤 **Voice Input**: Speak your questions using voice recognition
- 💾 **Local Storage**: Saves scraped content to avoid re-scraping
- 🎨 **Modern UI**: Beautiful interface with custom branding

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js (Node.js)
- **UI**: shadcn/ui + Tailwind CSS
- **AI**: OpenAI GPT-3.5-turbo
- **Voice**: Web Speech API

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_REPO_URL>
   cd url-scribe-conversations-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp env_example.txt .env
   
   # Edit .env and add your OpenAI API key
   # Get your key from: https://platform.openai.com/account/api-keys
   ```

4. **Start the backend server**
   ```bash
   node server.js
   ```
   The server will run on `http://localhost:3001`

5. **Start the frontend** (in a new terminal)
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8080` (or another port if 8080 is busy)

### Usage

1. **Scrape a website**: Enter a URL and click "Scrape Website"
2. **Chat with AI**: Ask questions about the scraped content
3. **Voice input**: Click the microphone button to speak your questions
4. **View history**: Your chat history is saved locally

## Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Development

- **Frontend**: `npm run dev` (Vite dev server)
- **Backend**: `node server.js` (Express server)
- **Build**: `npm run build` (Production build)

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- API keys are kept secure on the backend server

## Deployment

For deployment, you'll need to:
1. Set up environment variables on your hosting platform
2. Deploy both the frontend and backend
3. Update the frontend API URL to point to your deployed backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.
