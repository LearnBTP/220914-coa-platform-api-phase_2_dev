const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("./server");

// Configure chai
chai.use(chaiHttp);
chai.should();
const token = 'some_token';
const token1 = 'some_token';
const token2 = 'some_token';

let app = null;

before((done) => {
    server.then((result) => {
        app = result;
        done();
    });
});

describe("All Tests", () => {
    describe("GET /non-rfid-tt/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/non-rfid-tt/F4help?$skip=0&$top=115&$orderby=GH_Site%20asc&search-focus=GH_Site&search=&$select=GH_Site")
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

    describe("GET GH_Site_Org - /non-rfid-tt/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/non-rfid-tt/F4help?$skip=0&$top=115&$orderby=GH_Site_Org%20asc&search-focus=GH_Site_Org&search=&$select=GH_Site_Org")
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

    describe("GET /non-rfid-tt/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/non-rfid-tt/F4help?$skip=0&$top=115&$orderby=CM%20asc&search-focus=CM&search=&$select=CM")
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

    describe("GET /non-rfid-tt/nonRfidTT", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/non-rfid-tt/nonRfidTT")
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

    describe("POST SyncNonRFIDTT /non-rfid-tt/SyncNonRFIDTT", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/non-rfid-tt/SyncNonRFIDTT")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "GH_Site": ["iPhone_FXZZ"]
                    }
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
    describe("POST Split (User doesn't have authorization) - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token1, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [{
                        "GH_Site": "iPhone_FXZZ",
                        "Program": "D42",
                        "Aqid": "00108-01",
                        "Mapped_Aqid": "00108-01",
                        "To_GHSite": "iPhone_FXZZ",
                        "To_Program": "D10",
                        "To_Business_Grp": "BG_TEST",
                        "Line_Id": "",
                        "Line_Type": "MLB CRB RT Line ",
                        "Projected_Qty": 7,
                        "Transfer_Qty": 1,
                        "Transfer_Flag": "F",
                        "Status": "Pending",
                        "Group_Priority": "",
                        "Dept": null,
                        "Submit_By_Name": null,
                        "RFID_Scope": "N",
                        "Scope": "Per Station",
                        "Alt_Station": 0,
                        "Parent_Item": "",
                        "Group_ID": 0,
                        "Line_Priority": null,
                        "Equipment_Type": "Buy",
                        "Equipment_Name": "CABLE,ETHERNET/NETWORK,CAT5E,L2M",
                        "Split": "",
                        "confLevel": null,
                        "Mfr": "GENERIC",
                        "BusinessGrp": "",
                        "Uph": 0,
                        "Comments": "OK1",
                        "Submit_Date": null,
                        "Review_Date": null,
                        "modifiedBy_Name": null,
                        "Reviewed_By_Name": "",
                        "Error": null,
                        "Station": "D42 CELL-S1",
                        "SAP_CM_Site": "HHZZ-PBPH",
                        "SAP_To_CM_Site": "HHZZ-PBPH",
                        "ID": "",
                        "CM": "HHZZ",
                        "Site": "PBPH",
                        "Sequence_No": 0,
                        "modifiedAt": null
                    }
                    ],
                    "action": "split"
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
    describe("POST Split - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {

            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [{
                        "GH_Site": "iPhone_FXZZ",
                        "CM": "HHZZ",
                        "Site": "PBPH",
                        "Program": "D63",
                        "Line_Type": "FATP Burn-in 2683",
                        "Uph": 590,
                        "Aqid": "00070-01",
                        "Station": "D63 DISPLAY-POSTBURN",
                        "Scope": "Per Station",
                        "Line_Id": "Burn-in",
                        "Parent_Item": "",
                        "Alt_Station": 0,
                        "Group_Priority": "10-1",
                        "Sequence_No": 0,
                        "Split": "",
                        "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                        "confLevel": 0,
                        "Projected_Qty": 8,
                        "Transfer_Qty": 1,
                        "Mfr": "Shenzhen Alex Connector Co., Ltd",
                        "Dept": null,
                        "RFID_Scope": "N",
                        "Group_ID": 0,
                        "Line_Priority": null,
                        "Equipment_Type": "Buy",
                        "To_Program": "D10",
                        "To_Business_Grp": "IP FATP",
                        "To_GHSite": "iPhone_PGPD",
                        "Transfer_Flag": "Y",
                        "Comments": "Vivek New 1",
                        "Status": "Pending",
                        "Mapped_Aqid": "00070-01",
                        "SAP_CM_Site": "HHZZ-PBPH",
                        "SAP_To_CM_Site": "PEGA-SHPH"
                    }
                    ],
                    "action": "split"
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

    describe("POST Delete Split - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 1,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "dsplit"
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



    describe("POST (1) (Save) - Approve - Cancel : Save /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "save"
                })
                //         response.should.have.status(200);
                //         resolve();
                //     }
                //     catch (error) {
                //         console.log(error);
                //         resolve(error);
                //     }

                // }).then(done)
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

    describe("POST (1) Save - (Approve) - Cancel : Approve - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "approve"
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
            //         response.should.have.status(200);
            //         resolve();
            //     }
            //     catch (error) {
            //         console.log(error);
            //         resolve(error);
            //     }
            // }).then(done)
        });
    });
    describe("POST (1) Save - Approve - (Cancel) : Cancel - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "cancel"
                })
                //         response.should.have.status(200);
                //         resolve();
                //     }
                //     catch (error) {
                //         console.log(error);
                //         resolve(error);
                //     }
                // }).then(done)
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

    describe("POST (2) (Save) - Reject  : Save - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "save"
                })
                //         response.should.have.status(200);
                //         resolve();
                //     }
                //     catch (error) {
                //         console.log(error);
                //         resolve(error);
                //     }
                // }).then(done)
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


    describe("POST (2) Save - (Reject) : Reject - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"

                        }
                    ],
                    "action": "reject"
                })
                //         response.should.have.status(200);
                //         resolve();
                //     }
                //     catch (error) {
                //         console.log(error);
                //         resolve(error);
                //     }
                // }).then(done)
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

    describe("POST (3) (Save) - Approve - Reset : Save - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "save"
                })
                //         response.should.have.status(200);
                //         resolve();
                //     }
                //     catch (error) {
                //         console.log(error);
                //         resolve(error);
                //     }
                // }).then(done)
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


    describe("POST (3) Save - (Approve) - Reset : Approve - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "approve"
                })
                //         response.should.have.status(200);
                //         resolve();
                //     }
                //     catch (error) {
                //         console.log(error);
                //         resolve(error);
                //     }
                // }).then(done)
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

    describe("POST (3) Save - Approve - (Reset) : Reset - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "GH_Site": "iPhone_FXZZ",
                            "CM": "HHZZ",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Line_Type": "FATP Burn-in 2683",
                            "Uph": 590,
                            "Aqid": "00070-01",
                            "Station": "D63 DISPLAY-POSTBURN",
                            "Scope": "Per Station",
                            "Line_Id": "Burn-in",
                            "Parent_Item": "",
                            "Alt_Station": 0,
                            "Group_Priority": "10-1",
                            "Sequence_No": 0,
                            "Split": "",
                            "Equipment_Name": "CABLE,BACON,DCSD DISPLAY,PIGTAIL",
                            "confLevel": 0,
                            "Projected_Qty": 8,
                            "Transfer_Qty": 1,
                            "Mfr": "Shenzhen Alex Connector Co., Ltd",
                            "Dept": null,
                            "RFID_Scope": "N",
                            "Group_ID": 0,
                            "Line_Priority": null,
                            "Equipment_Type": "Buy",
                            "To_Program": "D10",
                            "To_Business_Grp": "IP FATP",
                            "To_GHSite": "iPhone_PGPD",
                            "Transfer_Flag": "Y",
                            "Comments": "Vivek New 1",
                            "Status": "Pending",
                            "Mapped_Aqid": "00070-01",
                            "SAP_CM_Site": "HHZZ-PBPH",
                            "SAP_To_CM_Site": "PEGA-SHPH"
                        }
                    ],
                    "action": "reset"
                })
                //     response.should.have.status(200);
                //     resolve();
                // }
                // catch (error) {
                //     console.log(error);
                //     resolve(error);
                // }
                // }).then(done)
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

    describe("POST mApprove - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            // new Promise(async function (resolve) {
            //     try {
            //         let response = await
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "URL": "GH_Site eq 'iPhone_FXZZ' and Program eq 'D63'"
                        }
                    ],
                    "action": "mapprove"
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

    describe("POST mReject - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "URL": "GH_Site eq 'iPhone_FXZZ' and Program eq 'D63'"
                        }
                    ],
                    "action": "mreject"
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

    describe("POST mReset - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "URL": "GH_Site eq 'iPhone_FXZZ' and Program eq 'D63'"
                        }
                    ],
                    "action": "mreset"
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

    describe("POST mcancel - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "URL": "GH_Site eq 'iPhone_FXZZ' and Program eq 'D63'"
                        }
                    ],
                    "action": "mcancel"
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

    describe("POST mdelete - /non-rfid-tt/nonrfid_tt_action", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/non-rfid-tt/nonrfid_tt_action")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "NonRfidData": [
                        {
                            "URL": "GH_Site eq 'iPhone_FXZZ' and Program eq 'D63'"
                        }
                    ],
                    "action": "mdelete"
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


    describe("POST selectAllMassUpdate - /non-rfid-tt/selectAllMassUpdate", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/non-rfid-tt/selectAllMassUpdate")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "URL": "GH_Site eq 'iPhone_FXZZ' and Program eq 'D63'",
                    "To_GHSite": "iPhone_FXZZ",
                    "To_Program": "D10",
                    "To_Business_Grp": "TBG1",
                    "Transfer_Qty": 1,
                    "Transfer_Flag": "Y",
                    "Comments": "TEST - 333"
                })
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

});