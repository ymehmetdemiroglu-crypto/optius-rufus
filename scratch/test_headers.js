import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apolloKeyMatch = envContent.match(/^APOLLO_API_KEY=(.*)$/m);
const APOLLO_API_KEY = apolloKeyMatch ? apolloKeyMatch[1].trim() : null;

const contactId = '6a34311099172e00189b0653';
const sequenceId = '6a30063082147b001cd1f361'; // Starter campaign
const emailAccountId = '69eb608b9f3f200021f45855';

async function testEnroll() {
  try {
    const url = `https://api.apollo.io/api/v1/emailer_campaigns/${sequenceId}/add_contact_ids`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APOLLO_API_KEY
      },
      body: JSON.stringify({
        contact_ids: [contactId],
        emailer_campaign_id: sequenceId,
        send_email_from_email_account_id: emailAccountId
      })
    });
    console.log(`Enroll Status: ${response.status}`);
    const data = await response.json();
    console.log('Enroll Data:', JSON.stringify(data).slice(0, 500));
  } catch (err) {
    console.error('Enroll error:', err);
  }
}

testEnroll();
