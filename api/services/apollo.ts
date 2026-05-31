const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const BASE_URL = "https://api.apollo.io/v1";

async function apolloFetch(path: string, options: RequestInit = {}) {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY not configured");
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Token ${APOLLO_API_KEY}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Apollo API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function createContact(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}): Promise<{ id: string }> {
  if (!APOLLO_API_KEY) {
    return { id: `mock-contact-${Date.now()}` };
  }
  const result = (await apolloFetch("/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  })) as { contact?: { id: string }; id?: string };
  return { id: result.contact?.id || result.id || `mock-contact-${Date.now()}` };
}

export async function enrollInSequence(
  contactId: string,
  sequenceId: string
): Promise<{ id: string }> {
  if (!APOLLO_API_KEY) {
    return { id: `mock-enrollment-${Date.now()}` };
  }
  const result = (await apolloFetch("/emailer_campaigns/enroll_contact", {
    method: "POST",
    body: JSON.stringify({ contact_id: contactId, emailer_campaign_id: sequenceId }),
  })) as { emailer_campaign_membership?: { id: string }; id?: string };
  return { id: result.emailer_campaign_membership?.id || result.id || `mock-enrollment-${Date.now()}` };
}

export async function getSequences(): Promise<Array<{ id: string; name: string }>> {
  if (!APOLLO_API_KEY) {
    return [
      { id: "seq-1", name: "Outbound Prospecting" },
      { id: "seq-2", name: "Follow-up Sequence" },
    ];
  }
  const result = (await apolloFetch("/emailer_campaigns?page=1&per_page=100")) as { emailer_campaigns?: Array<{ id: string; name: string }> };
  return (result.emailer_campaigns || []).map((s) => ({
    id: s.id,
    name: s.name,
  }));
}
