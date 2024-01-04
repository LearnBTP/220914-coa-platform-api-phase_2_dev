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
        app = result;
        done();
    });
});
after((done) => {
    new Promise(async function (resolve) {

        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_OUTPUT").where(
            {
                "From_CM": 'F_PEGA',
                "From_Site": 'JKPTG',
                "From_Product": 'Product2',
                "AQID": '12345',
                "To_CM": 'T_PEGA',
                "To_Site": 'DEFH',
                "To_Product": 'Product4'
            }
        ));

        console.log("deleted all newly inserted entries");
        resolve();
    }).then(done);
    // done();
});
/****************************** Worklist (Homepage) ******************************/
describe("All tests", () => {
    describe("(1) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=10&$select=From_Site&$search=From_Site")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(2) From_Site: GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=From_Site%20asc&search-focus=From_Site&$search=&$select=From_Site")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(3) From_CM : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=From_CM%20asc&search-focus=From_CM&$search=&$select=From_CM")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(4) From_Product : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=From_Product%20asc&search-focus=From_Product&$search=&$select=From_Product")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(5) To_Site : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=To_Site%20asc&search-focus=To_Site&$search=&$select=To_Site")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(6) To_CM : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=To_CM%20asc&search-focus=To_CM&$search=&$select=To_CM")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(7) To_Product : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=To_Product%20asc&search-focus=To_Product&$search=&$select=To_Product")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(8) AQID : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=AQID%20asc&search-focus=AQID&$search=&$select=AQID")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(9) MFR : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/output/F4help?$skip=0&$top=115&$orderby=MFR%20asc&search-focus=MFR&$search=&$select=MFR")
                .auth(token, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(10) GET CarryoverOutput", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
        it("+ should return 200 on correct CarryoverOutput request", (done) => {
            chai.request(app)
                .get("/output/CarryoverOutput?$skip=0&$top=110&$filter=To_CM%20eq%20%27PEGA%27%20or%20To_CM%20eq%20%27WIST%27&$select=From_CM%2cFrom_Site%2cFrom_Product%2cAQID%2cFrom_Business_Grp%2cTo_CM%2cTo_Site%2cTo_Product%2cTo_Business_Grp%2cEQ_Name%2cMFR%2cQuantity%2cCM_Balance_Qty%2cmodifiedBy%2cStatus%2cApproved_By%2cReview_Date%2cComment%2cBeError")
                .auth(token2, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(11) GET CarryoverOutput", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
        it("+ should return 200 on correct CarryoverOutput request", (done) => {

            chai.request(app)
                .get("/output/CarryoverOutput?$skip=0&$top=110&$filter=To_CM%20eq%20%27T_PEGA%27%20or%20To_CM%20eq%20%27WIST%27&$select=From_CM%2cFrom_Site%2cFrom_Product%2cAQID%2cFrom_Business_Grp%2cTo_CM%2cTo_Site%2cTo_Product%2cTo_Business_Grp%2cEQ_Name%2cMFR%2cQuantity%2cCM_Balance_Qty%2cmodifiedBy%2cStatus%2cApproved_By%2cReview_Date%2cComment%2cBeError")
                .auth(token2, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(12) GET CarryoverOutput", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
        it("+ should return 200 on correct CarryoverOutput request", (done) => {
            chai.request(app)
                .get("/output/CarryoverOutput?$skip=0&$top=110&$filter=To_CM%20eq%20%27T_PEGA%27%20or%20To_CM%20eq%20%27WIST%27&$select=From_CM%2cFrom_Site%2cFrom_Product%2cAQID%2cFrom_Business_Grp%2cTo_CM%2cTo_Site%2cTo_Product%2cTo_Business_Grp%2cEQ_Name%2cMFR%2cQuantity%2cCM_Balance_Qty%2cmodifiedBy%2cStatus%2cApproved_By%2cReview_Date%2cComment%2cBeError")
                .auth(token2, { type: 'bearer' })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });


    describe("(13) put CarryoverOutput", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on CarryoverOutput ", (done) => {
            chai.request(app)
                .put("/output/CarryoverOutput(From_CM='PEGA',From_Site='KSPH',From_Product='Product2',AQID='00456-01',To_CM='PEGA',To_Site='KSPH',To_Product='D62')")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "CM_Balance_Qty": 4,
                    "Comment": "Test1"
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(14) CM Balance Qty exceed total CO qty Test CarryoverOutput", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
        it("+ should return 400 on CarryoverOutput ", (done) => {

            chai.request(app)
                .put("/output/CarryoverOutput(From_CM='F_PEGA',From_Site='JKPTG',From_Product='Product2',AQID='1234',To_CM='T_PEGA',To_Site='DEFH',To_Product='Product4')")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "From_CM": "F_PEGA",
                    "From_Site": "JKPTG",
                    "From_Product": 'Product2',
                    "AQID": "1234",
                    "To_CM": "T_PEGA",
                    "To_Site": "DEFH",
                    "To_Product": "Product4",
                    "CM_Balance_Qty": 5,
                    "Comment": "Test 1"
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(400);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });

    });


    describe("(15) Error: Enter CM Balance Qty / Comment Test, CarryoverOutput", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on CarryoverOutput ", (done) => {
            chai.request(app)
                .put("/output/CarryoverOutput(From_CM='PEGA',From_Site='KSPH',From_Product='Product2',AQID='00456-01',To_CM='PEGA',To_Site='KSPH',To_Product='D62')")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "CM_Balance_Qty": 0,
                    "Comment": ""
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(400);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(16) PUT CarryoverOutput", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on CarryoverOutput ", (done) => {

            new Promise(async function (resolve) {
                try {

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_OUTPUT").where({
                        "From_CM":"HHZZ",
                        "From_Site":"WINP",
                        "From_Product":"Product2",
                        "AQID":"1234",
                        "To_CM":"HHZZ",
                        "To_Site":"WINP",
                        "To_Product":"Product4"
                    }));
                   
                    await cds.run(INSERT.into("COM_APPLE_COA_T_COA_OUTPUT").entries({
                        "From_CM": "HHZZ",
                        "From_Site": "WINP",
                        "From_Product": 'Product2',
                        "AQID": "1234",
                        "To_CM": "HHZZ",
                        "To_Site": "WINP",
                        "To_Product": "Product4",
                        "From_GHSite" : "FXCD",
                        "To_GHSite" : "FXCD",
                        "From_Business_Grp" : "Business Group 1",
                        "To_Business_Grp" : "Business Group 2",
                        "EQ_Name" : "Apple_EQ",
                        "MFR" : "MFR3",
                        "Quantity" : "10",
                        "CM_Balance_Qty" : "5",
                        "Comment": "Test 1",
                        "Status": "Pending",
                        "SAP_CM_Site" : "HHZZ-WINP",
                        "SAP_To_CM_Site" : "HHZZ-WINP"
                       
                    }));

                    let response = await chai.request(app)
                        .put("/output/CarryoverOutput(From_CM='HHZZ',From_Site='WINP',From_Product='Product2',AQID='1234',To_CM='HHZZ',To_Site='WINP',To_Product='Product4')")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "From_CM": "HHZZ",
                            "From_Site": "WINP",
                            "From_Product": 'Product2',
                            "AQID": "1234",
                            "To_CM": "HHZZ",
                            "To_Site": "WINP",
                            "To_Product": "Product4",
                            "CM_Balance_Qty": 4,
                            "Comment": "Test 2"
                        })

                       

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

});
