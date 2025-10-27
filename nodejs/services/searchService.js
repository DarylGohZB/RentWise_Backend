const { getCount, getSample, searchByTown } = require('../model/GovHouseDataModel');
const govListingService = require('./govListingService');

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
		// Route through the govListingService which in turn uses the GovHouse model.
		const stats = await govListingService.getTownStats(townName);
		return { stats };
	},
};


