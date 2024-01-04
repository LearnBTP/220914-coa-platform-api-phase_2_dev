const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");
const csv = require("csv-parser");
const fs = require("fs");
require('hdb/lib/protocol/common/Constants').MAX_PACKET_SIZE = Math.pow(2, 21);

module.exports = cds.service.impl(async (srv) => {
    const
        {
            AQIDMapping,
            SyncAQIDStatus,
            Upload_AQIDMapping,
            aqid_mapping_action
        } = srv.entities;



    let hdb = await cds.connect.to("db");
    let completed = false;
    let somethingToInsert = false;
    let glb_auth;



    async function update_changelog(userid, old_update_records, new_update_records, old_insert_records, new_insert_records, request) {
        const LOG = request.req.params["LOG"];
        LOG.info(`Call Changelog service to update the changes to Changelog table`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        const core = require("@sap-cloud-sdk/core");
        const xsenv = require("@sap/xsenv");
        xsenv.loadEnv();
        const sDestinationName = "COA_APIM_CC";
        let results = [];
        if (old_update_records.length > 0) {
            let result = {};
            result.TableName = "T_COA_AQID_MAPPING";
            result.old_records = old_update_records;
            result.new_records = new_update_records;
            result.actionType = "UPDATE";
            result.user_data = {};
            result.user_data.user = userid;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            results.push(result);
        }
        if (old_insert_records.length > 0) {
            let result = {};
            result.TableName = "T_COA_AQID_MAPPING";
            result.old_records = old_insert_records;
            result.new_records = new_insert_records;
            result.actionType = "INSERT";
            result.user_data = {};
            result.user_data.user = userid;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            results.push(result);
        }
        let requestData = { "body": JSON.stringify(results) };
        if (process.env.NODE_ENV !== 'test') {
            await core.executeHttpRequest({ destinationName: sDestinationName },
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
    }

    function aqid_mapping_data(request) {
        let record = [];
        if (request) {
            record.push(0);
            record.push("");
            record.push(0);
            record.push("");
            record.push(request.Raw_Aqid);
            record.push(request.Mapped_Aqid);
            record.push(request.Cm_Recommendation);
            record.push(request.Program);
            record.push(request.Station);
            record.push(request.Site);
            record.push(request.CM);
            record.push(request.GH_Site);
            record.push(request.Stack_Item);
            record.push(request.Make_Aqid);
            record.push(request.Short_Name);
            record.push(request.Equipment_Name);
            record.push(request.MFR);
            record.push(request.Recommendation_Type);
            record.push(request.TimeStamp);
            record.push(request.Update_By_User);
            record.push(request.Comment);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.Update_By_Name);
            record.push(request.Update_By_mail);
        }
        else {
            record.push(0);
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

    srv.before("GET", "F4help", async (request) => {
        let guid = getuuid(request);
        request.req.params["guid"] = guid;

    });

    srv.on("GET", "F4help", async (request) => {
        let guid = request.req.params["guid"];
        const LOG = cds.log(guid, { label: 'F4help' });
        request.req.params["LOG"] = LOG;
        LOG.info(`COA - ${guid} - In On event of GET action of F4Help entity`);
        try {
            const dropdown_array = await getDropDownArray(request);
            request.results = dropdown_array;
        } catch (error) {
            LOG.info(`COA - ${guid} - Error: ${error}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });


    async function fetchdata(allowedAttributes, change, search, db, header) {
        let top = header.top, skip = header.skip, field = header.change, LOG = header.LOG;
        let dropdown_array = [];
        // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, SITE values on role attributes in right order.
        // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
        let whereclause = getFilterString(allowedAttributes, LOG);
        if (search) {
            let regex = /\*+/g;
            search = search.replace(regex, `%`);
            regex = /_/g
            search = search.replace(regex, `\\_`);
            whereclause = whereclause ? `((${whereclause}) and (${change} like '%${search}%' escape '\\'))` : `(${change} like '%${search}%' escape '\\')`;
        }
        if (whereclause) {
            whereclause = `(${whereclause}) and (${change} is not null)  and (${change}<>'')`
            let parsedFilters = cds.parse.expr(whereclause);
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
        allowedAttributes['AqidReadOnly'] = merge(allowedAttributes['AqidReadOnly'], allowedAttributes['UnScannableModify'])
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        if (top) {
            top = top.includes("infinity") ? 1000 : top;
        }
        let header = { "top": top, "skip": skip, "change": change, "LOG": request.req.params["LOG"] }
        result_array = await fetchdata(allowedAttributes['AqidReadOnly'], change, search, AQIDMapping, header);
        return result_array;
    }

    function getuuid(request) {
        return (request && request?.headers['x-correlationid']) ? request.headers['x-correlationid'] : cds.utils.uuid();
    }

    async function getFile(idVal, log_id, jwtdetails, fileDateObj, request) {
        const LOG = request.req.params["LOG"];
        const sDestinationName = "COA_DMS";
        const core = require("@sap-cloud-sdk/core");
        const xsenv = require("@sap/xsenv");
        xsenv.loadEnv();
        let url = process.env.URL_EXTENSION + "?objectId=" + idVal + "&cmisSelector=content&download=attachment"
        let DMSResponse;
        if (process.env.NODE_ENV !== 'test') {
            DMSResponse = await core.executeHttpRequest(
                { destinationName: sDestinationName },
                {
                    method: "GET",
                    url: url
                }
            );
        }
        else {
            let file = Buffer.from(process.env[String(idVal)], 'base64').toString('ascii');

            DMSResponse = {};
            DMSResponse.data = file;
        }
        let plaintext = "";
        try {

            const openpgp = require("openpgp");

            openpgp.config.allow_insecure_decryption_with_signing_keys = true;

            let privateKeyArmored = Buffer.from(process.env.PRIVATE_KEY, 'base64').toString('ascii');

            let encrypted = DMSResponse.data;
            let priWhole = (await openpgp.key.readArmored(privateKeyArmored));
            let privateKey = priWhole.keys[0];
            const message = (await openpgp.message.readArmored((encrypted)));
            let decrypted = await openpgp.decrypt({
                message: message,
                privateKeys: privateKey
            });


            const outMsgTxt = await openpgp.stream.readToEnd(decrypted.data);
            plaintext = outMsgTxt;
        }
        catch (err) {
            let dateGND = getDateFromDateArray(fileDateObj);
            if (!dateGND || String(dateGND).trim() === '') {
                dateGND = Date.now();
            }
            LOG.info("log_id : ", log_id, " | ", "File Decryption Failed: ", err);
            let tx = hdb.tx();
            try {
                await tx.run(UPDATE(SyncAQIDStatus)
                    .with({
                        Status: "Error",
                        DateGND: dateGND,
                        ReasonForStatus: "File Decryption Failed",
                        modifiedBy_Name: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                        modifiedBy_mail: String(jwtdetails.email)
                    })
                    .where({
                        Log_Id: String(log_id)
                    }));
                await tx.commit();
                LOG.info("log_id : ", log_id, " | ", "File Decryption Failed sent to status table ",);
            }
            catch
            {
                LOG.info("log_id : ", log_id, " | ", "Failed to send File Decryption Failed to status table ",);
            }
            await request.reject(400, "File decyption failed: " + err)
        }
        return plaintext.split('\n')
    }

    async function moveFileToArchive(idVal, log_id, LOG) {
        const sDestinationName2 = "COA_DMS";
        const core = require("@sap-cloud-sdk/core");
        let FormData = require('form-data');
        let data = new FormData();
        data.append('cmisaction', 'move');
        data.append('objectId', String(idVal));
        data.append('sourceFolderId', process.env.DMS_SOURCE_FOLDER_ID);
        data.append('targetFolderId', process.env.DMS_TARGET_FOLDER_ID);

        let config = {
            url: process.env.URL_EXTENSION,
            method: 'post',
            headers: {
                ...data.getHeaders(),
                "appid": process.env.appid
            },
            data: data
        };

        LOG.info("log_id : ", log_id, " | ", `Moving to archive`);
        if (process.env.NODE_ENV !== 'test') {
            LOG.info("log_id : ", log_id, " | ", "Trying to move to archive");
            try {
                await core.executeHttpRequest(
                    { destinationName: sDestinationName2 },
                    config
                );
            }
            catch (eer) {
                LOG.info("log_id : ", log_id, " | ", "Unable to set expiry for current file now. Perhaps a similarly named file is already present in Archive.");
            }
        }

        let date = Date.now();
        let data2 = new FormData();
        data2.append('cmisaction', 'update');
        data2.append('objectId', String(idVal));
        data2.append('propertyId[0]', 'cmis:rm_startOfRetention');
        data2.append('propertyValue[0]', String(date));
        data2.append('propertyId[1]', 'cmis:rm_expirationDate');
        data2.append('propertyValue[1]', String(date + 2592000000));
        data2.append('propertyId[2]', 'cmis:rm_destructionDate');
        data2.append('propertyValue[2]', String(date + 2592000000));
        data2.append('propertyId[3]', 'cmis:secondaryObjectTypeIds');
        data2.append('propertyValue[3]', 'cmis:rm_destructionRetention');

        let config2 = {
            url: process.env.URL_EXTENSION,
            method: 'post',
            headers: {
                ...data2.getHeaders(),
                "appid": process.env.appid
            },
            data: data2
        };

        if (process.env.NODE_ENV !== 'test') {
            LOG.info("log_id : ", log_id, " | ", "Trying to set expiry");
            try {
                await core.executeHttpRequest(
                    { destinationName: sDestinationName2 },
                    config2
                );
            }
            catch (eer) {
                LOG.info("log_id : ", log_id, " | ", "Unable to set expiry for current file now. Perhaps it was already set for this file");
            }
        }


    }

    function getDateFromDateArray(fileDateObj) {
        let statusString = "";
        if (fileDateObj !== false && fileDateObj.passedArg) {
            fileDateObj.dateArray?.push(fileDateObj.passedArg);
        }
        if (fileDateObj !== false && fileDateObj.dateArray?.length > 0) {
            fileDateObj.dateArray = fileDateObj.dateArray.sort();
            statusString = (fileDateObj.dateArray[0]);
        }
        return statusString
    }

    function keyfieldsMatchString(keyArr, t1, t2) {
        let retArr = [];
        keyArr.forEach(key => {
            if (key === 'LINE') retArr.push(`trim(${t1}.${key}) = trim(${t2}.${key})`);
            else retArr.push(`${t1}.${key} = ${t2}.${key}`);
        })
        return retArr.join(` AND `)
    }

    function getAllFieldsString(keyArr) {
        return keyArr.join(`,`)
    }

    function getAllFieldsWithAs(allFieldsArr) {
        let retArr = [];
        allFieldsArr.forEach(key => {
            retArr.push(`t1.${key} as ${key}`)
        })
        return retArr.join(`,`)
    }

    function handleBlankDate(tempDateObj) {
        if ((String(tempDateObj.dateGND) === '') || !(tempDateObj.dateGND)) tempDateObj.dateGND = (new Date().toISOString());
    }


    async function pushToDB(dataQueue, dest, idVal, log_id, jwtdetails, fileDateObj, { keyArr, allFieldsArr, request }) {
        const LOG = request.req.params["LOG"];
        let tx = hdb.tx();
        let dateGND;
        try {
            let chunkSize;
            if (idVal === false) {
                await tx.run(DELETE.from(dest));
                chunkSize = 100000;
                for (let i = 0; i < dataQueue.length; i += chunkSize) {
                    let chunk = dataQueue.slice(i, i + chunkSize);
                    LOG.info(`currently inserting chunk slice (${i}, ${i + chunkSize})`);
                    await tx.run(INSERT.into(dest).entries(chunk));
                }

                LOG.info("log_id : ", log_id, " | ", "Completed. Writing abt this completion to status table.")
                let statusString = "Completed";
                dateGND = getDateFromDateArray(fileDateObj);
                LOG.info("log_id : ", log_id, " | ", "dateGND1: ", dateGND)
                let tempDateObj = {};
                tempDateObj.dateGND = dateGND;
                handleBlankDate(tempDateObj);
                dateGND = tempDateObj.dateGND;
                await tx.run(UPDATE(SyncAQIDStatus)
                    .with({
                        Status: statusString,
                        DateGND: dateGND,
                        ReasonForStatus: "Files read and added to db",
                        modifiedBy_Name: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                        modifiedBy_mail: String(jwtdetails.email)
                    })
                    .where({
                        Log_Id: String(log_id)
                    }));
            }
            else {
                if (request.req.params.delAll) {
                    await tx.run(DELETE.from(dest));
                    LOG.info("Deleted all data from ", dest);
                }
                chunkSize = 100000;
                let splGUID = getuuid(request);
                dataQueue = dataQueue.map(el => {
                    el.GUID = splGUID
                    el.ID = getuuid();
                    return el;
                })
                for (let i = 0; i < dataQueue.length; i += chunkSize) {
                    let chunk = dataQueue.slice(i, i + chunkSize);
                    await tx.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries(chunk));
                }
                await tx.run(`DELETE FROM ${dest} as t1 where EXISTS(
                    SELECT * FROM COM_APPLE_COA_T_COA_TEMP as t2
                    WHERE t2.GUID = '${splGUID}'
                    AND ${keyfieldsMatchString(keyArr, 't1', 't2')}
                    AND (t2.STATUSDATA = 'D' OR t2.STATUSDATA = 'U' OR t2.STATUSDATA = 'I')
                )`)

                await tx.run(`INSERT INTO 
                    ${dest}(${getAllFieldsString(allFieldsArr)})
                    SELECT DISTINCT 
                    ${getAllFieldsWithAs(allFieldsArr)}
                    FROM COM_APPLE_COA_T_COA_TEMP as t1 
                    where (t1.STATUSDATA='I' OR t1.STATUSDATA='U')
                    and t1.GUID = '${splGUID}'`)

                await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_TEMP WHERE GUID = '${splGUID}'`)

                await moveFileToArchive(idVal, log_id, LOG);
                LOG.info("log_id : ", log_id, " | ", "moved to archive");
            }
            await tx.commit();
            LOG.info("log_id : ", log_id, " | ", "added to db")
        }
        catch (err) {
            tx.rollback();
            LOG.info("log_id : ", log_id, " | ", "error while insering into db: ", err);
            try {
                dateGND = getDateFromDateArray(fileDateObj);
                LOG.info("log_id : ", log_id, " | ", "dategnd2: ", dateGND);
                if ((String(dateGND) === '') || !(dateGND)) dateGND = (new Date().toISOString());
                await tx.run(UPDATE(SyncAQIDStatus)
                    .with({
                        Status: "Error",
                        ReasonForStatus: "Error while inserting data into db",
                        DateGND: dateGND,
                        modifiedBy_Name: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                        modifiedBy_mail: String(jwtdetails.email)
                    })
                    .where({
                        Log_Id: String(log_id)
                    }));
                await tx.commit();
            }
            catch (erro) {
                LOG.info("log_id : ", log_id, " | ", "Cannot even update in SYNC_AQID_STATUS table: ", erro);
            }
        }
    }


    function handlePrimeAqidFound(joinResponse, l, tentative_mapped_aqid, tentative_recommendation_type, tentative_mapped_aqid_Y, tentative_mapped_aqid_N) {
        if (tentative_mapped_aqid === "Not Found") {
            tentative_mapped_aqid = String(joinResponse[l].Aqid).trim();
            tentative_recommendation_type = "S";
            if (String(joinResponse[l].Stack_item).trim().toLowerCase() === "y") {
                tentative_mapped_aqid_Y = tentative_mapped_aqid
            }
            else {
                tentative_mapped_aqid_N = tentative_mapped_aqid
            }
        }
        else if (!(tentative_mapped_aqid === "Multiple NB Found" || tentative_mapped_aqid === "Split") && String(joinResponse[l].Aqid).trim() !== tentative_mapped_aqid) {
            tentative_mapped_aqid = "Split";
            if (String(joinResponse[l].Stack_item).trim().toLowerCase() === "y" && tentative_mapped_aqid_Y === "Not Found") {
                tentative_mapped_aqid_Y = String(joinResponse[l].Aqid).trim();
                tentative_recommendation_type = "S";
            }
            else if ((String(joinResponse[l].Stack_item).trim().toLowerCase() !== "y") && tentative_mapped_aqid_N === "Not Found") {
                tentative_mapped_aqid_N = String(joinResponse[l].Aqid).trim();
                tentative_recommendation_type = "S";
            }
            else {
                tentative_mapped_aqid = "Multiple NB Found";
                tentative_recommendation_type = "E";
            }
        }
        else if (tentative_mapped_aqid === "Split" && String(joinResponse[l].Aqid).trim() !== tentative_mapped_aqid) {
            tentative_mapped_aqid = "Multiple NB Found";
            tentative_recommendation_type = "E";
        }
        return ({ tentative_mapped_aqid, tentative_mapped_aqid_Y, tentative_mapped_aqid_N, tentative_recommendation_type });
    }


    function handleGroupFound(joinResponse, l, windowStart, tentative_mapped_aqid, tentative_recommendation_type, tentative_mapped_aqid_Y, tentative_mapped_aqid_N) {
        for (; windowStart <= l; windowStart++) {
            let row = joinResponse[windowStart];
            joinResponse[windowStart] = {
                Raw_Aqid: row.Aqid,
                Mapped_Aqid: null,
                Cm_Recommendation: "",
                Program: row.Program,
                Station: row.Station,
                Site: row.Site,
                CM: row.CM,
                GH_Site: row.GH_Site,
                Stack_Item: row.Stack_item ? row.Stack_item : "",
                Make_Aqid: row.Aqid.toLowerCase().trim().slice(-2) === "-r" ? row.Aqid.trim().slice(0, -2) : row.Aqid.trim(),
                Short_Name: "",
                Equipment_Name: row.Equipment_Name,
                MFR: row.Mfr,
                Recommendation_Type: null,
                TimeStamp: "",
                Update_By_User: "",
                Comment: "",
                SAP_CM_Site: `${row.CM}-${row.Site}`
            };
            joinResponse[windowStart].Mapped_Aqid = tentative_mapped_aqid;
            joinResponse[windowStart].Recommendation_Type = tentative_recommendation_type;
            if (tentative_mapped_aqid === "Split") {
                if (String(joinResponse[windowStart].Stack_Item).trim().toLowerCase() === "y") {
                    joinResponse[windowStart].Mapped_Aqid = tentative_mapped_aqid_Y;
                }
                else {
                    joinResponse[windowStart].Mapped_Aqid = tentative_mapped_aqid_N;
                }
            }
            // removed code: if joinRsponse[windowStart] has same mapped and raw aqid then we set mapped_aqid to TO_REM
        }
    }

    function handleGroupFoundWithoutR(joinResponse, l, windowStart) {
        for (; windowStart <= l; windowStart++) {
            let row = joinResponse[windowStart];
            joinResponse[windowStart] = {
                Raw_Aqid: row.Aqid,
                Mapped_Aqid: null,
                Cm_Recommendation: "",
                Program: row.Program,
                Station: row.Station,
                Site: row.Site,
                CM: row.CM,
                GH_Site: row.GH_Site,
                Stack_Item: row.Stack_item ? row.Stack_item : "",
                Make_Aqid: row.Aqid.toLowerCase().trim().slice(-2) === "-r" ? row.Aqid.trim().slice(0, -2) : row.Aqid.trim(),
                Short_Name: "",
                Equipment_Name: row.Equipment_Name,
                MFR: row.Mfr,
                Recommendation_Type: null,
                TimeStamp: "",
                Update_By_User: "",
                Comment: "",
                SAP_CM_Site: `${row.CM}-${row.Site}`
            };
            joinResponse[windowStart].Mapped_Aqid = joinResponse[windowStart].Make_Aqid;
            joinResponse[windowStart].Recommendation_Type = "S";
        }
    }

    function getStackItem(row) {
        if (row.Stack_item) {
            return (row.Stack_item);
        }
        else {
            return "";
        }
    }

    function getMakeAQID(row) {
        if (row.Aqid.toLowerCase().trim().slice(-2) === "-r") {
            return (row.Aqid.trim().slice(0, -2));
        }
        else {
            return (row.Aqid.trim());
        }
    }

    function getEmptyGrpPriorityMappedAqid(AQID) {
        if (AQID.toLowerCase().trim().slice(-2) === "-r") {
            return ("Not Found");
        }
        else {
            return (AQID.trim());
        }
    }

    function getEmptyGrpPriorityRecoType(AQID) {
        if (AQID.toLowerCase().trim().slice(-2) === "-r") {
            return ("E");
        }
        else {
            return ("S");
        }
    }

    function isGroupEnderFound(joinResponse, l) {
        return (String(joinResponse[l].Group_Priority).trim() !== "" && (l >= joinResponse.length - 1 || parseInt(String(joinResponse[l + 1].Group_Priority).trim()) !== parseInt(String(joinResponse[l].Group_Priority).trim()) || joinResponse[l + 1].Program !== joinResponse[l].Program || joinResponse[l + 1].Station !== joinResponse[l].Station || joinResponse[l + 1].Mfr !== joinResponse[l].Mfr || joinResponse[l + 1].CM !== joinResponse[l].CM || joinResponse[l + 1].Site !== joinResponse[l].Site))
    }

    function sortHelper(a, b, fields) {
        let i = 0;
        while (i < fields.length) {
            if (a[fields[i]] < b[fields[i]]) {
                return (-2);
            }
            else if (a[fields[i]] > b[fields[i]]) {
                return (2);
            }
            i++;
        }
        return 0;
    }

    function adjacentDuplicateFilter(e, i, a, fields) {
        let j;
        if (i === 0) return true;
        for (j = 0; j < fields.length; j++) {
            if (e[fields[j]] !== a[i - 1][fields[j]])
                return true;
        }
        return false;
    }

    function removeToRemFilter(el) {
        if (el['Mapped_Aqid'] === 'TO_REM') {
            return false;
        }
        return true;
    }

    function multipleNBFilter(el) {
        if (el.Mapped_Aqid === 'Multiple NB Found' && el.Recommendation_Type === 'E' && el.Raw_Aqid.slice(-2).toLowerCase() !== "-r") {
            el.Mapped_Aqid = el.Raw_Aqid;
            el.Recommendation_Type = 'S';
        }
        return el;

    }

    async function doAqidMapping(log_id, fileDateObj, jwtdetails, request) {
        const LOG = request.req.params["LOG"];
        let joinResponse = await (SELECT.from("V_AQIDANDBOMJOIN").where({ "Equipment_Type": 'Buy' }).orderBy({ "CM": "desc", "Site": "desc", "Program": "desc", "Mfr": "desc", "Station": "desc", "Group_Priority": "desc" }));
        if (joinResponse.length <= 0) {
            LOG.info("log_id : ", log_id, " | ", "no data fetched from V_AQIDANDBOMJOIN");
            return;
        }

        let tentative_mapped_aqid = "Not Found";
        let tentative_mapped_aqid_Y = "Not Found";
        let tentative_mapped_aqid_N = "Not Found";
        let tentative_recommendation_type = "E";
        let windowStart = 0;
        let someRcontainingAQIDFound = false;
        for (let l = 0; l < joinResponse.length; l++) {
            //A group is the collection of all entries where (CM, Site, Program and Group_priority are same)
            //PRIME AQID for a group is the AQID of that entry in grp which is (equipment_type===buy, AQID is free of -r)
            //if there is only one PRIME AQID, then that is mapped AQID for the group
            //if there are 2 AQID, then we must hope that both are of different stack items flags
            //if there are >2 PRIME AQIDs or 2 PRIME AQIDs with same stack items then we indicate "Multiple NB found" exception
            //if no PRIME AQID is found in a group then we indicate "Not Found" exception 
            if (String(joinResponse[l].Group_Priority).trim() === "") {
                let row = joinResponse[l];
                joinResponse[l] = {
                    Raw_Aqid: row.Aqid,
                    Mapped_Aqid: null,
                    Cm_Recommendation: "",
                    Program: row.Program,
                    Station: row.Station,
                    Site: row.Site,
                    CM: row.CM,
                    GH_Site: row.GH_Site,
                    Stack_Item: getStackItem(row),
                    Make_Aqid: getMakeAQID(row),
                    Short_Name: "",
                    Equipment_Name: row.Equipment_Name,
                    MFR: row.Mfr,
                    Recommendation_Type: null,
                    TimeStamp: "",
                    Update_By_User: "",
                    Comment: "",
                    SAP_CM_Site: `${row.CM}-${row.Site}`
                }
                joinResponse[l].Mapped_Aqid = getEmptyGrpPriorityMappedAqid(joinResponse[l].Raw_Aqid);
                joinResponse[l].Recommendation_Type = getEmptyGrpPriorityRecoType(joinResponse[l].Raw_Aqid);
                windowStart = l + 1;
            }
            else if ((String(joinResponse[l].Aqid).trim().slice(-2).toLowerCase() !== "-r") && (String(joinResponse[l].Equipment_Type).trim().toLowerCase() === "buy")) {
                //gathers data abt what this entry of the group indicates
                let ro = handlePrimeAqidFound(joinResponse, l, tentative_mapped_aqid, tentative_recommendation_type, tentative_mapped_aqid_Y, tentative_mapped_aqid_N);
                tentative_mapped_aqid = ro.tentative_mapped_aqid;
                tentative_mapped_aqid_Y = ro.tentative_mapped_aqid_Y;
                tentative_mapped_aqid_N = ro.tentative_mapped_aqid_N;
                tentative_recommendation_type = ro.tentative_recommendation_type;
            }
            else if (String(joinResponse[l].Aqid).trim().slice(-2).toLowerCase() === "-r") {
                someRcontainingAQIDFound = true;
            }

            if (isGroupEnderFound(joinResponse, l)) {
                //this is the last entry of the group
                if (someRcontainingAQIDFound) {
                    handleGroupFound(joinResponse, l, windowStart, tentative_mapped_aqid, tentative_recommendation_type, tentative_mapped_aqid_Y, tentative_mapped_aqid_N);
                }
                else {
                    handleGroupFoundWithoutR(joinResponse, l, windowStart);
                }
                windowStart = l + 1;
                tentative_mapped_aqid = "Not Found";
                tentative_mapped_aqid_Y = "Not Found";
                tentative_mapped_aqid_N = "Not Found";
                tentative_recommendation_type = "E";
                someRcontainingAQIDFound = false;
            }
        }
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        let selu = await (SELECT.from(AQIDMapping).where({
            Recommendation_Type: String('U'),
        }));

        let DiffSelu = DifferentiateMappedAQIDCases(selu);

        let selu_Good = DiffSelu.selu_Good, selu_Bad = DiffSelu.selu_Bad;

        joinResponse = joinResponse.map(el => multipleNBFilter(el));
        joinResponse = joinResponse.map(el => {
            el.createdBy_Name = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
            el.createdBy_mail = String(jwtdetails.email);
            return el;
        })
        joinResponse = selu_Good.concat(joinResponse);
        joinResponse = joinResponse.concat(selu_Bad);
        joinResponse = joinResponse.filter(el => removeToRemFilter(el))
        let joinResponse2 = await (SELECT.from("V_AQIDANDBOMJOIN").where({ "Equipment_Type": 'Carry Over' }));
        joinResponse2 = joinResponse2.map((row) => {
            return ({
                Raw_Aqid: row.Aqid,
                Mapped_Aqid: row.Aqid,
                Cm_Recommendation: "",
                Program: row.Program,
                Station: row.Station,
                Site: row.Site,
                CM: row.CM,
                GH_Site: row.GH_Site,
                Stack_Item: getStackItem(row),
                Make_Aqid: row.Aqid,
                Short_Name: "",
                Equipment_Name: row.Equipment_Name,
                MFR: row.Mfr,
                Recommendation_Type: null,
                TimeStamp: "",
                Update_By_User: "",
                Comment: "",
                SAP_CM_Site: `${row.CM}-${row.Site}`,
                createdBy_Name: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                createdBy_mail: String(jwtdetails.email)
            })
        });
        joinResponse = joinResponse.concat(joinResponse2);
        joinResponse = joinResponse.sort((a, b) => sortHelper(a, b, ['Raw_Aqid', 'Mapped_Aqid', 'Program', 'Site', 'CM', 'GH_Site', 'Station']));
        joinResponse = joinResponse.filter((e, ind, a) => adjacentDuplicateFilter(e, ind, a, ['Raw_Aqid', 'Mapped_Aqid', 'Program', 'Site', 'CM', 'GH_Site', 'Station']));
        joinResponse = joinResponse.sort((a, b) => sortHelper(a, b, ['Raw_Aqid', 'Mapped_Aqid', 'Program', 'Site', 'CM', 'GH_Site']));
        joinResponse = joinResponse.filter((e, ind, a) => adjacentDuplicateFilter(e, ind, a, ['Raw_Aqid', 'Mapped_Aqid', 'Program', 'Site', 'CM', 'GH_Site']));
        joinResponse = joinResponse.sort((a, b) => sortHelper(a, b, ['Raw_Aqid', 'Program', 'Site', 'CM', 'GH_Site']));
        joinResponse = joinResponse.filter((e, ind, a) => adjacentDuplicateFilter(e, ind, a, ['Raw_Aqid', 'Program', 'Site', 'CM', 'GH_Site']));
        await pushToDB(joinResponse, AQIDMapping, false, log_id, jwtdetails, fileDateObj, { request });


    }
    function DifferentiateMappedAQIDCases(selu) {
        let selu_Good = [];
        let selu_Bad = [];

        let i = 0;
        for (; i < selu.length; i++) {
            selu[i].SAP_CM_Site = `${selu[i].CM}-${selu[i].Site}`;
            if (selu[i].Mapped_Aqid === 'Not Found' || selu[i].Mapped_Aqid === 'Multiple NB Found') {
                selu_Bad.push(selu[i]);
            }
            else {
                selu_Good.push(selu[i]);
            }
        }
        return { selu_Good: selu_Good, selu_Bad: selu_Bad };
    }
    function getProperNumberRowData(rowNum, rowData) {
        return ((rowData[rowNum] && Number.isInteger(parseInt(rowData[rowNum])) && Math.abs(parseInt(rowData[rowNum])) < 2147483647) ? parseInt(rowData[rowNum]) : 0)
    }

    async function handleAQIDCase(aqidDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request) {
        const LOG = request.req.params["LOG"];
        let jwtdetails = secDetailsObj.jwtdetails;
        let userid = secDetailsObj.userid;
        let csvData, dataQueue;
        LOG.info(aqidDone);
        aqidDone = true;
        fileDateObj.dateArray.push(fileDateObj.passedArg);
        LOG.info("log_id : ", log_id, " | ", "Processing current AQID file, so have added: ", fileDateObj.passedArg, " to dateArray for consideration")
        todoleft--;
        LOG.info("log_id : ", log_id, " | ", "AQID case");
        csvData = await getFile(idVal, log_id, jwtdetails, fileDateObj, request);
        csvData.splice(0, 1);
        csvData.splice(csvData.length - 1, 1);
        dataQueue = csvData.map((row) => {
            let rowData = row.split("\t");
            if (rowData.length <= 3) rowData = row.split(",");
            let statusData = rowData[0];
            rowData = rowData.slice(1, rowData.length);

            return ({
                GH_SITE: String(rowData[0]),
                SITE: String(rowData[22]).slice(5, 9),
                CM: String(rowData[22]).slice(0, 4),
                AQID: String(rowData[1]),
                MFR: String(rowData[3]),
                PROGRAM: String(rowData[23]),
                EQUIPMENT_NAME: String(rowData[2]),
                CATEGORY: String(rowData[5]),
                SUB_CATEGORY: String(rowData[6]),
                PO_TYPE: String(rowData[12]),
                SPARE_QTY: getProperNumberRowData(9, rowData),
                SPARE_RATE: getProperNumberRowData(10, rowData),
                RELEASE_QTY: getProperNumberRowData(11, rowData),
                CONSUMABLES: (String(rowData[13]) === "Yes") ? 'Y' : 'N',
                STACK_ITEM: String(rowData[15]),
                PO_QTY: getProperNumberRowData(19, rowData),
                PR_QTY: getProperNumberRowData(20, rowData),
                CREATEDAT: (new Date().toISOString()),
                CREATEDBY: String(userid),
                CREATEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                CREATEDBY_MAIL: String(jwtdetails.email),
                SAP_CM_SITE: String(rowData[22]).slice(0, 9),
                STATUSDATA: statusData
            });
        });
        let keyArr = ['CM', 'SITE', 'AQID', 'MFR', 'PROGRAM']
        let allFieldsArr = ['GH_SITE', 'SITE', 'CM', 'AQID', 'MFR', 'PROGRAM', 'EQUIPMENT_NAME', 'CATEGORY', 'SUB_CATEGORY', 'PO_TYPE',
            'SPARE_QTY', 'SPARE_RATE', 'RELEASE_QTY', 'CONSUMABLES', 'STACK_ITEM', 'PO_QTY', 'PR_QTY', 'CREATEDAT', 'CREATEDBY', 'CREATEDBY_NAME', 'CREATEDBY_MAIL', 'SAP_CM_SITE'];
        dataQueue = dataQueue.sort((a, b) => sortHelper(a, b, ['CM', 'SITE', 'AQID', 'MFR', 'PROGRAM']));
        dataQueue = dataQueue.filter((e, i, a) => adjacentDuplicateFilter(e, i, a, ['CM', 'SITE', 'AQID', 'MFR', 'PROGRAM']));

        await pushToDB(dataQueue, "COM_APPLE_COA_T_COA_AQID_MAIN", idVal, log_id, jwtdetails, fileDateObj, { keyArr, allFieldsArr, request })
        return ({ aqidDone, todoleft });
    }

    async function handleBOMCase(bomDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request) {
        const LOG = request.req.params["LOG"];
        let jwtdetails = secDetailsObj.jwtdetails;
        let userid = secDetailsObj.userid;
        let csvData, dataQueue;
        LOG.info(bomDone);
        bomDone = true;
        fileDateObj.dateArray.push(fileDateObj.passedArg);
        LOG.info("log_id : ", log_id, " | ", "Processing current BOM file, so have added: ", fileDateObj.passedArg, " to dateArray for consideration")
        todoleft--;
        LOG.info("log_id : ", log_id, " | ", "BOM case");
        csvData = await getFile(idVal, log_id, jwtdetails, fileDateObj, request);
        csvData.splice(0, 1);
        csvData.splice(csvData.length - 1, 1);
        const groupPriorityMap = new Map();
        dataQueue = csvData.map((row) => {
            let rowData = row.split("\t");
            if (rowData.length <= 3) rowData = row.split(",");
            let statusData = rowData[0];
            rowData = rowData.slice(1, rowData.length);

            if (rowData[5] && rowData[6] && String(rowData[5]).trim() !== "" && String(rowData[6]).trim() !== "") {
                groupPriorityMap.set(String(rowData[6]).trim(), String(rowData[5]).trim());
            }
            let retObj = ({
                GH_SITE: String(rowData[0]),
                DEPT: String(rowData[1]),
                SITE: String(rowData[15]).slice(5, 9),
                CM: String(rowData[15]).slice(0, 4),
                STATION: String(rowData[2]),
                LEVEL: String(rowData[4]),
                GROUP_PRIORITY: String(rowData[5]).trim(),
                AQID: String(rowData[6]).trim(),
                PROGRAM: String(rowData[16]),
                PARENT_ITEM: String(rowData[3]).trim(),
                MP_INTENT_QTY: rowData[7] ? parseFloat(rowData[7]) : 0,
                SCOPE: String(rowData[8]),
                EQUIPMENT_TYPE: String(rowData[9]),
                CREATEDAT: (new Date().toISOString()),
                CREATEDBY: String(userid),
                CREATEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                CREATEDBY_MAIL: String(jwtdetails.email),
                SAP_CM_SITE: String(rowData[15]).slice(0, 9),
                STATUSDATA: statusData
            });
            if (retObj.GROUP_PRIORITY === "" && retObj.PARENT_ITEM !== "" && groupPriorityMap.get(retObj.PARENT_ITEM) !== undefined) {
                retObj.GROUP_PRIORITY = groupPriorityMap.get(retObj.PARENT_ITEM);
            }
            return retObj;

        });
        let keyArr = ['CM', 'SITE', 'STATION', 'LEVEL', 'GROUP_PRIORITY', 'AQID', 'PROGRAM']
        let allFieldsArr = ['GH_SITE', 'DEPT', 'CM', 'SITE', 'STATION', 'LEVEL', 'GROUP_PRIORITY', 'AQID', 'PROGRAM',
            'PARENT_ITEM', 'MP_INTENT_QTY', 'SCOPE', 'EQUIPMENT_TYPE', 'CREATEDAT', 'CREATEDBY_NAME', 'CREATEDBY_MAIL', 'SAP_CM_SITE'];
        dataQueue = dataQueue.sort((a, b) => sortHelper(a, b, ['CM', 'SITE', 'STATION', 'LEVEL', 'GROUP_PRIORITY', 'AQID', 'PROGRAM']));
        dataQueue = dataQueue.filter((e, i, a) => adjacentDuplicateFilter(e, i, a, ['CM', 'SITE', 'STATION', 'LEVEL', 'GROUP_PRIORITY', 'AQID', 'PROGRAM']));
        await pushToDB(dataQueue, "COM_APPLE_COA_T_COA_BOM_STRUCTURE", idVal, log_id, jwtdetails, fileDateObj, { keyArr, allFieldsArr, request });
        return ({ bomDone, todoleft });
    }

    async function handleStationCase(stationDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request) {
        const LOG = request.req.params["LOG"];
        let jwtdetails = secDetailsObj.jwtdetails;
        let userid = secDetailsObj.userid;
        let csvData, dataQueue;
        LOG.info(stationDone);
        stationDone = true;
        fileDateObj.dateArray.push(fileDateObj.passedArg);
        LOG.info("log_id : ", log_id, " | ", "Processing current Station summary file, so have added: ", fileDateObj.passedArg, " to dateArray for consideration")
        todoleft--;
        LOG.info("log_id : ", log_id, " | ", "Station summary case");
        csvData = await getFile(idVal, log_id, jwtdetails, fileDateObj, request);
        csvData.splice(0, 1);
        csvData.splice(csvData.length - 1, 1);

        dataQueue = csvData.map((row) => {
            let rowData = row.split("\t");
            if (rowData.length <= 3) rowData = row.split(",");
            let statusData = rowData[0];
            rowData = rowData.slice(1, rowData.length);
            let gtemp = (parseInt(rowData[4]) <= 2147483647 ? parseInt(rowData[4]) : 2147483647);
            let atemp = (parseInt(rowData[5]) <= 2147483647 ? parseInt(rowData[5]) : 2147483647);
            return ({
                GH_SITE: String(rowData[0]),
                LINE: String(rowData[1]).replace(/\|\|/g, ' ').trim(),
                STATION: String(rowData[2]),
                PROGRAM: String(rowData[8]),
                GROUP: rowData[4] ? gtemp : 0,
                SITE: String(rowData[7]).slice(5, 9),
                CM: String(rowData[7]).slice(0, 4),
                CREATEDAT: (new Date().toISOString()),
                CREATEDBY: String(userid),
                CREATEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                CREATEDBY_MAIL: String(jwtdetails.email),
                SAP_CM_SITE: String(rowData[7]).slice(0, 9),
                DISPLAY_NAME: String(rowData[3]),
                ALT_STATION: rowData[5] ? atemp : 0,
                STATUSDATA: statusData
            });
        });

        let keyArr = ['CM', 'SITE', 'LINE', 'STATION', 'PROGRAM']
        let allFieldsArr = ['GH_SITE', 'LINE', 'STATION', 'PROGRAM', `"GROUP"`, 'SITE', 'CM', 'CREATEDAT', 'CREATEDBY', 'CREATEDBY_NAME', 'CREATEDBY_MAIL', 'SAP_CM_SITE', 'DISPLAY_NAME', 'ALT_STATION'];
        dataQueue = dataQueue.sort((a, b) => sortHelper(a, b, ['CM', 'SITE', 'LINE', 'STATION', 'PROGRAM']));
        dataQueue = dataQueue.filter((e, i, a) => adjacentDuplicateFilter(e, i, a, ['CM', 'SITE', 'LINE', 'STATION', 'PROGRAM']));
        await pushToDB(dataQueue, "COM_APPLE_COA_T_COA_STATION_SUMMARY", idVal, log_id, jwtdetails, fileDateObj, { keyArr, allFieldsArr, request });
        return ({ stationDone, todoleft });
    }

    async function handleLineBringUpCase(bringDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request) {
        const LOG = request.req.params["LOG"];
        let jwtdetails = secDetailsObj.jwtdetails;
        let userid = secDetailsObj.userid;
        let csvData, dataQueue;
        LOG.info(bringDone);
        bringDone = true;
        fileDateObj.dateArray.push(fileDateObj.passedArg);
        LOG.info("log_id : ", log_id, " | ", "Processing current line bring up file, so have added: ", fileDateObj.passedArg, " to dateArray for consideration")
        todoleft--;
        LOG.info("log_id : ", log_id, " | ", "Line bring up case");
        csvData = await getFile(idVal, log_id, jwtdetails, fileDateObj, request);

        csvData.splice(0, 1);
        csvData.splice(csvData.length - 1, 1);
        dataQueue = csvData.map((row) => {
            let rowData = row.split("\t");
            if (rowData.length <= 3) rowData = row.split(",");
            let statusData = rowData[0];
            rowData = rowData.slice(1, rowData.length);

            return ({
                CM: String(rowData[9]).slice(0, 4),
                SITE: String(rowData[9]).slice(5, 9),
                LINE: String(rowData[1]).replace(/\|\|/g, ' ').trim(),
                UPH: rowData[2] ? parseInt(rowData[2]) : 0,
                STATION: String(rowData[4]),
                PROGRAM: String(rowData[10]),
                WW: String(rowData[3]),
                LINE_QTY: rowData[5] ? parseInt(rowData[5]) : 0,
                FLOOR_QTY: rowData[6] ? parseInt(rowData[6]) : 0,
                BUILDING_QTY: rowData[7] ? parseInt(rowData[7]) : 0,
                SITE_QTY: rowData[8] ? parseInt(rowData[8]) : 0,
                GH_SITE: String(rowData[0]),
                CREATEDAT: (new Date().toISOString()),
                CREATEDBY: String(userid),
                CREATEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                CREATEDBY_MAIL: String(jwtdetails.email),
                SAP_CM_SITE: String(rowData[9]).slice(0, 9),
                STATUSDATA: statusData
            });
        });
        let keyArr = ['CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM']
        let allFieldsArr = ['CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM',
            'WW', 'LINE_QTY', 'FLOOR_QTY', 'BUILDING_QTY', 'SITE_QTY', 'GH_SITE',
            'CREATEDAT', 'CREATEDBY', 'CREATEDBY_NAME', 'CREATEDBY_MAIL', 'SAP_CM_SITE'];
        dataQueue = dataQueue.sort((a, b) => sortHelper(a, b, ['CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM']));
        dataQueue = dataQueue.filter((e, i, a) => adjacentDuplicateFilter(e, i, a, ['CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM']));
        await pushToDB(dataQueue, "COM_APPLE_COA_T_COA_LINE_BRING_UP", idVal, log_id, jwtdetails, fileDateObj, { keyArr, allFieldsArr, request });
        return ({ bringDone, todoleft });
    }

    async function handleLineSummaryCase(summaryDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request) {
        const LOG = request.req.params["LOG"];
        let jwtdetails = secDetailsObj.jwtdetails;
        let userid = secDetailsObj.userid;
        let csvData, dataQueue;
        LOG.info(summaryDone);
        summaryDone = true;
        fileDateObj.dateArray.push(fileDateObj.passedArg);
        LOG.info("log_id : ", log_id, " | ", "Processing current line summary file, so have added: ", fileDateObj.passedArg, " to dateArray for consideration")
        todoleft--;
        LOG.info("log_id : ", log_id, " | ", "Line summary case");
        csvData = await getFile(idVal, log_id, jwtdetails, fileDateObj, request);

        csvData.splice(0, 1);
        csvData.splice(csvData.length - 1, 1);
        dataQueue = csvData.map((row) => {
            let rowData = row.split("\t");
            if (rowData.length <= 3) rowData = row.split(",");
            let statusData = rowData[0];
            rowData = rowData.slice(1, rowData.length);

            return ({
                GH_SITE: String(rowData[0]),
                LINE: String(rowData[1]).replace(/\|\|/g, ' ').trim(),
                UPH: rowData[2] ? parseInt(rowData[2]) : 0,
                STATION: String(rowData[3]),
                GH_SPL: rowData[4] ? parseInt(rowData[4]) : 0,
                PROGRAM: String(rowData[6]),
                SITE: String(rowData[5]).slice(5, 9),
                CM: String(rowData[5]).slice(0, 4),
                CREATEDAT: (new Date().toISOString()),
                CREATEDBY: String(userid),
                CREATEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                CREATEDBY_MAIL: String(jwtdetails.email),
                SAP_CM_SITE: String(rowData[5]).slice(0, 9),
                STATUSDATA: statusData
            });
        });
        dataQueue.push({
            GH_SITE: "",
            LINE: "Warehouse",
            UPH: 0,
            STATION: "",
            GH_SPL: 0,
            PROGRAM: "",
            SITE: "",
            CM: "",
            CREATEDAT: (new Date().toISOString()),
            CREATEDBY: String(userid),
            SAP_CM_SITE: "",
            STATUSDATA: 'I'
        });
        let keyArr = ['CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM']
        let allFieldsArr = ['GH_SITE', 'CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM',
            'GH_SPL', 'CREATEDAT', 'CREATEDBY', 'CREATEDBY_NAME', 'CREATEDBY_MAIL', 'SAP_CM_SITE'];
        dataQueue = dataQueue.sort((a, b) => sortHelper(a, b, ['CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM']));
        dataQueue = dataQueue.filter((e, i, a) => adjacentDuplicateFilter(e, i, a, ['CM', 'SITE', 'LINE', 'UPH', 'STATION', 'PROGRAM']));

        await pushToDB(dataQueue, "COM_APPLE_COA_T_COA_LINE_SUMMARY", idVal, log_id, jwtdetails, fileDateObj, { keyArr, allFieldsArr, request });
        return ({ summaryDone, todoleft });
    }

    async function getDMSResponse(log_id, sDestinationName, core, LOG) {
        let DMSResponse;
        try {
            LOG.info("log_id : ", log_id, " | ", "inside try block")
            const xsenv = require("@sap/xsenv");
            xsenv.loadEnv();
            if (process.env.NODE_ENV !== 'test') {
                DMSResponse = await core.executeHttpRequest(
                    { destinationName: sDestinationName },
                    {
                        method: "GET",
                        url: process.env.URL_EXTENSION,
                        headers: {
                            "appid": process.env.appid
                        }
                    }
                );
            }
            else {
                DMSResponse = {};
                DMSResponse.data = {
                    objects: [
                        {
                            object: {
                                properties: {
                                    'cmis:objectId': {
                                        value: 'TestAQIDMaster'
                                    },
                                    'cmis:name': {
                                        value: 'TestAQIDMaster.csv'
                                    },
                                    'cmis:lastModificationDate': {
                                        value: 1668624078755
                                    }
                                },
                            }
                        },
                        {
                            object: {
                                properties: {
                                    'cmis:objectId': {
                                        value: 'TestBOMStructure'
                                    },
                                    'cmis:name': {
                                        value: 'TestBOMStructure.csv'
                                    },
                                    'cmis:lastModificationDate': {
                                        value: 1668624078755
                                    }
                                },
                            }
                        },
                        {
                            object: {
                                properties: {
                                    'cmis:objectId': {
                                        value: 'TestStationSummary'
                                    },
                                    'cmis:name': {
                                        value: 'TestStationSummary.csv'
                                    },
                                    'cmis:lastModificationDate': {
                                        value: 1668624078755
                                    }
                                },
                            }
                        },
                        {
                            object: {
                                properties: {
                                    'cmis:objectId': {
                                        value: 'TestLineBringUp'
                                    },
                                    'cmis:name': {
                                        value: 'TestLineBringUp.csv'
                                    },
                                    'cmis:lastModificationDate': {
                                        value: 1668624078755
                                    }
                                },
                            }
                        },
                        {
                            object: {
                                properties: {
                                    'cmis:objectId': {
                                        value: 'TestLineSummary'
                                    },
                                    'cmis:name': {
                                        value: 'TestLineSummary.csv'
                                    },
                                    'cmis:lastModificationDate': {
                                        value: 1668624078755
                                    }
                                },
                            }
                        },
                    ],
                }
            }
            return DMSResponse;
        }
        catch (error) {
            LOG.info("log_id : ", log_id, " | ", "Error while trying to fetch list of documents in DMS: ", error);
            return (`log_id : ${log_id} | Error while trying to fetch list of documents in DMS `);
        }
    }

    async function checkObjArray(objArray, request, log_id, tx, queue, rejected) {
        const LOG = request.req.params["LOG"];
        if (!objArray || objArray.length <= 0) {
            LOG.info("log_id : ", log_id, " | ", "No files received from DMS");
            try {
                queue[0].Status = "Error";
                queue[0].ReasonForStatus = "No files received from DMS";
                await tx.run(INSERT.into(SyncAQIDStatus).entries(queue));
                await tx.commit();
                LOG.info("log_id : ", log_id, " | ", "Inserted into status table");
            }
            catch (err) {
                await tx.rollback();
                LOG.info("log_id : ", log_id, " | ", "1.Cannot insert into SYNC_AQID_STATUS table. Abandonning Process.");
            }
            rejected.rej = true;
            request.reject(403, "No files received from DMS");
        }
        objArray = objArray.filter(el => {
            let name = el["object"]["properties"]['cmis:name']["value"];
            if (name.trim().toLowerCase().includes(".csv") === false) {
                return false;
            }
            return true;
        })
        if (objArray.length <= 0) {
            LOG.info("log_id : ", log_id, " | ", "No valid files received from DMS");
            try {
                queue[0].Status = "Error";
                queue[0].ReasonForStatus = "No valid files (.csv) received from DMS";
                await tx.run(INSERT.into(SyncAQIDStatus).entries(queue));
                await tx.commit();
                LOG.info("log_id : ", log_id, " | ", "Inserted into status table");
            }
            catch (err) {
                await tx.rollback();
                LOG.info("log_id : ", log_id, " | ", "2.Cannot insert into SYNC_AQID_STATUS table. Abandonning Process.");
            }
            rejected.rej = true;
            request.reject(403, "No valid files received from DMS");
        }
    }

    function getOrderfunc(lma, lmb) {
        if (lma < lmb) {
            return -1;
        }
        else {
            return 1;
        }
    }

    srv.before("beginFetch", async (request) => {
        if (request.data.auth) {
            request.headers.authorization = request.data.auth;
            request.data = {};
            if (request.req === undefined) request.req = {};
            if (request.req.params === undefined) request.req.params = {};
            request.req.params.delAll = true;
            request.req.params["LOG"] = cds.log(getuuid(request), { label: 'AQIDSync' });
        }
        else{
            if (request.req === undefined) request.req = {};
            if (request.req.params === undefined) request.req.params = {};
            request.req.params["LOG"] = cds.log(getuuid(request), { label: 'AQIDSync' });
        }
    })

    srv.on("beginFetch", async (request) => {
        let LOG = request.req.params["LOG"];
        let aqidDone, bomDone, stationDone, bringDone, summaryDone;
        aqidDone = false;
        bomDone = false;
        stationDone = false;
        bringDone = false;
        summaryDone = false;
        let todoleft = 5;
        let jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let userid = request.user.id;
        const uuid = require("uuid");
        const log_id = uuid.v1();
        LOG.info("log_id : ", log_id, " | ", "Inside begin fetch");
        let scope = jwtdetails.scope;
        scope = scope.filter((arr, index) => {
            let ind = scope.findIndex(el => el === arr);
            return (ind === index);
        });
        if (scope.findIndex(el => { return (String(el).toLowerCase().includes(String("aqidmodify").toLowerCase())) }) < 0) {
            LOG.info("log_id : ", log_id, " | ", "AQID Modify is not within the scope of the present user");
            request.reject(403, "AQID Modify is not within the scope of the present user");
        }
        const core = require("@sap-cloud-sdk/core");
        const sDestinationName = "COA_DMS";
        let tx = hdb.tx();
        let queue = [];
        let inn = {
            Log_Id: log_id,
            Status: "Started",
            ReasonForStatus: "Successfully started",
            createdBy_Name: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            createdBy_mail: String(jwtdetails.email)
        };
        queue.push(inn);
        let DMSResponse
        let objArray = [];
        let rejected = {};
        let fileDateObj = {};

        DMSResponse = await getDMSResponse(log_id, sDestinationName, core, LOG);
        objArray = DMSResponse.data["objects"];

        rejected.rej = false;
        await checkObjArray(objArray, request, log_id, tx, queue, rejected);
        LOG.info("log_id : ", log_id, " | ", "rejected.rej ==", rejected.rej)
        try {
            await tx.run(INSERT.into(SyncAQIDStatus).entries(queue));
            await tx.commit();
            if (process.env.NODE_ENV !== 'test'){
                cds.context.http.res.status(204).send({ msg: "Processing started" });
            }
            LOG.info("log_id : ", log_id, " | ", "Inserted into status table");

        }
        catch (err) {
            await tx.rollback();

            LOG.info("log_id : ", log_id, " | ", "3.Cannot insert into SYNC_AQID_STATUS table. Abandonning Process. ", err);
        }

        //get a list of all documents in relevant DMS folder
        try {


            objArray.sort((a, b) => {
                let lma = a["object"]["properties"]['cmis:lastModificationDate']["value"];
                let lmb = b["object"]["properties"]['cmis:lastModificationDate']["value"];
                return getOrderfunc(lma, lmb);
            })
            let i = 0;

            LOG.info("fileDateObj initialized")
            fileDateObj.dateArray = [];
            fileDateObj.passedArg = "";


            for (; i < objArray.length; i++) {
                let currObj = objArray[i];
                let idVal = currObj["object"]["properties"]['cmis:objectId']["value"]
                let name = currObj["object"]["properties"]['cmis:name']["value"]
                let fileDate = currObj["object"]["properties"]['cmis:lastModificationDate']["value"]////cmis:lastModificationDate/////cmis:creationDate
                fileDateObj.passedArg = new Date(parseInt(fileDate));
                LOG.info("fileDateObj.passedArg filled with: ", fileDateObj.passedArg)
                if (name.trim().toLowerCase().includes(".csv") === false)
                    continue;
                let ro;
                let secDetailsObj = {};
                secDetailsObj.userid = userid;
                secDetailsObj.jwtdetails = jwtdetails;
                if (name.toLowerCase().includes("aqid")) {
                    ro = await handleAQIDCase(aqidDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request);
                    aqidDone = ro.aqidDone;
                    todoleft = ro.todoleft;
                }
                else if (name.toLowerCase().includes("bom")) {
                    ro = await handleBOMCase(bomDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request)
                    bomDone = ro.bomDone;
                    todoleft = ro.todoleft;
                }
                else if (name.toLowerCase().includes("station")) {
                    ro = await handleStationCase(stationDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request)
                    stationDone = ro.stationDone;
                    todoleft = ro.todoleft;
                }
                else if (name.toLowerCase().includes("bring")) {
                    ro = await handleLineBringUpCase(bringDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request)
                    bringDone = ro.bringDone;
                    todoleft = ro.todoleft;
                }
                else if (name.toLowerCase().includes("summary")) {
                    ro = await handleLineSummaryCase(summaryDone, log_id, todoleft, idVal, fileDateObj, secDetailsObj, request)
                    summaryDone = ro.summaryDone;
                    todoleft = ro.todoleft;
                }
            }
        }
        catch (err) {
            LOG.info("log_id : ", log_id, " | ", "Failed to load data from DMS: ", err.response?.data || err.response || err.data || err);
            await saveFailureWithChkInStatusTable(log_id, request);

        }

        LOG.info("log_id : ", log_id, " | ", "file reads completed now. On to Aqid mapping.");
        await doAqidMapping(log_id, fileDateObj, jwtdetails, request);


    })

    async function saveFailureWithChkInStatusTable(log_id, request) {
        const LOG = request.req.params["LOG"];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let tx2 = hdb.tx();
        try {
            let queue2 = [];
            let selChk = await tx2.run(SELECT.from(SyncAQIDStatus).where(`Log_Id='${log_id}'`));
            if (selChk.length <= 0 || String(selChk[0].Status).toLowerCase() !== "error") {
                queue2.push({
                    Log_Id: log_id,
                    Status: "Error",
                    ReasonForStatus: "Failed to load data from DMS",
                    createdBy_Name: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
                    createdBy_mail: String(jwtdetails.email)
                });
                await tx2.run(INSERT.into(SyncAQIDStatus).entries(queue2));
                await tx2.commit();
                LOG.info("log_id : ", log_id, " | ", "Inserted into status table");
            }
        }
        catch (err) {
            await tx2.rollback();
            LOG.info("log_id : ", log_id, " | ", "4.Failed to load data from DMS. Abandonning Process.");
        }
        request.reject(403, "Failed to load data from DMS");
    }

    srv.before("PUT", AQIDMapping, async (request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        const LOG = cds.log(getuuid(request), { label: 'AQIDMappingPUT' });
        request.req.params["LOG"] = LOG;
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`AqidModify`];
        if (AuthorizationCheck(request.data, allowed_cmsite)) {
            LOG.info("User does not have access to modify this CM-Site data");
            request.reject(400, "User does not have access to modify this CM-Site data");
        }
        if (!(request.data.Cm_Recommendation === null || String(request.data.Cm_Recommendation).trim() === '')) {
            request.data.Recommendation_Type = 'U';
        }
        if (request.data.Comment === null || String(request.data.Comment).trim() === '') {
            LOG.info("Comment can't be empty");
            request.reject(400, "Comment can't be empty");
        }
        if (request.data.Cm_Recommendation) {
            request.data.Cm_Recommendation = String(request.data.Cm_Recommendation).trim();
        }
        if (request.data.Short_Name) {
            request.data.Short_Name = String(request.data.Short_Name).trim();
        }
        if (request.data.Comment) {
            request.data.Comment = String(request.data.Comment).trim();
        }
    });

    srv.on("PUT", AQIDMapping, async (request) => {
        const LOG = request.req.params["LOG"];
        let selection_criterion = {
            Raw_Aqid: request.data.Raw_Aqid,
            Mapped_Aqid: request.data.Mapped_Aqid,
            Program: request.data.Program,
            Station: request.data.Station,
            Site: request.data.Site,
            CM: request.data.CM,
            GH_Site: request.data.GH_Site,
        };
        let old_records = await (SELECT.from(AQIDMapping).where(selection_criterion));
        old_records = aqid_mapping_data(old_records[0]);
        request.req.params = { "useridold": request.user.id, "selection_criterion": selection_criterion, "old_records": old_records };
        try {
            await cds.run(
                UPDATE(AQIDMapping)
                    .with(request.data)
                    .where(selection_criterion)
            );
        }
        catch
        {
            LOG.info(`Unable to update AQID Mapping table`);
            request.reject(403, `Unable to update AQID Mapping table`);
        }
        let new_records = await (SELECT.from(AQIDMapping).where(selection_criterion));
        new_records = aqid_mapping_data(new_records[0]);
        let oldRecArray = [];
        let newRecArray = [];
        oldRecArray.push(old_records);
        newRecArray.push(new_records);
        update_changelog(request.user.id, oldRecArray, newRecArray, [], [], request);
    });

    srv.before("GET", AQIDMapping, (request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        request.req.params["LOG"] = cds.log(getuuid(request), { label: 'AQIDMappingGET' })
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        allowedAttributes['AqidReadOnly'] = merge(allowedAttributes['AqidReadOnly'], allowedAttributes['AqidModify'])
        let filterString = getFilterString(allowedAttributes['AqidReadOnly'], request.req.params["LOG"]);
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

    srv.after("GET", AQIDMapping, (data, request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes['AqidModify'];
        request.results.forEach(e => {
            e.Edit = (allowed_cmsite[`${e.CM}-${e.Site}`] !== undefined || allowed_cmsite[`$unrestricted-${e.Site}`] !== undefined ||
                allowed_cmsite[`${e.CM}-$unrestricted}`] !== undefined || allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? 7 : 1;

        });
    })

    function changeObjArrayToQuery(arr) {
        let i = 0;
        let fullQuery = "";
        for (; i < arr.length; i++) {
            let currObj = arr[i];
            let tempQuery = `(Raw_Aqid='${currObj.Raw_Aqid}' and Mapped_Aqid='${currObj.Mapped_Aqid}' and Program='${currObj.Program}' and Site='${currObj.Site}' and CM='${currObj.CM}' and GH_Site='${currObj.GH_Site}')`
            if (i === 0) {
                fullQuery = tempQuery;
            }
            else {
                fullQuery = fullQuery + " or " + tempQuery;
            }
        }
        return fullQuery;
    }

    async function deleteFromAqidMapping(deleteQueue, chunkSize, tx) {
        let k = 0;
        for (; k < deleteQueue.length; k += chunkSize) {
            let delChunk = deleteQueue.slice(k, k + chunkSize);
            let delq = changeObjArrayToQuery(delChunk);
            await tx.run(DELETE.from(AQIDMapping).where(delq));
        }
    }

    srv.before("PUT", Upload_AQIDMapping, async (request) => {
        let guid = getuuid(request);
        const LOG = cds.log(guid, { label: 'Upload' });
        request.req.params["LOG"] = LOG;
        LOG.info("log_id : ", guid, " | ", "Upload started.");
        const {
            Readable
        } = require("stream");
        let readable;
        let csvRawDump = [];
        let deleteQueue = [];
        let insertQueue = [];
        let oldUpdate = [];
        let newUpdate = [];
        let upload_recs = [];
        completed = false;
        somethingToInsert = false;
        if (process.env.NODE_ENV !== 'test') {
            readable = Readable.from(request.data.csv);
        } else {
            let filename = "/home/user/projects/220914-coa-platform-api/coa-db/tests/AQID_Mapping.csv";
            readable = fs.createReadStream(filename);
        }
        readable
            .pipe(csv())
            .on("data", async function (csvrow) {
                csvRawDump.push(csvrow);
            })
            .on("finish", async function () {
                const tx = hdb.tx();
                try {
                    if (csvRawDump.length > 10001) {
                        request._.res.send({ msg: `File upload is allowed only for 10k records` });
                        return;
                    }
                    let result = {};
                    result = await collect_data(csvRawDump, deleteQueue, insertQueue, newUpdate, oldUpdate, upload_recs, request);
                    deleteQueue = result.deleteQueue;
                    insertQueue = result.insertQueue;
                    newUpdate = result.newUpdate;
                    oldUpdate = result.oldUpdate;
                    upload_recs = result.upload_recs;
                    if (deleteQueue.length > 0) {
                        somethingToInsert = true;
                        if (process.env.NODE_ENV !== 'test') {
                            let chunkSize = 1000;
                            await deleteFromAqidMapping(deleteQueue, chunkSize, tx);
                            await tx.run(INSERT.into(AQIDMapping).entries(insertQueue));
                            await tx.commit();
                            update_changelog(request.user.id, oldUpdate, newUpdate, [], [], request);
                        }
                        await messageOtherAppsForResync(request);
                        LOG.info("log_id : ", guid, " | ", "Successfully inserted into db. Upload complete.");
                    }
                    if (upload_recs) {
                        LOG.info("log_id : ", guid, " | ", "Sending back ", upload_recs.length, " error records");
                        request._.res.send({
                            msg: upload_recs
                        });
                    } else {
                        request._.res.send({
                            msg: `Nothing to Update`
                        });
                    }
                    completed = true;
                }
                catch (error) {
                    await tx.rollback(error);
                    LOG.info("log_id : ", guid, " | ", "Error while inserting csv changes into db: ", error);
                }
            }
            );
    });

    function findInsertObjIndex(el, keyObj) {
        let fieldsArray = ["Raw_Aqid", "Mapped_Aqid", "Program", "Site", "CM", "GH_Site"];
        let j = 0;
        for (; j < fieldsArray.length; j++) {
            if (el[fieldsArray[j]] !== keyObj[fieldsArray[j]]) {
                return false;
            }
        }
        return true;
    }

    function findInsertObjIndexes(allSelectionResults, keyObj) {
        let retArray = [];
        let i = 0;
        for (; i < allSelectionResults.length; i++) {
            if (findInsertObjIndex(allSelectionResults[i], keyObj)) {
                retArray.push(i);
            }
        }
        return retArray;
    }

    function findInsertQueueIndex(el, keyObj) {
        return (el.Raw_Aqid === keyObj.Raw_Aqid && el.Mapped_Aqid === keyObj.Mapped_Aqid && el.Program === keyObj.Program && el.Site === keyObj.Site && el.CM === keyObj.CM && el.GH_Site === keyObj.GH_Site) ? true : false;
    }

    function findAllCMRecoSelectionResultsIndex(el, csvrow) {
        return (el.AQID === csvrow["CM Manual Mapped AQID"]) ? true : false;
    }

    function constructUploadRecs(keyObj, upload_recs, csvrow) {
        if (keyObj.Error !== "") {
            let tempKeyObj;
            tempKeyObj = JSON.parse(JSON.stringify(keyObj));
            tempKeyObj.Cm_Recommendation = csvrow["CM Manual Mapped AQID"];
            tempKeyObj.Short_Name = csvrow["Short Name"];
            tempKeyObj.Comment = csvrow["Comment"];
            upload_recs.push(tempKeyObj);
        }
    }

    function adjacentDuplicateRemoveFilter(e, inde, a) {
        if (inde === 0) {
            return true;
        }
        if (e !== a[inde - 1]) {
            return true;
        }
        return false;
    }

    function resetObj(obj) {
        obj.i = -1;
    }

    function constructCollectionTables(csvRawDump, Cm_Recommendation_collection) {
        let fullQuery = "";
        let fqa = [];
        let winStart = 0;
        let obj = {};
        obj.i = 0;
        for (; obj.i < 1000; obj.i++) {
            if (winStart + obj.i >= csvRawDump.length) {
                if (fullQuery !== "") {
                    fqa.push(fullQuery);
                }
                break;
            }
            let csvrow = csvRawDump[winStart + obj.i];
            Cm_Recommendation_collection.push(csvrow["CM Manual Mapped AQID"]);
            let tempQuery = `(Raw_Aqid='${csvrow["Raw AQID"]}' and Mapped_Aqid='${csvrow["Mapped AQID"]}' and Program='${csvrow["Program"]}' and GH_Site='${csvrow["GH Site"]}' and SAP_CM_Site='${csvrow["CM"]}-${csvrow["Site"]}')`
            if (obj.i === 0) {
                fullQuery = tempQuery;
            }
            else {
                fullQuery = fullQuery + " or " + tempQuery;
            }

            if (obj.i === 999) {
                winStart = winStart + 1000;
                resetObj(obj);
                fqa.push(fullQuery);
                fullQuery = "";
            }
        }
        return fqa;
    }

    async function collect_data(csvRawDump, deleteQueue, insertQueue, newUpdate, oldUpdate, upload_recs, request) {
        const LOG = request.req.params["LOG"];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`AqidModify`];
        let i = 0;
        let Cm_Recommendation_collection = [];
        let query = constructCollectionTables(csvRawDump, Cm_Recommendation_collection)
        Cm_Recommendation_collection = Cm_Recommendation_collection.sort();
        Cm_Recommendation_collection = Cm_Recommendation_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        let allSelectionResults = [];
        for (; i < query.length; i++) {
            allSelectionResults = allSelectionResults.concat(await cds.run(SELECT.from(AQIDMapping).where(query[i])));
        }

        let allCMRecoSelectionResults = await cds.run(SELECT.from("COM_APPLE_COA_T_COA_AQID_MAIN").where({
            "AQID": { in: Cm_Recommendation_collection }
        }));
        i = 0;
        for (; i < csvRawDump.length; i++) {
            let csvrow = csvRawDump[i];
            let keyObj = {};
            keyObj.Raw_Aqid = csvrow["Raw AQID"];
            keyObj.Mapped_Aqid = csvrow["Mapped AQID"];
            keyObj.Program = csvrow["Program"];
            keyObj.Site = csvrow["Site"];
            keyObj.CM = csvrow["CM"];
            keyObj.GH_Site = csvrow["GH Site"];
            let insertObj;
            let insertObjIndexes = findInsertObjIndexes(allSelectionResults, keyObj);
            let oldDataInCaseOfUpdate = [];
            if (AuthorizationCheck(csvRawDump[i], allowed_cmsite)) {
                LOG.info("user does not have access to this CM-Site combo. Please enter valid CM-Site value.")
                keyObj.Error = `user does not have access to this CM-Site combo. Please enter valid CM-Site value.`;
            }
            else if (insertObjIndexes.length <= 0) {
                keyObj.Error = `Matching record doesn't Exists`;
            }
            else if (insertQueue.findIndex(el => findInsertQueueIndex(el, keyObj)) >= 0) {
                keyObj.Error = `Another record with same key field values is already present in the file`;
            }
            else {
                insertObj = [];
                let k = 0;
                for (; k < insertObjIndexes.length; k++) {
                    insertObj.push(allSelectionResults[insertObjIndexes[k]]);
                }
                oldDataInCaseOfUpdate = aqid_mapping_data(insertObj[0]);
                let CMRecoRecords = allCMRecoSelectionResults.findIndex((el) => findAllCMRecoSelectionResultsIndex(el, csvrow))

                if (CMRecoRecords < 0) {
                    LOG.info("CM Manual Mapped AQID is invalid");
                    keyObj.Error = `CM Manual Mapped AQID is invalid`;
                }
                else if (!csvrow["Mapped AQID"]) {
                    keyObj.Error = `Mapped AQID is mandatory`;
                }
                else {
                    insertObj = insertObj.map(el => {
                        el.Cm_Recommendation = csvrow["CM Manual Mapped AQID"];
                        el.Short_Name = csvrow["Short Name"];
                        el.Comment = csvrow["Comment"];
                        el.Recommendation_Type = 'U';
                        el.modifiedAt = new Date().toISOString();
                        el.modifiedBy = request.user.id;
                        el.modifiedBy_Name = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
                        el.modifiedBy_mail = String(jwtdetails.email);
                        return (el);
                    })

                    deleteQueue.push(keyObj)
                    insertQueue = insertQueue.concat(insertObj);
                    pushToChangelogQueues(newUpdate, oldUpdate, insertObj[0], oldDataInCaseOfUpdate);
                    keyObj.Error = "";
                }
            }
            constructUploadRecs(keyObj, upload_recs, csvrow);
        }
        let result = {};
        result.insertQueue = [];
        result.deleteQueue = [];
        result.newUpdate = [];
        result.oldUpdate = [];
        result.upload_recs = [];
        result.insertQueue = insertQueue;
        result.deleteQueue = deleteQueue;
        result.newUpdate = newUpdate;
        result.oldUpdate = oldUpdate;
        result.upload_recs = upload_recs;
        return result;
    }

    srv.on("PUT", Upload_AQIDMapping, async (request) => {
        const LOG = request.req.params["LOG"];
        LOG.info(`COA - In On Event of Upload AQIDMapping`);
        await waitFor(() => completed === true).then(() => {
            LOG.info(`COA - The wait is over!`);
            if (!somethingToInsert) {
                LOG.info(`COA - Nothing to Update`);
            } else {
                LOG.info(`COA - Uploaded Successfully`);
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

    function pushToChangelogQueues(newUpdate, oldUpdate, insertObj, oldDataInCaseOfUpdate) {
        newUpdate.push(aqid_mapping_data(insertObj));
        oldUpdate.push(oldDataInCaseOfUpdate);
    }

    function findOldRecordIndex(el, selection_criterion) {
        let fieldsArray = ["Raw_Aqid", "Mapped_Aqid", "Program", "Station", "Site", "CM", "GH_Site"];
        let j = 0;
        for (; j < fieldsArray.length; j++) {
            if (el[fieldsArray[j]] !== selection_criterion[fieldsArray[j]]) {
                return false;
            }
        }
        return true;
    }

    function findCMrecoIndex(el, currRequest) {
        if (el.AQID === currRequest.Cm_Recommendation) {
            return true;
        }
        return false;
    }

    async function before_aqid_mapping_action(request) {
        const LOG = request.req.params["LOG"];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`AqidModify`];
        if (request.data.AqidData.length > 5000) {
            request.reject(400, "You cannot mass update more than 5000 records.")
        }
        let i = 0;
        let Raw_Aqid_collection = [];
        let Mapped_Aqid_collection = [];
        let Program_collection = [];
        let Station_collection = [];
        let Site_collection = [];
        let CM_collection = [];
        let GH_Site_collection = [];
        let Cm_Recommendation_collection = [];
        for (; i < request.data.AqidData.length; i++) {
            let csvrow = request.data.AqidData[i];
            Raw_Aqid_collection.push(csvrow["Raw_Aqid"]);
            Mapped_Aqid_collection.push(csvrow["Mapped_Aqid"]);
            Program_collection.push(csvrow["Program"]);
            Station_collection.push(csvrow["Station"]);
            Site_collection.push(csvrow["Site"]);
            CM_collection.push(csvrow["CM"]);
            GH_Site_collection.push(csvrow["GH_Site"]);
            Cm_Recommendation_collection.push(csvrow["Cm_Recommendation"]);
        }
        Raw_Aqid_collection = Raw_Aqid_collection.sort();
        Raw_Aqid_collection = Raw_Aqid_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        Mapped_Aqid_collection = Mapped_Aqid_collection.sort();
        Mapped_Aqid_collection = Mapped_Aqid_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        Program_collection = Program_collection.sort();
        Program_collection = Program_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        Station_collection = Station_collection.sort();
        Station_collection = Station_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        Site_collection = Site_collection.sort();
        Site_collection = Site_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        CM_collection = CM_collection.sort();
        CM_collection = CM_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        GH_Site_collection = GH_Site_collection.sort();
        GH_Site_collection = GH_Site_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        Cm_Recommendation_collection = Cm_Recommendation_collection.sort();
        Cm_Recommendation_collection = Cm_Recommendation_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        let allSelectionResults = await cds.run(SELECT.from(AQIDMapping).where({
            Raw_Aqid: { in: Raw_Aqid_collection },
            Mapped_Aqid: { in: Mapped_Aqid_collection },
            Program: { in: Program_collection },
            Station: { in: Station_collection },
            Site: { in: Site_collection },
            CM: { in: CM_collection },
            GH_Site: { in: GH_Site_collection }
        }));

        let allCMRecoSelectionResults = await cds.run(SELECT.from("COM_APPLE_COA_T_COA_AQID_MAIN").where({
            "AQID": { in: Cm_Recommendation_collection }
        }));
        i = 0;


        while (i < request.data.AqidData.length) {
            let currRequest = request.data.AqidData[i];
            let currError = "";
            let currErrorCode = 0;
            if (AuthorizationCheck(request.data.AqidData[i], allowed_cmsite)) {
                LOG.info("User does not have access to modify this CM-Site data");
                currError = "User does not have access to modify this CM-Site data";
                currErrorCode = 400;
                request.req.params[i] = { "useridold": request.user.id, "selection_criterion": null, "old_records": null, "error": currError, "errorCode": currErrorCode };
                i++;
                continue;
            }

            currRequest.Recommendation_Type = 'U';

            if (currRequest.Cm_Recommendation) {
                currRequest.Cm_Recommendation = String(currRequest.Cm_Recommendation).trim();
            }
            if (currRequest.Short_Name) {
                currRequest.Short_Name = String(currRequest.Short_Name).trim();
            }
            if (currRequest.Comment) {
                currRequest.Comment = String(currRequest.Comment).trim();
            }
            let selection_criterion = {
                Raw_Aqid: currRequest.Raw_Aqid,
                Mapped_Aqid: currRequest.Mapped_Aqid,
                Program: currRequest.Program,
                Station: currRequest.Station,
                Site: currRequest.Site,
                CM: currRequest.CM,
                GH_Site: currRequest.GH_Site,
            };
            let old_records, old_records_index, cmrecoindex;
            old_records_index = allSelectionResults.findIndex(el => findOldRecordIndex(el, selection_criterion));

            cmrecoindex = allCMRecoSelectionResults.findIndex(el => findCMrecoIndex(el, currRequest));

            if (old_records_index < 0) {
                LOG.info("No record with provided key fields exists. You cannot create a new record.");
                currError = "No record with provided key fields exists. You cannot create a new record.";
                currErrorCode = 400;
                request.req.params[i] = { "useridold": request.user.id, "selection_criterion": null, "old_records": null, "error": currError, "errorCode": currErrorCode };
                i++;
                continue;
            }
            else if (cmrecoindex < 0) {
                LOG.info("CM Manual Mapped AQID is invalid");
                currError = "CM Manual Mapped AQID is invalid";
                currErrorCode = 400;
                request.req.params[i] = { "useridold": request.user.id, "selection_criterion": null, "old_records": null, "error": currError, "errorCode": currErrorCode };
                i++;
                continue;
            }

            old_records = aqid_mapping_data(allSelectionResults[old_records_index]);
            request.req.params[i] = { "useridold": request.user.id, "selection_criterion": selection_criterion, "old_records": old_records, "error": null, "errorCode": null };
            i++;
        }
    }


    async function on_aqid_mapping_action(request) {
        const LOG = request.req.params["LOG"];
        let i = 0, allErrors = "";
        let jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        while (i < request.data.AqidData.length) {
            if (request.req.params[i]["error"]) {
                request.data.AqidData[i]["Error"] = request.req.params[i]["error"];
                allErrors = ((allErrors.includes(request.data.AqidData[i]["Error"]) && request.data.AqidData[i]["Error"]) ? allErrors : `${allErrors}|${request.data.AqidData[i]["Error"]}`);
                i++
                continue;
            }
            let selection_criterion = request.req.params[i]["selection_criterion"];
            let currRequest = request.data.AqidData[i];
            currRequest.modifiedBy_Name = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
            currRequest.modifiedBy_mail = String(jwtdetails.email);
            let tx = hdb.tx();
            try {
                await tx.run(
                    UPDATE(AQIDMapping)
                        .with(currRequest)
                        .where(selection_criterion)
                );
                await tx.commit();

            }
            catch (error) {
                tx.rollback();
                LOG.info(`Unable to update AQID Mapping table: ${error.response?.data || error.response || error.data || error}`);
                request.data.AqidData[i]["Error"] = `Unable to update AQID Mapping table`;
                allErrors = (allErrors.includes(`Unable to update AQID Mapping table`) ? allErrors : `${allErrors}|Unable to update AQID Mapping table`);
            }
            let new_records = await (SELECT.from(AQIDMapping).where(selection_criterion));
            new_records = aqid_mapping_data(new_records[0]);
            let oldRecArray = [];
            let newRecArray = [];
            oldRecArray.push(request.req.params[i]["old_records"]);
            newRecArray.push(new_records);
            update_changelog(request.req.params[i]["useridold"], oldRecArray, newRecArray, [], [], request);
            i++;
        }
        request._.res.send({
            msg: request.data.AqidData
        });



    }

    srv.on("POST", aqid_mapping_action, async (request) => {
        request.req.params["LOG"] = cds.log(getuuid(request), { label: 'aqid_mapping_action' });
        await before_aqid_mapping_action(request);
        await on_aqid_mapping_action(request);
    })

    async function generalMessageHelper(request, externalUrl, internalUrl) {
        const LOG = request.req.params["LOG"];
        let sDestinationName = "COA_APIM_EXT";
        let core = require("@sap-cloud-sdk/core");
        const xsenv = require("@sap/xsenv");

        xsenv.loadEnv();
        // let url has to be `/v1/coa/rfid-services/rfid-tt/resyncMappedAqid` for internal
        let url = externalUrl;
        try {
            let jwt = request.headers.authorization.split(' ')[1];
            if (jwt[jwt.length - 1] === `'`) jwt = jwt.slice(0, jwt.length - 1)
            await core.executeHttpRequest({ destinationName: sDestinationName, jwt: jwt },
                {
                    method: "POST",
                    url: url,
                    headers: {
                        "Content-Type": "application/json",
                        "appid": `${process.env.appid}`,
                        "authorization": request.headers.authorization,
                        "Authorization": request.headers.authorization
                    },
                    data: {}
                }
            );
        }
        catch (err) {
            LOG.info("error while asking rfid-tt-ext to resync : ", err.response?.data || err.response || err.data || err)
            sDestinationName = "COA_APIM";
            xsenv.loadEnv();
            url = internalUrl;
            try {
                let jwt = request.headers.authorization.split(' ')[1];
                if (jwt[jwt.length - 1] === `'`) jwt = jwt.slice(0, jwt.length - 1)
                await core.executeHttpRequest({ destinationName: sDestinationName, jwt: jwt },
                    {
                        method: "POST",
                        url: url,
                        headers: {
                            "Content-Type": "application/json",
                            "appid": `${process.env.appid}`,
                            "authorization": request.headers.authorization,
                            "Authorization": request.headers.authorization
                        },
                        data: {}
                    }
                );
            }
            catch (error) {
                LOG.info("error while asking rfid-tt-internal to resync : ", error.response?.data || error.response || error.data || error)
            }
        }
    }

    async function messageOtherAppsForResync(request) {
        const LOG = request.req.params["LOG"];
        LOG.info("Messaging other apps for resynv at: ", new Date())
        await generalMessageHelper(request, `/v1/ext/coa/rfid-services/rfid-tt/resyncMappedAqid`, `/v1/coa/rfid-services/rfid-tt/resyncMappedAqid`);//message rfid-tt
        await generalMessageHelper(request, `/v1/ext/coa/rfid-unscannable-service/resync_unscannable`, `/v1/coa/rfid-unscannable-service/resync_unscannable`);//message unscannable
        await generalMessageHelper(request, `/v1/ext/coa/non-rfid-tt-service/resync_nonrfid_tt`, `/v1/coa/non-rfid-tt-service/resync_nonrfid_tt`);//message nonrfid-tt
    }

    srv.after("POST", aqid_mapping_action, async (response, request) => {
        await messageOtherAppsForResync(request);
    })



    srv.on("selectAllMassUpdate", async (request) => {
        let logid = getuuid(request);
        const LOG = cds.log(logid, { label: 'selectAllMassUpdate' });
        request.req.params["LOG"] = LOG;
        LOG.info("log_id : ", logid, " | ", "in selectAllMassUpdate;");
        let filters = request.data.url;
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' != ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
        let regex = /contains\((\w+),‘(\w+)‘\)/g;
        filters = filters.replace(regex, `($1 like ‘%$2%’)`);
        regex = /substringof\('(\w+)',(\w+)\)/g;
        filters = filters.replace(regex, `($2 like '%$1%')`);
        let filterString = getFilterString(allowedAttributes[`AqidModify`], LOG);
        filters = filterString ? `(${filterString}) and ${filters}` : filters;

        let AQIDValidityCheck = await cds.run(SELECT.from("COM_APPLE_COA_T_COA_AQID_MAIN").where({
            "AQID": request.data.Cm_Recommendation
        }));
        if (AQIDValidityCheck.length <= 0) {
            LOG.info("log_id : ", logid, " | ", "Entered AQID is invalid");
            request.reject(400, `Entered AQID is invalid`);
        }
        let update_body = {};
        update_body.Cm_Recommendation = request.data.Cm_Recommendation;
        update_body.Short_Name = request.data.Short_Name;
        update_body.Comment = request.data.Comment;
        update_body.Recommendation_Type = 'U';
        update_body.modifiedBy_Name = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
        update_body.modifiedBy_mail = String(jwtdetails.email);
        let tx = hdb.tx();
        let before_update_records = await cds.run(SELECT.from(AQIDMapping).where(cds.parse.expr(filters)).orderBy({ "CM": "desc", "Site": "desc", "Program": "desc", "GH_Site": "desc", "Station": "desc", "Raw_Aqid": "desc", "Mapped_Aqid": "desc" }));
        if (before_update_records.length > 5000) {
            request.reject(400, "You cannot mass update more than 5000 records.")
        }
        try {
            await tx.run(UPDATE(AQIDMapping).with(update_body).where(cds.parse.expr(filters)))
            await tx.commit();
            let after_update_records = await cds.run(SELECT.from(AQIDMapping).where(cds.parse.expr(filters)).orderBy({ "CM": "desc", "Site": "desc", "Program": "desc", "GH_Site": "desc", "Station": "desc", "Raw_Aqid": "desc", "Mapped_Aqid": "desc" }));
            let old_update_arr = [];
            let new_update_arr = [];
            let j = 0;
            for (; j < before_update_records.length && j < after_update_records.length; j++) {
                old_update_arr.push(aqid_mapping_data(before_update_records[j]));
                new_update_arr.push(aqid_mapping_data(after_update_records[j]));
            }
            update_changelog(request.user.id, old_update_arr, new_update_arr, [], [], request);
            await messageOtherAppsForResync(request);
        }
        catch (error) {
            await tx.rollback();
            LOG.info("log_id : ", logid, " | ", "Unable to update with new values in database: ", error);
        }
    })

    function getallowedAttributes(jwtdetails, request) {
        const RoleNames = jwtdetails['xs.system.attributes'];
        const LOG = request.req.params["LOG"];
        let usrScope = [];
        for (let scope of jwtdetails.scope) {
            usrScope.push(scope.split('.')[1]);
        }
        let ScopesRelevantToThisApp = [`AqidModify`, `AqidReadOnly`]
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

        addToAllowedAttributes(ScopesRelevantToThisApp, RoleNames, allowedAttributes, srvCred, usrScope);
        return allowedAttributes;
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

    function augmentArray(obj, arr) {
        let i;
        for (i = 0; i < arr.length; i++)augment(obj, arr[i]);
    }

    function augment(obj, term) {
        if (obj[term] === undefined) obj[term] = term;
    }

    function merge(obj1, obj2) {
        return ({ ...obj1, ...obj2 });
    }


    function getFilterString(obj, LOG) {
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
            LOG.info("str: ", str);
            return str;
        }
        else {
            return (`(CM='NULL' and SITE='NULL')`);
        }
    }

    function AuthorizationCheck(record, allowed_cmsite) {
        let return_value = true;
        if (Object.keys(allowed_cmsite).length !== 0) {
            return_value = (allowed_cmsite[`${record.CM}-${record.Site}`] !== undefined || allowed_cmsite[`$unrestricted-${record.Site}`] !== undefined ||
                allowed_cmsite[`${record.CM}-$unrestricted}`] !== undefined || allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? false : true;
        }
        return return_value;
    }

});

