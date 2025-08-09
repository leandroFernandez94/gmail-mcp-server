# Gmail MCP Server

A Model Context Protocol (MCP) server that provides Gmail email reading capabilities with advanced filtering options.

## Features

- **Read Gmail emails** with optional filtering
- **Filter by sender email address** - only get emails from specific senders
- **Filter by read/unread status** - get only unread emails or all emails
- **Configurable result limits** - control how many emails to retrieve (1-100)
- **Secure OAuth2 authentication** with Google
- **Rich email metadata** - get subject, sender, recipients, date, snippet, and body

## Tools

### `read-emails`

Reads emails from Gmail with optional filtering parameters.

**Parameters:**

- `senderEmail` (optional): Filter emails by sender email address
- `onlyUnread` (optional, default: false): If true, only return unread emails
- `maxResults` (optional, default: 10): Maximum number of emails to return (1-100)

**Example usage:**

```json
{
  "senderEmail": "notifications@github.com",
  "onlyUnread": true,
  "maxResults": 20
}
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Gmail API Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Desktop application" as the application type
   - Download the credentials file as `credentials.json`
5. Place the `credentials.json` file in the project root directory

### 3. Authenticate with Gmail

Run the setup script to authenticate with your Gmail account:

```bash
npm run setup
```

This will:

- Guide you through the OAuth2 flow
- Open a browser window for authentication
- Save the authentication token for future use

### 4. Build and Run

```bash
npm run build
npm start
```

## Development

### Build in watch mode

```bash
npm run dev
```

### Project Structure

```
src/
├── index.ts           # Main MCP server entry point (functional architecture)
├── gmail-service.ts   # Gmail API service functions
└── setup-auth.ts     # Authentication setup utility
```

## Architecture

This MCP server is built using a **functional architecture** following the latest MCP SDK patterns:

- **`index.ts`**: Main server initialization using `McpServer` from the official SDK
- **`gmail-service.ts`**: Pure functions for Gmail API operations
- **`setup-auth.ts`**: Utility functions for OAuth2 authentication setup

The server uses the modern `McpServer` class with `registerTool()` method instead of the lower-level `Server` class, providing better type safety and developer experience.

## Configuration Files

- `credentials.json` - OAuth2 client credentials (download from Google Cloud Console)
- `token.json` - OAuth2 access token (generated during setup)
- `.vscode/mcp.json` - MCP server configuration for VS Code

## Security Notes

- Never commit `credentials.json` or `token.json` to version control
- The server requires read-only access to Gmail (`gmail.readonly` scope)
- Authentication tokens are stored locally and encrypted by Google's OAuth2 library

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. Delete `token.json` and run `npm run setup` again
2. Check that your `credentials.json` file is valid
3. Ensure the Gmail API is enabled in your Google Cloud project

### Permission Errors

If you get permission errors:

1. Check that your OAuth2 app has the correct scopes
2. Ensure your Google account has access to the emails you're trying to read
3. Try re-authenticating with `npm run setup`

## API Rate Limits

The Gmail API has usage quotas:

- 1 billion quota units per day
- 250 quota units per user per second

Each API call consumes different amounts of quota. The server is designed to be efficient, but be mindful of rate limits when making frequent requests.

## License

ISC
