# Quick Start Guide

Follow these steps to set up your Gmail MCP Server:

## 1. Set up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and click "Enable"

## 2. Create OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen first
4. Choose "Desktop application" as the application type
5. Give it a name (e.g., "Gmail MCP Server")
6. Click "Create"
7. Download the JSON file and save it as `credentials.json` in this project directory

## 3. Install and Setup

```bash
# Install dependencies
npm install

# Run the authentication setup
npm run setup
```

The setup script will:

- Open a browser window for OAuth authentication
- Prompt you to authorize the application
- Save the authentication token

## 4. Build and Run

```bash
# Build the project
npm run build

# Start the MCP server
npm start
```

## Using the Server

Once running, the server provides one tool:

### `read-emails`

**Parameters:**

- `senderEmail` (optional): Filter by sender email
- `onlyUnread` (optional): true for unread only, false for all emails (default: false)
- `maxResults` (optional): Number of emails to return (1-100, default: 10)

**Example:**

```json
{
  "senderEmail": "notifications@github.com",
  "onlyUnread": true,
  "maxResults": 5
}
```

## Troubleshooting

- If authentication fails, delete `token.json` and run `npm run setup` again
- Make sure your `credentials.json` file is in the project root
- Check that the Gmail API is enabled in your Google Cloud project
