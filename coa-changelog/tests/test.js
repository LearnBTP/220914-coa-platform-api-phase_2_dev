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

describe("All tests", () => {
    describe("(1) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/changelog/F4help?$skip=0&$top=114&$orderby=Action_Type%20asc&search-focus=Action_Type&search=&$select=Action_Type")
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

    describe("(2) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/changelog/F4help?$skip=0&$top=114&$orderby=Key_Fields%20asc&search-focus=Key_Fields&search=&$select=Key_Fields")
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

    describe("(3) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/changelog/F4help?$skip=0&$top=114&$orderby=Field_Name%20asc&search-focus=Field_Name&search=&$select=Field_Name")
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

    describe("(4) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/changelog/F4help?$skip=0&$top=114&$orderby=New_Value%20asc&search-focus=New_Value&search=&$select=New_Value")
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

    describe("(5) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/changelog/F4help?$skip=0&$top=114&$orderby=Old_Value%20asc&search-focus=Old_Value&search=&$select=Old_Value")
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

    describe("(6) GET changHistory", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct changHistory request", (done) => {
            chai.request(app)
                .get("/changelog/changHistory")
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

    describe("(6) GET changHistory", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct changHistory request", (done) => {
            chai.request(app)
                .get("/changelog/changHistory")
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


    describe("(7) Update compareTabels", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 204 on correct compareTabels request", (done) => {
            chai.request(app)
                .post("/changelog/compareTabels")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "body":"[{\n\t\"TableName\": \"T_COA_SUBLINE\",\n\t\"old_records\": [[0,0,0,0,\"PEGA\",\"SHPH\",\"D17\",\"CSA Cyclone flex-UIC 2683\",0,0,725,22,4560,\"\"]],\"new_records\": [[0,0,0,0,\"PEGA\",\"SHPH\",\"D17\",\"CSA Cyclone flex-UIC 2683\",0.99,0,725,22,4560,\"Test Script testing\"]],\"actionType\":\"UPDATE\"\n}]"
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

    describe("(8) Insert compareTabels", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 204 on correct compareTabels request", (done) => {
            chai.request(app)
                .post("/changelog/compareTabels")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "body":"[{\n\t\"TableName\": \"T_COA_SUBLINE\",\n\t\"old_records\": [[0,0,0,0,\"PEGA\",\"SHPH\",\"D17\",\"CSA Cyclone flex-UIC 2683\",0,0,725,22,4560,\"\"]],\"new_records\": [[0,0,0,0,\"PEGA\",\"SHPH\",\"D17\",\"CSA Cyclone flex-UIC 2683\",0.99,0,725,22,4560,\"Test Script testing\"]],\"actionType\":\"INSERT\"\n}]"
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

});
