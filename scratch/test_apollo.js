import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apolloKeyMatch = envContent.match(/^APOLLO_API_KEY=(.*)$/m);
const APOLLO_API_KEY = apolloKeyMatch ? apolloKeyMatch[1].trim() : null;

console.log('Using APOLLO_API_KEY from .env:', APOLLO_API_KEY);

if (!APOLLO_API_KEY) {
  console.error('APOLLO_API_KEY not found in .env');
  process.exit(1);
}

async function testEnrollment() {
  const sequenceId = "6a30063082147b001cd1f361"; // Amazon Rufus Outreach - Starter Brands
  const contactId = "6a3970e59e11c1000c5e7edf";  // The contact we created successfully (dpalame@saltwrap.com)
  const emailAccountId = "69eb608b9f3f200021f45855"; // nexgenoptimusprime email account id
  const url = `https://api.apollo.io/v1/emailer_campaigns/${sequenceId}/add_contact_ids`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APOLLO_API_KEY
      },
      body: JSON.stringify({
        contact_ids: [contactId],
        send_email_from_email_account_id: emailAccountId
      })
    });
    console.log(`URL: ${url} -> Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error:`, err);
  }
}

testEnrollment();
