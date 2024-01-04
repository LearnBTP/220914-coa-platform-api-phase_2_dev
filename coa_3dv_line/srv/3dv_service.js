'use strict';
const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");

module.exports = cds.service.impl(async (srv) => {
    const
        {
            GetRFIDAnnotation,
            Get3DVHeader,
            GetShapes,
            GetVertices,
        } = srv.entities;

    let headerDetails = {};
    let rfid_a = [];
    let glb_auth;
    function getuuid(request) {
        return (request && request?.headers['x-correlationid'])?request.headers['x-correlationid'] :cds.utils.uuid();
    }

    srv.on("store3DVAnnotationData", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'store3DVMaps' });
        let fileHeader = [];
        let lineData = [];
        let hdb = await cds.connect.to("db");
        let tx = hdb.tx();
        let cm_site = [];
        let asset_a = [];
        try {
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id,"LOG":LOG };
            }
            let msg = request.data.contextData.JSON.Data.building + "," + request.data.contextData.JSON.Data.floor + "," + request.data.contextData.JSON.Data.floor + "," + request.data.contextData.JSON.Data.sapCode
            LOG.info(`COA - Store3DVAnnotation: - ${request.req.params.uuid} - ${msg}`);
            let jsondata = {};
            jsondata.Image_FileId = request.data.contextData.GUID;
            jsondata.Building = request.data.contextData.JSON.Data.building;
            jsondata.Floor = request.data.contextData.JSON.Data.floor;
            cm_site = request.data.contextData.JSON.Data.sapCode.split("-");
            if (cm_site[0]) {
                jsondata.CM = cm_site[0];
            } else {
                jsondata.CM = "";
            }
            if (cm_site[1]) {
                jsondata.Site = cm_site[1];
            } else {
                jsondata.Site = "";
            }
            jsondata.Alderaan_Site = request.data.contextData.JSON.Data.site;
            jsondata.Alderaan_CM = request.data.contextData.JSON.Data.cm;
            jsondata.Scan_Start_Date = request.data.contextData.JSON.Data.startDate;
            jsondata.Scan_End_Date = request.data.contextData.JSON.Data.endDate;
            jsondata.Area = request.data.contextData.JSON.Data.area;
            jsondata.Image_FileName = request.data.contextData.JSON.Data.image;
            jsondata.Origin_X = request.data.contextData.JSON.Data.origin.x;
            jsondata.Origin_Y = request.data.contextData.JSON.Data.origin.y;
            jsondata.Scale_X = request.data.contextData.JSON.Data.scale.x;
            jsondata.Scale_Y = request.data.contextData.JSON.Data.scale.y;
            jsondata.Orientation_X = request.data.contextData.JSON.Data.orientation.x;
            jsondata.Orientation_Y = request.data.contextData.JSON.Data.orientation.y;
            jsondata.Line = request.data.contextData.JSON.Data.line;
            jsondata.ImageWidth = request.data.contextData.ImageWidth;
            jsondata.ImageHeight = request.data.contextData.ImageHeight;
            jsondata.SAP_CM_Site = jsondata.CM + "-" + jsondata.Site;
            fileHeader.push(jsondata);
            request.data.contextData.CSV.Data.forEach(element => {
                let csvData = {};
                csvData.Rfid = element.epc;
                csvData.Asset_ID = element.asset_id;
                csvData.Building = request.data.contextData.JSON.Data.building;
                csvData.Floor = request.data.contextData.JSON.Data.floor;
                csvData.Site = jsondata.Site;
                csvData.CM = jsondata.CM;
                csvData.SAP_CM_Site = jsondata.CM + "-" + jsondata.Site;
                csvData.Scan_Start_Date = request.data.contextData.JSON.Data.startDate;
                csvData.Scan_End_Date = request.data.contextData.JSON.Data.endDate;
                csvData.Rfid_XAxis = element.x_m;
                csvData.Rfid_YAxis = element.y_m;
                csvData.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                csvData.modifiedBy_mail = jwtdetails.email;
                csvData.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                csvData.createdBy_mail = jwtdetails.email;
                if (containsOnlyNumbers(element.asset_id)) {
                    asset_a.push(element.asset_id);
                }
                lineData.push(csvData);
            }
            );

            await process3DVHeaderData(fileHeader, tx, request.req.params.uuid, jwtdetails, request.user.id,LOG);
            await process3DVAnnotationData(fileHeader, lineData, tx, request.req.params.uuid, asset_a, request);
            await tx.commit();
            await trigger_alderaan_update(jsondata, 'DRAFT', request);
            LOG.info(`COA - Store3DVAnnotation: Data Inserted successfully to T_COA_RFID_ANNOTATION & T_COA_FILE_HEADER - ${request.req.params.uuid}`);
        }
        catch (error) {
            await tx.rollback(error);
            LOG.info("COA 3DV - Upload Error" + request.req.params.uuid + JSON.stringify(error));
            request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
        }
    });

    function containsOnlyNumbers(str) {
        return /^\d+$/.test(str);
    }

    async function process3DVAnnotationData(fileHeader, lineData, tx, uuid, asset_a, request) {
        const LOG = request.req.params["LOG"];
        LOG.info("COA - Store3DVAnnotation: Annotation Table update in progress " + uuid);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        await tx
            .run(SELECT.from(GetRFIDAnnotation).where({
                Building: fileHeader[0].Building,
                FLOOR: String(fileHeader[0].Floor),
                SITE: String(fileHeader[0].Site),
                CM: String(fileHeader[0].CM)
            }))
            .then(async (response) => {

                let rfidData = response.filter(e => e.Status === "DRAFT");
                if (rfidData.length > 0) {
                    lineData = await filterRFIDMovedRecords(rfidData, lineData, fileHeader, tx, request, asset_a, jwtdetails);
                    let hdb = await cds.connect.to("db");
                    let tx_del = hdb.tx();
                    await tx_del.run(DELETE.from(GetRFIDAnnotation).where({
                        Building: fileHeader[0].Building,
                        FLOOR: String(fileHeader[0].Floor),
                        SITE: String(fileHeader[0].Site),
                        CM: String(fileHeader[0].CM),
                        STATUS: "DRAFT"
                    }));
                    await tx_del.commit();
                }
                else {
                    rfidData = response.filter(e => e.Status === "PUBLISH");
                    lineData = await filterRFIDMovedRecords(rfidData, lineData, fileHeader, tx, request, asset_a, jwtdetails);
                }
                if (lineData.length > 0) {
                    await tx.run(INSERT.into(GetRFIDAnnotation).entries(lineData));
                } else {
                    request.reject(500, `COA - Store3DVAnnotation: No valid ASSET_ID to insert into RFID Annotation table - ${request.req.params.uuid}`);
                }
                LOG.info(`COA - Store3DVAnnotation: Annotation Table update placed in Queue to update ${uuid}`);
                return tx;
            });
    }

    async function filterRFIDMovedRecords(rfidData, lineData, fileHeader, tx, request, asset_a, jwtdetails) {
        let LOG = request.req.params["LOG"], uuid = request.req.params["uuid"];
        LOG.info("COA - Store3DVAnnotation: Inside Filter RFID moved Records " + uuid);
        rfidData.forEach(data => {
            // Fill shape Guid
            let index = lineData.findIndex(e => e.Rfid === data.Rfid);
            if (index >= 0) {
                let rfid_x = lineData[index].Rfid_XAxis;
                let rfid_y = lineData[index].Rfid_YAxis;
                data.SAP_CM_Site = lineData[index].SAP_CM_Site;
                data.Asset_ID = lineData[index].Asset_ID;
                lineData[index] = data;
                lineData[index].Rfid_XAxis = rfid_x;
                lineData[index].Rfid_YAxis = rfid_y;
                lineData[index].Status = "DRAFT";
                lineData[index].modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                lineData[index].modifiedBy_mail = jwtdetails.email;
            }
        });
        LOG.info("COA - Store3DVAnnotation: Inside Filter RFID moved Records - After updating the RFID X and Y axis for all existing data " + uuid);

        let result = [];
        if (asset_a.length > 0) {
            result = await tx.run(SELECT.from('V_ALDERAAN_DATA').columns('ASSET_ID as ASSET_ID', 'CM_PROGRAM as PROGRAM', 'APPLE_ID as AQID').where({
                ASSET_ID: { in: asset_a }
            }));
        }
        // filter out records where asset id is not present
        lineData = lineData.map((data) => {
            let index = result.findIndex(e => e.ASSET_ID === data.Asset_ID);
            if (index >= 0) {
                data.CARRYOVEROLDPROGRAM = result[index].PROGRAM;
                data.CARRYOVERAQID = result[index].AQID;
                return data;
            }
        }).filter(y => y !== undefined);
        result = [];
        LOG.info("COA - Store3DVAnnotation: Inside Filter RFID moved Records - After validating the RFID's from EQUI Interface table " + uuid);
        await updateVerticesXY(fileHeader, rfidData, lineData, uuid, jwtdetails,LOG);
        return lineData;
    }

    async function updateVerticesXY(fileHeader, rfidData, lineData, uuid, jwtdetails,LOG) {
        LOG.info("COA - Store3DVAnnotation: Inside UpdateVerticesXY " + uuid);
        let vertices = [];
        let dbShapes = await cds
            .run(SELECT.from(GetShapes).where({
                Building: fileHeader[0].Building,
                FLOOR: String(fileHeader[0].Floor),
                SITE: String(fileHeader[0].Site),
                CM: String(fileHeader[0].CM)
            }));
        let index = dbShapes.findIndex(e => e.Status === "DRAFT");
        if (index <= 0) {
            dbShapes = dbShapes.filter(e => e.Status === "PUBLISH");
            dbShapes.forEach(rec => {
                rec.Status = 'DRAFT';
                rec.ConfirmedBy = "";
                rec.ConfirmedRequired = false;
                rec.ConfirmedOn = null;
                rec.ConfirmedBy_Name = "";
                rec.ConfirmedBy_mail = "";
                rec.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                rec.modifiedBy_mail = jwtdetails.email;
            });
            LOG.info("COA - Store3DVAnnotation: Inside UpdateVerticesXY - After changing the status to Draft" + uuid);
        }
        else {
            dbShapes = dbShapes.filter(e => e.Status === "DRAFT");
        }
        let shape = [];
        LOG.info("COA - Store3DVAnnotation: Inside UpdateVerticesXY - Before Pushing the shape guids to shape array " + uuid);
        if (dbShapes.length > 0) {
            dbShapes.forEach(rec => {
                shape.push(rec.Shape_Guid);
            });
            LOG.info("COA - Store3DVAnnotation: Inside UpdateVerticesXY - After Pushing the shape guids to shape array " + uuid);
            let dbVertices = await cds
                .run(SELECT.from(GetVertices).where({
                    Shape_Guid: { in: shape }
                }).orderBy('Shape_Guid', 'Status', 'Sequence_No'));

            if (dbVertices.length > 0) {
                let diffOriginY = "";
                vertices = dbVertices.filter(e => e.Status === "DRAFT");
                if (vertices.length === 0) {
                    vertices = dbVertices.filter(e => e.Status === "PUBLISH");
                }
                let oldOriginPixelX = Math.abs(headerDetails.Origin_X) / headerDetails.Scale_X;
                let oldOriginPixelY = Math.abs(headerDetails.Origin_Y) / headerDetails.Scale_Y;
                let newOriginPixelY = Math.abs(fileHeader[0].Origin_Y) / fileHeader[0].Scale_Y;
                let newOriginPixelX = Math.abs(fileHeader[0].Origin_X) / fileHeader[0].Scale_X;
                let adjustNewOriginPixelY = fileHeader[0].ImageHeight - newOriginPixelY;
                let adjustOldOriginPixelY = headerDetails.ImageHeight - oldOriginPixelY;

                let diffOriginX = Math.abs(newOriginPixelX - oldOriginPixelX);
                if (headerDetails.ImageHeight === Number(fileHeader[0].ImageHeight)) {
                    diffOriginY = 0;
                }
                else {
                    diffOriginY = Math.abs(adjustOldOriginPixelY - adjustNewOriginPixelY);
                }

                let shapeGuidChanged = {}, datbaseVertices = [], finalresult = {};
                LOG.info("COA - Store3DVAnnotation: UpdateVertices - Before changing the Shapes / Vertices data " + uuid);
                finalresult = update_vertices(vertices, dbShapes, diffOriginX, diffOriginY, fileHeader, lineData, rfidData);
                LOG.info("COA - Store3DVAnnotation: UpdateVertices - After changing the Shapes / Vertices data " + uuid);
                shapeGuidChanged = finalresult.shapeGuidChanged;
                datbaseVertices = finalresult.datbaseVertices;
                dbShapes = finalresult.dbShapes;
                let hdb = await cds.connect.to("db");
                if (shapeGuidChanged.shapeGuid.length > 0) {
                    let tx_del = hdb.tx();
                    await tx_del.run(DELETE.from(GetVertices).where({
                        Shape_Guid: { in: shapeGuidChanged.shapeGuid },
                        Status: "DRAFT"
                    }));
                    await tx_del.run(DELETE.from(GetShapes).where({
                        Shape_Guid: { in: shapeGuidChanged.shapeGuid },
                        Status: "DRAFT"
                    }));
                    await tx_del.commit().then(async e => {
                        let tx_insert = hdb.tx();
                        await tx_insert.run(INSERT.into(GetShapes).entries(dbShapes));
                        await tx_insert.run(INSERT.into(GetVertices).entries(datbaseVertices));
                        await tx_insert.commit();
                    });

                }

            }
        }
    }

    function update_vertices(vertices, dbShapes, diffOriginX, diffOriginY, fileHeader, lineData, rfidData) {
        let verticesLength = vertices.length;
        let shapeGuidChanged = { guid: "", shapeGuid: [], changed: false };
        let updateVertices = [], datbaseVertices = [], updatedRfid = [];
        vertices.map((rec, index, vertices_a) => {
            let counter = index + 1;
            let updatedRec = JSON.parse(JSON.stringify(rec));
            updatedRec.Status = "DRAFT";
            shapeGuidChanged.changed = false;
            shapeGuidChanged = checkandcallRFIDTag(rec, index, shapeGuidChanged, verticesLength, vertices_a);
            if (counter > 0 && shapeGuidChanged.changed) {
                const index_H = vertices_a.findIndex(e => e.Shape_Guid === rec.Shape_Guid && e.Sequence_No === 1);
                let shapeIndex = dbShapes.findIndex(e => e.Shape_Guid === rec.Shape_Guid && e.Status === "DRAFT");
                if (dbShapes[shapeIndex].Shape_Type === 'R') {
                    updatedRec.Vertices_X = updatedRec.Vertices_X + vertices_a[index - 1].Vertices_X;
                    updatedRec.Vertices_Y = updatedRec.Vertices_Y + vertices_a[index - 1].Vertices_Y;
                }else if (dbShapes[shapeIndex].Shape_Type !== 'R'){
                    updatedRec.Vertices_X = updatedRec.Vertices_X + vertices_a[index_H ].Vertices_X;
                    updatedRec.Vertices_Y = updatedRec.Vertices_Y + vertices_a[index_H].Vertices_Y;
                }
                updatedRec = calculateVertices(updatedRec, diffOriginX, diffOriginY, fileHeader);
                updatedRec.Vertices_X = updatedRec.Vertices_X - updateVertices[0].Vertices_X;
                updatedRec.Vertices_Y = updatedRec.Vertices_Y - updateVertices[0].Vertices_Y;
                updatedRec.modifiedBy_Name = dbShapes[shapeIndex].modifiedBy_Name;
                updatedRec.modifiedBy_mail = dbShapes[shapeIndex].modifiedBy_mail;
                updateVertices.push(updatedRec);
                updatedRfid = getRFIDs(lineData, updateVertices, fileHeader[0]);
                dbShapes[shapeIndex].ConfirmedRequired = false;
                dbShapes[shapeIndex].ConfirmedBy = "";
                dbShapes[shapeIndex].ConfirmedOn = null;
                dbShapes[shapeIndex].ConfirmedBy_Name = "";
                dbShapes[shapeIndex].ConfirmedBy_mail = "";
                compareRfidShapesGuid(lineData, dbShapes[shapeIndex], updatedRfid, rfidData);
                datbaseVertices.push(...updateVertices);
                updateVertices = [];
            }
            else {
                updatedRec = calculateVertices(updatedRec, diffOriginX, diffOriginY, fileHeader);
                updateVertices.push(updatedRec);
            }
        });
        return { shapeGuidChanged, datbaseVertices, dbShapes };
    }

    function compareRfidShapesGuid(lineData, rec, v2Rfid, rfidData) {
        let v1Rfid = [];
        try {
            // get the existing RFID's from data base for the corresponding shape
            v1Rfid = lineData.filter(e => e.Shape_Guid === rec.Shape_Guid);
            v1Rfid.forEach(v1Rec => {
                // read the new RFID's determined and update the exisitng shape guid as per
                // new RFID's scan
                let index = 0;
                if (v2Rfid.length > 0) {
                    index = v2Rfid.findIndex(e => e.Rfid === v1Rec.Rfid);
                }
                if (index < 0) {
                    v1Rec.Shape_Guid = null;
                    rec.ConfirmedRequired = true;
                }
                else {
                    v1Rec.Shape_Guid = rec.Shape_Guid;
                    v2Rfid.splice(index, 1);
                }
            });
        }
        catch (e) {
            console.log(JSON.stringify(e.message));
        }
        v2Rfid.forEach(v2Rec => {

            let index = lineData.findIndex(e => e.Rfid === v2Rec.Rfid && e.Building === rec.Building && rec.CM === e.CM && rec.Site === e.Site);
            if (index >= 0) {
                lineData[index].Shape_Guid = rec.Shape_Guid;
                rec.ConfirmedRequired = true;
            }
        });


        let dbData = rfidData.filter(e => e.Shape_Guid === rec.Shape_Guid);
        if (dbData.length !== v1Rfid.length) {
            rec.ConfirmedRequired = true;
        }

    }
    function getRFIDs(rfidData, updateVertices, fileHeader) {
        let request = {}, canvasDim = {}, scale = {}, origin = {}, data = {};
        let tempShapeVertices = JSON.parse(JSON.stringify(updateVertices));
        data.Shape_Vertices = tempShapeVertices;
        data.otherShapes = [];
        request = data;
        checkPolygonIntersect(request);

        request.Building = fileHeader.Building;
        request.Site = fileHeader.Site;
        request.CM = fileHeader.CM;
        request.Floor = fileHeader.Floor;
        request.Status = fileHeader.Status;
        canvasDim.width = fileHeader.ImageWidth;
        canvasDim.height = fileHeader.ImageHeight;
        request.canvasDim = canvasDim;
        scale.X = fileHeader.Scale_X;
        scale.Y = fileHeader.Scale_Y;
        request.scale = scale;
        origin.X = fileHeader.Origin_X;
        origin.Y = fileHeader.Origin_Y;
        request.origin = origin;

        let rfidTemp = JSON.parse(JSON.stringify(rfidData));
        return getRFIDTags(rfidTemp, request);

    }

    function calculateVertices(updatedRec, diffOriginX, diffOriginY, fileHeader) {

        //Fileheader[0] is new version scan
        //HeaderDetails is existing in DB

        const oldOriginPixelX = Math.abs(headerDetails.Origin_X) / headerDetails.Scale_X;
        let oldOriginPixelY = Math.abs(headerDetails.Origin_Y) / headerDetails.Scale_Y;

        const newOriginPixelX = Math.abs(fileHeader[0].Origin_X) / fileHeader[0].Scale_X;
        let newOriginPixelY = Math.abs(fileHeader[0].Origin_Y) / fileHeader[0].Scale_Y;
        newOriginPixelY = fileHeader[0].ImageHeight - newOriginPixelY;
        oldOriginPixelY = headerDetails.ImageHeight - oldOriginPixelY;

        //X
        if (oldOriginPixelX > newOriginPixelX) {//big to small
            updatedRec.Vertices_X = updatedRec.Vertices_X - diffOriginX;
        }
        else if (oldOriginPixelX < newOriginPixelX) { //small to big
            updatedRec.Vertices_X = updatedRec.Vertices_X + diffOriginX;
        }
        else { //unchanged
            updatedRec.Vertices_X = Number(updatedRec.Vertices_X);
        }

        //Y
        if (oldOriginPixelY > newOriginPixelY) { //big to small
            updatedRec.Vertices_Y = updatedRec.Vertices_Y - diffOriginY;
        }
        else if (oldOriginPixelY < newOriginPixelY) { //small to big
            updatedRec.Vertices_Y = updatedRec.Vertices_Y + diffOriginY;
        }
        else { //unchanged
            updatedRec.Vertices_Y = Number(updatedRec.Vertices_Y);
        }


        return updatedRec;
    }

    function checkandcallRFIDTag(rec, index, shapeGuidChanged, verticesLength, vertices) {
        try {
            if (index <= verticesLength && vertices[index + 1].Shape_Guid !== rec.Shape_Guid) {
                shapeGuidChanged.changed = true;
            }
            shapeGuidChanged.shapeGuid.push(rec.Shape_Guid);
            shapeGuidChanged.guid = rec.Shape_Guid;

            return shapeGuidChanged;
        }
        catch (e) {
            shapeGuidChanged.shapeGuid.push(rec.Shape_Guid);
            shapeGuidChanged.changed = true;
            shapeGuidChanged.guid = rec.Shape_Guid;
            return shapeGuidChanged;
        }
    }

    async function process3DVHeaderData(Header, tx, uuid, jwtdetails, user_id,LOG) {
        LOG.info("COA - Store3DVAnnotation: Header Table update in progress" + uuid);
        await cds
            .run(SELECT.from(Get3DVHeader).where({
                Building: Header[0].Building,
                FLOOR: String(Header[0].Floor),
                SITE: String(Header[0].Site),
                CM: String(Header[0].CM),
            }))
            .then(async (response) => {
                let draftIndex = response.findIndex(e => e.Status === "DRAFT");

                if (draftIndex >= 0) {
                    headerDetails = response[draftIndex];
                    await tx.run(UPDATE(Get3DVHeader).where({
                        Building: Header[0].Building,
                        FLOOR: String(Header[0].Floor),
                        SITE: String(Header[0].Site),
                        CM: String(Header[0].CM),
                        STATUS: "DRAFT"
                    }).set({
                        Alderaan_Site: Header[0].Alderaan_Site,
                        Alderaan_CM: Header[0].Alderaan_CM,
                        Scan_Start_Date: Header[0].Scan_Start_Date,
                        Scan_End_Date: Header[0].Scan_End_Date,
                        Area: Header[0].Area,
                        Image_FileName: Header[0].Image_FileName,
                        Image_FileId: Header[0].Image_FileId,
                        Origin_X: Header[0].Origin_X,
                        Origin_Y: Header[0].Origin_Y,
                        Scale_X: Header[0].Scale_X,
                        Scale_Y: Header[0].Scale_Y,
                        ImageWidth: Number(Header[0].ImageWidth),
                        ImageHeight: Number(Header[0].ImageHeight),
                        Orientation_X: Header[0].Orientation_X,
                        Orientation_Y: Header[0].Orientation_Y,
                        SAP_CM_Site: Header[0].SAP_CM_Site,
                        modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                        modifiedBy_mail: jwtdetails.email,
                        createdBy : user_id
                    }));
                }
                else {
                    let publishIndex = response.findIndex(e => e.Status === "PUBLISH");
                    if (publishIndex >= 0) {
                        headerDetails = response[publishIndex];
                    }
                    Header.Status = "DRAFT";
                    Header.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                    Header.modifiedBy_mail = jwtdetails.email;
                    Header.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                    Header.createdBy_mail = jwtdetails.email;
                    Header.createdBy      = user_id;
                    await tx.run(INSERT.into(Get3DVHeader).entries(Header));
                }
                LOG.info(`COA - Store3DVAnnotation: Header Table placed in queue for update ${uuid}`);
                return tx;
            });
    }

    srv.on("checkRFIDInsideShape", async (request) => {
        const LOG = request.req.params["LOG"];
        try {
            let msg = request.req.params.uuid + "," + request.data.request.Building + "," + request.data.request.Floor + "," + request.data.request.Site + "," + request.data.request.CM + "," + request.data.request.Status;
            LOG.info(`COA 3DV - checkRFIDInsideShape: Get RFID Tags - ${msg}`);
            let result = [];
            let hdb = await cds.connect.to("db");
            let tx = hdb.tx();
            await updatelockdata(request, hdb);
            let data = {};
            data = request.data.request;
            let intersect = await checkPolygonIntersect(data);
            if (!intersect) {
                await tx
                    .run(
                        SELECT.from(GetRFIDAnnotation).where({
                            Building: request.data.request.Building,
                            FLOOR: String(request.data.request.Floor),
                            SITE: String(request.data.request.Site),
                            CM: String(request.data.request.CM),
                            STATUS: String(request.data.request.Status)
                        })
                    )
                    .then(async (response) => {
                        if (response.length > 0) {
                            let uiData = request.data.request;
                            result = getRFIDTags(response, uiData);
                        }
                        return request.reply(result);
                    })
            }
            else {
                request._.res.send({ errMsg: "This Shape is Overlapping, Please Redraw", Shape_Guid: request.data.request.Shape_Guid });
            }
        }
        catch (error) {
            LOG.info(`COA 3DV - Check RFID Tag ${request.req.params.uuid} - ${JSON.stringify(error)}`);
            request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
        }
    });

    function getRFIDTags(response, request) {
        let inside = false;
        let result = [];
        for (let rfidRec of response) {
            inside = false;
            let xAxis = parseFloat(rfidRec.Rfid_XAxis).toFixed(3);
            let yAxis = parseFloat(rfidRec.Rfid_YAxis).toFixed(3);
            let originX = Math.abs(request.origin.X);
            let originY = Math.abs(request.origin.Y);
            let xPosition = (xAxis / request.scale.X) + (originX / request.scale.X);
            let yPosition = (yAxis / request.scale.Y) + (originY / request.scale.Y);
            yPosition = Math.abs(request.canvasDim.height - yPosition); //Subject to change
            xAxis = (request.canvasDim.width * xPosition) / request.canvasDim.width;
            yAxis = (request.canvasDim.height * yPosition) / request.canvasDim.height;
            inside = checkRFIDIntersect(request.Shape_Vertices, inside, xAxis, yAxis);
            if (inside) {
                rfidRec.Shape_Guid = request.Shape_Guid;
                rfidRec.modifiedAt = new Date().toISOString();
                result.push(rfidRec);
            }
        }
        return result;

    }
    function checkRFIDIntersect(data, inside, x, y) {

        for (let m = 0, j = data.length - 1; m < data.length; j = m++) {
            const xi = Number(data[m]["Vertices_X"]);
            const yi = Number(data[m]["Vertices_Y"]);
            const xj = Number(data[j]["Vertices_X"]);
            const yj = Number(data[j]["Vertices_Y"]);
            let intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }

    async function checkPolygonIntersect(data) {

        const polygonsIntersect = require('polygons-intersect');
        let rec2ndPoint, rec4thPoint;
        if (data.Shape_Vertices.length === 2) {

            data.Shape_Vertices[1].Vertices_X = data.Shape_Vertices[0].Vertices_X + data.Shape_Vertices[1].Vertices_X;
            data.Shape_Vertices[1].Vertices_Y = data.Shape_Vertices[0].Vertices_Y + data.Shape_Vertices[1].Vertices_Y;

            rec2ndPoint = {
                Vertices_X: data.Shape_Vertices[0].Vertices_X,
                Vertices_Y: data.Shape_Vertices[1].Vertices_Y
            }
            rec4thPoint = {
                Vertices_X: data.Shape_Vertices[1].Vertices_X,
                Vertices_Y: data.Shape_Vertices[0].Vertices_Y
            }

            data.Shape_Vertices.splice(1, 0, rec2ndPoint);
            data.Shape_Vertices.splice(3, 0, rec4thPoint);

        }


        const newShape = data.Shape_Vertices.map(rec => {
            return {
                x: rec.Vertices_X,
                y: rec.Vertices_Y
            }
        });

        if (data.otherShapes.length === 0) {
            return false;
        }

        const otherShapes = data.otherShapes;
        let isIntersecting = false;


        for (let rec of otherShapes) {

            let shapeRec = rec.data;

            //if length 2 it is an rectangle... converting to 4 vertices
            if (shapeRec.length === 2) {

                shapeRec[1].Vertices_X = shapeRec[0].Vertices_X + shapeRec[1].Vertices_X;
                shapeRec[1].Vertices_Y = shapeRec[0].Vertices_Y + shapeRec[1].Vertices_Y;

                rec2ndPoint = {
                    Vertices_X: shapeRec[0].Vertices_X,
                    Vertices_Y: shapeRec[1].Vertices_Y
                }
                rec4thPoint = {
                    Vertices_X: shapeRec[1].Vertices_X,
                    Vertices_Y: shapeRec[0].Vertices_Y
                }

                shapeRec.splice(1, 0, rec2ndPoint);
                shapeRec.splice(3, 0, rec4thPoint);

            }

            let otherShapeRec = shapeRec.map(shRec => {
                return {
                    x: shRec.Vertices_X,
                    y: shRec.Vertices_Y
                }
            });

            let checkIntersection = polygonsIntersect(newShape, otherShapeRec);

            if (checkIntersection.length > 0) {
                isIntersecting = true;
                break;
            }
        }
        return isIntersecting;
    }

    srv.on("publishAnnotation", async (request) => {
        const LOG = request.req.params["LOG"];
        let hdb = await cds.connect.to("db");
        let tx = hdb.tx();
        let result = [];
        let selectedRecordsToMassUpdate = [];
        try {
            let msg = request.req.params.uuid + request.data.request.header.Building + "," + request.data.request.header.Floor + "," + request.data.request.header.Site + "," + request.data.request.header.CM + "," + request.data.request.header.Status;
            LOG.info(`COA 3DV - Publish Annotation 3 steps In progress - ${request.req.params.uuid} - `+ msg);
            await processHeaderData(request.data.request.header, tx, "PUBLISH", msg, request);
            let fin3DVRFID = await newProcessAnnotationData(request.data.request.rfid, request.data.request.header, tx, request.data.request.shapes.del_shapes, "PUBLISH", msg, request);
            let old_publish_data = await getRFIDAnnotationData(request.data.request.header, 'PUBLISH');
            await processShapeData(tx, "PUBLISH", msg, request,fin3DVRFID);
            await tx.commit();
            await trigger_alderaan_update(request.data.request.header, 'PUBLISH', request);
            selectedRecordsToMassUpdate = await get_rfid_tt_recs(fin3DVRFID, old_publish_data); // RFID transfer Requirement
            update_rfid_tt(selectedRecordsToMassUpdate, request); // RFID transfer Requirement
            const index = rfid_a.findIndex(e1 => e1.uuid === request.req.params.uuid);
            if (index >= 0) {
                update_changelog("T_COA_RFID_ANNOTATION", rfid_a[index].new, rfid_a[index].old, "UPDATE", request);
                rfid_a.splice(index, 1);
            }
            await releaselock(request, hdb, '');
            LOG.info(`COA: Publish Annotation - Successfully updated - ${request.req.params.uuid} - ` + msg);

            result = await cds.run(SELECT.from("V_AQID_ANNOTATION").where({
                Floor: request.data.request.header.Floor,
                Site: request.data.request.header.Site,
                CM: request.data.request.header.CM,
                Building: request.data.request.header.Building,
                Status: "PUBLISH"
            }).orderBy('modifiedAt desc', 'LineId desc'));

            return request.reply(result);
        }
        catch (error) {
            await tx.rollback(error);
            LOG.info(`COA 3DV - Publish Annotation Error - ${request.req.params.uuid} - ` + JSON.stringify(error));
            request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);

        }
    });

    async function get_rfid_tt_recs(newData, oldData) {
        let selectedRecordsToMassUpdate = [];
        if(oldData.length > 0){
            let map = {};
            let asset_id = [];
            let keyArray = ["Asset_ID"];
            fillMultimap(map, oldData, keyArray);
            newData.forEach(e=> {
                let key_array = ["Asset_ID"];
                let tempGetKeyArray = getTempKeys(e, key_array);
                let map_found = getMultiLevelValue(map, tempGetKeyArray);
                if (map_found !== undefined && ( map_found.CarryOverAqid !== e.CarryOverAqid || map_found.CarryOverOldProgram !== e.CarryOverOldProgram) ){
                    asset_id.push(e.Asset_ID);
                }
            });
            if(asset_id.length > 0){
                selectedRecordsToMassUpdate = await cds.run(SELECT.from("V_RFIDDETAILS").where({
                    alderan: {in: asset_id},
                    Approval_Status : 'Approved'
                }));
            }
        }
        return selectedRecordsToMassUpdate;
    }

    function update_rfid_tt(selectedRecordsToMassUpdate, request) {
        const LOG = request.req.params["LOG"];
        if(selectedRecordsToMassUpdate.length > 0){
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => {
                return (
                    {
                        RFID_Timestamp: el.TIMESTAMP,
                        Asset_Id: el.ALDERAN,
                        RFID: el.RFID,
                        AQID: el.AQID,
                        Raw_AQID: el.RAW_AQID,
                        Mapped_AQID: el.MAPPED_AQID,
                        Short_Name: el.SHORT_NAME,
                        Serial_Number: el.SERNR,
                        MFR: el.MFR,
                        EQ_Name: el.EQUIPMENT_NAME,
                        Asset_Own: el.ASSETOWN,
                        CM: el.CM,
                        Site: el.SITE,
                        CM_Program: el.ZALDR_CMPROGRAM,
                        Asset_Status: el.STATUS,
                        Timestamp_3DV: el.CREATEDAT,
                        Line_ID: el.LINEID,
                        Override_lineId: el.OVERRIDE_LINEID,
                        Line_Type: el.LINETYPE,
                        UPH: el.UPH,
                        Version: el.VERSION_ID,
                        Transfer_Flag: el.TRANSFER_FLAG,
                        To_CM: el.TO_CM,
                        To_Site: el.TO_SITE,
                        To_Program: el.TO_PROGRAM,
                        To_Business_Grp: el.TP_BUSINESS_GRP,
                        Comments: el.COMMENTS,
                        CarryOverAqid: el.CARRYOVERAQID,
                        CarryOverEqName: el.CARRYOVEREQNAME,
                        Approval_Status: "Pending",
                        Submit_Date: el.SUBMIT_DTE,
                        Submit_By: el.SUBMIT_BY,
                        Review_Date: el.REVIEW_DATE,
                        Reviewed_By: el.REVIEWED_BY,
                        CarryOverOldProgram: el.CARRYOVEROLDPROGRAM,
                        To_GHSite: el.TO_GHSITE,
                        Reset_Flag:'Reset-3DV'
                    }
                )
            });
            try{
                const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
                if(jwtdetails.origin === 'corp-apps'){
                    const sDestinationName = "COA_APIM";
                    const core = require("@sap-cloud-sdk/core");
                    const xsenv = require("@sap/xsenv");
                    xsenv.loadEnv();
                    let url = `/v1/coa/rfid-services/rfid-tt/rfid_tt_action`
                    let requestData = { "RfidData": selectedRecordsToMassUpdate };
                    let jwt = request.headers.authorization.split(' ')[1];
                    if (jwt[jwt.length-1]===`'`)jwt=jwt.slice(0,jwt.length-1)
                    core.executeHttpRequest( {destinationName : sDestinationName, jwt : jwt},
                        {
                            method: "POST",
                            url: url,
                            headers: { "Content-Type" : "application/json",                                        
                                "appid" : `${process.env.appid}`,
                                "authorization": request.headers.authorization,
                                "Authorization": request.headers.authorization
                                    },
                        data: requestData
                    }
                    ); 
                }else{
                    const sDestinationName = "COA_APIM_EXT"; //added by Nikhil to make srv contact rfid-tt-ext-srv
                    const core = require("@sap-cloud-sdk/core");
                    const xsenv = require("@sap/xsenv");
                    xsenv.loadEnv();
                    let url = `/v1/ext/coa/rfid-services/rfid-tt/rfid_tt_action` //added by Nikhil to make srv contact rfid-tt-ext-srv
                    let requestData = { "RfidData": selectedRecordsToMassUpdate };
                    let jwt = request.headers.authorization.split(' ')[1];
                    if (jwt[jwt.length-1]===`'`)jwt=jwt.slice(0,jwt.length-1)
                    core.executeHttpRequest( {destinationName : sDestinationName, jwt : jwt},
                        {
                            method: "POST",
                            url: url,
                            headers: { "Content-Type" : "application/json",                                        
                                "appid" : `${process.env.appid}`,
                                "authorization": request.headers.authorization,
                                "Authorization": request.headers.authorization
                                    },
                        data: requestData
                    }
                    );
                 } 
            }catch (erro) {
                LOG.info(`COA 3DV - Publish Annotation Error while updating RFID TT - ${request.req.params.uuid} - ` + JSON.stringify(erro));
                request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
            }  
        }
    }

    srv.on("createDraftAnnotation", async (request) => {
        const LOG = request.req.params["LOG"];
        let hdb = await cds.connect.to("db");
        let tx = hdb.tx();
        try {
            let msg = request.req.params.uuid + request.data.request.header.Building + "," + request.data.request.header.Floor + "," + request.data.request.header.Site + "," + request.data.request.header.CM + "," + request.data.request.header.Status;
            LOG.info(`COA 3DV - Create Draft Annotation 3 steps In progress - ${request.req.params.uuid} - ${msg}`);
            await processHeaderData(request.data.request.header, tx, "DRAFT", msg, request);
            let fin3DVRFID = await newProcessAnnotationData(request.data.request.rfid, request.data.request.header, tx, request.data.request.shapes.del_shapes, "DRAFT", msg, request);
            await processShapeData( tx, "DRAFT", msg, request, fin3DVRFID);
            await tx.commit();
            await releaselock(request, hdb, 'X');
            await trigger_alderaan_update(request.data.request.header, 'DRAFT', request);
            const index = rfid_a.findIndex(e1 => e1.uuid === request.req.params.uuid);
            if (index >= 0) {
                update_changelog("T_COA_RFID_ANNOTATION", rfid_a[index].new, rfid_a[index].old, "UPDATE", request);
                rfid_a.splice(index, 1);
            }
            LOG.info(`COA: Publish Annotation - Successfully updated  - ${request.req.params.uuid} - ${msg}`);


            let result = await cds.run(SELECT.from("V_AQID_ANNOTATION").where({
                Floor: request.data.request.header.Floor,
                Site: request.data.request.header.Site,
                CM: request.data.request.header.CM,
                Building: request.data.request.header.Building,
                Status: "DRAFT"
            }).orderBy('modifiedAt desc', 'LineId desc'));
            return request.reply(result);
        }
        catch (error) {
            await tx.rollback(error);
            LOG.info(`COA 3DV - Create Draft Annotation Error  - ${request.req.params.uuid} - ${JSON.stringify(error)}`);
            request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
        }
    });

    // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
    // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
    srv.after("GET", ["HeaderAnnotation", "AnnotationDetails", "GetRFIDAnnotation", "GetShapes", "Get3DVHeader"], async (data, request) => {
        const LOG = cds.log(getuuid(request), { label: 'GET' }); 
        const allowedattributes = getAllowedAttributes(request.headers.authorization, request.req.params.uuid,LOG );
        if (allowedattributes.length > 0) {
            if (Array.isArray(request.results)) {

                request = validateAuthAttributes(request, allowedattributes);

            } else {
                const index2 = allowedattributes.findIndex(e => e === request.results.SAP_CM_Site);
                if (index2 < 0) {
                    request.results = {};
                }
            }
        }
    });
    function validateAuthAttributes(request, allowedattributes) {
        let results = [];
        for (let element of request.results) {
            element.SAP_CM_Site = element.CM + "-" + element.Site;
            const authRec = allowedattributes.find(e => (e.CMSite === element.SAP_CM_Site || e.CMSite === "$unrestricted-$unrestricted"));
            if (authRec !== undefined) {
                if (request.entity.includes('HeaderAnnotation')) {
                    element.AllowModify = authRec.AllowModify;
                }
                results.push(element);
            }
        }
        request.results = results;
        return request;
    }
    function GeneralValidations(request, error_msg) {
        if (error_msg) {
            request.reject(500, `${error_msg} - ${request.req.params.uuid}`);
        }

        if (request.data.request.rfid.length > 5000) {
            request.reject(500, `Mass Update is allowed only for 5K records - ${request.req.params.uuid}`);
        }
    }
    srv.before(["createDraftAnnotation", "saveAsAnnotation", "publishAnnotation"], async (request) => {
        let error_flag = "";
        const uuid = getuuid(request);
        const LOG = cds.log(getuuid(request), { label: 'BeforeEvt' });
        try {

            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id,"LOG":LOG };
            }

            let msg = request.req.params.uuid + request.data.request.header.Building + "," + request.data.request.header.Floor + "," + request.data.request.header.Site + "," + request.data.request.header.CM + "," + request.data.request.header.Status;
            let error_msg = await check_if_locked(request);
            GeneralValidations(request, error_msg);

            let headerData = {
                "CM": request.data.request.header.CM,
                "Site": request.data.request.header.Site
            }

            LOG.info(`COA 3DV Before Handler - Authorization check  In progress - ${request.req.params.uuid} - ${msg}`);
            let authFailed = checkAuthorization(request.headers.authorization, headerData, request.req.params.uuid,LOG);
            if (!authFailed) {
                request.reject(401, `User is missing Authorization. They are not assigned any CM/Site ${request.req.params.uuid} ${msg}`);
            }
            let data_a = {};
            data_a.program = [];
            data_a.aqid = [];
            data_a.Line = [];
            data_a.Uph = [];
            let output = [];
            data_a.Line_Priority = [];
            data_a.Line_Priority_comb = [];
            data_a.asset_id = [];
            let Status = request.data.request.header.Required_Version;
            let items = await getRFIDAnnotationData(request.data.request.header, Status);

            items.forEach((data) => {
                let row;
                const index = request.data.request.rfid.findIndex(e => e.Rfid === data.Rfid);
                if (index >= 0) {
                    row = request.data.request.rfid[index];
                } else {
                    row = data;
                }
                data_a.program = unique_rec(data_a.program, row.CarryOverOldProgram);
                data_a.aqid = unique_rec(data_a.aqid, row.CarryOverAqid);
                data_a.Line = unique_rec(data_a.Line, row.LineType);
                data_a.Uph = unique_rec(data_a.Uph, row.Uph);
                data_a.Line_Priority = unique_rec(data_a.Line_Priority, row.Line_Priority);
                data_a.Line_Priority_comb = append_if_unique(data_a.Line_Priority_comb, row);
                data_a.asset_id = unique_rec(data_a.asset_id, data.Asset_ID);
            });
            let db = await dbDataFetch(data_a, request.req.params.uuid, request.data.request.header,LOG);
            LOG.info(`COA 3DV Before Handler - Validation check  In progress - ${request.req.params.uuid} Key Fields ${msg}`);
            items.forEach((data) => {
                let record;
                const index = request.data.request.rfid.findIndex(e => e.Rfid === data.Rfid);
                if (index >= 0) {
                    record = validateRecord(request.data.request.rfid[index], db, request, data_a.Line_Priority_comb, data.Asset_ID);
                } else {
                    record = validateRecord(data, db, request, data_a.Line_Priority_comb,data.Asset_ID);
                }
                if (record.msg) {
                    error_flag = "X";
                    output.push(record.result);
                }
            });
            if (error_flag === "X") {
                request.reject(400, JSON.stringify(output));
            }
            return request.reply(output);
        }
        catch (error) {
            if (error_flag === "") {
                LOG.info("COA 3DV  Validation Error: " + request.req.params.uuid + "-" + JSON.stringify(error));
                request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
            }
        }
    });

    function append_if_unique(Line_Priority_comb, row) {
        const index = Line_Priority_comb.findIndex(e => e.LineType === row.LineType && e.CarryOverOldProgram === row.CarryOverOldProgram && e.LineId === row.LineId );
        if (index < 0) {
            let record = {};
            record.LineType = row.LineType;
            record.CarryOverOldProgram = row.CarryOverOldProgram;
            record.LineId = row.LineId;
            record.Line_Priority = row.Line_Priority;
            Line_Priority_comb.push(record);
        }
        return Line_Priority_comb;
    }

    function unique_rec(final_a, data) {
        if( !(final_a.includes(data)) ){
            final_a.push(data);
        }
        return final_a;
    }

    function validateRecord(data, db, request, Line_Priority_comb,Asset_ID) {
        let data1 = {}, responseData = {};
        let msg;

        responseData.Rfid = data.Rfid;
        responseData.Shape_Guid = data.Shape_Guid;

        if(data.Line_Priority && !containsOnlyNumbers(data.Line_Priority)){
            msg = msg ? `${msg}, Invalid Line Prioriry` : `Invalid Line Prioriry`;
        }

        if (request.event === "publishAnnotation" && data.Shape_Guid) {
            const index = db.Asset_ID.findIndex(e=> e.Asset_ID === Asset_ID);
            if(index >= 0){
                msg = MandatoryValidation(data.LineId, data.LineType, data.Uph, msg);
                msg = Linetype_Uph_Validation(db.line_type_uph, data.LineType, data.Uph, msg);
                let result_tmp = validate_aqid(data.CarryOverAqid, db.aqid_result, msg);
                msg = result_tmp.msg;
                responseData.CarryOverEqName = result_tmp.CarryOverEqName;
                msg = validate_program(data.CarryOverOldProgram, db.Program_result, msg);
                if (data.LineType !== 'Warehouse') {
                    msg = Projection_table_validation(db, data, msg); // Projection Validation
                    msg = validate_line_priority(db, data, msg, Line_Priority_comb); // Line Priority validation
                }
            }
            else if (typeof request.data.request.header.skip === "undefined" || !request.data.request.header.skip){
                msg = `Asset is missing in the Alderaan`;
            }
        }

        if (msg) {
            responseData.ErrorMsg = msg;
        } else {
            responseData.ErrorMsg = null;
        }
        data1.result = responseData;
        data1.msg = msg;
        return data1;
    }

    function validate_line_priority(db, data, msg, Line_Priority_comb) {
        if (data.Line_Priority) {
                let keyArray = ["LineType","CarryOverOldProgram","LineId"]
                let tempGetKeyArray = getTempKeys(data, keyArray);
                let map_found = getMultiLevelValue(db.map_lp, tempGetKeyArray);
                if (map_found !== undefined && map_found.LINE_PRIORITY !== data.Line_Priority && map_found.BUILDING !== data.Building && map_found.FLOOR !== data.Floor) {
                    msg = msg ? `${msg}, This combination of GH Site, Line Type, CO Program and Line ID has been assigned to priority ${map_found.LINE_PRIORITY } in different map` : `This combination of GH Site, Line Type, CO Program and Line ID has been assigned to priority ${map_found.LINE_PRIORITY } in different map`;
                }else{
                msg = lp_check_in_same_map(data, msg, Line_Priority_comb)
                }
        }
        return msg;
    }

    function lp_check_in_same_map(data, msg, Line_Priority_comb) {
        const index = Line_Priority_comb.findIndex(e => e.LineType === data.LineType && e.CarryOverOldProgram === data.CarryOverOldProgram && e.LineId === data.LineId );
        if (index >= 0 && Line_Priority_comb[index].Line_Priority !== data.Line_Priority) {
            msg = msg ? `${msg}, This combination of GH Site, Line Type, CO Program and Line ID has been assigned to priority ${Line_Priority_comb[index].Line_Priority } in same map` : `This combination of GH Site, Line Type, CO Program and Line ID has been assigned to priority ${Line_Priority_comb[index].Line_Priority } in same map`;
        }
        return msg;
    }

    function Projection_table_validation(db, data, msg) {
        let tempGetKeyArray = [];
        let keyArray;
        if (data.CarryOverAqid && data.CarryOverOldProgram) {
            keyArray = ["CarryOverAqid", "CarryOverOldProgram"];
            tempGetKeyArray = getTempKeys(data, keyArray)
            let map5_found = getMultiLevelValue(db.map5, tempGetKeyArray);
            if (map5_found === undefined) {
                msg = projectionSubValidation(msg, data, db, tempGetKeyArray);
            }else{
                msg = msg ? `${msg}, RFID scope is 'N'/ blank in Projection table` : `RFID scope is 'N'/ blank in Projection table`;  
            }
        }
        return msg;
    }

    function projectionSubValidation(msg, data, db, tempGetKeyArray) {
        let map1_found = getMultiLevelValue(db.map1, tempGetKeyArray);
        if (map1_found === undefined) {
            msg = msg ? `${msg}, CO AQID, CO Program don’t match in Projection` : `CO AQID, CO Program don’t match in Projection`;
        } else {
            if (data.LineType && data.CarryOverOldProgram && ( data.Uph || data.Uph === 0)) {
                let keyArray = ["CarryOverOldProgram", "LineType", "Uph"];
                msg = projectionSubValidation1(msg, data, db, keyArray);

            }
        }
        return msg;
    }

    function projectionSubValidation1(msg, data, db, keyArray) {
        let tempGetKeyArray = getTempKeys(data, keyArray);
        let map2_found = getMultiLevelValue(db.map2, tempGetKeyArray);
        if (map2_found === undefined) {
            msg = msg ? `${msg}, CO Program + Line Type + UPH don’t match in Projection` : `CO Program + Line Type + UPH don’t match in Projection`;
        } else {
            if (data.LineType && data.CarryOverAqid) {
                keyArray = ["CarryOverAqid", "LineType"];
                tempGetKeyArray = getTempKeys(data, keyArray)
                let map3_found = getMultiLevelValue(db.map3, tempGetKeyArray);
                if (map3_found === undefined) {
                    msg = msg ? `${msg}, CO AQID + Line Type, don’t match in Projection` : `CO AQID + Line Type, don’t match in Projection`;
                }else {
                    msg = projectionSubValidation2(data, db, msg);
                }
            }
        }
        return msg;
    }

    function projectionSubValidation2(data, db, msg) {
        if (data.CarryOverAqid) {
            let keyArray = ["CarryOverAqid"];
            let tempGetKeyArray = getTempKeys(data, keyArray)
            let map4_found = getMultiLevelValue(db.map4, tempGetKeyArray);
            if (map4_found === undefined) {
                msg = msg ? `${msg}, CO AQID not found in Projection` : `CO AQID not found in Projection`;
            }
        }
        return msg;
    }

    function getMultiLevelValue(map, arr) {
        let i = 0;
        let tillPrev = map;
        for (; i < arr.length; i++) {
            if (tillPrev[arr[i]] === undefined) {
                return tillPrev[arr[i]]
            }
            tillPrev = tillPrev[arr[i]]
        }
        return tillPrev;
    }

    function getTempKeys(currRequest, keyArray) {
        let retArr = [];
        let i = 0;
        for (; i < keyArray.length; i++) {
            retArr.push(currRequest[keyArray[i]])
        }
        return retArr;
    }


    async function dbDataFetch(data_a, uuid, header,LOG) {
        LOG.info(`COA 3DV Inside dbDataFetch - ${uuid}`);
        let db = {};
        db.map1 = {};
        db.map2 = {};
        db.map3 = {};
        db.map4 = {};
        db.map5 = {};
        db.map_lp = {};
        db.taken_lp = '';
        if (data_a.aqid.length > 0) {
            db.aqid_result = await cds.run(SELECT.from("COM_APPLE_COA_T_COA_AQID_MAIN").columns(
                'Aqid as Aqid', 'Equipment_Name as Equipment_Name'
            ).where({
                Aqid: { in: data_a.aqid }
            }));
        }
        if (data_a.program.length > 0) {
            db.Program_result = await cds.run(SELECT.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns(
                'Program as Program'
            ).where({
                Program: { in: data_a.program }
            }));
        }
        if (data_a.Line.length > 0 && data_a.Uph.length > 0) {
            db.line_type_uph = await cds.run(SELECT.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").columns(
                'Line as Line', 'Uph as Uph'
            ).where({
                Line: { in: data_a.Line },
                Uph: { in: data_a.Uph }
            }));
        }

        if (data_a.Line_Priority.length > 0) {
            db.Line_Priority = await cds.run(`SELECT distinct LineType, CarryOverOldProgram, Line_Priority, LineId, Building, Floor
                    FROM COM_APPLE_COA_T_COA_RFID_ANNOTATION AS T_COA_RFID_ANNOTATION
                    WHERE SITE = '${header.Site}' and
                    CM = '${header.CM}' and
                    STATUS = 'PUBLISH'  and 
                    LINE_PRIORITY is not null`);       
            if (db.Line_Priority.length > 0) {
                let keyArray_lp = ["LINETYPE","CARRYOVEROLDPROGRAM","LINEID"];
                fillMultimap(db.map_lp, db.Line_Priority, keyArray_lp);
            }
        }

        if (data_a.asset_id.length > 0) {
            db.Asset_ID = await cds.run(SELECT.from('V_ALDERAAN_DATA').columns('ASSET_ID as Asset_ID').where({
                ASSET_ID: { in: data_a.asset_id }
            }));
        }

        db = await get_projection_data(data_a.aqid, data_a.program, data_a.Line, data_a.Uph, header, db);
        db = fill_projection(db);

        return db;
    }

    function fill_projection(db) {
        let keyArray;
        if (db.projection1.length > 0) {
            keyArray = ["CARRYOVERAQID", "CARRYOVEROLDPROGRAM"];
            fillMultimap(db.map1, db.projection1, keyArray);
            keyArray = ["CARRYOVEROLDPROGRAM", "LINETYPE", "UPH"];
            fillMultimap(db.map2, db.projection1, keyArray);
            keyArray = ["CARRYOVERAQID", "LINETYPE"];
            fillMultimap(db.map3, db.projection1, keyArray);
            keyArray = ["CARRYOVERAQID"];
            fillMultimap(db.map4, db.projection1, keyArray);
        }
        if (db.projection.length > 0) {
            keyArray = ["CARRYOVERAQID", "CARRYOVEROLDPROGRAM"];
            fillMultimap(db.map5, db.projection, keyArray);
        }
        return db
    }

    function prepareArray4where(where, where_scope,array, field, uph) {
        let str = '';
        if(uph){
            for (let rec of array) {
                if (str === '') {
                    str = `${rec}`;
                } else {
                    str = str + ',' + `${rec}`;
                }
            }
        }else{
            for (let rec of array) {
                if (str === '') {
                    str = `'${rec}'`;
                } else {
                    str = str + ',' + `'${rec}'`;
                }
            }
        }
        return getfinalwhere(where, where_scope,field, str);
    }

    function getfinalwhere(where, where_scope,field, str){
        if (where === '') {
            where = `${field} in ( ${str} )`;
        } else {
            where = `${where} or ${field} in ( ${str} )`;
        }
        if (where_scope === '') {
            where_scope = `${field} in ( ${str} )`;
        } else {
            where_scope = `${where_scope} and ${field} in ( ${str} )`;
        }
        return {where,where_scope};
    }

    async function get_projection_data(aqid, program, Line, Uph, header, db) {
        let where = '';
        let where_scope = '';
        db.projection1 = [];
        db.projection = [];
        if (aqid.length > 0) {
            let outcome = prepareArray4where(where, where_scope, aqid, 'Aqid','');
            where =outcome.where;
            where_scope = outcome.where_scope;

        }
        if (program.length > 0 ) {
            let outcome1 = prepareArray4where(where, where_scope, program, 'Program','');
            where =outcome1.where;
            where_scope = outcome1.where_scope;
        }
        if(where_scope){
            where_scope = `( ${where_scope} ) and RFID_Scope in ( 'N', '', null ) and CM = '${header.CM}' and Site = '${header.Site}'`;
            db.projection = await cds.run(`SELECT distinct Aqid as CARRYOVERAQID, 
                                                   Program as  CARRYOVEROLDPROGRAM FROM V_NONRFID_PROJECTION where
                    ${where_scope}`
            );
        }
        if (Line.length > 0 ) {
            let outcome2 = prepareArray4where(where,'', Line, 'Line','');
            where =outcome2.where;
        }
        if (Uph.length > 0 ) {
            let outcome3 = prepareArray4where(where,'', Uph, 'Uph','X');
            where =outcome3.where;
        } 
        if(where){
            where = `( ${where} ) and CM = '${header.CM}' and Site = '${header.Site}'`;
            db.projection1 = await cds.run(`SELECT distinct Aqid as CARRYOVERAQID, 
                                                    Program as  CARRYOVEROLDPROGRAM,
                                                    Line as LINETYPE,
                                                    Uph as UPH FROM V_NONRFID_PROJECTION where
                    ${where}`
            );
        }
        return db;
    }

    function fillMultimap(map, Result_Array, keyArray) {
        let index = 0;
        for (; index < Result_Array.length; index++) {
            let tempKeyArr = [];
            let i = 0;
            for (; i < keyArray.length; i++) {
                tempKeyArr.push(Result_Array[index][keyArray[i]])
            }
            fillMultilevel(map, tempKeyArr, Result_Array[index]);
        }
    }

    function fillMultilevel(map, arr, val) {
        let i = 0;
        let tillPrev = map;
        for (; i < arr.length; i++) {
            if (i !== arr.length - 1) {
                if (tillPrev[arr[i]] === undefined) {
                    tillPrev[arr[i]] = {};
                }
                tillPrev = tillPrev[arr[i]];
            }
            else {
                tillPrev[arr[i]] = val;
            }
        }
    }


    function checkAuthorization(authData, data, uuid,LOG) {
        LOG.info(`COA 3DV Inside Check Authorization - ${uuid}`);

        let allowedattributes = getAllowedAttributes(authData, uuid,LOG);
        if (allowedattributes.length > 0) {
            let idx = allowedattributes.findIndex(el => (el.CMSite === `${data.CM}-${data.Site}` || el.CMSite === "$unrestricted-$unrestricted") && el.AllowModify === true);
            return (idx >= 0);
        } else {
            return false;
        }

    }


    // Club CM & Site values to an array for auth check
    function get_cmsite(allowedattributes) {

        //To keep the flow ongoing
        const modAttributes = JSON.parse(JSON.stringify(allowedattributes));
        allowedattributes = {};
        allowedattributes['CM'] = modAttributes.map(e => { return (e.CMSite.split('-'))[0] });
        allowedattributes['Site'] = modAttributes.map(e => { return (e.CMSite.split('-'))[1] });

        let allowed_cmsite = [];
        const index1 = allowedattributes.CM.findIndex(e1 => e1 === "$unrestricted");
        if (index1 < 0) {
            const index2 = allowedattributes.Site.findIndex(e1 => e1 === "$unrestricted");
            if (index2 < 0) {
                for (let index = 0; index < allowedattributes.CM.length && index < allowedattributes.Site.length; index++) {
                    allowed_cmsite.push(`${allowedattributes.CM[index]}-${allowedattributes.Site[index]}`);
                }
            }
        }


        return [allowedattributes, allowed_cmsite];
    }

    srv.on("saveAsAnnotation", async (request) => {
        const LOG = request.req.params["LOG"];
        let hdb = await cds.connect.to("db");
        let TX = hdb.tx();
        try {
            let msg = request.req.params.uuid + request.data.request.header.Building + "," + request.data.request.header.Floor + "," + request.data.request.header.Site + "," + request.data.request.header.CM + "," + request.data.request.header.Status;
            LOG.info(`COA 3DV - Save As Annotation in progress - ${request.req.params.uuid} - ${msg}`);
            let q = await createQueries(request, request.req.params.uuid);
            await TX.run(q);
            await TX.commit();
            await trigger_alderaan_update(request.data.request.header, 'DRAFT', request);
            const index = rfid_a.findIndex(e1 => e1.uuid === request.req.params.uuid);
            if (index >= 0) {
                update_changelog("T_COA_RFID_ANNOTATION", rfid_a[index].new, rfid_a[index].old, "UPDATE", request);
                rfid_a.splice(index, 1);
            }

            let result = cds.run(SELECT.from("V_AQID_ANNOTATION").where({
                Floor: request.data.request.header.Floor,
                Site: request.data.request.header.Site,
                CM: request.data.request.header.CM,
                Building: request.data.request.header.Building,
                Status: "DRAFT"
            }).orderBy('modifiedAt desc', 'LineId desc'));
            return request.reply(result);
        }
        catch (error) {
            await TX.rollback(error);
            LOG.info(`COA 3DV Save As Annotation Error: "  ${request.req.params.uuid}  - ${JSON.stringify(error)}`);
            request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);

        }
    });

    function fillEquipnameInRec1(equipname, rec1)
    {
        if (equipname) {
            rec1.EquipName = equipname.Equipment_Name;
        }
    }

    async function createQueries(request, uuid) {
        let queries = [], response = [];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        if (request.data.request.shapes.del_shapes.length > 0) {
            queries.push(DELETE.from(GetShapes).where(
                {
                    Shape_Guid: { in: request.data.request.shapes.del_shapes }, Status: "DRAFT"
                }));
        }

        request.data.request.shapes.new_shapes.map((rec) => {
            let Shape_Vertices = [];
            rec.Building = request.data.request.header.Building;
            rec.Floor = request.data.request.header.Floor;
            rec.Site = request.data.request.header.Site;
            rec.CM = request.data.request.header.CM;
            rec.Status = request.data.request.header.Status;
            rec.SAP_CM_Site = rec.CM + "-" + rec.Site;
            rec.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            rec.modifiedBy_mail = jwtdetails.email;
            rec.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            rec.createdBy_mail = jwtdetails.email;
            rec.Shape_Vertices.results.forEach(data => {
                let vertices = {};
                vertices.Shape_Guid = rec.Shape_Guid;
                vertices.Status = request.data.request.header.Status;
                vertices.Vertices_X = data.Vertices_X;
                vertices.Vertices_Y = data.Vertices_Y;
                vertices.Sequence_No = data.Sequence_No;
                vertices.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                vertices.modifiedBy_mail = jwtdetails.email;
                vertices.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                vertices.createdBy_mail = jwtdetails.email;
                Shape_Vertices.push(vertices);
            });
            rec.Shape_Vertices = Shape_Vertices;
            response.push(rec);
        });
        if (response.length > 0) {
            queries.push(INSERT.into(GetShapes).entries(response));

        }

        await cds.run(SELECT.from(GetShapes).where({
            Building: request.data.request.header.Building,
            FLOOR: String(request.data.request.header.Floor),
            SITE: String(request.data.request.header.Site),
            CM: String(request.data.request.header.CM)
        })).then(async (res) => {
            queries = updateShapes(res, request, queries, jwtdetails);

        });
        await cds.run(SELECT.from(GetRFIDAnnotation).where({
            Building: request.data.request.header.Building,
            FLOOR: String(request.data.request.header.Floor),
            SITE: String(request.data.request.header.Site),
            CM: String(request.data.request.header.CM)
        })).then(async (resp) => {
            if (resp.length > 0) {
                let EqName = await getEquipName(request.data.request.rfid);
                let rfid_old = [];
                let rfid_new = [];
                request.data.request.rfid.forEach(rec1 => {
                    const index1 = resp.findIndex(e => e.Rfid === rec1.Rfid);
                    let eqRec = EqName.find(e => e.Aqid === rec1.CarryOverAqid);
                    if (eqRec) {
                        rec1.CarryOverEqName = eqRec.Equipment_Name;
                    }
                    let equipname = EqName.find(e => e.Aqid === rec1.Aqid);
                    fillEquipnameInRec1(equipname, rec1);
                    rec1.isProgramChanged = checkisequal(rec1.CarryOverOldProgram, rec1.Program);
                    rec1.isAqidChanged = checkisequal(rec1.CarryOverAqid, rec1.Aqid);
                    if (index1 >= 0) {
                        queries.push(UPDATE(GetRFIDAnnotation).where({
                            Building: request.data.request.header.Building,
                            FLOOR: String(request.data.request.header.Floor),
                            SITE: String(request.data.request.header.Site),
                            CM: String(request.data.request.header.CM),
                            Rfid: rec1.Rfid,
                            STATUS: "DRAFT"
                        }).set({
                            Comments: rec1.Comments,
                            Shape_Guid: rec1.Shape_Guid,
                            LineId: rec1.LineId,
                            LineType: rec1.LineType,
                            Line_Priority : rec1.Line_Priority,
                            Uph: rec1.Uph,
                            Aqid: rec1.Aqid,
                            CarryOverOldProgram: rec1.CarryOverOldProgram,
                            CarryOverEqName: rec1.CarryOverEqName,
                            EquipName : rec1.EquipName,
                            CarryOverAqid: rec1.CarryOverAqid,
                            Override_LineId: rec1.Override_LineId,
                            isAqidChanged: rec1.isAqidChanged,
                            isProgramChanged: rec1.isProgramChanged,
                            modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                            modifiedBy_mail: jwtdetails.email,
                            modifiedAt: new Date().toISOString()
                        }));
                        let old_record = [];
                        let new_record = [];
                        old_record = rfid_data(resp[index1], request.data.request.header, "DRAFT");
                        rfid_old.push(old_record);
                        new_record = rfid_data(rec1, request.data.request.header, "DRAFT");
                        rfid_new.push(new_record);
                    }
                });
                if (rfid_old.length > 0) {
                    let rfid = {};
                    rfid.uuid = uuid;
                    rfid.old = [];
                    rfid.new = [];
                    rfid.old = rfid_old;
                    rfid.new = rfid_new;
                    rfid_a.push(rfid);
                }
            }
        });
        return queries;
    }

    function checkisequal(x, y) {
        if (x !== y) {
            return true;
        }
    }


    function updateShapes(res, request, queries, jwtdetails) {
        if (request.data.request.shapes.upd_shapes !== undefined) {
            request.data.request.shapes.upd_shapes.forEach(rec1 => {
                const index1 = res.findIndex(e => e.Shape_Guid === rec1.Shape_Guid);
                if (index1 >= 0) {
                    queries.push(UPDATE(GetShapes).where({
                        Building: request.data.request.header.Building,
                        FLOOR: String(request.data.request.header.Floor),
                        SITE: String(request.data.request.header.Site),
                        CM: String(request.data.request.header.CM),
                        SHAPE_GUID: rec1.Shape_Guid,
                        STATUS: "DRAFT"
                    }).set({
                        Shape_Color: rec1.Shape_Color,
                        Shape_Type: rec1.Shape_Type,
                        Shape_Name: rec1.Shape_Name,
                        LineId: rec1.LineId,
                        LineType: rec1.LineType,
                        Line_Priority: rec1.Line_Priority,
                        Uph: rec1.Uph,
                        ConfirmedRequired: rec1.ConfirmedRequired,
                        ConfirmedBy: rec1.ConfirmedBy,
                        ConfirmedOn: rec1.ConfirmedOn,
                        modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                        modifiedBy_mail: jwtdetails.email,
                        ConfirmedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                        ConfirmedBy_mail: jwtdetails.email
                    }));

                }
            });
        }
        return queries;
    }
    async function processHeaderData(data, tx, Status, msg, request) {
        const LOG = request.req.params["LOG"];
        try {
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            LOG.info(`COA 3DV - Publish Annotation - Step 1 Update Header table In progress - ${request.req.params.uuid} - ${msg}`);
            await cds
                .run(SELECT.from(Get3DVHeader).where({
                    Building: data.Building,
                    FLOOR: String(data.Floor),
                    SITE: String(data.Site),
                    CM: String(data.CM)
                }))
                .then(async (response) => {
                    if (response.length > 0 && Status === "PUBLISH") {
                        let filterItems = response.filter(e => e.Status === "DRAFT");
                        if (filterItems.length > 0) {
                            response = filterItems;
                        }
                        response[0].Status = Status;
                        response[0].modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                        response[0].modifiedBy_mail = jwtdetails.email;
                        LOG.info("COA 3DV - Publish Annotation - Step 1 Delete from file with status: " + Status +  ` - ${request.req.params.uuid} - ` + msg);
                        await tx.run(DELETE.from(Get3DVHeader).where({
                            Building: data.Building,
                            FLOOR: String(data.Floor),
                            SITE: String(data.Site),
                            CM: String(data.CM)
                        }));
                        await tx.run(INSERT.into(Get3DVHeader).entries(response));

                    }
                    else {
                        await tx.run(DELETE.from(Get3DVHeader).where({
                            Building: data.Building,
                            FLOOR: String(data.Floor),
                            SITE: String(data.Site),
                            CM: String(data.CM),
                            STATUS: "DRAFT"
                        }));
                        if (response.length > 0) {
                            response = response[0];
                            response.Status = Status;
                            response.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                            response.modifiedBy_mail = jwtdetails.email;
                            response.createdBy = request.user.id;
                        }
                        LOG.info(`COA 3DV - Publish Annotation - Step 1 Delete from file with status : ${Status} - ${request.req.params.uuid} - ${msg}`);
                        await tx.run(INSERT.into(Get3DVHeader).entries([response]));

                    }
                });
            LOG.info(`COA 3DV - Publish Annotation - Step 1 Update File table completed, placed in que ${msg}`);
        }
        catch (e) {
            LOG.info(`COA 3DV  Error: ${JSON.stringify(e)} - ${request.req.params.uuid}`);
            request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
        }
    }


    async function newProcessAnnotationData(data, header, tx, delShapes, Status, msg, request) {
        const LOG = request.req.params["LOG"];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        LOG.info(`COA 3DV - Publish Annotation - Step 2 Update Annotation table in progress  - ${request.req.params.uuid} - ${msg}`);
        let eqName = [];
        LOG.info(`COA 3DV - Publish Annotation - Step 2 - a. Get Annotation Data from DB - ${request.req.params.uuid} - ${msg}`);
        let items = await getRFIDAnnotationData(header, header.Required_Version);
        eqName = await getEquipName(data);
        let old_data = [];
        old_data = await cds.run(SELECT.from(GetRFIDAnnotation).where({
            Building: header.Building,
            FLOOR: String(header.Floor),
            SITE: String(header.Site),
            CM: String(header.CM),
            STATUS: String(header.Required_Version)
        }));
        items = updateData(items, data, eqName, delShapes, Status, jwtdetails);
        if (items && items.length > 0) {
            if (Status === "PUBLISH") {
                await tx.run(DELETE.from(GetRFIDAnnotation).where({
                    Building: header.Building,
                    FLOOR: String(header.Floor),
                    SITE: String(header.Site),
                    CM: String(header.CM),
                }));
            }
            else {
                await tx.run(DELETE.from(GetRFIDAnnotation).where({
                    Building: header.Building,
                    FLOOR: String(header.Floor),
                    SITE: String(header.Site),
                    CM: String(header.CM),
                    STATUS: "DRAFT"
                }));

            }
            await tx.run(INSERT.into(GetRFIDAnnotation).entries(items));

            LOG.info(`COA 3DV - Publish Annotation - Step 2 Update Annotation table completed, placed in que  - ${request.req.params.uuid} - ${msg}`);
            let rfid_old = [];
            let rfid_new = [];
            items.forEach(element => {
                const index = old_data.findIndex(e => e.Rfid === element.Rfid);
                if (index >= 0) {
                    let old_record = [];
                    let new_record = [];
                    if (process.env.NODE_ENV === 'test') {
                        old_record = rfid_data(undefined, header, Status);
                    }
                    old_record = rfid_data(old_data[index], header, Status);
                    rfid_old.push(old_record);
                    new_record = rfid_data(element, header, "DRAFT");
                    rfid_new.push(new_record);
                }
            });
            if (rfid_old.length > 0) {
                let rfid = {};
                rfid.uuid = request.req.params.uuid;
                rfid.old = [];
                rfid.new = [];
                rfid.old = rfid_old;
                rfid.new = rfid_new;
                rfid_a.push(rfid);
            }
        }

        return items;
    }


    function updateData(items, data, eqName, delShapes, Status, jwtdetails) {
        if (items) {
            items = items.map((rec) => {
                rec.Status = Status;
                const index = data.findIndex(el => el.Rfid === rec.Rfid);
                if (index >= 0) {
                    rec = fillRecord(data, eqName, rec, index);
                    rec.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                    rec.modifiedBy_mail = jwtdetails.email;
                    rec.modifiedAt = new Date().toISOString();
                }
                else if (rec.Shape_Guid in delShapes) {
                    rec.Comments = "";
                    rec.LineId = "";
                    rec.LineType = "";
                    rec.Line_Priority = 0;
                    rec.Uph = "";
                    rec.Shape_Guid = "";
                    rec.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                    rec.modifiedBy_mail = jwtdetails.email;
                    rec.modifiedAt = new Date().toISOString();
                }
                return rec;
            });
            return items;
        }
    }
    function fillRecord(data, eqName, rec, index) {

        rec.Comments = data[index].Comments;
        rec.LineId = data[index].LineId;
        rec.LineType = data[index].LineType;
        rec.Line_Priority = data[index].Line_Priority;
        rec.Uph = data[index].Uph;
        rec.Shape_Guid = data[index].Shape_Guid;
        rec.CarryOverAqid = data[index].CarryOverAqid;
        rec.CarryOverOldProgram = data[index].CarryOverOldProgram;
        rec.Override_LineId = data[index].Override_LineId;
        if (data[index].CarryOverAqid) {
            const index1 = eqName.findIndex(el => el.Aqid === data[index].CarryOverAqid);
            if (index1 >= 0) {
                rec.CarryOverEqName = eqName[index1].Equipment_Name;
            }
        }
        if (data[index].Aqid) {
            const index2 = eqName.findIndex(el => el.Aqid === data[index].Aqid);
            if (index2 >= 0) {
                rec.EquipName = eqName[index2].Equipment_Name;
            }
        }
        if (data[index].CarryOverOldProgram !== rec.Program) {
            rec.isProgramChanged = true;
        }
        if (data[index].CarryOverAqid !== rec.Aqid) {
            rec.isAqidChanged = true;
        }
        return rec;
    }
    async function getEquipName(data) {

        let aqid_a = [];
        data.forEach((row) => {
            aqid_a = unique_rec(aqid_a, row.CarryOverAqid);
            aqid_a = unique_rec(aqid_a, row.Aqid);
        });

        if (aqid_a.length > 0) {
            return cds.run(SELECT.from("COM_APPLE_COA_T_COA_AQID_MAIN").columns(
                'Aqid as Aqid',
                'Equipment_Name as Equipment_Name'
            ).where({
                Aqid: { in: aqid_a }
            }));
        }
        else {
            return aqid_a;
        }

    }
    async function getRFIDAnnotationData(header, Status) {
        let items =  await cds.run(SELECT.from(GetRFIDAnnotation).where({
            Building: header.Building,
            FLOOR: String(header.Floor),
            SITE: String(header.Site),
            CM: String(header.CM),
            Status : String(Status)
        }));
        return items;
        
    }
    async function processShapeData( tx, Status, msg, request,AnnoData) {
        const LOG = request.req.params["LOG"];
        let shapes = request.data.request.shapes;
        let header = request.data.request.header;
        LOG.info(`COA 3DV - Publish Annotation - Step 3 Update Shape table in progress - ${request.req.params.uuid} - ` + msg);
        if (shapes.del_shapes.length > 0) {
            await tx.run(DELETE.from(GetShapes).where(
                { Shape_Guid: { in: shapes.del_shapes }, Status: Status }));
        }
        await cds.run(SELECT.from(GetShapes).where({
            Building: header.Building,
            FLOOR: String(header.Floor),
            SITE: String(header.Site),
            CM: String(header.CM),
            Status: String(header.Required_Version)
        }))
            .then(async (response) => {
                let finRec = [];
                for (let rec of response) {
                    if (!(shapes.del_shapes.includes(rec.Shape_Guid) && Status === rec.Status)) {
                        finRec.push(rec);
                    }
                }
                await updateShapeData(finRec, tx, Status, request, AnnoData);
            });

    }

    async function shapeData(response, Status, shapes, vertices, jwtdetails,request, AnnoData) {

        response = response.map((rec) => {

            rec.Status = Status;
            rec.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            rec.modifiedBy_mail = jwtdetails.email;
            let index;
            index = AnnoData.findIndex(el => el.Shape_Guid === rec.Shape_Guid);
            if (index === -1) {
                return;
            }
            index = shapes.new_shapes.findIndex(el => el.Shape_Guid === rec.Shape_Guid);
            if (index >= 0) {

                rec.Shape_Color = shapes.new_shapes[index].Shape_Color;
                rec.Shape_Type = shapes.new_shapes[index].Shape_Type;
                rec.Shape_Name = shapes.new_shapes[index].Shape_Name;
                rec.Shape_Guid = shapes.new_shapes[index].Shape_Guid;
                rec.LineId = shapes.new_shapes[index].LineId;
                rec.LineType = shapes.new_shapes[index].LineType;
                rec.Line_Priority = shapes.new_shapes[index].Line_Priority;
                rec.Uph = shapes.new_shapes[index].Uph;
            }
            rec.Shape_Vertices = vertices.map(data => {
                if (data !== undefined && data.Shape_Guid === rec.Shape_Guid) {
                    data.Status = Status;
                    return data;
                }
            }).filter(y => y !== undefined);

            return rec;
        }).filter(y => y !== undefined);

        return response;
    }

    async function updateShapeData(response,  tx, Status, request, AnnoData) {
        const LOG = request.req.params["LOG"];
        let shapes = request.data.request.shapes;
        let header = request.data.request.header;
        try {
            let del_shape_id = [];
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));

            if (response.length > 0) {
                    let shapeGuid = buildShapeGUIDRange(response);
                    let vertices = await cds
                        .run(SELECT.from(GetVertices).where({
                            Shape_Guid: { in: shapeGuid },
                            Status : String(header.Required_Version)
                        }))
                    response = await shapeData(response, Status, shapes, vertices, jwtdetails,request,AnnoData)
            }

            response = fillnewShapesVertices(response, shapes, header, request, Status, jwtdetails);

            if (response.length > 0) {
                if (Status === "PUBLISH") {
                    await tx.run(DELETE.from(GetShapes).where({
                        Building: header.Building,
                        FLOOR: String(header.Floor),
                        SITE: String(header.Site),
                        CM: String(header.CM),
                        STATUS: 'DRAFT'    // Delete only Draft ones    
                    }));

                    del_shape_id = await get_del_shape_ids(header, response, del_shape_id, AnnoData);

                    if (del_shape_id.length > 0) {
                        await tx.run(DELETE.from(GetShapes).where({
                            Building: header.Building,
                            FLOOR: String(header.Floor),
                            SITE: String(header.Site),
                            CM: String(header.CM),
                            Shape_Guid: { in: del_shape_id },
                            STATUS: 'PUBLISH'
                        }));
                    }
                }
                else {
                    await tx.run(DELETE.from(GetShapes).where({
                        BUILDING: header.Building,
                        FLOOR: String(header.Floor),
                        SITE: String(header.Site),
                        CM: String(header.CM),
                        STATUS: 'DRAFT'
                    }));
                }
                await tx.run(INSERT.into(GetShapes).entries(response));



            }
        }
        catch (e) {
            LOG.info(`COA 3DV Save As Annotation Error: ${request.req.params.uuid}  -  ${JSON.stringify(e)}`);
            request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
        }
    }

    async function get_del_shape_ids(header, response, del_shape_id, AnnoData) {
        let shape_guid = [];
            //Get Shape GUID's with Publish status
            shape_guid = await cds.run(SELECT.distinct.from(GetShapes).columns('Shape_Guid as Shape_Guid').where({
                Building: header.Building,
                FLOOR: String(header.Floor),
                SITE: String(header.Site),
                CM: String(header.CM),
                STATUS: 'PUBLISH'
            }));

            //Build the array of Shape_GUID which needs to be deleted.
            shape_guid.forEach(e1 => {
                const index = response.findIndex(e => e.Shape_Guid === e1.Shape_Guid);
                if (index >= 0) {
                    del_shape_id.push(e1.Shape_Guid);
                } else {
                    const index1 = AnnoData.findIndex(e => e.Shape_Guid === e1.Shape_Guid);
                    if (index1 < 0) {
                        del_shape_id.push(e1.Shape_Guid);
                    }
                }
            });
            return del_shape_id;
        }

        function buildShapeGUIDRange(response) {
            let shapeGuid = [];
            response.forEach(rec => {
                shapeGuid.push(rec.Shape_Guid);
            });
            return shapeGuid;
        }

        function fillnewShapesVertices(response, shapes, header, request, Status, jwtdetails) {
            const LOG = request.req.params["LOG"];
            try {
                shapes.new_shapes.map((rec) => {
                    let Shape_Vertices = [];
                    const index = response.findIndex(el => el.Shape_Guid === rec.Shape_Guid);
                    if (index < 0) {
                        rec.Building = header.Building;
                        rec.Floor = header.Floor;
                        rec.Site = header.Site;
                        rec.CM = header.CM;
                        rec.Status = Status;
                        rec.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                        rec.createdBy_mail = jwtdetails.email;
                        rec.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                        rec.modifiedBy_mail = jwtdetails.email;

                        rec.SAP_CM_Site = header.CM + "-" + header.Site;
                        rec.Shape_Vertices.results.forEach(data => {
                            let vertices = {};
                            vertices.Shape_Guid = rec.Shape_Guid;
                            vertices.Status = Status;
                            vertices.Vertices_X = data.Vertices_X;
                            vertices.Vertices_Y = data.Vertices_Y;
                            vertices.Sequence_No = data.Sequence_No;
                            vertices.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                            vertices.modifiedBy_mail = jwtdetails.email;
                            Shape_Vertices.push(vertices);
                        });
                        rec.Shape_Vertices = Shape_Vertices;
                        response.push(rec);
                    }
                });
                return response;
            }
            catch (e) {
                LOG.info("COA 3DV Save As Annotation Error: " + request.req.params.uuid + "-" + JSON.stringify(e));
                request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
            }
        }


        srv.before("GET", "F4help", async (request) => {
            const uuid = getuuid(request);
            const LOG = cds.log(getuuid(request), { label: 'F4Help' });
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG": LOG };
            }
            const allowedattributes = getAllowedAttributes(request.headers.authorization, request.req.params.uuid,LOG);
            if (allowedattributes.length === 0) {
                request.reject(401, 'User is missing Authorization. They are not assigned any CM/Site');
            }
        });


        srv.on("GET", "F4help", async (request) => {
            const LOG = request.req.params["LOG"];
            try {
                let allowedattributes = getAllowedAttributes(request.headers.authorization, request.req.params.uuid, LOG );
                let dropdown_array = [];
                let top;
                let skip;
                top = request._queryOptions.$top;
                skip = request._queryOptions.$skip;
                top = top.includes("infinity") ? 1000 : top;
                let search;
                if (request._query.$search) {
                    search = request._query.$search.replace(/"/g, ``);
                }
                const change = request.query.SELECT.columns[0].ref[0];
                switch (change) {
                    case 'Area':
                        dropdown_array = await fetchdata(allowedattributes, change, search, "ANNOTATION3DV_HEADERANNOTATION", top, skip);
                        break;
                    case 'Floor':
                        dropdown_array = await fetchdata(allowedattributes, change, search, GetRFIDAnnotation, top, skip);
                        break;
                    case 'Building':
                        dropdown_array = await fetchdata(allowedattributes, change, search, GetRFIDAnnotation, top, skip);
                        break;
                    case 'LineId':
                        dropdown_array = await fetchdata(allowedattributes, change, search, GetRFIDAnnotation, top, skip);
                        break;
                    case 'LineType':
                        dropdown_array = await fetchdata(allowedattributes, change, search, GetRFIDAnnotation, top, skip);
                        break;
                    case 'Alderaan_CM':
                        dropdown_array = await fetchdata(allowedattributes, change, search, "ANNOTATION3DV_HEADERANNOTATION", top, skip);
                        break;
                    case 'Alderaan_Site':
                        dropdown_array = await fetchdata(allowedattributes, change, search, "ANNOTATION3DV_HEADERANNOTATION", top, skip);
                        break;
                    case 'Status':
                        dropdown_array = await fetchdata(allowedattributes, change, search, "ANNOTATION3DV_HEADERANNOTATION", top, skip);
                        break;
                    default:
                        break;
                }
                request.results = dropdown_array;
            }
            catch (error) {
                return "Error: " + JSON.stringify(error);
            }
        });

        async function fetchdata(allowedattributes, change, search, db, top, skip) {
            let dropdown_array = [];

            let whereclause = "";
            const values = get_cmsite(allowedattributes);
            allowedattributes = values[0];
            let allowed_cmsite = values[1];
            // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
            // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
            whereclause = build_filter(allowed_cmsite, whereclause, allowedattributes);
            if (search) {
                let regex = /\*+/g;
                search = search.replace(regex, `%`);
                regex = /_/g
                search = search.replace(regex, `\\_`);
                whereclause = whereclause ? `((${whereclause}) and (${change} like '%${search}%' escape '\\'))` : `(${change} like '%${search}%' escape '\\')`;
            }
            if (whereclause) {
                whereclause = `(${whereclause}) and (${change} is not null) and (${change}<>'')`;
                let parsedFilters = cds.parse.expr(`(${whereclause})`);
                dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${change}`).where(parsedFilters).limit(top, skip)
                );
            } else {
                dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${change}`).where(`(${change} is not null) and not(${change}='')`).limit(top, skip)
                );
            }
            return dropdown_array;
        }

        function build_filter(allowed_cmsite, filters, allowedattributes) {
            let cm_site_filter;
            if (allowed_cmsite.length > 0) {
                cm_site_filter = build_cm_site_filter(allowed_cmsite, 'SAP_CM_Site', cm_site_filter);
                filters = filters ? `(${filters} and (${cm_site_filter}))` : cm_site_filter;
            } else {
                const index1 = allowedattributes.CM.findIndex(e1 => e1 === "$unrestricted");
                const index2 = allowedattributes.Site.findIndex(e1 => e1 === "$unrestricted");
                if (index1 < 0) {
                    cm_site_filter = build_cm_site_filter(allowedattributes.CM, 'CM', cm_site_filter);
                    filters = filters ? `(${filters} and (${cm_site_filter}))` : cm_site_filter;
                }
                if (index2 < 0) {
                    cm_site_filter = build_cm_site_filter(allowedattributes.Site, 'Site', cm_site_filter);
                    filters = filters ? `(${filters} and (${cm_site_filter}))` : cm_site_filter;
                }
            }
            return filters;
        }

        function build_cm_site_filter(allowed, field, cm_site_filter) {
            allowed.forEach(e => {
                cm_site_filter = cm_site_filter ? `${cm_site_filter} or ${field} = '${e}'` : `${field} = '${e}'`;
            });
            return cm_site_filter;
        }

        function MandatoryValidation(LineId, LineType, Uph, msg) {
            if (!LineId) {
                msg = msg ? `${msg}, LineID is mandatory` : `LineID is mandatory`;

            }
            if (!LineType) {
                if (msg) {
                    msg = msg + ", LineType is mandatory";
                } else {
                    msg = "LineType is mandatory";
                }
            }
            if (!Uph && Uph !== 0) {
                if (msg) {
                    msg = msg + ", UPH is mandatory";
                } else {
                    msg = "UPH is mandatory";
                }
            }
            return msg;
        }

        function Linetype_Uph_Validation(line_type_uph, LineType, Uph, msg) {
            if (line_type_uph.length > 0 || LineType || Uph) {
                let LineUph_value = line_type_uph.find(e => e.Line === LineType && e.Uph === Uph);
                if (typeof LineUph_value === "undefined" || LineUph_value === ' ') {
                    if (msg) {
                        msg = msg + ", Invalid LineType and Uph Combination";
                    } else {
                        msg = "Invalid LineType and Uph Combination";
                    }
                }
            }
            return msg;
        }

        function validate_aqid(CarryOverAqid, aqid_result, msg) {
            let result = {};
            result.CarryOverEqName = "";
            result.msg = msg;
            let aquid_value = "";
            if (CarryOverAqid) {
                if (aqid_result.length > 0) {
                    aquid_value = aqid_result.find(e => e.Aqid === CarryOverAqid);
                }
                if (typeof aquid_value === "undefined" || aquid_value === '') {
                    if (result.msg) {
                        result.msg = result.msg + ", Invalid Aqid";
                    } else {
                        result.msg = "Invalid Aqid";
                    }
                }
                else {
                    result.CarryOverEqName = aquid_value.Equipment_Name;
                }
            }else{
                result.msg = result.msg ? `${result.msg}, CO AQID is mandatory` : `CO AQID is mandatory`;
             }
            return result;
        }

        function validate_program(CarryOverOldProgram, Program_result, msg) {
            let program_value = "";
            if (CarryOverOldProgram) {
                if (Program_result.length > 0) {
                    program_value = Program_result.find(e => e.Program === CarryOverOldProgram);
                }
                if (typeof program_value === "undefined" || program_value === '') {
                    if (msg) {
                        msg = msg + ", Invalid Program";
                    } else {
                        msg = "Invalid Program";
                    }
                }
            }else{
               msg = msg ? `${msg}, CO Program is mandatory` : `CO Program is mandatory`;
            }
            return msg;
        }

        srv.on("GET", "DropDown", async (request) => {
            const uuid = getuuid(request);
            const LOG = cds.log(uuid, { label: 'Dropdown' }); 
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id , "LOG":LOG};
            }
            LOG.info(`COA - DropDown data fetch in progress: ${request.req.params.uuid}`);
            let queryOptions = request._.odataReq.getQueryOptions();
            let filter = queryOptions.$filter;
            if (filter) {
                let filterVal = filter.split("'");
                let filterCodition = filterVal[1].split("-");
                let condition = {};
                condition[filterCodition[0]] = filterCodition[1];
                let filterNameValue = "";
                filterNameValue = "'" + filterCodition[0] + "-" + filterCodition[1] + "'" + " as FilterNameValue";

                try {
                    if (filterCodition[1] === "ALL") {
                        await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").columns('Line as Id', 'STRING_AGG(Uph,\',\') as Value', '\'Line\' as Type', filterNameValue)
                            .groupBy('Line')).then(async (response) => {
                                request.data = check_entryexists(response);
                            });

                        await cds.run(SELECT.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").columns('Uph as Id', 'STRING_AGG(Line,\',\') as Value', '\'Uph\' as Type', filterNameValue)
                            .groupBy('Uph')).then(async (response) => {

                                if (response.length > 0) {
                                    request.data.push(...response);
                                }
                            });
                    }
                    else {
                        await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").columns('Line as Id', 'STRING_AGG(Uph,\',\') as Value', '\'Line\' as Type', filterNameValue)
                            .where(condition).groupBy('Line')).then(async (res) => {
                                request.data = check_entryexists(res);
                            });

                        await cds.run(SELECT.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").columns('Uph as Id', 'STRING_AGG(Line,\',\') as Value', '\'Uph\' as Type', filterNameValue)
                            .where(condition).groupBy('Uph')).then(async (res) => {
                                if (res.length > 0) {
                                    request.data.push(...res);
                                }
                            });
                    }
                }
                catch (e) {
                    LOG.info("COA 3DV - DropDown Error" + request.req.params.uuid + JSON.stringify(e));
                    request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
                }
                return request.reply(request.data);
            }
        });

        function check_entryexists(response) {
            if (response.length > 0) {
                response.forEach(e => {
                    let value = e.Value.split(",");
                    let uniqueChars = [...new Set(value)];
                    e.Value = uniqueChars.toString();
                })
                return response;
            }
        }

        function update_changelog(TableName, new_records, old_records, action, request) {
            const LOG = request.req.params["LOG"] ;
            LOG.info(`Call Changelog service to update the changes to Changelog table`);
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            const core = require("@sap-cloud-sdk/core");
            const xsenv = require("@sap/xsenv");
            xsenv.loadEnv();
            const sDestinationName = "COA_APIM_CC";
            let result = {};
            result.TableName = TableName;
            result.old_records = [];
            result.new_records = [];
            result.old_records = old_records;
            result.new_records = new_records;
            result.actionType = action;
            result.user_data = {};
            result.user_data.user = request.req.params.user;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            let result_a = [];
            result_a.push(result);
            let requestData = { "body": JSON.stringify(result_a) };
            core.executeHttpRequest({ destinationName: sDestinationName },
                {
                    method: "POST",
                    url: "/v2/changelog/compareTabels",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: requestData
                }
            );
        }

        function rfid_data(request, header, status) {
            let record = [];
            if (request) {
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push(header.CM);
                record.push(header.Site);
                record.push(header.Building);
                record.push(header.Floor);
                record.push(status);
                record.push(request.Asset_ID);
                record.push(request.Rfid);
                record.push(request.Alderaan_ID);
                record.push(request.Override_LineId);
                record.push(request.CarryOverAqid);
                record.push(request.CarryOverOldProgram);
                record.push(request.CarryOverEqName);
                record.push("");
                record.push("");
                record.push(request.EquipName)
                record.push(request.Program);
                record.push(request.Uph);
                record.push(request.LineType);
                record.push(request.LineId);
                record.push("");
                record.push("");
                record.push(request.Comments);
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push(request.Line_Priority);
            }
            else {
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push(0);
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
                record.push("");
            }
            return record;
        }

        srv.on("locking", async (request) => {
            const LOG = request.req.params["LOG"] ;
            let error_flag = "";
            try {
                const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
                let hdb = await cds.connect.to("db");
                let tx = hdb.tx();
                if (request.data.request.Lock) {
                    await cds
                        .run(SELECT.from(Get3DVHeader).where({
                            Building: request.data.request.Building,
                            FLOOR: String(request.data.request.Floor),
                            SITE: String(request.data.request.Site),
                            CM: String(request.data.request.CM),
                        }))
                        .then(async (response) => {
                            let index = response.findIndex(e => e.Lock === "X");
                            if (index < 0) {
                                await tx.run(UPDATE(Get3DVHeader).where({
                                    Building: request.data.request.Building,
                                    FLOOR: String(request.data.request.Floor),
                                    SITE: String(request.data.request.Site),
                                    CM: String(request.data.request.CM),
                                    STATUS: request.data.request.Status
                                }).set({
                                    Last_Active_Date: new Date().toISOString(),
                                    Last_Active_User: request.user.id,
                                    Lock: "X",
                                    modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                                    modifiedBy_mail: jwtdetails.email,
                                    Last_Active_UserName: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                                    Last_Active_UserMail: jwtdetails.email
                                }));
                            } else if (response[index].Last_Active_User !== request.user.id) {
                                error_flag = "X";
                                LOG.info("COA 3DV  Locking Error: " + request.req.params.uuid + "-" + JSON.stringify(`The record is locked by ${response[index].Last_Active_UserName}`));
                                request.reject(400, `The record is locked by ${response[index].Last_Active_UserName}`);
                            }
                        });
                }
                else {
                    await cds
                        .run(SELECT.from(Get3DVHeader).where({
                            Building: request.data.request.Building,
                            FLOOR: String(request.data.request.Floor),
                            SITE: String(request.data.request.Site),
                            CM: String(request.data.request.CM),
                            Last_Active_User: request.user.id,
                            Lock: "X"
                        }))
                        .then(async (response) => {
                            if (response.length === 1) {
                                await tx.run(UPDATE(Get3DVHeader).where({
                                    Building: request.data.request.Building,
                                    FLOOR: String(request.data.request.Floor),
                                    SITE: String(request.data.request.Site),
                                    CM: String(request.data.request.CM),
                                    Last_Active_User: request.user.id,
                                    Lock: "X"
                                }).set({
                                    Last_Active_Date: null,
                                    Last_Active_User: null,
                                    Lock: null,
                                    modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                                    modifiedBy_mail: jwtdetails.email,
                                    Last_Active_UserName: null,
                                    Last_Active_UserMail: null
                                }));
                            }
                        });
                }
                await tx.commit();
            }
            catch (error) {
                if (error_flag === "") {
                    LOG.info("COA 3DV  Locking Error: " + request.req.params.uuid + "-" + JSON.stringify(error));

                }
            }
        });

        async function check_if_locked(request) {
            await cds
                .run(SELECT.from(Get3DVHeader).where({
                    Building: request.data.request.header.Building,
                    FLOOR: String(request.data.request.header.Floor),
                    SITE: String(request.data.request.header.Site),
                    CM: String(request.data.request.header.CM),
                    Lock: "X"
                }))
                .then(async (response) => {
                    if (response.length === 1) {
                        if (response[0].Last_Active_User !== request.user.id) {
                            return `The record is already locked by ${response[0].Last_Active_UserName}`;
                        }
                    }
                });
        }

        async function releaselock(request, hdb, lock_again_flg) {
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let tx = hdb.tx();
            await tx.run(UPDATE(Get3DVHeader).where({
                Building: request.data.request.header.Building,
                FLOOR: String(request.data.request.header.Floor),
                SITE: String(request.data.request.header.Site),
                CM: String(request.data.request.header.CM),
                Lock: "X",
                Last_Active_User: request.user.id
            }).set({
                Lock: null,
                Last_Active_User: null,
                Last_Active_Date: null,
                modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                modifiedBy_mail: jwtdetails.email,
                Last_Active_UserName: null,
                Last_Active_UserMail: null
            }));
            if(lock_again_flg === 'X'){
                await tx.run(UPDATE(Get3DVHeader).where({
                    Building: request.data.request.header.Building,
                    FLOOR: String(request.data.request.header.Floor),
                    SITE: String(request.data.request.header.Site),
                    CM: String(request.data.request.header.CM),
                    STATUS: 'DRAFT'
                }).set({
                    Last_Active_Date: new Date().toISOString(),
                    Last_Active_User: request.user.id,
                    Lock: "X",
                    modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                    modifiedBy_mail: jwtdetails.email,
                    Last_Active_UserName: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                    Last_Active_UserMail: jwtdetails.email
                }));
            }
            await tx.commit();
        }

        async function updatelockdata(request, hdb) {
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let tx = hdb.tx();
            await tx.run(UPDATE(Get3DVHeader).where({
                Building: request.data.request.Building,
                FLOOR: String(request.data.request.Floor),
                SITE: String(request.data.request.Site),
                CM: String(request.data.request.CM),
                Lock: "X"
            }).set({
                Last_Active_Date: new Date().toISOString(),
                Last_Active_User: request.user.id,
                modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                modifiedBy_mail: jwtdetails.email,
                Last_Active_UserName: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                Last_Active_UserMail: jwtdetails.email
            }));
            await tx.commit();
        }

        srv.on("lockManager", async (request) => {
            const uuid = getuuid(request);
            const LOG = cds.log(uuid, { label: 'LockManager' }); 
            try {
                const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
                if (typeof (request.req.params.uuid) === "undefined") {
                    request.req.params = { "uuid": uuid, "user": request.user.id, "LOG":LOG };
                }
                LOG.info(`COA 3DV  In LockManager Job Scheduler event : ${request.req.params.uuid}`);
                let hdb = await cds.connect.to("db");
                let tx = hdb.tx();
                let queries = [];
                await tx.run(SELECT.from(Get3DVHeader).where({
                    Lock: 'X'
                }))
                    .then(async (response) => {
                        if (response.length > 0) {
                            response.forEach(element => {
                                let date = new Date(element.Last_Active_Date).getTime();
                                let date1 = new Date().getTime();
                                let diff = date1 - date; // get the difference
                                diff = diff / 60000; //Convert into minutes
                                if (diff > 30) {
                                    queries.push(UPDATE(Get3DVHeader).where({
                                        Building: element.Building,
                                        FLOOR: element.Floor,
                                        SITE: element.Site,
                                        CM: element.CM,
                                        STATUS: element.Status
                                    }).set({
                                        Lock: null,
                                        Last_Active_User: null,
                                        Last_Active_Date: null,
                                        modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                                        modifiedBy_mail: jwtdetails.email,
                                        Last_Active_UserName: null,
                                        Last_Active_UserMail: null
                                    }));
                                }
                            });
                        }
                    });
                await tx.run(queries);
                await tx.commit();
            }
            catch (error) {
                LOG.info("COA 3DV  Locking Error: " + request.req.params.uuid + "-" + JSON.stringify(error));
                request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
            }
        });

        srv.before(["check_draft_record", "locking", "checkRFIDInsideShape"], async (request) => {
            const uuid = getuuid(request);
            const LOG = cds.log(uuid, { label: 'beforeEvt' }); 
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG":LOG};
            }
            let headerData = {
                "CM": request.data.request.CM,
                "Site": request.data.request.Site
            }
            let authFailed = checkAuthorization(request.headers.authorization, headerData, request.req.params.uuid,LOG);
                if (!authFailed) {
                    request.reject(401, `User is missing Authorization. They are not assigned any CM/Site ${request.req.params.uuid}`);
                }
            });

        srv.on("check_draft_record", async (request) => {
            const LOG = request.req.params["LOG"];
            try {
                LOG.info(`COA 3DV In Check Draft Record : ${request.req.params.uuid}`);
                await cds.run(SELECT.from(Get3DVHeader).where({
                    Building: request.data.request.Building,
                    FLOOR: String(request.data.request.Floor),
                    SITE: String(request.data.request.Site),
                    CM: String(request.data.request.CM)
                })).then(async (response) => {
                    if (response.length > 0) {
                        const index = response.findIndex(e => e.Status === 'DRAFT');
                        const index1 = response.findIndex(e => e.Status === 'PUBLISH');
                        if (index >= 0 && index1 >= 0) {
                            if (response[index].Scan_Start_Date !== response[index1].Scan_Start_Date || response[index].Scan_End_Date !== response[index1].Scan_End_Date) {
                                let modifiedAt = new Date(response[index].modifiedAt);
                                let scanstart = new Date(response[index].Scan_Start_Date);
                                let scanend = new Date(response[index].Scan_End_Date);
                                request._.res.send({ msg: `This action will OVER WRITE the annotation done on the new draft scan received on ${ modifiedAt.toLocaleDateString() }, with Scan Start ${ scanstart.toLocaleDateString() } and end date ${ scanend.toLocaleDateString() }` });
                            }
                        }
                    }
                });

            }
            catch (error) {
                LOG.info("COA 3DV  Check Draft Record: " + request.req.params.uuid + "-" + JSON.stringify(error));
                request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);
            }
        });

        function getAllowedAttributes(authToken, uuid,LOG) {
            const jwtdetails = (jwtDecode(String(authToken).slice(7)));

            let usrScope = [];
            for (let scope of jwtdetails.scope) {
                usrScope.push(scope.split('.')[1]);
            }

            const RoleNames = jwtdetails['xs.system.attributes'];
            let allowedattributes = [];
            let srvCred = {};
            try {
                if (glb_auth) {
                    srvCred = glb_auth;
                } else {
                    const xsenv = require("@sap/xsenv");
                    xsenv.loadEnv();
                    let iterate = true, cnt = 1, authJson = '';
                    do {
                        let colName = "coa_auth_" + cnt;
                        if (process.env[colName]) {
                            authJson = authJson + process.env[colName];
                            cnt++;
                        } else {
                            iterate = false;
                        }
                    } while (iterate === true);



                    let regex = /\n/g;
                    authJson = authJson.replace(regex, ``);
                    regex = / /g;
                    authJson = authJson.replace(regex, ``);
                    srvCred = JSON.parse(authJson);
                    glb_auth = srvCred;
                }

                allowedattributes = addToAllowedAttributes(usrScope, RoleNames, allowedattributes, srvCred);

            } catch(auth_err) {
                LOG.info(uuid + "AuthObject Parse error");
                cds.context.http.res.status(500).send({ msg: auth_err.message });
            }

            return allowedattributes;
        }

        function addToAllowedAttributes(usrScope, RoleNames, allowedattributes, srvCred) {
            for (let roleName of RoleNames["xs.rolecollections"]) {
                if (srvCred && srvCred[roleName] !== undefined) {
                    if (srvCred[roleName]['AnnotationModify'] !== undefined && usrScope.includes('AnnotationModify')) {
                        allowedattributes = setAccessFlag('AnnotationModify', 'AllowModify', allowedattributes, srvCred[roleName]);
                    }
                    if (srvCred[roleName]['AnnotationReadOnly'] !== undefined && usrScope.includes('AnnotationReadOnly')) {
                        allowedattributes = setAccessFlag('AnnotationReadOnly', 'display', allowedattributes, srvCred[roleName]);
                    }
                }
            }
            return allowedattributes;
        }

        function setAccessFlag(scope, mode, allowedattributes, Role) {
            for (let rec of Role[scope]['CM-Site']) {
                let CMAccess = { CMSite: '', AllowModify: false, display: false };
                let idx = allowedattributes.findIndex(el => el.CMSite === rec);
                if (idx < 0) {
                    CMAccess.CMSite = rec;
                    CMAccess[mode] = true;
                    allowedattributes.push(CMAccess);
                } else {
                    allowedattributes[idx][mode] = true;
                }
            }
            return allowedattributes;
        }

        async function trigger_alderaan_update(header, Status, request) {
            const LOG = request.req.params["LOG"];
            let hdb = await cds.connect.to("db");
            let tx = hdb.tx();
            let header_data = await tx.run(SELECT.from(Get3DVHeader).where({
                BUILDING: header.Building,
                FLOOR: header.Floor,
                SITE: header.Site,
                CM: header.CM,
                STATUS : Status
            }));
            if(header_data.length > 0){
                let alderaan_data = await tx.run(SELECT.from("V_COA_AUDIT").where({
                    BUILDING: header.Building,
                    FLOOR:header.Floor,
                    SITE: header_data[0].Alderaan_Site,
                    CM: header_data[0].Alderaan_CM
                }));

                if(alderaan_data.length > 0){
                    LOG.info(`COA 3DV - Calling Alderaan for status updation - ${request.req.params.uuid}`);
                    try{
                        let finaldate = alderaan_data[0].SCAN_PLANNED_DATE.replace(/:/g, '');
                        finaldate = finaldate.replace(/ /g, '');
                        finaldate = finaldate.replace(/T/g, '');
                        finaldate = finaldate.replace(/-/g, '');
                        const core = require("@sap-cloud-sdk/core");
                        const xsenv = require("@sap/xsenv");
                        xsenv.loadEnv();
                        const sDestinationName = "coa_alderaan";
                        let result = {};
                        result.CM_ID = alderaan_data[0].CM_ID;
                        result.SITE_ID = alderaan_data[0].SITE_ID;
                        result.BUILDING_ID = alderaan_data[0].BUILDING_ID;
                        result.FLOOR_ID = alderaan_data[0].FLOOR_ID;
                        result.SCAN_PLANNED_DATE = finaldate;
                        if(Status === 'PUBLISH' || Status === 'Publish'){
                            result.SCAN_STATUS = 'Published';
                        }else{
                            result.SCAN_STATUS = Status;
                        }
                        let result_a = [];
                        result_a.push(result);
                        let requestData = JSON.stringify(result_a);
                        core.executeHttpRequest({ destinationName: sDestinationName },
                            {
                                method: "POST",
                                url: "/v1/coa/alderaan-service",
                                headers: {
                                    "Content-Type": "application/json",
                                    'HTTP_HEADER_CONSUMER_ID': process.env.CONSUMER_ID,
                                    'HTTP_HEADER_PROVIDER_ID': process.env.PROVIDER_ID,
                                    'HTTP_HEADER_CONTEXT': process.env.CONTEXT,
                                    'HTTP_HEADER_CONTEXT_VERSION': process.env.CONTEXT_VERSION,
                                    'apikey': process.env.appid
                                },
                                data: requestData
                            }
                        );
                    }catch (error) {
                        LOG.info(`COA 3DV - Calling Alderaan for status updation - ${request.req.params.uuid} - ` + JSON.stringify(error));
                        request.reject(500, `Technical Error - Check GUID in cockpit log for more details - ${request.req.params.uuid}`);

                    }
                }
            }
        }
    });
    