const { getCount, getSample, searchByTown, listTownsByScore } = require('../model/GovHouseDataModel');

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
	rankTowns: async function (filters) {
		return { towns: await listTownsByScore(filters) };
	},
};


