'use strict';
const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");
const csv = require("csv-parser");
const fs = require("fs");

module.exports = cds.service.impl(async (srv) => {
    const
        {
            Carryover_rfid_unscannable,
            Upload_Unscannable,
            Unscannable_Split,
            Unscannable_action
        } = srv.entities;
    let hdb = await cds.connect.to("db");
    let before_data = [];
    let completed = false;
    let somethingToInsert = false;
    let glb_auth;

    srv.before("GET", Carryover_rfid_unscannable, async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request), { label: 'COA Unscannable: GET Carryover_rfid_unscannable' });
        if (typeof (request.req.params.LOG) === "undefined") {
            request.req.params = {"LOG":LOG };
        }
        LOG.info(`In Before handler of GET action of LOG Carryover_rfid_unscannable`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        allowedAttributes['UnScannableReadOnly'] = merge(allowedAttributes['UnScannableReadOnly'], allowedAttributes['UnScannableModify'], allowedAttributes['ApproveRfidOnHandTT'], allowedAttributes['SyncActionAll'])
        let filterString = getFilterString(allowedAttributes['UnScannableReadOnly'], '');
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

    srv.after("GET", Carryover_rfid_unscannable, async (data, request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`UnScannableModify`]
        request.results.forEach(e => {
            if (e.SEQUENCE_NO === 0) {
                e.Parent = "Parent";
            }
            e.Edit = (allowed_cmsite[`${e.CM}-${e.SITE}`] !== undefined || 
                allowed_cmsite[`$unrestricted-${e.SITE}`] !== undefined || 
                allowed_cmsite[`${e.CM}-$unrestricted}`] !== undefined || allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? 7 : 1;
        });
    });

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
        let ScopesRelevantToThisApp = [`UnScannableModify`, `UnScannableReadOnly`, `SyncActionAll`, `ApproveRfidOnHandTT`]
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
            LOG.info("Unable to load authorization: ", err.response?.data || err.response || err);
            request.reject(400, "Unable to load authorization");
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

    function merge(obj1, obj2, obj3, obj4) {
        return ({ ...obj1, ...obj2, ...obj3, ...obj4 });
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
            return f4 === 'X' ? (`(CM='NULL' and SITE='NULL')`) : (`((CM='NULL' and SITE='NULL') or (TO_CM='NULL' and TO_SITE='NULL'))`);
        }
    }

    function build_filter(arr, key, f4) {
        let tmparr = [];
        if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`CM='${key.slice(0, key.indexOf('-'))}'`);
        if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
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

    srv.before("GET", "F4help", async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request), { label: 'COA Unscannable: GET F4help' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                const uuid = getuuid(request);
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG":LOG };
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    function getuuid(request) {
        return (request && request?.headers['x-correlationid'])?request.headers['x-correlationid'] :cds.utils.uuid();
    }

    srv.on("GET", "F4help", async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On event of Get action for F4help`);
        try {
            const dropdown_array = await getDropDownArray(request, request.query.SELECT.columns[0].ref[0]);
            request.results = dropdown_array;
        } catch (error) {
            LOG.info(`Error: ${error}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function getDropDownArray(request, temp_field) {
        let search;
        let result_array = [];
        if (request._query.$search) {
            search = request._query.$search.replace(/"/g, ``);
        }
        const change = request.query.SELECT.columns[0].ref[0];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        allowedAttributes['UnScannableReadOnly'] = merge(allowedAttributes['SyncActionAll'], allowedAttributes['UnScannableModify'], allowedAttributes['UnScannableReadOnly'], allowedAttributes['ApproveRfidOnHandTT'])
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        if (top) {
            top = top.includes("infinity") ? 1000 : top;
        }
        if (change === "GH_SITE_MD" || change === "PROGRAM_MD") {
            let tmp_fld = temp_field.replace('_MD', '');
            result_array = await fetchdata(allowedAttributes['UnScannableReadOnly'], tmp_fld, search, "COM_APPLE_COA_T_COA_BOM_STRUCTURE", top, skip, change);
        } else if (change === 'GH_SITE_ORG') {
            result_array = await fetchdata(allowedAttributes['SyncActionAll'], 'GH_SITE', search, "V_UNSCANNABLE_PROJ", top, skip, change);
        } else {
            result_array = await fetchdata(allowedAttributes['UnScannableReadOnly'], change, search, Carryover_rfid_unscannable, top, skip, change);
        }
        return result_array;
    }

    async function fetchdata(allowedAttributes, change, search, db, top, skip, field) {
        let dropdown_array = [];
        let f4 = (field === "GH_SITE_ORG" || field === "GH_SITE_MD" || field === "PROGRAM_MD") ? 'X' : '';
        // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, SITE values on role attributes in right order.
        // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
        let whereclause = getFilterString(allowedAttributes, f4);
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

    srv.on("PUT", Upload_Unscannable, async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On Event of Upload_Unscannable`);
        await waitFor(() => completed === true).then(() => {
            LOG.info(`The wait is over!`);
            if (!somethingToInsert) {
                LOG.info(`Nothing to Update`);
            } else {
                LOG.info(`Records updated successfully`);
            }
        });
    });

    function waitFor(conditionFunction) {
        const poll = (resolve) => {
            if (conditionFunction()) resolve();
            // eslint-disable-next-line no-unused-vars
            else setTimeout((_) => poll(resolve), 400);
        };
        return new Promise(poll);
    }

    srv.before("PUT", Upload_Unscannable, async (request) => {
        cds.env.features.kibana_formatter = true;
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Unscannable: PUT Upload_Unscannable' });
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        if (typeof (request.req.params.uuid) === "undefined") {
            request.req.params = { "uuid": uuid, "user": request.user.id, "user_name": `${jwtdetails.given_name} ${jwtdetails.family_name}`, "user_mail": jwtdetails.email, "LOG":LOG};
        }
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        LOG.info(`In Before event of UPLOAD Carryover Unscannable action`);
        const tx = hdb.tx();
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`UnScannableModify`];
        completed = false;
        LOG.info(`Starting of Upload action `);
        let Unscannable_update = [];
        let qty_exceed_a = [];
        let Result = {};
        Result.GH_SITE = [];
        Result.PROGRAM = [];
        Result.Temp = [];
        Result.Unscannable = [];
        let DB_data = {};
        DB_data.GH_SITE = [];
        DB_data.PROGRAM = [];
        DB_data.Unscannable = [];
        DB_data.Output = [];
        DB_data.Unscannable_Split = [];
        DB_data.Unscannable_map = {};
        DB_data.Output_map = {};
        DB_data.PROGRAM_map = {};
        let Err_records = [];
        let readable;
        const {
            Readable
        } = require("stream");
        if (process.env.NODE_ENV !== 'test') {
            readable = Readable.from(request.data.csv);
        } else {
            let filename = "/home/user/projects/220914-coa-platform-api/coa-rfid-unscannable/tests/UnScannable.csv";
            readable = fs.createReadStream(filename);
        }
        readable
            .pipe(csv())
            .on("data", async function (csvrow) {
                Result = collect_Unscannable(csvrow, Result, request);
            })
            .on("finish", async function () {
                try {
                    let flag = checkiflimitexceeds(Result, request, LOG);
                    if (flag) {
                        somethingToInsert = true;
                        DB_data = await get_dbdata(tx, Result, DB_data, request,'X');
                        await Promise.all(Result.Unscannable.map(async (record) => {
                            const index_QTY = qty_exceed_a.findIndex(el => el.GH_SITE === record.GH_SITE && el.PROGRAM === record.PROGRAM && el.AQID === record.AQID);
                            if (index_QTY >= 0) {
                                record.ERROR = qty_exceed_a[index_QTY].ERROR;
                                Err_records = Push_ErrRecs(record, Err_records);
                            } else {
                                let outcome1 = fill_dbdata(record, DB_data, request);
                                record = outcome1.record;
                                record.ERROR = check_mand_fields(record);
                                record = validate_data(record, DB_data);
                                record.ERROR = AuthorizationCheck(record, allowed_cmsite);
                                let param = data_validation(record, Result.Unscannable, DB_data.Unscannable, '');
                                record.ERROR = param.error;
                                qty_exceed_a = fill_error(param, qty_exceed_a, record);
                                Unscannable_update = get_update_recs(record, Unscannable_update, request);
                                Err_records = Push_ErrRecs(record, Err_records);
                            }
                        }));
                        await update_data_into_db(Unscannable_update, tx, request, DB_data);
                        completed = true;
                        let message = get_msg(Err_records, "File_Upload");
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

    function collect_Unscannable(csvrow, Result, request) {
        const LOG = request.req.params.LOG;
        try {
            let Unscannable =
            {
                GH_SITE: csvrow["From GH Site"],
                CM: "",
                SITE: "",
                PROGRAM: csvrow["From Product"],
                FROM_BUSINESS_GRP: "",
                AQID: csvrow["CO AQID"],
                MAPPED_AQID: csvrow["Mapped AQID"],
                TABLE_MAPPED_AQID: csvrow["Table Mapped AQID"],
                SEQUENCE_NO: Number(csvrow["Sequence No."]),
                NPI_INDICATOR: csvrow["NPI Indicator"].toUpperCase(),
                PROJECTED_QTY: csvrow["Projected QTY"],
                FLEX_KITS: csvrow["Flex Kits"],
                TRANSFER_FLAG: csvrow["Transfer Flag"],
                TO_GHSITE: csvrow["To GH Site"],
                TO_CM: "",
                TO_SITE: "",
                TO_PROGRAM: csvrow["To Product"],
                TO_BUSINESS_GRP: csvrow["To Business Group"],
                QTY: Number(csvrow["Transfer Quantity"]),
                STATUS: "Pending",
                REVIEW_DATE: null,
                REVIEWED_BY: "",
                MODIFIEDBY_NAME: "",
                MODIFIEDBY_MAIL: "",
                CREATEDBY_NAME: "",
                CREATEDBY_MAIL: "",
                REVIEWED_BY_NAME: "",
                REVIEWED_BY_MAIL: "",
                SAP_CM_SITE: "",
                SAP_TO_CM_SITE: "",
                COMMENT: csvrow["Comment"],
                ERROR: ""
            };
            
            let uniquekey;
            if (Result.Unscannable.length > 0) {
                uniquekey = Result.Unscannable.find(data => data.GH_SITE === Unscannable.GH_SITE
                        && data.PROGRAM === Unscannable.PROGRAM
                        && data.AQID === Unscannable.AQID
                        && data.SEQUENCE_NO === Unscannable.SEQUENCE_NO
                );
            }
            if (typeof uniquekey !== "undefined") {
                Unscannable.SEQUENCE_NO = '';
            }
            if (!csvrow["From GH Site"] || !csvrow["From Product"] || !csvrow["CO AQID"] || (!containsOnlyNumbers(Unscannable.SEQUENCE_NO) && Unscannable.SEQUENCE_NO != '') ) {
                Unscannable.ERROR = Unscannable.ERROR ? `${Unscannable.ERROR} and Key fields are mandatory` : `Key fields are mandatory`;
            }
            else {
                Result.GH_SITE.push(Unscannable.TO_GHSITE);
                Result.PROGRAM.push(Unscannable.TO_PROGRAM);
                let temp = {};
                temp.ID = getuuid();
                temp.GUID = request.req.params.uuid;
                temp.GH_SITE = Unscannable.GH_SITE;
                temp.PROGRAM = Unscannable.PROGRAM;
                temp.AQID = Unscannable.AQID;
                temp.MAPPED_AQID = Unscannable.TABLE_MAPPED_AQID;
                temp.TO_GHSITE = Unscannable.TO_GHSITE;
                temp.TO_PRODUCT = Unscannable.TO_PROGRAM;
                temp.SEQUENCE_NO = (Unscannable.SEQUENCE_NO == '') ? 0 : Number(Unscannable.SEQUENCE_NO);
                Result.Temp.push(temp);
            }
            Result.Unscannable.push(Unscannable);
            return Result;
        }
        catch (err) {
            LOG.info(`Error: ${JSON.stringify(err)}`);
            return Result;
        }
    }

    function containsOnlyNumbers(str) {
        return /^\d+$/.test(str);
    }

    function checkiflimitexceeds(Result, request,LOG) {
        if (Result.Unscannable.length > 10000) {
            request._.res.send({ msg: `File upload is allowed only for 10k records` });
            return false;
        } else {
            if (Result.Unscannable.length < 1) {
                LOG.info(`Nothing to Update`);
                somethingToInsert = false;
                completed = true;
                request._.res.send({ msg: "Nothing to Update" });
                return false;
            }
        }
        return true;
    }

    async function get_dbdata(tx, Result, DB_data, request, FU) {
        let keyArray;
        DB_data = await get_GHSITE_data(Result, DB_data, tx);
        if (Result.PROGRAM.length > 0) {
            DB_data.PROGRAM = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('PROGRAM as PROGRAM').where({
                PROGRAM: { in: Result.PROGRAM }
            }));
            if(DB_data.PROGRAM.length > 0){
                keyArray = ["PROGRAM"];
                fillMultimap(DB_data.PROGRAM_map, DB_data.PROGRAM, keyArray);
            }
        }
        await push_temp_data(Result.Temp);
        DB_data.Unscannable = await cds.run(`SELECT distinct V_UNSCANNABLES.*
                                            FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                            INNER JOIN V_UNSCANNABLES AS V_UNSCANNABLES
                                            ON T_COA_TEMP.GH_SITE = V_UNSCANNABLES.GH_SITE
                                            AND T_COA_TEMP.PROGRAM = V_UNSCANNABLES.PROGRAM
                                            AND T_COA_TEMP.AQID = V_UNSCANNABLES.AQID
                                            WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);
        
        if(DB_data.Unscannable.length > 0){
            keyArray = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            fillMultimap(DB_data.Unscannable_map, DB_data.Unscannable, keyArray);
        }
        if(FU === 'X'){
            DB_data.Unscannable_Split = await cds.run(`SELECT distinct V_UNSCANNABLES.GH_SITE,
                                                        V_UNSCANNABLES.PROGRAM,V_UNSCANNABLES.AQID,
                                                        count(distinct V_UNSCANNABLES.ID) as SEQUENCE_CNT,
                                                        max(V_UNSCANNABLES.SEQUENCE_NO) as SEQUENCE_NO
                                                FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                                INNER JOIN V_UNSCANNABLES AS V_UNSCANNABLES
                                                ON T_COA_TEMP.GH_SITE = V_UNSCANNABLES.GH_SITE
                                                AND T_COA_TEMP.PROGRAM = V_UNSCANNABLES.PROGRAM
                                                AND T_COA_TEMP.AQID = V_UNSCANNABLES.AQID
                                                WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'
                                                GROUP BY V_UNSCANNABLES.GH_SITE,
                                                V_UNSCANNABLES.PROGRAM,V_UNSCANNABLES.AQID`);
        }

        DB_data.Output = await cds.run(`SELECT distinct T_COA_OUTPUT.*
                                            FROM COM_APPLE_COA_T_COA_OUTPUT AS T_COA_OUTPUT 
                                            INNER JOIN V_UNSCANNABLES AS V_UNSCANNABLES
                                            ON T_COA_OUTPUT.FROM_GHSITE = V_UNSCANNABLES.GH_SITE
                                            AND T_COA_OUTPUT.FROM_PRODUCT = V_UNSCANNABLES.PROGRAM
                                            AND ( T_COA_OUTPUT.AQID = V_UNSCANNABLES.TABLE_MAPPED_AQID
                                                OR T_COA_OUTPUT.AQID = V_UNSCANNABLES.MAPPED_AQID )
                                            INNER JOIN COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                            ON T_COA_TEMP.GH_SITE = V_UNSCANNABLES.GH_SITE
                                            AND T_COA_TEMP.PROGRAM = V_UNSCANNABLES.PROGRAM
                                            AND T_COA_TEMP.AQID = V_UNSCANNABLES.AQID
                                            WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);

        if(DB_data.Output.length > 0){
            keyArray = ["FROM_CM","FROM_SITE","FROM_PRODUCT","AQID","TO_CM","TO_SITE", "TO_PRODUCT","CO_TYPE"];
            fillMultimap(DB_data.Output_map, DB_data.Output, keyArray);
        }

        await delete_temp_data(request.req.params.uuid);
        return DB_data;
    }

    async function get_GHSITE_data(Result, DB_data, tx) {
        DB_data.GH_SITE_map = {};
        if (Result.GH_SITE.length > 0) {
            DB_data.GH_SITE = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('GH_SITE as GH_SITE', 'CM as CM', 'SITE as SITE').where({
                GH_SITE: { in: Result.GH_SITE }
            }));
            if(DB_data.GH_SITE.length > 0){
                let keyArray = ["GH_SITE"];
                fillMultimap(DB_data.GH_SITE_map, DB_data.GH_SITE, keyArray);
            }
        }
        return DB_data;
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

    async function push_temp_data(Temp) {
        const tx1 = hdb.tx();
        try {
            await insert_into_db(Temp, "COM_APPLE_COA_T_COA_TEMP", tx1);
            await tx1.commit();
        } catch (error) {
            await tx1.rollback();
        }
    }

    async function delete_temp_data(uuid) {
        const tx1 = hdb.tx();
        try {
            if (uuid) {
                await tx1.run(DELETE.from("COM_APPLE_COA_T_COA_TEMP").where({ GUID: uuid }));
                await tx1.commit();
            }
        } catch (error) {
            await tx1.rollback();
        }
    }

    function fill_dbdata(record, DB_data, request) {
        if (record.ERROR === "" || typeof record.ERROR === "undefined") {
            let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            let tempGetKeyArray = getTempKeys(record, key_array);
            let map_found = getMultiLevelValue(DB_data.Unscannable_map, tempGetKeyArray);
            if (map_found === undefined){
                let index = get_split_index(DB_data.Unscannable_Split, record);
                record.SEQUENCE_NO = 0;
                key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
                tempGetKeyArray = getTempKeys(record, key_array);
                map_found = getMultiLevelValue(DB_data.Unscannable_map, tempGetKeyArray);
                if (map_found === undefined || index < 0){
                    record.ERROR = `Entry doesn't exist`;
                }else if( (DB_data.Unscannable_Split[index].SEQUENCE_CNT + 1) <= map_found.PROJECTED_QTY){
                        record.ID = getuuid();
                        record.GH_SITE = map_found.GH_SITE;
                        record.CM = map_found.CM;
                        record.SITE = map_found.SITE;
                        record.PROGRAM = map_found.PROGRAM;
                        record.FROM_BUSINESS_GRP = map_found.FROM_BUSINESS_GRP;
                        record.AQID = map_found.AQID;
                        record.SEQUENCE_NO = DB_data.Unscannable_Split[index].SEQUENCE_NO + 1;
                        record.NPI_INDICATOR = map_found.NPI_INDICATOR;
                        record.PROJECTED_QTY = map_found.PROJECTED_QTY;
                        record.MODIFIEDBY_NAME = request.req.params.user_name;
                        record.MODIFIEDBY_MAIL = request.req.params.user_mail;
                        record.MODIFIEDBY = request.user.id;
                        record.MODIFIEDAT = new Date().toISOString();
                        record.CREATEDBY_NAME = request.req.params.user_name;
                        record.CREATEDBY_MAIL = request.req.params.user_mail;
                        record.CREATEDBY = request.user.id;
                        record.CREATEDAT = new Date().toISOString();
                        record.MAPPED_AQID = map_found.MAPPED_AQID;
                        record.TABLE_MAPPED_AQID = map_found.TABLE_MAPPED_AQID;
                        record.SAP_CM_SITE = `${record.CM}-${record.SITE}`;
                        record.SAP_TO_CM_SITE = "";
                        record.REVIEWED_BY = "";
                        record.REVIEW_DATE = null;
                        record.REVIEWED_BY_NAME = "";
                        record.REVIEWED_BY_MAIL = "";
                        DB_data.Unscannable_Split[index].SEQUENCE_NO = DB_data.Unscannable_Split[index].SEQUENCE_NO + 1;
                        DB_data.Unscannable_Split[index].SEQUENCE_CNT = DB_data.Unscannable_Split[index].SEQUENCE_CNT + 1;
                    }else{
                        record.ERROR = 'Split Item Count is exeeding the limit(Projected QTY)';
                    }
            } else {
                record.ERROR  = check_sync_status(map_found.SYNC_STATUS, record.ERROR);
                record = fill_data_bydb(record, map_found, 'X');
                map_found.uuid = request.req.params.uuid;
                before_data.push(map_found);
            }
        }
        return { record };
    }

    function get_split_index(Unscannable_Split_a, record) {
        return Unscannable_Split_a.findIndex(e => e.GH_SITE === record.GH_SITE && e.PROGRAM === record.PROGRAM && e.AQID === record.AQID );
    }

    function validate_data(record, DB_data) {
        if (record.ERROR === "" || typeof record.ERROR === "undefined") {
            record = validate_GH_SITE(DB_data, record);
            record = validate_PROGRAM(DB_data, record);
            if(record.FLEX_KITS && record.FLEX_KITS !== 'Y'){
                record.ERROR = record.ERROR === "" ? `Flex Kits field accepts ONLY "Y" value` : `${record.ERROR} and Flex Kits field accepts ONLY "Y" value`;
            }
            if(record.TRANSFER_FLAG && record.TRANSFER_FLAG !== 'Y' && record.TRANSFER_FLAG !== 'N'){
                record.ERROR = record.ERROR === "" ? `This field accepts ONLY "Y" or 'N" values` : `${record.ERROR} and This field accepts ONLY "Y" or 'N" values`;
            }
        }
        return record;
    }

    function validate_GH_SITE(DB_data, record) {
        let key_array = ["TO_GHSITE"];
        let tempGetKeyArray = getTempKeys(record, key_array);
        let map_found = getMultiLevelValue(DB_data.GH_SITE_map, tempGetKeyArray);
        if (map_found === undefined){
            record.ERROR = record.ERROR === "" ? `Invalid To Function Location` : `${record.ERROR} and Invalid To Function Location`;
        } else {
            record.TO_CM = map_found.CM;
            record.TO_SITE = map_found.SITE;
            record.SAP_TO_CM_SITE = `${record.TO_CM}-${record.TO_SITE}`;
        }
        return record;
    }

    function validate_PROGRAM(DB_data, record) {
        let key_array = ["TO_PROGRAM"];
        let tempGetKeyArray = getTempKeys(record, key_array);
        let map_found = getMultiLevelValue(DB_data.PROGRAM_map, tempGetKeyArray);
        if (map_found === undefined){
            record.ERROR = record.ERROR === "" ? `Invalid To PROGRAM` : `${record.ERROR} and Invalid To PROGRAM`;
        }
        return record;
    }

    function AuthorizationCheck(record, allowed_cmsite) {
        if (record.ERROR === "" || typeof record.ERROR === "undefined") {
            if (Object.keys(allowed_cmsite).length !== 0) {
                record.ERROR = (allowed_cmsite[`${record.CM}-${record.SITE}`] !== undefined || 
                    allowed_cmsite[`$unrestricted-${record.SITE}`] !== undefined || 
                    allowed_cmsite[`${record.CM}-$unrestricted}`] !== undefined || 
                    allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? '' : `User doesn't have authorization for this CM-SITE combination`;
            } 
        }
        return record.ERROR;
    }

    function data_validation(record, input, db_unscannable, newQTYSelAll) {
        let flg = false;
        if (record.ERROR === "") {
            let totQTY = 0, totBalQTY = 0;
            let newData = get_qty(input, record);
            let oldData = get_qty(db_unscannable, record);
            oldData.map(el => {
                if (el.GH_SITE === record.GH_SITE && el.PROGRAM === record.PROGRAM && el.AQID === record.AQID) {
                    let new_rec_index = newData.findIndex(rec => rec.GH_SITE === el.GH_SITE && rec.PROGRAM === el.PROGRAM
                        && rec.AQID === el.AQID && rec.SEQUENCE_NO === el.SEQUENCE_NO )
                    if (new_rec_index >= 0) {
                        totQTY = el.PROJECTED_QTY;
                        totBalQTY = get_totbalQTY(newQTYSelAll, totBalQTY, newData, new_rec_index);
                        newData.splice(new_rec_index, 1);
                    }
                    else {
                        totQTY = el.PROJECTED_QTY;
                        totBalQTY = totBalQTY + el.QTY;
                    }
                }
            });
            let temp = compare_BalQTY_QTY(totBalQTY, totQTY,newData, record);
            record.ERROR = temp.ERROR;
            flg = temp.flg;
        }
        return { error: record.ERROR, QTYExceed: flg };
    }

    function get_qty(QTYCal, data) {
        return QTYCal.filter(el => {
            if (el.GH_SITE === data.GH_SITE && el.PROGRAM === data.PROGRAM && el.AQID === data.AQID ) {
                return el;
            }
        });
    }

    function get_output_recs(QTYCal, data) {
        return QTYCal.filter(el => {
            if (el.FROM_GHSITE === data.GH_SITE && el.FROM_PRODUCT === data.PROGRAM && el.AQID === data.TABLE_MAPPED_AQID) {
                return el;
            }
        });
    }

    function get_totbalQTY(newQTYSelAll, totBalQTY, newData, new_rec_index) {
        if (newQTYSelAll) {
            totBalQTY = totBalQTY + newQTYSelAll;
        } else {
            totBalQTY = totBalQTY + Number(newData[new_rec_index].QTY);
        }
        return totBalQTY;
    }

    function compare_BalQTY_QTY(totBalQTY, totQTY, newData, data) {
        let record = {};
        record.ERROR = "";
        if(newData.length > 0){
            newData.forEach( el => {
                if (el.GH_SITE === data.GH_SITE && el.PROGRAM === data.PROGRAM && el.AQID === data.AQID) {
                totBalQTY = totBalQTY + el.QTY;
                }
            })
        }
        if (totQTY != totBalQTY) {
            record.ERROR = "Transfer Quantity is not equal to Projected Qty";
            record.flg = true;
        }
        return record;
    }

    function fill_error(param, qty_exceed_a, record) {
        if (param.QTYExceed) {
            const index = qty_exceed_a.findIndex(el => el.GH_SITE === record.GH_SITE && el.PROGRAM === record.PROGRAM && el.AQID === record.AQID);
            if (index < 0) {
                let QTY_exceed = {};
                QTY_exceed.GH_SITE = record.GH_SITE;
                QTY_exceed.PROGRAM = record.PROGRAM;
                QTY_exceed.AQID = record.AQID;
                QTY_exceed.ERROR = "Transfer Quantity can’t exceed Projected Qty";
                qty_exceed_a.push(QTY_exceed);
            }
        }
        return qty_exceed_a;
    }

    function get_update_recs(record, Unscannable_update, request) {
        if (record.ERROR === "" || record.ERROR === undefined) {
            record.ERROR = "";
            record.STATUS = "Pending";
            record.MODIFIEDAT = new Date().toISOString();
            record.MODIFIEDBY = request.user.id;
            record.MODIFIEDBY_NAME = request.req.params.user_name;
            record.MODIFIEDBY_MAIL = request.req.params.user_mail;
            record.REVIEWED_BY = "";
            record.REVIEW_DATE = null;
            record.REVIEWED_BY_NAME = "";
            record.REVIEWED_BY_MAIL = "";
            Unscannable_update.push(record);
        }
        return Unscannable_update;
    }

    function fill_data_bydb(data, DB_data, FU) {
        let record = {};
        record.ID = DB_data.ID;
        record.GH_SITE = DB_data.GH_SITE;
        record.CM = DB_data.CM;
        record.SITE = DB_data.SITE;
        record.PROGRAM = DB_data.PROGRAM;
        record.FROM_BUSINESS_GRP = DB_data.FROM_BUSINESS_GRP ? DB_data.FROM_BUSINESS_GRP : '';
        record.AQID = DB_data.AQID;
        record.MAPPED_AQID = DB_data.MAPPED_AQID;
        record.TABLE_MAPPED_AQID = DB_data.TABLE_MAPPED_AQID;
        record.SEQUENCE_NO = DB_data.SEQUENCE_NO;
        record.NPI_INDICATOR = DB_data.NPI_INDICATOR;
        record.PROJECTED_QTY = DB_data.PROJECTED_QTY;
        record.CREATEDAT = DB_data.CREATEDAT;
        record.CREATEDBY = DB_data.CREATEDBY;
        record.CREATEDBY_NAME = DB_data.CREATEDBY_NAME;
        record.CREATEDBY_MAIL = DB_data.CREATEDBY_MAIL;
        record.MODIFIEDAT = DB_data.MODIFIEDAT;
        record.MODIFIEDBY = DB_data.MODIFIEDBY;
        record.MODIFIEDBY_NAME = DB_data.MODIFIEDBY_NAME;
        record.MODIFIEDBY_MAIL = DB_data.MODIFIEDBY_MAIL;
        record.TO_GHSITE = get_data_based_meth(data.TO_GHSITE, FU, DB_data.TO_GHSITE);
        record.TO_CM = get_data_based_meth(data.TO_CM, FU, DB_data.TO_CM);
        record.TO_SITE = get_data_based_meth(data.TO_SITE, FU, DB_data.TO_SITE);
        record.TO_PROGRAM = get_data_based_meth(data.TO_PROGRAM, FU, DB_data.TO_PROGRAM);
        record.TO_BUSINESS_GRP = get_data_based_meth(data.TO_BUSINESS_GRP, FU, DB_data.TO_BUSINESS_GRP);
        record.TRANSFER_FLAG = get_data_based_meth(data.TRANSFER_FLAG, FU, DB_data.TRANSFER_FLAG);
        record.FLEX_KITS = data.FLEX_KITS ;
        record.COMMENT = get_data_based_meth(data.COMMENT, FU, DB_data.COMMENT);
        record.QTY = ( containsOnlyNumbers(data.QTY) || FU ) ? data.QTY : DB_data.QTY;
        record.SAP_CM_SITE = `${DB_data.CM}-${DB_data.SITE}`;
        record.SAP_TO_CM_SITE = `${record.TO_CM}-${record.TO_SITE}`;
        record.REVIEWED_BY = DB_data.REVIEWED_BY;
        record.REVIEW_DATE = DB_data.REVIEW_DATE;
        record.REVIEWED_BY_NAME = DB_data.REVIEWED_BY_NAME;
        record.REVIEWED_BY_MAIL = DB_data.REVIEWED_BY_MAIL;
        record.ERROR = data.ERROR ? data.ERROR : "";
        return record;
    }

    function get_data_based_meth(curr_value, FU, db_value) {
        return ( curr_value || FU ) ? curr_value : db_value;
    }

    function Push_ErrRecs(record, Err_records) {
        if (record.ERROR) {
            Err_records.push(record);
        }
        return Err_records;
    }

    async function update_data_into_db(update_data, tx, request, DB_data) {
        let changelog_data_a = [];
        let changelog_unscan = {};
        let changelog_output = {};
        let del_filter_a = [];
        let del_filter_o = [];
        let Output_Insert = [];
        if (update_data.length > 0) {
            changelog_unscan.new_records = [];
            changelog_unscan.old_records = [];
            changelog_output.new_records = [];
            changelog_output.old_records = [];
            let queries = [];
            update_data.forEach(element1 => {
                const index = before_data.findIndex(e1 => e1.GH_SITE === element1.GH_SITE && e1.PROGRAM === element1.PROGRAM && e1.AQID === element1.AQID && e1.SEQUENCE_NO === element1.SEQUENCE_NO && e1.uuid === request.req.params.uuid);
                if (index >= 0) {
                    let outcome = get_output_array(DB_data, before_data[index], changelog_output, del_filter_o, Output_Insert, before_data[index].STATUS, request);
                    del_filter_o = outcome.del_filter_o;
                    changelog_output = outcome.changelog_output;
                    Output_Insert = outcome.Output_Insert;
                    let old_record = [];
                    let new_record = [];
                    old_record = Unscannable_data(before_data[index]);
                    changelog_unscan.old_records.push(old_record);
                    before_data.splice(index, 1);
                    new_record = Unscannable_data(element1);
                    changelog_unscan.new_records.push(new_record);
                    del_filter_a.push(element1.ID);
                }
                element1.MAPPED_AQID = element1.TABLE_MAPPED_AQID;
                element1 = delete_unwanted_fields(element1);     
            }
            );
            queries = delete_via_id(del_filter_a, queries);
            queries = deleteInChunk(del_filter_o, queries, "COM_APPLE_COA_T_COA_OUTPUT");
            if (queries.length > 0) {
                await tx.run(queries);
            }
            await insert_into_db(update_data, "COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT", tx);
            await insert_into_db(Output_Insert, "COM_APPLE_COA_T_COA_OUTPUT", tx);
            changelog_data_a = push_changelog(changelog_output, changelog_data_a, "UPDATE", "T_COA_OUTPUT");
            changelog_data_a = push_changelog(changelog_unscan, changelog_data_a, "UPDATE", "T_COA_RFID_UNSCANNABLE_TT");
        }
        await tx.commit();
        if (changelog_data_a.length > 0) {
            update_changelog(changelog_data_a, request);
        }
    }

    async function insert_into_db(insert_data, db, tx) {
        if (insert_data.length > 0) {
            await tx.run(INSERT.into(db).entries(insert_data));
        }
    }

    function get_output_array(DB_data, record, changelog_output, del_filter_o, Output_Insert, STATUS, request) {
        if (STATUS === "Approved") {
            record.CO_TYPE = 'Unscanned';
            let key_array = ["CM","SITE","PROGRAM","TABLE_MAPPED_AQID","TO_CM","TO_SITE", "TO_PROGRAM","CO_TYPE"];
            let tempGetKeyArray = getTempKeys(record, key_array);
            let map_found = getMultiLevelValue(DB_data.Output_map, tempGetKeyArray);
            if (map_found !== undefined){
                let outcome = sub_from_output(DB_data.Output, record, Output_Insert, changelog_output, del_filter_o, request);
                changelog_output = outcome.changelog_data;
                Output_Insert = outcome.Output_Insert;
                del_filter_o = outcome.del_filter_a;
            }
            delete record.CO_TYPE;
        }
        return { changelog_output, Output_Insert, del_filter_o };
    }

    function delete_via_id(del_filter_a, queries) {
        if (del_filter_a.length > 0) {
            let chunkSize = 2500;
            let k;
            for (k = 0; k < del_filter_a.length; k += chunkSize) {
                let selectChunkKeys = del_filter_a.slice(k, k + chunkSize);
                queries.push(DELETE.from("COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT").where({ ID: { in: selectChunkKeys } }));
            }
        }
        return queries;
    }

    function push_changelog(changelog_data, changelog_data_a, action, table) {
        if (changelog_data.new_records.length > 0) {
            changelog_data.action = action;
            changelog_data.table = table;
            changelog_data_a.push(changelog_data);
        }
        return changelog_data_a;
    }

    function Unscannable_data(request) {
        let record = [];
        if (request) {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.GH_SITE);
            record.push(request.CM);
            record.push(request.SITE);
            record.push(request.PROGRAM);
            record.push(request.AQID);
            record.push(request.SEQUENCE_NO);
            record.push(request.FROM_BUSINESS_GRP);
            record.push(request.NPI_INDICATOR);
            record.push(request.PROJECTED_QTY);
            record.push(request.FLEX_KITS);
            record.push(request.TRANSFER_FLAG);
            record.push(request.TO_GHSITE);
            record.push(request.TO_CM);
            record.push(request.TO_SITE);
            record.push(request.TO_PROGRAM);
            record.push(request.TO_BUSINESS_GRP);
            record.push(request.QTY);
            record.push(request.STATUS);
            record.push(request.REVIEW_DATE);
            record.push(request.REVIEWED_BY);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.REVIEWED_BY_NAME);
            record.push(request.REVIEWED_BY_MAIL);
            record.push(request.SAP_CM_SITE);
            record.push(request.SAP_TO_CM_SITE);
            record.push(request.COMMENT);
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
            record.push(0);
            record.push(0);
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
        }
        return record;
    }

    function deleteInChunk(delQueue, queries, table) {
        let chunkSize = 900;
        let k = 0;
        for (; k < delQueue.length; k += chunkSize) {
            let deleteChunk = delQueue.slice(k, k + chunkSize);
            let delQ = changeObjArrayToQuery(deleteChunk);
            queries.push(DELETE.from(table).where(delQ));
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


    function update_changelog(changelog_data_a, request) {
        const LOG = request.req.params.LOG;
        LOG.info(`Call Changelog service to update the changes to Changelog table`);
        let result_a = [];
        try{
            const core = require("@sap-cloud-sdk/core");
            const xsenv = require("@sap/xsenv");
            xsenv.loadEnv();
            const sDestinationName = "COA_APIM_CC";
            changelog_data_a.forEach(element => {
                let result = {};
                result.TableName = element.table;
                result.old_records = [];
                result.new_records = [];
                result.old_records = element.old_records;
                result.new_records = element.new_records;
                result.actionType = element.action;
                result.user_data = {};
                result.user_data.user = request.req.params.user;
                result.user_data.name = request.req.params.user_name;
                result.user_data.email = request.req.params.user_mail;
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
        } catch (error) {
            LOG.info(`Error: ${error}`);
        }
    }

    function output_data(request) {
        let record = [];
        if (request) {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.FROM_CM);
            record.push(request.FROM_SITE);
            record.push(request.FROM_PRODUCT);
            record.push(request.AQID);
            record.push(request.TO_CM);
            record.push(request.TO_SITE);
            record.push(request.TO_PRODUCT);
            record.push(request.CO_TYPE);
            record.push(request.FROM_GHSITE);
            record.push(request.TO_GHSITE);
            record.push(request.FROM_BUSINESS_GRP);
            record.push(request.TO_BUSINESS_GRP);
            record.push(request.EQ_NAME);
            record.push(request.MFR);
            record.push(request.QUANTITY);
            record.push(request.CM_BALANCE_QTY);
            record.push(request.APPROVED_BY);
            record.push(request.REVIEW_DATE);
            record.push(request.STATUS);
            record.push(request.COMMENT);
            record.push(request.SAP_CM_SITE);
            record.push(request.SAP_TO_CM_SITE);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.APPROVED_BY_NAME);
            record.push(request.APPROVED_BY_MAIL);
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

    function add_to_output(DB_Output, record, Output_Insert, changelog_data, del_filter_a, request) {
        let Output_Insert_Index = Output_Insert.findIndex(e => e.FROM_GHSITE === record.GH_SITE && e.FROM_PRODUCT === record.PROGRAM && e.AQID === record.TABLE_MAPPED_AQID && e.TO_GHSITE === record.TO_GHSITE && e.TO_PRODUCT === record.TO_PROGRAM && e.CO_TYPE === "Unscanned");
        if (Output_Insert_Index >= 0) {
            Output_Insert[Output_Insert_Index].QUANTITY = Output_Insert[Output_Insert_Index].QUANTITY + record.QTY;
        }
        else {
            let outcome = reset_qty(DB_Output, Output_Insert, record, changelog_data, request, del_filter_a, "Add");
            Output_Insert = outcome.Output_Insert;
            changelog_data = outcome.changelog_data;
            del_filter_a = outcome.del_filter_a;
        }
        return { Output_Insert, changelog_data, del_filter_a };
    }

    function reset_qty(DB_Output, Output_Insert, record, changelog_data, request, del_filter_a, action) {
        let old_record = [];
        let new_record = [];
        let Reset_data = get_output_recs(DB_Output, record);
        const index1 = Output_Insert.findIndex(e => e.FROM_GHSITE === record.GH_SITE && e.FROM_PRODUCT === record.PROGRAM && e.AQID === record.TABLE_MAPPED_AQID);
        if (index1 < 0) {
            Reset_data.forEach(e => {
                old_record = output_data(e);
                changelog_data = push_to_changelog_array(action, changelog_data, old_record);
                e.QUANTITY = get_upd_qty(e.QUANTITY, action, record.QTY, e, record);
                e.MODIFIEDAT = new Date().toISOString();
                e.MODIFIEDBY = request.user.id;
                e.FROM_BUSINESS_GRP = e.FROM_BUSINESS_GRP ? e.FROM_BUSINESS_GRP : record.FROM_BUSINESS_GRP;
                e.COMMENT = `Quantity Reset`;
                e.CM_BALANCE_QTY = 0;
                e.APPROVED_BY = "";
                e.REVIEW_DATE = null;
                e.APPROVED_BY_NAME = "";
                e.APPROVED_BY_MAIL = "";
                e.STATUS = (e.STATUS === "Rejected" || e.STATUS === "") ? e.STATUS : "Pending";
                new_record = output_data(e);
                action === "Add" ? changelog_data.changelog_output_u.new_records.push(new_record) : changelog_data.new_records.push(new_record);
                Output_Insert.push(e);
                let del_filter = {};
                del_filter.FROM_CM = e.FROM_CM;
                del_filter.FROM_SITE = e.FROM_SITE;
                del_filter.FROM_PRODUCT = e.FROM_PRODUCT;
                del_filter.AQID = e.AQID;
                del_filter.TO_CM = e.TO_CM;
                del_filter.TO_SITE = e.TO_SITE;
                del_filter.TO_PRODUCT = e.TO_PRODUCT;
                del_filter.CO_TYPE = e.CO_TYPE;
                del_filter_a.push(del_filter);
            });
        }
        const index = Reset_data.findIndex(e => e.FROM_GHSITE === record.GH_SITE && e.FROM_PRODUCT === record.PROGRAM && e.AQID === record.TABLE_MAPPED_AQID && e.TO_GHSITE === record.TO_GHSITE && e.TO_PRODUCT === record.TO_PROGRAM && e.CO_TYPE === "Unscanned");
        if (index < 0 && action === "Add") {
            let outcome = create_new_co_op(changelog_data, Output_Insert, record, request);
            Output_Insert = outcome.Output_Insert;
            changelog_data = outcome.changelog_data;
        }
        return { Output_Insert, changelog_data, del_filter_a };
    }

    function push_to_changelog_array(action, changelog_data, old_record) {
        action === "Add" ? changelog_data.changelog_output_u.old_records.push(old_record) : changelog_data.old_records.push(old_record);
        return changelog_data;
    }

    function create_new_co_op(changelog_data, Output_Insert, record, request) {
        let old_record = [];
        let new_record = [];
        let Output =
        {
            FROM_CM: record.CM,
            FROM_SITE: record.SITE,
            FROM_PRODUCT: record.PROGRAM,
            AQID: record.TABLE_MAPPED_AQID,
            TO_CM: record.TO_CM,
            TO_SITE: record.TO_SITE,
            TO_PRODUCT: record.TO_PROGRAM,
            FROM_GHSITE: record.GH_SITE,
            TO_GHSITE: record.TO_GHSITE,
            FROM_BUSINESS_GRP: record.FROM_BUSINESS_GRP ? record.FROM_BUSINESS_GRP : '',
            TO_BUSINESS_GRP: record.TO_BUSINESS_GRP,
            EQ_NAME: record.EQUIPMENT_NAME,
            MFR: record.MFR,
            QUANTITY: record.QTY,
            CM_BALANCE_QTY: 0,
            APPROVED_BY: "",
            REVIEW_DATE: null,
            STATUS: "",
            COMMENT: "",
            SAP_CM_SITE: record.SAP_CM_SITE,
            SAP_TO_CM_SITE: record.SAP_TO_CM_SITE,
            MODIFIEDAT: new Date().toISOString(),
            MODIFIEDBY: request.user.id,
            MODIFIEDBY_NAME: request.req.params.user_name,
            MODIFIEDBY_MAIL: request.req.params.user_mail,
            CREATEDAT: new Date().toISOString(),
            CREATEDBY: request.user.id,
            CREATEDBY_NAME: request.req.params.user_name,
            CREATEDBY_MAIL: request.req.params.user_mail,
            APPROVED_BY_NAME: "",
            APPROVED_BY_MAIL: "",
            CO_TYPE: "Unscanned"
        };
        old_record = output_data("");
        changelog_data.changelog_output_i.old_records.push(old_record);
        new_record = output_data(Output);
        changelog_data.changelog_output_i.new_records.push(new_record);
        Output_Insert.push(Output);
        return { Output_Insert, changelog_data };
    }

    function get_upd_qty(data, action, Qty, e, record) {
        if (e.FROM_GHSITE === record.GH_SITE && e.FROM_PRODUCT === record.PROGRAM && e.AQID === record.TABLE_MAPPED_AQID && e.TO_GHSITE === record.TO_GHSITE && e.TO_PRODUCT === record.TO_PROGRAM && e.CO_TYPE === "Unscanned") {
            if (action === "Add") {
                data = Number(data) + Qty;
            } else {
                data = Number(data) - Qty;
                data = data < 0 ? 0 : data;
            }
        }
        return data;
    }

    function sub_from_output(DB_Output, record, Output_Insert, changelog_data, del_filter_a, request) {
        let DB_Output_Index = Output_Insert.findIndex(e => e.FROM_GHSITE === record.GH_SITE && e.FROM_PRODUCT === record.PROGRAM && e.AQID === record.TABLE_MAPPED_AQID && e.TO_GHSITE === record.TO_GHSITE && e.TO_PRODUCT === record.TO_PROGRAM && e.CO_TYPE === "Unscanned");
        if (DB_Output_Index >= 0) {
            Output_Insert[DB_Output_Index].QUANTITY = (Output_Insert[DB_Output_Index].QUANTITY - record.QTY) ;
            Output_Insert[DB_Output_Index].QUANTITY = Output_Insert[DB_Output_Index].QUANTITY < 0 ? 0 : Output_Insert[DB_Output_Index].QUANTITY;
        }
        else {
            let outcome = reset_qty(DB_Output, Output_Insert, record, changelog_data, request, del_filter_a, "Subtract");
            Output_Insert = outcome.Output_Insert;
            changelog_data = outcome.changelog_data;
            del_filter_a = outcome.del_filter_a;
        }
        return { Output_Insert, changelog_data, del_filter_a };
    }

    srv.before("POST", Unscannable_Split, async (request) => {
        cds.env.features.kibana_formatter = true;
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Unscannable: POST Unscannable_Split' });
        try {
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "user_name": `${jwtdetails.given_name} ${jwtdetails.family_name}`, "user_mail": jwtdetails.email, "LOG": LOG };
            }
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            let allowed_cmsite = allowedAttributes[`UnScannableModify`];
            if (request.data.SplitData.length > 2 && request.data.Action === 'SPLIT') {
                request.reject(500, 'Split functionality is possible only on one record at a time');
            }
            if (request.data.SplitData.length < 1 && (!request.data.URL || request.data.Action === 'SPLIT')) {
                request.reject(500, `Nothing to ${request.data.Action}`);
            }
            if (request.data.SplitData.length > 5000) {
                request.reject(500, 'Delete is not allowed for more than 5K records');
            }
            if (request.data.Action === 'SPLIT') {
                let Error = AuthorizationCheck(request.data.SplitData[0], allowed_cmsite);
                if (Error) {
                    request.reject(500, `${Error}`);
                }
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.on("POST", Unscannable_Split, async (request) => {
        const LOG = request.req.params.LOG;
        const tx = hdb.tx();
        try {
            if (request.data.Action === 'SPLIT') {
                await split(tx, request);
            } else {
                await delete_split(tx, request);
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function split(tx, request) {
        let insert_data = [];
        let index;
        let changelog_data_a = [];
        let changelog_data = {};
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        let result = [];
        result = await cds.run(SELECT.from(Carryover_rfid_unscannable).where(
            {
                GH_SITE: request.data.SplitData[0].GH_SITE,
                CM: request.data.SplitData[0].CM,
                SITE: request.data.SplitData[0].SITE,
                PROGRAM: request.data.SplitData[0].PROGRAM,
                AQID: request.data.SplitData[0].AQID
            }).orderBy('SEQUENCE_NO desc'));
        if (result.length > 0) {
            index = result.length - 1;
            if (result.length >= result[index].PROJECTED_QTY) {
                request.reject(500, 'Split Item Count is exeeding the limit(Projected QTY)');
            }
            reject_if_syncIP(result, request);
            request.data.SplitData = request.data.SplitData[0].SEQUENCE_NO === null ? request.data.SplitData.splice(1, 1) : request.data.SplitData.splice(0, 1);
        } else {
            request.reject(500, `Record doesn't Exists`);
        }
        request.data.SplitData.forEach(element => {
            insert_data = create_new_record(element, result[index], request, insert_data, result[0].SEQUENCE_NO);
            let old_record = [];
            let new_record = [];
            old_record = Unscannable_data("");
            changelog_data.old_records.push(old_record);
            new_record = Unscannable_data(element);
            changelog_data.new_records.push(new_record);
        });
        await insert_into_db(insert_data, "COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT", tx);
        await tx.commit();
        changelog_data_a = push_changelog(changelog_data, changelog_data_a, "INSERT", "T_COA_RFID_UNSCANNABLE_TT");
        if (changelog_data_a.length > 0) {
            update_changelog(changelog_data_a, request);
        }
    }

    function reject_if_syncIP(result, request){
        if(check_sync_status(result[0].SYNC_STATUS, '')){
            request.reject(500, `Sync is in Progress for this GH Site`);
        }
    }

    function create_new_record(element, result, request, insert_data, Sequence_No) {
        let record = {};
        record.ID = getuuid();
        record.GH_SITE = element.GH_SITE;
        record.CM = element.CM;
        record.SITE = element.SITE;
        record.PROGRAM = element.PROGRAM ? element.PROGRAM : '';
        record.FROM_BUSINESS_GRP = element.FROM_BUSINESS_GRP ? element.FROM_BUSINESS_GRP : '';
        record.AQID = element.AQID;
        record.SEQUENCE_NO = Sequence_No + 1;
        record.NPI_INDICATOR = element.NPI_INDICATOR;
        record.PROJECTED_QTY = result.PROJECTED_QTY;
        record.MODIFIEDBY_NAME = request.req.params.user_name;
        record.MODIFIEDBY_MAIL = request.req.params.user_mail;
        record.MODIFIEDBY = request.user.id;
        record.MODIFIEDAT = new Date().toISOString();
        record.CREATEDBY_NAME = request.req.params.user_name;
        record.CREATEDBY_MAIL = request.req.params.user_mail;
        record.CREATEDBY = request.user.id;
        record.CREATEDAT = new Date().toISOString();
        record.TO_GHSITE = "";
        record.TO_CM = "";
        record.TO_SITE = "";
        record.TO_PROGRAM = "";
        record.TO_BUSINESS_GRP = "";
        record.TRANSFER_FLAG = "";
        record.FLEX_KITS = "";
        record.QTY = "";
        record.COMMENT = "";
        record.SAP_CM_SITE = `${record.CM}-${record.SITE}`;
        record.SAP_TO_CM_SITE = "";
        record.REVIEWED_BY = "";
        record.REVIEW_DATE = null;
        record.REVIEWED_BY_NAME = "";
        record.REVIEWED_BY_MAIL = "";
        record.MAPPED_AQID = "";
        insert_data.push(record);
        return insert_data;
    }


    async function delete_split(tx, request) {
        let del_split_a = [];
        let queries = [];
        let unscannable_err = [];
        let outcome = {};
        if (request.data.URL) {
            outcome = await selectall_delete(request);
        } else {
            outcome = await block_delete(request);
        }
        unscannable_err = outcome.unscannable_err;
        del_split_a = outcome.del_split_a;
        if (del_split_a.length > 0) {
            queries = delete_via_id(del_split_a, queries);
        }
        if (queries.length > 0) {
            await tx.run(queries);
        }
        await tx.commit();
        if (unscannable_err.length > 0) {
            request._.res.send({ msg: unscannable_err });
        }
    }

    async function selectall_delete(request) {
        let unscannable_err = [];
        let del_split_a = [];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let result = await get_data_by_url(request, allowedAttributes);
        reject_if_limitexceeds(result, 'Delete', request);
        result.forEach(element => {
            if (element.SEQUENCE_NO === 0) {
                element.ERROR = `Parent records cannot be deleted`;
                unscannable_err.push(element);
            } else if (element.STATUS === 'Approved') {
                element.ERROR = `Approved records can’t be deleted`;
                unscannable_err.push(element);
            } else if (check_sync_status(element.SYNC_STATUS, '')) {
                element.ERROR = `Sync is in Progress for this GH Site`;
                unscannable_err.push(element);
            }else {
                del_split_a.push(element.ID);
            }
        });
        return { del_split_a, unscannable_err };

    }

    async function block_delete(request) {
        let unscannable_err = [];
        let Unscannable_map = {};
        let Unscannables = [];
        let del_split_a = [];
        let Temp = [];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = allowedAttributes[`UnScannableModify`];
        request.data.SplitData.forEach(element => {
            let temp = {};
            temp.ID = getuuid();
            temp.GUID = request.req.params.uuid;
            temp.GH_SITE = element.GH_SITE;
            temp.PROGRAM = element.PROGRAM;
            temp.AQID = element.AQID;
            temp.TO_GHSITE = element.TO_GHSITE;
            temp.TO_PRODUCT = element.TO_PROGRAM;
            temp.SEQUENCE_NO = element.SEQUENCE_NO;
            Temp.push(temp);
        });

        await push_temp_data(Temp);
        Unscannables = await cds.run(`SELECT V_UNSCANNABLES.*
                                            FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                            INNER JOIN V_UNSCANNABLES AS V_UNSCANNABLES
                                            ON T_COA_TEMP.GH_SITE = V_UNSCANNABLES.GH_SITE
                                            AND T_COA_TEMP.PROGRAM = V_UNSCANNABLES.PROGRAM
                                            AND T_COA_TEMP.AQID = V_UNSCANNABLES.AQID
                                            AND T_COA_TEMP.SEQUENCE_NO = V_UNSCANNABLES.SEQUENCE_NO
                                            WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);
        if(Unscannables.length > 0){
            let keyArray = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            fillMultimap(Unscannable_map, Unscannables, keyArray);
        }
        await delete_temp_data(request.req.params.uuid);

        request.data.SplitData.forEach(element => {
            let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            let tempGetKeyArray = getTempKeys(element, key_array);
            let map_found = getMultiLevelValue(Unscannable_map, tempGetKeyArray);
            if (map_found !== undefined){
                if (map_found.SEQUENCE_NO === 0) {
                    element.ERROR = `Parent records cannot be deleted`;
                    unscannable_err.push(element);
                } else if (map_found.STATUS === 'Approved') {
                    element.ERROR = `Approved records can’t be deleted`;
                    unscannable_err.push(element);
                } else if (AuthorizationCheck(element, allowed_cmsite)) {
                    element.ERROR = `User doesn't have authorization for this CM-SITE combination`;
                    unscannable_err.push(element);
                } else if(check_sync_status(map_found.SYNC_STATUS, '')){
                    element.ERROR = `Sync is in Progress for this GH Site`;
                    unscannable_err.push(element);
                }else {
                    del_split_a.push(map_found.ID);
                }
            }
        });
        return { del_split_a, unscannable_err };
    }

    srv.before("POST", Unscannable_action, async (request) => {
        cds.env.features.kibana_formatter = true;
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Unscannable: POST Unscannable_action' });
        try {
            if(typeof request.query.INSERT.entries[0].auth !== "undefined"){
                request.headers.authorization = request.query.INSERT.entries[0].auth;
                request.data = { UnscanData: request.query.INSERT.entries[0].UnscanData, Action:  request.query.INSERT.entries[0].Action, RESET_FLAG: request.query.INSERT.entries[0].RESET_FLAG};
                request.req = { params: ""};
            }else{
                request.data.RESET_FLAG = '';
            }
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id, "user_name": `${jwtdetails.given_name} ${jwtdetails.family_name}`, "user_mail": jwtdetails.email, "LOG":LOG };
            }
            if ((!request.data.URL || request.data.URL === undefined) && request.data.UnscanData.length < 1) {
                request.reject(500, 'No Changes are made.Save not required');
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.on("POST", Unscannable_action, async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`In On event of Unscannable_action`);
        const tx = hdb.tx();
        let output_err = [];
        let result = [];
        try {
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getallowedAttributes(jwtdetails, request);
            if (request.data.URL) {
                if (request.data.QTY !== undefined && !containsOnlyNumbers(request.data.QTY)) {
                    request.reject(500, 'Invalid QTY');
                }
                result = await get_data_by_url(request, allowedAttributes);
                reject_if_limitexceeds(result, request.data.Action, request);
                output_err = await selectall_action(request, result, tx);
                let msg = get_msg(output_err, request.data.Action);
                request._.res.send({ msg: msg });
            } else {
                reject_if_limitexceeds(request.data.UnscanData, request.data.Action, request);
                output_err = await block_mass_update(request, tx, allowedAttributes);
                let msg = get_msg(output_err, request.data.Action);
                request._.res.send({ msg: msg });
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function get_data_by_url(request, allowedAttributes) {
        let result = [];
        let filters = request.data.URL;
        filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' <> ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
        let regex = /contains\((\w+),‘(\w+)‘\)/g;
        filters = filters.replace(regex, `($1 like ‘%$2%’)`);
        let filterString = request.data.Action === "Approve" ? getFilterString(allowedAttributes[`ApproveRfidOnHandTT`], 'X') : getFilterString(allowedAttributes[`UnScannableModify`], 'X');
        filters = filterString ? `(${filterString}) and ${filters}` : filters;
        result = await cds.run(SELECT.from(Carryover_rfid_unscannable).where(cds.parse.expr(filters)));
        return result;
    }

    function reject_if_limitexceeds(result_a, action, request) {
        if (result_a.length > 5000) {
            request.reject(500, `Mass ${action} is allowed only for 5K records`);
        }
    }

    async function selectall_action(request, result, tx) {
        let unscannable_err = [];
        let outcome = {};
        let final_array = {};
        let insert_data = {};
        insert_data.Output_Insert = [];
        insert_data.Unscannable_Insert = [];
        let queries = [];
        let changelog_data_a = [];
        let changelog_data = {};
        changelog_data.changelog_unscan_u = {};
        changelog_data.changelog_output_u = {};
        changelog_data.changelog_output_i = {};
        changelog_data.changelog_unscan_u.new_records = [];
        changelog_data.changelog_unscan_u.old_records = [];
        changelog_data.changelog_output_u.new_records = [];
        changelog_data.changelog_output_u.old_records = [];
        changelog_data.changelog_output_i.new_records = [];
        changelog_data.changelog_output_i.old_records = [];
        let del_filter = {};
        del_filter.del_filter_u = [];
        del_filter.del_filter_o = [];
        let DB_data = {};
        DB_data.GH_SITE = [];
        DB_data.PROGRAM = [];
        DB_data.Unscannable = [];
        DB_data.Output = [];
        DB_data.Unscannable_map = {};
        DB_data.Output_map = {};
        DB_data.PROGRAM_map = {};
        let range = {};
        range.GH_SITE = [];
        range.PROGRAM = [];
        range.Temp = [];
        let qty_exceed_a = [];
        range = selectall_range(range, result, request);
        DB_data = await get_dbdata(tx, range, DB_data, request,'');
        switch (request.data.Action) {
            case "Approve":
                result.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    e.ERROR = validate_record_op(e);
                    outcome = approve_records(e, insert_data, del_filter, changelog_data, DB_data.Unscannable_map, DB_data.Output, request);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Reject":
                result.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    outcome = reject_records(e, del_filter, changelog_data, DB_data.Unscannable_map, request, insert_data);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Cancel":
                result.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    if (e.ERROR === "") {
                        outcome = cancel_records(e, insert_data, del_filter, changelog_data, DB_data.Unscannable_map, DB_data.Output, request);
                    }
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Reset":
                result.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    outcome = reset_records(e, insert_data, del_filter, changelog_data, DB_data.Unscannable_map, DB_data.Output, request);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Save":
                request = validate_data_selectall(request, DB_data);
                result.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    e = update_editabe_fields(e, request.data);
                    e.ERROR = check_mand_fields(e);
                    let param = data_validation(e, result, DB_data.Unscannable, request.data.QTY);
                    e.ERROR = param.error;
                    qty_exceed_a = fill_error(param, qty_exceed_a, e);
                    outcome = selectall_save(e, insert_data, del_filter, changelog_data, DB_data.Unscannable_map, DB_data.Output, request);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
        }
        queries = delete_via_id(del_filter.del_filter_u, queries);
        queries = deleteInChunk(del_filter.del_filter_o, queries, 'COM_APPLE_COA_T_COA_OUTPUT');
        if (queries.length > 0) {
            await tx.run(queries);
        }
        await insert_into_db(insert_data.Output_Insert, "COM_APPLE_COA_T_COA_OUTPUT", tx);
        await insert_into_db(insert_data.Unscannable_Insert, "COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT", tx);
        await tx.commit();
        changelog_data_a = push_changelog(changelog_data.changelog_output_i, changelog_data_a, "INSERT", "T_COA_OUTPUT");
        changelog_data_a = push_changelog(changelog_data.changelog_output_u, changelog_data_a, "UPDATE", "T_COA_OUTPUT");
        changelog_data_a = push_changelog(changelog_data.changelog_unscan_u, changelog_data_a, "UPDATE", "T_COA_RFID_UNSCANNABLE_TT");
        if (changelog_data_a.length > 0) {
            update_changelog(changelog_data_a, request);
        }
        return unscannable_err;
    }

    function get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err) {
        if (e.ERROR === "" || typeof (e.ERROR) === "undefined") {
            del_filter = outcome.del_filter;
            changelog_data = outcome.changelog_data;
            e = outcome.data;
            insert_data = outcome.insert_data;
        }
        else {
            unscannable_err.push(e);
        }
        return { e, del_filter, changelog_data, insert_data, unscannable_err };
    }

    function validate_record_op(record) {
        let mapped_aqid_trimmed = getBlankStringIfUndefinedOrNull(record.MAPPED_AQID).toLowerCase().trim();
        if (!record.MAPPED_AQID || mapped_aqid_trimmed === '' || mapped_aqid_trimmed === 'not found' || mapped_aqid_trimmed === 'multiple nb found' || mapped_aqid_trimmed === 'undefined' || mapped_aqid_trimmed === undefined) {
            record.ERROR = record.ERROR ? `${record.ERROR} and Invalid Mapped AQID`: `Invalid Mapped AQID`;
        }
        if (!record.TO_GHSITE) {
            record.ERROR = record.ERROR ? `${record.ERROR} and To GH Site is mandatory` : ` To GH Site is mandatory`;
        }
        if (!record.TO_PROGRAM) {
            record.ERROR = record.ERROR ? `${record.ERROR} and To Program is mandatory` : `To Program is mandatory`;
        }
        if (record.FLEX_KITS) {
            record.ERROR = record.ERROR ? `${record.ERROR} and Records with Flex Kits "Y" cannot be transferred` : `Records with Flex Kits "Y" cannot be transferred`;
        }
        record.ERROR = check_qty_before_approve(record);
        return record.ERROR;
    }

    function check_qty_before_approve(record) {
        if (record.QTY < 1 || !containsOnlyNumbers(record.QTY)) {
            record.ERROR = record.ERROR ? `${record.ERROR} and Records with Transfer Quantity less than 1 cannot be transferred` : `Records with Transfer Quantity less than 1 cannot be transferred`;
        }
        return record.ERROR;
    }

    function update_editabe_fields(e, data) {
        e.TO_GHSITE = data.TO_GHSITE ? data.TO_GHSITE : e.TO_GHSITE;
        e.TO_CM = data.TO_CM ? data.TO_CM : e.TO_CM;
        e.TO_SITE = data.TO_SITE ? data.TO_SITE : e.TO_SITE;
        e.TO_PROGRAM = data.TO_PROGRAM ? data.TO_PROGRAM : e.TO_PROGRAM;
        e.TO_BUSINESS_GRP = data.TO_BUSINESS_GRP ? data.TO_BUSINESS_GRP : e.TO_BUSINESS_GRP;
        e.TRANSFER_FLAG = data.TRANSFER_FLAG ? data.TRANSFER_FLAG : e.TRANSFER_FLAG;
        e.FLEX_KITS = data.FLEX_KITS;
        e.COMMENT = data.COMMENT ? data.COMMENT : e.COMMENT;
        e.QTY = containsOnlyNumbers(data.QTY) ? data.QTY : e.QTY;
        e.SAP_TO_CM_SITE = `${e.TO_CM}-${e.TO_SITE}`;
        delete e.PO_TYPE;
        delete e.CONSUMABLES;
        delete e.EQUIPMENT_NAME;
        delete e.MFR;
        delete e.SCOPE;
        delete e.SPLIT;
        delete e.Parent;
        return e;
    }

    function selectall_range(range, result, request) {
        range.GH_SITE = Append_IfUnique(range.GH_SITE, request.data.TO_GHSITE);
        range.PROGRAM = Append_IfUnique(range.PROGRAM, request.data.TO_PROGRAM);
        result.forEach(e => {
            let temp = {};
            temp.GUID = request.req.params.uuid;
            temp.ID = getuuid();
            temp.GH_SITE = e.GH_SITE;
            temp.PROGRAM = e.PROGRAM;
            temp.AQID = e.AQID;
            temp.MAPPED_AQID = e.TABLE_MAPPED_AQID;
            temp.TO_GHSITE = e.TO_GHSITE;
            temp.TO_PRODUCT = e.TO_PROGRAM;
            temp.SEQUENCE_NO = e.SEQUENCE_NO;
            range.Temp.push(temp);
        });
        return range;
    }

    function validate_data_selectall(request, DB_data) {
        if (DB_data.GH_SITE.length > 0) {
            request.data.TO_CM = DB_data.GH_SITE[0].CM;
            request.data.TO_SITE = DB_data.GH_SITE[0].SITE;
        } else if( request.data.TO_GHSITE ) {
            request.reject(500, `Invalid To Function Location`);
        }
        if (DB_data.PROGRAM.length < 1 && request.data.TO_PROGRAM ) {
            request.reject(500, `Invalid To PROGRAM`);
        }
        if(request.data.FLEX_KITS && request.data.FLEX_KITS !== 'Y'){
            request.reject(500, `Flex Kits field accepts ONLY "Y" value`);
        }
        if(request.data.TRANSFER_FLAG && request.data.TRANSFER_FLAG !== 'Y' && request.data.TRANSFER_FLAG !== 'N'){
            request.reject(500, `This field accepts ONLY "Y" or 'N" values`);
        }
        return request;
    }

    function approve_records(data, insert_data, del_filter, changelog_data, Unscannable, Output, request) {
        let old_record = [];
        let new_record = [];
        if (data.ERROR === "") {
            let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            let tempGetKeyArray = getTempKeys(data, key_array);
            let map_found = getMultiLevelValue(Unscannable, tempGetKeyArray);
            if (map_found !== undefined){
                if (map_found.STATUS === "Pending") {
                    data.TABLE_MAPPED_AQID = map_found.MAPPED_AQID;
                    map_found.TABLE_MAPPED_AQID = map_found.MAPPED_AQID;
                    let outcome = add_to_output(Output, map_found, insert_data.Output_Insert, changelog_data, del_filter.del_filter_o, request);
                    insert_data.Output_Insert = outcome.Output_Insert;
                    changelog_data = outcome.changelog_data;
                    del_filter.del_filter_o = outcome.del_filter_a;
                    old_record = Unscannable_data(map_found);
                    changelog_data.changelog_unscan_u.old_records.push(old_record);
                    data = map_found;
                    data.STATUS = "Approved";
                    data.REVIEW_DATE = new Date().toISOString();
                    data.REVIEWED_BY = request.user.id;
                    data.REVIEWED_BY_NAME = request.req.params.user_name;
                    data.REVIEWED_BY_MAIL = request.req.params.user_mail;
                    data.MODIFIEDAT = new Date().toISOString();
                    data.MODIFIEDBY = request.user.id;
                    data.MODIFIEDBY_NAME = request.req.params.user_name;
                    data.MODIFIEDBY_MAIL = request.req.params.user_mail;
                    data.RESET_FLAG = '';
                    data = delete_unwanted_fields(data);
                    insert_data.Unscannable_Insert.push(data);
                    new_record = Unscannable_data(data);
                    changelog_data.changelog_unscan_u.new_records.push(new_record);
                    del_filter.del_filter_u.push(map_found.ID);
                } else {
                    data.ERROR = "Only Pending records can be Approved";
                }
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function delete_unwanted_fields(data) {
        delete data.ERROR;
        delete data.TABLE_MAPPED_AQID;
        delete data.CONSUMABLES;
        delete data.MFR;
        delete data.EQUIPMENT_NAME;
        delete data.PO_TYPE;
        delete data.SCOPE;
        delete data.SYNC_STATUS;
        delete data.Edit;
        return data;
    }

    function reject_records(data, del_filter, changelog_data, DB_data, request, insert_data) {
        if (data.ERROR === "") {
            let old_record = [];
            let new_record = [];
            let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            let tempGetKeyArray = getTempKeys(data, key_array);
            let map_found = getMultiLevelValue(DB_data, tempGetKeyArray);
            if (map_found !== undefined){
                if (map_found.STATUS === "Pending") {
                    old_record = Unscannable_data(map_found);
                    changelog_data.changelog_unscan_u.old_records.push(old_record);
                    data = map_found;
                    data.STATUS = "Rejected";
                    data.REVIEW_DATE = new Date().toISOString();
                    data.REVIEWED_BY = request.user.id;
                    data.REVIEWED_BY_NAME = request.req.params.user_name;
                    data.REVIEWED_BY_MAIL = request.req.params.user_mail;
                    data.MODIFIEDAT = new Date().toISOString();
                    data.MODIFIEDBY = request.user.id;
                    data.MODIFIEDBY_NAME = request.req.params.user_name;
                    data.MODIFIEDBY_MAIL = request.req.params.user_mail;
                    data.MAPPED_AQID = data.TABLE_MAPPED_AQID;
                    data.RESET_FLAG = '';
                    data = delete_unwanted_fields(data);
                    insert_data.Unscannable_Insert.push(data);
                    new_record = Unscannable_data(data);
                    changelog_data.changelog_unscan_u.new_records.push(new_record);
                    del_filter.del_filter_u.push(data.ID);
                } else {
                    data.ERROR = "Only Pending records can be Rejected";
                }
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function cancel_records(data, insert_data, del_filter, changelog_data, Unscannable, Output, request) {
        let old_record = [];
        let new_record = [];
        let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
        let tempGetKeyArray = getTempKeys(data, key_array);
        let map_found = getMultiLevelValue(Unscannable, tempGetKeyArray);
        if (map_found !== undefined){
            if (pre_check(map_found)) {
                if (map_found.STATUS === "Approved"){
                    let outcome = sub_from_output(Output, map_found, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                    insert_data.Output_Insert = outcome.Output_Insert;
                    changelog_data.changelog_output_u = outcome.changelog_data;
                    del_filter.del_filter_o = outcome.del_filter_a;
                }
                if(map_found.SEQUENCE_NO === 0){
                    old_record = Unscannable_data(map_found);
                    changelog_data.changelog_unscan_u.old_records.push(old_record);
                    data = map_found;
                    data.STATUS = "";
                    data.REVIEW_DATE = null;
                    data.REVIEWED_BY = "";
                    data.REVIEWED_BY_NAME = "";
                    data.REVIEWED_BY_MAIL = "";
                    data.MODIFIEDAT = new Date().toISOString();
                    data.MODIFIEDBY = request.user.id;
                    data.MODIFIEDBY_NAME = request.req.params.user_name;
                    data.MODIFIEDBY_MAIL = request.req.params.user_mail;
                    data.TO_GHSITE = "";
                    data.TO_CM = "";
                    data.TO_SITE = "";
                    data.TO_BUSINESS_GRP = "";
                    data.TO_PROGRAM = "";
                    data.FLEX_KITS = "";
                    data.TRANSFER_FLAG = "";
                    data.COMMENT = "";
                    data.QTY = 0;
                    data.MAPPED_AQID = "";
                    data.RESET_FLAG = '';
                    data = delete_unwanted_fields(data);
                    insert_data.Unscannable_Insert.push(data);
                    new_record = Unscannable_data(data);
                    changelog_data.changelog_unscan_u.new_records.push(new_record);
                }
                del_filter.del_filter_u.push(data.ID);
            } else {
                data.ERROR = "Only Approved / Pending / Rejected records with Transfer Qty 0 can be cancelled";
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function pre_check(map_found) {
        return ((map_found.STATUS === "Approved" || map_found.STATUS === "Pending" || map_found.STATUS === "Rejected") && map_found.QTY === 0)? true : false ;
    }

    function reset_records(data, insert_data, del_filter, changelog_data, Unscannable, Output, request) {
        let old_record = [];
        let new_record = [];
        if (data.ERROR === "") {
            let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            let tempGetKeyArray = getTempKeys(data, key_array);
            let map_found = getMultiLevelValue(Unscannable, tempGetKeyArray);
            if (map_found !== undefined){
                if (map_found.STATUS === "Approved") {
                    let outcome = sub_from_output(Output, map_found, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                    insert_data.Output_Insert = outcome.Output_Insert;
                    changelog_data.changelog_output_u = outcome.changelog_data;
                    del_filter.del_filter_o = outcome.del_filter_a;
                    old_record = Unscannable_data(map_found);
                    changelog_data.changelog_unscan_u.old_records.push(old_record);
                    data = map_found;
                    data.STATUS = "Pending";
                    data.REVIEW_DATE = null;
                    data.REVIEWED_BY = "";
                    data.REVIEWED_BY_NAME = "";
                    data.REVIEWED_BY_MAIL = "";
                    data.MODIFIEDAT = new Date().toISOString();
                    data.MODIFIEDBY = request.user.id;
                    data.MODIFIEDBY_NAME = request.req.params.user_name;
                    data.MODIFIEDBY_MAIL = request.req.params.user_mail;
                    data.MAPPED_AQID = "";
                    data.RESET_FLAG = request.data.RESET_FLAG;
                    data = delete_unwanted_fields(data);
                    insert_data.Unscannable_Insert.push(data);
                    new_record = Unscannable_data(data);
                    changelog_data.changelog_unscan_u.new_records.push(new_record);    
                    del_filter.del_filter_u.push(data.ID);
                } else {
                    data.ERROR = "Only Approved records can be Reset";
                }
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function save_records(data, insert_data, del_filter, changelog_data, DB_data, request) {
        let old_record = [];
        let new_record = [];
        if (data.ERROR === "") {
            let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            let tempGetKeyArray = getTempKeys(data, key_array);
            let map_found = getMultiLevelValue(DB_data.Unscannable_map, tempGetKeyArray);
            if (map_found !== undefined) {
                if (map_found.STATUS === "Approved") {
                    let outcome = sub_from_output(DB_data.Output, map_found, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                    insert_data.Output_Insert = outcome.Output_Insert;
                    changelog_data.changelog_output_u = outcome.changelog_data;
                    del_filter.del_filter_o = outcome.del_filter_a;
                }
                old_record = Unscannable_data(map_found);
                data = fill_data_bydb(data, map_found, '');
                data.MAPPED_AQID = map_found.TABLE_MAPPED_AQID;
                data.REVIEW_DATE = null;
                data.REVIEWED_BY = "";
                data.REVIEWED_BY_NAME = "";
                data.REVIEWED_BY_MAIL = "";
                data.MODIFIEDAT = new Date().toISOString();
                data.MODIFIEDBY = request.user.id;
                data.MODIFIEDBY_NAME = request.req.params.user_name;
                data.MODIFIEDBY_MAIL = request.req.params.user_mail;
                data.RESET_FLAG = '';
                changelog_data.changelog_unscan_u.old_records.push(old_record);
                data.STATUS = "Pending";
                data = delete_unwanted_fields(data);
                insert_data.Unscannable_Insert.push(data);
                new_record = Unscannable_data(data);
                changelog_data.changelog_unscan_u.new_records.push(new_record);
                del_filter.del_filter_u.push(data.ID);
            }
            else {
                data.ERROR = `Record doesn't Exists`;
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function selectall_save(data, insert_data, del_filter, changelog_data, Unscannable, Output, request) {
        let old_record = [];
        let new_record = [];
        if (data.ERROR === "") {
            let key_array = ["GH_SITE","PROGRAM","AQID","SEQUENCE_NO"];
            let tempGetKeyArray = getTempKeys(data, key_array);
            let map_found = getMultiLevelValue(Unscannable, tempGetKeyArray);
            if (map_found !== undefined){
                if (map_found.STATUS === "Approved") {
                    let outcome = sub_from_output(Output, map_found, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                    insert_data.Output_Insert = outcome.Output_Insert;
                    changelog_data.changelog_output_u = outcome.changelog_data;
                    del_filter.del_filter_o = outcome.del_filter_a;
                }
                old_record = Unscannable_data(map_found);
                changelog_data.changelog_unscan_u.old_records.push(old_record);
                data.REVIEW_DATE = null;
                data.REVIEWED_BY = "";
                data.REVIEWED_BY_NAME = "";
                data.REVIEWED_BY_MAIL = "";
                data.MODIFIEDAT = new Date().toISOString();
                data.MODIFIEDBY = request.user.id;
                data.MODIFIEDBY_NAME = request.req.params.user_name;
                data.MODIFIEDBY_MAIL = request.req.params.user_mail;
                data.STATUS = "Pending";
                data.MAPPED_AQID = data.TABLE_MAPPED_AQID;
                data.RESET_FLAG = '';
                data = delete_unwanted_fields(data);
                insert_data.Unscannable_Insert.push(data);
                new_record = Unscannable_data(data);
                changelog_data.changelog_unscan_u.new_records.push(new_record);
                del_filter.del_filter_u.push(data.ID);
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function check_mand_fields(data) {
        if(!data.ERROR ){
            data.ERROR = check_and_get_error(data.TO_GHSITE, data.ERROR, 'To Functional Location');
            data.ERROR = check_and_get_error(data.TO_PROGRAM, data.ERROR, 'To Product/Program');
            data.ERROR = check_and_get_error(data.TO_BUSINESS_GRP, data.ERROR, 'To Business Group');
            data.ERROR = check_and_get_error(data.COMMENT, data.ERROR, 'Comment');
            let mapped_aqid_trimmed = getBlankStringIfUndefinedOrNull(data.MAPPED_AQID).toLowerCase().trim();
            if (!data.MAPPED_AQID || mapped_aqid_trimmed === '' || mapped_aqid_trimmed === 'not found' || mapped_aqid_trimmed === 'multiple nb found' || mapped_aqid_trimmed === 'undefined' || mapped_aqid_trimmed === undefined) {
                data.ERROR = data.ERROR ? `${data.ERROR} and Invalid Mapped AQID`: `Invalid Mapped AQID`;
            }
            data.ERROR = check_qty(data.QTY, data.ERROR);
        }
        return data.ERROR;
    }

    function getBlankStringIfUndefinedOrNull(arg)
    {
        return (arg || '')
    }

    function check_and_get_error(field, error, msg) {
        if( field === "" || field === undefined || field === null) {
            error = error ? `${error} and ${msg} can’t be Blank`: `${msg} can’t be Blank`;
        }
        return error
    }

    function check_qty(QTY, ERROR) {
        let temp_error = (containsOnlyNumbers(QTY)) ? '' : `Invalid Quantity`;
        if(temp_error){
            ERROR = ERROR ? `${ERROR}, ${temp_error}`: temp_error;
        }
        return ERROR;
    }
    async function block_mass_update(request, tx, allowedAttributes) {
        let unscannable_err = [];
        let insert_data = {};
        insert_data.Output_Insert = [];
        insert_data.Unscannable_Insert = [];
        let queries = [];
        let changelog_data_a = [];
        let changelog_data = {};
        changelog_data.changelog_unscan_u = {};
        changelog_data.changelog_output_u = {};
        changelog_data.changelog_output_i = {};
        changelog_data.changelog_unscan_u.new_records = [];
        changelog_data.changelog_unscan_u.old_records = [];
        changelog_data.changelog_output_u.new_records = [];
        changelog_data.changelog_output_u.old_records = [];
        changelog_data.changelog_output_i.new_records = [];
        changelog_data.changelog_output_i.old_records = [];
        let del_filter = {};
        del_filter.del_filter_u = [];
        del_filter.del_filter_o = [];
        let DB_data = {};
        DB_data.GH_SITE = [];
        DB_data.PROGRAM = [];
        DB_data.Unscannable = [];
        DB_data.Unscannable_map = {};
        DB_data.Output = [];
        DB_data.Unscannable_map = {};
        DB_data.Output_map = {};
        DB_data.PROGRAM_map = {};
        let range = {};
        range.GH_SITE = [];
        range.PROGRAM = [];
        range.Temp = [];
        let qty_exceed_a = [];
        let outcome = {};
        let final_array = {};
        let allowed_cmsite = request.data.Action === "Approve" ? allowedAttributes[`ApproveRfidOnHandTT`] : allowedAttributes[`UnScannableModify`];
        range = build_range(range, request.data.UnscanData, request);
        DB_data = await get_dbdata(tx, range, DB_data, request,'');
        switch (request.data.Action) {
            case "Approve":
                request.data.UnscanData.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    e.ERROR = AuthorizationCheck(e, allowed_cmsite);
                    e.ERROR = validate_record_op(e);
                    outcome = approve_records(e, insert_data, del_filter, changelog_data, DB_data.Unscannable_map, DB_data.Output, request);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Reject":
                request.data.UnscanData.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    e.ERROR = AuthorizationCheck(e, allowed_cmsite);
                    outcome = reject_records(e, del_filter, changelog_data, DB_data.Unscannable_map, request, insert_data);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Cancel":
                request.data.UnscanData.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    e.ERROR = AuthorizationCheck(e, allowed_cmsite);
                    if (e.ERROR === "") {
                        outcome = cancel_records(e, insert_data, del_filter, changelog_data, DB_data.Unscannable_map, DB_data.Output, request);
                    }
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Reset":
                request.data.UnscanData.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    e.ERROR = AuthorizationCheck(e, allowed_cmsite);
                    outcome = reset_records(e, insert_data, del_filter, changelog_data, DB_data.Unscannable_map, DB_data.Output, request);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
            case "Save":
                request.data.UnscanData.forEach(e => {
                    outcome = {};
                    final_array = {};
                    e.ERROR = "";
                    e.ERROR = check_sync_status(e.SYNC_STATUS, '');
                    e.ERROR = check_mand_fields(e);
                    e = validate_data(e, DB_data);
                    e.ERROR = AuthorizationCheck(e, allowed_cmsite);
                    let param = data_validation(e, request.data.UnscanData, DB_data.Unscannable, '');
                    e.ERROR = param.error;
                    qty_exceed_a = fill_error(param, qty_exceed_a, e);
                    outcome = save_records(e, insert_data, del_filter, changelog_data, DB_data, request);
                    final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, unscannable_err)
                    del_filter = final_array.del_filter;
                    changelog_data = final_array.changelog_data;
                    insert_data = final_array.insert_data;
                    unscannable_err = final_array.unscannable_err;
                });
                break;
        }
        queries = delete_via_id(del_filter.del_filter_u, queries);
        queries = deleteInChunk(del_filter.del_filter_o, queries, 'COM_APPLE_COA_T_COA_OUTPUT');
        if (queries.length > 0) {
            await tx.run(queries);
        }
        await insert_into_db(insert_data.Output_Insert, "COM_APPLE_COA_T_COA_OUTPUT", tx);
        await insert_into_db(insert_data.Unscannable_Insert, "COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT", tx);
        await tx.commit();
        changelog_data_a = push_changelog(changelog_data.changelog_output_i, changelog_data_a, "INSERT", "T_COA_OUTPUT");
        changelog_data_a = push_changelog(changelog_data.changelog_output_u, changelog_data_a, "UPDATE", "T_COA_OUTPUT");
        changelog_data_a = push_changelog(changelog_data.changelog_unscan_u, changelog_data_a, "UPDATE", "T_COA_RFID_UNSCANNABLE_TT");
        if (changelog_data_a.length > 0) {
            update_changelog(changelog_data_a, request);
        }
        return unscannable_err;
    }

    function build_range(range, UnscanData, request) {
        UnscanData.forEach(e => {
            range.GH_SITE = Append_IfUnique(range.GH_SITE, e.TO_GHSITE);
            range.PROGRAM = Append_IfUnique(range.PROGRAM, e.TO_PROGRAM);
            let temp = {};
            temp.ID = getuuid();
            temp.GUID = request.req.params.uuid;
            temp.GH_SITE = e.GH_SITE;
            temp.PROGRAM = e.PROGRAM;
            temp.AQID = e.AQID;
            temp.MAPPED_AQID = e.TABLE_MAPPED_AQID;
            temp.TO_GHSITE = e.TO_GHSITE;
            temp.TO_PRODUCT = e.TO_PROGRAM;
            temp.SEQUENCE_NO = e.SEQUENCE_NO;
            range.Temp.push(temp);
        });
        return range;
    }

    function Append_IfUnique(Result, field) {
        const index = Result.findIndex(e => e === field);
        if (index < 0) {
            Result.push(field);
        }
        return Result;
    }

    function get_msg(Err_records, action) {
        if (Err_records.length > 0) {
            return Err_records;
        } else {
            switch (action) {
                case "File_Upload":
                    return "Records Uploaded Successfully";
                case "Save":
                    return "Records Saved Successfully";
                case "Approve":
                    return "Records Approved Successfully";
                case "Reset":
                    return "Records Resetted Successfully";
                case "Reject":
                    return "Records Rejected Successfully";
                case "Cancel":
                    return "Records Cancelled Successfully";
                default:
                    break;
            }
        }
    }

    srv.before("Generate_Unscannable", async (request) => {
        cds.env.features.kibana_formatter = true;
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Unscannable: PUT Generate_Unscannable' });
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        if (typeof (request.req.params.uuid) === "undefined") {
            request.req.params = { "uuid": uuid, "user": request.user.id, "user_name": `${jwtdetails.given_name} ${jwtdetails.family_name}`, "user_mail": jwtdetails.email , "LOG": LOG};
        }
        if (request.data.request.syncall !== true && request.data.request.GH_SITE.length < 0) {
            request.reject(500, 'Nothing is selected for sync');
        }
    });

    srv.on("Generate_Unscannable", async (request) => {
        const LOG = request.req.params.LOG;
        const tx = hdb.tx();
        let sync_status = [];
        let delete_sync_f = [];
        let error_a = [];
        let allGHSite = [];
        try {
            let outcome = await get_sync_data(request, tx);
            allGHSite = outcome.final_GHSite;
            delete_sync_f = outcome.delete_sync_f;
            sync_status = outcome.sync_status;
            error_a = outcome.error_a;
            send_response(request, error_a, allGHSite);
            if (allGHSite.length > 0) {
                await update_sync_table(sync_status, delete_sync_f);
                let myPromise = [];
                let item;
                for (item of allGHSite) {
                    myPromise.push(new Promise(async (res, rej) => {
                        try {
                            await Update_Unscannables(request, item.GH_SITE, tx).then(
                                val => {
                                    if (val === true) {
                                        res(val);
                                    } else {
                                        rej();
                                    }
                                });
                        }
                        catch (err) {
                            return rej(err);
                        }
                    })
                    )
                }
                await Promise.all(myPromise).then((values) => {
                    tx.commit();
                    LOG.info('Sync Successful');
                    UpdateSyncTable('', 'Completed', sync_status);
                }).catch(error => {
                    LOG.info('Error while inserting data to table');
                    LOG.info(`ERROR: ${error}`);
                    tx.rollback();
                    UpdateSyncTable('Error while inserting data to table', 'Error', sync_status);
                });
            } 
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            await tx.rollback();
            UpdateSyncTable('Error while inserting data to table', 'Error', sync_status);
        }
    });

    async function get_sync_data(request, tx) {
        let sync_status = [];
        let delete_sync = [];
        let error_a = [];
        let allGHSite = [];
        let final_GHSite = [];
        let delete_sync_f = [];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = allowedAttributes['SyncActionAll'];
        if (request.data.request.syncall === 'X') {
            allGHSite = await tx.run(SELECT.distinct.from("V_UNSCANNABLE_PROJ").columns("GH_SITE", "CM", "SITE", "SAP_CM_SITE"));
            delete_sync = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SYNC_STATUS").columns("ID", "GH_SITE", "STATUS").where({ APP: 'Unscannable' }));
        } else {
            let gh_site_a = [];
            gh_site_a = request.data.request.GH_SITE;
            allGHSite = await tx.run(SELECT.distinct.from("V_UNSCANNABLE_PROJ").columns("GH_SITE", "CM", "SITE", "SAP_CM_SITE").where({
                GH_SITE: { in: gh_site_a }
            }));
            delete_sync = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SYNC_STATUS").columns("ID", "GH_SITE", "STATUS").where({ APP: 'Unscannable', GH_SITE: { in: gh_site_a } }));
        }
        allGHSite.forEach(e => {
            const index = delete_sync.findIndex(e1 => e1.GH_SITE === e.GH_SITE);
            if (index >= 0 && delete_sync[index].STATUS === 'In Progress') {
                let error_s = {};
                error_s.GH_SITE = e.GH_SITE;
                error_s.ERROR = 'Sync is already in Progress for this GH Site';
                error_a.push(error_s);
            } else {
                let error_s = {};
                error_s.GH_SITE = e.GH_SITE;
                error_s.ERROR = AuthorizationCheck(e, allowed_cmsite);
                if (error_s.ERROR) {
                    error_a.push(error_s);
                } else {
                    let sync_status_s = {};
                    sync_status_s.ID = getuuid();
                    sync_status_s.CREATEDAT = new Date().toISOString();
                    sync_status_s.CREATEDBY = request.user.id;
                    sync_status_s.GH_SITE = e.GH_SITE;
                    sync_status_s.APP = "Unscannable";
                    sync_status_s.STATUS = 'In Progress';
                    sync_status.push(sync_status_s);
                    final_GHSite.push(e);
                    if (index >= 0) {
                        delete_sync_f.push(delete_sync[index].ID);
                    }
                }
            }

        });
        return { final_GHSite, delete_sync_f, error_a, sync_status };
    }

    function send_response(request, error_a, allGHSite) {
        if (process.env.NODE_ENV !== 'test') {
            if (error_a.length > 0) {
                request._.res.send({ msg: error_a });
            } else if(allGHSite.length < 1){
                request.reject(500, 'No records to update for this GH Site');
            }else {
                request._.res.send({ msg: `Proccessing Started` });
            }
        }
    }

    async function update_sync_table(sync_status, delete_sync_f) {
        if (sync_status.length > 0) {
            const tx1 = hdb.tx();
            if (delete_sync_f.length > 0) {
                await tx1.run(DELETE.from("COM_APPLE_COA_T_COA_SYNC_STATUS").where({
                    ID: { in: delete_sync_f },
                    APP: "Unscannable"
                }));
            }
            await tx1.run(INSERT.into("COM_APPLE_COA_T_COA_SYNC_STATUS").entries(sync_status));
            await tx1.commit();
        }
    }

    async function UpdateSyncTable(Error, Status, sync_status) {
        let update_sync_f = [];
        sync_status.forEach(e => {
            update_sync_f.push(e.ID);
        });
        if (update_sync_f.length > 0) {
            let tx_update = hdb.tx();
            await tx_update.run(UPDATE("COM_APPLE_COA_T_COA_SYNC_STATUS")
                .with({
                    Status: Status,
                    Error: Error
                })
                .where({
                    ID: { in: update_sync_f },
                    APP: 'Unscannable'
                }));
            await tx_update.commit();
        }
    }

    async function Update_Unscannables(request, GH_SITE, tx) {
        let insert_data = {};
        let queries = [];
        insert_data.Output_Insert = [];
        insert_data.Unscannable_Insert = [];
        let del_filter = [];
        del_filter.del_filter_u = [];
        del_filter.del_filter_o = [];
        let leftover_unscannable = [];
        let Unscannable_V = await tx.run(SELECT.distinct.from("V_UNSCANNABLE_PROJ").where({
            GH_SITE: GH_SITE
        }));
        
        let outcome = await get_unscannable_data(GH_SITE, tx);
        leftover_unscannable = outcome.leftover_unscannable;
        let Unscannable_tt = outcome.Db;
        let Unscannable_map = outcome.map;
        let Output = await cds.run(`SELECT distinct T_COA_OUTPUT.*
                                                FROM COM_APPLE_COA_T_COA_OUTPUT AS T_COA_OUTPUT 
                                                INNER JOIN V_UNSCANNABLES AS V_UNSCANNABLES
                                                ON T_COA_OUTPUT.FROM_GHSITE = V_UNSCANNABLES.GH_SITE
                                                AND T_COA_OUTPUT.FROM_PRODUCT = V_UNSCANNABLES.PROGRAM
                                                AND T_COA_OUTPUT.AQID = V_UNSCANNABLES.TABLE_MAPPED_AQID
                                                WHERE V_UNSCANNABLES.GH_SITE = '${GH_SITE}'`);
        Unscannable_V.forEach(data => {
            if (data.GH_SITE && data.PROGRAM && data.AQID) {
                const index = insert_data.Unscannable_Insert.findIndex(e => e.GH_SITE === data.GH_SITE && e.PROGRAM === data.PROGRAM && e.AQID === data.AQID );
                if (index < 0) {
                    let key_array = ["GH_SITE","PROGRAM","AQID"];
                    let tempGetKeyArray = getTempKeys(data, key_array);
                    let map_found = getMultiLevelValue(Unscannable_map, tempGetKeyArray);
                    if (map_found !== undefined){
                        let outcome_1 = update_existing_recs(insert_data, Unscannable_tt, data, Output, del_filter, request, leftover_unscannable);
                        insert_data = outcome_1.insert_data;
                        del_filter = outcome_1.del_filter;
                        leftover_unscannable = outcome_1.leftover_unscannable;
                    } else {
                        data.ID = getuuid();
                        data.SEQUENCE_NO = 0;
                        data.STATUS = "";
                        data.QTY = 0;
                        data.CREATEDAT = new Date().toISOString();
                        data.CREATEDBY = request.user.id;
                        data.CREATEDBY_NAME = request.req.params.user_name;
                        data.CREATEDBY_MAIL = request.req.params.user_mail;
                        insert_data.Unscannable_Insert.push(data);
                    }
                }
            }
        });
        let outcome1 = get_leftoverunscannable_ids(insert_data, Output, del_filter, request, leftover_unscannable);
        insert_data = outcome1.insert_data;
        del_filter = outcome1.del_filter;
        queries = delete_via_id(del_filter.del_filter_u, queries);
        queries = deleteInChunk(del_filter.del_filter_o, queries, 'COM_APPLE_COA_T_COA_OUTPUT');
        if (queries.length > 0) {
            await tx.run(queries);
        }
        await insert_into_db(insert_data.Output_Insert, "COM_APPLE_COA_T_COA_OUTPUT", tx);
        await insert_into_db(insert_data.Unscannable_Insert, "COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT", tx);
        return true;
    }

    function get_leftoverunscannable_ids(insert_data, Output, del_filter, request, leftover_unscannable) {
        let changelog_data = {};
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        leftover_unscannable.forEach(element => {
            let outcome = update_if_approved(Output, element, insert_data, changelog_data, del_filter, request);
            insert_data = outcome.insert_data;
            changelog_data = outcome.changelog_data;
            del_filter = outcome.del_filter;
            del_filter.del_filter_u.push(element.ID);
        });
        return { insert_data, del_filter}
    }

    async function get_unscannable_data(GH_SITE, tx) {
        let Unscannable_map = {};
        let Unscannable_tt = await tx.run(SELECT.distinct.columns("ID", "GH_SITE", "CM", "SITE", "PROGRAM", "FROM_BUSINESS_GRP",
            "AQID", "SEQUENCE_NO", "NPI_INDICATOR", "PROJECTED_QTY", "FLEX_KITS", "TRANSFER_FLAG", "TO_GHSITE",
            "TO_CM", "TO_SITE", "TO_PROGRAM", "TO_BUSINESS_GRP", "QTY", "STATUS", "REVIEW_DATE", "REVIEWED_BY", "MODIFIEDBY_NAME", "MODIFIEDBY_MAIL", "CREATEDBY_NAME", "CREATEDBY_MAIL", "REVIEWED_BY_NAME", "REVIEWED_BY_MAIL", "SAP_CM_SITE", "SAP_TO_CM_SITE", "COMMENT", "MAPPED_AQID", "TABLE_MAPPED_AQID").from(Carryover_rfid_unscannable).where({
                GH_SITE: GH_SITE
            }));
            let keyArray = ["GH_SITE","PROGRAM","AQID"];
            fillMultimap(Unscannable_map, Unscannable_tt, keyArray);
            return {Db:Unscannable_tt, leftover_unscannable: Unscannable_tt, map: Unscannable_map};
    }


    function update_existing_recs(insert_data, Unscannable_tt, data, Output, del_filter, request, leftover_unscannable) {
        let Projected_Qty = 0;
        let changelog_data = {};
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        let update_rec = get_qty(Unscannable_tt, data);
        const index = update_rec.findIndex(e => e.SEQUENCE_NO === 0);
        if (index >= 0) {
            Projected_Qty = update_rec[index].PROJECTED_QTY;
        }
        update_rec.forEach(element => {
            const index1 = leftover_unscannable.findIndex(rec => rec.GH_SITE === element.GH_SITE && rec.PROGRAM === element.PROGRAM
            && rec.AQID === element.AQID && rec.SEQUENCE_NO === element.SEQUENCE_NO );
            if(index1 >= 0){
                leftover_unscannable.splice(index1, 1);
            }
            element.CREATEDAT = new Date().toISOString();
            element.CREATEDBY = request.user.id;
            element.CREATEDBY_NAME = request.req.params.user_name;
            element.CREATEDBY_MAIL = request.req.params.user_mail;
            element.NPI_INDICATOR = data.NPI_INDICATOR;
            element.FROM_BUSINESS_GRP = data.FROM_BUSINESS_GRP;
            if (Projected_Qty != data.PROJECTED_QTY) {
                let outcome = update_if_approved(Output, element, insert_data, changelog_data, del_filter, request);
                insert_data = outcome.insert_data;
                changelog_data = outcome.changelog_data;
                del_filter = outcome.del_filter;
                element = outcome.element;
                element.STATUS = 'Projected Qty. Reset';
                element.MODIFIEDAT = new Date().toISOString();
                element.MODIFIEDBY = request.user.id;
                element.MODIFIEDBY_NAME = request.req.params.user_name;
                element.MODIFIEDBY_MAIL = request.req.params.user_mail;
                element.PROJECTED_QTY = data.PROJECTED_QTY;
            }
            delete element.TABLE_MAPPED_AQID;
            insert_data.Unscannable_Insert.push(element);
            del_filter.del_filter_u.push(element.ID);
        });
        return { insert_data, del_filter, leftover_unscannable };
    }

    function update_if_approved(Output, element, insert_data, changelog_data, del_filter, request) {
        if (element.STATUS === "Approved") {
            let outcome = sub_from_output(Output, element, insert_data.Output_Insert, changelog_data, del_filter.del_filter_o, request);
            insert_data.Output_Insert = outcome.Output_Insert;
            changelog_data = outcome.changelog_data;
            del_filter.del_filter_o = outcome.del_filter_a;
            element.REVIEWED_BY = "";
            element.REVIEW_DATE = null;
            element.REVIEWED_BY_NAME = "";
            element.REVIEWED_BY_MAIL = "";
        }
        return { insert_data, changelog_data, del_filter, element };
    }

    function check_sync_status(SYNC_STATUS, ERROR) {
        if (SYNC_STATUS === 'In Progress') {
            ERROR = ERROR ? `${ERROR} and Sync is in Progress for this GH Site` : `Sync is in Progress for this GH Site`;
        }
        return ERROR;
    }

    srv.before("resync_unscannable", async (request) => {
        cds.env.features.kibana_formatter = true;
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'COA Unscannable: PUT resync_unscannable' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                request.req.params = { "uuid": uuid, "user": request.user.id , "LOG": LOG};
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
        }
    });


    srv.on("resync_unscannable", async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`Inside Resync_Unscannable`);
        try{
            let selectedRecordsToMassUpdate = await cds.run(`SELECT * FROM V_UNSCANNABLES as t1 where 
                                                (t1.MAPPED_AQID is not null or t1.TABLE_MAPPED_AQID is not null)
                                                and (not (t1.MAPPED_AQID=t1.TABLE_MAPPED_AQID))
                                                and t1.STATUS = 'Approved'
                                                `);
            if (selectedRecordsToMassUpdate.length > 0) {
                    let chunkSize = 5000;
                    for (let k = 0; k < selectedRecordsToMassUpdate.length; k += chunkSize) {
                        let updChunk = selectedRecordsToMassUpdate.slice(k, k + chunkSize);
                        await srv.post(Unscannable_action, { UnscanData: updChunk, Action: "Reset", RESET_FLAG:'Rst-MapAqid', auth: request.headers.authorization })
                    }
                }
        } catch(err)
            {
                LOG.info(`Action : Resync_Unscannable - There was some error thrown while resyncing mapped-aqid: `, err.response?.data || err.response || err.data || err);
            }
    });

}
)
