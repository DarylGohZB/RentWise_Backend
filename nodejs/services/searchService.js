const { getCount, getSample, searchByTown, getTownStats } = require('../model/GovHouseDataModel');

module.exports = {
	getGovCount: async function () {
		return { count: await getCount() };
	},
	getGovSample: async function (limit) {
		return { rows: await getSample(limit) };
	},
	searchGovByTown: async function (filters) {
		return { rows: await searchByTown(filters) };
	},
  townStats: async function (townName) {
    return { stats: await getTownStats(townName) };
  },
};


