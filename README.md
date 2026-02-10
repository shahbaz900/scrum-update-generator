# 🚀 Scrum Update Generator

Lightning-fast Jira scrum update generator powered by Claude AI Haiku.

## Features

✨ **Lightning Fast** - Streams Claude responses in real-time
🔗 **Jira Integration** - Automatically fetches your daily work
🤖 **AI-Powered** - Generates professional standup updates
📱 **Beautiful UI** - Modern, responsive interface
🔐 **Secure** - Environment-based credentials

## Setup

### Prerequisites

- Node.js 18+ (Get from [nodejs.org](https://nodejs.org))
- Jira Account (with API token)
- Claude API Key

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your Credentials

**Jira API Token:**

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy your token (you'll need your email too)

**Claude API Key:**

1. Go to https://console.anthropic.com/api_keys
2. Create a new API key

**Your Jira URL:**

- Usually: `https://your-company.atlassian.net`

### 3. Configure Environment

Edit `.env.local` with your credentials:

```env
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
CLAUDE_API_KEY=your-claude-api-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Click "Generate Scrum Update"**
2. App fetches your Jira issues from yesterday and today
3. Automatically categorizes work and blockers
4. Sends structured data to Claude Haiku
5. Streams back a polished scrum update in real-time

## Performance Optimizations

- **Streaming**: Claude responses stream as they're generated
- **Caching**: Jira data is efficiently fetched
- **Minimal Payload**: Only required fields requested
- **Edge-Ready**: Can deploy to Vercel for CDN distribution

## File Structure

```
├── app/
│   ├── api/generate/route.ts    # Main API endpoint
│   ├── page.tsx                  # Frontend UI
│   ├── layout.tsx                # App layout
│   └── globals.css               # Styling
├── lib/
│   └── jira.ts                   # Jira utilities
├── .env.local                    # Your credentials
├── package.json
├── tsconfig.json
└── next.config.js
```

## API Endpoint

**POST** `/api/generate`

Returns a streaming text response with the generated scrum update.

## Deployment

### Vercel (Recommended - Fastest)

```bash
npm install -g vercel
vercel
```

Then add environment variables in Vercel dashboard.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Copilot CLI Usage

This project was developed using **GitHub Copilot CLI** to accelerate development:

- **Code Explanation**: Used `gh copilot explain` to understand Jira API error responses
- **Command Suggestions**: Used `gh copilot suggest` to optimize TypeScript configurations
- **Debugging**: Helped debug Claude streaming responses and error handling
- **Code Reviews**: Used Copilot CLI to understand best practices for Next.js API routes

### How to Use Copilot CLI with This Project

```bash
# Install GitHub CLI first
gh auth login

# Install Copilot CLI extension
gh extension install github/gh-copilot

# Ask for help while developing
gh copilot suggest "fix typescript error in nextjs api route"
gh copilot explain "this streaming response handler"
```

## Testing Instructions for Judges

To test this application, you'll need:

1. **Jira Access** (Free/Standard tier works)
   - Create a Jira Cloud instance or use an existing one
   - Generate an API token from https://id.atlassian.com/manage-profile/security/api-tokens
   - Make sure you have at least 1-2 issues in your Jira board

2. **Claude API Key**
   - Get one from https://console.anthropic.com/api_keys
   - No paid plan required - free tier works

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Then fill in with your actual credentials:
   # JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, CLAUDE_API_KEY
   ```

4. **Run & Test**
   ```bash
   npm install
   npm run dev
   # Open http://localhost:3000
   # Click "Generate Scrum Update" button
   # Watch as it fetches your Jira issues and generates an update
   ```

## Troubleshooting

**"Missing Jira configuration"**

- Check `.env.local` has all required fields
- Ensure no extra spaces in values

**"Failed to fetch Jira issues"**

- Verify Jira URL is correct
- Test credentials directly on Atlassian
- Check API token hasn't expired

**"Claude API error"**

- Verify API key is valid
- Check you have sufficient credits

## License

MIT
