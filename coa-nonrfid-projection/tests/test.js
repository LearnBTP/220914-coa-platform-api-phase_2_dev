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

describe("All tests", () => {
    describe("(1) POST /nonrfid-projection/selectAllMassUpdate", () => {
        it("+ should MassUpdate", (done) => {
            chai.request(app)
                .post("/nonrfid-projection/selectAllMassUpdate")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .send({
                    "url": "PROGRAM eq 'D11' and AQID eq '00029-01' and STATION eq 'D11  DOCK E75 LEAK TEST' and CM eq 'HHZZ'",
                    "RFID_SCOPE": "N",
                    "CARRY_OVER": 99
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
    describe("(2) PUT /nonrfid_projection/Upload_NonRFID_Projection/csv", () => {
        it("+ should Upload CSV file", (done) => {
            chai.request(app)
                .put("/nonrfid-projection/Upload_NonRFID_Projection/csv")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'text/csv')
                .set('Content-Length', '650000')
                .attach('fileName', '/home/user/projects/p2d__1/coa-nonrfid-projection/Non-RFID-22.csv', 'Non-RFID-22.csv')
                .end((error, response) => {
                    try {
                        response.should.have.status(400);
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
        });
    });

    describe("(3) PUT /nonrfid_projection/ExcelUpload/excel", () => {
        it("+ should Upload CSV file", (done) => {
            chai.request(app)
                .put("/nonrfid-projection/ExcelUpload/excel")
                .auth(token, { type: 'bearer' })
                .set('Content-Type', 'application/json')
                .set('Content-Length', '650000')
                .attach('fileName', '/home/user/projects/p2d__1/coa-nonrfid-projection/Non-RFID-23.xlsx', 'Non-RFID-23.xlsx')
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


    describe("(4) CM - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=CM&$search=H")
				.set('authorization', 'Bearer some_token')
				// .auth(token2, { type: 'bearer' })
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

	describe("(5) CM - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=CM&$search=PEGA")
				.set('authorization', 'Bearer some_token')
				// .auth(token, { type: 'bearer' })
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
	describe("(6) SITE - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=SITE&$search=KSPH")
				.set('authorization', 'Bearer some_token')
				// .auth(token, { type: 'bearer' })
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

	describe("(7) LINE - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=LINE&$search=H")
				.set('authorization', 'Bearer some_token')
				// .auth(token, { type: 'bearer' })
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

	describe("(8) PROGRAM - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=PROGRAM&$search=D10")
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

	describe("(9) GH_SITE - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=GH_SITE&$search=U")
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

	describe("(10) SCOPE - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=SCOPE&$search=U")
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

	describe("(11) MP_INTENT_QTY - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=MP_INTENT_QTY&$search=U")
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

	describe("(12) AQID - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=AQID&$search=U")
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

	describe("(13) CONSUMABLES - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=CONSUMABLES&$search=U")
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

	describe("(14) PO_TYPE - GET F4 help", () => {
		if (cds.User.default) cds.User.default = cds.User.Privileged // hard core monkey patch
		else cds.User = cds.User.Privileged // hard core monkey patch for older cds releases
		it("+ should return 200 on correct F4help request ", (done) => {
			chai.request(app)
				.get("/nonrfid-projection/F4help?$skip=0&$top=10&$select=PO_TYPE&$search=U")
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
});