const { ensureTable, upsertRecords } = require('../model/GovHouseDataModel');
const { fetchPage } = require('../services/govtApiService');

const DATASET_ID = 'd_c9f57187485a850908655db0e8cfe651';

module.exports = {
  /**
   * Ensures the target table exists, then fetches all records from the
   * government dataset and upserts them into MySQL.
   */
  runStartupSync: async function () {
    await ensureTable();
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


