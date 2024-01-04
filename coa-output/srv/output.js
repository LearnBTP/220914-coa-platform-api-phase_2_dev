'use strict';
const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");
const csv = require("csv-parser");
const fs = require("fs");

module.exports = cds.service.impl(async (srv) => {
    const
        {
            CarryoverOutput,
            CO_Output,
            Upload_Output,
            output_action,
            CO_Output_Export
        } = srv.entities;
    let hdb = await cds.connect.to("db");
    let before_data = [];
    let completed = false;
    let somethingToInsert = false;
    let glb_auth;

    // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
    // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.    
    srv.before("GET", [CarryoverOutput, CO_Output, CO_Output_Export], async (request) => {     
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request), { label: 'COA Output: GET CO Output' });
        if (typeof (request.req.params.LOG) === "undefined") {
            request.req.params = { "LOG":LOG };
        }
        LOG.info(`In Before handler of GET action of CO output`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        allowedAttributes['COOutputReadOnly'] = merge(allowedAttributes['COOutputReadOnly'], allowedAttributes['COOutputModify'], allowedAttributes['ApproveCoOutput'])
        let filterString = getFilterString(allowedAttributes['COOutputReadOnly'], '');
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
    });

    srv.after("GET", [CarryoverOutput, CO_Output], async (data, request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In After handler of GET action of CO output`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes['COOutputModify'];
        request.results.forEach(e => {
            e.Edit = (  allowed_cmsite[`${e.From_CM}-${e.From_Site}`] !== undefined ||
                        allowed_cmsite[`$unrestricted-${e.From_Site}`] !== undefined || 
                        allowed_cmsite[`${e.From_CM}-$unrestricted}`] !== undefined || 
                        allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? 7 : 1;

        });
    }
    );


    srv.before("GET", "F4help", async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request), { label: 'COA Output: GET F4help' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                const uuid = getuuid(request);
                request.req.params = { "uuid": uuid, "user": request.user.id,"LOG": LOG };
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function fetchdata(allowedAttributes, change, search, db, top, skip, field) {
        let dropdown_array = [];
        // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, SITE values on role attributes in right order.
        // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
        let whereclause = getFilterString(allowedAttributes, '');
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
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${field}`).where(parsedFilters).limit(top, skip)
            );
        } else {
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${field}`).where(`(${change} is not null) and not(${change}='')`).limit(top, skip)
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
        allowedAttributes['COOutputReadOnly'] = merge(allowedAttributes['COOutputReadOnly'], allowedAttributes['COOutputModify'], allowedAttributes['ApproveCoOutput']);
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        if (top) {
            top = top.includes("infinity") ? 1000 : top;
        }
        if (change === "SHORT_NAME") {
            result_array = await fetchdata(allowedAttributes['COOutputReadOnly'], change, search, CO_Output, top, skip, change);
        } else {
            result_array = await fetchdata(allowedAttributes['COOutputReadOnly'], change, search, CarryoverOutput, top, skip, change);
        }
        return result_array;
    }

    srv.on("GET", "F4help", async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On event of Get action for F4help`);
        try {
            const dropdown_array = await getDropDownArray(request);
            request.results = dropdown_array;
        } catch (error) {
            LOG.info(`Error: ${error}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    function getuuid(request) {
        return (request && request?.headers['x-correlationid'])?request.headers['x-correlationid'] :cds.utils.uuid();
    }

    function output_data(request) {
        let record = [];
        if (request) {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.From_CM);
            record.push(request.From_Site);
            record.push(request.From_Product);
            record.push(request.AQID);
            record.push(request.To_CM);
            record.push(request.To_Site);
            record.push(request.To_Product);
            record.push(request.CO_Type);
            record.push(request.From_GHSite);
            record.push(request.To_GHSite);
            record.push(request.From_Business_Grp);
            record.push(request.To_Business_Grp);
            record.push(request.EQ_Name);
            record.push(request.MFR);
            record.push(request.Quantity);
            record.push(request.CM_Balance_Qty);
            record.push(request.Approved_By);
            record.push(request.Review_Date);
            record.push(request.Status);
            record.push(request.Comment);
            record.push(request.SAP_CM_Site);
            record.push(request.SAP_To_CM_Site);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.Approved_By_Name);
            record.push(request.Approved_By_mail);
        } else {
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
        }
        return record;
    }

    function update_changelog(TableName, changelog_data_a, request) {
        const LOG = request.req.params.LOG;
        LOG.info(`Call Changelog service to update the changes to Changelog table`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        const core = require("@sap-cloud-sdk/core");
        const xsenv = require("@sap/xsenv");
        xsenv.loadEnv();
        const sDestinationName = "COA_APIM_CC";
        let result_a = [];
        changelog_data_a.forEach(element => {
            let result = {};
            result.TableName = TableName;
            result.old_records = [];
            result.new_records = [];
            result.old_records = element.old_records;
            result.new_records = element.new_records;
            result.actionType = element.action;
            result.user_data = {};
            result.user_data.user = request.req.params.user;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            result_a.push(result);
        });
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

    srv.on("PUT", Upload_Output, async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On Event of Upload_Output`);
        await waitFor(() => completed === true).then(() => {
            LOG.info(`The wait is over!`);
            if (!somethingToInsert) {
                LOG.info(`Nothing to Insert / Update`);
            } else {
                LOG.info(`Records uploaded successfully`);
            }
        });
    });

    srv.before("PUT", Upload_Output, async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request), { label: 'COA Output: PUT Upload_Output' });
        if (typeof (request.req.params.uuid) === "undefined") {
            const uuid = getuuid(request);
            request.req.params = { "uuid": uuid, "user": request.user.id , "LOG": LOG};
        }
        LOG.info(`In Before event of UPLOAD Carryover Output action`);
        const tx = hdb.tx();
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`COOutputModify`];
        completed = false;
        const {
            Readable
        } = require("stream");
        LOG.info(`Starting of Upload action `);
        let Output_final = [];
        let Output_update = [];
        let qty_exceed_a = [];
        let Result = {};
        Result.From_Product = [];
        Result.To_Product = [];
        Result.From_GHSite = [];
        Result.To_GHSite = [];
        Result.AQID = [];
        Result.Output = [];
        Result.WhereCondition = [];
        Result.where = [];
        let DB_data = {};
        DB_data.GHSite = [];
        DB_data.Product = [];
        DB_data.AQID = [];
        DB_data.Output = [];
        let Err_records = [];
        let new_record_a = [];
        let readable;
        if (process.env.NODE_ENV !== 'test') {
            readable = Readable.from(request.data.csv);
        } else {
            let filename = "/home/user/projects/220914-coa-platform-api/coa-output/tests/Output.csv";
            readable = fs.createReadStream(filename);
        }
        readable
            .pipe(csv())
            .on("data", async function (csvrow) {
                Result = collect_output(csvrow, Result, LOG);
            })
            .on("finish", async function () {
                try {
                    let flag = checkiflimitexceeds(Result, request, LOG);
                    if (flag) {
                        somethingToInsert = true;
                        let retParam = await get_dbdata(tx, Result, DB_data);
                        DB_data = retParam.DB_data;
                        let qtyCal = retParam.qtyCal;
                        await Promise.all(Result.Output.map(async (record) => {
                            record = validate_data(record, DB_data);
                            const index = DB_data.Output.findIndex(e1 => e1.From_CM === record.From_CM && e1.From_Site === record.From_Site && e1.From_Product === record.From_Product && e1.AQID === record.AQID && e1.To_CM === record.To_CM && e1.To_Site === record.To_Site && e1.To_Product === record.To_Product && e1.CO_Type === record.CO_Type);
                            const index_qty = qty_exceed_a.findIndex(el => el.From_GHSite === record.From_GHSite && el.From_Product === record.From_Product && el.AQID === record.AQID);
                            if (index_qty >= 0 && index >= 0 && qty_exceed_a[index_qty].BeError) {
                                record.BeError = qty_exceed_a[index_qty].BeError;
                                Err_records = Push_ErrRecs(record, Err_records);
                            } else {
                                record.uuid = request.req.params.uuid;
                                record.userid = request.user.id;
                                record.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                                record.email = jwtdetails.email;
                                record = Validate_Outputrecord(record, allowed_cmsite, request.req.params.uuid, DB_data);
                                let param = data_validation(record, record, Result.Output, qtyCal, undefined, true, qty_exceed_a);
                                delete record.uuid;
                                delete record.userid;
                                delete record.email;
                                delete record.name;       
                                record.BeError = param.error;
                                Output_update = merge_2(Output_update, param.update_data);
                                qty_exceed_a = fill_error(param, qty_exceed_a, record);
                                let outcome = check_if_newrec(record, Output_update, Result.Output, qtyCal, jwtdetails, request, new_record_a);
                                Result.Output = outcome.input;
                                Output_update = outcome.Output_update;
                                record = outcome.data;
                                new_record_a = outcome.new_record_a;
                                Output_final = Push_NewRecs(record, Output_final, jwtdetails);
                                let update_s = {};
                                update_s = get_update_recs(record, Output_update, '');
                                record = update_s.record;
                                Output_update = update_s.Output_update;
                                Err_records = Push_ErrRecs(record, Err_records);
                            }
                        }));
                        await insert_data(Output_final, Output_update, tx, "COM_APPLE_COA_T_COA_OUTPUT", "T_COA_OUTPUT", request, jwtdetails);
                        completed = true;
                        let message = get_msg(Err_records, 'File_Upload');
                        request._.res.send({ msg: message });
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

    function check_if_newrec(data, Output_update, input, qtyCal, jwtdetails, request, new_record_a) {
        if (data.BeError === "New Record") {
            data.BeError = "";
            data.CM_Balance_Qty = 0;
            data.Comment = "Quantity Reset";
            let index1 = new_record_a.findIndex(rec1 => rec1.From_GHSite === data.From_GHSite && rec1.From_Product === data.From_Product && rec1.AQID === data.AQID);
            if (index1 < 0) {
                let new_record = {};
                new_record.From_GHSite = data.From_GHSite;
                new_record.From_Product = data.From_Product;
                new_record.AQID = data.AQID;
                new_record_a.push(new_record);
                let newData = get_qty(input, data);
                let tempQtyCal = get_qty(qtyCal, data);
                let outcome = Reset_quantity(tempQtyCal, data, newData, input, Output_update, jwtdetails, request);
                data = outcome.data;
                input = outcome.input;
                Output_update = outcome.Output_update;
            }
        }
        return { data, Output_update, input, new_record_a };
    }

    function Reset_quantity(tempQtyCal, data, newData, input, Output_update, jwtdetails, request) {
        tempQtyCal.forEach(rec => {
            if (rec.From_GHSite === data.From_GHSite && rec.From_Product === data.From_Product && rec.AQID === data.AQID) {
                let recNew = newData.findIndex(e => e.From_GHSite === rec.From_GHSite && e.From_Product === rec.From_Product && e.AQID === rec.AQID
                    && e.To_GHSite === rec.To_GHSite && e.To_Product === rec.To_Product && e.CO_Type === rec.CO_Type)
                if (recNew >= 0) {
                    let index = input.findIndex(e => e.From_GHSite === rec.From_GHSite && e.From_Product === rec.From_Product && e.AQID === rec.AQID
                        && e.To_GHSite === rec.To_GHSite && e.To_Product === rec.To_Product && e.CO_Type === rec.CO_Type)
                    if (index >= 0) {
                        input[index] = rec;
                        rec.uuid = request.req.params.uuid;
                        before_data.push(rec);
                        input[index].BeError = "Data will be updated";
                        input[index].CM_Balance_Qty = 0;
                        input[index].Comment = "Quantity Reset";
                    }
                    newData.splice(recNew, 1);
                } else {
                    rec.BeError = "Data will be updated";
                    rec.CM_Balance_Qty = 0;
                    rec.Comment = "Quantity Reset";
                    let outcome = get_update_recs(rec, Output_update, 'X');
                    Output_update = outcome.Output_update;
                    rec.uuid = request.req.params.uuid;
                    before_data.push(rec);
                }
            }
        });
        return { data, input, Output_update };
    }

    function fill_error(param, qty_exceed_a, record) {
            const index = qty_exceed_a.findIndex(el => el.From_GHSite === record.From_GHSite && el.From_Product === record.From_Product && el.AQID === record.AQID);
            if (index < 0) {
                let qty_exceed = {};
                qty_exceed.From_GHSite = record.From_GHSite;
                qty_exceed.From_Product = record.From_Product;
                qty_exceed.AQID = record.AQID;
                if (param.QtyExceed) {
                    qty_exceed.BeError = "CM Balance Qty is not equal to CO qty";
                }else {
                    qty_exceed.BeError = '';
                }
                if(param.upd_flg){
                    qty_exceed.upd_flg = 'X';
                }else{
                    qty_exceed.upd_flg = '';
                }
                qty_exceed_a.push(qty_exceed);
            }
        return qty_exceed_a;
    }


    function get_update_recs(record, Output_update, flg) {
        if (record.BeError === "Data will be updated") {
            record.BeError = "";
            Output_update = Append_unique_rec(Output_update, record, flg);  
        }
        return { Output_update, record };
    }

    function Append_unique_rec(Output_update, record , flg) {
        const index = Output_update.findIndex(e => e.From_CM === record.From_CM && e.From_Site === record.From_Site && e.From_Product === record.From_Product
            && e.AQID === record.AQID && e.To_CM === record.To_CM && e.To_Site === record.To_Site && e.To_Product === record.To_Product && e.CO_Type === record.CO_Type);
        if(index < 0 ){
            Output_update.push(record);
        }else if (flg){
            Output_update[index].BeError = "";
            Output_update[index].CM_Balance_Qty = 0;
            Output_update[index].Comment = "Quantity Reset";
        }
        return Output_update;
    }

    function checkiflimitexceeds(Result, request, LOG) {
        if (Result.Output.length > 10000) {
            request._.res.send({ msg: `File upload is allowed only for 10k records` });
            return false;
        } else {
            if (Result.Output.length < 1) {
                LOG.info(`Nothing to Insert / Update`);
                somethingToInsert = false;
                completed = true;
                request._.res.send({ msg: "Nothing to Insert / Update" });
                return false;
            }
        }
        return true;
    }

    function get_msg(Err_records, action) {
        if (Err_records.length > 0) {
            return Err_records;
        } else {
            switch (action) {
                case "File_Upload":
                    return "File Uploaded Successfully";
                case "Save":
                    return "Records Saved Successfully";
                case "Approved":
                    return "Records Approved Successfully";
                case "Rejected":
                    return "Records Rejected Successfully";
                case "Delete":
                    return "Records Deleted Successfully";
                default:
                    return "Records Saved Successfully";
            }
        }
    }

    async function get_dbdata(tx, Result, DB_data) {
        DB_data = await get_GHSite_data(Result, DB_data, tx);
        if (Result.From_Product.length > 0 || Result.To_Product.length > 0) {
            DB_data.Product = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('Program as Program').where({
                Program: { in: Result.From_Product }, or: { Program: { in: Result.To_Product } }
            }));
        }
        if (Result.AQID.length > 0) {
            DB_data.AQID = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_AQID_MAIN").columns('AQID as AQID', 'MFR as MFR', 'EQUIPMENT_NAME as EQUIPMENT_NAME').where({
                AQID: { in: Result.AQID }
            }));
        }
        // Since Result.where and Result.WhereCondition has same records using the same piece of code to get DB data       
        let totIdx = Result.where.length - 1;
        let qtyCal = [];
        if (Result.where.length > 0) {
            let counter = 1000;
            let finWhere = "";
            let output_where = "";
            for (let k = 0; k < Result.where.length; k++) {
                if (finWhere === '') {
                    finWhere = Result.where[k];
                    output_where = Result.WhereCondition[k];
                }
                else {
                    finWhere = finWhere + "OR" + Result.where[k];
                    output_where = output_where + "OR" + Result.WhereCondition[k];
                }
                if (k === counter || k === totIdx) {
                    qtyCal = qtyCal.concat(await tx.run(SELECT.from(CarryoverOutput).where(finWhere)));
                    DB_data.Output = DB_data.Output.concat(await tx.run(SELECT.from(CarryoverOutput).where(output_where)));
                    finWhere = '';
                    output_where = '';
                    counter = counter + 1000;
                }
            }
        }
        return { DB_data, qtyCal };
    }

    async function get_GHSite_data(Result, DB_data, tx) {
        if (Result.From_GHSite.length > 0 && Result.To_GHSite.length > 0) {
            DB_data.GHSite = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('GH_Site as GH_Site', 'CM as CM', 'Site as Site').where({
                GH_Site: { in: Result.From_GHSite }, or: { GH_Site: { in: Result.To_GHSite } }
            }));
        }
        return DB_data;
    }

    function Push_NewRecs(record, Output_final, jwtdetails) {
        if (record.BeError === "" || typeof record.BeError === "undefined") {
            record.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            record.createdBy_mail = jwtdetails.email;
            record.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            record.modifiedBy_mail = jwtdetails.email;
            delete record.BeError;
            Output_final.push(record);
        }
        return Output_final;
    }

    function Push_ErrRecs(record, Err_records) {
        if (record.BeError) {
            Err_records.push(record);
        }
        return Err_records;
    }

    function collect_output(csvrow, Result, LOG) {
        try {
            let Output =
            {
                From_CM: "",
                From_Site: "",
                From_Product: csvrow["From Product"].toUpperCase(),
                AQID: csvrow["AppleID"].toUpperCase(),
                To_CM: "",
                To_Site: "",
                To_Product: csvrow["To Product"].toUpperCase(),
                From_GHSite: csvrow["From GH Site"],
                To_GHSite: csvrow["To GH Site"],
                From_Business_Grp: csvrow["From Business Group"],
                To_Business_Grp: csvrow["To Business Group"],
                EQ_Name: "",
                MFR: "",
                Quantity: Number(csvrow["Quantity"]),
                CM_Balance_Qty: Number(csvrow["CM Balance Qty"]),
                Approved_By: "",
                Review_Date: null,
                Status: (Number(csvrow["CM Balance Qty"]) && csvrow["Comment"]) ? "Pending" : "",
                Comment: csvrow["Comment"],
                SAP_CM_Site: "",
                SAP_To_CM_Site: "",
                modifiedBy_Name: "",
                modifiedBy_mail: "",
                createdBy_Name: "",
                createdBy_mail: "",
                Approved_By_Name: "",
                Approved_By_mail: "",
                CO_Type: csvrow["CO Type"],
                BeError: (containsOnlyNumbers(Number(csvrow["CM Balance Qty"])) && containsOnlyNumbers(Number(csvrow["Quantity"]))) ? "" : "Invalid CM Balance QTY / Quantity"
            };

            let uniquekey;
            if (Result.Output.length > 0) {
                uniquekey = Result.Output.find(data => data.From_GHSite === Output.From_GHSite
                    && data.From_Product === Output.From_Product
                    && data.AQID === Output.AQID
                    && data.To_GHSite === Output.To_GHSite
                    && data.To_Product === Output.To_Product
                    && data.CO_Type === Output.CO_Type
                );
            }
            if (!csvrow["From GH Site"] || !csvrow["From Product"] || !csvrow["AppleID"] || !csvrow["To GH Site"] || !csvrow["To Product"]) {
                Output.BeError = Output.BeError === "" ? `Key fields are mandatory` : `${Output.BeError} and Key fields are mandatory`;
            } else {
                Result.From_GHSite = Append_IfUnique(Result.From_GHSite, Output.From_GHSite);
                Result.To_GHSite = Append_IfUnique(Result.To_GHSite, Output.To_GHSite);
                Result.From_Product = Append_IfUnique(Result.From_Product, Output.From_Product);
                Result.To_Product = Append_IfUnique(Result.To_Product, Output.To_Product);
                Result.AQID = Append_IfUnique(Result.AQID, Output.AQID);
                Result.WhereCondition.push("(From_GHSite = '" + Output.From_GHSite + "' AND From_Product = '" + Output.From_Product
                    + "' AND AQID = '" + Output.AQID + "' AND To_GHSite = '" + Output.To_GHSite
                    + "' AND To_Product = '" + Output.To_Product
                    + "')");

                Result.where.push("(From_GHSite = '" + Output.From_GHSite + "' AND From_Product = '" + Output.From_Product
                    + "' AND AQID = '" + Output.AQID + "')");
            }
            if (typeof uniquekey !== "undefined") {
                Output.BeError = "Duplicate entries in the file";
            }
            Result.Output.push(Output);
            return Result;
        }
        catch (err) {
            LOG.info(`Error: ${JSON.stringify(err)}`);
        }
    }

    function Append_IfUnique(Result, field) {
        const index = Result.findIndex(e => e === field);
        if (index < 0) {
            Result.push(field);
        }
        return Result;
    }

    function Validate_Outputrecord(record, allowed_cmsite, uuid, DB_data) {
        if (record.BeError === "" || typeof record.BeError === "undefined") {
            record.BeError = AuthorizationCheck(record, allowed_cmsite);
            if (record.BeError === "" || typeof record.BeError === "undefined") {
                const index = DB_data.Output.findIndex(e1 => e1.From_CM === record.From_CM && e1.From_Site === record.From_Site && e1.From_Product === record.From_Product && e1.AQID === record.AQID && e1.To_CM === record.To_CM && e1.To_Site === record.To_Site && e1.To_Product === record.To_Product && e1.CO_Type === record.CO_Type);
                const index1 = DB_data.Output.findIndex(e1 => e1.From_CM === record.From_CM && e1.From_Site === record.From_Site && e1.From_Product === record.From_Product && e1.AQID === record.AQID && e1.To_CM === record.To_CM && e1.To_Site === record.To_Site && e1.To_Product === record.To_Product && e1.CO_Type === "FileUpload");
                record = file_data_validation(DB_data, record, uuid, index, index1);
            }
        }
        return record;
    }

    function file_data_validation(DB_data, record, uuid, index, index1) {
        if (index >= 0) {
            let Error = "";
            let CM_Balance_Qty = record.CM_Balance_Qty;
            let Comment = record.Comment;
            record = DB_data.Output[index];
            record.CM_Balance_Qty = CM_Balance_Qty;
            record.Comment = Comment;
            record.Status = "Pending";
            Error = checkiffilled(record, Error);
            record.BeError = Error === "" ? "Data will be updated" : Error;
            DB_data.Output[index].uuid = uuid;
            before_data.push(DB_data.Output[index]);
        }
        else if (index1 >= 0) {
            let Error = "";
            let CM_Balance_Qty = record.CM_Balance_Qty;
            let Comment = record.Comment;
            record = DB_data.Output[index1];
            record.CM_Balance_Qty = CM_Balance_Qty;
            record.Comment = Comment;
            record.Status = "Pending";
            Error = checkiffilled(record, Error);
            record.BeError = Error === "" ? "Data will be updated" : Error;
            DB_data.Output[index1].uuid = uuid;
            before_data.push(DB_data.Output[index1]);
        } else {
            if (record.Quantity > 0) {
                record.CO_Type = "FileUpload";
                record.BeError = containsOnlyNumbers(record.Quantity) ? `New Record` : "Invalid Quantity";
            } else {
                record.BeError = `Quantity cannot be zero`;
            }
        }
        return record;
    }

    function checkiffilled(record, Error) {
        if (!record.Comment || !containsOnlyNumbers(record.CM_Balance_Qty))  {
            Error = "Enter CM Balance Qty / Comment";
        }
        return Error;
    }

    function containsOnlyNumbers(str) {
        return /^-?\d+(\.\d?.)?$/.test(str);
    }

    function validate_data(record, DB_data) {
        if (record.BeError === "" || typeof record.BeError === "undefined") {
            record = validate_GHSite(DB_data, record);
            record = validate_Product(DB_data, record);
            record = validate_AQID(DB_data, record);
        }
        return record;
    }

    function validate_GHSite(DB_data, record) {
        const index = DB_data.GHSite.findIndex(e1 => e1.GH_Site === record.From_GHSite);
        if (index < 0) {
            record.BeError = record.BeError === "" ? `Invalid From Function Location` : `${record.BeError} and Invalid From Function Location`;
        } else {
            record.From_CM = DB_data.GHSite[index].CM;
            record.From_Site = DB_data.GHSite[index].Site;
            record.SAP_CM_Site = `${record.From_CM}-${record.From_Site}`;
        }
        const index1 = DB_data.GHSite.findIndex(e1 => e1.GH_Site === record.To_GHSite);
        if (index1 < 0) {
            record.BeError = record.BeError === "" ? `Invalid To Function Location` : `${record.BeError} and Invalid To Function Location`;
        } else {
            record.To_CM = DB_data.GHSite[index1].CM;
            record.To_Site = DB_data.GHSite[index1].Site;
            record.SAP_To_CM_Site = `${record.To_CM}-${record.To_Site}`;
        }

        return record;
    }

    function validate_Product(DB_data, record) {
        const index = DB_data.Product.findIndex(e1 => e1.Program === record.From_Product);
        if (index < 0) {
            record.BeError = record.BeError === "" ? `Invalid From Product` : `${record.BeError} and Invalid From Product`;
        }
        const index1 = DB_data.Product.findIndex(e1 => e1.Program === record.To_Product);
        if (index1 < 0) {
            record.BeError = record.BeError === "" ? `Invalid To Product` : `${record.BeError} and Invalid To Product`;
        }
        return record;
    }

    function validate_AQID(DB_data, record) {
        if (record.BeError === "" || typeof record.BeError === "undefined") {
            const index = DB_data.AQID.findIndex(e1 => e1.AQID === record.AQID);
            if (index < 0) {
                record.BeError = record.BeError === "" ? `Invalid AQID` : `${record.BeError} and Invalid AQID`;
            } else {
                record.MFR = DB_data.AQID[index].MFR;
                record.EQ_Name = DB_data.AQID[index].EQUIPMENT_NAME;
            }
        }
        return record;
    }

    async function insert_data(data, update_data, tx, db, TableName, request, jwtdetails) {
        let changelog_data_a = [];
        let changelog_data = {};
        let del_filter_a = [];
        if (data.length > 0) {
            changelog_data.new_records = [];
            changelog_data.old_records = [];
            changelog_data.action = "INSERT";
            await tx.run(INSERT.into(db).entries(data));
            data.forEach(element => {
                let old_record = [];
                let new_record = [];
                old_record = output_data('');
                changelog_data.old_records.push(old_record);
                new_record = output_data(element);
                changelog_data.new_records.push(new_record);
            });
            changelog_data_a = Pushrecords(changelog_data, changelog_data_a);
        }
        if (update_data.length > 0) {
            changelog_data.new_records = [];
            changelog_data.old_records = [];
            let queries = [];
            changelog_data.action = "UPDATE";
            update_data.forEach(element1 => {
                delete element1.BeError;
                delete element1.Edit;
                delete element1.uuid;
                if (element1.Status === "Pending") {
                    element1.Approved_By = "";
                    element1.Review_Date = null;
                    element1.Approved_By_Name = "";
                    element1.Approved_By_mail = "";
                }
                element1.modifiedAt = new Date().toISOString();
                element1.modifiedBy = request.user.id;
                element1.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                element1.modifiedBy_mail = jwtdetails.email;
                element1.modifiedAt = new Date().toISOString();
                element1.modifiedBy = request.user.id;
                let del_filter = {};
                const index = before_data.findIndex(e1 => e1.From_CM === element1.From_CM && e1.From_Site === element1.From_Site && e1.From_Product === element1.From_Product && e1.AQID === element1.AQID && e1.To_CM === element1.To_CM && e1.To_Site === element1.To_Site && e1.To_Product === element1.To_Product && e1.CO_Type === element1.CO_Type && e1.uuid === request.req.params.uuid);
                if (index >= 0) {
                    let old_record = [];
                    let new_record = [];
                    old_record = output_data(before_data[index]);
                    changelog_data.old_records.push(old_record);
                    before_data.splice(index, 1);
                    new_record = output_data(element1);
                    changelog_data.new_records.push(new_record);
                }
                del_filter.From_CM = element1.From_CM;
                del_filter.From_Site = element1.From_Site;
                del_filter.From_Product = element1.From_Product;
                del_filter.AQID = element1.AQID;
                del_filter.To_CM = element1.To_CM;
                del_filter.To_Site = element1.To_Site;
                del_filter.To_Product = element1.To_Product;
                del_filter.CO_Type = element1.CO_Type;
                del_filter_a.push(del_filter);
            }
            );
            queries = deleteInChunk(del_filter_a, queries);
            if (queries.length > 0) {
                await tx.run(queries);
            }
            await tx.run(INSERT.into(db).entries(update_data));
            changelog_data_a = Pushrecords(changelog_data, changelog_data_a);
        }
        await tx.commit();
        if (changelog_data_a.length > 0) {
            update_changelog(TableName, changelog_data_a, request);
        }
    }

    function deleteInChunk(delQueue, queries) {
        let chunkSize = 900;
        let k = 0;
        for (; k < delQueue.length; k += chunkSize) {
            let deleteChunk = delQueue.slice(k, k + chunkSize);
            let delQ = changeObjArrayToQuery(deleteChunk);
            queries.push(DELETE.from("COM_APPLE_COA_T_COA_OUTPUT").where(delQ));
        }
        return queries;
    }

    function changeObjArrayToQuery(arr) {
        let i = 0;
        let fullQuery = "";
        for (; i < arr.length; i++) {
            let currObj = arr[i];
            let currObjKeys = Object.keys(currObj);
            let k = 0;
            let tempQuery = ``;
            for (; k < currObjKeys.length; k++) {
                if (tempQuery === ``) {
                    tempQuery = `${currObjKeys[k]}='${currObj[currObjKeys[k]]}'`
                }
                else {
                    tempQuery = `${tempQuery} and ${currObjKeys[k]}='${currObj[currObjKeys[k]]}'`
                }
            }
            tempQuery = `(${tempQuery})`;
            if (i === 0) {
                fullQuery = tempQuery;
            }
            else {
                fullQuery = fullQuery + " or " + tempQuery;
            }
        }
        return fullQuery;
    }

    function waitFor(conditionFunction) {
        const poll = (resolve) => {
            if (conditionFunction()) resolve();
            // eslint-disable-next-line no-unused-vars
            else setTimeout((_) => poll(resolve), 400);
        };
        return new Promise(poll);
    }

    function Pushrecords(changelog_data, changelog_data_a) {
        if (changelog_data) {
            changelog_data_a.push(changelog_data);
        }
        return changelog_data_a;
    }

    srv.before("POST", output_action, async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request), { label: 'COA Output: POST output_action' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                const uuid = getuuid(request);
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG": LOG};
            }
            if ((!request.data.URL || request.data.URL === undefined) && request.data.OutputData.length < 1) {
                request.reject(500, 'No Changes are made.Save not required');
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.on("POST", output_action, async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On event of Output_Action`);
        const tx = hdb.tx();
        let output_err = [];
        let result = [];
        try {
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            if (request.data.URL) {
                if (request.data.CM_Balance_Qty !== undefined && !containsOnlyNumbers(request.data.CM_Balance_Qty)) {
                    request.reject(500, 'Invalid CM Balance Qty');
                }
                let filters = request.data.URL;
                filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' <> ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
                let regex = /contains\((\w+),‘(\w+)‘\)/g;
                filters = filters.replace(regex, `($1 like ‘%$2%’)`);
                let filterString = request.data.Action === "Approve" ? getFilterString(allowedAttributes[`ApproveCoOutput`], 'X') : getFilterString(allowedAttributes[`COOutputModify`], 'X');
                filters = filterString ? `(${filterString}) and ${filters}` : filters;
                result = await tx.run(SELECT.from(CarryoverOutput).where(cds.parse.expr(filters)));
                check_and_reject(result, request.data.Action);
                output_err = await selectall_action(request, result, tx, jwtdetails, request.data.Action);
                let msg = get_msg(output_err, request.data.Action);
                request._.res.send({ msg: msg });
            } else {
                check_and_reject(request.data.OutputData, request.data.Action);
                output_err = await block_action(request, tx, allowedAttributes, jwtdetails, request.data.Action);
                let msg = get_msg(output_err, request.data.Action);
                request._.res.send({ msg: msg });
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    function check_and_reject(request, action) {
        if (request.length > 5000) {
            request.reject(500, `Mass ${action} is allowed only for 5K records`);
        }
    }

    async function selectall_action(request, result, tx, jwtdetails, action) {
        let output_err = [];
        if (action === 'Delete') {
            output_err = await delete_action(request, result, tx, jwtdetails);
        } else {
            output_err = await select_all_massupdate(request, result, tx, jwtdetails);
        }
        return output_err;
    }

    async function block_action(request, tx, allowedAttributes, jwtdetails, action) {
        let output_err = [];
        if (action === 'Delete') {
            output_err = await delete_action(request, request.data.OutputData, tx, jwtdetails);
        } else {
            output_err = await block_mass_update(request, tx, allowedAttributes, jwtdetails);
        }
        return output_err;
    }

    async function delete_action(request, result, tx, jwtdetails) {
        let WhereCondition = [];
        let del_filter_a = [];
        let final_data = [];
        let output_err = [];
        let queries = [];
        let changelog_data_a = [];
        let changelog_data = {};
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = allowedAttributes[`COOutputModify`];
        result.forEach(record => {
            record.BeError = "";
            record.BeError = AuthorizationCheck(record, allowed_cmsite);
            if (record.BeError === "") {
                if (record.CO_Type === "FileUpload") {
                    WhereCondition.push("(From_GHSite = '" + record.From_GHSite + "' AND From_Product = '" + record.From_Product
                        + "' AND AQID = '" + record.AQID + "')");
                    let del_filter = {};
                    del_filter.From_CM = record.From_CM;
                    del_filter.From_Site = record.From_Site;
                    del_filter.From_Product = record.From_Product;
                    del_filter.AQID = record.AQID;
                    del_filter.To_CM = record.To_CM;
                    del_filter.To_Site = record.To_Site;
                    del_filter.To_Product = record.To_Product;
                    del_filter.CO_Type = record.CO_Type;
                    del_filter_a.push(del_filter);
                }
                else {
                    record.BeError = "Records with CO Type = FileUpload can be deleted";
                }
            }
            if (record.BeError) {
                output_err.push(record);
            }
        });
        let temp_data = await get_final_records(WhereCondition, tx);
        temp_data.forEach(e => {
            const index = result.findIndex(e1 => e1.From_CM === e.From_CM && e1.From_Site === e.From_Site && e1.From_Product === e.From_Product && e1.AQID === e.AQID && e1.To_CM === e.To_CM && e1.To_Site === e.To_Site && e1.To_Product === e.To_Product && e1.CO_Type === e.CO_Type);
            if (index < 0) {
                let old_record = [];
                let new_record = [];
                old_record = output_data(e);
                changelog_data.old_records.push(old_record);
                e.CM_Balance_Qty = 0;
                e.Comment = "Quantity Reset";
                e.Approved_By = "";
                e.Review_Date = null;
                e.Approved_By_Name = "";
                e.Approved_By_mail = "";
                e.modifiedAt = new Date().toISOString();
                e.modifiedBy = request.user.id;
                e.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                e.modifiedBy_mail = jwtdetails.email;
                delete e.BeError;
                delete e.Edit;
                final_data.push(e);
                new_record = output_data(e);
                changelog_data.new_records.push(new_record);
                let del = {};
                del.From_CM = e.From_CM;
                del.From_Site = e.From_Site;
                del.From_Product = e.From_Product;
                del.AQID = e.AQID;
                del.To_CM = e.To_CM;
                del.To_Site = e.To_Site;
                del.To_Product = e.To_Product;
                del.CO_Type = e.CO_Type;
                del_filter_a.push(del);
            }
        });
        queries = deleteInChunk(del_filter_a, queries);
        if (queries.length > 0) {
            await tx.run(queries);
        }
        if (final_data.length > 0) {
            await tx.run(INSERT.into("COM_APPLE_COA_T_COA_OUTPUT").entries(final_data));
            changelog_data.action = "UPDATE";
            changelog_data_a = Pushrecords(changelog_data, changelog_data_a);
        }
        await tx.commit();
        if (changelog_data_a.length > 0) {
            update_changelog("T_COA_OUTPUT", changelog_data_a, request);
        }
        return output_err;
    }

    async function get_final_records(WhereCondition, tx) {
        let totIdx = WhereCondition.length - 1;
        let Final_data = [];
        if (WhereCondition.length > 0) {
            let counter = 1000;
            let finWhere = "";
            for (let k = 0; k < WhereCondition.length; k++) {
                if (finWhere === '') {
                    finWhere = WhereCondition[k];
                }
                else {
                    finWhere = finWhere + "OR" + WhereCondition[k];
                }
                if (k === counter || k === totIdx) {
                    Final_data = Final_data.concat(await tx.run(SELECT.from(CarryoverOutput).where(finWhere)));
                    finWhere = '';
                    counter = counter + 1000;
                }
            }
        }
        return Final_data;
    }

    async function select_all_massupdate(request, result, tx, jwtdetails) {
        let output_err = [];
        let queries = [];
        let qty_exceed_a = [];
        let changelog_data_a = [];
        let changelog_data = {};
        let insert_a = [];
        let del_filter_a = [];
        let record = {};
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        let qtyCal = [];
        let collect = await get_range(result, '', qtyCal, tx);
        qtyCal = collect.qtyCal;
        result.forEach(e => {
            const index_qty = qty_exceed_a.findIndex(el => el.From_GHSite === e.From_GHSite && el.From_Product === e.From_Product && el.AQID === e.AQID);
            if (index_qty >= 0 && qty_exceed_a[index_qty].BeError) {
                e.BeError = qty_exceed_a[index_qty].BeError;
                output_err.push(e);
            } else {
                let old_record = [];
                let new_record = [];
                old_record = output_data(e);
                record = e;
                record.BeError = "";
                record.CM_Balance_Qty = (request.data.CM_Balance_Qty !== undefined) ? request.data.CM_Balance_Qty : e.CM_Balance_Qty;
                record.Comment = request.data.Comment ? request.data.Comment : e.Comment;
                let retParam = fill_data_based_on_action(record, e, result, qtyCal, request, jwtdetails, qty_exceed_a);
                record = retParam.record;
                qty_exceed_a = retParam.qty_exceed_a;
                changelog_data.new_records = check_and_merge(retParam.retParam, 'new_records', changelog_data.new_records);
                changelog_data.old_records = check_and_merge(retParam.retParam, 'old_records', changelog_data.old_records);
                insert_a = check_and_merge(retParam.retParam, 'update_data', insert_a);
                del_filter_a = check_and_merge(retParam.retParam, 'delete_filter', del_filter_a);
                if (record.BeError === "" || record.BeError === undefined) {
                    changelog_data.old_records.push(old_record);
                    new_record = output_data(record);
                    changelog_data.new_records.push(new_record);
                    delete record.BeError;
                    delete record.Edit;
                    insert_a.push(record);
                    let del_filter = {};
                    del_filter.From_CM = record.From_CM;
                    del_filter.From_Site = record.From_Site;
                    del_filter.From_Product = record.From_Product;
                    del_filter.AQID = record.AQID;
                    del_filter.To_CM = record.To_CM;
                    del_filter.To_Site = record.To_Site;
                    del_filter.To_Product = record.To_Product;
                    del_filter.CO_Type = record.CO_Type;
                    del_filter_a.push(del_filter);
                }
                output_err = Push_ErrRecs(record, output_err);
            }
        });
        queries = deleteInChunk(del_filter_a, queries);
        await check_and_insert(queries, tx, insert_a);
        await tx.commit();
        call_changelog(changelog_data, request, changelog_data_a);
        changelog_data = {};
        return output_err;
    }

    async function check_and_insert(queries, tx, insert_a){
        if (queries.length > 0) {
            await tx.run(queries);
            await tx.run(INSERT.into("COM_APPLE_COA_T_COA_OUTPUT").entries(insert_a));
        }
    }

    function check_and_merge(retParam, field, array2) {
        if(retParam !== undefined){
            switch (field) {
                case 'new_records':
                    return (retParam.changelog_data_t.new_records.length > 0) ? merge_2(retParam.changelog_data_t.new_records, array2) : array2;
                case 'old_records':
                    return (retParam.changelog_data_t.old_records.length > 0) ? merge_2(retParam.changelog_data_t.old_records, array2) : array2;
                case 'update_data':
                    return (retParam.update_data.length > 0) ? merge_2(retParam.update_data, array2) : array2;
                case 'delete_filter':
                    return (retParam.del_filter_a_t.length > 0) ? merge_2(retParam.del_filter_a_t, array2) : array2;
            }
        }
        return array2;
    }

    function fill_data_based_on_action(record, e, result, qtyCal, request, jwtdetails, qty_exceed_a) {
        let param = {};
        if (request.data.Action === "Approved" || request.data.Action === "Rejected") {
            if (record.Status === "Pending") {
                record.Approved_By = request.user.id;
                record.Approved_By_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                record.Approved_By_mail = jwtdetails.email;
                record.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                record.modifiedBy_mail = jwtdetails.email;
                record.Review_Date = new Date().toISOString();
                record.Status = request.data.Action;
                record.modifiedAt = new Date().toISOString();
                record.modifiedBy = request.user.id;
            } else {
                record.BeError = 'Only Pending Records can be Approved / Rejected';
            }
        } else {
            record.uuid = request.req.params.uuid;
            record.userid = request.user.id;
            record.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            record.email = jwtdetails.email;        
            param = data_validation(record, e, result, qtyCal, request.data.CM_Balance_Qty, false, qty_exceed_a);
            delete record.uuid;
            delete record.userid;
            delete record.email;
            delete record.name;        
            record.BeError = param.error;
            qty_exceed_a = fill_error(param, qty_exceed_a, record);
            record.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            record.modifiedBy_mail = jwtdetails.email;
            record.Approved_By = "";
            record.Approved_By_Name = "";
            record.Approved_By_mail = "";
            record.Review_Date = null;
            record.Status = "Pending";
            record.modifiedAt = new Date().toISOString();
            record.modifiedBy = request.user.id;
        }
        return { record, qty_exceed_a};
    }

    async function block_mass_update(request, tx, allowedAttributes, jwtdetails) {
        let output_err = [];
        let queries = [];
        let qty_exceed_a = [];
        let changelog_data_a = [];
        let changelog_data = {};
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        let insert_a = [];
        let del_filter_a = [];
        let range = {};
        range.From_CM = [];
        range.From_Site = [];
        range.From_Product = [];
        range.AQID = [];
        range.To_CM = [];
        range.To_Site = [];
        range.To_Product = [];
        let qtyCal = [];
        let collect = await get_range(request.data.OutputData, range, qtyCal, tx);
        range = collect.range;
        qtyCal = collect.qtyCal;
        let allowed_cmsite = request.data.Action === "Approve" ? allowedAttributes[`ApproveCoOutput`] : allowedAttributes[`COOutputModify`];

        let result = await tx.run(SELECT.from(CarryoverOutput).where(
            {
                From_CM: { in: range.From_CM },
                From_Site: { in: range.From_Site },
                From_Product: { in: range.From_Product },
                AQID: { in: range.AQID },
                To_CM: { in: range.To_CM },
                To_Site: { in: range.To_Site },
                To_Product: { in: range.To_Product }
            }));

        request.data.OutputData.forEach(data => {
            const index_qty = qty_exceed_a.findIndex(el => el.From_GHSite === data.From_GHSite && el.From_Product === data.From_Product && el.AQID === data.AQID);
            if (index_qty >= 0 && qty_exceed_a[index_qty].BeError) {
                data.BeError = qty_exceed_a[index_qty].BeError;
                data.BeError = AuthorizationCheck(data, allowed_cmsite);
                output_err.push(data);
            } else {
                data.BeError = "";
                let index = get_index(result, data);
                if (index >= 0) {
                    data.BeError = AuthorizationCheck(data, allowed_cmsite);
                    data.BeError = containsOnlyNumbers(data.CM_Balance_Qty) ? data.BeError : `${data.BeError} Invalid CM Balance Qty`
                    let ret_parameter = check_based_on_action(data, result[index], request, qtyCal, qty_exceed_a, jwtdetails);
                    data = ret_parameter.data;
                    qty_exceed_a = ret_parameter.qty_exceed_a;
                    changelog_data.new_records = check_and_merge(ret_parameter.retParam, 'new_records', changelog_data.new_records);
                    changelog_data.old_records = check_and_merge(ret_parameter.retParam, 'old_records', changelog_data.old_records);
                    insert_a = check_and_merge(ret_parameter.retParam, 'update_data', insert_a);
                    del_filter_a = check_and_merge(ret_parameter.retParam, 'delete_filter', del_filter_a);
                    let result_s = get_insert_del_array(data, changelog_data, del_filter_a, insert_a, request, result[index], jwtdetails);
                    data = result_s.data;
                    changelog_data = result_s.changelog_data;
                    del_filter_a = result_s.del_filter_a;
                    insert_a = result_s.insert_a;
                } else {
                    data.BeError = `Entry does not exist for this key combination`;
                }
                output_err = Push_ErrRecs(data, output_err);
            }
        });
        queries = deleteInChunk(del_filter_a, queries);
        if (queries.length > 0) {
            await tx.run(queries);
            await tx.run(INSERT.into("COM_APPLE_COA_T_COA_OUTPUT").entries(insert_a));
        }
        await tx.commit();
        call_changelog(changelog_data, request, changelog_data_a);
        allowed_cmsite = [];
        result = [];
        changelog_data = {};
        return output_err;
    }

    function get_insert_del_array(data, changelog_data, del_filter_a, insert_a, request, result, jwtdetails) {
        if (data.BeError === "" || data.BeError === undefined) {
            let old_record = [];
            let new_record = [];
            old_record = output_data(result);
            changelog_data.old_records.push(old_record);
            data = update_based_on_action(data, request, result, jwtdetails);
            new_record = output_data(data);
            changelog_data.new_records.push(new_record);
            delete data.BeError;
            delete data.SHORT_NAME;
            insert_a.push(data);
            let del_filter = {};
            del_filter.From_CM = data.From_CM;
            del_filter.From_Site = data.From_Site;
            del_filter.From_Product = data.From_Product;
            del_filter.AQID = data.AQID;
            del_filter.To_CM = data.To_CM;
            del_filter.To_Site = data.To_Site;
            del_filter.To_Product = data.To_Product;
            del_filter.CO_Type = data.CO_Type;
            del_filter_a.push(del_filter);
        }
        return { data, changelog_data, del_filter_a, insert_a };
    }

    function check_based_on_action(data, result, request, qtyCal, qty_exceed_a, jwtdetails) {
        const LOG = request.req.params.LOG;
        try{
            let param;
            if (request.data.Action !== "Approved" && request.data.Action !== "Rejected") {
                // Quantity Validation
                data.uuid = request.req.params.uuid;
                data.userid = request.user.id;
                data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                data.email = jwtdetails.email;        
                param = data_validation(data, result, request.data.OutputData, qtyCal, undefined, false, qty_exceed_a);
                delete data.uuid;
                delete data.userid;
                delete data.email;
                delete data.name;      
                data.BeError = param.error;
                qty_exceed_a = fill_error(param, qty_exceed_a, data);
            }
            return { data, qty_exceed_a , retParam: param };
        }catch(error){
            LOG.info(`ERROR: ${error}`);
        }
    }

    function call_changelog(changelog_data, request, changelog_data_a) {
        if (changelog_data.new_records.length > 0) {
            changelog_data.action = "UPDATE";
            changelog_data_a.push(changelog_data);
            update_changelog("T_COA_OUTPUT", changelog_data_a, request);
        }
    }

    function update_based_on_action(data, request, old_data, jwtdetails) {
        data.Status = data.Status ? data.Status : "Pending";
        if (request.data.Action === "Approved" || request.data.Action === "Rejected") {
            data.Status = request.data.Action;
            data.Approved_By = request.user.id;
            data.Approved_By_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            data.Approved_By_mail = jwtdetails.email;
            data.modifiedAt = new Date().toISOString();
            data.modifiedBy = request.user.id;
            data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            data.modifiedBy_mail = jwtdetails.email;
            data.Review_Date = new Date().toISOString();
            data.CM_Balance_Qty = old_data.CM_Balance_Qty;
            data.Comment = old_data.Comment;
        }
        if (data.Status === "Pending") {
            data.Approved_By = "";
            data.Approved_By_Name = "";
            data.Approved_By_mail = "";
            data.modifiedAt = new Date().toISOString();
            data.modifiedBy = request.user.id;
            data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            data.modifiedBy_mail = jwtdetails.email;
            data.Review_Date = null;
        }
        return data;
    }

    function get_index(result, data) {
        return result.findIndex(e1 => e1.From_CM === data.From_CM && e1.From_Site === data.From_Site && e1.From_Product === data.From_Product && e1.AQID === data.AQID && e1.To_CM === data.To_CM && e1.To_Site === data.To_Site && e1.To_Product === data.To_Product && e1.CO_Type === data.CO_Type);
    }

    async function get_range(input, range, qtyCal, tx) {
        let counter = 1000;
        let whArray = [], i = 0, where = '';
        let totidx = input.length - 1;
        input.forEach((data, idx) => {
            if (range !== "") {
                range.From_CM.push(data.From_CM);
                range.From_Site.push(data.From_Site);
                range.From_Product.push(data.From_Product);
                range.AQID.push(data.AQID);
                range.To_CM.push(data.To_CM);
                range.To_Site.push(data.To_Site);
                range.To_Product.push(data.To_Product);
            }
            if (where === '') {
                where = "(From_GHSite = '" + data.From_GHSite + "' AND From_Product = '" + data.From_Product
                    + "' AND AQID = '" + data.AQID + "')";

            } else {
                let currCond = "(From_GHSite = '" + data.From_GHSite + "' AND From_Product = '" + data.From_Product
                    + "' AND AQID = '" + data.AQID + "')";
                where = where + " OR " + currCond;
            }
            if (idx === counter || idx === totidx) {
                whArray.push(where);
                where = '';
                counter = counter + 1000;
            }

        });
        for (; i < whArray.length; i++) {

            qtyCal = qtyCal.concat(await tx.run(SELECT.from(CarryoverOutput).where(whArray[i])));
        }
        return { range, qtyCal };
    }

    function data_validation(data, result, input, qtyCal, newQtySelAll, FU, qty_exceed_a) {
        let flg = false;
        let changelog_data_t = {};
        changelog_data_t.new_records = [];
        changelog_data_t.old_records = [];
        let del_filter_a_t = [];
        let upd_flg ;
        let newData = [];
        let update_data = [];
        let totQty = 0, totBalQty = 0;
        if (data.BeError === "" || data.BeError === "Data will be updated") {
            data.BeError = check_ifempty(data, result, FU);
            const index_qty = qty_exceed_a.findIndex(el => el.From_GHSite === data.From_GHSite && el.From_Product === data.From_Product && el.AQID === data.AQID);
            if(index_qty < 0){
                upd_flg = '';
                newData = get_qty(input, data);
                let tempQtyCal = get_qty(qtyCal, data);
                let outcome = calculate_total_bal_qty(tempQtyCal,newData, data, newQtySelAll);
                changelog_data_t = outcome.changelog_data_t;
                del_filter_a_t = outcome.del_filter_a_t; 
                newData = outcome.newData;
                update_data = outcome.update_data;
                totBalQty = outcome.totBalQty;
                totQty = outcome.totQty;
            }else{
                upd_flg = qty_exceed_a[index_qty].upd_flg;
            }
            let outcome1 = update_error(FU, newData, data, totBalQty, totQty, flg, upd_flg);
                flg = outcome1.flg;
                data = outcome1.data;
                upd_flg = outcome1.upd_flg;
        }
        return { error: data.BeError, QtyExceed: flg, update_data,del_filter_a_t, changelog_data_t , upd_flg };
    }

    function calculate_total_bal_qty(tempQtyCal,newData, data, newQtySelAll){
        let changelog_data_t = {};
        changelog_data_t.new_records = [];
        changelog_data_t.old_records = [];
        let del_filter_a_t = [];
        let update_data = [];
        let totQty = 0, totBalQty = 0;
        tempQtyCal.map(el => {
            if (el.From_GHSite === data.From_GHSite && el.From_Product === data.From_Product && el.AQID === data.AQID) {
                let elNew = get_f_index(newData, el , data);
                if (elNew >= 0) {
                    totQty = totQty + Number(el.Quantity);
                    totBalQty = get_totbalqty(newQtySelAll, totBalQty, newData, elNew);
                    newData.splice(elNew, 1);
                }
                else {
                    totQty = totQty + Number(el.Quantity);
                    totBalQty = totBalQty + Number(el.CM_Balance_Qty);
                    if(el.Quantity > 0 || el.CM_Balance_Qty > 0){
                        let old_record = {};
                        old_record = output_data(el);
                        el.uuid = data.uuid;
                        before_data.push(el);
                        delete el.uuid;
                        let new_record = {};   
                        el.Status = 'Pending';
                        el.Approved_By = "";
                        el.Approved_By_Name = "";
                        el.Approved_By_mail = "";
                        el.Review_Date = null;
                        new_record = output_data(el);
                        changelog_data_t.old_records.push(old_record);
                        changelog_data_t.new_records.push(new_record);
                        let del_filter_t = {};
                        del_filter_t.From_CM = el.From_CM;
                        del_filter_t.From_Site = el.From_Site;
                        del_filter_t.From_Product = el.From_Product;
                        del_filter_t.AQID = el.AQID;
                        del_filter_t.To_CM = el.To_CM;
                        del_filter_t.To_Site = el.To_Site;
                        del_filter_t.To_Product = el.To_Product;
                        del_filter_t.CO_Type = el.CO_Type;
                        del_filter_a_t.push(del_filter_t);
                        el.modifiedAt = new Date().toISOString();
                        el.modifiedBy = data.userid;
                        el.modifiedBy_Name = data.name;
                        el.modifiedBy_mail = data.email;
                        delete el.BeError;
                        delete el.Edit;
                        update_data.push(el);
                    }
                }
            }
        });
        return{changelog_data_t, del_filter_a_t, newData, update_data, totBalQty,totQty};
    }

    function get_f_index(newData, el, data) {
        let index;
        index = newData.findIndex(rec => rec.From_GHSite === el.From_GHSite && rec.From_Product === el.From_Product && rec.AQID === el.AQID
                    && rec.To_GHSite === el.To_GHSite && rec.To_Product === el.To_Product && rec.CO_Type === el.CO_Type);
        if(index < 0 && data.BeError === "Data will be updated" && el.CO_Type === 'FileUpload'){
            index = newData.findIndex(rec => rec.From_GHSite === el.From_GHSite && rec.From_Product === el.From_Product && rec.AQID === el.AQID
                && rec.To_GHSite === el.To_GHSite && rec.To_Product === el.To_Product && rec.CO_Type === '');
        }
        return index;
    }

    function update_error(FU, newData, data, totBalQty, totQty, flg, upd_flg) {
        if (FU && (newData.length > 0 || upd_flg)) {
            data.BeError = "Data will be updated";
            data.CM_Balance_Qty = 0;
            data.Comment = "Quantity Reset";
            upd_flg = true;
        } else {
            let record = compare_BalQty_Qty(totBalQty, totQty);
            if (FU) {
                data.BeError = record.BeError ? record.BeError : data.BeError;
            } else {
                data.BeError = record.BeError;
            }
            flg = record.flg;
        }
        return { data, flg, upd_flg };
    }

    function compare_BalQty_Qty(totBalQty, totQty) {
        let record = {};
        record.BeError = "";
        if (totQty !== totBalQty) {
            record.BeError = "CM Balance Qty is not equal to CO qty";
            record.flg = true;
        }
        return record;
    }

    function get_totbalqty(newQtySelAll, totBalQty, newData, elNew) {
        if (newQtySelAll) {
            totBalQty = totBalQty + Number(newQtySelAll);
        } else {
            totBalQty = totBalQty + Number(newData[elNew].CM_Balance_Qty);
        }
        return totBalQty;
    }

    function get_qty(qtyCal, data) {
        return qtyCal.filter(el => {
            if (el.From_GHSite === data.From_GHSite && el.From_Product === data.From_Product && el.AQID === data.AQID) {
                return el;
            }
        });
    }

    function check_ifempty(data, result, FU) {
        if (FU === false &&
            (((data.CM_Balance_Qty === '' || data.CM_Balance_Qty === null) &&
                (result.CM_Balance_Qty === '' || result.CM_Balance_Qty === null)) ||
                (!data.Comment && (result.Comment === '' || result.Comment === null)) ||
                data.Comment === '' || data.Comment === null)) {
            data.BeError = "Enter CM Balance Qty / Comment";
        }
        return data.BeError;
    }

    function addToAllowedAttributes(ScopesRelevantToThisApp,RoleNames,allowedAttributes,srvCred,usrScope)
    {
        for (let roleName of RoleNames["xs.rolecollections"]) {
            if (srvCred[roleName] !== undefined) {
                ScopesRelevantToThisApp.forEach((scope) => {
                    if (srvCred[roleName][scope] !== undefined && usrScope.includes(scope)) augmentArray(allowedAttributes[scope], srvCred[roleName][scope]["CM-Site"])
                });
            }
        }
    }

    function getallowedAttributes(jwtdetails, request) {
        const LOG = request.req.params.LOG;
        const RoleNames = jwtdetails['xs.system.attributes'];
        let usrScope = [];
        for (let scope of jwtdetails.scope) {
            usrScope.push(scope.split('.')[1]);
        }
        let ScopesRelevantToThisApp = [`COOutputModify`, `COOutputReadOnly`, `ApproveCoOutput`]
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
            LOG.info("Unable to load coa-authorization: ", err.response?.data || err.response || err);
            request.reject(400, "Unable to load coa-authorization");
        }


        addToAllowedAttributes(ScopesRelevantToThisApp,RoleNames,allowedAttributes,srvCred,usrScope);
        return allowedAttributes;
    }

    function augmentArray(obj, arr) {
        let i;
        for (i = 0; i < arr.length; i++)augment(obj, arr[i]);
    }

    function augment(obj, term) {
        if (obj[term] === undefined) obj[term] = term;
    }

    function merge(obj1, obj2, obj3) {
        return ({ ...obj1, ...obj2, ...obj3 });
    }

    function merge_2(obj1, obj2) {
        return [ ...obj1, ...obj2 ];
    }

    function getFilterString(obj, f4) {
        let arr = [];
        if (obj[`$unrestricted-$unrestricted`] !== undefined) return '';
        Object.keys(obj).forEach(key => {
            arr = build_filter(arr, key, f4);
        });
        if (arr.length > 0) {
            let str = `(${arr.join(") or (")})`;
            return str;
        }
        else {
            return f4 === 'X' ? (`(FROM_CM='NULL' and FROM_SITE='NULL')`) : (`((FROM_CM='NULL' and FROM_SITE='NULL') or (TO_CM='NULL' and TO_SITE='NULL'))`);
        }
    }

    function build_filter(arr, key, f4) {
        let tmparr = [];
        if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`FROM_CM='${key.slice(0, key.indexOf('-'))}'`);
        if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`FROM_SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
        if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
        arr.push(tmparr[0]);
        if (f4 !== 'X') {
            tmparr = [];
            if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`TO_CM='${key.slice(0, key.indexOf('-'))}'`);
            if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`TO_SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
            if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
            arr.push(tmparr[0]);
        }
        return arr;
    }

    function AuthorizationCheck(record, allowed_cmsite) {
        if (record.BeError === "" || typeof record.BeError === "undefined") {
            if (Object.keys(allowed_cmsite).length !== 0) {
                record.BeError = (allowed_cmsite[`${record.From_CM}-${record.From_Site}`] !== undefined ||
                                  allowed_cmsite[`$unrestricted-${record.From_Site}`] !== undefined ||
                                  allowed_cmsite[`${record.From_CM}-$unrestricted}`] !== undefined ||
                                  allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? '' : `User doesn't have authorization for this CM-SITE combination`;
            }
        }
        return record.BeError;
    }


}
)
