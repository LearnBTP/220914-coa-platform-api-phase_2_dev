const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("./server");

// Configure chai
chai.use(chaiHttp);
chai.should();

const token = 'some_token';
let app = null;

before((done) => {
	server.then((result) => {
		app = result;
		done();
	});
});

describe("All Tests", () => {
	// describe("GET /line-simulation/F4help", () => {
	// 	it("+ should return success of F4help", (done) => {
	// 		chai.request(app)
	// 			.get("/line-simulation/F4help")
	// 			.auth(token, { type: 'bearer' })
	// 			.end((error, response) => {
	// 				try {
	// 					response.should.have.status(200);
	// 					done();
	// 				} catch (error) {
	// 					done(error);
	// 				}
	// 			});
	// 	});
	// });
	describe("GET LineId /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=LineId%20asc&$search=&$select=LineId")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET Site /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=Site%20asc&$search=&$select=Site")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET GH_Site /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=GH_Site%20asc&$search=&$select=GH_Site")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET CM /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=CM%20asc&$search=&$select=CM")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET Program /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=Program%20asc&$search=&$select=Program")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET To_CM /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=To_CM%20asc&$search=&$select=To_CM")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET To_Site /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=To_Site%20asc&$search=&$select=To_Site")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET To_Program /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=Program%20asc&$search=&$select=To_Program")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET To_GH_Site /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=To_GH_Site%20asc&$search=&$select=To_GH_Site")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET To_Business_Grp /line-simulation/DropDownHelp", () => {
		it("+ should return success of DropDownHelp", (done) => {
			chai.request(app)
				.get("/line-simulation/DropDownHelp?$orderby=To_Business_Grp%20asc&$search=&$select=To_Business_Grp")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});
	describe("GET /line-simulation/SimulationData", () => {
		it("+ should return success of SimulationData", (done) => {
			chai.request(app)
				.get("/line-simulation/SimulationData")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});

	describe("GET /line-simulation/SimulationHeader", () => {
		it("+ should return success of SimulationHeader", (done) => {
			chai.request(app)
				.get("/line-simulation/SimulationHeader")
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});

	describe("POST SimulationHeader - line-simulation/SimulationHeader", () => {
		it("+ should return success", (done) => {
			chai.request(app)
				.post("/line-simulation/SimulationHeader")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
				.send({
					"Simulation_name": "Simulation_1",
					"From_GHSite": "iPhone_FXTY",
					"CM": "",
					"Site": "",
					"Program": "D20",
					"Line_ID": "B7",
					"Line_Type": "",
					"To_GHSite": "iPhone_FXGL",
					"To_CM": "",
					"To_Site": "",
					"To_Program": "N66",
					"To_Business_Grp": "IMAC",
					"createdBy": "",
					"modifiedBy": ""
				}
				)
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});

	describe("POST OnSimulate - line-simulation/OnSimulate", () => {
		it("+ should return success", (done) => {
			new Promise(async function (resolve) {

				await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SIMU_RFID").where({
					"SIMULATION_NAME": "RFID 002"
				}));
				await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SIMU_NONRFID").where({
					"SIMULATION_NAME": "RFID 002"
				}));
				await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SIMU_CO").where({
					"SIMULATION_NAME": "RFID 002"
				}));
				try {
					let response = await
						chai.request(app)
							.post("/line-simulation/OnSimulate")
							.auth(token, { type: 'bearer' })
							.set('Content-Type', 'application/json')
							.send({
								"simulationName": "RFID 002"
							})
					response.should.have.status(204);
					resolve();
				}
				catch (error) {
					console.log(error);
					resolve(error);
				}

			}).then(done)

			// .end((error, response) => {
			// 	try {
			// 		response.should.have.status(204);
			// 		done();
			// 	} catch (error) {
			// 		done(error);
			// 	}
			// });
		});
	});

	describe("POST BeforeSimulateValidation - line-simulation/BeforeSimulateValidation", () => {
		it("+ should return success", (done) => {
			chai.request(app)
				.post("/line-simulation/BeforeSimulateValidation")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
				.send({
					"From_GHSite": "iPhone_FXZZ",
					"Program": "D63"
				})
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done();
					} catch (error) {
						done(error);
					}
				});
		});
	});



});