// apiManagementController.js
const { getCount, getSample, searchByTown, listTownsByScore } = require('../model/GovHouseDataModel');
const { fetchAll } = require('../services/govtApiService');
const { ensureTable, upsertRecords } = require('../model/GovHouseDataModel');
const DATASET_ID = 'd_c9f57187485a850908655db0e8cfe651';

module.exports.handleTest = async function (req) {
  return true;
};

module.exports.getGovCount = async function (req) {
  const c = await getCount();
  return { count: c };
};

module.exports.getGovSample = async function (req) {
  const limit = req && req.query && req.query.limit ? Number(req.query.limit) : 5;
  const rows = await getSample(limit);
  return { rows };
};

module.exports.searchGovByTown = async function (req) {
  const filters = {
    town: req && req.query ? req.query.town : undefined,
    flatType: req && req.query ? req.query.flatType : undefined,
    minPrice: req && req.query ? req.query.minPrice : undefined,
    maxPrice: req && req.query ? req.query.maxPrice : undefined,
    minAreaSqm: req && req.query ? req.query.minAreaSqm : undefined,
    maxAreaSqm: req && req.query ? req.query.maxAreaSqm : undefined,
    limit: req && req.query ? req.query.limit : undefined,
    offset: req && req.query ? req.query.offset : undefined,
  };
  const rows = await searchByTown(filters);
  return { rows };
};

module.exports.rankTowns = async function (req) {
  const filters = {
    flatType: req && req.query ? req.query.flatType : undefined,
    minPrice: req && req.query ? req.query.minPrice : undefined,
    maxPrice: req && req.query ? req.query.maxPrice : undefined,
    minAreaSqm: req && req.query ? req.query.minAreaSqm : undefined,
    maxAreaSqm: req && req.query ? req.query.maxAreaSqm : undefined,
    limit: req && req.query ? req.query.limit : undefined,
  };
  const towns = await listTownsByScore(filters);
  return { towns };
};

module.exports.syncGovData = async function (req) {
  const max = req && req.query && req.query.max ? Number(req.query.max) : undefined;
  const pageSize = req && req.query && req.query.pageSize ? Number(req.query.pageSize) : undefined;
  await ensureTable();
  const rows = await fetchAll(DATASET_ID, pageSize || undefined, max || undefined);
  const res = await upsertRecords(rows, 'data.gov.sg');
  const count = await getCount();
  return { ok: true, fetched: rows.length, upserted: res.affectedRows, currentCount: count };
};
