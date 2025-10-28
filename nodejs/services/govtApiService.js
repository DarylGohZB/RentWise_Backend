// Minimal service to fetch paginated records from data.gov.sg Datastore API
// Uses global fetch available in Node 18+.
const GovtApiStatusModel = require('../model/GovtApiStatusModel');
const DEFAULT_PAGE_SIZE = 50; // smaller page size to reduce rate limiting

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch a single page from data.gov.sg datastore_search.
 * @param {string} resourceId
 * @param {number} offset
 * @param {number} limit
 * @returns {Promise<{ total: number, records: any[] }>}
 */
async function fetchPage(resourceId, offset = 0, limit = DEFAULT_PAGE_SIZE) {
  const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${resourceId}&offset=${offset}&limit=${limit}`;
  const headers = {};
  if (process.env.DATA_GOV_SG_API_KEY) {
    headers['X-API-Key'] = process.env.DATA_GOV_SG_API_KEY;
  }

  let attempt = 0;
  const maxAttempts = 5;
  let backoffMs = 500;

  while (true) {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const body = await res.json();
      const result = body && body.result ? body.result : { total: 0, records: [] };
      const total = typeof result.total === 'number' ? result.total : 0;
      const records = Array.isArray(result.records) ? result.records : [];
      return { total, records };
    }

    // Handle rate limiting with backoff
    if (res.status === 429 && attempt < maxAttempts) {
      attempt += 1;
      await sleep(backoffMs);
      backoffMs = Math.min(backoffMs * 2, 8000);
      continue;
    }

    throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
  }
}

/**
 * Fetch all records from a datastore resource by paging until completion.
 * Be mindful that very large datasets will take longer to sync.
 * @param {string} resourceId
 * @param {number} pageSize
 * @returns {Promise<any[]>}
 */
async function fetchAll(resourceId, pageSize = DEFAULT_PAGE_SIZE, maxRecords) {
  let offset = 0;
  let total = Infinity;
  const out = [];

  while (offset < total) {
    const { total: t, records } = await fetchPage(resourceId, offset, pageSize);
    total = t;
    if (!records.length) break;
    out.push(...records);
    offset += records.length;
    if (typeof maxRecords === 'number' && out.length >= maxRecords) {
      return out.slice(0, maxRecords);
    }
    // progress log
    console.log(`[govtApi] fetched ${out.length}/${isFinite(total) ? total : '?'} records (pageSize=${pageSize})`);
    // brief delay between pages to reduce rate limiting
    await sleep(200);
  }
  return out;
}

async function getGovtApiStatusInfo() {
  const row = await GovtApiStatusModel.getStatusRow();
  if (!row) throw new Error('Status row missing');
  return {
    apiStatus: row.current_status,
    lastSync: row.last_sync_time,
    lastKeyUpdate: row.last_key_update_time,
  };
}

async function logGovtApiKeyUpdate() {
  try {
    await GovtApiStatusModel.setLastKeyUpdateNow();
    return { success: true };
  } catch (err) {
    console.error('[Service] logGovtApiKeyUpdate error:', err);
    return { success: false };
  }
}

async function logGovtApiSync(status) {
  await GovtApiStatusModel.setLastSyncNow(status);
}

/**
 * Update the DATA_GOV_SG_API_KEY in the repository .env file and
 * record the key update timestamp in the DB (via GovtApiStatusModel).
 * This moves the controller-level business logic into the service layer
 * so controllers remain thin boundaries.
 */
async function updateApiKey(apiKey) {
  try {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return { status: 400, body: { ok: false, message: 'Missing apiKey in request body' } };
    }

    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '..', '.env');

    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      // If .env doesn't exist, we'll create one
      envContent = '';
    }

    const keyName = 'DATA_GOV_SG_API_KEY';
    const sanitizedValue = apiKey.replace(/\r?\n/g, '').trim();

    const regexp = new RegExp(`^${keyName}=.*$`, 'm');
    if (regexp.test(envContent)) {
      envContent = envContent.replace(regexp, `${keyName}=${sanitizedValue}`);
    } else {
      if (envContent.length && !envContent.endsWith('\n')) envContent += '\n';
      envContent += `${keyName}=${sanitizedValue}\n`;
    }

    fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });

    // Log the key update in the DB (reuse existing helper)
    const logRes = await logGovtApiKeyUpdate();
    if (!logRes || !logRes.success) {
      return { status: 500, body: { ok: false, message: 'Failed to log key update in DB' } };
    }

    return { status: 200, body: { ok: true, message: 'API key saved and last update time logged' } };
  } catch (err) {
    console.error('[Service] updateApiKey error:', err);
    return { status: 500, body: { ok: false, message: 'Failed to update API key' } };
  }
}

module.exports = {
  fetchPage,
  fetchAll,
  getGovtApiStatusInfo,
  logGovtApiKeyUpdate,
  updateApiKey,
  logGovtApiSync,
};


