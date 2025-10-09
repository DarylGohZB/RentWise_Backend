// apiManagementController.js
const {
  getCount,
  getSample,
  searchByTown,
  listTownsByScore,
  ensureTable,
  upsertRecords,
} = require('../model/GovHouseDataModel');
const { fetchAll } = require('../services/govtApiService');

const DATASET_ID = 'd_c9f57187485a850908655db0e8cfe651';

module.exports.handleTest = async function (req) {
  console.log('[CONTROLLER/API-MGMT] handleTest called');
  return true;
};

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

module.exports.rankTowns = async function (req) {
  const filters = {
    flatType: req?.query?.flatType,
    minPrice: req?.query?.minPrice,
    maxPrice: req?.query?.maxPrice,
    minAreaSqm: req?.query?.minAreaSqm,
    maxAreaSqm: req?.query?.maxAreaSqm,
    limit: req?.query?.limit,
  };
  console.log('[CONTROLLER/API-MGMT] rankTowns called with filters:', filters);
  try {
    const towns = await listTownsByScore(filters);
    console.log(`[CONTROLLER/API-MGMT] rankTowns result: ${towns.length} towns`);
    return { towns };
  } catch (err) {
    console.error('[CONTROLLER/API-MGMT] rankTowns error:', err);
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
    const rows = await fetchAll(DATASET_ID, pageSize, max);
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
