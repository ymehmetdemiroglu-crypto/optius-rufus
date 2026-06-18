const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const BASE_URL = "https://api.apollo.io/v1";
const API_BASE_URL = "https://api.apollo.io/api/v1";

async function apolloFetch(path: string, options: RequestInit = {}) {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY not configured");
  }
  const baseUrl = (path.startsWith("/mixed_people") || path.startsWith("/people")) ? API_BASE_URL : BASE_URL;
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Token ${APOLLO_API_KEY}`,
      "x-api-key": APOLLO_API_KEY,
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

export interface SearchPeopleFilters {
  person_titles?: string[];
  include_similar_titles?: boolean;
  q_keywords?: string;
  person_locations?: string[];
  person_seniorities?: string[];
  organization_locations?: string[];
  q_organization_domains_list?: string[];
  page?: number;
  per_page?: number;
}

export interface SearchPeopleResponse {
  total_entries: number;
  people: Array<{
    id: string;
    first_name: string;
    last_name_obfuscated: string;
    title: string | null;
    last_refreshed_at: string;
    has_email: boolean;
    has_city: boolean;
    has_state: boolean;
    has_country: boolean;
    has_direct_phone: string;
    organization: {
      name: string;
      has_industry: boolean;
      has_phone: boolean;
      has_city: boolean;
      has_state: boolean;
      has_country: boolean;
      has_zip_code: boolean;
      has_revenue: boolean;
      has_employee_count: boolean;
    };
  }>;
}

// Mock people database for development/offline testing
const MOCK_PEOPLE = [
  {
    id: "mock-person-andrew-huberman",
    first_name: "Andrew",
    last_name_obfuscated: "Hu***n",
    title: "Professor and Neuroscientist at Stanford & Host",
    last_refreshed_at: "2025-11-04T23:20:32.690+00:00",
    has_email: true,
    has_city: true,
    has_state: true,
    has_country: true,
    has_direct_phone: "Yes",
    organization: {
      name: "Scicomm Media",
      has_industry: true,
      has_phone: false,
      has_city: true,
      has_state: true,
      has_country: true,
      has_zip_code: false,
      has_revenue: false,
      has_employee_count: true,
    },
    enriched: {
      email: "andrew.huberman@stanford.edu",
      last_name: "Huberman",
    }
  },
  {
    id: "mock-person-jon-strong",
    first_name: "Jon",
    last_name_obfuscated: "St***g",
    title: "Managing Director",
    last_refreshed_at: "2025-11-05T15:56:08.901+00:00",
    has_email: true,
    has_city: true,
    has_state: true,
    has_country: true,
    has_direct_phone: "Yes",
    organization: {
      name: "Lazard",
      has_industry: true,
      has_phone: true,
      has_city: true,
      has_state: true,
      has_country: true,
      has_zip_code: true,
      has_revenue: true,
      has_employee_count: true,
    },
    enriched: {
      email: "jon.strong@lazard.com",
      last_name: "Strong",
    }
  },
  {
    id: "mock-person-lorena-acosta",
    first_name: "Lorena",
    last_name_obfuscated: "Ac***a",
    title: "Director of Operations",
    last_refreshed_at: "2025-11-03T10:01:50.493+00:00",
    has_email: true,
    has_city: true,
    has_state: true,
    has_country: true,
    has_direct_phone: "Yes",
    organization: {
      name: "Be Busy Being Awesome",
      has_industry: true,
      has_phone: false,
      has_city: true,
      has_state: true,
      has_country: true,
      has_zip_code: false,
      has_revenue: false,
      has_employee_count: true,
    },
    enriched: {
      email: "lorena@bebusyawesome.com",
      last_name: "Acosta",
    }
  },
  {
    id: "mock-person-linda-chen",
    first_name: "Linda",
    last_name_obfuscated: "Ch***n",
    title: "Sales Manager",
    last_refreshed_at: "2025-09-29T11:53:35.791+00:00",
    has_email: true,
    has_city: true,
    has_state: true,
    has_country: true,
    has_direct_phone: "Yes",
    organization: {
      name: "MCU Technology Co., Ltd",
      has_industry: true,
      has_phone: true,
      has_city: false,
      has_state: false,
      has_country: false,
      has_zip_code: false,
      has_revenue: false,
      has_employee_count: true,
    },
    enriched: {
      email: "linda.chen@mcutech.cn",
      last_name: "Chen",
    }
  },
  {
    id: "mock-person-nicholas-thompson",
    first_name: "Nicholas",
    last_name_obfuscated: "Th***n",
    title: "Chief Executive Officer",
    last_refreshed_at: "2025-11-07T17:08:51.086+00:00",
    has_email: true,
    has_city: true,
    has_state: true,
    has_country: true,
    has_direct_phone: "Yes",
    organization: {
      name: "The Atlantic",
      has_industry: true,
      has_phone: true,
      has_city: true,
      has_state: true,
      has_country: true,
      has_zip_code: true,
      has_revenue: true,
      has_employee_count: true,
    },
    enriched: {
      email: "nicholas@theatlantic.com",
      last_name: "Thompson",
    }
  }
];

export async function searchPeople(filters: SearchPeopleFilters): Promise<SearchPeopleResponse> {
  if (!APOLLO_API_KEY) {
    let filtered = [...MOCK_PEOPLE];
    if (filters.q_keywords) {
      const kw = filters.q_keywords.toLowerCase();
      filtered = filtered.filter(p => 
        p.first_name.toLowerCase().includes(kw) ||
        (p.title && p.title.toLowerCase().includes(kw)) ||
        p.organization.name.toLowerCase().includes(kw)
      );
    }
    if (filters.person_titles && filters.person_titles.length > 0) {
      const titles = filters.person_titles.map(t => t.toLowerCase());
      filtered = filtered.filter(p => 
        p.title && titles.some(t => p.title!.toLowerCase().includes(t))
      );
    }

    const perPage = filters.per_page || 10;
    const page = filters.page || 1;
    const offset = (page - 1) * perPage;
    const items = filtered.slice(offset, offset + perPage);

    return {
      total_entries: filtered.length,
      people: items.map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name_obfuscated: p.last_name_obfuscated,
        title: p.title,
        last_refreshed_at: p.last_refreshed_at,
        has_email: p.has_email,
        has_city: p.has_city,
        has_state: p.has_state,
        has_country: p.has_country,
        has_direct_phone: p.has_direct_phone,
        organization: p.organization,
      })),
    };
  }

  const queryParams = new URLSearchParams();
  if (filters.person_titles) {
    filters.person_titles.forEach(t => queryParams.append("person_titles[]", t));
  }
  if (filters.person_locations) {
    filters.person_locations.forEach(l => queryParams.append("person_locations[]", l));
  }
  if (filters.person_seniorities) {
    filters.person_seniorities.forEach(s => queryParams.append("person_seniorities[]", s));
  }
  if (filters.organization_locations) {
    filters.organization_locations.forEach(ol => queryParams.append("organization_locations[]", ol));
  }
  if (filters.q_organization_domains_list) {
    filters.q_organization_domains_list.forEach(d => queryParams.append("q_organization_domains_list[]", d));
  }
  if (filters.include_similar_titles !== undefined) {
    queryParams.append("include_similar_titles", String(filters.include_similar_titles));
  }
  if (filters.q_keywords) {
    queryParams.append("q_keywords", filters.q_keywords);
  }
  if (filters.page) {
    queryParams.append("page", String(filters.page));
  }
  if (filters.per_page) {
    queryParams.append("per_page", String(filters.per_page));
  }

  const result = await apolloFetch(`/mixed_people/api_search?${queryParams.toString()}`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return result as SearchPeopleResponse;
}

export async function enrichAndImportProspect(
  personId: string,
  asin?: string,
  marketplace?: string
): Promise<{ success: boolean; prospectId: number; slug: string }> {
  let firstName: string;
  let lastName: string;
  let email: string;
  let company: string;

  if (!APOLLO_API_KEY) {
    const mock = MOCK_PEOPLE.find(p => p.id === personId);
    if (!mock) {
      throw new Error(`Mock person not found for ID: ${personId}`);
    }
    firstName = mock.first_name;
    lastName = mock.enriched.last_name;
    email = mock.enriched.email;
    company = mock.organization.name;
  } else {
    const result = await apolloFetch("/people/match", {
      method: "POST",
      body: JSON.stringify({ id: personId }),
    }) as { person?: { first_name?: string; last_name?: string; email?: string; organization?: { name?: string } } };

    const person = result.person;
    if (!person || !person.email) {
      throw new Error(`Enrichment failed: No email returned by Apollo for ID ${personId}`);
    }

    firstName = person.first_name || "";
    lastName = person.last_name || "";
    email = person.email;
    company = person.organization?.name || "";
  }

  const { createProspect } = await import("../prospect/service.js");
  const prospect = await createProspect({
    email,
    firstName,
    lastName,
    company,
    asin,
    marketplace: marketplace || "US",
  });

  return {
    success: true,
    prospectId: prospect.id,
    slug: prospect.slug,
  };
}
