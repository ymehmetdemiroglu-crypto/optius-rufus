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

async function test() {
  const url = 'https://api.apollo.io/api/v1/emailer_campaigns/search';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APOLLO_API_KEY,
        'Authorization': `Api-Token ${APOLLO_API_KEY}`
      },
      body: JSON.stringify({
        page: 1,
        per_page: 100
      })
    });
    console.log(`URL: ${url} -> Status: ${response.status}`);
    const data = await response.json();
    console.log('Campaigns count:', data.emailer_campaigns ? data.emailer_campaigns.length : 'none');
    if (data.emailer_campaigns) {
      console.log('Campaigns:');
      data.emailer_campaigns.forEach(c => {
        console.log(`- ID: ${c.id}, Name: ${c.name}, Active: ${c.active}`);
      });
    } else {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(`Error:`, err);
  }
}

test();
