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

        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SHAPES").where({
            "Floor": "FF02-1",
            "Site": "PBPH",
            "CM": "HHZZ",
            "Building": "D02",
            "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
            "Status": "DRAFT"
        }));

        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_VERTICES").where({
            "Vertices_Y": 312,
            "Vertices_X": 451,
            "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
            "Status": "DRAFT"
        }));

        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_VERTICES").where({
            "Vertices_Y": 63,
            "Vertices_X": 115,
            "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
            "Status": "DRAFT"
        }));

        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_RFID_ANNOTATION").where({
            "Rfid": "000000000000A1300010E523"
        }));

        console.log("deleted all newly inserted entries");
        resolve();
    }).then(done);

});

/****************************** Worklist (Homepage) ******************************/
describe("All tests", () => {

    describe("(1) GET DropDown", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct DropDown request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/DropDown?$filter=FilterNameValue eq 'Site-ALL'")
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

    describe("(1(A)) GET DropDown", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct DropDown request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/DropDown?$filter=FilterNameValue eq 'Site-PBPH'")
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

    describe("(2) GET GetRFIDAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct GetRFIDAnnotation request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/GetRFIDAnnotation")
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

    describe("(2) GET GetRFIDAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct GetRFIDAnnotation request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/GetRFIDAnnotation")
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

    describe("(3) GET Get3DVHeader", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct Get3DVHeader request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/Get3DVHeader")
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

    describe("(4) GET GetShapes", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct GetShapes request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/GetShapes?$expand=Shape_Vertices&$filter=Building eq 'G07' and Site eq 'PBPH' and Floor eq '1F' and CM eq 'HHZZ' and Status eq 'PUBLISH'")
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

    describe("(5) GET GetVertices", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct GetVertices request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/GetVertices")
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

    describe("(6) GET AnnotationDetails", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct AnnotationDetails request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/AnnotationDetails")
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

    describe("(7) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help")
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

    describe("(8)LineId: GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help?$skip=0&$top=119&search-focus=LineId&$search=L&$select=LineId")
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

    describe("(9) Site: GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help?skip=0&$top=119&search-focus=Site&$search=L&$select=Site")
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

    describe("(10)CM: GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help?$skip=0&$top=119&search-focus=CM&$search=L&$select=CM")
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

    describe("(11) Floor: GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help?$skip=0&$top=119&search-focus=Floor&$search=L&$select=Floor")
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

    describe("(12)Building: GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help?$skip=0&$top=119&search-focus=Building&$search=L&$select=Building")
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

    describe("(13) LineType: GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help?$skip=0&$top=119&search-focus=LineType&$search=L&$select=LineType")
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


    describe("(14) GET HeaderAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct HeaderAnnotation request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/HeaderAnnotation?$filter=LineId eq '123123'")
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

    describe("(15) post checkRFIDInsideShape", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on checkRFIDInsideShape ", (done) => {
            chai.request(app)
                .post("/annotation3-dv/checkRFIDInsideShape")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send(
                    {
                        "request":
                        {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "line": "L01-01F",
                            "Building": "D06",
                            "Status": "DRAFT",
                            "Shape_Guid": "9447805a-8a1a-43cb-9046-f06d115c14b0",
                            "scale": { "X": 0.05, "Y": 0.05 },
                            // "canvasBound": { "top": 104, "left": 0, "marginX": 0, "marginY": 0 },
                            "canvasDim": { "width": 3342, "height": 2254 },
                            "Shape_Vertices": [{ "Vertices_X": 1883, "Vertices_Y": 281, "Sequence_No": 1 }, { "Vertices_X": 29, "Vertices_Y": 44, "Sequence_No": 2 }],
                            "otherShapes": [{ "data": [{ "Vertices_X": 1883, "Vertices_Y": 281, "Sequence_No": 1 }, { "Vertices_X": 29, "Vertices_Y": 44, "Sequence_No": 2 }] }]
                        }
                    }

                )
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

    describe("(16) post createDraftAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct createDraftAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/createDraftAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request":
                    {
                        "header":
                        {
                            "Floor": "1F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "K03",
                            "Status": "DRAFT"
                        }, "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "25341a74-c874-4d01-8254-1667425092160",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Uph": null,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 380,
                                            "Vertices_Y": 704,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 136,
                                            "Vertices_Y": 35,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": ["4be623e8-8cce-40c7-83bf-1667343341552",
                                "54a28b64-7afe-4e16-8d6b-1667343500602",
                                "574b406c-32dc-45a3-879e-1667343471252"
                            ]
                        }, "rfid": [{
                            "Rfid": "000000000000A11000100F4F",
                            "Comments": null,
                            "Shape_Guid": null,
                            "Shape_Color": "red",
                            "LineId": null,
                            "LineType": null,
                            "Override_LineId": null,
                            "Uph": null,
                            "Aqid": "43642-01",
                            "CarryOverAqid": null,
                            "CarryOverOldProgram": null
                        }, {
                            "Rfid": "000000000000A11000100FDD",
                            "Comments": null,
                            "Shape_Guid": null,
                            "Shape_Color": "red",
                            "LineId": null,
                            "LineType": null,
                            "Override_LineId": null,
                            "Uph": null,
                            "Aqid": "43642-01",
                            "CarryOverAqid": null,
                            "CarryOverOldProgram": null
                        }, {
                            "Rfid": "000000000000A1100010103B",
                            "Comments": null,
                            "Shape_Guid": null,
                            "Shape_Color": "red",
                            "LineId": null,
                            "LineType": null,
                            "Override_LineId": null,
                            "Uph": null,
                            "Aqid": "43642-01",
                            "CarryOverAqid": null,
                            "CarryOverOldProgram": null
                        }]
                    }
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

    describe("(17) post saveAsAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct saveAsAnnotation request", (done) => {

            new Promise(async function (resolve) {

                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SHAPES").where({
                    "Floor": "FF02-1",
                    "Site": "PBPH",
                    "CM": "HHZZ",
                    "Building": "D02",
                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                    "Status": "DRAFT"
                }));

                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_VERTICES").where({
                    "Vertices_Y": 312,
                    "Vertices_X": 451,
                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                    "Status": "DRAFT"
                }));

                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_VERTICES").where({
                    "Vertices_Y": 63,
                    "Vertices_X": 115,
                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                    "Status": "DRAFT"
                }));

                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_RFID_ANNOTATION").where({
                    "Rfid": "000000000000A1300010E523"
                }));

                try {
                    let response = await chai.request(app)
                        .post("/annotation3-dv/saveAsAnnotation")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "request": {
                                "header": {
                                    "Floor": "FF02-1",
                                    "Site": "PBPH",
                                    "CM": "HHZZ",
                                    "Building": "D02",
                                    "Status": "DRAFT"
                                }, "shapes": {
                                    "new_shapes":
                                        [{
                                            "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                            "Shape_Color": "red",
                                            "Shape_Type": "R",
                                            "Shape_Name": "Test",
                                            "LineId": "LINE4",
                                            "Uph": 590,
                                            "Shape_Vertices": {
                                                "results": [{
                                                    "Vertices_X": 451,
                                                    "Vertices_Y": 312,
                                                    "Sequence_No": 1
                                                }, {
                                                    "Vertices_X": 115,
                                                    "Vertices_Y": 63,
                                                    "Sequence_No": 2
                                                }]
                                            }
                                        }],
                                    "del_shapes": [],
                                    "upd_shapes": []
                                }, "rfid":
                                    [{
                                        "Rfid": "000000000000A1300010E523",
                                        "Comments": "test comments",
                                        "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                        "LineId": "LINE4",
                                        "LineType": "FATP Burn-in 2683",
                                        "Override_LineId": "",
                                        "Uph": 590,
                                        "Aqid": "43642-01",
                                        "CarryOverAqid": "00456-01",
                                        "CarryOverOldProgram": "D63"
                                    }
                                    ]
                            }
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

    describe("(18) post publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "CSA Cyclone flex-UIC 2683",
                                "Override_LineId": "",
                                "Uph": 1298,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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

    describe("(18 (A)) User is missing Authorization - post publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 500 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token2, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "CSA Cyclone flex-UIC 2683",
                                "Override_LineId": "",
                                "Uph": 1298,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(500);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(19)  LineID is mandatory, LineType is mandatory, UPH is mandatory : publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "",
                                "LineType": "",
                                "Override_LineId": "",
                                "Uph": null,
                                "Aqid": "test",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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

    describe("(20) LineType is mandatory : publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "",
                                "Override_LineId": "",
                                "Uph": 590,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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

    describe("(21) UPH is mandatory : publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "FATP||Demo Fresh||",
                                "Override_LineId": "",
                                "Uph": null,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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


    describe("(22)  LineID is mandatory, LineType is mandatory, Invalid LineType and Uph Combination: publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "",
                                "LineType": "",
                                "Override_LineId": "",
                                "Uph": 590,
                                "Aqid": "test",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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

    describe("(23) Invalid LineType and Uph Combination - post publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "test",
                                "Override_LineId": "",
                                "Uph": 5,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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
    describe("(24) UPH is mandatory, Invalid LineType and Uph Combination, Invalid Aqid - post publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "test",
                                "Override_LineId": "",
                                "Uph": null,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "undefined",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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


    describe("(25) Invalid Auid - publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "FATP||Demo Fresh||",
                                "Override_LineId": "",
                                "Uph": 590,
                                "Aqid": '',
                                "CarryOverAqid": "undefined",
                                "CarryOverOldProgram": "D63"
                            }]
                    }
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

    describe("(26) Invalid LineType, Invalid LineType Uph, Invalid Program - post publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "test",
                                "Override_LineId": "",
                                "Uph": 0,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "undefined"
                            }
                            ]
                    }
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

    describe("(27) Invalid Program - publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "FATP||Demo Fresh||",
                                "Override_LineId": "",
                                "Uph": 590,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "undefined"
                            }]
                    }
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

    describe("(28) post store3DVAnnotationData", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct store3DVAnnotationData request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/store3DVAnnotationData")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "contextData": {
                        "GUID": "VWpIJyN4LwfRN8iW-L4rG1zkZnC9lIohVS4EIGOwenA",
                        "ImageWidth": "",
                        "ImageHeight": "",
                        "JSON": {
                            "Data": {
                                "cm": "Foxconn",
                                "site": "FXZZ",
                                "building": "L01",
                                "floor": "1F",
                                "line": "L01-01F",
                                "sapCode": "HHZZ-PBPH",
                                "startDate": "2022-08-29T02:54:02Z",
                                "endDate": "2022-08-29T03:09:45Z",
                                "tags": "tags.csv",
                                "image": "floorplan.png",
                                "origin": {
                                    "x": 0,
                                    "y": 0
                                },
                                "scale": {
                                    "x": 0.05,
                                    "y": 0.05
                                },
                                "orientation": {
                                    "x": "right",
                                    "y": "up"
                                }
                            },
                        },
                        "CSV": {
                            "Data": [
                                {
                                    "epc": "000000000000A1300014F374",
                                    "x_m": "101.887",
                                    "y_m": "79.327",
                                    "err_m": "-1.000"
                                }
                            ]
                        }
                    }
                })
                .end((error, response) => {
                    try {
                        response.should.have.status(204);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(29) post LockManager", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on LockManager ", (done) => {
            chai.request(app)
                .post("/annotation3-dv/lockManager")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send(
                    {
                        "request":
                        {
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "DRAFT",
                            "Lock": "X",
                            "Last_Active_User": null,
                            "Last_Active_Date": null
                        }
                    }

                )
                .end((error, response) => {
                    try {
                        response.should.have.status(204);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(30) post Locking", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on locking ", (done) => {
            chai.request(app)
                .post("/annotation3-dv/locking")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send(
                    {
                        "request":
                        {
                            "Lock": null,
                            "Floor": "FF02-1",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D02",
                            "Status": "DRAFT"

                        }
                    }
                )
                .end((error, response) => {
                    try {
                        response.should.have.status(204);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(31) post Locking", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on locking ", (done) => {
            chai.request(app)
                .post("/annotation3-dv/locking")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send(
                    {
                        "request":
                        {
                            "Lock": true,
                            "Building": "D06",
                            "Floor": "2F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Status": "REJECTED"

                        }
                    }
                )
                .end((error, response) => {
                    try {
                        response.should.have.status(204);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(32) Locking Error - post Locking", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on locking ", (done) => {

            new Promise(async function (resolve) {
                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_3DV_HEADER").where({
                    "Building": "D06",
                    "Floor": "2F",
                    "Site": "PBPH",
                    "CM": "HHZZ",
                    "Status": "DRAFT",
                    "Last_Active_User": "schinnabathuni@apple.com"
                }));
                await cds.run(INSERT.into("COM_APPLE_COA_T_COA_3DV_HEADER", {
                    "Building": "D06",
                    "Floor": "2F",
                    "Site": "PBPH",
                    "CM": "HHZZ",
                    "Status": "DRAFT",
                    "Last_Active_User": "schinnabathuni@apple.com",
                    "Lock": "X"
                }));

                try {
                    let response = await chai.request(app)
                        .post("/annotation3-dv/locking")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send(
                            {
                                "request":
                                {
                                    "Lock": true,
                                    "Building": "D06",
                                    "Floor": "2F",
                                    "Site": "PBPH",
                                    "CM": "HHZZ",
                                    "Status": "DRAFT"

                                }
                            }
                        )
                    response.should.have.status(400);
                    resolve();
                }
                catch (error) {
                    console.log(error);
                    resolve(error);
                }

            }).then(done)
        });
    });

    describe("(33) with Lock 'undefined' - post Locking", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 204 on locking ", (done) => {

            new Promise(async function (resolve) {
                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_3DV_HEADER").where({
                    "Building": "L01",
                    "Floor": "1F",
                    "Site": "PBPH",
                    "CM": "HHZZ",
                    "Status": "DRAFT",
                }));
                await cds.run(INSERT.into("COM_APPLE_COA_T_COA_3DV_HEADER", {
                    "Building": "L01",
                    "Floor": "1F",
                    "Site": "PBPH",
                    "CM": "HHZZ",
                    "Status": "DRAFT",
                    "Last_Active_User": "njha2@apple.com",
                    "Lock": "X"
                }));
                try {
                    let response = await chai.request(app)
                        .post("/annotation3-dv/locking")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send(
                            {
                                "request":
                                {
                                    "Lock": undefined,
                                    "Building": "L01",
                                    "Floor": "1F",
                                    "Site": "PBPH",
                                    "CM": "HHZZ",
                                    "Status": "DRAFT"

                                }
                            }
                        )
                    response.should.have.status(204);
                    resolve();
                }
                catch (error) {
                    console.log(error);
                    resolve(error);
                }

            }).then(done)
        });
    });


    describe("(34) post saveAsAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct saveAsAnnotation request", (done) => {

            new Promise(async function (resolve) {

                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SHAPES").where({
                    "Floor": "2F",
                    "Site": "PBPH",
                    "CM": "HHZZ",
                    "Building": "D02",
                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                    "Status": "DRAFT"
                }));

                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_VERTICES").where({
                    "Vertices_Y": 312,
                    "Vertices_X": 451,
                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                    "Status": "DRAFT"
                }));

                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_VERTICES").where({
                    "Vertices_Y": 63,
                    "Vertices_X": 115,
                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                    "Status": "DRAFT"
                }));

                try {
                    let response = await chai.request(app)
                        .post("/annotation3-dv/saveAsAnnotation")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "request": {
                                "header": {
                                    "Floor": "2F",
                                    "Site": "PBPH",
                                    "CM": "HHZZ",
                                    "Building": "D02",
                                    "Status": "DRAFT"
                                }, "shapes": {
                                    "new_shapes":
                                        [{
                                            "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                            "Shape_Color": "red",
                                            "Shape_Type": "R",
                                            "Shape_Name": "Test",
                                            "LineId": "LINE4",
                                            "Uph": 590,
                                            "Shape_Vertices": {
                                                "results": [{
                                                    "Vertices_X": 451,
                                                    "Vertices_Y": 312,
                                                    "Sequence_No": 1
                                                }, {
                                                    "Vertices_X": 115,
                                                    "Vertices_Y": 63,
                                                    "Sequence_No": 2
                                                }]
                                            }
                                        }],
                                    "del_shapes": [],
                                    "upd_shapes": []
                                }, "rfid":
                                    []
                            }
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

    describe("(35) Invalid LineType and Uph Combination - publishAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on correct publishAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/publishAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "1F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "D06",
                            "Status": "PUBLISH"
                        },
                        "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "7080c41f-732e-4139-b6dd-1670007801447",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "Test Comments",
                                "Shape_Guid": "a40ee31c-7c07-4214-b136-1670007786247",
                                "LineId": "LINE4",
                                "LineType": "FATP||Demo Fresh||",
                                "Override_LineId": "",
                                "Uph": 590,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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

    describe("(36) post createDraftAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct createDraftAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/createDraftAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request":
                    {
                        "header":
                        {
                            "Floor": "1F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "K03",
                            "Status": "DRAFT"
                        }, "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "a40ee31c-7c07-4214-b136-1670007786247",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Uph": null,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 380,
                                            "Vertices_Y": 704,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 136,
                                            "Vertices_Y": 35,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": ["4be623e8-8cce-40c7-83bf-1667343341552",
                                "54a28b64-7afe-4e16-8d6b-1667343500602",
                                "574b406c-32dc-45a3-879e-1667343471252"
                            ]
                        }, "rfid": [{
                            "Rfid": "000000000000A11000100F4F",
                            "Comments": null,
                            "Shape_Guid": null,
                            "Shape_Color": "red",
                            "LineId": null,
                            "LineType": null,
                            "Override_LineId": null,
                            "Uph": null,
                            "Aqid": "43642-01",
                            "CarryOverAqid": null,
                            "CarryOverOldProgram": null
                        }, {
                            "Rfid": "000000000000A11000100FDD",
                            "Comments": null,
                            "Shape_Guid": null,
                            "Shape_Color": "red",
                            "LineId": null,
                            "LineType": null,
                            "Override_LineId": null,
                            "Uph": null,
                            "Aqid": "43642-01",
                            "CarryOverAqid": null,
                            "CarryOverOldProgram": null
                        }, {
                            "Rfid": "000000000000A1100010103B",
                            "Comments": null,
                            "Shape_Guid": null,
                            "Shape_Color": "red",
                            "LineId": null,
                            "LineType": null,
                            "Override_LineId": null,
                            "Uph": null,
                            "Aqid": "43642-01",
                            "CarryOverAqid": null,
                            "CarryOverOldProgram": null
                        }]
                    }
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

    describe("(37) post createDraftAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct createDraftAnnotation request", (done) => {
            chai.request(app)
                .post("/annotation3-dv/createDraftAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request":
                    {
                        "header":
                        {
                            "Floor": "1F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "K03",
                            "Status": "DRAFT"
                        }, "shapes":
                        {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "7080c41f-732e-4139-b6dd-1670007801447",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Uph": null,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 380,
                                            "Vertices_Y": 704,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 136,
                                            "Vertices_Y": 35,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": ["f6db8e8d-226b-4a35-8be6-1670007554535"
                            ]
                        }, "rfid": [{
                            "Rfid": "000000000000A11000100F4F",
                            "Comments": null,
                            "Shape_Guid": null,
                            "Shape_Color": "red",
                            "LineId": null,
                            "LineType": null,
                            "Override_LineId": null,
                            "Uph": null,
                            "Aqid": "43642-01",
                            "CarryOverAqid": null,
                            "CarryOverOldProgram": null
                        }]
                    }
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

    describe("(38)User is missing Authorization : GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 401 on correct F4help request", (done) => {
            chai.request(app)
                .get("/annotation3-dv/F4help?$skip=0&$top=119&search-focus=LineId&$search=L&$select=LineId")
                .end((error, response) => {
                    try {
                        response.should.have.status(401);
                        done();
                    } catch (error) {
                        console.log(error);
                        done(error);
                    }
                });
        });
    });

    describe("(39) Invalid LineType and Uph Combination - saveAsAnnotation", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on correct saveAsAnnotation request", (done) => {

            chai.request(app)
                .post("/annotation3-dv/saveAsAnnotation")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "request": {
                        "header": {
                            "Floor": "1F",
                            "Site": "PBPH",
                            "CM": "HHZZ",
                            "Building": "G07",
                            "Status": "DRAFT"
                        }, "shapes": {
                            "new_shapes":
                                [{
                                    "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                    "Shape_Color": "red",
                                    "Shape_Type": "R",
                                    "Shape_Name": "Test",
                                    "LineId": "LINE4",
                                    "Uph": 590,
                                    "Shape_Vertices": {
                                        "results": [{
                                            "Vertices_X": 451,
                                            "Vertices_Y": 312,
                                            "Sequence_No": 1
                                        }, {
                                            "Vertices_X": 115,
                                            "Vertices_Y": 63,
                                            "Sequence_No": 2
                                        }]
                                    }
                                }],
                            "del_shapes": [],
                            "upd_shapes": []
                        }, "rfid":
                            [{
                                "Rfid": "000000000000A1300010E523",
                                "Comments": "test comments",
                                "Shape_Guid": "d3ab2986-363e-4984-8481-1666957004696",
                                "LineId": "LINE4",
                                "LineType": "FATP||Demo Fresh||",
                                "Override_LineId": "",
                                "Uph": 590,
                                "Aqid": "43642-01",
                                "CarryOverAqid": "00456-01",
                                "CarryOverOldProgram": "D63"
                            }
                            ]
                    }
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
});



