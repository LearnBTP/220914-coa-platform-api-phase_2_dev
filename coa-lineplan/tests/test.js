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
        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").where(
            {
                CM: "BD03",
                Site: "NEWS"
            })
        );
        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_MAIN_LINE").where(
            {
                "CM": "HHZZ",
                "Site": "PBPH",
                "Program": "D63"
            })
        );

        await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SUBLINE").where(
            {

                "Site": "PBPH",
                "Program": "D63",
                "Sub_Line_Name": "FATP||Repair-room||",
                "CM": "HHGL"

            })
        );

        console.log("deleted all newly inserted entries");
        resolve();
    }).then(done);
    done();
});

/****************************** Worklist (Homepage) ******************************/
describe("All tests", () => {
    describe("(1) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/lineplan/F4help?$skip=0&$top=119&search-focus=Mainline_Site&search=D62&$select=Mainline_Site")
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
                .get("/lineplan/F4help?$skip=0&$top=119&search-focus=Mainline_CM&search=D62&$select=Mainline_CM")
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
                .get("/lineplan/F4help?$skip=0&$top=119&search-focus=Mainline_Program&search=D62&$select=Mainline_Program")
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
                .get("/lineplan/F4help?$skip=0&$top=119&search-focus=Subline_Site&search=D62&$select=Subline_Site")
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
                .get("/lineplan/F4help?$skip=0&$top=117&search-focus=Subline_CM&search=PEGA&$select=Subline_CM")
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

    describe("(6) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/lineplan/F4help?$skip=0&$top=117&search-focus=Subline_Program&search=PEGA&$select=Subline_Program")
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
                .get("/lineplan/F4help?$skip=0&$top=117&search-focus=Sub_Line_Name&search=PEGA&$select=Sub_Line_Name")
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

    describe("(8) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/lineplan/F4help?$skip=0&$top=117&search-focus=Lineplan_Site&search=PEGA&$select=Lineplan_Site")
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

    describe("(9) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/lineplan/F4help?$skip=0&$top=117&search-focus=Lineplan_CM&search=PEGA&$select=Lineplan_CM")
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

    describe("(10) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/lineplan/F4help?$skip=0&$top=117&search-focus=Lineplan_Program&search=PEGA&$select=Lineplan_Program")
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

    describe("(11) GET F4help", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct F4help request", (done) => {
            chai.request(app)
                .get("/lineplan/F4help?$skip=0&$top=117&search-focus=Lineplan_Sub_Line_Name&search=PEGA&$select=Lineplan_Sub_Line_Name")
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

    describe("(12(A)) GET CarryoverMainline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct CarryoverMainline request", (done) => {
            chai.request(app)
                .get("/lineplan/CarryoverMainline?$skip=0&$top=130&$orderby=CM%20asc,CM%20asc&search-focus=CM&search=&$select=CM%2cSite")
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

    describe("(12 (B)) GET CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct CarryoverSubline request", (done) => {
            chai.request(app)
                .get("/lineplan/CarryoverSubline?$skip=0&$top=130&$orderby=CM%20asc,CM%20asc&search-focus=CM&search=&$select=CM%2cSite")
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

    describe("(12 (C)) GET CarryoverLineplan", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct CarryoverLineplan request", (done) => {
            chai.request(app)
                .get("/lineplan/CarryoverLineplan?$skip=0&$top=130&$orderby=CM%20asc,CM%20asc&search-focus=CM&search=&$select=CM%2cSite")
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


    describe("(13) POST /lineplan/CarryoverMainline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


        it("+ should return 201 on correct CarryOverMainLine details", (done) => {
            new Promise(async function (resolve) {
                try {
                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_MAIN_LINE").where({
                        "CM": "HHGG",
                        "Site": "PBPH",
                        "Program": "D63"
                    }));

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").where({
                        "CM": "HHGG",
                        "Site": "PBPH",
                        "Program": "D63",
                        "Line": "line-temp",
                        "Uph": 0,
                        "Station": "station-temp"
                    }));

                    await cds.run(INSERT.into("COM_APPLE_COA_T_COA_LINE_SUMMARY").entries({
                        "CM": "HHGG",
                        "Site": "PBPH",
                        "Program": "D63",
                        "Line": "line-temp",
                        "Uph": 0,
                        "Station": "station-temp"
                    }));

                    let response = await chai.request(app)
                        .post("/lineplan/CarryoverMainline")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "CM": "HHGG",
                            "Site": "PBPH",
                            "Program": "D63",
                            "Uph": 590,
                            "BoH": 55,
                            "Fatp_Sustaining_Qty": 50,
                            "Working_Hrs": 20,
                            "Efficiency_Field": 10,
                            "Comment": "NT22"
                            // "Error": ""
                        })
                    response.should.have.status(201);
                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").where({
                        "CM": "HHGG",
                        "Site": "PBPH",
                        "Program": "D63",
                        "Line": "line-temp",
                        "Uph": 0,
                        "Station": "station-temp"
                    }));

                    resolve();
                }
                catch (error) {
                    console.log(error);
                    resolve(error);
                }

            }).then(done)
        });
    });

    describe("(14) PUT /lineplan/CarryoverMainline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct CarryoverMainline details", (done) => {
            chai.request(app)
                .put("/lineplan/CarryoverMainline(CM='HHGG',Site='PBPH',Program='D63')")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "createdAt": "2022-10-13T10:49:36.158Z",
                    "createdBy": "a_badugu@apple.com",
                    "CM": "HHGG",
                    "Site": "PBPH",
                    "Program": "D63",
                    "Uph": 590,
                    "BoH": 56,
                    "Fatp_Sustaining_Qty": 50,
                    "Working_Hrs": 25,
                    "Efficiency_Field": 12,
                    "Comment": "NT22"
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

    describe("(14 (A)) User doesn't have access to CM - PUT /lineplan/CarryoverMainline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct CarryoverMainline details", (done) => {
            const nToken = 'eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vc2NwZHYuYXV0aGVudGljYXRpb24udXMxMC5oYW5hLm9uZGVtYW5kLmNvbS90b2tlbl9rZXlzIiwia2lkIjoiZGVmYXVsdC1qd3Qta2V5LS0xNjcyMTEyOTUwIiwidHlwIjoiSldUIn0.eyJqdGkiOiJlNWRiNmE4ZTY4ZTE0YjQ3OTEyMzgyZTUxMWQ3ZTJmZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJ6ZG4iOiJzY3BkdiJ9LCJ1c2VyX3V1aWQiOiIwMDE3MzYtMDQtZDc3NDUyOWItNGVkYS00NzA3LTk5ODQtOTU4OTBmNjM0NTEyIiwieHMudXNlci5hdHRyaWJ1dGVzIjp7IkNNIjpbIlBFR0EiLCJXSVNUIiwiUEVHQSIsIldJU1QiXSwiU2l0ZSI6WyJLU1BIIiwiV0lOUCIsIktTUEgiLCJXSU5QIl19LCJ4cy5zeXN0ZW0uYXR0cmlidXRlcyI6eyJ4cy5yb2xlY29sbGVjdGlvbnMiOlsiVVg6SUdCX0NPQV9BRE1JTl9SRVNUUklDVEVEIl19LCJnaXZlbl9uYW1lIjoiUG9vamEiLCJmYW1pbHlfbmFtZSI6Ikxha3NobWFuIiwic3ViIjoiNjRjMjFiZTctMTA2OC00ZDk3LWE0MDYtNzQyYTliY2M3NjZiIiwic2NvcGUiOlsiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuU3ViTGluZU1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuQXBwcm92ZUNvT3V0cHV0Iiwib3BlbmlkIiwiemNvYV94c3VhYSF0OTUyNS5MaW5lUGxhblJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRNb2RpZnkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkNPT3V0cHV0UmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1Lk1haW5MaW5lTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcWlkTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcHByb3ZlUmZpZE9uSGFuZFRUIiwiemNvYV94c3VhYSF0OTUyNS5DT091dHB1dE1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuTWFpbkxpbmVSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuQXFpZFJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5Bbm5vdGF0aW9uTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5TdWJMaW5lUmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkFubm90YXRpb25SZWFkT25seSJdLCJjbGllbnRfaWQiOiJzYi16Y29hX3hzdWFhIXQ5NTI1IiwiY2lkIjoic2ItemNvYV94c3VhYSF0OTUyNSIsImF6cCI6InNiLXpjb2FfeHN1YWEhdDk1MjUiLCJncmFudF90eXBlIjoidXJuOmlldGY6cGFyYW1zOm9hdXRoOmdyYW50LXR5cGU6and0LWJlYXJlciIsInVzZXJfaWQiOiI2NGMyMWJlNy0xMDY4LTRkOTctYTQwNi03NDJhOWJjYzc2NmIiLCJvcmlnaW4iOiJjb3JwLWFwcHMiLCJ1c2VyX25hbWUiOiJwb29qYV9sYWtzaG1hbkBhcHBsZS5jb20iLCJlbWFpbCI6InBvb2phX2xha3NobWFuQGFwcGxlLmNvbSIsInJldl9zaWciOiJkMzA1MjkwOCIsImlhdCI6MTY2NDgwMzEyMSwiZXhwIjoxNjY0ODQ2MzIxLCJpc3MiOiJodHRwczovL3NjcGR2LmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJhdWQiOlsiemNvYV94c3VhYSF0OTUyNSIsIm9wZW5pZCIsInNiLXpjb2FfeHN1YWEhdDk1MjUiXX0.wfxNcY9q6R36Et2qohC7hruJDOq2PfZshwtXpcjDn4Q9Do1N40CsF58OFKK1erIrB_g23UsQz08l6O7eB0dk_ZiaGSxm9RAUYgiUI5GlcfUGMPhC2BdS1xEmUWgVe3zXFQN8w9FzFL8PwRs-Qr9Q8nVwzhGtUF9UR4eKsureFmB_dtfRWzV6y5ld19IsSkNWttG8sqUs6TsVD__8HLZmsyvATDN_2Znq9xk0Z7ULO0vkK3itBa9ZtDEr29jlgzEYQ93I-ItUzd26FjPMzKh5w7fjLlllOdVKaXDaI-LLuJ9K2SUpk6QesTVQk0oFnizXj_o7xBTSvecBvgfGxfERog';
            chai.request(app)
                .put("/lineplan/CarryoverMainline(CM='HHZZ',Site='PBPH',Program='D49')")
                .auth(nToken, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "createdAt": "2022-10-13T10:49:36.158Z",
                    "createdBy": "a_badugu@apple.com",
                    "CM": "HHZZ",
                    "Site": "PBPH",
                    "Program": "D63",
                    "Uph": 590,
                    "BoH": 56,
                    "Fatp_Sustaining_Qty": 50,
                    "Working_Hrs": 25,
                    "Efficiency_Field": 12,
                    "Comment": "NT22",
                    "SAP_CM_Site": "HHZZ-PBPH"
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

    describe("(14 (B)) Delete - /lineplan/CarryoverMainline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 204 on correct CarryoverMainline details", (done) => {
            new Promise(async function (resolve) {
                try {
                    await cds.run(INSERT.into("COM_APPLE_COA_T_COA_MAIN_LINE").entries({
                        "CM": "LXSA",
                        "Site": "PBPH",
                        "Program": "D63",
                    }));

                    let response = await chai.request(app)
                        .delete("/lineplan/CarryoverMainline(CM='LXSA',Site='PBPH',Program='D63')")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')

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

    describe("(15) POST Invalid Sub-Line Name - /lineplan/CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on invalid CarryoverSubline details", (done) => {
            new Promise(async function (resolve) {
                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SUBLINE").where({
                    "Site": "PBPH",
                    "Program": "D63",
                    "Sub_Line_Name": "FATP||Demo Fresh||",
                    "CM": "HHZZ"
                }));
                try {

                    let response = await chai.request(app)
                        .post("/lineplan/CarryoverSubline")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "Site": "PBPH",
                            "Program": "D63",
                            "Sub_Line_Name": "FATP||Demo Fresh||",
                            "CM": "HHZZ",
                            "Yield": 10,
                            "Uph": 590,
                            "boH_Qty": 55,
                            "Working_Hrs": 20,
                            "Remote_Site_Cap_Demand": 10,
                            "Comment": "NT22"
                            // "Error": ""
                        })
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

    describe("(16) POST Invalid Program - /lineplan/CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on invalid CarryoverSubline details", (done) => {
            new Promise(async function (resolve) {
                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SUBLINE").where({
                    "Site": "PBPH",
                    "Program": "R228",
                    "Sub_Line_Name": "FATP||Demo Fresh||",
                    "CM": "HHZZ"
                }));
                try {

                    let response = await chai.request(app)
                        .post("/lineplan/CarryoverSubline")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "Site": "PBPH",
                            "Program": "R228",
                            "Sub_Line_Name": "FATP||Demo Fresh||",
                            "CM": "HHZZ",
                            "Yield": 10,
                            "Uph": 590,
                            "boH_Qty": 55,
                            "Working_Hrs": 20,
                            "Remote_Site_Cap_Demand": 10,
                            "Comment": "NT22"
                            // "Error": ""
                        })
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

    describe("(17) Invalid CM-Site Combination and Program and Sub-Line Name - /lineplan/CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on correct CarryoverSubline details", (done) => {
            new Promise(async function (resolve) {
                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SUBLINE").where({
                    "Site": "PBPH",
                    "Program": "R228",
                    "Sub_Line_Name": "FATP||CQA||2684",
                    "CM": "PEGA"
                }));
                try {

                    let response = await chai.request(app)
                        .post("/lineplan/CarryoverSubline")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "Site": "PBPH",
                            "Program": "R228",
                            "Sub_Line_Name": "FATP||CQA||2684",
                            "CM": "PEGA",
                            "Yield": 10,
                            "Uph": 590,
                            "boH_Qty": 55,
                            "Working_Hrs": 20,
                            "Remote_Site_Cap_Demand": 10,
                            "Comment": "NT22"
                            // "Error": ""
                        })
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

    describe("(18) Post - /lineplan/CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 201 on correct CarryoverSubline details", (done) => {
            new Promise(async function (resolve) {
                await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SUBLINE").where({
                    "Site": "PBPH",
                    "Program": "D63",
                    "Sub_Line_Name": "CSA Cyclone flex-UIC 2683",
                    "CM": "HHZZ"
                }));
                try {
                    let response = await chai.request(app)
                        .post("/lineplan/CarryoverSubline")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')
                        .send({
                            "Site": "PBPH",
                            "Program": "D63",
                            "Sub_Line_Name": "CSA Cyclone flex-UIC 2683",
                            "CM": "HHZZ",
                            "Yield": 10,
                            "Uph": 590,
                            "boH_Qty": 55,
                            "Working_Hrs": 20,
                            "Remote_Site_Cap_Demand": 10,
                            "Comment": "NT22"
                            // "Error": ""
                        })
                    response.should.have.status(201);
                    resolve();
                }
                catch (error) {
                    console.log(error);
                    resolve(error);
                }

            }).then(done)
        });
    });

    describe("(19) PUT /lineplan/CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 200 on correct CarryoverSubline details", (done) => {
            chai.request(app)
                .put("/lineplan/CarryoverSubline(CM='HHLH',Site='PBPH',Program='R228',Sub_Line_Name='FATP||CQA||2684')")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "Site": "PBPH",
                    "Program": "R228",
                    "Sub_Line_Name": "FATP||CQA||2684",
                    "CM": "PEGA",
                    "Yield": 10,
                    "Uph": 9,
                    "boH_Qty": 8,
                    "Working_Hrs": 25,
                    "Remote_Site_Cap_Demand": 100,
                    "Comment": ""
                    // "Error": ""
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

    describe("(19 (A)) User doesn't have authorization to CM-Site combination - PUT /lineplan/CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 400 on correct CarryoverSubline details", (done) => {
            const nToken = 'eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vc2NwZHYuYXV0aGVudGljYXRpb24udXMxMC5oYW5hLm9uZGVtYW5kLmNvbS90b2tlbl9rZXlzIiwia2lkIjoiZGVmYXVsdC1qd3Qta2V5LS0xNjcyMTEyOTUwIiwidHlwIjoiSldUIn0.eyJqdGkiOiJlNWRiNmE4ZTY4ZTE0YjQ3OTEyMzgyZTUxMWQ3ZTJmZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJ6ZG4iOiJzY3BkdiJ9LCJ1c2VyX3V1aWQiOiIwMDE3MzYtMDQtZDc3NDUyOWItNGVkYS00NzA3LTk5ODQtOTU4OTBmNjM0NTEyIiwieHMudXNlci5hdHRyaWJ1dGVzIjp7IkNNIjpbIlBFR0EiLCJXSVNUIiwiUEVHQSIsIldJU1QiXSwiU2l0ZSI6WyJLU1BIIiwiV0lOUCIsIktTUEgiLCJXSU5QIl19LCJ4cy5zeXN0ZW0uYXR0cmlidXRlcyI6eyJ4cy5yb2xlY29sbGVjdGlvbnMiOlsiVVg6SUdCX0NPQV9BRE1JTl9SRVNUUklDVEVEIl19LCJnaXZlbl9uYW1lIjoiUG9vamEiLCJmYW1pbHlfbmFtZSI6Ikxha3NobWFuIiwic3ViIjoiNjRjMjFiZTctMTA2OC00ZDk3LWE0MDYtNzQyYTliY2M3NjZiIiwic2NvcGUiOlsiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuU3ViTGluZU1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuQXBwcm92ZUNvT3V0cHV0Iiwib3BlbmlkIiwiemNvYV94c3VhYSF0OTUyNS5MaW5lUGxhblJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRNb2RpZnkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkNPT3V0cHV0UmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1Lk1haW5MaW5lTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcWlkTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcHByb3ZlUmZpZE9uSGFuZFRUIiwiemNvYV94c3VhYSF0OTUyNS5DT091dHB1dE1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuTWFpbkxpbmVSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuQXFpZFJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5Bbm5vdGF0aW9uTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5TdWJMaW5lUmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkFubm90YXRpb25SZWFkT25seSJdLCJjbGllbnRfaWQiOiJzYi16Y29hX3hzdWFhIXQ5NTI1IiwiY2lkIjoic2ItemNvYV94c3VhYSF0OTUyNSIsImF6cCI6InNiLXpjb2FfeHN1YWEhdDk1MjUiLCJncmFudF90eXBlIjoidXJuOmlldGY6cGFyYW1zOm9hdXRoOmdyYW50LXR5cGU6and0LWJlYXJlciIsInVzZXJfaWQiOiI2NGMyMWJlNy0xMDY4LTRkOTctYTQwNi03NDJhOWJjYzc2NmIiLCJvcmlnaW4iOiJjb3JwLWFwcHMiLCJ1c2VyX25hbWUiOiJwb29qYV9sYWtzaG1hbkBhcHBsZS5jb20iLCJlbWFpbCI6InBvb2phX2xha3NobWFuQGFwcGxlLmNvbSIsInJldl9zaWciOiJkMzA1MjkwOCIsImlhdCI6MTY2NDgwMzEyMSwiZXhwIjoxNjY0ODQ2MzIxLCJpc3MiOiJodHRwczovL3NjcGR2LmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJhdWQiOlsiemNvYV94c3VhYSF0OTUyNSIsIm9wZW5pZCIsInNiLXpjb2FfeHN1YWEhdDk1MjUiXX0.wfxNcY9q6R36Et2qohC7hruJDOq2PfZshwtXpcjDn4Q9Do1N40CsF58OFKK1erIrB_g23UsQz08l6O7eB0dk_ZiaGSxm9RAUYgiUI5GlcfUGMPhC2BdS1xEmUWgVe3zXFQN8w9FzFL8PwRs-Qr9Q8nVwzhGtUF9UR4eKsureFmB_dtfRWzV6y5ld19IsSkNWttG8sqUs6TsVD__8HLZmsyvATDN_2Znq9xk0Z7ULO0vkK3itBa9ZtDEr29jlgzEYQ93I-ItUzd26FjPMzKh5w7fjLlllOdVKaXDaI-LLuJ9K2SUpk6QesTVQk0oFnizXj_o7xBTSvecBvgfGxfERog';
            chai.request(app)
                .put("/lineplan/CarryoverSubline(CM='HHLH',Site='PBPH',Program='R228',Sub_Line_Name='FATP||CQA||2684')")
                .auth(nToken, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "Site": "PBPH",
                    "Program": "R228",
                    "Sub_Line_Name": "FATP||CQA||2684",
                    "CM": "HHLH",
                    "Yield": 10,
                    "Uph": 9,
                    "boH_Qty": 8,
                    "Working_Hrs": 25,
                    "Remote_Site_Cap_Demand": 100,
                    "Comment": ""
                    // "Error": ""
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

    describe("(19 (B)) Delete - /lineplan/CarryoverSubline", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 204 on correct CarryoverSubline details", (done) => {
            new Promise(async function (resolve) {
                try {
                    await cds.run(INSERT.into("COM_APPLE_COA_T_COA_SUBLINE", {
                        "CM": "HHZZ",
                        "Site": "PBPH",
                        "Program": "D42",
                        "Sub_Line_Name": "CSA Cyclone flex-UIC 2683"
                    }));

                    let response = await chai.request(app)
                        .delete("/lineplan/CarryoverSubline(CM='HHZZ',Site='PBPH',Program='D42',Sub_Line_Name='CSA Cyclone flex-UIC 2683')")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'application/json')

                    response.should.have.status(204);
                    resolve();
                }
                catch (error) {
                    console.log(error);
                    resolve(error);
                }

            }).then(done)
            // .end((error, response) => {
            //     try {
            //         response.should.have.status(204);
            //         done();
            //     } catch (error) {
            //         console.log(error);
            //         done(error);
            //     }
            // });
        });
    });


    describe("(20) PUT /lineplan/Upload_MainLine", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


        it("+ should return 202 on correct Upload_MainLine details", (done) => {
            new Promise(async function (resolve) {
                try {

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_MAIN_LINE").where({
                        "CM": "HHZZ",
                        "Site": "PBPH",
                        "Program": "D42"
                    }));

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_MAIN_LINE").where({
                        "CM": "LXSA",
                        "Site": "KSPH",
                        "Program": "D63"
                    }));

                    let response = await chai.request(app)
                        .put("/lineplan/Upload_MainLine/csv")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'text/csv')
                        .set('Content-Length', '650000')
                        .attach('fileName', '/home/user/projects/220914-coa-platform-api-main/coa-lineplan/tests/MainLine.csv', 'MainLine.csv');

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

    describe("(21) PUT /lineplan/Upload_SubLine", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


        it("+ should return 202 on correct Upload Subline details", (done) => {
            new Promise(async function (resolve) {
                try {

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SUBLINE").where({
                        "CM": "HHZZ",
                        "Site": "PBPH",
                        "Program": "D63",
                        "Sub_Line_Name": "CSA Cyclone flex-UIC 2683"
                    }));
                    let response = await chai.request(app)
                        .put("/lineplan/Upload_SubLine/csv")
                        .auth(token, { type: 'bearer' })
                        .set('Content-Type', 'text/csv')
                        .set('Content-Length', '650000')
                        .attach('fileName', '/home/user/projects/220914-coa-platform-api-main/coa-lineplan/tests/SubLine.csv', 'SubLine.csv');

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

    describe("(22) Entry already exists - /lineplan/Upload_MainLine", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


        it("+ should return 202 on correct Upload_MainLine details", (done) => {
            chai.request(app)
                .put("/lineplan/Upload_MainLine/csv")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'text/csv')
                .set('Content-Length', '650000')
                .attach('fileName', '/home/user/projects/220914-coa-platform-api-main/coa-lineplan/tests/MainLine.csv', 'MainLine.csv')
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


    describe("(23) Entry already exists- PUT /lineplan/Upload_SubLine", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases

        it("+ should return 202 on correct Upload Subline details", (done) => {
            chai.request(app)
                .put("/lineplan/Upload_SubLine/csv")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'text/csv')
                .set('Content-Length', '650000')
                .attach('fileName', '/home/user/projects/220914-coa-platform-api-main/coa-lineplan/tests/SubLine.csv', 'SubLine.csv')
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

    describe("(24) User doesn't have authorization to CM-Site combination - /lineplan/Upload_MainLine", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


        it("+ should return 202 on correct Upload_MainLine details", (done) => {
            new Promise(async function (resolve) {
                try {

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_MAIN_LINE").where({
                        "CM": "HHZZ",
                        "Site": "PBPH",
                        "Program": "D42"
                    }));

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_MAIN_LINE").where({
                        "CM": "LXSA",
                        "Site": "KSPH",
                        "Program": "D63"
                    }));
                    const nToken = 'eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vc2NwZHYuYXV0aGVudGljYXRpb24udXMxMC5oYW5hLm9uZGVtYW5kLmNvbS90b2tlbl9rZXlzIiwia2lkIjoiZGVmYXVsdC1qd3Qta2V5LS0xNjcyMTEyOTUwIiwidHlwIjoiSldUIn0.eyJqdGkiOiJlNWRiNmE4ZTY4ZTE0YjQ3OTEyMzgyZTUxMWQ3ZTJmZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJ6ZG4iOiJzY3BkdiJ9LCJ1c2VyX3V1aWQiOiIwMDE3MzYtMDQtZDc3NDUyOWItNGVkYS00NzA3LTk5ODQtOTU4OTBmNjM0NTEyIiwieHMudXNlci5hdHRyaWJ1dGVzIjp7IkNNIjpbIlBFR0EiLCJXSVNUIiwiUEVHQSIsIldJU1QiXSwiU2l0ZSI6WyJLU1BIIiwiV0lOUCIsIktTUEgiLCJXSU5QIl19LCJ4cy5zeXN0ZW0uYXR0cmlidXRlcyI6eyJ4cy5yb2xlY29sbGVjdGlvbnMiOlsiVVg6SUdCX0NPQV9BRE1JTl9SRVNUUklDVEVEIl19LCJnaXZlbl9uYW1lIjoiUG9vamEiLCJmYW1pbHlfbmFtZSI6Ikxha3NobWFuIiwic3ViIjoiNjRjMjFiZTctMTA2OC00ZDk3LWE0MDYtNzQyYTliY2M3NjZiIiwic2NvcGUiOlsiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuU3ViTGluZU1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuQXBwcm92ZUNvT3V0cHV0Iiwib3BlbmlkIiwiemNvYV94c3VhYSF0OTUyNS5MaW5lUGxhblJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRNb2RpZnkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkNPT3V0cHV0UmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1Lk1haW5MaW5lTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcWlkTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcHByb3ZlUmZpZE9uSGFuZFRUIiwiemNvYV94c3VhYSF0OTUyNS5DT091dHB1dE1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuTWFpbkxpbmVSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuQXFpZFJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5Bbm5vdGF0aW9uTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5TdWJMaW5lUmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkFubm90YXRpb25SZWFkT25seSJdLCJjbGllbnRfaWQiOiJzYi16Y29hX3hzdWFhIXQ5NTI1IiwiY2lkIjoic2ItemNvYV94c3VhYSF0OTUyNSIsImF6cCI6InNiLXpjb2FfeHN1YWEhdDk1MjUiLCJncmFudF90eXBlIjoidXJuOmlldGY6cGFyYW1zOm9hdXRoOmdyYW50LXR5cGU6and0LWJlYXJlciIsInVzZXJfaWQiOiI2NGMyMWJlNy0xMDY4LTRkOTctYTQwNi03NDJhOWJjYzc2NmIiLCJvcmlnaW4iOiJjb3JwLWFwcHMiLCJ1c2VyX25hbWUiOiJwb29qYV9sYWtzaG1hbkBhcHBsZS5jb20iLCJlbWFpbCI6InBvb2phX2xha3NobWFuQGFwcGxlLmNvbSIsInJldl9zaWciOiJkMzA1MjkwOCIsImlhdCI6MTY2NDgwMzEyMSwiZXhwIjoxNjY0ODQ2MzIxLCJpc3MiOiJodHRwczovL3NjcGR2LmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJhdWQiOlsiemNvYV94c3VhYSF0OTUyNSIsIm9wZW5pZCIsInNiLXpjb2FfeHN1YWEhdDk1MjUiXX0.wfxNcY9q6R36Et2qohC7hruJDOq2PfZshwtXpcjDn4Q9Do1N40CsF58OFKK1erIrB_g23UsQz08l6O7eB0dk_ZiaGSxm9RAUYgiUI5GlcfUGMPhC2BdS1xEmUWgVe3zXFQN8w9FzFL8PwRs-Qr9Q8nVwzhGtUF9UR4eKsureFmB_dtfRWzV6y5ld19IsSkNWttG8sqUs6TsVD__8HLZmsyvATDN_2Znq9xk0Z7ULO0vkK3itBa9ZtDEr29jlgzEYQ93I-ItUzd26FjPMzKh5w7fjLlllOdVKaXDaI-LLuJ9K2SUpk6QesTVQk0oFnizXj_o7xBTSvecBvgfGxfERog';
                    let response = await chai.request(app)
                        .put("/lineplan/Upload_MainLine/csv")
                        .auth(nToken, { type: 'bearer' })
                        .set('Content-Type', 'text/csv')
                        .set('Content-Length', '650000')
                        .attach('fileName', '/home/user/projects/220914-coa-platform-api-main/coa-lineplan/tests/MainLine.csv', 'MainLine.csv');

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

    describe("(25) User doesn't have authorization to CM-Site combination - /lineplan/Upload_SubLine", () => {
        if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
        else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases


        it("+ should return 202 on correct Upload Subline details", (done) => {
            new Promise(async function (resolve) {
                try {

                    await cds.run(DELETE.from("COM_APPLE_COA_T_COA_SUBLINE").where({
                        "CM": "HHZZ",
                        "Site": "PBPH",
                        "Program": "D63",
                        "Sub_Line_Name": "CSA Cyclone flex-UIC 2683"
                    }));
                    const nToken = 'eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vc2NwZHYuYXV0aGVudGljYXRpb24udXMxMC5oYW5hLm9uZGVtYW5kLmNvbS90b2tlbl9rZXlzIiwia2lkIjoiZGVmYXVsdC1qd3Qta2V5LS0xNjcyMTEyOTUwIiwidHlwIjoiSldUIn0.eyJqdGkiOiJlNWRiNmE4ZTY4ZTE0YjQ3OTEyMzgyZTUxMWQ3ZTJmZiIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJ6ZG4iOiJzY3BkdiJ9LCJ1c2VyX3V1aWQiOiIwMDE3MzYtMDQtZDc3NDUyOWItNGVkYS00NzA3LTk5ODQtOTU4OTBmNjM0NTEyIiwieHMudXNlci5hdHRyaWJ1dGVzIjp7IkNNIjpbIlBFR0EiLCJXSVNUIiwiUEVHQSIsIldJU1QiXSwiU2l0ZSI6WyJLU1BIIiwiV0lOUCIsIktTUEgiLCJXSU5QIl19LCJ4cy5zeXN0ZW0uYXR0cmlidXRlcyI6eyJ4cy5yb2xlY29sbGVjdGlvbnMiOlsiVVg6SUdCX0NPQV9BRE1JTl9SRVNUUklDVEVEIl19LCJnaXZlbl9uYW1lIjoiUG9vamEiLCJmYW1pbHlfbmFtZSI6Ikxha3NobWFuIiwic3ViIjoiNjRjMjFiZTctMTA2OC00ZDk3LWE0MDYtNzQyYTliY2M3NjZiIiwic2NvcGUiOlsiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuU3ViTGluZU1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuQXBwcm92ZUNvT3V0cHV0Iiwib3BlbmlkIiwiemNvYV94c3VhYSF0OTUyNS5MaW5lUGxhblJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5SZmlkT25IYW5kVFRNb2RpZnkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkNPT3V0cHV0UmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1Lk1haW5MaW5lTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcWlkTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5BcHByb3ZlUmZpZE9uSGFuZFRUIiwiemNvYV94c3VhYSF0OTUyNS5DT091dHB1dE1vZGlmeSIsInpjb2FfeHN1YWEhdDk1MjUuTWFpbkxpbmVSZWFkT25seSIsInpjb2FfeHN1YWEhdDk1MjUuQXFpZFJlYWRPbmx5IiwiemNvYV94c3VhYSF0OTUyNS5Bbm5vdGF0aW9uTW9kaWZ5IiwiemNvYV94c3VhYSF0OTUyNS5TdWJMaW5lUmVhZE9ubHkiLCJ6Y29hX3hzdWFhIXQ5NTI1LkFubm90YXRpb25SZWFkT25seSJdLCJjbGllbnRfaWQiOiJzYi16Y29hX3hzdWFhIXQ5NTI1IiwiY2lkIjoic2ItemNvYV94c3VhYSF0OTUyNSIsImF6cCI6InNiLXpjb2FfeHN1YWEhdDk1MjUiLCJncmFudF90eXBlIjoidXJuOmlldGY6cGFyYW1zOm9hdXRoOmdyYW50LXR5cGU6and0LWJlYXJlciIsInVzZXJfaWQiOiI2NGMyMWJlNy0xMDY4LTRkOTctYTQwNi03NDJhOWJjYzc2NmIiLCJvcmlnaW4iOiJjb3JwLWFwcHMiLCJ1c2VyX25hbWUiOiJwb29qYV9sYWtzaG1hbkBhcHBsZS5jb20iLCJlbWFpbCI6InBvb2phX2xha3NobWFuQGFwcGxlLmNvbSIsInJldl9zaWciOiJkMzA1MjkwOCIsImlhdCI6MTY2NDgwMzEyMSwiZXhwIjoxNjY0ODQ2MzIxLCJpc3MiOiJodHRwczovL3NjcGR2LmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiIzNjQzZGUyYi03ZmJiLTQxY2MtYmU4MS04OGRmZTljNzk4ZDIiLCJhdWQiOlsiemNvYV94c3VhYSF0OTUyNSIsIm9wZW5pZCIsInNiLXpjb2FfeHN1YWEhdDk1MjUiXX0.wfxNcY9q6R36Et2qohC7hruJDOq2PfZshwtXpcjDn4Q9Do1N40CsF58OFKK1erIrB_g23UsQz08l6O7eB0dk_ZiaGSxm9RAUYgiUI5GlcfUGMPhC2BdS1xEmUWgVe3zXFQN8w9FzFL8PwRs-Qr9Q8nVwzhGtUF9UR4eKsureFmB_dtfRWzV6y5ld19IsSkNWttG8sqUs6TsVD__8HLZmsyvATDN_2Znq9xk0Z7ULO0vkK3itBa9ZtDEr29jlgzEYQ93I-ItUzd26FjPMzKh5w7fjLlllOdVKaXDaI-LLuJ9K2SUpk6QesTVQk0oFnizXj_o7xBTSvecBvgfGxfERog';
                    let response = await chai.request(app)
                        .put("/lineplan/Upload_SubLine/csv")
                        .auth(nToken, { type: 'bearer' })
                        // .set('Content-Type', 'text/csv')
                        // .set('Content-Length', '650000')
                        .attach('fileName', '/home/user/projects/220914-coa-platform-api-main/coa-lineplan/tests/SubLine.csv', 'SubLine.csv');

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
