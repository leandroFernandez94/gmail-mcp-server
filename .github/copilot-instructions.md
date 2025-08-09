# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is an MCP (Model Context Protocol) server project that provides Gmail email reading capabilities with filtering options.

## Project Context

- This MCP server integrates with the Gmail API to read emails
- Supports filtering by sender email address
- Supports filtering by read/unread status
- Built with TypeScript and the MCP SDK
- Uses Google's official Gmail API client

## Key Technologies

- TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- Google APIs (googleapis)
- Zod for schema validation

## Reference Links

You can find more info and examples at https://modelcontextprotocol.io/llms-full.txt
SDK documentation: https://github.com/modelcontextprotocol/create-python-server

## Development Guidelines

- Follow MCP server patterns and conventions
- Use proper error handling for Gmail API calls
- Implement secure authentication with Google OAuth2
- Validate all input parameters using Zod schemas
- Provide clear tool descriptions and parameter documentation
