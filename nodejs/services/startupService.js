const { ensureTable, upsertRecords } = require('../model/GovHouseDataModel');
const { fetchPage } = require('../services/govtApiService');
const UserModel = require('../model/UserModel');
const ListingModel = require('../model/ListingModel');
const EnquiryModel = require('../model/EnquiryModel');
const govtApiStatusModel = require('../model/govtApiStatusModel');

const DATASET_ID = 'd_c9f57187485a850908655db0e8cfe651';

module.exports = {
  // Ensure required tables exist (lightweight)
  ensureTables: async function () {
    console.log('[SERVICE/STARTUP] Ensuring DB tables...');
    await UserModel.ensureTable();
    await ListingModel.ensureTable();
    await EnquiryModel.ensureTable();
    await ensureTable(); // gov table
    console.log('[SERVICE/STARTUP] DB tables ensured');
    return { ok: true };
  },

  // Full startup sync: fetch gov data and upsert
  runStartupSync: async function () {
    console.log('[SERVICE/STARTUP] Running full startup sync...');
    await module.exports.ensureTables();

    const pageSize = 50;
    let offset = 0;
    let total = Infinity;
    let inserted = 0;

    while (offset < total) {
      const { total: t, records } = await fetchPage(DATASET_ID, offset, pageSize);
      total = t;
      if (!records || !records.length) break;
      const res = await upsertRecords(records, 'data.gov.sg');
      inserted += (res && res.affectedRows) ? res.affectedRows : 0;
      offset += records.length;
      console.log(`[startupSync] upserted ${inserted} so far (offset=${offset}/${total})`);
    }

    // Update the last sync time here...
    await govtApiStatusModel.setLastSyncNow('operational');

    return { ok: true, inserted };
  }
};
