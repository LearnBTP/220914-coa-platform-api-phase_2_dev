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

let app = null;
before((done) => {
	server.then(async (result) => {
		const db = await cds.connect.to('db');
		hdb = await cds.connect.to('db');
		//   const model1 = cds.compile.to.csn (`
		//   entity COM_APPLE_COA_T_COA_RFID_TT 
		//   {
		// 	key AQID : String(18) ;
		// 	key CM : String(30) ;
		// 	key SITE : String(30) ;
		// 	key CM_PROGRAM : String(40) ;
		// 	key RFID : String(25) ;
		// 	key LINE_ID : String(80) ;
		// 	key UPH : Integer ;
		// 	key VERSION : String(30) ;
		// 	SERIAL_NUMBER : String(30) ;
		// 	LINE_TYPE : String(80) ;
		// 	TRANSFER_FLAG : String(1) ;
		// 	TO_CM : String(30) ;
		// 	TO_SITE : String(30) ;
		// 	TO_PROGRAM : String(40)  ;
		// 	TP_BUSINESS_GRP : String  ;
		// 	TO_BUSINESS_GRP : String  ;
		// 	COMMENTS : String(80)  ;
		// 	APPROVAL_STATUS : String;
		// 	SUBMIT_DTE : Date ;
		// 	SUBMIT_BY : String ;
		// 	REVIEW_DATE: Date ;
		// 	REVIEWED_BY : String ;
		// 	CREATEDAT: DateTime;
		// 	CREATEDBY: String;
		// 	MODIFIEDAT: DateTime;
		// 	MODIFIEDBY: String;
		// }
		// 	`)
		// 	const model2 = cds.compile.to.csn (`
		// 	entity COM_APPLE_COA_T_COA_RFID_ANNOTATION {
		// 		key Rfid : String(25);
		// 		key Building : String(40);
		// 		key Floor : String(40);
		// 		key Site: String(40);
		// 		key CM: String(30);
		// 		key Status: String(20) default 'DRAFT';
		// 		Override_LineId: String(30);
		// 		CarryOverAqid: String(18);
		// 		CarryOverOldProgram: String(40);
		// 		CarryOverEqName: String(255);
		// 		isAqidChanged: Boolean;
		// 		isProgramChanged: Boolean;
		// 		EquipName: String(40);
		// 		Program: String(40);
		// 		Uph: Integer;
		// 		LineType: String(128);
		// 		LineId: String(20);
		// 		Shape_Guid : String(50);
		// 		Version_Id : String(30);
		// 		Comments : String(150);
		// 		Rfid_XAxis : Decimal;
		// 		Rfid_YAxis : Decimal;
				
		// 	}
		// 	`)
		// 	const model3 = cds.compile.to.csn (`
		// 	Entity V_RFIDDETAILS {
		// 		key     ![Raw_Aqid]: String(18) @Core.Computed  ; //
		// 		key     ![Mapped_Aqid]: String(18) @Core.Computed ; //
		// 		key     ![Short_Name]: String(40) @Core.Computed ; //
		// 		key     ![Equipment_Name]: String(255)  @Core.Computed ; //
		// 		key     ![MFR]: String(255)  @Core.Computed ; //
		// 		key     ![AQID]: String(18) @Core.Computed ; //
		// 		key     ![TIMESTAMP]: String(14) @Core.Computed ; //
		// 		key     ![RFID]: String(25)  @Core.Computed ; //
		// 		key     ![ALDERAN]: String(40) @Core.Computed ; //
		// 		key     ![SERNR]: String(30) @Core.Computed  ; //
		// 		key     ![ASSETOWN]: String(30) @Core.Computed ; //
		// 		key     ![SITE]: String(30) @Core.Computed  ; //
		// 		key     ![CM]: String(4) @Core.Computed  ; //
		// 		key     ![ZALDR_CMPROGRAM]: String(128)  @Core.Computed ; 
		// 		key     ![STATUS]: String(5)  @Core.Computed ; //
		// 		key     ![createdAt]: Timestamp @Core.Computed  ; //
		// 		key     ![Override_LineId]: String(30) @Core.Computed ; //
		// 		key     ![CarryOverAqid]: String(18) @Core.Computed ; 
		// 		key     ![CarryOverEqName]: String(255) @Core.Computed  ; 
		// 		key     ![CarryOverOldProgram]: String(40) @Core.Computed ; //
		// 		key     ![Uph]: Integer @Core.Computed ; //
		// 		key     ![LineType]: String(128) @Core.Computed ; //
		// 		key     ![LineId]: String(20) @Core.Computed ; //
		// 		key     ![Version_Id]: String(30) @Core.Computed ; //
		// 		key     ![Transfer_Flag]: String(1) @Core.Computed : false ; //
		// 		key     ![To_CM]: String(30) @Core.Computed : false ; //
		// 		key     ![To_Site]: String(30) @Core.Computed : false ; //
		// 		key     ![To_Program]: String(40) @Core.Computed : false  ; //
		// 		key     ![Tp_Business_Grp]: String(5000) @Core.Computed : false ; //
		// 		key     ![Comments]: String(80) @Core.Computed : false ; //
		// 		key     ![Approval_Status]: String(5000) @Core.Computed  ; //
		// 		key     ![Submit_Dte]: Date @Core.Computed  ; //
		// 		key     ![Submit_By]: String(5000) @Core.Computed  ; //
		// 		key     ![Review_Date]: Date @Core.Computed ; //
		// 		key     ![Reviewed_By]: String(5000) @Core.Computed ; //
		// 		virtual ![ErrorMsg]: String(600) @Core.Computed ; 
		// 		}
		// 	`)

		// 	const model4 = cds.compile.to.csn (`
		// 	entity COM_APPLE_COA_T_COA_LINE_SUMMARY  {
		// 		key CM : String(30) @mandatory;
		// 		key Site : String(30) @mandatory;
		// 		key Line : String(128);
		// 		key Uph : Integer;
		// 		key Station : String(128);
		// 		key Program : String(40);
		// 		Gh_Spl : Integer;
		// 		GH_Site             : String(30);
		// 	}
		// 	`)
			// await cds.deploy (model1).to (db);
			// await cds.deploy (model2).to (db);
			// await cds.deploy (model3).to (db);
			// await cds.deploy (model4).to (db);
			await cds.run(DELETE.from ("COM_APPLE_COA_T_COA_RFID_TT").where(
			{
				"RFID": "temp_000000000000A130001",
				})
				);
	
			await cds.run(DELETE.from ("COM_APPLE_COA_T_COA_RFID_ANNOTATION").where(
			{
			"RFID" : "temp_000000000000A130001",
				}
			));
	
			await cds.run(DELETE.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").where(
				{
				"STATION" : "temp_Station1"				  }
				));

			await cds.run(INSERT.into ("COM_APPLE_COA_T_COA_RFID_TT",
			{
				"AQID": "temp_234429-01",
				"CM": "HHZZ",
				"SITE": "PBPH",
				"CM_PROGRAM": "D63",
				"RFID": "temp_000000000000A130001",
				"LINE_ID": "LINE4",
				"UPH": 590,
				"VERSION": "null",
				"SERIAL_NUMBER": "REIM_01.3",
				"LINE_TYPE": "FATP||Demo Fresh||",
				"TRANSFER_FLAG": null,
				"TO_CM": "HHZZ",
				"TO_SITE": "PBPH",
				"TO_PROGRAM": "D63",
				"TP_BUSINESS_GRP": "IPAD",
				"TO_BUSINESS_GRP": "IPAD",
				"COMMENTS": "NT22",
				"APPROVAL_STATUS": "Pending",
				"SUBMIT_DTE": "2022-11-08T23:07:50.719Z",
				"SUBMIT_BY": null
				}
			  ));

			await cds.run(INSERT.into ("COM_APPLE_COA_T_COA_RFID_ANNOTATION",
			{
			"RFID" : "temp_000000000000A130001",
			"BUILDING" : "Building1",
			"FLOOR" : "Floor1",
			"SITE": "PBPH",
			"CM": "HHZZ",
			"STATUS": "PUBLISH",
			"OVERRIDE_LINEID": "LINE4",
			"CARRYOVERAQID": "temp_234429-01"
				}
			));

			await cds.run(INSERT.into ("COM_APPLE_COA_T_COA_LINE_SUMMARY",
			  {
				"CM": "HHZZ",
				"SITE": "PBPH",
				"LINE" : "Line1",
				"UPH" : 0,
				"STATION" : "temp_Station1",
				"PROGRAM": "D63"
				  }
				));
			app = result;
		done();
	});
});

after( (done) => {
		new Promise(async function(resolve) {

			await cds.run(DELETE.from ("COM_APPLE_COA_T_COA_RFID_TT").where(
			{
				"RFID": "temp_000000000000A130001",
				})
				);
	
			await cds.run(DELETE.from ("COM_APPLE_COA_T_COA_RFID_ANNOTATION").where(
			{
			"RFID" : "temp_000000000000A130001",
				}
			));
	
			await cds.run(DELETE.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").where(
				{
				"STATION" : "temp_Station1"				  }
				));
	
			console.log("deleted all newly inserted entries");
			resolve();
		}).then(done);
		// done();
});

// UPDATE UWB_DB_TB_UWB_WORKFLOW
// SET STATUS = 'Not Started'
// WHERE ACTIONID = '101'
// AND LAUNCHID = '3BF683CCF6EF9864D6B50434FA3C034A';


/****************************** Worklist (Homepage) ******************************/
describe("All tests", () => {
	describe("(1) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=CM&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.1) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=SITE&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.2) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=ZALDR_CMPROGRAM&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.3) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=To_Site&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.4) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=To_CM&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.5) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=To_Program&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.6) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=LineId&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.7) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=RFID&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.8) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=AQID&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.9) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=Approval_Status&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(1.10) GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

		
		it("+ should return 200 on correct F4help request", (done) => {
			chai.request(app)
				.get("/rfid-tt/F4help?$skip=0&$top=10&$select=SERNR&$search=H")
                .auth(token, { type: 'bearer' })
				.end((error, response) => {
					try {
						response.should.have.status(200);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	// describe("(2) GET F4 help without user scope", () => {
	// 	const newUser = new cds.User ({
	// 		id: '110226363079182595683',
	// 		attr: { name: 'depth1', email: 'depth1@protonmail.com' },
	// 		_roles: { 'identified-user': true, 'authenticated-user': true }
	// 	  })
	// 	var duser = new cds.User(['RfidOnHandTTModify']) ;
	// 	if (cds.User.default) cds.User.default.roles = ['RfidOnHandTTModify'] // hard core monkey patch
	// 	else cds.User =  duser // hard core monkey patch for older cds releases
	// 	// cds.User = new cds.User(['RfidOnHandTTReadOnly']) ;
		
	// 	it("+ should return 403 on out of scope F4help request", (done) => {
	// 		chai.request(app)
	// 			.get("/rfid-tt/F4help?$skip=0&$top=10&$select=CM&$search=H")
    //             .auth(token, { type: 'bearer' })
	// 			.end((error, response) => {
	// 				console.log(`cds user: ${req.User}`);
	// 				try {
	// 					response.should.have.status(200);
	// 					done()
	// 				} catch (error) {
    //                     console.log(error);
	// 					done(error);
	// 				}
	// 			});
	// 	});
	// });

	describe("(1.11) POST to RFIDDetails with status Pending", () => {
		
		
		it("+ should return 400 on incorrect RFIDDetails call changing a status to Pending as RFID is too long to insert into db", (done) => {
			chai.request(app)
				.post("/rfid-tt/rfid_tt_action")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
                .send({
					"RfidData": [
						{
						"RFID_Timestamp":             "0",
						"Asset_Id": "",
						"RFID": "temp_000000000000A130001_veryLong",
						"AQID": "temp_234429-01",
						"Raw_AQID": null,
						"Mapped_AQID": "56587-01",
						"Short_Name": null,
						"Serial_Number": "REIM_01.3",
						"EQ_Name": null,
						"CarryOverOldProgram": "D63",
						"MFR": null,
						"Asset_Own": "",
						"CM": "HHZZ",
						"Site": "PBPH",
						"CM_Program": "D63",
						"Asset_Status": "IUSE",
						"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
						"Line_ID": "LINE4",
						"Line_Type": "FATP||Demo Fresh||",
						"UPH": 590,
						"Version": null,
						"Transfer_Flag": null,
						"To_CM": "HHZZ",
						"To_Site": "PBPH",
						"To_Program": "D63",
						"To_Business_Grp": "IPAD",
						"Comments": "NT22",
						"CarryOverAqid": "temp_234429-01",
						"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
						"Approval_Status": "Pending",
						"Submit_Date": "2022-11-08T23:07:50.719Z",
						"Submit_By": null
						}
						]
					})
				.end((error, response) => {
					try {
						response.should.have.status(400);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(2) POST to RFIDDetails with status Pending", () => {
		
		
		it("+ should return 200 on correct RFIDDetails call changing a status to Pending", (done) => {
			chai.request(app)
				.post("/rfid-tt/rfid_tt_action")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
                .send({
					"RfidData": [
						{
						"RFID_Timestamp":             "0",
						"Asset_Id": "",
						"RFID": "temp_000000000000A130001",
						"AQID": "temp_234429-01",
						"Raw_AQID": null,
						"Mapped_AQID": "56587-01",
						"Short_Name": null,
						"Serial_Number": "REIM_01.3",
						"EQ_Name": null,
						"CarryOverOldProgram": "D63",
						"MFR": null,
						"Asset_Own": "",
						"CM": "HHZZ",
						"Site": "PBPH",
						"CM_Program": "D63",
						"Asset_Status": "IUSE",
						"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
						"Line_ID": "LINE4",
						"Line_Type": "FATP||Demo Fresh||",
						"UPH": 590,
						"Version": null,
						"Transfer_Flag": null,
						"To_CM": "HHZZ",
						"To_Site": "PBPH",
						"To_Program": "D63",
						"To_Business_Grp": "IPAD",
						"Comments": "NT22",
						"CarryOverAqid": "temp_234429-01",
						"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
						"Approval_Status": "Pending",
						"Submit_Date": "2022-11-08T23:07:50.719Z",
						"Submit_By": ""
						}
						]
					})
				.end((error, response) => {
					try {
						response.should.have.status(201);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(3) POST to RFIDDetails with status Approved ", () => {
		
		
		it("+ should return 200 on correct RFIDDetails call changing a status to Approved", (done) => {
			chai.request(app)
				.post("/rfid-tt/rfid_tt_action")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
                .send({
					"RfidData": [
						{
						"RFID_Timestamp":             "0",
						"Asset_Id": "",
						"RFID": "temp_000000000000A130001",
						"AQID": "temp_234429-01",
						"Raw_AQID": null,
						"Mapped_AQID": "56587-01",
						"Short_Name": null,
						"Serial_Number": "REIM_01.3",
						"EQ_Name": null,
						"CarryOverOldProgram": "D63",
						"MFR": null,
						"Asset_Own": "",
						"CM": "HHZZ",
						"Site": "PBPH",
						"CM_Program": "D63",
						"Asset_Status": "IUSE",
						"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
						"Line_ID": "LINE4",
						"Line_Type": "FATP||Demo Fresh||",
						"UPH": 590,
						"Version": null,
						"Transfer_Flag": null,
						"To_CM": "HHZZ",
						"To_Site": "PBPH",
						"To_Program": "D63",
						"To_Business_Grp": "IPAD",
						"Comments": "NT22",
						"CarryOverAqid": "temp_234429-01",
						"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
						"Approval_Status": "Approved",
						"Submit_Date": "2022-11-08T23:07:50.719Z",
						"Submit_By": null
						}
						]
					})
				.end((error, response) => {
					try {
						response.should.have.status(201);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(4) POST to RFIDDetails with status Pending again", () => {
		
		
		it("+ should return 200 on correct RFIDDetails call changing a status to Pending", (done) => {
			chai.request(app)
				.post("/rfid-tt/rfid_tt_action")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
                .send({
					"RfidData": [
						{
						"RFID_Timestamp":             "0",
						"Asset_Id": "",
						"RFID": "temp_000000000000A130001",
						"AQID": "temp_234429-01",
						"Raw_AQID": null,
						"Mapped_AQID": "56587-01",
						"Short_Name": null,
						"Serial_Number": "REIM_01.3",
						"EQ_Name": null,
						"CarryOverOldProgram": "D63",
						"MFR": null,
						"Asset_Own": "",
						"CM": "HHZZ",
						"Site": "PBPH",
						"CM_Program": "D63",
						"Asset_Status": "IUSE",
						"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
						"Line_ID": "LINE4",
						"Line_Type": "FATP||Demo Fresh||",
						"UPH": 590,
						"Version": null,
						"Transfer_Flag": null,
						"To_CM": "HHZZ",
						"To_Site": "PBPH",
						"To_Program": "D63",
						"To_Business_Grp": "IPAD",
						"Comments": "NT22",
						"CarryOverAqid": "temp_234429-01",
						"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
						"Approval_Status": "Pending",
						"Submit_Date": "2022-11-08T23:07:50.719Z",
						"Submit_By": null
						}
						]
					})
				.end((error, response) => {
					try {
						response.should.have.status(201);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(5) POST to RFIDDetails with status Rejected", () => {
		
		
		it("+ should return 200 on correct RFIDDetails call changing a status to Rejected", (done) => {
			chai.request(app)
				.post("/rfid-tt/rfid_tt_action")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
                .send({
					"RfidData": [
						{
						"RFID_Timestamp":             "0",
						"Asset_Id": "",
						"RFID": "temp_000000000000A130001",
						"AQID": "temp_234429-01",
						"Raw_AQID": null,
						"Mapped_AQID": "56587-01",
						"Short_Name": null,
						"Serial_Number": "REIM_01.3",
						"EQ_Name": null,
						"CarryOverOldProgram": "D63",
						"MFR": null,
						"Asset_Own": "",
						"CM": "HHZZ",
						"Site": "PBPH",
						"CM_Program": "D63",
						"Asset_Status": "IUSE",
						"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
						"Line_ID": "LINE4",
						"Line_Type": "FATP||Demo Fresh||",
						"UPH": 590,
						"Version": null,
						"Transfer_Flag": null,
						"To_CM": "HHZZ",
						"To_Site": "PBPH",
						"To_Program": "D63",
						"To_Business_Grp": "IPAD",
						"Comments": "NT22",
						"CarryOverAqid": "temp_234429-01",
						"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
						"Approval_Status": "Rejected",
						"Submit_Date": "2022-11-08T23:07:50.719Z",
						"Submit_By": null
						}
						]
					})
				.end((error, response) => {
					try {
						response.should.have.status(201);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(6) POST to RFIDDetails with status Pending, but no existing record in RFIDDetails", () => {


		it("+ should return 200 on correct RFIDDetails call changing a status to Pending, even without existing record in RFIDDetails", (done) => {

			new Promise(async function(resolve){
				await cds.run(DELETE.from ("COM_APPLE_COA_T_COA_RFID_TT").where(
					{
						"RFID": "temp_000000000000A130001",
						})
						);
				try{
					let response = await chai.request(app)
						.post("/rfid-tt/rfid_tt_action")
						.auth(token, { type: 'bearer' })
						.set('Content-Type', 'application/json')
						.send({
							"RfidData": [
								{
								"RFID_Timestamp":             "0",
								"Asset_Id": "",
								"RFID": "temp_000000000000A130001",
								"AQID": "temp_234429-01",
								"Raw_AQID": null,
								"Mapped_AQID": "56587-01",
								"Short_Name": null,
								"Serial_Number": "REIM_01.3",
								"EQ_Name": null,
								"CarryOverOldProgram": "D63",
								"MFR": null,
								"Asset_Own": "",
								"CM": "HHZZ",
								"Site": "PBPH",
								"CM_Program": "D63",
								"Asset_Status": "IUSE",
								"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
								"Line_ID": "LINE4",
								"Line_Type": "FATP||Demo Fresh||",
								"UPH": 590,
								"Version": null,
								"Transfer_Flag": null,
								"To_CM": "HHZZ",
								"To_Site": "PBPH",
								"To_Program": "D63",
								"To_Business_Grp": "IPAD",
								"Comments": "NT22",
								"CarryOverAqid": "temp_234429-01",
								"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
								"Approval_Status": "Pending",
								"Submit_Date": "2022-11-08T23:07:50.719Z",
								"Submit_By": null
								}
								]
							});
					response.should.have.status(201);
							resolve();
	
				}
				catch(error)
				{
					console.log(error);
					resolve(error);
				}

			}).then(done)
			
				// .end((error, response) => {
				// 	try {
				// 		response.should.have.status(201);
				// 		done()
				// 	} catch (error) {
						// console.log(error);
						// done(error);
				// 	}
				// });
		});
	});		

	describe("(7) POST to RFIDDetails with status Pend, which should be failing", () => {


		it("+ should return 400 on incorrect RFIDDetails call changing a status to Pend", (done) => {

			new Promise(async function(resolve){
				await cds.run(DELETE.from ("COM_APPLE_COA_T_COA_RFID_TT").where(
					{
						"RFID": "temp_000000000000A130001",
						})
						);
				try{
					let response = await chai.request(app)
						.post("/rfid-tt/rfid_tt_action")
						.auth(token, { type: 'bearer' })
						.set('Content-Type', 'application/json')
						.send({
							"RfidData": [
								{
								"RFID_Timestamp":             "0",
								"Asset_Id": "",
								"RFID": "temp_000000000000A130001",
								"AQID": "temp_234429-01",
								"Raw_AQID": null,
								"Mapped_AQID": "56587-01",
								"Short_Name": null,
								"Serial_Number": "REIM_01.3",
								"EQ_Name": null,
								"CarryOverOldProgram": "D63",
								"MFR": null,
								"Asset_Own": "",
								"CM": "HHZZ",
								"Site": "PBPH",
								"CM_Program": "D63",
								"Asset_Status": "IUSE",
								"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
								"Line_ID": "LINE4",
								"Line_Type": "FATP||Demo Fresh||",
								"UPH": 590,
								"Version": null,
								"Transfer_Flag": null,
								"To_CM": "HHZZ",
								"To_Site": "PBPH",
								"To_Program": "D63",
								"To_Business_Grp": "IPAD",
								"Comments": "NT22",
								"CarryOverAqid": "temp_234429-01",
								"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
								"Approval_Status": "Pend",
								"Submit_Date": "2022-11-08T23:07:50.719Z",
								"Submit_By": null
								}
								]
							});
					response.should.have.status(400);
							resolve();
	
				}
				catch(error)
				{
					console.log(error);
					resolve(error);
				}

			}).then(done)
			
				// .end((error, response) => {
				// 	try {
				// 		response.should.have.status(201);
				// 		done()
				// 	} catch (error) {
						// console.log(error);
						// done(error);
				// 	}
				// });
		});
	});	
	
	describe("(8) POST to RFIDDetails with status Pend, which should be failing", () => {


		it("+ should return 400 on incorrect RFIDDetails call changing a status to Pend", (done) => {

			new Promise(async function(resolve){
				await cds.run(DELETE.from ("COM_APPLE_COA_T_COA_RFID_TT").where(
					{
						"RFID": "temp_000000000000A130001",
						})
						);
				try{
					let response = await chai.request(app)
						.post("/rfid-tt/rfid_tt_action")
						.auth(token, { type: 'bearer' })
						.set('Content-Type', 'application/json')
						.send({
							"RfidData": [
								{
								"RFID_Timestamp":             "0",
								"Asset_Id": "",
								"RFID": "temp_000000000000A130001",
								"AQID": "temp_234429-01",
								"Raw_AQID": null,
								"Mapped_AQID": "56587-01",
								"Short_Name": null,
								"Serial_Number": "REIM_01.3",
								"EQ_Name": null,
								"CarryOverOldProgram": "D63",
								"MFR": null,
								"Asset_Own": "",
								"CM": "HHZZ",
								"Site": "PBPH",
								"CM_Program": "D63",
								"Asset_Status": "IUSE",
								"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
								"Line_ID": "LINE4",
								"Line_Type": "FATP||Demo Fresh||",
								"UPH": 590,
								"Version": null,
								"Transfer_Flag": null,
								"To_CM": "HHZZ",
								"To_Site": "PBPH",
								"To_Program": "D63",
								"To_Business_Grp": "IPAD",
								"Comments": "NT22",
								"CarryOverAqid": "temp_234429-01",
								"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
								"Approval_Status": "Pend",
								"Submit_Date": "2022-11-08T23:07:50.719Z",
								"Submit_By": null
								}
								]
							});
					response.should.have.status(400);
							resolve();
	
				}
				catch(error)
				{
					console.log(error);
					resolve(error);
				}

			}).then(done)
			
				// .end((error, response) => {
				// 	try {
				// 		response.should.have.status(201);
				// 		done()
				// 	} catch (error) {
						// console.log(error);
						// done(error);
				// 	}
				// });
		});
	});	

	describe("(9) POST to RFIDDetails with status Pending", () => {
		
		
		it("+ should return 400 on incorrect RFIDDetails call as CM-Site combination validation must fail", (done) => {
			chai.request(app)
				.post("/rfid-tt/rfid_tt_action")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
                .send({
					"RfidData": [
						{
						"RFID_Timestamp":             "0",
						"Asset_Id": "",
						"RFID": "temp_000000000000A130001",
						"AQID": "temp_234429-01",
						"Raw_AQID": null,
						"Mapped_AQID": "56587-01",
						"Short_Name": null,
						"Serial_Number": "REIM_01.3",
						"EQ_Name": null,
						"CarryOverOldProgram": "D63",
						"MFR": null,
						"Asset_Own": "",
						"CM": "HHZZ",
						"Site": "POOH",
						"CM_Program": "D63",
						"Asset_Status": "IUSE",
						"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
						"Line_ID": "LINE4",
						"Line_Type": "FATP||Demo Fresh||",
						"UPH": 590,
						"Version": null,
						"Transfer_Flag": null,
						"To_CM": "HHZZ",
						"To_Site": "PBPH",
						"To_Program": "D63",
						"To_Business_Grp": "IPAD",
						"Comments": "NT22",
						"CarryOverAqid": "temp_234429-01",
						"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
						"Approval_Status": "Pending",
						"Submit_Date": "2022-11-08T23:07:50.719Z",
						"Submit_By": null
						}
						]
					})
				.end((error, response) => {
					try {
						response.should.have.status(400);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});

	describe("(10) POST to RFIDDetails with status Approved ", () => {
		
		
		it("+ should return 400 on incorrect RFIDDetails call changing a status to Approved as you can only approve a record if it already is in pending status", (done) => {
			chai.request(app)
				.post("/rfid-tt/rfid_tt_action")
				.auth(token, { type: 'bearer' })
				.set('Content-Type', 'application/json')
                .send({
					"RfidData": [
						{
						"RFID_Timestamp":             "0",
						"Asset_Id": "",
						"RFID": "temp_000000000000A130001",
						"AQID": "temp_234429-01",
						"Raw_AQID": null,
						"Mapped_AQID": "56587-01",
						"Short_Name": null,
						"Serial_Number": "REIM_01.3",
						"EQ_Name": null,
						"CarryOverOldProgram": "D63",
						"MFR": null,
						"Asset_Own": "",
						"CM": "HHZZ",
						"Site": "PBPH",
						"CM_Program": "D63",
						"Asset_Status": "IUSE",
						"Timestamp_3DV": "2022-10-25T15:52:58.726Z",
						"Line_ID": "LINE4",
						"Line_Type": "FATP||Demo Fresh||",
						"UPH": 590,
						"Version": null,
						"Transfer_Flag": null,
						"To_CM": "HHZZ",
						"To_Site": "PBPH",
						"To_Program": "D63",
						"To_Business_Grp": "IPAD",
						"Comments": "NT22",
						"CarryOverAqid": "temp_234429-01",
						"CarryOverEqName": "EQP,AE,RIM-BA,PAM-D38 RIM-BA,BESI,RETROFIT",
						"Approval_Status": "approved",
						"Submit_Date": "2022-11-08T23:07:50.719Z",
						"Submit_By": null
						}
						]
					})
				.end((error, response) => {
					try {
						response.should.have.status(400);
						done()
					} catch (error) {
                        console.log(error);
						done(error);
					}
				});
		});
	});
});
