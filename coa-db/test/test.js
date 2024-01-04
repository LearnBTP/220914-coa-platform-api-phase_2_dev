'use strict'
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("./server");
const fs = require("fs");
chai.use(chaiHttp);
chai.should();
const cds = require('@sap/cds');
var hdb;
const token = 'some_token';
const token2 = 'some_token';
let app = null;
before((done) => {
	server.then(async (result) => {
		const db = await cds.connect.to('db');
		hdb = await cds.connect.to('db');
		const model1 = cds.compile.to.csn(`
		  entity V_AQIDANDBOMJOIN {
			key     createdBy: String(255)  ; 
			key     modifiedBy: String(255) ; 
			key     CM: String(30)  ; 
			key     Site: String(30) ; 
			key     Aqid: String(18) ; 
			key     Mfr: String(255)  ; 
			key     Program: String(40)  ; 
			key     Equipment_Name: String(255)   ; 
			key     Stack_item: String(1)   ; 
			key     GH_Site: String(30)  ; 
			key     Group_Priority: String(18)   ; 
			key     Equipment_Type: String(32) ; 
			key     createdAt: Timestamp  ; 
			key     modifiedAt: Timestamp ; 
			key     Station: String(255)
			}
			`);
		const model2 = cds.compile.to.csn(`
		entity COM_APPLE_COA_T_COA_AQID_MAPPING {
			key Raw_Aqid : String(18)  ;
			key Mapped_Aqid : String(18)  ;
			Cm_Recommendation : String(18) ;
			key Program : String(40)  ;
			key Station : String(128)  ;
			key Site :  String(30)  ;
			key CM :  String(30)  ;
			key GH_Site :  String(30);
			Stack_Item : String(1);
			Make_Aqid : String(18)  ;
			Short_Name : String(40) ;
			Equipment_Name : String(255)  ;
			MFR : String(255)  ;
			Recommendation_Type : String(18)  @assert.range enum { SystemRecommended = 'S';
													Exceptions = 'E'; UserRecommendations = 'U'};
			TimeStamp : String(18)  ;
			Update_By_User : String(18)  ;
			Comment : String(150)  ;
			createdAt: DateTime;
			createdBy: String;
			modifiedAt: DateTime;
			modifiedBy: String;
			SAP_CM_Site : String(61) ;
		}
			`)
		await cds.deploy(model1).to(db);
		await cds.deploy(model2).to(db);
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "SHPH",
			"Aqid": "temp_001",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "N",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "",
			"Equipment_Type": "periphery",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "SHPH",
			"Aqid": "temp_002",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "N",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "1-1",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "SHPH",
			"Aqid": "temp_002-R",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "N",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "1-1",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "SHPH",
			"Aqid": "temp_003",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "N",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "12-2",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "KSPH",
			"Aqid": "temp_004",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "N",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "12-2",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "KSPH",
			"Aqid": "temp_005",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "Y",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "3-3",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "SHPH",
			"Aqid": "temp_006",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "N",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "3-3",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "SHPH",
			"Aqid": "temp_005-R",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "Y",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "3-3",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('V_AQIDANDBOMJOIN', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"CM": "PEGA",
			"Site": "SHPH",
			"Aqid": "temp_005-R",
			"Mfr": "Pegatron",
			"Program": "D63",
			"Equipment_Name": "camera",
			"Stack_item": "N",
			"GH_Site": "PEHA-SHPH",
			"Group_Priority": "3-3",
			"Equipment_Type": "buy",
			"createdAt": "0",
			"modifiedAt": "0",
			"Station": "test"
		}));
		await cds.run(INSERT.into('COM_APPLE_COA_T_COA_AQID_MAPPING', {
			"createdBy": "privileged",
			"modifiedBy": "privileged",
			"Raw_Aqid": "temp_001",
			"Mapped_Aqid": "temp_001",
			"Cm_Recommendation": "",
			"Program": "D63",
			"Station": "Station1",
			"Site": "SHPH",
			"CM": "PEGA",
			"Short_Name": "shortName",
			"Comment": "NT22",
			"GH_Site": "SHPH-PEGA",
			"createdAt": "0",
			"modifiedAt": "0"
		}));

		
		await cds.run(INSERT.into('COM_APPLE_COA_T_COA_AQID_MAPPING', {
			"Raw_Aqid": "00108-01",
			"Mapped_Aqid": "00108-01",
			"Program": "D53G",
			"Station": "D53G A-OTA",
			"Site": "PBPH",
			"CM": "HHZZ",
			"GH_Site": "FXZZ",
			"Short_Name": "shortName1",
			"Comment": "Test1"
		}));
		app = result;
		done();
	});
});


/****************************** Worklist (Homepage) ******************************/
describe("All Tests", () => {

	describe("(0) CM - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=CM&$search=H")
				.set('authorization', 'Bearer some_token')
				.auth(token2, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});

	describe("(1) CM - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=CM&$search=PEGA")
				.set('authorization', 'Bearer some_token')
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});
	describe("(2) Site - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=Site&$search=KSPH")
				.set('authorization', 'Bearer some_token')
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});

	describe("(3) Raw_Aqid - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=Raw_Aqid&$search=H")
				.set('authorization', 'Bearer some_token')
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});

	describe("(4) Program - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=Program&$search=D10")
				.set('authorization', 'Bearer some_token')
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});

	describe("(5) Recommendation_Type - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=Recommendation_Type&$search=U")
				.set('authorization', 'Bearer some_token')
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});

	describe("(6) MFR - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=MFR&$search=H")
				.set('authorization', 'Bearer some_token')
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});

	describe("(7) GH_Site - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/aqid-details/F4help?$skip=0&$top=10&$select=GH_Site&$search=GH_Site")
				.set('authorization', 'Bearer some_token')
				.auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (err) {
						console.log(err);
						done(err);
					}
				});
		});
	});


	describe("(8) Get - AQIDMapping", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged //
		it("+ should return a a status of 200 on correct beginFetch call", (done) => {
			new Promise(async function (resolve) {
				await cds.connect.to('db');
				chai.request(app)
					.get("/aqid-details/AQIDMapping")
					.auth(token, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.end((error, response) => {
						try {
							response.should.have.status(200);
							resolve();
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done)

		});
	});

	describe("(9) PUT AQIDMapping", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


		it("+ should return 200 on correct AQIDMapping PUT request", (done) => {
			new Promise(async function (resolve) {
				chai.request(app)
					.put("/aqid-details/AQIDMapping(Raw_Aqid='temp_001',Mapped_Aqid='temp_001',Program='D63',Station='Station1',Site='KSPH',CM='PEGA',GH_Site='KSPH-PEGA')")
					.auth(token, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.send({
						"Raw_Aqid": "temp_001",
						"Mapped_Aqid": "temp_001",
						"Cm_Recommendation": "",
						"Program": "D63",
						"Station": "Station1",
						"Site": "KSPH",
						"CM": "PEGA",
						"Short_Name": "shortNamek8",
						"Comment": "NT22",
						"GH_Site": "KSPH-PEGA"
					})
					.end((error, response) => {
						try {
							response.should.have.status(204);
							resolve()
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done);

		});
	});

	describe("(10) PUT AQIDMapping without data in table", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


		it("+ should return 200 on correct AQIDMapping PUT request", (done) => {
			new Promise(async function (resolve) {
				chai.request(app)
					.put("/aqid-details/AQIDMapping(Raw_Aqid='temp_001',Mapped_Aqid='temp_001_',Program='D63',Station='Station1',Site='KSPH',CM='PEGA',GH_Site='KSPH-PEGA')")
					.auth(token, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.send({
						"Raw_Aqid": "temp_001_",
						"Mapped_Aqid": "temp_001",
						"Cm_Recommendation": "",
						"Program": "D63",
						"Station": "Station1",
						"Site": "KSPH",
						"CM": "PEGA",
						"Short_Name": "shortNamek8",
						"Comment": "NT22",
						"GH_Site": "KSPH-PEGA"
					})
					.end((error, response) => {
						try {
							response.should.have.status(204);
							resolve()
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done);
			// T_COA_AQID_MAPPING
		});
	});

	describe("(11) Upload_AQIDMapping", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct Upload_AQIDMapping PUT request", (done) => {
			new Promise(async function (resolve) {
				chai.request(app)
					.put("/aqid-details/Upload_AQIDMapping/csv")
					.auth(token2, { type: 'bearer' })
					.set('Content-Type', 'text/csv')
					.set('Content-Length', '650000')
					.attach('fileName', '/home/user/projects/220914-coa-platform-api-main/coa-db/tests/AQID_Mapping.csv', 'AQID_Mapping.csv')
					.end((error, response) => {
						try {
							response.should.have.status(200);
							resolve()
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done);
		});
	});

	describe("(12) POST to aqid_mapping_action", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged //
		it("+ should return a a status of 201 on correct aqid_mapping_action call", (done) => {
			new Promise(async function (resolve) {
				await cds.connect.to('db');
				chai.request(app)
					.post("/aqid-details/aqid_mapping_action")
					.auth(token2, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.send({
						"AqidData": [{
							"Raw_Aqid": "00108-01",
							"Mapped_Aqid": "00108-01",
							"Cm_Recommendation": "CM1",
							"Program": "D53G",
							"Station": "D53G A-OTA",
							"Site": "PBPH",
							"CM": "HHZZ",
							"Short_Name": "TestShortName",
							"Comment": "TestComments",
							"GH_Site": "FXZZ"
						}]
					})
					.end((error, response) => {
						try {
							response.should.have.status(201);
							resolve();
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done)

		});
	});

	describe("(13) User does not have access to modify this CM-Site data - POST aqid_mapping_action", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged //
		it("+ should return a a status of 201 on correct aqid_mapping_action call", (done) => {
			new Promise(async function (resolve) {
				await cds.connect.to('db');
				chai.request(app)
					.post("/aqid-details/aqid_mapping_action")
					.auth(token, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.send({
						"AqidData": [{
							"Raw_Aqid": "00108-01",
							"Mapped_Aqid": "00108-01",
							"Cm_Recommendation": "CM1",
							"Program": "D53G",
							"Station": "D53G A-OTA",
							"Site": "PBPH",
							"CM": "HHZZ",
							"Short_Name": "TestShortName",
							"Comment": "TestComments",
							"GH_Site": "FXZZ"
						}]
					})
					.end((error, response) => {
						try {
							response.should.have.status(201);
							resolve();
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done)

		});
	});
	describe("(14) Comment can't be empty - POST aqid_mapping_action", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged //
		it("+ should return a a status of 201 on correct aqid_mapping_action call", (done) => {
			new Promise(async function (resolve) {
				await cds.connect.to('db');
				chai.request(app)
					.post("/aqid-details/aqid_mapping_action")
					.auth(token2, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.send({
						"AqidData": [{
							"Raw_Aqid": "00108-01",
							"Mapped_Aqid": "00108-01",
							"Cm_Recommendation": "CM1",
							"Program": "D53G",
							"Station": "D53G A-OTA",
							"Site": "PBPH",
							"CM": "HHZZ",
							"Short_Name": "TestShortName",
							"Comment": " ",
							"GH_Site": "FXZZ"
						}]
					})
					.end((error, response) => {
						try {
							response.should.have.status(201);
							resolve();
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done)

		});
	});

	describe("(15) No record with provided key fields exists - POST aqid_mapping_action", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged //
		it("+ should return a a status of 201 on correct aqid_mapping_action call", (done) => {
			new Promise(async function (resolve) {
				await cds.connect.to('db');
				chai.request(app)
					.post("/aqid-details/aqid_mapping_action")
					.auth(token2, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.send({
						"AqidData": [{
							"Raw_Aqid": "00108-01",
							"Mapped_Aqid": "00108-01",
							"Cm_Recommendation": "CM1",
							"Program": "D53G",
							"Station": "D53G ARROW CALIBRATION",
							"Site": "PBPH",
							"CM": "HHZZ",
							"Short_Name": "TestShortName",
							"Comment": "TestComments",
							"GH_Site": "FXZZ"
						}]
					})
					.end((error, response) => {
						try {
							response.should.have.status(201);
							resolve();
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done)

		});
	});

	describe("(16) POST to begin fetch", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged //
		it("+ should return a a status of 200 on correct beginFetch call", (done) => {
			new Promise(async function (resolve) {
				await cds.connect.to('db');
				chai.request(app)
					.post("/aqid-details/beginFetch")
					.auth(token2, { type: 'bearer' })
					.set('Content-Type', 'application/json')
					.end((error, response) => {
						try {
							response.should.have.status(204);
							resolve();
						} catch (err) {
							console.log(err);
							resolve(err);
						}
					});
			}).then(done)

		});
	});

});
