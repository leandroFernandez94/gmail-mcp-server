#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createGmailService } from "./gmail-service";

// Define the schema for the read-emails tool
const ReadEmailsSchema = z.object({
  senderEmail: z
    .string()
    .email()
    .optional()
    .describe("Filter emails by sender email address"),
  onlyUnread: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "If true, only return unread emails. If false, return all emails"
    ),
  maxResults: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Maximum number of emails to return (1-100)"),
});

async function createGmailMcpServer() {
  const server = new McpServer({
    name: "gmail-mcp-server",
    version: "1.0.0",
  });

  // Initialize Gmail service
  const gmailService = await createGmailService();

  // Register the read-emails tool
  server.registerTool(
    "read-emails",
    {
      title: "Read Gmail Emails",
      description:
        "Read emails from Gmail with optional filtering by sender and read status",
      inputSchema: {
        senderEmail: z
          .string()
          .email()
          .optional()
          .describe("Filter emails by sender email address"),
        onlyUnread: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "If true, only return unread emails. If false, return all emails"
          ),
        maxResults: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .default(10)
          .describe("Maximum number of emails to return (1-100)"),
      },
    },
    async (args) => {
      try {
        // Validate the arguments using Zod
        const validatedArgs = ReadEmailsSchema.parse(args);
        const emails = await gmailService.getEmails(validatedArgs);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(emails, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading emails: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

async function main() {
  try {
    const server = await createGmailMcpServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    console.error("Gmail MCP server running on stdio");
  } catch (error) {
    console.error("Failed to start Gmail MCP server:", error);
    process.exit(1);
  }
}

main();
