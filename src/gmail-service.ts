import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { readFileSync } from "fs";
import { get } from "http";

export interface EmailFilter {
  senderEmail?: string;
  onlyUnread?: boolean;
  maxResults?: number;
  includeBody?: boolean;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  date: string;
  snippet: string;
  body: string;
  isUnread: boolean;
  labels: string[];
}

interface GmailService {
  getEmails: (filter: EmailFilter) => Promise<EmailMessage[]>;
  testConnection: () => Promise<boolean>;
}

async function initializeAuth(): Promise<{
  gmail: gmail_v1.Gmail;
  auth: OAuth2Client;
}> {
  try {
    // Try to load credentials from environment or config file
    const credentialsPath =
      process.env.GMAIL_CREDENTIALS_PATH || "./credentials.json";
    const tokenPath = process.env.GMAIL_TOKEN_PATH || "./token.json";

    // Load client credentials
    const credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));
    const { client_secret, client_id, redirect_uris } =
      credentials.web || credentials.installed;

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Try to load existing token
    try {
      const token = JSON.parse(readFileSync(tokenPath, "utf8"));
      auth.setCredentials(token);
    } catch (error) {
      console.error("No valid token found. Please run authentication first.");
      throw new Error(
        "Authentication required. Please set up OAuth2 credentials."
      );
    }

    const gmail = google.gmail({ version: "v1", auth });
    return { gmail, auth };
  } catch (error) {
    console.error("Failed to initialize Gmail authentication:", error);
    throw new Error(
      "Gmail authentication initialization failed. Please check your credentials."
    );
  }
}

function buildQuery(filter: EmailFilter): string {
  const queryParts: string[] = [];

  if (filter.senderEmail) {
    queryParts.push(`from:${filter.senderEmail}`);
  }

  if (filter.onlyUnread) {
    queryParts.push("is:unread");
  }

  return queryParts.join(" ");
}

const getHeader = (
  headers: gmail_v1.Schema$MessagePartHeader[],
  name: string
) =>
  headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ||
  "";

async function getMessageDetails(
  gmail: gmail_v1.Gmail,
  messageId: string,
  includeBody: boolean
): Promise<EmailMessage | null> {
  try {
    const messageData = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const message = messageData.data;
    if (!message) return null;

    const headers = message.payload?.headers || [];

    // Extract email body
    let body = "";
    if (includeBody) {
      if (message.payload?.parts) {
        // Multi-part message
        for (const part of message.payload.parts) {
          if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
            if (part.body?.data) {
              body = Buffer.from(part.body.data, "base64").toString();
              break;
            }
          }
        }
      } else if (message.payload?.body?.data) {
        // Single part message
        body = Buffer.from(message.payload.body.data, "base64").toString();
      }
    }

    // Parse recipients
    const toHeader = getHeader(headers, "to");
    const to = toHeader ? toHeader.split(",").map((addr) => addr.trim()) : [];

    // Check if message is unread
    const labels = message.labelIds || [];
    const isUnread = labels.includes("UNREAD");

    return {
      id: message.id || "",
      threadId: message.threadId || "",
      subject: getHeader(headers, "subject"),
      from: getHeader(headers, "from"),
      to,
      date: getHeader(headers, "date"),
      snippet: message.snippet || "",
      body,
      isUnread,
      labels,
    };
  } catch (error) {
    console.error(`Error getting message ${messageId}:`, error);
    return null;
  }
}

async function getEmails(
  gmail: gmail_v1.Gmail,
  filter: EmailFilter
): Promise<EmailMessage[]> {
  try {
    const query = buildQuery(filter);
    const maxResults = filter.maxResults || 10;

    // Search for messages
    const searchResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    const messages = searchResponse.data.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // Get detailed information for each message
    const emailPromises = messages.map((msg) =>
      msg.id
        ? getMessageDetails(gmail, msg.id, (filter.includeBody = false))
        : Promise.resolve(null)
    );

    const emails = await Promise.all(emailPromises);

    // Filter out null results and return
    return emails.filter((email): email is EmailMessage => email !== null);
  } catch (error) {
    console.error("Error fetching emails:", error);
    throw new Error(
      `Failed to fetch emails: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function testConnection(gmail: gmail_v1.Gmail): Promise<boolean> {
  try {
    const response = await gmail.users.getProfile({ userId: "me" });
    return !!response.data.emailAddress;
  } catch (error) {
    console.error("Gmail connection test failed:", error);
    return false;
  }
}

export async function createGmailService(): Promise<GmailService> {
  const { gmail } = await initializeAuth();

  return {
    getEmails: (filter: EmailFilter) => getEmails(gmail, filter),
    testConnection: () => testConnection(gmail),
  };
}
