#!/usr/bin/env node

import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { writeFileSync, readFileSync } from "fs";
import { createInterface } from "readline";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = "token.json";
const CREDENTIALS_PATH = "credentials.json";

interface Credentials {
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

async function loadCredentials(): Promise<OAuth2Client> {
  let credentials: Credentials;

  try {
    credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  } catch (error) {
    console.error(`Error loading credentials from ${CREDENTIALS_PATH}:`, error);
    console.log("\nTo set up Gmail authentication:");
    console.log("1. Go to https://console.cloud.google.com/");
    console.log("2. Create a new project or select an existing one");
    console.log("3. Enable the Gmail API");
    console.log("4. Create credentials (OAuth 2.0 Client ID)");
    console.log(
      "5. Download the credentials.json file and place it in this directory"
    );
    throw new Error("Credentials file not found");
  }

  const { client_secret, client_id, redirect_uris } =
    credentials.web || credentials.installed!;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

async function getStoredToken(oAuth2Client: OAuth2Client): Promise<boolean> {
  try {
    const token = readFileSync(TOKEN_PATH, "utf8");
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log("✅ Using existing token.");
    return true;
  } catch (error) {
    return false;
  }
}

async function getNewToken(oAuth2Client: OAuth2Client): Promise<void> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("🔐 Authorize this app by visiting this url:", authUrl);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error("❌ Error retrieving access token", err);
          reject(err);
          return;
        }

        if (token) {
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          writeFileSync(TOKEN_PATH, JSON.stringify(token));
          console.log("✅ Token stored to", TOKEN_PATH);
        }

        resolve();
      });
    });
  });
}

async function authorize(): Promise<OAuth2Client> {
  const oAuth2Client = await loadCredentials();

  // Check if we have a stored token
  const hasStoredToken = await getStoredToken(oAuth2Client);

  if (!hasStoredToken) {
    // Get a new token
    await getNewToken(oAuth2Client);
  }

  return oAuth2Client;
}

async function testConnection(auth: OAuth2Client): Promise<void> {
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const response = await gmail.users.getProfile({ userId: "me" });
    console.log("✅ Successfully connected to Gmail!");
    console.log(`📧 Email: ${response.data.emailAddress}`);
    console.log(`📊 Total messages: ${response.data.messagesTotal}`);
  } catch (error) {
    console.error("❌ Error testing Gmail connection:", error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log("🔐 Setting up Gmail authentication for MCP server...\n");

  try {
    const auth = await authorize();
    await testConnection(auth);

    console.log("\n✅ Setup complete! You can now run the MCP server:");
    console.log("npm run build && npm start");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run if this is the main module
main();
