const { ensureTable, upsertRecords } = require('../model/GovHouseDataModel');
const { fetchPage } = require('../services/govtApiService');
const UserModel = require('../model/UserModel');
const ListingModel = require('../model/ListingModel');
const EnquiryModel = require('../model/EnquiryModel');

const DATASET_ID = 'd_c9f57187485a850908655db0e8cfe651';

module.exports = {
  /**
   * Ensures all tables exist, then fetches all records from the
   * government dataset and upserts them into MySQL.
   */
  runStartupSync: async function () {
    console.log('[STARTUP] Ensuring all database tables exist...');
    
    // Ensure all tables exist
    await UserModel.ensureTable();
    await ListingModel.ensureTable();
    await EnquiryModel.ensureTable();
    await ensureTable(); // Government data table
    
    console.log('[STARTUP] All tables ensured, starting government data sync...');
    
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
    return { ok: true, inserted };
  }
};

