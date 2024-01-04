'use strict'
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("./server");
const fs = require("fs");
chai.use(chaiHttp);
chai.should();
const cds = require('@sap/cds');
const csv = require("csv-parser");
var hdb;
const token = 'some_token';
const token2 = 'some_token';
const token3 = 'some_token';
let app = null;

before((done) => {
    server.then(async (result) => {
        const db = await cds.connect.to('db');
        hdb = await cds.connect.to('db');
        app = result;
        done();
    });
});


/****************************** Test Scripts for UnScannable application ******************************/
describe("All tests", () => {
    describe("GET with Unresricted access - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=GH_SITE%20asc&search-focus=GH_SITE&search=&$select=GH_SITE")
                .auth(token3, { type: 'bearer' })
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

    describe("GET GH_SITE - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=120&search-focus=PROGRAM&search=D21&$select=PROGRAM")
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


    describe("GET GH_SITE - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/Carryover_rfid_unscannable?$skip=0&$top=112&$filter=GH_SITE%20eq%20%27iPhone_FXCN%27&search-focus=GH_Site&search=&$select=GH_SITE%2cPROGRAM%2cFROM_BUSINESS_GRP%2cAQID%2cEQUIPMENT_NAME%2cPO_TYPE%2cSCOPE%2cCONSUMABLES%2cTO_GHSITE%2cTO_PROGRAM%2cTO_BUSINESS_GRP%2cFLEX_KITS%2cCOMMENT%2cTRANSFER_FLAG%2cPROJECTED_QTY%2cQTY%2cSTATUS%2cSPLIT%2cCREATEDBY_NAME%2cCREATEDAT%2cMODIFIEDBY_NAME%2cMODIFIEDAT%2cREVIEWED_BY_NAME%2cREVIEW_DATE%2cSYNC_STATUS%2cERROR%2cMAPPED_AQID%2cNPI_INDICATOR%2cSAP_CM_SITE%2cSAP_TO_CM_SITE%2cParent%2cSEQUENCE_NO")
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

    describe("GET GH_SITE - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=GH_SITE%20asc&search-focus=GH_SITE&search=&$select=GH_SITE")
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
    describe("GET GH_SITE_MD - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=GH_SITE_MD%20asc&search-focus=GH_SITE_MD&search=&$select=GH_SITE_MD")
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
    describe("GET GH_SITE_ORG - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=GH_SITE_ORG%20asc&search-focus=GH_SITE_ORG&search=&$select=GH_SITE_ORG")
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
    describe("GET PROGRAM_MD - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=PROGRAM_MD%20asc&search-focus=PROGRAM_MD&search=&$select=PROGRAM_MD")
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
    describe("GET AQID - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=AQID%20asc&search-focus=AQID&search=&$select=AQID")
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
    describe("GET TO_GHSITE - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=TO_GHSITE%20asc&search-focus=TO_GHSITE&search=&$select=TO_GHSITE")
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

    describe("GET PROGRAM - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=PROGRAM%20asc&search-focus=PROGRAM&search=&$select=PROGRAM")
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

    describe("GET FROM_BUSINESS_GRP - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=FROM_BUSINESS_GRP%20asc&search-focus=FROM_BUSINESS_GRP&search=&$select=FROM_BUSINESS_GRP")
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

    describe("GET TO_PROGRAM - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=TO_PROGRAM%20asc&search-focus=TO_PROGRAM&search=&$select=TO_PROGRAM")
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

    describe("GET TO_BUSINESS_GRP - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=TO_BUSINESS_GRP%20asc&search-focus=TO_BUSINESS_GRP&search=&$select=TO_BUSINESS_GRP")
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
    describe("GET STATUS - /rfid-unscannable/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/rfid-unscannable/F4help?$skip=0&$top=119&$orderby=STATUS%20asc&search-focus=STATUS&search=&$select=STATUS")
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

    describe("Split functionality is possible only on one record at a time - SPLIT - /rfid-unscannable/Unscannable_Split", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_Split")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "SplitData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "SEQUENCE_NO": null,
                        "PROJECTED_QTY": 6,
                        "AQID": "14087-01",
                        "TO_GHSITE": "",
                        "TO_CM": "",
                        "TO_SITE": "",
                        "TO_PROGRAM": "",
                        "NPI_INDICATOR": "NON-NPI"
                    }, {
                        "GH_SITE": "iPhone_FXZZ",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "SEQUENCE_NO": null,
                        "PROJECTED_QTY": 6,
                        "AQID": "14087-01",
                        "TO_GHSITE": "",
                        "TO_CM": "",
                        "TO_SITE": "",
                        "TO_PROGRAM": "",
                        "NPI_INDICATOR": "NON-NPI"
                    }, {
                        "GH_SITE": "iPhone_FXZZ",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "SEQUENCE_NO": null,
                        "PROJECTED_QTY": 6,
                        "AQID": "14087-01",
                        "TO_GHSITE": "",
                        "TO_CM": "",
                        "TO_SITE": "",
                        "TO_PROGRAM": "",
                        "NPI_INDICATOR": "NON-NPI"
                    }],
                    "Action": "SPLIT"
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(500);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
        });
    });

    describe("POST - SPLIT - /rfid-unscannable/Unscannable_Split", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_Split")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "SplitData": [],
                    "Action": "SPLIT"
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(500);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
        });
    });

    describe("POST - SPLIT - /rfid-unscannable/Unscannable_Split", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_Split")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "SplitData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "SEQUENCE_NO": null,
                        "PROJECTED_QTY": 6,
                        "AQID": "14087-01",
                        "TO_GHSITE": "",
                        "TO_CM": "",
                        "TO_SITE": "",
                        "TO_PROGRAM": "",
                        "NPI_INDICATOR": "NON-NPI"
                    }, {
                        "GH_SITE": "iPhone_FXZZ",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "SEQUENCE_NO": null,
                        "PROJECTED_QTY": 6,
                        "AQID": "14087-01",
                        "TO_GHSITE": "",
                        "TO_CM": "",
                        "TO_SITE": "",
                        "TO_PROGRAM": "",
                        "NPI_INDICATOR": "NON-NPI"
                    }],
                    "Action": "SPLIT"
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(201);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
        });
    });

    describe("POST - DELETE - /rfid-unscannable/Unscannable_Split", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_Split")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send(
                    {
                        "SplitData": [{
                            "GH_SITE": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "SITE": "PBPH",
                            "PROGRAM": "D11",
                            "FROM_BUSINESS_GRP": "",
                            "SEQUENCE_NO": 1,
                            "PROJECTED_QTY": 6,
                            "AQID": "14087-01",
                            "TO_GHSITE": "",
                            "TO_CM": "",
                            "TO_SITE": "",
                            "TO_PROGRAM": "",
                            "NPI_INDICATOR": "NON-NPI"
                        }], "Action": "DELETE"
                    })
                .end((error, response) => {
                    try {
                        response.should.have.status(201);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
        });
    });

    describe("Quantity is exceeding the Projected Quantity - Save Record - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [
                        {
                            "GH_SITE": "iPhone_FXZZ",
                            "PROGRAM": "D11",
                            "FROM_BUSINESS_GRP": "",
                            "AQID": "14087-01",
                            "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                            "PO_TYPE": null,
                            "SCOPE": "Per Station",
                            "CONSUMABLES": null,
                            "TO_GHSITE": "iPhone_LXSZ",
                            "TO_PROGRAM": "D20",
                            "TO_BUSINESS_GRP": "FATP",
                            "FLEX_KITS": "Y",
                            "COMMENT": "Test Scripts Save",
                            "TRANSFER_FLAG": "Y",
                            "PROJECTED_QTY": 5,
                            "QTY": 6,
                            "STATUS": "Pending",
                            "SPLIT": null,
                            "CREATEDBY_NAME": "Sachin Haibatti",
                            "CREATEDAT": "2023-06-10T10:56:30.081Z",
                            "MODIFIEDBY_NAME": "Sachin Haibatti",
                            "MODIFIEDAT": null,
                            "REVIEWED_BY_NAME": "",
                            "REVIEW_DATE": null,
                            "SYNC_STATUS": "Completed",
                            "MAPPED_AQID": "14086-01",
                            "NPI_INDICATOR": "NON-NPI",
                            "SAP_CM_SITE": "HHZZ-PBPH",
                            "SAP_TO_CM_SITE": "LXSA-SZPH",
                            "SEQUENCE_NO": 0,
                            "CM": "HHZZ",
                            "SITE": "PBPH",
                            "TO_CM": "LXSA",
                            "TO_SITE": "SZPH",
                            "REVIEWED_BY": "",
                            "MODIFIEDBY": null,
                            "CREATEDBY": "C8831855SH",
                            "CREATEDBY_MAIL": "shaibatti@apple.com",
                            "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                            "REVIEWED_BY_MAIL": "",
                            "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                        }],
                    "Action": "Save"
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

    describe(" Reset Records - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({ "URL": "GH_SITE eq 'iPhone_LXKS' and PROGRAM eq 'D21' and AQID eq '08057-01'", "Action": "Reset" })
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

    describe(" Save Records - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({ "UnscanData": [{ "GH_SITE": "iPhone_LXKS", "PROGRAM": "D21", "FROM_BUSINESS_GRP": "", "AQID": "08057-01", "EQUIPMENT_NAME": "EQP,DISPENSE,UF 50A,FXD8000,DUAL HEAD,SPEEDLINE", "PO_TYPE": "Consign", "SCOPE": "Per Station", "CONSUMABLES": "N", "TO_GHSITE": "iPhone_LXSZ", "TO_PROGRAM": "D10", "TO_BUSINESS_GRP": "TESTBG", "FLEX_KITS": "Y", "COMMENT": "Test", "TRANSFER_FLAG": "Y", "PROJECTED_QTY": 1, "QTY": 1, "STATUS": "", "SPLIT": null, "CREATEDBY_NAME": "Pooja Lakshman", "CREATEDAT": "2023-06-14T08:33:48.057Z", "MODIFIEDBY_NAME": null, "MODIFIEDAT": null, "REVIEWED_BY_NAME": null, "REVIEW_DATE": null, "SYNC_STATUS": "Completed", "MAPPED_AQID": "08057-01", "NPI_INDICATOR": "NON-NPI", "SAP_CM_SITE": "LXSA-KSPH", "SAP_TO_CM_SITE": null, "SEQUENCE_NO": 0, "CM": "LXSA", "SITE": "KSPH", "TO_CM": null, "TO_SITE": null, "REVIEWED_BY": null, "MODIFIEDBY": null, "CREATEDBY": "C8852207PL", "CREATEDBY_MAIL": "pooja_lakshman@apple.com", "MODIFIEDBY_MAIL": null, "REVIEWED_BY_MAIL": null, "ID": "d57a7a71-955d-4e4d-9acb-bf434f685ff0" }], "Action": "Save" })
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

    describe(" Approve Records - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            new Promise(async function (resolve) {
                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_OUTPUT").where({
                    "FROM_GHSITE": "iPhone_LXKS",
                    "FROM_PRODUCT": "D21",
                    "AQID": "08057-01",
                    "CO_TYPE": "Unscanned"
                }));
                try {
                    let response = await
                        chai.request(app)
                            .post("/rfid-unscannable/Unscannable_action")
                            .auth(token2, { type: 'bearer' })
                            .set('Content-Type', 'application/json')
                            .send({ "UnscanData": [{ "GH_SITE": "iPhone_LXKS", "PROGRAM": "D21", "FROM_BUSINESS_GRP": "", "AQID": "08057-01", "EQUIPMENT_NAME": "EQP,DISPENSE,UF 50A,FXD8000,DUAL HEAD,SPEEDLINE", "PO_TYPE": "Consign", "SCOPE": "Per Station", "CONSUMABLES": "N", "TO_GHSITE": "iPhone_LXSZ", "TO_PROGRAM": "D10", "TO_BUSINESS_GRP": "TESTBG", "FLEX_KITS": "Y", "COMMENT": "Test", "TRANSFER_FLAG": "Y", "PROJECTED_QTY": 1, "QTY": 1, "STATUS": "Pending", "SPLIT": null, "CREATEDBY_NAME": "Pooja Lakshman", "CREATEDAT": "2023-06-14T08:33:48.057Z", "MODIFIEDBY_NAME": "Pooja Lakshman", "MODIFIEDAT": "2023-06-16T05:04:06.755Z", "REVIEWED_BY_NAME": "", "REVIEW_DATE": null, "SYNC_STATUS": "Completed", "MAPPED_AQID": "08057-01", "NPI_INDICATOR": "NON-NPI", "SAP_CM_SITE": "LXSA-KSPH", "SAP_TO_CM_SITE": "LXSA-SZPH", "SEQUENCE_NO": 0, "CM": "LXSA", "SITE": "KSPH", "TO_CM": "LXSA", "TO_SITE": "SZPH", "REVIEWED_BY": "", "MODIFIEDBY": "C8852207PL", "CREATEDBY": "C8852207PL", "CREATEDBY_MAIL": "pooja_lakshman@apple.com", "MODIFIEDBY_MAIL": "pooja_lakshman@apple.com", "REVIEWED_BY_MAIL": "", "ID": "d57a7a71-955d-4e4d-9acb-bf434f685ff0" }], "Action": "Approve" })
                    response.should.have.status(200);
                    resolve();
                }
                catch (error) {
                    console.log(error);
                    resolve(error);
                }

            }).then(done)
        });
    });

    describe("(1) (Save) - Approve - Reset - Save Record - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [
                        {
                            "GH_SITE": "iPhone_FXZZ",
                            "PROGRAM": "D11",
                            "FROM_BUSINESS_GRP": "",
                            "AQID": "14087-01",
                            "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                            "PO_TYPE": null,
                            "SCOPE": "Per Station",
                            "CONSUMABLES": null,
                            "TO_GHSITE": "iPhone_LXSZ",
                            "TO_PROGRAM": "D20",
                            "TO_BUSINESS_GRP": "FATP",
                            "FLEX_KITS": "Y",
                            "COMMENT": "Test Scripts Save",
                            "TRANSFER_FLAG": "Y",
                            "PROJECTED_QTY": 5,
                            "QTY": 2,
                            "STATUS": "Pending",
                            "SPLIT": null,
                            "CREATEDBY_NAME": "Sachin Haibatti",
                            "CREATEDAT": "2023-06-10T10:56:30.081Z",
                            "MODIFIEDBY_NAME": "Sachin Haibatti",
                            "MODIFIEDAT": null,
                            "REVIEWED_BY_NAME": "",
                            "REVIEW_DATE": null,
                            "SYNC_STATUS": "Completed",
                            "MAPPED_AQID": "14086-01",
                            "NPI_INDICATOR": "NON-NPI",
                            "SAP_CM_SITE": "HHZZ-PBPH",
                            "SAP_TO_CM_SITE": "LXSA-SZPH",
                            "SEQUENCE_NO": 0,
                            "CM": "HHZZ",
                            "SITE": "PBPH",
                            "TO_CM": "LXSA",
                            "TO_SITE": "SZPH",
                            "REVIEWED_BY": "",
                            "MODIFIEDBY": null,
                            "CREATEDBY": "C8831855SH",
                            "CREATEDBY_MAIL": "shaibatti@apple.com",
                            "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                            "REVIEWED_BY_MAIL": "",
                            "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                        }],
                    "Action": "Save"
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

    describe("(1) Save - (Approve) - Reset - Approve Records - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "Test Scripts Approved",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        // "GUID": "001eb8e9-50a5-4825-b102-40c8435e61ef",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Approve"
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

    describe("(1) Save - Approve - (Reset) -  Reset Records - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "Test Scripts Reset",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        // "GUID": "001eb8e9-50a5-4825-b102-40c8435e61ef",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Reset"
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

    describe("(2) (Save) - Reject - Save Record - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "1 Test Scripts Save",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        // "GUID": "001eb8e9-50a5-4825-b102-40c8435e61ef",
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Save"
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

    describe("(2) Save - (Reject) - Reject Records - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "Test Scripts Reject",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Reject"
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

    describe("(3) (Save) - Approve - Cancel - Save Record - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "2 - Test Scripts Save",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Save"
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

    describe("(3) Save - (Approve) - Cancel - Approve Record - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "2 Test Scripts Approved",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Approve"
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

    describe("(3) Save - Approve - (Cancel) -  Cancel Records - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "Test Scripts Canceled",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Cancel"
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

    describe("(4) (Save) - Approve - Save Record - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "2 - Test Scripts Save",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Save"
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

    describe("(4) Save - (Approve) -  Approve Record - /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "UnscanData": [{
                        "GH_SITE": "iPhone_FXZZ",
                        "PROGRAM": "D11",
                        "FROM_BUSINESS_GRP": "",
                        "AQID": "14087-01",
                        "EQUIPMENT_NAME": "EQP,AE,LOWER-MAGNETIC-FOIL,N66/N71-D11/D12,SECOTE,RETROFIT KIT",
                        "PO_TYPE": null,
                        "SCOPE": "Per Station",
                        "CONSUMABLES": null,
                        "TO_GHSITE": "iPhone_LXSZ",
                        "TO_PROGRAM": "D20",
                        "TO_BUSINESS_GRP": "FATP",
                        "FLEX_KITS": "Y",
                        "COMMENT": "2 Test Scripts Approved",
                        "TRANSFER_FLAG": "Y",
                        "PROJECTED_QTY": 5,
                        "QTY": 2,
                        "STATUS": "Pending",
                        "SPLIT": null,
                        "CREATEDBY_NAME": "Sachin Haibatti",
                        "CREATEDAT": "2023-06-10T10:56:30.081Z",
                        "MODIFIEDBY_NAME": "Sachin Haibatti",
                        "MODIFIEDAT": null,
                        "REVIEWED_BY_NAME": "",
                        "REVIEW_DATE": null,
                        "SYNC_STATUS": "Completed",
                        "MAPPED_AQID": "14086-01",
                        "NPI_INDICATOR": "NON-NPI",
                        "SAP_CM_SITE": "HHZZ-PBPH",
                        "SAP_TO_CM_SITE": "LXSA-SZPH",
                        "SEQUENCE_NO": 0,
                        "CM": "HHZZ",
                        "SITE": "PBPH",
                        "TO_CM": "LXSA",
                        "TO_SITE": "SZPH",
                        "REVIEWED_BY": "",
                        "MODIFIEDBY": null,
                        "CREATEDBY": "C8831855SH",
                        "CREATEDBY_MAIL": "shaibatti@apple.com",
                        "MODIFIEDBY_MAIL": "shaibatti@apple.com",
                        "REVIEWED_BY_MAIL": "",
                        "ID": "001eb8e9-50a5-4825-b102-40c8435e61ef"
                    }],
                    "Action": "Approve"
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


    describe("PUT /rfid-unscannable/Upload_Unscannable/csv", () => {
        it("+ should Upload CSV file", (done) => {
            chai.request(app)
                .put("/rfid-unscannable/Upload_Unscannable/csv")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'text/csv')
                .set('Content-Length', '650000')
                .attach('fileName', '/home/user/projects/220914-coa-platform-api/coa-rfid-unscannable/tests/UnScannable.csv', 'UnScannable.csv')
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

    describe("POST - Save - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_FXZZ' and MAPPED_AQID eq '14086-01'",
                    "TO_GHSITE": "iPhone_LXSZ",
                    "TO_PROGRAM": "D10",
                    "TO_BUSINESS_GRP": "TESTBG",
                    "FLEX_KITS": "Y", "QTY": 1,
                    "TRANSFER_FLAG": "Y",
                    "COMMENT": "Test Script Save 1",
                    "Action": "Save"
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

    describe("POST - Approve - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_FXZZ' and MAPPED_AQID eq '14086-01'",
                    "Action": "Approve"
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

    describe("POST - Reset - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_FXZZ' and MAPPED_AQID eq '14086-01'",
                    "Action": "Reset"
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

    describe("POST - Save - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_FXZZ' and MAPPED_AQID eq '14086-01'",
                    "TO_GHSITE": "iPhone_LXSZ",
                    "TO_PROGRAM": "D10",
                    "TO_BUSINESS_GRP": "TESTBG",
                    "FLEX_KITS": "Y", "QTY": 1,
                    "TRANSFER_FLAG": "Y",
                    "COMMENT": "Test Script Save 2",
                    "Action": "Save"
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

    describe("POST - Reject - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_FXZZ' and MAPPED_AQID eq '14086-01'",
                    "Action": "Reject"
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

    describe("POST - Save - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_FXZZ' and MAPPED_AQID eq '14086-01'",
                    "TO_GHSITE": "iPhone_LXSZ",
                    "TO_PROGRAM": "D10",
                    "TO_BUSINESS_GRP": "TESTBG",
                    "FLEX_KITS": "Y", "QTY": 1,
                    "TRANSFER_FLAG": "Y",
                    "COMMENT": "Test Script Save 3",
                    "Action": "Save"
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

    describe("POST - Approve - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_LXSZ' and MAPPED_AQID eq '08057-01'",
                    "Action": "Approve"
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

    describe("POST - Cancel - SaveAll /rfid-unscannable/Unscannable_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Unscannable_action")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_SITE eq 'iPhone_FXZZ' and MAPPED_AQID eq '14086-01'",
                    "Action": "Cancel"
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



    describe("POST - Generate_Unscannable - /rfid-unscannable/Generate_Unscannable", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/rfid-unscannable/Generate_Unscannable")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({ "request": { "GH_SITE": ["iPhone_LXSZ"], "syncall": "" } })
                .end((error, response) => {
                    try {
                        response.should.have.status(204);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
        });
    });

    // describe("POST - Generate_Unscannable - /rfid-unscannable/Generate_Unscannable", () => {
    //     it("+ should return success", (done) => {
    //         chai.request(app)
    //             .post("/rfid-unscannable/Generate_Unscannable")
    //             .auth(token2, { type: 'bearer' })
    //             .set('Content-Type', 'application/json')
    //             .send({ "request": { "GH_SITE": [], "syncall": "X" } })
    //             .end((error, response) => {
    //                 try {
    //                     response.should.have.status(200);
    //                     done();
    //                 } catch (error) {
    //                     done(error);
    //                 }
    //             });
    //     });
    // });

});