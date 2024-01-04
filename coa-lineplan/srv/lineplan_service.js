'use strict';
const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");
const csv = require("csv-parser");
const fs = require("fs");

module.exports = cds.service.impl(async (srv) => {
    const
        {
            CarryoverMainline,
            CarryoverSubline,
            CarryoverLineplan,
            Upload_MainLine,
            Upload_SubLine,
            mainline_action,
            subline_action,
        } = srv.entities;
    const hdb = await cds.connect.to("db");
    let completed = false;
    let glb_auth;
    let somethingToInsert = false;
    let before_data_s = [];
    let before_data_m = [];

    // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
    // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
    srv.before("GET", [CarryoverMainline, CarryoverSubline, CarryoverLineplan], async (request) => {
        if (request.req === undefined) request.req = {};
        if (request.req.params === undefined) request.req.params = {};
        request.req.params["LOG"] = cds.log(getuuid(request), { label: 'GET' });
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        switch (request.query.SELECT.from.ref[0]) {
            case 'lineplan.CarryoverMainline':
                allowed_cmsite = merge(allowedAttributes['MainLineReadOnly'], allowedAttributes['MainLineModify']);
                break;
            case 'lineplan.CarryoverSubline':
                allowed_cmsite = merge(allowedAttributes['SubLineReadOnly'], allowedAttributes['SubLineModify']);
                break;
            case 'lineplan.CarryoverLineplan':
                allowed_cmsite = allowedAttributes['LinePlanReadOnly'];
                break;
        }
        let filterString = getFilterString(allowed_cmsite);
        if (filterString !== '') {
            if (request.query.SELECT.where !== undefined) {
                let tempWhere = JSON.parse(JSON.stringify(request.query.SELECT.where))
                if (tempWhere[0].ref !== undefined) tempWhere = [{ "xpr": [...tempWhere] }]
                request.query.SELECT.where = [];
                request.query.SELECT.where[0] = {};
                request.query.SELECT.where[0].xpr = [(cds.parse.expr(filterString)), 'and', ...tempWhere]
            }
            else {
                request.query.SELECT.where = [];
                request.query.SELECT.where[0] = {};
                request.query.SELECT.where[0].xpr = [(cds.parse.expr(filterString))]
            }
        }
    }
    );

    srv.after("GET", [CarryoverMainline, CarryoverSubline, CarryoverLineplan], async (data, request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        switch (request.query.SELECT.from.ref[0]) {
            case 'lineplan.CarryoverMainline':
                allowed_cmsite = allowedAttributes['MainLineModify'];
                break;
            case 'lineplan.CarryoverSubline':
                allowed_cmsite = allowedAttributes['SubLineModify'];
                break;
        }
        if (request.results) {
            request.results.forEach(e => {
                if (Object.keys(allowed_cmsite).length !== 0) {
                    e.Edit = (allowed_cmsite[`${e.CM}-${e.Site}`] !== undefined || allowed_cmsite[`$unrestricted-${e.Site}`] !== undefined ||
                        allowed_cmsite[`${e.CM}-$unrestricted}`] !== undefined || allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? 7 : 1;
                }
            });
        }
    });

    srv.before("POST", CarryoverMainline, async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Mainline: POST CarryoverMainline' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id,"LOG":LOG };
            }
            LOG.info(`In before event of POST action for Mainline `);
            let record = {};
            const tx = hdb.tx();
            record.CM = "";
            record.Site = "";
            record.Program = request.data.Program;
            record.Error = '';
            record.GH_Site = request.data.GH_Site;
            record = await fetch_cmsite(record, tx);
            if (record.Error) {
                request.reject(400, JSON.stringify(record));
            }
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            let allowed_cmsite = [];
            allowed_cmsite = allowedAttributes[`MainLineModify`];
            request.data.CM = record.CM;
            request.data.Site = record.Site;
            request.data.SAP_CM_Site = record.SAP_CM_Site;
            request.data.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.createdBy_mail = jwtdetails.email;
            request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.modifiedBy_mail = jwtdetails.email;
            record.Error = AuthorizationCheck(record, allowed_cmsite);
            record.Error = await validate_data(record, tx);
            record.Error = check_data(request.data, record.Error);
            if (record.Error) {
                request.reject(400, JSON.stringify(record));
            }
            await cds.run(SELECT.from(CarryoverMainline).columns('CM as CM').where({
                CM: request.data.CM,
                Site: request.data.Site,
                Program: request.data.Program
            })).then((response) => {
                if (response.length >= 1) {
                    record.Error = "Duplicate Entry";
                    request.reject(400, JSON.stringify(record));
                }
            });
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.before("POST", CarryoverSubline, async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Subline: POST CarryoverSubline' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG": LOG };
            }
            LOG.info(`In before event of POST action for Subline`);
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let record1 = {};
            const tx = hdb.tx();
            record1.CM = "";
            record1.Site = "";
            record1.Program = request.data.Program;
            record1.Sub_Line_Name = request.data.Sub_Line_Name;
            record1.Uph = request.data.Uph;
            record1.Error = '';
            record1.GH_Site = request.data.GH_Site;
            record1 = await fetch_cmsite(record1, tx);
            if (record1.Error) {
                request.reject(400, JSON.stringify(record1));
            }
            request.data.CM = record1.CM;
            request.data.Site = record1.Site;
            request.data.SAP_CM_Site = record1.SAP_CM_Site;
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            let allowed_cmsite = [];
            allowed_cmsite = allowedAttributes[`SubLineModify`];
            request.data.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.createdBy_mail = jwtdetails.email;
            request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.modifiedBy_mail = jwtdetails.email;
            record1.Error = AuthorizationCheck(record1, allowed_cmsite);
            if (record1.Error === "" || typeof record1.Error === "undefined") {
                record1.Error = await validate_data(record1, tx);
                record1.Error = await validate_sublinename(record1, tx);
            }
            record1.Error = check_data(request.data, record1.Error);
            if (record1.Error) {
                request.reject(400, JSON.stringify(record1));
            }

            await cds.run(SELECT.from(CarryoverSubline).columns('CM as CM').where({
                CM: request.data.CM,
                Site: request.data.Site,
                Program: request.data.Program,
                Sub_Line_Name: request.data.Sub_Line_Name,
                Uph: request.data.Uph
            })).then((response) => {
                if (response.length >= 1) {
                    record1.Error = "Duplicate Entry";
                    request.reject(400, JSON.stringify(record1));
                }
            });
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.on("PUT", [Upload_MainLine, Upload_SubLine], async (request) => {
        const LOG = request.req.params["LOG"];
        LOG.info(`In On Event of File Upload Action`);
        await waitFor(() => completed === true).then(() => {
            LOG.info(`The wait is over!`);
            if (!somethingToInsert) {
                LOG.info(`Incorrect File Format`);
            } else {
                LOG.info(`Records uploaded successfully`);
            }
        });
    });

    srv.before("PUT", Upload_MainLine, async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Mainline: PUT Upload_MainLine' });
        if (typeof (request.req.params.uuid) === "undefined") {
            request.req.params = { "uuid": uuid, "user": request.user.id,"LOG" : LOG };
        }
        LOG.info(`In Before event of UPLOAD Mainline action`);
        const tx = hdb.tx();
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`MainLineModify`];
        completed = false;
        const {
            Readable
        } = require("stream");
        LOG.info(`Starting of Upload action`);
        let MainLine_final = [];
        let Record_M = {};
        Record_M.GHSite = [];
        Record_M.Program = [];
        Record_M.MainLine = [];
        let DB_data = {};
        DB_data.GHSite = [];
        DB_data.Program = [];
        DB_data.Mainline = [];
        let Mainline_Err = [];
        let readable;
        if (process.env.NODE_ENV !== 'test') {
            readable = Readable.from(request.data.csv);
        } else {
            let filename = "/home/user/projects/220914-coa-platform-api/coa-lineplan/tests/MainLine.csv";
            readable = fs.createReadStream(filename);
        }
        readable
            .pipe(csv())
            .on("data", async function (csvrow) {
                try {
                    Record_M = collect_mainlinedata(csvrow, Record_M);
                }
                catch (err) {
                    LOG.info(`Error: ${JSON.stringify(err)}`);
                }
            })
            .on("finish", async function () {
                try {
                    let flag = checkiflimitexceeds(Record_M.MainLine, request);
                    if (!flag) {
                        if (Record_M.MainLine.length > 0) {
                            somethingToInsert = true;
                            DB_data = await get_dbdata(tx, Record_M, DB_data, "Mainline");
                            await Promise.all(Record_M.MainLine.map(async (record) => {
                                record = fill_cmsite(record, DB_data, jwtdetails, request);
                                record.Error = Validate_Mainlinerecord(record, allowed_cmsite, DB_data);
                                MainLine_final = append_record(record, MainLine_final, Mainline_Err, '');
                                Mainline_Err = append_record(record, MainLine_final, Mainline_Err, 'Error');
                            }));
                            await insert_data(MainLine_final, tx, 'COM_APPLE_COA_T_COA_MAIN_LINE', "T_COA_MAIN_LINE", request);
                            completed = true;
                            let message = get_msg(Mainline_Err, "");
                            request._.res.send({ msg: message });
                        }
                        else {
                            LOG.info(`Incorrect File Format`);
                            somethingToInsert = false;
                            completed = true;
                            request._.res.send({ msg: "Incorrect File Format" });
                        }
                    }
                }
                catch (error) {
                    tx.rollback(error);
                    LOG.info(`Error: ${JSON.stringify(error)}`);
                    return `Error: ${JSON.stringify(error)} `;
                }
            }
            );
    });

    function append_record(record, Final_A, Error_A, record_type) {
        if (record_type === 'Error') {
            if (record.Error) {
                Error_A.push(record);
            }
            return Error_A;
        } else {
            if (record.Error === "") {
                delete record.Error;
                Final_A.push(record);
            }
            return Final_A;
        }
    }

    function checkiflimitexceeds(Records, request) {
        if (Records.length > 10000) {
            request._.res.send({ msg: `File upload is allowed only for 10k records` });
            return true;
        }
        return false;
    }

    function get_msg(Err_records, action) {
        if (Err_records.length > 0) {
            return Err_records;
        } else {
            return action ? "Data Updated Successfully" : "Data Uploaded Successfully";
        }
    }

    function fill_cmsite(record, DB_data, jwtdetails, request) {
        const index = DB_data.GHSite.findIndex(e1 => e1.GH_Site === record.GH_Site);
        if (index < 0) {
            record.Error = record.Error === "" ? `Invalid From Function Location` : record.Error;
        } else {
            record.CM = DB_data.GHSite[index].CM;
            record.Site = DB_data.GHSite[index].Site;
            record.SAP_CM_Site = `${record.CM}-${record.Site}`;
        }
        record.createdAt = new Date().toISOString();
        record.createdBy = request.user.id;
        record.modifiedAt = new Date().toISOString();
        record.modifiedBy = request.user.id;
        record.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
        record.createdBy_mail = jwtdetails.email;
        record.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
        record.modifiedBy_mail = jwtdetails.email;
        return record;
    }

    async function get_dbdata(tx, Record, DB_data, application) {
        if (Record.GHSite.length > 0) {
            DB_data.GHSite = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('GH_Site as GH_Site', 'CM as CM', 'Site as Site').where({
                GH_Site: { in: Record.GHSite }
            }));
        }
        if (Record.Program.length > 0) {
            DB_data.Program = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('Program as Program').where({
                Program: { in: Record.Program }
            }));
        }
        if (application === "Mainline") {
            if (Record.Program.length > 0 && Record.GHSite.length > 0 ) {
                DB_data.Mainline = await tx.run(SELECT.distinct.from(CarryoverMainline).where({
                    GH_Site: { in: Record.GHSite },
                    Program: { in: Record.Program }
                }));
            }
        } else {
            if (Record.Program.length > 0 && Record.GHSite.length > 0 && Record.Sub_Line_Name.length > 0 && Record.Uph.length > 0) {
                DB_data.SubLine = await tx.run(SELECT.distinct.from(CarryoverSubline).where({
                    GH_Site: { in: Record.GHSite },
                    Program: { in: Record.Program },
                    Sub_Line_Name: { in: Record.Sub_Line_Name },
                    Uph: { in: Record.Uph }
                }));
            }
            if (Record.Sub_Line_Name.length > 0) {
                DB_data.Sub_Line_Name = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").columns('Line as Sub_Line_Name').where({
                    Line: { in: Record.Sub_Line_Name }
                }));
            }
        }
        return DB_data;
    }

    srv.before("PUT", Upload_SubLine, async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid , { label: 'COA Subline: PUT Upload_SubLine' });
        if (typeof (request.req.params.uuid) === "undefined") {
            request.req.params = { "uuid": uuid, "user": request.user.id, "LOG":LOG };
        }
        LOG.info(`In Before event of UPLOAD Subline action`);
        const tx = hdb.tx();
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`SubLineModify`];
        completed = false;
        const {
            Readable
        } = require("stream");
        LOG.info(`Upload action starting`);
        let SubLine_final = [];
        let Record_S = {};
        Record_S.GHSite = [];
        Record_S.Program = [];
        Record_S.Sub_Line_Name = [];
        Record_S.Uph = [];
        Record_S.SubLine = [];
        let DB_data = {};
        DB_data.GHSite = [];
        DB_data.Program = [];
        DB_data.Sub_Line_Name = [];
        DB_data.SubLine = [];
        let Subline_Err = [];
        let readable;
        if (process.env.NODE_ENV !== 'test') {
            readable = Readable.from(request.data.csv);
        } else {
            let filename = "/home/user/projects/220914-coa-platform-api-main/coa-lineplan/tests/SubLine.csv";
            readable = fs.createReadStream(filename);

        }
        readable
            .pipe(csv())
            .on("data", async function (csvrow) {
                try {
                    Record_S = collect_sublinedata(csvrow, Record_S);
                }
                catch (err) {
                    LOG.info(`Error: ${JSON.stringify(err)}`);
                }
            })
            .on("finish", async function () {
                try {
                    let flag = checkiflimitexceeds(Record_S.SubLine, request);
                    if (!flag) {
                        if (Record_S.SubLine.length > 0) {
                            somethingToInsert = true;
                            DB_data = await get_dbdata(tx, Record_S, DB_data, "Subline");
                            await Promise.all(Record_S.SubLine.map(async (record) => {
                                record = fill_cmsite(record, DB_data, jwtdetails, request);
                                record.Error = Validate_Sublinerecord(record, allowed_cmsite, DB_data);
                                SubLine_final = append_record(record, SubLine_final, Subline_Err, '');
                                Subline_Err = append_record(record, SubLine_final, Subline_Err, 'Error');
                            }));
                            await insert_data(SubLine_final, tx, 'COM_APPLE_COA_T_COA_SUBLINE', "T_COA_SUBLINE", request);
                            completed = true;
                            let message = get_msg(Subline_Err, "");
                            request._.res.send({ msg: message });
                        }
                        else {
                            LOG.info(`Incorrect File Format`);
                            somethingToInsert = false;
                            completed = true;
                            request._.res.send({
                                msg: "Incorrect File Format",
                            });
                        }
                    }
                }
                catch (error) {
                    tx.rollback(error);
                    LOG.info(`Error while inserting the data to DB`);
                    return `Error: ${JSON.stringify(error)} `;
                }
            });
    });

    srv.before("GET", "F4help", async (request) => {
        const uuid = getuuid(request); 
        const LOG = cds.log(uuid, { label: 'COA Lineplan Apps: GET F4help' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG": LOG };
            }
            cds.env.features.kibana_formatter = true

            LOG.info(`Check Authorization before getting F4help values on before event`);
           
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            if (request.query.SELECT.columns[0].ref[0] === "Mainline_Site" || request.query.SELECT.columns[0].ref[0] === "Mainline_Program" || request.query.SELECT.columns[0].ref[0] === "Mainline_CM") {
                const role = jwtdetails.scope.find(e => e.includes(".MainLineReadOnly"));
                if (typeof (role) === "undefined") {
                    LOG.info(`User doesn't have access to read Mainline records`);
                    request.reject(400, `${request.req.params.uuid} - User doesn't have access to read Mainline records`);
                }
            }
            if (request.query.SELECT.columns[0].ref[0] === "Subline_CM" || request.query.SELECT.columns[0].ref[0] === "Subline_Site" || request.query.SELECT.columns[0].ref[0] === "Subline_Program" || request.query.SELECT.columns[0].ref[0] === "Sub_Line_Name" || request.query.SELECT.columns[0].ref[0] === "Sub_Line_Name_org") {
                const role1 = jwtdetails.scope.find(e => e.includes(".SubLineReadOnly"));
                if (typeof (role1) === "undefined") {
                    LOG.info(`User doesn't have access to read Subline records`);
                    request.reject(400, `${request.req.params.uuid} - User doesn't have access to read Subline records`);
                }
            }
            if (request.query.SELECT.columns[0].ref[0] === "Lineplan_CM" || request.query.SELECT.columns[0].ref[0] === "Lineplan_Site" || request.query.SELECT.columns[0].ref[0] === "Lineplan_Program" || request.query.SELECT.columns[0].ref[0] === "Lineplan_Sub_Line_Name") {
                const role2 = jwtdetails.scope.find(e => e.includes(".LinePlanReadOnly"));
                if (typeof (role2) === "undefined") {
                    LOG.info(`User doesn't have access to read Lineplan records`);
                    request.reject(400, `${request.req.params.uuid} - User doesn't have access to read Lineplan records`);
                }
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify("Invalid Value")}`);
            return `Error: ${JSON.stringify("Invalid Value")} `;
        }
    });

    srv.on("GET", "F4help", async (request) => {
        const LOG = request.req.params["LOG"];
        LOG.info(`In On event of GET action of F4Help entity`);
        try {
            const dropdown_array = await getDropDownArray(request);
            request.results = dropdown_array;
        } catch (error) {
            LOG.info(`Error: ${error}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function fetchdata(allowedAttributes, field, change, search, db, header) {
        let top = header.top, skip = header.skip;
        let dropdown_array = [];
        let whereclause = getFilterString(allowedAttributes);
        if (search) {
            let regex = /\*+/g;
            search = search.replace(regex, `%`);
            regex = /_/g
            search = search.replace(regex, `\\_`);
            whereclause = whereclause ? `((${whereclause}) and (${field} like '%${search}%' escape '\\'))` : `(${field} like '%${search}%' escape '\\')`;
        }
        if (whereclause) {
            whereclause = `(${whereclause}) and (${field} is not null) and (${field}<>'')`;
            let parsedFilters = cds.parse.expr(`(${whereclause})`);
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${field} as ${change}`).where(parsedFilters).limit(top, skip)
            );
        } else {
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${field} as ${change}`).where(`(${field} is not null) and not(${field}='')`).limit(top, skip)
            );
        }
        return dropdown_array;
    }

    async function getDropDownArray(request) {
        let search;
        let result_array = [];
        if (request._query.$search) {
            search = request._query.$search.replace(/"/g, ``);
        }
        const change = request.query.SELECT.columns[0].ref[0];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        if (top) {
            top = top.includes("infinity") ? 1000 : top;
        }
        let header = {"top":top, "skip": skip, "LOG":request.req.params["LOG"]};
        switch (change) {
            case 'Mainline_Program':
                allowedAttributes['MainLineReadOnly'] = merge(allowedAttributes['MainLineReadOnly'], allowedAttributes['MainLineModify']);
                result_array = await fetchdata(allowedAttributes['MainLineReadOnly'], 'Program', change, search, CarryoverMainline, header);
                break;
            case 'Mainline_GH_Site':
                allowedAttributes['MainLineReadOnly'] = merge(allowedAttributes['MainLineReadOnly'], allowedAttributes['MainLineModify']);
                result_array = await fetchdata(allowedAttributes['MainLineReadOnly'], 'GH_Site', change, search, CarryoverMainline, header);
                break;
            case 'Subline_Program':
                allowedAttributes['SubLineReadOnly'] = merge(allowedAttributes['SubLineReadOnly'], allowedAttributes['SubLineModify']);
                result_array = await fetchdata(allowedAttributes['SubLineReadOnly'], 'Program', change, search, CarryoverSubline, header);
                break;
            case 'Sub_Line_Name_org':
                allowedAttributes['SubLineReadOnly'] = merge(allowedAttributes['SubLineReadOnly'], allowedAttributes['SubLineModify']);
                result_array = await fetchdata(allowedAttributes['SubLineReadOnly'], 'Line', change, search, "COM_APPLE_COA_T_COA_LINE_SUMMARY", header);
                break;
            case 'Sub_Line_Name':
                allowedAttributes['SubLineReadOnly'] = merge(allowedAttributes['SubLineReadOnly'], allowedAttributes['SubLineModify']);
                result_array = await fetchdata(allowedAttributes['SubLineReadOnly'], 'Sub_Line_Name', change, search, CarryoverSubline, header);
                break;
            case 'Subline_GH_Site':
                allowedAttributes['SubLineReadOnly'] = merge(allowedAttributes['SubLineReadOnly'], allowedAttributes['SubLineModify']);
                result_array = await fetchdata(allowedAttributes['SubLineReadOnly'], 'GH_Site', change, search, CarryoverSubline, header);
                break;
            case 'Lineplan_Program':
                result_array = await fetchdata(allowedAttributes['LinePlanReadOnly'], 'Program', change, search, CarryoverLineplan, header);
                break;
            case 'Lineplan_Sub_Line_Name':
                result_array = await fetchdata(allowedAttributes['LinePlanReadOnly'], 'Sub_Line_Name', change, search, CarryoverLineplan, header);
                break;
            case 'Lineplan_GH_Site':
                result_array = await fetchdata(allowedAttributes['LinePlanReadOnly'], 'GH_Site', change, search, CarryoverLineplan, header);
                break;
            default:
                break;
        }
        return result_array;
    }

    function waitFor(conditionFunction) {
        const poll = (resolve) => {
            if (conditionFunction()) resolve();
            // eslint-disable-next-line no-unused-vars
            else setTimeout((_) => poll(resolve), 400);
        };
        return new Promise(poll);
    }

    function getuuid(request) {
        return (request && request?.headers['x-correlationid'])?request.headers['x-correlationid'] :cds.utils.uuid();
    }

    function collect_sublinedata(csvrow, Record_S) {
        let SubLine =
        {
            CM: "",
            Site: "",
            Program: csvrow.Program.toUpperCase(),
            Sub_Line_Name: csvrow.Sub_Line_Name,
            Uph: isNaN(Number(csvrow.Uph)) ? csvrow.Uph : Number(csvrow.Uph),
            boH_Qty: isNaN(Number(csvrow.boH_Qty)) ? csvrow.boH_Qty : Number(csvrow.boH_Qty),
            Working_Hrs: isNaN(Number(csvrow.Working_Hrs)) ? csvrow.Working_Hrs : Number(csvrow.Working_Hrs),
            Remote_Site_Cap_Demand: isNaN(Number(csvrow.Remote_Site_Cap_Demand)) ? csvrow.Remote_Site_Cap_Demand : Number(csvrow.Remote_Site_Cap_Demand),
            Yield: isNaN(Number(csvrow.Yield)) ? csvrow.Yield : Number(csvrow.Yield),
            Comment: csvrow.Comment,
            SAP_CM_Site: "",
            GH_Site: csvrow.GH_Site,
            Error: ''
        };
        if (SubLine.GH_Site && SubLine.Program && SubLine.Sub_Line_Name) {
            let uniquekey;
            if (Record_S.SubLine.length > 0) {
                uniquekey = Record_S.SubLine.find(e => e.GH_Site === SubLine.GH_Site && e.Program === SubLine.Program && e.Sub_Line_Name === SubLine.Sub_Line_Name && e.Uph === SubLine.Uph);
            }
            if (typeof uniquekey !== "undefined") {
                SubLine.Error = "Duplicate entries in file";
            }
            Record_S.GHSite = Append_IfUnique(Record_S.GHSite, SubLine.GH_Site);
            Record_S.Program = Append_IfUnique(Record_S.Program, SubLine.Program);
            Record_S.Sub_Line_Name = Append_IfUnique(Record_S.Sub_Line_Name, SubLine.Sub_Line_Name);
            Record_S.Uph = Append_IfUnique(Record_S.Uph, SubLine.Uph);
        }else{
            SubLine.Error = "Key fields are mandatory";
        }
            Record_S.SubLine.push(SubLine);
        return Record_S;
    }

    function Validate_Mainlinerecord(record, allowed_cmsite, DB_data) {
        record.Error = AuthorizationCheck(record, allowed_cmsite);
        if (record.Error === "" || typeof record.Error === "undefined") {
            const index1 = DB_data.Mainline.findIndex(e1 => e1.CM === record.CM && e1.Site === record.Site && e1.Program === record.Program );
            if (index1 >= 0) {
                record.Error = "Entry already exists";
            }
            record.Error = data_validation(record, DB_data, "");
        }
        return record.Error;
    }

    function data_validation(record, DB_data, application) {
        if (record.Error === "") {
            const index1 = DB_data.Program.findIndex(e1 => e1.Program === record.Program);
            if (index1 < 0) {
                record.Error = record.Error ?  `${record.Error} and Program` : `Invalid Program`;
            }
            if (application === "Subline") {
                const index2 = DB_data.Sub_Line_Name.findIndex(e1 => e1.Sub_Line_Name === record.Sub_Line_Name);
                if (index2 < 0) {
                    record.Error = record.Error ?  `${record.Error} and Sub-Line Name` : `Invalid Sub-Line Name`;
                }
            }
            record.Error = check_data(record, record.Error);
        }
        return record.Error;
    }

    function collect_mainlinedata(csvrow, Record_M) {
        let MainLine =
        {
            Site: "",
            Program: csvrow.Program.toUpperCase(),
            CM: "",
            Uph: isNaN(Number(csvrow.Uph)) ? csvrow.Uph : Number(csvrow.Uph),
            BoH: isNaN(Number(csvrow.BoH)) ? csvrow.BoH : Number(csvrow.BoH),
            Fatp_Sustaining_Qty: isNaN(Number(csvrow.Fatp_Sustaining_Qty)) ? csvrow.Fatp_Sustaining_Qty : Number(csvrow.Fatp_Sustaining_Qty),
            Working_Hrs: isNaN(Number(csvrow.Working_Hrs)) ? csvrow.Working_Hrs : Number(csvrow.Working_Hrs),
            Efficiency_Field: isNaN(Number(csvrow.Efficiency_Field)) ? csvrow.Efficiency_Field : Number(csvrow.Efficiency_Field),
            Comment: csvrow.Comment,
            SAP_CM_Site: "",
            GH_Site: csvrow.GH_Site,
            Error: ''
        };
        if (MainLine.GH_Site && MainLine.Program ) {
            let uniquekey;
            if (Record_M.MainLine.length > 0) {
                uniquekey = Record_M.MainLine.find(data => data.GH_Site === MainLine.GH_Site && data.Program === MainLine.Program );
            }
            if (typeof uniquekey !== "undefined") {
                MainLine.Error = "Duplicate entries in the file";
            }
            Record_M.GHSite = Append_IfUnique(Record_M.GHSite, MainLine.GH_Site);
            Record_M.Program = Append_IfUnique(Record_M.Program, MainLine.Program);
        }else{
            MainLine.Error = "Key fields are mandatory";
        }
            Record_M.MainLine.push(MainLine);
        return Record_M;
    }

    function Append_IfUnique(Record, field) {
        const index = Record.findIndex(e => e === field);
        if (index < 0) {
            Record.push(field);
        }
        return Record;
    }

    function Validate_Sublinerecord(record, allowed_cmsite, DB_data) {
        record.Error = AuthorizationCheck(record, allowed_cmsite);
        if (record.Error === "" || typeof record.Error === "undefined") {
            const index = DB_data.SubLine.findIndex(e1 => e1.CM === record.CM && e1.Site === record.Site && e1.Program === record.Program && e1.Sub_Line_Name === record.Sub_Line_Name && e1.Uph === record.Uph);
            if (index >= 0) {
                record.Error = "Entry already exists";
            }
            if (record.Error === "" || typeof record.Error === "undefined") {
                record.Error = data_validation(record, DB_data, "Subline");
            }
        }
        return record.Error;
    }

    async function validate_data(record, tx) {
        if (record.Error === "" || typeof record.Error === "undefined") {
            await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('CM as CM').where({
                CM: record.CM,
                Site: record.Site,
            })).then(async (response) => {
                if (response.length < 1) {
                    record.Error = "Invalid CM-Site Combination";
                }
            });
            await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('CM as CM').where({
                Program: record.Program
            })).then(async (response) => {
                if (response.length < 1) {
                    if (record.Error) {
                        record.Error = record.Error + " and Program";
                    } else {
                        record.Error = "Invalid Program";
                    }
                }
            });
        }
        return record.Error;
    }

    async function validate_sublinename(record, tx) {
        await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_LINE_SUMMARY").columns('CM as CM').where({
            Line: record.Sub_Line_Name
        })).then(async (response) => {
            if (response.length < 1) {
                if (record.Error) {
                    record.Error = record.Error + " and Invalid Sub-Line Name";
                } else {
                    record.Error = "Invalid Sub-Line Name";
                }
            }
        });
        return record.Error;
    }

    srv.after("POST", CarryoverMainline, async (request, body) => {
        const LOG = body.req.params.LOG;
        try {
            LOG.info(`In after Event of POST action for CarryoverMainline `);
            let old_record = [];
            let old_records = [];
            let new_record = [];
            let new_records = [];
            old_record = mainline_data('');
            old_records.push(old_record);
            new_record = mainline_data(request);
            new_records.push(new_record);
            update_changelog("T_COA_MAIN_LINE", new_records, old_records, "INSERT", body);
        } catch (error) {
            LOG.info(`UUID: ${body.req.params.uuid}, Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    srv.after("PUT", CarryoverSubline, async (request, body) => {
        const LOG = body.req.params.LOG;
        try {
            LOG.info(`In after Event of PUT action for CarryoverSubline `);
            if (before_data_s.length > 0) {
                await cds.run(SELECT.from(CarryoverSubline).where({
                    Site: request.Site,
                    CM: request.CM,
                    Program: request.Program,
                    Sub_Line_Name: request.Sub_Line_Name,
                    Uph : request.Uph
                })).then(async (response) => {
                    if (response.length > 0) {
                        let old_record = [];
                        let old_records = [];
                        let new_record = [];
                        let new_records = [];
                        const index = before_data_s.findIndex(e1 => e1.Site === request.Site && e1.CM === request.CM && e1.Program === request.Program && e1.Sub_Line_Name === request.Sub_Line_Name  && e1.Uph === request.Uph && e1.uuid === body.req.params.uuid);
                        if (index >= 0) {
                            old_record = subline_data(before_data_s[index]);
                            old_records.push(old_record);
                            before_data_s.splice(index, 1);
                            new_record = subline_data(response[0]);
                            new_records.push(new_record);
                            update_changelog("T_COA_SUBLINE", new_records, old_records, "UPDATE", body);
                        }
                    }
                });
            }
        }
        catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    srv.before("DELETE", CarryoverSubline, async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Subline: DELETE CarryoverSubline' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG":LOG };
            }
            LOG.info(`In before event of DELETE action for CarryoverSubline`);
            let record1 = {};
            record1.CM = request.data.CM;
            record1.Site = request.data.Site;
            record1.Program = request.data.Program;
            record1.Sub_Line_Name = request.data.Sub_Line_Name;
            record1.Uph = request.data.Uph;
            record1.Error = '';
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            let allowed_cmsite = [];
            allowed_cmsite = allowedAttributes[`SubLineModify`];
            record1.Error = AuthorizationCheck(record1, allowed_cmsite);
            if (record1.Error) {
                request.reject(400, JSON.stringify(record1));
            }
            request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.modifiedBy_mail = jwtdetails.email;
        }
        catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    srv.before("DELETE", CarryoverMainline, async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Mainline: DELETE CarryoverMainline' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id , "LOG":LOG};
            }
            LOG.info(`In before event of DELETE action for CarryoverMainline`);
            let record = {};
            record.CM = request.data.CM;
            record.Site = request.data.Site;
            record.Program = request.data.Program;
            record.Error = '';
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            let allowed_cmsite = [];
            allowed_cmsite = allowedAttributes[`MainLineModify`];
            record.Error = AuthorizationCheck(record, allowed_cmsite);
            if (record.Error) {
                request.reject(400, JSON.stringify(record));
            }
            request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.modifiedBy_mail = jwtdetails.email;
        }
        catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    srv.before("PUT", CarryoverSubline, async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Subline: PUT CarryoverSubline' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG":LOG };
            }
            LOG.info(`In before event of PUT action for CarryoverSubline`);
            let record1 = {};
            record1.CM = request.data.CM;
            record1.Site = request.data.Site;
            record1.Program = request.data.Program;
            record1.Sub_Line_Name = request.data.Sub_Line_Name;
            record1.Uph = request.data.Uph;
            record1.Error = '';
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            let allowed_cmsite = [];
            allowed_cmsite = allowedAttributes[`SubLineModify`];
            record1.Error = AuthorizationCheck(record1, allowed_cmsite);
            record1.Error = check_data(request.data, record1.Error);
            if (record1.Error) {
                request.reject(400, JSON.stringify(record1));
            }
            request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.modifiedBy_mail = jwtdetails.email;
            await cds.run(SELECT.from(CarryoverSubline).where({
                Site: request.data.Site,
                CM: request.data.CM,
                Program: request.data.Program,
                Sub_Line_Name: request.data.Sub_Line_Name,
                Uph : request.data.Uph
            })).then(async (res) => {
                if (res.length > 0) {
                    res[0].uuid = request.req.params.uuid;
                    before_data_s.push(res[0]);
                }
            });
        }
        catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    srv.after("PUT", CarryoverMainline, async (request, body) => {
        const LOG = body.req.params.LOG;
        try {
            LOG.info(`In after Event of PUT action for CarryoverMainline `);
            if (before_data_m.length > 0) {
                await cds.run(SELECT.from(CarryoverMainline).where({
                    Site: request.Site,
                    CM: request.CM,
                    Program: request.Program
                })).then(async (response) => {
                    if (response.length > 0) {
                        let old_record = [];
                        let old_records = [];
                        let new_record = [];
                        let new_records = [];
                        const index = before_data_m.findIndex(e1 => e1.Site === request.Site && e1.CM === request.CM && e1.Program === request.Program && e1.uuid === body.req.params.uuid);
                        if (index >= 0) {
                            old_record = mainline_data(before_data_m[index]);
                            old_records.push(old_record);
                            before_data_m.splice(index, 1);
                            new_record = mainline_data(response[0]);
                            new_records.push(new_record);
                            update_changelog("T_COA_MAIN_LINE", new_records, old_records, "UPDATE", body);
                        }
                    }
                });
            }
        }
        catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    srv.before("PUT", CarryoverMainline, async (request) => {
        
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Mainline: PUT CarryoverMainline' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG" : LOG };
            }
            LOG.info(`In before event of PUT action for CarryoverMainline `);
            let record = {};
            record.CM = request.data.CM;
            record.Site = request.data.Site;
            record.Program = request.data.Program;
            record.Error = '';
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            let allowed_cmsite = [];
            allowed_cmsite = allowedAttributes[`MainLineModify`];
            request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            request.data.modifiedBy_mail = jwtdetails.email;
            record.Error = AuthorizationCheck(record, allowed_cmsite);
            await cds.run(SELECT.from(CarryoverMainline).where({
                Site: request.data.Site,
                CM: request.data.CM,
                Program: request.data.Program
            })).then(async (response) => {
                if (response.length > 0) {
                    response[0].uuid = request.req.params.uuid;
                    before_data_m.push(response[0]);
                    request = fill_db_data(response[0], request);
                }
            });
            record.Error = check_data(request.data, record.Error);
            if (record.Error) {
                request.reject(400, JSON.stringify(record));
            }
            await cds.run(SELECT.from(CarryoverMainline).where({
                Site: request.data.Site,
                CM: request.data.CM,
                Program: request.data.Program
            })).then(async (response) => {
                if (response.length > 0) {
                    response[0].uuid = request.req.params.uuid;
                    before_data_m.push(response[0]);
                }
            });
        }
        catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    function fill_db_data(data, request) {
        request.data.Fatp_Sustaining_Qty = (request.data.Fatp_Sustaining_Qty || request.data.Fatp_Sustaining_Qty === 0) ? request.data.Fatp_Sustaining_Qty : data.Fatp_Sustaining_Qty;
        request.data.BoH = (request.data.BoH || request.data.BoH === 0) ? request.data.BoH : data.BoH;
        return request;
    }

    srv.after("POST", CarryoverSubline, async (request, body) => {
        const LOG = body.req.params.LOG;
        try {
            LOG.info(`In after Event of POST action for CarryoverSubline`);
            let old_record = [];
            let old_records = [];
            let new_record = [];
            let new_records = [];
            old_record = subline_data('');
            old_records.push(old_record);
            new_record = subline_data(request);
            new_records.push(new_record);
            update_changelog("T_COA_SUBLINE", new_records, old_records, "INSERT", body);
        } catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
    });

    function update_changelog(TableName, new_records, old_records, action, request) {
        const LOG = request.req.params.LOG;
        LOG.info(`Call Changelog service to update the changes to Changelog table`);
        try{
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
            if (process.env.NODE_ENV !== 'test') {
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
        }catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    }

    async function insert_data(data, tx, db, TableName, request) {
        const LOG = request.req.params.LOG;
        if (data.length > 0) {
            try{
                await tx.run(INSERT.into(db).entries(data));
                await tx.commit();
            }catch (error) {
                await tx.rollback();
                LOG.info(`Error: ${JSON.stringify(error)}`);
                return `Error: ${JSON.stringify(error)} `;
            }
            let new_records = [];
            let old_records = [];
            if (TableName === "T_COA_SUBLINE") {
                data.forEach(element => {
                    let old_record = [];
                    let new_record = [];
                    old_record = subline_data('');
                    old_records.push(old_record);
                    new_record = subline_data(element);
                    new_records.push(new_record);
                });
            }
            else {
                data.forEach(element => {
                    let old_record = [];
                    let new_record = [];
                    old_record = mainline_data('');
                    old_records.push(old_record);
                    new_record = mainline_data(element);
                    new_records.push(new_record);
                });
            }
            update_changelog(TableName, new_records, old_records, "INSERT", request);
        }
        else {
            LOG.info(`Nothing to Insert`);
            somethingToInsert = false;
        }
    }

    function mainline_data(request) {
        let record = [];
        if (request) {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.CM);
            record.push(request.Site);
            record.push(request.Program);
            record.push(request.Uph);
            record.push(request.BoH);
            record.push(request.Fatp_Sustaining_Qty);
            record.push(request.Working_Hrs);
            record.push(request.Efficiency_Field);
            record.push(request.Comment);
            record.push(request.SAP_CM_Site);
            record.push(request.GH_Site);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
        } else {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(0);
            record.push(0);
            record.push(0);
            record.push(0);
            record.push(0);
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

    function subline_data(request) {
        let record = [];
        if (request) {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.CM);
            record.push(request.Site);
            record.push(request.Program);
            record.push(request.Sub_Line_Name);
            record.push(request.Uph);
            record.push(request.Yield);
            record.push(request.boH_Qty);
            record.push(request.Working_Hrs);
            record.push(request.Remote_Site_Cap_Demand);
            record.push(request.Comment);
            record.push(request.SAP_CM_Site);
            record.push(request.GH_Site);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
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
            record.push(0);
            record.push(0);
            record.push(0);
            record.push(0);
            record.push(0);
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

    async function fetch_cmsite(record, tx) {
        await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('CM as CM', 'Site as Site').where({
            GH_Site: record.GH_Site
        })).then(async (response) => {
            if (response.length < 1) {
                record.Error = "Invalid Function Location";
            } else {
                record.CM = response[0].CM;
                record.Site = response[0].Site;
                record.SAP_CM_Site = `${record.CM}-${record.Site}`;
            }
        });
        return record;
    }

    srv.before("POST", [mainline_action, subline_action], async (request) => {

        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA: POST Action' }); 
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG": LOG };
            }
            LOG.info(`In Before event of Mass Update Action`);
            let authFailed = await checkAuthorization(request.headers.authorization);
            if (authFailed) {
                LOG.info(`User is missing Authorization. They are not assigned any CM/Site`);
                request.reject(400, 'User is missing Authorization. They are not assigned any CM/Site');
            }
            if (request.data.URL) {
                let err = check_data(request.data, '');
                if (err) {
                    LOG.info(`${err}`);
                    request.reject(400, err);
                }
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function checkAuthorization(authData) {
        const jwtdetails = (jwtDecode(String(authData).slice(7)));
        const allowedAttributes = jwtdetails['xs.user.attributes'];
        if (allowedAttributes === null ||
            (allowedAttributes.CM === null || allowedAttributes.CM.length === 0) ||
            (allowedAttributes.Site === null || allowedAttributes.Site.length === 0)) {
            return true;

        }
    }

    srv.on("POST", mainline_action, async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On event of Mainline_Action - Mass Update Action`);
        const tx = hdb.tx();
        try {
            if (request.data.URL) {
                const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
                let allowedAttributes = getallowedAttributes(jwtdetails, request);
                let filters = request.data.URL;
                filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' <> ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
                let regex = /contains\((\w+),‘(\w+)‘\)/g;
                filters = filters.replace(regex, `($1 like ‘%$2%’)`);
                let filterString = getFilterString(allowedAttributes[`MainLineModify`]);
                filters = filterString ? `(${filterString}) and ${filters}` : filters;
                let update_body = {};
                let changelog_data = {};
                changelog_data.new_records = [];
                changelog_data.old_records = [];
                update_body = build_upd_struc(request, update_body, jwtdetails);
                let before_update = await tx.run(SELECT.from(CarryoverMainline).where(cds.parse.expr(filters)));
                if (before_update.length > 5000) {
                    request.reject(400, 'Mass Update is allowed only for 5k records');
                }
                await tx.run(UPDATE('COM_APPLE_COA_T_COA_MAIN_LINE').with(update_body).where(cds.parse.expr(filters)));
                await tx.commit();
                const tx1 = hdb.tx();
                let after_update = await tx1.run(SELECT.from(CarryoverMainline).where(cds.parse.expr(filters)));
                after_update.forEach(data => {
                    let old_record = [];
                    let new_record = [];
                    const index = before_update.findIndex(e => e.CM === data.CM && e.Site === data.Site && e.Program === data.Program );
                    if (index >= 0) {
                        old_record = mainline_data(before_update[index]);
                        changelog_data.old_records.push(old_record);
                        new_record = mainline_data(data);
                        changelog_data.new_records.push(new_record);
                    }
                });
                if (changelog_data.new_records.length > 0) {
                    update_changelog("T_COA_MAIN_LINE", changelog_data.new_records, changelog_data.old_records, "UPDATE", request);
                }
                changelog_data = {};
                request._.res.send({ msg: `Data updated Successfully` });
            } else {
                if (request.data.Mainlinedata.length > 5000) {
                    request.reject(400, 'Mass Update is allowed only for 5k records');
                }
                let Mainline_Err = await block_mass_update(request, tx, 'COM_APPLE_COA_T_COA_MAIN_LINE', "T_COA_MAIN_LINE", request.data.Mainlinedata);
                let message = get_msg(Mainline_Err, "Massupdate");
                request._.res.send({ msg: message });
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function block_mass_update(request, tx, db, table, data_array) {
        let range = {};
        range.CM = [];
        range.Site = [];
        range.Program = [];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        if (table === 'T_COA_SUBLINE') {
            range.Uph = [];
            range.Sub_Line_Name = [];
            allowed_cmsite = allowedAttributes[`SubLineModify`];
        } else {
            allowed_cmsite = allowedAttributes[`MainLineModify`];
        }
        let result = [];
        let queries = [];
        let changelog_data = {};
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        let Err = [];
        range = get_range(data_array, range, table);
        result = await getdata(range, table, tx, result);
        data_array.forEach(data => {
            data.Error = "";
            let index;
            index = get_index(index, table, result, data);
            if (index >= 0) {
                data.Error = AuthorizationCheck(data, allowed_cmsite);
                data.Error = check_data(data, data.Error);
                if (data.Error === "") {
                    let old_record = [];
                    let new_record = [];
                    old_record = get_data_fr_changelog(table, result[index]);
                    changelog_data.old_records.push(old_record);
                    new_record = get_data_fr_changelog(table, data);
                    changelog_data.new_records.push(new_record);
                    queries = build_query(db, queries, data, table, request, jwtdetails);
                }
            } else {
                data.Error = `Entry does not exist for this key combination`;
            }
            if (data.Error) {
                Err.push(data);
            }
        });
        if (queries.length > 0) {
            await tx.run(queries);
        }
        await tx.commit();
        if (changelog_data.new_records.length > 0) {
            update_changelog(table, changelog_data.new_records, changelog_data.old_records, "UPDATE", request);
        }
        allowed_cmsite = [];
        result = [];
        queries = [];
        changelog_data = {};
        return Err;
    }

    function get_index(index, table, result, data) {
        if (table === 'T_COA_SUBLINE') {
            index = result.findIndex(e1 => e1.CM === data.CM && e1.Site === data.Site && e1.Program === data.Program && e1.Sub_Line_Name === data.Sub_Line_Name && e1.Uph === data.Uph);
        } else {
            index = result.findIndex(e1 => e1.CM === data.CM && e1.Site === data.Site && e1.Program === data.Program );
        }
        return index;
    }

    function get_data_fr_changelog(table, data) {
        return table === 'T_COA_MAIN_LINE' ? mainline_data(data) : subline_data(data);
    }

    function build_query(db, queries, data, table, request, jwtdetails) {
        if (table === 'T_COA_MAIN_LINE') {
            queries.push(UPDATE(db).set({
                Uph: data.Uph,
                BoH: data.BoH,
                Fatp_Sustaining_Qty: data.Fatp_Sustaining_Qty,
                Working_Hrs: data.Working_Hrs,
                Efficiency_Field: data.Efficiency_Field,
                Comment: data.Comment,
                modifiedAt: new Date().toISOString(),
                modifiedBy: request.user.id,
                modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                modifiedBy_mail: jwtdetails.email
            }).where({
                CM: data.CM,
                Site: data.Site,
                Program: data.Program
            }));
        } else {
            queries.push(UPDATE(db).set({
                boH_Qty: data.boH_Qty,
                Remote_Site_Cap_Demand: data.Remote_Site_Cap_Demand,
                Working_Hrs: data.Working_Hrs,
                Yield: data.Yield,
                Comment: data.Comment,
                modifiedAt: new Date().toISOString(),
                modifiedBy: request.user.id,
                modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
                modifiedBy_mail: jwtdetails.email
            }).where({
                CM: data.CM,
                Site: data.Site,
                Program: data.Program,
                Sub_Line_Name: data.Sub_Line_Name,
                Uph: data.Uph
            }));
        }
        return queries
    }

    async function getdata(range, table, tx, result) {
        if (table === 'T_COA_MAIN_LINE') {
            result = await tx.run(SELECT.from(CarryoverMainline).where(
                {
                    CM: { in: range.CM },
                    Site: { in: range.Site },
                    Program: { in: range.Program }
                }));
        } else {
            result = await tx.run(SELECT.from(CarryoverSubline).where(
                {
                    CM: { in: range.CM },
                    Site: { in: range.Site },
                    Program: { in: range.Program },
                    Sub_Line_Name: { in: range.Sub_Line_Name },
                    Uph : { in: range.Uph}
                }));
        }
        return result;
    }

    function get_range(data_array, range, table) {
        data_array.forEach(data => {
            range.CM = Append_IfUnique(range.CM, data.CM);
            range.Site = Append_IfUnique(range.Site, data.Site);
            range.Program = Append_IfUnique(range.Program, data.Program);
            if (table === 'T_COA_SUBLINE') {
                range.Uph = Append_IfUnique(range.Uph, data.Uph);
                range.Sub_Line_Name = Append_IfUnique(range.Sub_Line_Name, data.Sub_Line_Name);
            }
        });
        return range;
    }

    function check_data(record, error) {
        error = fill_error(error, record.BoH, "BOH");
        error = fill_error(error, record.Uph, "UPH");
        error = fill_error(error, record.Fatp_Sustaining_Qty, "Fatp Sustaining Qty");
        error = check_working_hrs(error, record.Working_Hrs);
        error = check_percentage(error, record.Efficiency_Field, "Efficiency");
        error = fill_error(error, record.boH_Qty, "BOH Qty");
        error = fill_error(error, record.Remote_Site_Cap_Demand, "Remote Site Cap Demand");
        error = check_percentage(error, record.Yield, "Yield");
        error = check_sustaining_qty(record.Fatp_Sustaining_Qty, record.BoH, error);
        return error;
    }

    function fill_error(error, field, msg) {
        let temp_err = '';
        if (field) {
            temp_err = containsOnlyNumbers(field) ? '' : `Invalid ${msg}`;
            if(temp_err){
                error = error ? `${error} and ${temp_err}`: temp_err;
            }
        }
        return error;
    }

    function check_percentage(error, field, msg) {
        let temp_err = '';
        if (field) {
            temp_err = containsOnlyNumbers(field) && ( field <= 100 ) ? '' : `${msg} should be less than or equal to 100 Percent`;
            if(temp_err){
                error = error ? `${error} and ${temp_err}`: temp_err;
            }
        }
        return error;
    }

    function check_sustaining_qty(field, field1, error) {
        let temp_err = '';
        if (field || field1) {
            temp_err = field > field1 ? 'FATP Sustaining Qty should be less then or equal to BOH' : ``;
            if(temp_err){
                error = error ? `${error} and ${temp_err}`: temp_err;
            }
        }
        return error;
    }

    function check_working_hrs(error, field) {
        let temp_err = '';
        if (field) {
            temp_err = containsOnlyNumbers(field) && field <= 24 ? '' : `Working hours should not be exceed 24 hours`;
            if(temp_err){
                error = error ? `${error} and ${temp_err}`: temp_err;
            }
        }
        return error;
    }

    function containsOnlyNumbers(str) {
        return /^\d+$/.test(str);
    }

    srv.on("POST", subline_action, async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On event of Subline_Action - Mass Update Action`);
        const tx = hdb.tx();
        try {
            if (request.data.URL) {
                const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
                let allowedAttributes = getallowedAttributes(jwtdetails, request);
                let filters = request.data.URL;
                filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' <> ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
                let regex = /contains\((\w+),‘(\w+)‘\)/g;
                filters = filters.replace(regex, `($1 like ‘%$2%’)`);
                let filterString = getFilterString(allowedAttributes[`SubLineModify`]);
                filters = filterString ? `(${filterString}) and ${filters}` : filters;
                let update_body = {};
                let changelog_data = {};
                changelog_data.new_records = [];
                changelog_data.old_records = [];
                update_body = build_upd_struc(request, update_body, jwtdetails);
                let before_update = await tx.run(SELECT.from(CarryoverSubline).where(cds.parse.expr(filters)));
                if (before_update.length > 5000) {
                    request.reject(400, 'Mass Update is allowed only for 5k records');
                }
                await tx.run(UPDATE('COM_APPLE_COA_T_COA_SUBLINE').with(update_body).where(cds.parse.expr(filters)));
                await tx.commit();
                const tx1 = hdb.tx();
                let after_update = await tx1.run(SELECT.from(CarryoverSubline).where(cds.parse.expr(filters)));
                after_update.forEach(data => {
                    let old_record = [];
                    let new_record = [];
                    const index = before_update.findIndex(e => e.CM === data.CM && e.Site === data.Site && e.Program === data.Program && e.Sub_Line_Name === data.Sub_Line_Name && e.Uph === data.Uph);
                    if (index >= 0) {
                        old_record = subline_data(before_update[index]);
                        changelog_data.old_records.push(old_record);
                        new_record = subline_data(data);
                        changelog_data.new_records.push(new_record);
                    }
                });
                if (changelog_data.new_records.length > 0) {
                    update_changelog("T_COA_SUBLINE", changelog_data.new_records, changelog_data.old_records, "UPDATE", request);
                }
                changelog_data = {};
                request._.res.send({ msg: `Data updated Successfully` });
            } else {
                if (request.data.Sublinedata.length > 5000) {
                    request.reject(400, 'Mass Update is allowed only for 5k records');
                }
                let Subline_Err = await block_mass_update(request, tx, 'COM_APPLE_COA_T_COA_SUBLINE', "T_COA_SUBLINE", request.data.Sublinedata);
                let message = get_msg(Subline_Err, "Massupdate");
                request._.res.send({ msg: message });
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });
    function build_upd_struc(request, update_body, jwtdetails) {
        if (check_if_filled(request.data.Uph)) {
            update_body.Uph = request.data.Uph;
        }
        if (check_if_filled(request.data.BoH)) {
            update_body.BoH = request.data.BoH;
        }
        if (check_if_filled(request.data.Fatp_Sustaining_Qty)) {
            update_body.Fatp_Sustaining_Qty = request.data.Fatp_Sustaining_Qty;
        }
        if (check_if_filled(request.data.Working_Hrs)) {
            update_body.Working_Hrs = request.data.Working_Hrs;
        }
        if (check_if_filled(request.data.Efficiency_Field)) {
            update_body.Efficiency_Field = request.data.Efficiency_Field;
        }
        if (request.data.Comment) {
            update_body.Comment = request.data.Comment;
        }
        if (check_if_filled(request.data.boH_Qty)) {
            update_body.boH_Qty = request.data.boH_Qty;
        }
        if (check_if_filled(request.data.Yield)) {
            update_body.Yield = request.data.Yield;
        }
        if (check_if_filled(request.data.Remote_Site_Cap_Demand)) {
            update_body.Remote_Site_Cap_Demand = request.data.Remote_Site_Cap_Demand;
        }
        request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
        request.data.modifiedBy_mail = jwtdetails.email;
        return update_body;
    }

    function check_if_filled(field) {
        return (field || field === 0)? true : false;
    }

    function addToAllowedAttributes(ScopesRelevantToThisApp, RoleNames, allowedAttributes, srvCred, usrScope) {
        for (let roleName of RoleNames["xs.rolecollections"]) {
            if (srvCred[roleName] !== undefined) {
                ScopesRelevantToThisApp.forEach((scope) => {
                    if (srvCred[roleName][scope] !== undefined && usrScope.includes(scope)) augmentArray(allowedAttributes[scope], srvCred[roleName][scope]["CM-Site"])
                });
            }
        }
    }

    function getallowedAttributes(jwtdetails, request) {
        const LOG = request.req.params["LOG"];
        const RoleNames = jwtdetails['xs.system.attributes'];
        let usrScope = [];
        for (let scope of jwtdetails.scope) {
            usrScope.push(scope.split('.')[1]);
        }
        let ScopesRelevantToThisApp = [`MainLineModify`, `SubLineModify`, `LinePlanReadOnly`, `SubLineReadOnly`, `MainLineReadOnly`]
        let allowedAttributes = {};
        ScopesRelevantToThisApp.forEach((scope) => {
            if (allowedAttributes[scope] === undefined) allowedAttributes[scope] = {}
        });
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
        }
        catch (err) {
            LOG.info("Unable to load authorization : ", err.response?.data || err.response || err);
            request.reject(400, "Unable to load authorization");
        }

        addToAllowedAttributes(ScopesRelevantToThisApp, RoleNames, allowedAttributes, srvCred, usrScope)
        return allowedAttributes;
    }

    function augmentArray(obj, arr) {
        let i
        for (i = 0; i < arr.length; i++)augment(obj, arr[i]);
    }

    function augment(obj, term) {
        if (obj[term] === undefined) obj[term] = term;
    }

    function merge(obj1, obj2) {
        return ({ ...obj1, ...obj2 });
    }


    function getFilterString(obj) {
        let arr = [];
        if (obj[`$unrestricted-$unrestricted`] !== undefined) return '';
        Object.keys(obj).forEach(key => {
            let tmparr = [];
            if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`CM='${key.slice(0, key.indexOf('-'))}'`);
            if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
            if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
            arr.push(tmparr[0]);
        });
        if (arr.length > 0) {
            let str = `(${arr.join(") or (")})`;
            return str;
        }
        else {
            return (`(CM='NULL' and SITE='NULL')`);
        }
    }

    function AuthorizationCheck(record, allowed_cmsite) {
        if (record.Error === "" || typeof record.Error === "undefined") {
            if (Object.keys(allowed_cmsite).length !== 0) {
                record.Error = (allowed_cmsite[`${record.CM}-${record.Site}`] !== undefined || allowed_cmsite[`$unrestricted-${record.Site}`] !== undefined ||
                    allowed_cmsite[`${record.CM}-$unrestricted}`] !== undefined || allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? '' : `User doesn't have authorization for this CM-SITE combination`;
            }
        }
        return record.Error;
    }
}
)
