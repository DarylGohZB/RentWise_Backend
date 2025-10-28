// apiManagementController.js
const {
  getCount,
  getSample,
  searchByTown,
  listTownsByScore,
  ensureTable,
  upsertRecords,
} = require('../model/GovHouseDataModel');
const govtApiService = require('../services/govtApiService');
const axios = require('axios');

const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const DATASET_ID = 'd_c9f57187485a850908655db0e8cfe651';

module.exports.handleTest = async function (req) {
  console.log('[CONTROLLER/API-MGMT] handleTest called');
  return true;
};

// GET status info
module.exports.getGovtApiStatus = async function (req) {
  try {
    const data = await govtApiService.getGovtApiStatusInfo();

    let apiKey;
    try {
      const envPath = path.join(__dirname, '..', '..', '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATA_GOV_SG_API_KEY=(.*)$/m);
      if (match && match[1]) {
        apiKey = match[1].replace(/^["']|["']$/g, '').trim(); // strip quotes if present
      }
    } catch (err) {
      console.warn('[API-MGMT] Could not read .env:', err);
    }

    if (!apiKey || !apiKey.length) {
      data.apiStatus = "Error (API Key not set)";
    } else if (apiKey !== 'L5NkSRPHLRXSXW4FVdJl3OtAnGm0ljG0') {
      data.apiStatus = "Error (Invalid API Key)";
    } else {
      data.apiStatus = "Operational";
    }

    return { success: true, data };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] getGovtApiStatusInfo failed:', err);
    return { success: false, message: 'Server error' };
  }
};

// Log API key update
module.exports.logGovtApiKeyUpdate = async function (req, res) {
  try {
    await govtApiService.logGovtApiKeyUpdate();
    return res.json({ success: true });
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] logGovtApiKeyUpdate failed:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Log sync
module.exports.updateGovApiAudit = async function (req, res) {
  try {
    const { status } = req.body;
    await govtApiService.logGovtApiSync(status || 'operational');
    return res.json({ success: true });
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] logGovtApiSync failed:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports.getGovCount = async function (req) {
  console.log('[CONTROLLER/API-MGMT] getGovCount called');
  try {
    const c = await getCount();
    console.log('[CONTROLLER/API-MGMT] getGovCount result:', c);
    return { count: c };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] getGovCount error:', err);
    throw err;
  }
};

module.exports.getGovSample = async function (req) {
  const limit = req?.query?.limit ? Number(req.query.limit) : 5;
  console.log(`[CONTROLLER/API-MGMT] getGovSample called (limit=${limit})`);
  try {
    const rows = await getSample(limit);
    console.log(`[CONTROLLER/API-MGMT] getGovSample result: ${rows.length} rows`);
    return { rows };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] getGovSample error:', err);
    throw err;
  }
};

module.exports.searchGovByTown = async function (req) {
  const filters = {
    town: req?.query?.town,
    flatType: req?.query?.flatType,
    minPrice: req?.query?.minPrice,
    maxPrice: req?.query?.maxPrice,
    minAreaSqm: req?.query?.minAreaSqm,
    maxAreaSqm: req?.query?.maxAreaSqm,
    limit: req?.query?.limit,
    offset: req?.query?.offset,
  };
  console.log('[CONTROLLER/API-MGMT] searchGovByTown called with filters:', filters);
  try {
    const rows = await searchByTown(filters);
    console.log(`[CONTROLLER/API-MGMT] searchGovByTown result: ${rows.length} rows`);
    return { rows };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] searchGovByTown error:', err);
    throw err;
  }
};


module.exports.syncGovData = async function (req) {
  const max = req?.query?.max ? Number(req.query.max) : undefined;
  const pageSize = req?.query?.pageSize ? Number(req.query.pageSize) : undefined;
  console.log(`[CONTROLLER/API-MGMT] syncGovData called (max=${max}, pageSize=${pageSize})`);

  try {
    console.log('[CONTROLLER/API-MGMT] Ensuring GovHouseData table exists...');
    await ensureTable();

    console.log('[CONTROLLER/API-MGMT] Fetching records from data.gov.sg...');
    const rows = await govtApiService.fetchAll(DATASET_ID, pageSize, max);
    console.log(`[CONTROLLER/API-MGMT] Fetched ${rows.length} records.`);

    console.log('[CONTROLLER/API-MGMT] Upserting records into database...');
    const res = await upsertRecords(rows, 'data.gov.sg');
    console.log(`[CONTROLLER/API-MGMT] Upsert completed: ${res.affectedRows} affected rows.`);

    const count = await getCount();
    console.log(`[CONTROLLER/API-MGMT] Sync complete. Current total count: ${count}`);

    return { ok: true, fetched: rows.length, upserted: res.affectedRows, currentCount: count };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] syncGovData error:', err);
    throw err;
  }
};

module.exports.extractGovDataToCSV = async function (req) {
  const max = 500; // Hardcoded limit to avoid huge datasets
  const pageSize = req?.query?.pageSize ? Number(req.query.pageSize) : undefined;
  console.log(`[CONTROLLER/API-MGMT] extractGovDataToCSV called (max=${max}, pageSize=${pageSize})`);

  try {
    console.log('[CONTROLLER/API-MGMT] Ensuring GovHouseData table exists...');
    await ensureTable();

    console.log('[CONTROLLER/API-MGMT] Fetching records from data.gov.sg...');
    const rows = await govtApiService.fetchAll(DATASET_ID, pageSize, max);
    console.log(`[CONTROLLER/API-MGMT] Fetched ${rows.length} records.`);

    const fileName = `gov-data-${Date.now()}.csv`;
    const csvFilePath = path.join(__dirname, '../exports/', fileName);

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]).map(key => ({ id: key, title: key }));
      const csvWriter = createObjectCsvWriter({ path: csvFilePath, header: headers });

      await csvWriter.writeRecords(rows);
      console.log(`[CONTROLLER/API-MGMT] CSV file written to ${csvFilePath}`);
    }

    return {
      ok: true,
      fetched: rows.length,
      message: `CSV generated successfully with ${rows.length} records.`,
    };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] extractGovDataToCSV error:', err);
    throw err;
  }
};

module.exports.getApiLogs = async function (req) {
  console.log('[CONTROLLER/API-MGMT] getApiLogs called');
  try {
    const ApiLoggerService = require('../services/ApiLoggerService');
    const logs = await ApiLoggerService.getRecentLogs(20);
    return { status: 200, body: { success: true, logs } };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] getApiLogs error:', err);
    return { status: 500, body: { message: 'Failed to fetch API logs' } };
  }
};

module.exports.testGovtApiKey = async function (req) {
  console.log('[CONTROLLER/API-MGMT] testGovtApiKey called');

  try {
    const apiKey = process.env.DATA_GOV_SG_API_KEY;
    if (!apiKey || !apiKey.length) {
      return { ok: false, message: 'API key not set in .env' };
    } else if (apiKey != 'L5NkSRPHLRXSXW4FVdJl3OtAnGm0ljG0') {
      return { ok: false, message: 'API key is invalid!' };
    }

    // The API endpoint used (8f6bfe2e-3008-43fa-bac9-f7982a9c5c5a) is an actual HDB resale dataset from data.gov.sg
    const testUrl = `https://data.gov.sg/api/action/datastore_search?resource_id=d_c9f57187485a850908655db0e8cfe651&offset=0&limit=1`;

    const response = await axios.get(testUrl, {
      headers: {
        'api-key': apiKey
      },
      timeout: 5000
    });

    if (response.data && response.data.success) {
      return { ok: true };
    } else {
      return { ok: false, message: 'API response unsuccessful' };
    }

  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] testGovtApiKey error:', err.message);
    return { ok: false, message: err.message };
  }
};

module.exports.updateApiKey = async function (req) {
  console.log('[CONTROLLER/API-MGMT] updateApiKey called');
  try {
    const { apiKey } = req.body || {};
    // Delegate business logic to the service layer so controller remains a thin boundary
    const result = await govtApiService.updateApiKey(apiKey);
    return { status: result.status, body: result.body };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] updateApiKey error:', err);
    return {
      status: 500,
      body: { ok: false, message: 'Failed to update API key' }
    };
  }
};