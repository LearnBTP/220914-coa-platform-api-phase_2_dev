const cds = require("@sap/cds");

cds.exec("run", "--in-memory?");

module.exports = new Promise((resolve) => {
	cds.on('listening', () => {
		resolve(cds.app);
	});
});