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
let app = null;
const token = 'some_token';
before((done) => {
    server.then(async (result) => {
        const db = await cds.connect.to('db');
        hdb = await cds.connect.to('db');
        app = result;
        done();
    });
});



/****************************** Worklist (Homepage) ******************************/
describe("All tests", () => {
    describe("GET Program - /npi-program/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/npi-program/F4help?$skip=0&$top=119&$orderby=Program%20asc&search-focus=Program&search=&$select=Program")
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

    describe("GET Program - /npi-program/F4help", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .get("/npi-program/F4help?$skip=0&$top=119&$orderby=Program_Description%20asc&search-focus=Program_Description&search=&$select=Program_Description")
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

    describe("PUT Program - /npi-program/CarryoverNPIProgram('D17')", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .put("/npi-program/CarryoverNPIProgram('D17')")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({ "Program_Description": "Test " })
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

    describe("POST -  /npi-program/CarryoverNPIProgram", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .post("/npi-program/CarryoverNPIProgram")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({ "Program": "D49", "Program_Description": "Test Program" })
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

    describe("Delete /npi-program/CarryoverNPIProgram('D49')", () => {
        it("+ should return success", (done) => {
            chai.request(app)
                .delete("/npi-program/CarryoverNPIProgram('D49')")
                .auth(token, { type: 'bearer' })
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
