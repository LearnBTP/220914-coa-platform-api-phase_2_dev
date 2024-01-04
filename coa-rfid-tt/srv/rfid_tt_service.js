const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");

module.exports = cds.service.impl(async (srv) => {
    const
        {
            rfid_tt_action,
            RFIDDetails
        } = srv.entities;
    let hdb = await cds.connect.to("db");
    let glb_auth;

    async function update_changelog(userid, changes, request, LOG) {
        LOG.info(`Call Changelog service to update the changes to Changelog table`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        const core = require("@sap-cloud-sdk/core");
        const xsenv = require("@sap/xsenv");
        xsenv.loadEnv();
        const sDestinationName = "COA_APIM_CC";
        let results = [];
        let result = {};
        let rfidTTupdatesOld = [];
        let rfidTTupdatesNew = [];
        let rfidTTinsertsOld = [];
        let rfidTTinsertsNew = [];
        let outputUpdatesNew = [];
        let outputUpdatesOld = [];
        let outputInsertsNew = [];
        let outputInsertsOld = [];
        let i = 0
        for (; i < changes.length; i++) {
            if (changes[i]["table_name"] === "T_COA_RFID_TT" && changes[i]["action"] === "INSERT") {
                rfidTTinsertsOld.push(changes[i]["old"]);
                rfidTTinsertsNew.push(changes[i]["new"]);
            }
            else if (changes[i]["table_name"] === "T_COA_RFID_TT" && changes[i]["action"] === "UPDATE") {
                rfidTTupdatesOld.push(changes[i]["old"]);
                rfidTTupdatesNew.push(changes[i]["new"]);
            }
            else if (changes[i]["table_name"] === "T_COA_OUTPUT" && changes[i]["action"] === "INSERT") {
                outputInsertsOld.push(changes[i]["old"]);
                outputInsertsNew.push(changes[i]["new"]);
            }
            else if (changes[i]["table_name"] === "T_COA_OUTPUT" && changes[i]["action"] === "UPDATE") {
                outputUpdatesOld.push(changes[i]["old"]);
                outputUpdatesNew.push(changes[i]["new"]);
            }
        }
        if (rfidTTinsertsOld.length > 0) {
            result = {};
            result.TableName = "T_COA_RFID_TT";
            result.old_records = rfidTTinsertsOld;
            result.new_records = rfidTTinsertsNew;
            result.actionType = "INSERT";
            result.user_data = {};
            result.user_data.user = userid;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            results.push(result);
        }
        if (rfidTTupdatesOld.length > 0) {
            result = {};
            result.TableName = "T_COA_RFID_TT";
            result.old_records = rfidTTupdatesOld;
            result.new_records = rfidTTupdatesNew;
            result.actionType = "UPDATE";
            result.user_data = {};
            result.user_data.user = userid;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            results.push(result);
        }
        if (outputInsertsOld.length > 0) {
            result = {};
            result.TableName = "T_COA_OUTPUT";
            result.old_records = outputInsertsOld;
            result.new_records = outputInsertsNew;
            result.actionType = "INSERT";
            result.user_data = {};
            result.user_data.user = userid;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            results.push(result);
        }
        if (outputUpdatesOld.length > 0) {
            result = {};
            result.TableName = "T_COA_OUTPUT";
            result.old_records = outputUpdatesOld;
            result.new_records = outputUpdatesNew;
            result.actionType = "UPDATE";
            result.user_data = {};
            result.user_data.user = userid;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            results.push(result);
        }
        let requestData = { "body": JSON.stringify(results) };
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

    function getFirstDefn(...args) {
        let final = args[0]
        let i = 1;
        for (; i < args.length; i++) {
            final = final || args[i]
        }
        return final
    }

    function rfid_tt_data(request) {
        let record = [];
        if (request) {
            record.push(0);
            record.push("");
            record.push(0);
            record.push("");
            record.push(parseFloat(getFirstDefn(request.ASSET_ID, request.ALDERAN, 0)));
            record.push(getFirstDefn(request.MAPPED_AQID, request.TABLE_MAPPED_AQID, ""));
            record.push(request.AQID);
            record.push(request.CM);
            record.push(request.SITE);
            record.push(request.CM_PROGRAM);
            record.push(request.RFID);
            record.push(request.LINE_ID);
            record.push(request.UPH);
            record.push(request.VERSION);
            record.push(request.SERIAL_NUMBER);
            record.push(request.LINE_TYPE);
            record.push(request.TRANSFER_FLAG);
            record.push(request.TO_CM);
            record.push(request.TO_SITE);
            record.push(request.TO_PROGRAM);
            record.push(request.TP_BUSINESS_GRP);
            record.push(request.TO_BUSINESS_GRP);
            record.push(request.COMMENTS);
            record.push(request.APPROVAL_STATUS);
            record.push(request.SUBMIT_DTE);
            record.push(request.SUBMIT_BY);
            record.push(request.REVIEW_DATE);
            record.push(request.REVIEWED_BY);
            record.push(request.SAP_CM_SITE);
            record.push(request.SAP_TO_CM_SITE);
            record.push(request.TO_GHSITE);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.SUBMIT_BY_NAME);
            record.push(request.SUBMIT_BY_MAIL);
            record.push(request.REVIEWED_BY_NAME);
            record.push(request.REVIEWED_BY_MAIL);
            record.push("");
            record.push("");
            record.push("");
            record.push(getFirstDefn(request.RESET_FLAG, ""));
        }
        else {
            record.push(0);
            record.push("");
            record.push(0);
            record.push("");
            record.push(0);//
            record.push("");//
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
        }
        return record;
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

    function updateChanges(to_add, validation, changes) {
        let new_records = rfid_tt_data(to_add);
        let old_records;
        if (validation.length <= 0) {
            old_records = rfid_tt_data(false);
            changes.push(
                {
                    "table_name": "T_COA_RFID_TT",
                    "old": old_records,
                    "new": new_records,
                    "action": "INSERT"
                }
            )
        }
        else {
            old_records = rfid_tt_data(validation[0])
            changes.push(
                {
                    "table_name": "T_COA_RFID_TT",
                    "old": old_records,
                    "new": new_records,
                    "action": "UPDATE"
                }
            )
        }

    }

    function updateChangesOutput(to_add_output, old_output, changes) {
        let new_records = output_data(to_add_output);
        let old_records;
        if (old_output.length <= 0) {
            old_records = output_data(false);
            changes.push(
                {
                    "table_name": "T_COA_OUTPUT",
                    "old": old_records,
                    "new": new_records,
                    "action": "INSERT"
                }
            )
        }
        else {
            old_records = output_data(old_output[0])
            changes.push(
                {
                    "table_name": "T_COA_OUTPUT",
                    "old": old_records,
                    "new": new_records,
                    "action": "UPDATE"
                }
            )
        }
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
        let emptyString = `''`;
        if (change.toLowerCase().trim() === 'alderan') emptyString = 0;
        if (whereclause) {
            whereclause = `(${whereclause}) and (${change} is not null) and (${change}<>${emptyString})`;
            let parsedFilters = cds.parse.expr(`(${whereclause})`);
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${field}`).where(parsedFilters).limit(top, skip)
            );
        } else {
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${field}`).where(`(${change} is not null) and not(${change}=${emptyString})`).limit(top, skip)
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
        allowedAttributes['RfidOnHandTTReadOnly'] = merge(allowedAttributes['RfidOnHandTTReadOnly'], allowedAttributes['RfidOnHandTTModify'], allowedAttributes['ApproveRfidOnHandTT']);
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        if (top) {
            top = top.includes("infinity") ? 1000 : top;
        }
        let header = { "top": top, "skip": skip, "change": change, "LOG": request.req.params["LOG"] };
        result_array = await fetchdata(allowedAttributes['RfidOnHandTTReadOnly'], change, search, RFIDDetails, header);
        return result_array;
    }

    function getuuid(request) {
        return (request && request?.headers['x-correlationid']) ? request.headers['x-correlationid'] : cds.utils.uuid();
    }

    function getToDel(curr) {
        return ({
            ASSET_ID: String(curr.Asset_Id)
        });
    }

    function getBlankStringIfUndefinedOrNull(arg) {
        return (arg || '')
    }

    function fillMultimap(map1, allSelectionResults, keyArray) {
        let itt = 0;
        for (; itt < allSelectionResults.length; itt++) {
            let tempKeyArr = [];
            let i = 0;
            for (; i < keyArray.length; i++) {
                tempKeyArr.push(allSelectionResults[itt][keyArray[i]])
            }
            fillMultilevel(map1, tempKeyArr, allSelectionResults[itt])
        }

    }

    function fillMultilevel(map1, arr, val) {
        let i = 0;
        let tillPrev = map1;
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

    function getMultiLevelValue(map1, arr) {
        let i = 0;
        let tillPrev = map1;
        for (; i < arr.length; i++) {
            if (tillPrev[arr[i]] === undefined) {
                return tillPrev[arr[i]]
            }
            tillPrev = tillPrev[arr[i]]
        }
        return tillPrev;
    }

    function getToAdd(curr, validation, userid, jwtdetails, V_RFIDDetails_Table_map) {
        let localDate = new Date().toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, "$3-$1-$2T$4:$5:$6.000Z");
        let selectRecordFromRFIDDetails = getToDel(curr);
        let tsIndexVal = getMultiLevelValue(V_RFIDDetails_Table_map, [selectRecordFromRFIDDetails['ASSET_ID']]);
        let retToAdd = {
            AQID: getBlankStringIfUndefinedOrNull(tsIndexVal.AQID),
            CM: getBlankStringIfUndefinedOrNull(tsIndexVal.CM),
            SITE: getBlankStringIfUndefinedOrNull(tsIndexVal.SITE),
            ASSET_ID: String(curr.Asset_Id),
            CM_PROGRAM: getBlankStringIfUndefinedOrNull((validation.length > 0) ? validation[0].CM_PROGRAM : ""),
            RFID: getBlankStringIfUndefinedOrNull(tsIndexVal.RFID),
            LINE_ID: getBlankStringIfUndefinedOrNull(tsIndexVal.LINEID),
            UPH: parseInt(tsIndexVal.UPH) ? parseInt(tsIndexVal.UPH) : 0,
            VERSION: getBlankStringIfUndefinedOrNull(tsIndexVal.VERSION_ID),
            SERIAL_NUMBER: (tsIndexVal.SERNR),
            LINE_TYPE: (tsIndexVal.LINETYPE),
            TRANSFER_FLAG: getBlankStringIfUndefinedOrNull(getFirstDefn(curr.Transfer_Flag, tsIndexVal.TRANSFER_FLAG)),
            TO_CM: curr.To_CM,
            TO_SITE: curr.To_Site,
            TO_PROGRAM: curr.To_Program,
            TP_BUSINESS_GRP: curr.To_Business_Grp,
            COMMENTS: curr.Comments,
            APPROVAL_STATUS: curr.Approval_Status,
            SUBMIT_DTE: (validation.length > 0) ? validation[0].SUBMIT_DTE : String(localDate),
            SUBMIT_BY: (validation.length > 0) ? validation[0].SUBMIT_BY : String(userid),
            SUBMIT_BY_NAME: (validation.length > 0) ? validation[0].SUBMIT_BY_NAME : String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            SUBMIT_BY_MAIL: (validation.length > 0) ? validation[0].SUBMIT_BY_MAIL : String(jwtdetails.email),
            REVIEW_DATE: (validation.length === 0) ? null : String(localDate),
            REVIEWED_BY: (validation.length === 0) ? null : String(userid),
            REVIEWED_BY_NAME: (validation.length === 0) ? null : String(String(`${jwtdetails.given_name} ${jwtdetails.family_name}`)),
            REVIEWED_BY_MAIL: (validation.length === 0) ? null : String(jwtdetails.email),
            CREATEDAT: (validation.length > 0) ? validation[0].CREATEDAT : String(new Date().toISOString()),
            CREATEDBY: (validation.length > 0) ? validation[0].CREATEDBY : String(userid),
            CREATEDBY_NAME: (validation.length > 0) ? validation[0].CREATEDBY_NAME : String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            CREATEDBY_MAIL: (validation.length > 0) ? validation[0].CREATEDBY_MAIL : String(jwtdetails.email),
            MODIFIEDAT: String(new Date().toISOString()),
            MODIFIEDBY: String(userid),
            MODIFIEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            MODIFIEDBY_MAIL: String(jwtdetails.email),
            SAP_CM_SITE: `${(tsIndexVal.CM)}-${(tsIndexVal.SITE)}`,
            SAP_TO_CM_SITE: `${getBlankStringIfUndefinedOrNull(curr.To_CM)}-${getBlankStringIfUndefinedOrNull(curr.To_Site)}`,
            TO_GHSITE: getBlankStringIfUndefinedOrNull(curr.To_GHSite),
            SITE_TABLE_UPDATE_TS: getBlankStringIfUndefinedOrNull(tsIndexVal.SITE_LATEST_UPDATE_TS),
            AREA_TABLE_UPDATE_TS: getBlankStringIfUndefinedOrNull(tsIndexVal.AREA_LATEST_UPDATE_TS),
            TABLE_UPDATE_TS: getBlankStringIfUndefinedOrNull(tsIndexVal.LATEST_UPDATE_TS),
            MAPPED_AQID: getBlankStringIfUndefinedOrNull(tsIndexVal.MAPPED_AQID)
        };
        if (curr.Transfer_Flag === '') retToAdd.TRANSFER_FLAG = "";
        retToAdd = fill_name_mail_flag(validation, curr, localDate, userid, jwtdetails, retToAdd)
        return (retToAdd);
    }

    function fill_name_mail_flag(validation, curr, localDate, userid, jwtdetails, retToAdd) {
        if (validation.length > 0 && curr.Approval_Status.toLowerCase() === "pending") {
            retToAdd.SUBMIT_DTE = String(localDate);
            retToAdd.SUBMIT_BY = String(userid);
            retToAdd.SUBMIT_BY_NAME = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
            retToAdd.SUBMIT_BY_MAIL = String(jwtdetails.email);
            retToAdd.REVIEW_DATE = null;
            retToAdd.REVIEWED_BY = null;
            retToAdd.REVIEWED_BY_NAME = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
            retToAdd.REVIEWED_BY_MAIL = String(jwtdetails.email);
        }
        if (curr.Reset_Flag && String(curr.Reset_Flag).length > 0 && curr.Approval_Status.toLowerCase() === "pending") {
            retToAdd.RESET_FLAG = String(curr.Reset_Flag);
        }
        if (curr.Approval_Status.toLowerCase() === "approved") {
            retToAdd.RESET_FLAG = null;
        }
        return retToAdd;
    }

    function validate(validation, log_id, status, errorMsgQueue, LOG, request) {
        if (request.req?.params?.isThisCancel === undefined) {
            if (status !== "rejected" && status !== "pending" && status !== "approved") {
                LOG.info("log_id : ", log_id, " | ", "Attempt to set Invalid  Approval Status. You are trying to set: ", status);
                errorMsgQueue.push("Attempt to set Invalid  Approval Status");
                return true;
            }
            let toPut = (status === "pending") ? "rejected" : status;
            if ((status === "pending" && validation.length <= 0) || (status === "pending" && validation.length > 0 && validation[0]?.APPROVAL_STATUS.toLowerCase() === "approved")) {
                errorMsgQueue.push("");
                return false;
            }
            if (!(validation.length > 0 && (validation[0]?.APPROVAL_STATUS.toLowerCase() === toPut || validation[0]?.APPROVAL_STATUS.toLowerCase() === "pending"))) {
                LOG.info("log_id : ", log_id, " | ", "Unsupported status change. Status can be changed to ", status, " only from ", toPut, "/pending");
                errorMsgQueue.push("Unsupported status change. Status can be changed to " + String(status) + " only from " + String(toPut) + "/pending");
                return true;
            }
        }
        errorMsgQueue.push("");
        return false;
    }

    async function deleteInChunk(delQueue, deleteDestination, tx) {
        let chunkSize = 1000;
        let k = 0;
        for (; k < delQueue.length; k += chunkSize) {
            let deleteChunk = delQueue.slice(k, k + chunkSize);
            let delQ = changeObjArrayToQuery(deleteChunk);
            await tx.run(DELETE.from(deleteDestination).where(delQ));
        }
    }

    async function deleteInChunkIgnoringFilledCoType(delQueue, deleteDestination, tx) {
        let chunkSize = 1000;
        let k = 0;
        for (; k < delQueue.length; k += chunkSize) {
            let deleteChunk = delQueue.slice(k, k + chunkSize);
            let delQ = changeObjArrayToQuery(deleteChunk);
            await tx.run(DELETE.from(deleteDestination).where(`(${delQ}) and CO_TYPE=''`));
        }
    }


    async function pushToDB(global_to_del, global_to_add, global_to_del_output, global_to_add_output, errorMsgQueue, changes, arg) {
        const LOG = arg.LOG;
        let log_id = arg["log_id"];
        let userid = arg["userid"];
        let updateCMBalanceSelectionKeys = arg.updateCMBalanceSelectionKeys;
        let jwtdetails = arg.jwtdetails;
        let request = arg.request;
        LOG.info("inside pushToDB at ", new Date());
        LOG.info("len of global_to_add = ", global_to_add.length);
        LOG.info("len of global_to_del = ", global_to_del.length);
        let tx = hdb.tx();

        try {
            if (global_to_del.length > 0) {
                LOG.info("trying to delete from rfid-tt at ", new Date());
                await deleteInChunk(global_to_del, "COM_APPLE_COA_T_COA_RFID_TT", tx)
            }
            if (global_to_add.length > 0) {
                LOG.info("trying to add to rfid-tt at ", new Date());
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_RFID_TT").entries(global_to_add));
            }
            if (global_to_del_output.length > 0) {
                LOG.info("trying to delete from co-output at ", new Date());
                await deleteInChunkIgnoringFilledCoType(global_to_del_output, "COM_APPLE_COA_T_COA_OUTPUT", tx)
            }
            if (global_to_add_output.length > 0) {
                LOG.info("trying to add to co-output at ", new Date());
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_OUTPUT").entries(global_to_add_output));
            }
            if (updateCMBalanceSelectionKeys.length > 0) {
                LOG.info("trying to update cm_balance_qty at ", new Date());
                let chunkSize = 1000;
                for (let k = 0; k < updateCMBalanceSelectionKeys.length; k += chunkSize) {
                    let updChunk = updateCMBalanceSelectionKeys.slice(k, k + chunkSize);
                    let updq = changeObjArrayToQuery(updChunk);
                    await tx.run(UPDATE("COM_APPLE_COA_T_COA_OUTPUT").with({ CM_BALANCE_QTY: 0, COMMENT: "Quantity Reset", MODIFIEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`), MODIFIEDBY_MAIL: String(jwtdetails.email) }).where(`${updq} and co_type=''`))
                }
            }
            LOG.info("trying to commit at ", new Date());
            await tx.commit();
            await resyncCOCount(LOG);
            try {
                LOG.info("messaging changelog at ", new Date());
                update_changelog(userid, changes, request, LOG);
            }
            catch (error) {
                LOG.info("Error while contacting changelog: ", error);
            }
            LOG.info("log_id : ", log_id, " | ", "Done pushing changes to db at ", new Date());
        }
        catch (err) {
            await tx.rollback();
            LOG.info("log_id : ", log_id, " | ", "error while inserting data into rfid_tt table: ", err);
            let i = 0;
            for (; i < errorMsgQueue.length; i++) {
                if (errorMsgQueue[i] === "") {
                    errorMsgQueue[i] = "error while inserting data into rfid_tt table";
                }
            }
        }
    }

    async function resyncGhSiteInCoCount(LOG) {
        let tx2 = hdb.tx();
        try {
            LOG.info("in resyncCOCount correct gh_site at ", new Date());
            await tx2.run(`
                UPDATE  COM_APPLE_COA_T_COA_OUTPUT as ttt1
                SET ttt1.from_ghsite =
                (SELECT tt2.gh_site as from_ghsite from (SELECT tt1.cm,
                    tt1.site,
                    tt1.gh_site,
                    tt1.priority_order,
                    Row_Number() over(partition by tt1.cm,tt1.site order by tt1.priority_order asc) 
                            as rn
                    from (SELECT DISTINCT 
                    cm,
                    site,
                    gh_site,
                    CASE
                        WHEN (locate( gh_site, 'iPhone' ) > 0 AND locate( gh_site, 'iPhone' ) IS NOT NULL) THEN 1
                        WHEN (locate( gh_site, 'iPad' ) > 0 AND locate( gh_site, 'iPad' ) IS NOT NULL) THEN 2
                        ELSE 3
                    END AS priority_order
                FROM  COM_APPLE_COA_T_COA_LINE_SUMMARY
                WHERE cm != ''
                    AND site != '') as tt1) as tt2 where tt2.rn=1 and tt2.cm=ttt1.from_cm and tt2.site=ttt1.from_site)
            `);
            await tx2.commit();
            LOG.info("in resyncCOCount correct gh_site done at ", new Date());
        }
        catch (err) {
            await tx2.rollback()
            LOG.info("There was error updating from_ghsite");
        }
    }

    async function resyncCoCountWhereEntriesNeedInsertionToOutput(LOG) {
        LOG.info("in resyncCoCountWhereEntriesNeedInsertionToOutput at ", new Date());
        let updateCMBalanceSelectionKeys = [];
        let chk = await cds.run(`SELECT * FROM V_RFIDVIEW_OUTPUT_DIFF where outputcount is null and rfidviewcount is not null and rfidviewcount>0`)
        if (chk.length > 0) {
            let tx = hdb.tx();
            try {
                await tx.run(`
                INSERT INTO COM_APPLE_COA_T_COA_OUTPUT (
                    CREATEDAT,
                    CREATEDBY,
                    MODIFIEDAT,
                    MODIFIEDBY,
                    FROM_CM,
                    FROM_SITE,
                    FROM_PRODUCT,
                    AQID,
                    TO_CM,
                    TO_SITE,
                    TO_PRODUCT,
                    CO_TYPE,
                    FROM_GHSITE,
                    TO_GHSITE,
                    FROM_BUSINESS_GRP,
                    TO_BUSINESS_GRP,
                    EQ_NAME,
                    MFR,
                    QUANTITY,
                    CM_BALANCE_QTY,
                    COMMENT,
                    SAP_CM_SITE,
                    SAP_TO_CM_SITE,
                    MODIFIEDBY_NAME,
                    MODIFIEDBY_MAIL,
                    CREATEDBY_NAME,
                    CREATEDBY_MAIL
                )
                SELECT 
                tt1.CREATEDAT as CREATEDAT,
                tt1.createdBy_mail as CREATEDBY,
                tt1.MODIFIEDAT as MODIFIEDAT,
                tt1.MODIFIEDBY as MODIFIEDBY,
                tt1.table_cm as FROM_CM,
                tt1.table_site as 	FROM_SITE,
                tt1.carryoveroldprogram as FROM_PRODUCT,
                tt1.table_mapped_aqid as AQID,
                tt1.to_cm as TO_CM,
                tt1.to_site as TO_SITE,
                tt1.to_program as TO_PRODUCT,
                '' as CO_TYPE,
                tt1.ZALDR_SITE as FROM_GHSITE,
                tt1.TO_GHSITE as TO_GHSITE,
                '' as FROM_BUSINESS_GRP,
                tt1.TP_BUSINESS_GRP as TO_BUSINESS_GRP,
                tt1.EQUIPMENT_NAME as EQ_NAME,
                tt1.MFR as MFR,
                tt1.rn_asc as QUANTITY,
                0 as CM_BALANCE_QTY,
                'Quantity Reset' as COMMENT,
                tt1.SAP_CM_SITE as SAP_CM_SITE,
                tt1.SAP_TO_CM_SITE as SAP_TO_CM_SITE,
                tt1.MODIFIEDBY_NAME as MODIFIEDBY_NAME,
                tt1.MODIFIEDBY_MAIL as MODIFIEDBY_MAIL,
                tt1.CREATEDBY_NAME as CREATEDBY_NAME,
                tt1.CREATEDBY_MAIL as CREATEDBY_MAIL
                from (SELECT t1.*,
                    Row_Number() over(partition by t1.table_cm,
                    t1.table_site,
                    t1.to_cm,
                    t1.to_site,
                    t1.table_mapped_aqid,
                    t1.carryoveroldprogram,
                    t1.to_program
                    order by t1.ModifiedAt desc) as rn_desc,
                    Row_Number() over(partition by t1.table_cm,
                    t1.table_site,
                    t1.to_cm,
                    t1.to_site,
                    t1.table_mapped_aqid,
                    t1.carryoveroldprogram,
                    t1.to_program
                    order by t1.ModifiedAt asc) as rn_asc
                    FROM V_RFIDDETAILS AS t1
                    INNER JOIN V_RFIDVIEW_OUTPUT_DIFF as t2
                    ON t1.table_cm = t2.from_cm
                        AND t1.table_site = t2.from_site
                        AND t1.to_cm = t2.to_cm
                        AND t1.to_site = t2.to_site
                        AND t1.table_mapped_aqid = t2.mapped_aqid
                        AND t1.carryoveroldprogram = t2.from_program
                        AND t1.to_program = t2.to_program
                        WHERE t1.approval_status = 'Approved'
                        and t2.outputcount is null
                        and t2.rfidviewcount is not null
                        and t2.rfidviewcount>0) as tt1
                        where tt1.rn_desc=1
                `);
                LOG.info("inserted unavailable entries into co_output at ", new Date());
                await chk.map(el => convertKeysToUpperCase(el))

                await chk.forEach((el) => pushToUpdateCMBalanceSelectionKey(el, updateCMBalanceSelectionKeys))


                if (updateCMBalanceSelectionKeys.length > 0) {
                    LOG.info("trying to update cm_balance_qty at ", new Date());
                    let chunkSize = 5000;
                    for (let k = 0; k < updateCMBalanceSelectionKeys.length; k += chunkSize) {
                        let updChunk = updateCMBalanceSelectionKeys.slice(k, k + chunkSize);
                        let updq = changeObjArrayToQuery(updChunk);
                        await tx.run(UPDATE("COM_APPLE_COA_T_COA_OUTPUT").with({ CM_BALANCE_QTY: 0, COMMENT: "Quantity Reset", STATUS: "Pending" }).where(`(${updq}) and (status='Approved' or status='Pending' or status='Rejected') and co_type=''`))
                        await tx.run(UPDATE("COM_APPLE_COA_T_COA_OUTPUT").with({ CM_BALANCE_QTY: 0, COMMENT: "Quantity Reset", STATUS: "" }).where(`(${updq}) and status='' and co_type=''`))
                    }
                }
                LOG.info("in resyncCoCountWhereEntriesNeedInsertionToOutput cm_balance_update done at ", new Date());
                await tx.commit();
                LOG.info("Set co_output count correct at all places from resyncCoCountWhereEntriesNeedInsertionToOutput at ", new Date());
            }
            catch (err) {
                await tx.rollback();
                LOG.info("Failed to set co_output count correct at all places")
            }
        }
    }

    function convertKeysToUpperCase(el) {
        Object.keys(el).forEach(key => {
            if (key !== key.toUpperCase()) el[`${key.toUpperCase()}`] = el.key;
        })
        return el;
    }

    function pushToUpdateCMBalanceSelectionKey(el, updateCMBalanceSelectionKeys) {
        updateCMBalanceSelectionKeys.push({
            FROM_CM: String(el.FROM_CM),
            FROM_SITE: String(el.FROM_SITE),
            FROM_PRODUCT: String(el.FROM_PROGRAM),  /////
            AQID: String(el.MAPPED_AQID)
        });

    }

    async function resyncCOCount(LOG) {
        LOG.info("in resyncCOCount at ", new Date());
        await resyncCoCountWhereEntriesNeedInsertionToOutput(LOG);
        let updateCMBalanceSelectionKeys = [];
        let chk = await cds.run(`SELECT * FROM V_RFIDVIEW_OUTPUT_DIFF`)
        LOG.info("in resyncCOCount select done at at ", new Date());
        if (chk.length > 0) {
            let tx = hdb.tx();
            try {
                await tx.run(`
                    DELETE FROM COM_APPLE_COA_T_COA_OUTPUT as t2
                    WHERE EXISTS
                    (
                        SELECT * FROM V_RFIDVIEW_OUTPUT_DIFF as t3
                        where t3.from_cm=t2.from_cm and t3.from_site=t2.from_site 
                        and t3.to_cm=t2.to_cm and t3.to_site=t2.to_site
                        and t3.from_program=t2.from_product and t3.to_program=t2.to_product
                        and t3.mapped_aqid=t2.aqid
                    )
                    and (t2.aqid is null or t2.aqid='') and t2.co_type=''
                `)
                LOG.info("in resyncCOCount delete done at ", new Date());
                await tx.run(`
                UPDATE COM_APPLE_COA_T_COA_OUTPUT as t2
                SET QUANTITY = 
                (SELECT RFIDVIEWCOUNT as quantity
                FROM V_RFIDVIEW_OUTPUT_DIFF as t1
                where t1.from_cm=t2.from_cm and t1.from_site=t2.from_site 
                and t1.to_cm=t2.to_cm and t1.to_site=t2.to_site
                and t1.from_program=t2.from_product and t1.to_program=t2.to_product
                and t1.mapped_aqid=t2.aqid
                )
                WHERE
                EXISTS
                (
                    SELECT * FROM V_RFIDVIEW_OUTPUT_DIFF as t3
                    where t3.from_cm=t2.from_cm and t3.from_site=t2.from_site 
                    and t3.to_cm=t2.to_cm and t3.to_site=t2.to_site
                    and t3.from_program=t2.from_product and t3.to_program=t2.to_product
                    and t3.mapped_aqid=t2.aqid
                ) and t2.co_type=''
                `);
                LOG.info("in resyncCOCount count update done at ", new Date());
                await chk.map(el => convertKeysToUpperCase(el))

                LOG.info("in resyncCOCount cm_balance_update done at ", new Date());

                await chk.forEach((el) => pushToUpdateCMBalanceSelectionKey(el, updateCMBalanceSelectionKeys))


                if (updateCMBalanceSelectionKeys.length > 0) {
                    LOG.info("trying to update cm_balance_qty at ", new Date());
                    let chunkSize = 5000;
                    for (let k = 0; k < updateCMBalanceSelectionKeys.length; k += chunkSize) {
                        let updChunk = updateCMBalanceSelectionKeys.slice(k, k + chunkSize);
                        let updq = changeObjArrayToQuery(updChunk);
                        await tx.run(UPDATE("COM_APPLE_COA_T_COA_OUTPUT").with({ CM_BALANCE_QTY: 0, COMMENT: "Quantity Reset", STATUS: "Pending" }).where(`(${updq}) and (status='Approved' or status='Pending' or status='Rejected') and co_type=''`))
                        await tx.run(UPDATE("COM_APPLE_COA_T_COA_OUTPUT").with({ CM_BALANCE_QTY: 0, COMMENT: "Quantity Reset", STATUS: "" }).where(`(${updq}) and status='' and co_type=''`))
                    }
                }
                LOG.info("in resyncCOCount cm_balance_update done at ", new Date());
                await tx.commit();
                LOG.info("Set co_output count correct at all places")
            }
            catch (err) {
                await tx.rollback();
                LOG.info("Failed to set co_output count correct at all places")
            }
        }

        resyncGhSiteInCoCount(LOG);

    }

    function checkForClear(curr) {
        return (curr.To_CM === "" && curr.To_Site === "" && curr.To_Program === "") ? true : false;
    }

    function checkFunctionalLocation(curr) {
        return (!curr.To_CM && !curr.To_Site);
    }

    function checkToProgram(curr) {
        return (!curr.To_Program || String(curr.To_Program).trim() === '');
    }

    function findIndexinBOMCMSiteTable2(el, curr, v_rfid_rec) {
        if (el.CM === String(v_rfid_rec.CM) && el.SITE === String(v_rfid_rec.SITE)) {
            return true;
        }
        return false;
    }

    function findToIndexinBOMCMSiteTable(el, curr) {
        if (el.CM === curr.To_CM && el.SITE === curr.To_Site) {
            return true;
        }
        return false;
    }

    function findIndexInBOMProgramTable(el, curr) {
        if (el.PROGRAM === curr.To_Program) {
            return true;
        }
        return false;
    }



    function checkForClearAssociatedFunctionalities(allowed_cmsite, curr, log_id, errorMsgQueue, validation, jwtdetails, request) {
        let result_param = check_cmsite(allowed_cmsite, curr, log_id, errorMsgQueue, validation, jwtdetails, request);

        if (result_param.msg) {
            return result_param.msg;
        }
        errorMsgQueue.push("");
        return ('clear');
    }

    function checkTransferFlag(curr) {
        if (curr.Transfer_Flag === '') {
            return false;
        }
        if (curr.Transfer_Flag) {
            curr.Transfer_Flag = curr.Transfer_Flag.toUpperCase();
            if (curr.Transfer_Flag === 'Y' || curr.Transfer_Flag === 'N') {
                return false;
            }
            return true;
        }
        return false;
    }

    function checkIfRecordCanBeReset(validation) {
        return (validation.length <= 0 || validation[0].APPROVAL_STATUS?.toLowerCase().trim() !== "approved")
    }

    function addClearToReqParams(request) {
        if (request.req === undefined) request.req = {};
        if (request.req.params === undefined) request.req.params = {};
        request.req.params.isThisCancel = true;
    }

    async function getApprovalStatus(request, getApprovalStatusArgObj, log_id, errorMsgQueue, validation, BOM_CM_Site_Table, BOM_Program_Table) {
        const LOG = request.req.params["LOG"];
        let allowedAttributes;
        let allowed_cmsite = [];
        let V_RFIDDetails_Table_map = getApprovalStatusArgObj.V_RFIDDetails_Table_map
        let jwtdetails = getApprovalStatusArgObj.jwtdetails
        let curr = getApprovalStatusArgObj.curr
        let selectRecordFromRFIDDetails = getToDel(curr);
        let tsIndexVal = getMultiLevelValue(V_RFIDDetails_Table_map, [selectRecordFromRFIDDetails['ASSET_ID']]);
        if (tsIndexVal === undefined) {
            LOG.info("log_id:", log_id, " | Cannot find asset_id in rfid-tt view");
            errorMsgQueue.push("Invalid Function Location");
            return ('invalid');
        }
        allowedAttributes = getApprovalStatusArgObj.allowedAttributes;
        if (curr.Approval_Status.toLowerCase() === 'approved') {
            allowed_cmsite = allowedAttributes.ApproveRfidOnHandTT;
        } else {
            allowed_cmsite = allowedAttributes.RfidOnHandTTModify;
        }
        let validationCMSite, validationProgram;
        validationCMSite = BOM_CM_Site_Table.findIndex(el => findToIndexinBOMCMSiteTable(el, curr))

        if (checkForClear(curr)) {
            addClearToReqParams(request);
            return checkForClearAssociatedFunctionalities(allowed_cmsite, curr, log_id, errorMsgQueue, validation, jwtdetails, request);
        }
        else if (curr.Approval_Status.toLowerCase().trim() === "reset") {
            if (checkIfRecordCanBeReset(validation)) {
                LOG.info("log_id:", log_id, " | Only approved records can be reset");
                errorMsgQueue.push("Only approved records can be reset");
                return ('invalid');
            }
            curr.Approval_Status = "Pending";
        }
        else if (checkFunctionalLocation(curr)) {
            LOG.info("log_id:", log_id, " | Invalid Function Location");
            errorMsgQueue.push("Invalid Function Location");
            return ('invalid');
        }
        else if (validationCMSite < 0) {
            LOG.info("log_id:", log_id, " | Invalid CM-Site combination in To CM- To Site");
            errorMsgQueue.push("Invalid CM-Site combination in To CM- To Site");
            return ('invalid');
        }
        else if (checkTransferFlag(curr)) {
            LOG.info("log_id:", log_id, " | Transfer flag can only be Y or N");
            errorMsgQueue.push("Transfer flag can only be Y or N");
            return ('invalid');
        }

        validationCMSite = BOM_CM_Site_Table.findIndex(el => findIndexinBOMCMSiteTable2(el, curr, tsIndexVal))
        if (validationCMSite < 0) {
            LOG.info("log_id:", log_id, " | Invalid CM-Site combination in CM-Site");
            errorMsgQueue.push("Invalid CM-Site combination in CM-Site");
            return ('invalid');
        }
        else if (checkToProgram(curr)) {
            LOG.info("log_id:", log_id, " | To-Program cannot be empty");
            errorMsgQueue.push("To-Program cannot be empty");
            return ('invalid');
        }
        validationProgram = BOM_Program_Table.findIndex(el => findIndexInBOMProgramTable(el, curr));
        let res_param = data_validation(curr, validationProgram, log_id, tsIndexVal, LOG);
        if (res_param.msg2) {
            errorMsgQueue.push(res_param.msg2);
        }
        if (res_param.msg) {
            return res_param.msg;
        }

        let result_param = check_cmsite(allowed_cmsite, curr, log_id, errorMsgQueue, validation, jwtdetails, request);

        if (result_param.msg) {
            return result_param.msg;
        }
        return curr.Approval_Status.toLowerCase();
    }

    function data_validation(curr, validationProgram, log_id, rfidview_rec, LOG) {
        let to_business_grp_trimmed = getBlankStringIfUndefinedOrNull(curr.To_Business_Grp).toLowerCase().trim();
        let mapped_aqid_trimmed = getBlankStringIfUndefinedOrNull(rfidview_rec.MAPPED_AQID).toLowerCase().trim();
        if (validationProgram < 0) {
            LOG.info("log_id:", log_id, " | Invalid To-Program");
            return { msg: 'invalid', msg2: 'Invalid To-Program' };
        }
        else if (!curr.To_Business_Grp || to_business_grp_trimmed === '') {
            LOG.info("log_id:", log_id, " | To Business Group is blank");
            return { msg: 'invalid', msg2: 'To Business Group is blank' };
        }
        else if ((!rfidview_rec.MAPPED_AQID || mapped_aqid_trimmed === '' || mapped_aqid_trimmed === 'not found' || mapped_aqid_trimmed === 'multiple nb found' || mapped_aqid_trimmed === 'undefined' || mapped_aqid_trimmed === undefined) && curr.Reset_Flag !== 'Reset-3DV') {
            LOG.info("log_id:", log_id, " | Mapped AQID is invalid or blank");
            return { msg: 'invalid', msg2: 'Mapped AQID is invalid or blank' };
        }
        return { msg: "", msg2: "" };
    }

    function check_cmsite(allowed_cmsite, curr, log_id, errorMsgQueue, validation, jwtdetails, request) {
        const LOG = request.req.params["LOG"];
        if (AuthorizationCheck(curr, allowed_cmsite) && !isJobScheduler(jwtdetails) && !request.req?.params?.resyncMappedAqidFlag) {
            LOG.info("log_id:", log_id, " | User doesn't have authorization for this CM-SITE combination");
            errorMsgQueue.push("User doesn't have authorization for this CM-SITE combination");
            return { msg: 'invalid', errorMsgQueue };
        }
        else
            if (validate(validation, log_id, curr.Approval_Status.toLowerCase(), errorMsgQueue, LOG, request)) {
                return { msg: 'invalid', errorMsgQueue };
            }
        return { msg: '', errorMsgQueue };
    }

    function getOldQ(old_output) {
        return (Number.isInteger(parseInt(String(old_output[0].QUANTITY))) ? parseInt(String(old_output[0].QUANTITY)) : 0)
    }


    async function getToAddOutput(curr, old_output, userid, BOM_CM_Site_Table, V_RFIDDetails_Table_map, jwtdetails) {
        let oldQ = 0;
        if (old_output.length != 0) {
            oldQ = getOldQ(old_output);
        }

        let selectRecordFromRFIDDetails = getToDel(curr);
        let tsIndexVal = getMultiLevelValue(V_RFIDDetails_Table_map, [selectRecordFromRFIDDetails['ASSET_ID']]);
        let areaIndexVal = getMultiLevelValue(V_RFIDDetails_Table_map, [selectRecordFromRFIDDetails['ASSET_ID']]);
        let retObj = ({
            FROM_CM: getBlankStringIfUndefinedOrNull(tsIndexVal.CM),
            FROM_SITE: getBlankStringIfUndefinedOrNull(tsIndexVal.SITE),
            FROM_PRODUCT: getBlankStringIfUndefinedOrNull(tsIndexVal.CARRYOVEROLDPROGRAM),  /////
            AQID: getBlankStringIfUndefinedOrNull(tsIndexVal.MAPPED_AQID),
            FROM_BUSINESS_GRP: "", //////
            TO_CM: getBlankStringIfUndefinedOrNull(curr.To_CM),
            TO_SITE: getBlankStringIfUndefinedOrNull(curr.To_Site),
            TO_PRODUCT: getBlankStringIfUndefinedOrNull(curr.To_Program), ////
            TO_BUSINESS_GRP: ((old_output.length > 0 && String(tsIndexVal.TP_BUSINESS_GRP) === "") ? old_output[0].TO_BUSINESS_GRP : String(tsIndexVal.TP_BUSINESS_GRP)),
            EQ_NAME: (tsIndexVal.EQUIPMENT_NAME),
            MFR: (tsIndexVal.MFR), /////
            QUANTITY: oldQ + 1,
            CM_BALANCE_QTY: 0,
            CREATEDAT: (old_output.length > 0) ? old_output[0].CREATEDAT : new Date().toISOString(),
            CREATEDBY: (old_output.length > 0) ? old_output[0].CREATEDBY : String(userid),
            CREATEDBY_NAME: (old_output.length > 0) ? old_output[0].CREATEDBY_NAME : String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            CREATEDBY_MAIL: (old_output.length > 0) ? old_output[0].CREATEDBY_MAIL : String(jwtdetails.email),
            MODIFIEDAT: new Date().toISOString(),
            MODIFIEDBY: String(userid),
            MODIFIEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            MODIFIEDBY_MAIL: String(jwtdetails.email),
            FROM_GHSITE: getBlankStringIfUndefinedOrNull(tsIndexVal.ZALDR_SITE),
            TO_GHSITE: getBlankStringIfUndefinedOrNull(curr.To_GHSite),
            COMMENT: "Quantity Reset",
            SAP_CM_SITE: `${String(tsIndexVal.CM)}-${String(tsIndexVal.SITE)}`,
            SAP_TO_CM_SITE: `${String(curr.To_CM)}-${String(curr.To_Site)}`,
            CO_TYPE: ""
        });

        if (areaIndexVal !== undefined) {
            retObj.FROM_BUSINESS_GRP = areaIndexVal.AREA;
        }
        if (retObj.QUANTITY === 0) {
            retObj.TO_BUSINESS_GRP = "";
        }
        if (old_output.length === 0) {
            retObj.COMMENT = "";
        }
        if (retObj.QUANTITY < 0) retObj.QUANTITY = 0;
        return retObj;
    }

    async function getToAddOutputReduce(curr, old_output, userid, BOM_CM_Site_Table, V_RFIDDetails_Table_map, jwtdetails, validation) {
        let oldQ = 0;
        if (old_output.length !== 0) {
            oldQ = getOldQ(old_output);
        }
        let selectRecordFromRFIDDetails = getToDel(curr);
        let tsIndexVal = getMultiLevelValue(V_RFIDDetails_Table_map, [selectRecordFromRFIDDetails['ASSET_ID']]);
        let fromGHSiteIndex = BOM_CM_Site_Table.findIndex(el => findIndexinBOMCMSiteTable2(el, curr, tsIndexVal))

        let From_GHSite = BOM_CM_Site_Table[fromGHSiteIndex].GH_SITE;
        let toGHSiteIndex = BOM_CM_Site_Table.findIndex(el => {
            if (el.CM === String(old_output[0].TO_CM) && el.SITE === String(old_output[0].TO_SITE)) {
                return true;
            }
            return false;
        })

        let To_GHSite = BOM_CM_Site_Table[toGHSiteIndex].GH_SITE;
        let areaIndexVal = getMultiLevelValue(V_RFIDDetails_Table_map, [selectRecordFromRFIDDetails['ASSET_ID']]);
        let retObj = ({
            FROM_CM: getBlankStringIfUndefinedOrNull(validation[0].CM),
            FROM_SITE: getBlankStringIfUndefinedOrNull(validation[0].SITE),
            FROM_PRODUCT: getBlankStringIfUndefinedOrNull(curr.CarryOverOldProgram),  /////
            AQID: getBlankStringIfUndefinedOrNull(validation[0].MAPPED_AQID),
            FROM_BUSINESS_GRP: "", //////
            TO_CM: getBlankStringIfUndefinedOrNull(old_output[0].TO_CM),
            TO_SITE: getBlankStringIfUndefinedOrNull(old_output[0].TO_SITE),
            TO_PRODUCT: getBlankStringIfUndefinedOrNull(old_output[0].TO_PRODUCT), ////
            TO_BUSINESS_GRP: (old_output.length > 0 && String(tsIndexVal.TP_BUSINESS_GRP) === "") ? old_output[0].TO_BUSINESS_GRP : String(curr.To_Business_Grp),
            EQ_NAME: (tsIndexVal.EQUIPMENT_NAME),
            MFR: (tsIndexVal.MFR), /////
            QUANTITY: oldQ - 1,
            CM_BALANCE_QTY: 0,
            CREATEDAT: (old_output.length > 0) ? old_output[0].CREATEDAT : new Date().toISOString(),
            CREATEDBY: (old_output.length > 0) ? old_output[0].CREATEDBY : String(userid),
            CREATEDBY_NAME: (old_output.length > 0) ? old_output[0].CREATEDBY_NAME : String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            CREATEDBY_MAIL: (old_output.length > 0) ? old_output[0].CREATEDBY_MAIL : String(jwtdetails.email),
            MODIFIEDAT: new Date().toISOString(),
            MODIFIEDBY: String(userid),
            MODIFIEDBY_NAME: String(`${jwtdetails.given_name} ${jwtdetails.family_name}`),
            MODIFIEDBY_MAIL: String(jwtdetails.email),
            FROM_GHSITE: getBlankStringIfUndefinedOrNull(From_GHSite),
            TO_GHSITE: getBlankStringIfUndefinedOrNull(To_GHSite),
            COMMENT: "Quantity Reset",
            SAP_CM_SITE: `${String(tsIndexVal.CM)}-${String(tsIndexVal.SITE)}`,
            SAP_TO_CM_SITE: `${String(old_output[0].TO_CM)}-${String(old_output[0].TO_SITE)}`,
            CO_TYPE: ""
        });
        if (areaIndexVal !== undefined) {
            retObj.FROM_BUSINESS_GRP = areaIndexVal.AREA;
        }
        if (retObj.QUANTITY === 0) {
            retObj.TO_BUSINESS_GRP = "";
        }
        if (retObj.QUANTITY < 0) retObj.QUANTITY = 0;
        return retObj;
    }

    function capitalizeEditableFields(curr) {
        if (curr.To_CM) {
            curr.To_CM = curr.To_CM.toUpperCase();
        }
        if (curr.To_Site) {
            curr.To_Site = curr.To_Site.toUpperCase();
        }
        if (curr.To_Program) {
            curr.To_Program = curr.To_Program.toUpperCase();
        }
        if (curr.To_Business_Grp) {
            curr.To_Business_Grp = curr.To_Business_Grp.toUpperCase();
        }
        if (curr.Transfer_Flag) {
            curr.Transfer_Flag = curr.Transfer_Flag.toUpperCase();
        }
        return curr;
    }

    function findIndexInToAddOutput(global_to_add_output, to_add_output) {
        return (global_to_add_output.findIndex(el => el.FROM_CM === to_add_output.FROM_CM && el.FROM_SITE === to_add_output.FROM_SITE && el.FROM_PRODUCT === to_add_output.FROM_PRODUCT && el.AQID === to_add_output.AQID && el.TO_CM === to_add_output.TO_CM && el.TO_SITE === to_add_output.TO_SITE && el.TO_PRODUCT === to_add_output.TO_PRODUCT));
    }

    function findIndexInChangeArray(to_add_output, changes) {
        return (changes.findIndex(el => el["table_name"] === "T_COA_OUTPUT" && el["new"][4] === to_add_output.FROM_CM && el["new"][5] === to_add_output.FROM_SITE && el["new"][6] === to_add_output.FROM_PRODUCT && el["new"][7] === to_add_output.AQID && el["new"][8] === to_add_output.TO_CM && el["new"][9] === to_add_output.TO_SITE && el["new"][10] === to_add_output.TO_PRODUCT));
    }

    async function doCOAOutputReductionChange(coaOutputValidationArgObj, global_to_del_output, global_to_add_output, changes, Output_Table_map, BOM_CM_Site_Table, V_RFIDDetails_Table_map) {
        let curr, userid, validation, updateCMBalanceSelectionKeys, jwtdetails;
        curr = coaOutputValidationArgObj.curr;
        userid = coaOutputValidationArgObj.userid;
        validation = coaOutputValidationArgObj.validation;
        updateCMBalanceSelectionKeys = coaOutputValidationArgObj.updateCMBalanceSelectionKeys;
        jwtdetails = coaOutputValidationArgObj.jwtdetails;
        if (validation.length > 0 && validation[0]?.APPROVAL_STATUS.toLowerCase() === "approved") {
            let to_del_output = {
                FROM_CM: String(validation[0].CM),
                FROM_SITE: String(validation[0].SITE),
                FROM_PRODUCT: String(curr.CarryOverOldProgram),  /////
                AQID: String(validation[0].MAPPED_AQID),
                TO_CM: String(validation[0].TO_CM),
                TO_SITE: String(validation[0].TO_SITE),
                TO_PRODUCT: String(validation[0].TO_PROGRAM)
            };
            updateCMBalanceSelectionKeys.push({
                FROM_CM: String(validation[0].CM),
                FROM_SITE: String(validation[0].SITE),
                FROM_PRODUCT: String(curr.CarryOverOldProgram),  /////
                AQID: String(validation[0].MAPPED_AQID)
            })
            let old_output_indexVal = getMultiLevelValue(Output_Table_map, [curr['FROM_CM'], curr['FROM_SITE'], curr['FROM_PRODUCT'], curr['AQID'], curr['TO_CM'], curr['TO_SITE'], curr['TO_PRODUCT']]);

            if (old_output_indexVal !== undefined) {
                let old_output = [];
                old_output.push(old_output_indexVal);
                let to_add_output = await getToAddOutputReduce(curr, old_output, userid, BOM_CM_Site_Table, V_RFIDDetails_Table_map, jwtdetails, validation);
                let ind = findIndexInToAddOutput(global_to_add_output, to_add_output);
                if (ind >= 0) {
                    global_to_add_output[ind].QUANTITY = global_to_add_output[ind].QUANTITY - 1;
                    // decrement Quantity there by one
                    if (global_to_add_output[ind].QUANTITY < 0) global_to_add_output[ind].QUANTITY = 0;
                    let indInChange = findIndexInChangeArray(to_add_output, changes);
                    changes[indInChange]["new"] = output_data(global_to_add_output[ind]);
                }
                else {
                    global_to_del_output.push(to_del_output);
                    global_to_add_output.push(to_add_output);
                    updateChangesOutput(to_add_output, old_output, changes);
                }
            }

        }
    }

    async function doCOAOutputIncrementChange(coaOutputValidationArgObj, global_to_del_output, global_to_add_output, changes, BOM_CM_Site_Table, Output_Table_map, V_RFIDDetails_Table_map) {
        let curr, userid, updateCMBalanceSelectionKeys, jwtdetails;
        curr = coaOutputValidationArgObj.curr;
        userid = coaOutputValidationArgObj.userid;
        updateCMBalanceSelectionKeys = coaOutputValidationArgObj.updateCMBalanceSelectionKeys;
        jwtdetails = coaOutputValidationArgObj.jwtdetails;
        let selectRecordFromRFIDDetails = getToDel(curr);
        let tsIndexVal = getMultiLevelValue(V_RFIDDetails_Table_map, [selectRecordFromRFIDDetails['ASSET_ID']]);
        let to_del_output = {
            FROM_CM: String(tsIndexVal.CM),
            FROM_SITE: String(tsIndexVal.SITE),
            FROM_PRODUCT: String(tsIndexVal.CARRYOVEROLDPROGRAM),  /////
            AQID: String(tsIndexVal.MAPPED_AQID),
            TO_CM: String(curr.To_CM),
            TO_SITE: String(curr.To_Site),
            TO_PRODUCT: String(curr.To_Program)
        };
        updateCMBalanceSelectionKeys.push({
            FROM_CM: String(tsIndexVal.CM),
            FROM_SITE: String(tsIndexVal.SITE),
            FROM_PRODUCT: String(tsIndexVal.CARRYOVEROLDPROGRAM),  /////
            AQID: String(tsIndexVal.MAPPED_AQID)
        })
        let old_output_indexVal = getMultiLevelValue(Output_Table_map, [curr['FROM_CM'], curr['FROM_SITE'], curr['FROM_PRODUCT'], curr['AQID'], curr['TO_CM'], curr['TO_SITE'], curr['TO_PRODUCT']]);
        let old_output = [];
        if (old_output_indexVal !== undefined) {
            old_output.push(old_output_indexVal);
        }
        let to_add_output = await getToAddOutput(curr, old_output, userid, BOM_CM_Site_Table, V_RFIDDetails_Table_map, jwtdetails);
        let ind = findIndexInToAddOutput(global_to_add_output, to_add_output);
        if (ind >= 0) {
            global_to_add_output[ind].QUANTITY = global_to_add_output[ind].QUANTITY + 1;
            // increment Quantity there by one
            let indInChange = findIndexInChangeArray(to_add_output, changes);
            changes[indInChange]["new"] = output_data(global_to_add_output[ind]);
        }
        else {
            global_to_del_output.push(to_del_output);
            global_to_add_output.push(to_add_output);
            updateChangesOutput(to_add_output, old_output, changes);

        }
    }



    srv.before("POST", rfid_tt_action, async (request) => {
        if (request.data.auth) {
            request.headers.authorization = request.data.auth;
            request.data = { RfidData: request.data.RfidData };
            if (request.req === undefined) request.req = {};
            if (request.req.params === undefined) request.req.params = {};
            if (request.data.resyncMappedAqidFlag !== undefined && request.data.resyncMappedAqidFlag === true) request.req.params = { "resyncMappedAqidFlag": true, ...request.req.params };
        }
    })

    function adjacentDuplicateRemoveFilter(e, inde, a) {
        if (inde === 0) {
            return true;
        }
        if (e !== a[inde - 1]) {
            return true;
        }
        return false;
    }

    function findResponseIndex(el, curr) {
        if (el.GH_SITE === curr.To_GHSite) {
            return true;
        }
        return false;
    }

    function setCurrIfClear(curr) {
        if (!checkForClear(curr)) {
            if (!curr.To_CM || curr.To_CM === '' || curr.To_CM === undefined)
                curr.To_CM = 'invalid';
            if (!curr.To_Site || curr.To_Site === '' || curr.To_Site === undefined)
                curr.To_Site = 'invalid';
        }
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

    async function deleteDuplicatesWithTrimFromNonRFIDProjTable(LOG) {
        LOG.info("Trying to delete duplicates with trim from nonrfid-proj table")
        let tx = hdb.tx();
        try {
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_NONRFID_PROJECTION where id in (SELECT t2.id FROM (SELECT
                    *,
                    Row_Number() OVER( PARTITION BY 
                                            t1.CM,
                                            t1.Site,
                                            t1.Program,
                                            t1.Station,
                                            t1.Aqid,
                                            t1.Uph,
                                            trim(t1.Line),
                                            t1.Level,
                                            t1.Group_Priority,
                                            t1.Mfr
                                             ORDER BY t1.ModifiedAt desc ) AS rn
                FROM COM_APPLE_COA_T_COA_NONRFID_PROJECTION as t1
                ) as t2 where t2.rn>1)`);
            await tx.commit();
            LOG.info(`Successfully removed duplicates from nonrfid-projection table`);
        }
        catch (err) {
            await tx.rollback();
            LOG.info("There was an error while deleting duplicates from nonrfid-projection table ", err.response?.data || err.response || err.data || err);
        }
    }

    async function trimLineTypesInAllTables(LOG) {
        LOG.info("inside fullRefreshAndRemoveAllSpaces");
        await deleteDuplicatesWithTrimFromNonRFIDProjTable(LOG);
        let tablesAndLineColumnsObjArr = [];
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_3DV_HEADER', "col_name": 'LINE' })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_LINE_BRING_UP', "col_name": 'LINE', "requireDel": true })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_LINE_SUMMARY', "col_name": 'LINE', "requireDel": true })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_NONRFID_PROJECTION', "col_name": 'LINE' })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_NONRFID_TT', "col_name": 'LINE_TYPE', "requireDel": true })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_RFID_ANNOTATION', "col_name": 'LINETYPE' })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_RFID_TT', "col_name": 'LINE_TYPE' })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_SHAPES', "col_name": 'LINETYPE' })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_SIMULATION_H', "col_name": 'LINE_TYPE', "requireDel": true })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_SIMU_NONRFID', "col_name": 'LINE_TYPE', "requireDel": true })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_SIMU_RFID', "col_name": 'LINE_TYPE' })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_STATION_SUMMARY', "col_name": 'LINE', "requireDel": true })
        tablesAndLineColumnsObjArr.push({ "table_name": 'COM_APPLE_COA_T_COA_SUBLINE', "col_name": 'SUB_LINE_NAME', "requireDel": true })

        for (let i = 0; i < tablesAndLineColumnsObjArr.length; i++) {
            let tx = hdb.tx();
            try {


                if (tablesAndLineColumnsObjArr[i]["requireDel"]) {
                    await determineDeletionTable(tx, LOG, tablesAndLineColumnsObjArr[i]["table_name"])
                }
                await tx.run(`UPDATE ${tablesAndLineColumnsObjArr[i]["table_name"]} set ${tablesAndLineColumnsObjArr[i]["col_name"]} = trim(${tablesAndLineColumnsObjArr[i]["col_name"]})`);

                await tx.commit();
                LOG.info(`Successfully updated ${tablesAndLineColumnsObjArr[i]["col_name"]} in ${tablesAndLineColumnsObjArr[i]["table_name"]}`);
            }
            catch (err) {
                await tx.rollback();
                LOG.info("There was an error while updating ", tablesAndLineColumnsObjArr[i]["table_name"], " : ", err.response?.data || err.response || err.data || err);
            }
        }

    }

    async function updateCOAQIDandCOProgramInRFIDAnnotation(LOG) {
        LOG.info("inside updateCOAQIDandCOProgramInRFIDAnnotation");
        let tx = hdb.tx();
        try {
            await tx.run(`UPDATE COM_APPLE_COA_T_COA_RFID_ANNOTATION as t1 set t1.CARRYOVERAQID=(SELECT t2.APPLE_ID from V_ALDERAAN_DATA as t2 where t2.asset_id=t1.asset_id) where t1.status='DRAFT' and (t1.CARRYOVERAQID is null or t1.CARRYOVERAQID='')`);
            await tx.run(`UPDATE COM_APPLE_COA_T_COA_RFID_ANNOTATION as t1 set t1.CARRYOVEROLDPROGRAM=(SELECT t2.CM_PROGRAM from V_ALDERAAN_DATA as t2 where t2.asset_id=t1.asset_id) where t1.status='DRAFT' and (t1.CARRYOVEROLDPROGRAM is null or t1.CARRYOVEROLDPROGRAM='')`);
            await tx.commit();
            LOG.info(`Successfully updated CARRYOVERAQID and CARRYOVEROLDPROGRAM in COM_APPLE_COA_T_COA_RFID_ANNOTATION`);
        }
        catch (err) {
            await tx.rollback();
            LOG.info("There was an error while updating CARRYOVERAQID and CARRYOVEROLDPROGRAM in COM_APPLE_COA_T_COA_RFID_ANNOTATION", err.response?.data || err.response || err.data || err);
        }
    }


    srv.on("bringToSyncWithCurrentDesign", async (request) => {
        let uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'bringToSyncWithCurrentDesign' })
        let flagArr = request.data.flags;
        if (flagArr.includes(`deleteDuplicatesFromNonRFIDProjTable`))
            await deleteDuplicatesFromNonRFIDProjTable(LOG);
        if (flagArr.includes(`sync_output_from_nonrfidtt`))
            await sync_output_from_nonrfidtt(LOG);
        if (flagArr.includes(`sync_output_from_unscannable`))
            await sync_output_from_unscannable(LOG);
        if (flagArr.includes(`trimLineTypesInAllTables`))
            await trimLineTypesInAllTables(LOG);
        if (flagArr.includes(`updateCOAQIDandCOProgramInRFIDAnnotation`))
            await updateCOAQIDandCOProgramInRFIDAnnotation(LOG);
        if (flagArr.includes(`sync_output_from_rfidtt`))
            await sync_output_from_rfidtt(LOG);
    })

    async function sync_output_from_nonrfidtt(LOG) {
        let tx = hdb.tx();
        LOG.info("Sync Non RFID TT Data to CO output");
        try {
            //For Syncing Non RFID TT app data to CO Output
            await tx.run(`UPDATE COM_APPLE_COA_T_COA_OUTPUT AS t2
            SET 
                QUANTITY = ( 	(SELECT Quantity AS quantity
            FROM 
                (
                    (SELECT *
                    FROM 
                        (
                            (SELECT 
                                CASE
                                    WHEN Quantity1 IS NULL THEN 0
                                    ELSE Quantity1
                                END AS Quantity,
                                table3.FROM_CM,
                                table3.FROM_SITE,
                                table3.FROM_PRODUCT,
                                table3.AQID,
                                table3.TO_CM,
                                table3.TO_SITE,
                                table3.TO_PRODUCT,
                                table3.Quantity AS CO,
                                table3.CO_TYPE
                            FROM 
                                COM_APPLE_COA_T_COA_OUTPUT AS table3
                                LEFT OUTER JOIN
                                (
                                    (SELECT 
                                        table1.CM,
                                        table1.Site,
                                        table1.Program,
                                        table1.Mapped_Aqid,
                                        table1.To_CM,
                                        table1.To_Site,
                                        table1.To_Program,
                                        SUM(table1.Transfer_Qty) AS Quantity1
                                    FROM COM_APPLE_COA_T_COA_NONRFID_TT AS table1
                                    WHERE table1.status = 'Approved'
                                    GROUP BY 
                                        table1.CM,
                                        table1.Site,
                                        table1.Program,
                                        table1.Mapped_Aqid,
                                        table1.To_CM,
                                        table1.To_Site,
                                        table1.To_Program)
                                ) AS table2
                                ON table3.From_CM = table2.CM
                                    AND table3.From_Site = table2.Site
                                    AND table3.From_Product = table2.Program
                                    AND table3.AQID = table2.Mapped_Aqid
                                    AND table3.To_CM = table2.To_CM
                                    AND table3.To_Site = table2.To_Site
                                    AND table3.To_Product = table2.To_Program
                                    AND table3.CO_TYPE = 'Non RFID')
                        )
                    WHERE quantity != co
                        AND CO_TYPE = 'Non RFID')
                ) AS t1
            WHERE t1.from_cm = t2.from_cm
                AND t1.from_site = t2.from_site
                AND t1.to_cm = t2.to_cm
                AND t1.to_site = t2.to_site
                AND t1.from_product = t2.from_product
                AND t1.to_product = t2.to_product
                AND t1.aqid = t2.aqid
                AND t2.CO_TYPE = 'Non RFID') ),
                Comment = 'Quantity Reset',
                Status = 'Pending',
                MODIFIEDBY = 'job_update',
                CM_BALANCE_QTY = 0.00,
                APPROVED_BY = '',
                REVIEW_DATE = null,
                APPROVED_BY_NAME = '',
                APPROVED_BY_MAIL = ''                            
            WHERE EXISTS (SELECT *
            FROM 
                (
                    (SELECT *
                    FROM 
                        (
                            (SELECT 
                                CASE
                                    WHEN Quantity1 IS NULL THEN 0
                                    ELSE Quantity1
                                END AS Quantity,
                                table3.FROM_CM,
                                table3.FROM_SITE,
                                table3.FROM_PRODUCT,
                                table3.AQID,
                                table3.TO_CM,
                                table3.TO_SITE,
                                table3.TO_PRODUCT,
                                table3.Quantity AS CO,
                                table3.CO_TYPE
                            FROM 
                                COM_APPLE_COA_T_COA_OUTPUT AS table3
                                LEFT OUTER JOIN
                                (
                                    (SELECT 
                                        table1.CM,
                                        table1.Site,
                                        table1.Program,
                                        table1.Mapped_Aqid,
                                        table1.To_CM,
                                        table1.To_Site,
                                        table1.To_Program,
                                        SUM(table1.Transfer_Qty) AS Quantity1
                                    FROM COM_APPLE_COA_T_COA_NONRFID_TT AS table1
                                    WHERE table1.status = 'Approved'
                                    GROUP BY 
                                        table1.CM,
                                        table1.Site,
                                        table1.Program,
                                        table1.Mapped_Aqid,
                                        table1.To_CM,
                                        table1.To_Site,
                                        table1.To_Program)
                                ) AS table2
                                ON table3.From_CM = table2.CM
                                    AND table3.From_Site = table2.Site
                                    AND table3.From_Product = table2.Program
                                    AND table3.AQID = table2.Mapped_Aqid
                                    AND table3.To_CM = table2.To_CM
                                    AND table3.To_Site = table2.To_Site
                                    AND table3.To_Product = table2.To_Program
                                    AND table3.CO_TYPE = 'Non RFID')
                        )
                    WHERE quantity != co
                        AND CO_TYPE = 'Non RFID')
                ) AS t3
            WHERE t3.from_cm = t2.from_cm
                AND t3.from_site = t2.from_site
                AND t3.to_cm = t2.to_cm
                AND t3.to_site = t2.to_site
                AND t3.from_product = t2.from_product
                AND t3.to_product = t2.to_product
                AND t3.aqid = t2.aqid
                AND t2.CO_TYPE = 'Non RFID')
            `);
            await tx.commit();
            LOG.info(`Syncing of CO output data is completed for Non RFID TT`);
        } catch (err) {
            await tx.rollback();
            LOG.info(JSON.stringify(err.message));
        }
    }

    async function sync_output_from_unscannable(LOG) {
        let tx = hdb.tx();
        LOG.info("Sync Unscananble Data to CO output");
        try {
            //For Syncing Unscannable app data to CO Output
            await tx.run(`UPDATE COM_APPLE_COA_T_COA_OUTPUT AS t2
        SET 
            QUANTITY = ( 	(SELECT Quantity AS quantity
        FROM 
            (
                (SELECT *
                FROM 
                    (
                        (SELECT 
                            CASE
                                WHEN Quantity1 IS NULL THEN 0
                                ELSE Quantity1
                            END AS Quantity,
                            table3.FROM_CM,
                            table3.FROM_SITE,
                            table3.FROM_PRODUCT,
                            table3.AQID,
                            table3.TO_CM,
                            table3.TO_SITE,
                            table3.TO_PRODUCT,
                            cast(table3.Quantity AS INTEGER) AS co,
                            table3.CO_TYPE
                        FROM 
                            COM_APPLE_COA_T_COA_OUTPUT AS table3
                            LEFT OUTER JOIN
                            (
                                (SELECT 
                                    table1.CM,
                                    table1.Site,
                                    table1.Program,
                                    table1.Mapped_Aqid,
                                    table1.To_CM,
                                    table1.To_Site,
                                    table1.To_Program,
                                    SUM(table1.Qty) AS Quantity1
                                FROM COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT AS table1
                                WHERE table1.status = 'Approved'
                                GROUP BY 
                                    table1.CM,
                                    table1.Site,
                                    table1.Program,
                                    table1.Mapped_Aqid,
                                    table1.To_CM,
                                    table1.To_Site,
                                    table1.To_Program)
                            ) AS table2
                            ON table3.From_CM = table2.CM
                                AND table3.From_Site = table2.Site
                                AND table3.From_Product = table2.Program
                                AND table3.AQID = table2.Mapped_Aqid
                                AND table3.To_CM = table2.To_CM
                                AND table3.To_Site = table2.To_Site
                                AND table3.To_Product = table2.To_Program
                                AND table3.CO_TYPE = 'Unscanned')
                    )
                WHERE ( Quantity != co )
                    AND CO_TYPE = 'Unscanned')
            ) AS t1
        WHERE t1.from_cm = t2.from_cm
            AND t1.from_site = t2.from_site
            AND t1.to_cm = t2.to_cm
            AND t1.to_site = t2.to_site
            AND t1.from_product = t2.from_product
            AND t1.to_product = t2.to_product
            AND t1.aqid = t2.aqid
            AND t2.CO_TYPE = 'Unscanned') ),
            Comment = 'Quantity Reset',
            Status = 'Pending',
            MODIFIEDBY = 'job_update',
            CM_BALANCE_QTY = 0.00,
            APPROVED_BY = '',
            REVIEW_DATE = null,
            APPROVED_BY_NAME = '',
            APPROVED_BY_MAIL = ''   
        WHERE EXISTS (SELECT *
        FROM 
            (
                (SELECT *
                FROM 
                    (
                        (SELECT 
                            CASE
                                WHEN Quantity1 IS NULL THEN 0
                                ELSE Quantity1
                            END AS Quantity,
                            table3.FROM_CM,
                            table3.FROM_SITE,
                            table3.FROM_PRODUCT,
                            table3.AQID,
                            table3.TO_CM,
                            table3.TO_SITE,
                            table3.TO_PRODUCT,
                            cast(table3.Quantity AS INTEGER) AS co,
                            table3.CO_TYPE
                        FROM 
                            COM_APPLE_COA_T_COA_OUTPUT AS table3
                            LEFT OUTER JOIN
                            (
                                (SELECT 
                                    table1.CM,
                                    table1.Site,
                                    table1.Program,
                                    table1.Mapped_Aqid,
                                    table1.To_CM,
                                    table1.To_Site,
                                    table1.To_Program,
                                    SUM(table1.Qty) AS Quantity1
                                FROM COM_APPLE_COA_T_COA_RFID_UNSCANNABLE_TT AS table1
                                WHERE table1.status = 'Approved'
                                GROUP BY 
                                    table1.CM,
                                    table1.Site,
                                    table1.Program,
                                    table1.Mapped_Aqid,
                                    table1.To_CM,
                                    table1.To_Site,
                                    table1.To_Program)
                            ) AS table2
                            ON table3.From_CM = table2.CM
                                AND table3.From_Site = table2.Site
                                AND table3.From_Product = table2.Program
                                AND table3.AQID = table2.Mapped_Aqid
                                AND table3.To_CM = table2.To_CM
                                AND table3.To_Site = table2.To_Site
                                AND table3.To_Product = table2.To_Program
                                AND table3.CO_TYPE = 'Unscanned')
                    )
                WHERE ( Quantity != co )
                    AND CO_TYPE = 'Unscanned')
            ) AS t3
        WHERE t3.from_cm = t2.from_cm
            AND t3.from_site = t2.from_site
            AND t3.to_cm = t2.to_cm
            AND t3.to_site = t2.to_site
            AND t3.from_product = t2.from_product
            AND t3.to_product = t2.to_product
            AND t3.aqid = t2.aqid
            AND t2.CO_TYPE = 'Unscanned')
        `);
            await tx.commit();
            LOG.info(`Syncing of CO output data is completed for Unscannable`);
        } catch (err) {
            await tx.rollback();
            LOG.info(JSON.stringify(err.message));
        }
    }

    async function sync_output_from_rfidtt(LOG) {
        let tx = hdb.tx();
        LOG.info("Sync RFID on Hand TT Data to CO output");
        try {
            //For Syncing RFID on Hand TT app data to CO Output
            await tx.run(`UPDATE COM_APPLE_COA_T_COA_OUTPUT as t2
            SET QUANTITY = 
            (SELECT RFIDVIEWCOUNT as quantity
            FROM V_RFIDVIEW_OUTPUT_DIFF as t1
            where t1.from_cm=t2.from_cm and t1.from_site=t2.from_site 
            and t1.to_cm=t2.to_cm and t1.to_site=t2.to_site
            and t1.from_program=t2.from_product and t1.to_program=t2.to_product
            and t1.mapped_aqid=t2.aqid
            ),
            Comment = 'Quantity Reset',
            Status = 'Pending',
            MODIFIEDBY = 'job_update',
            CM_BALANCE_QTY = 0.00,
            APPROVED_BY = '',
            REVIEW_DATE = null,
            APPROVED_BY_NAME = '',
            APPROVED_BY_MAIL = ''  
            WHERE
            EXISTS
            (
                SELECT * FROM V_RFIDVIEW_OUTPUT_DIFF as t3
                where t3.from_cm=t2.from_cm and t3.from_site=t2.from_site 
                and t3.to_cm=t2.to_cm and t3.to_site=t2.to_site
                and t3.from_program=t2.from_product and t3.to_program=t2.to_product
                and t3.mapped_aqid=t2.aqid
            ) and t2.co_type=''`);
            await tx.commit();
            LOG.info(`Syncing of CO output data is completed for RFID on Hand TT`);
        } catch (err) {
            await tx.rollback();
            LOG.info(JSON.stringify(err.message));
        }
    }

    async function deleteDuplicatesFromNonRFIDProjTable(LOG) {
        LOG.info("Trying to delete duplicates from nonrfid-proj table")
        let tx = hdb.tx();
        try {
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_NONRFID_PROJECTION where id in (SELECT t2.id FROM (SELECT
                    *,
                    Row_Number() OVER( PARTITION BY 
                                            t1.CM,
                                            t1.Site,
                                            t1.Program,
                                            t1.Station,
                                            t1.Aqid,
                                            t1.Uph,
                                            t1.Line,
                                            t1.Level,
                                            t1.Group_Priority,
                                            t1.Mfr
                                             ORDER BY t1.ModifiedAt desc ) AS rn
                FROM COM_APPLE_COA_T_COA_NONRFID_PROJECTION as t1
                ) as t2 where t2.rn>1)`);
            await tx.commit();
            LOG.info(`Successfully removed duplicates from nonrfid-projection table`);
        }
        catch (err) {
            await tx.rollback();
            LOG.info("There was an error while deleting duplicates from nonrfid-projection table ", err.response?.data || err.response || err.data || err);
        }
    }
    function removeToCMandSite(curr) {
        if (!checkForClear(curr)) {
            curr.To_CM = 'invalid';
            curr.To_Site = 'invalid';
        }
    }

    srv.on("POST", rfid_tt_action, async (request) => {
        const log_id = getuuid(request);
        const LOG = cds.log(log_id, { label: 'rfidttaction' });
        request.req.params["LOG"] = LOG;
        LOG.info("in rfid_tt_action at ", new Date());

        await resyncCOCount(LOG);
        let changes = [];

        LOG.info("log_id : ", log_id, " | ", "rfid req length: ", request.data.RfidData.length);
        Check_and_request(request);
        let userid = request.user.id;
        let jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let i = 0;
        let To_Program_collection = [];
        let Output_Table_SelectionKeys = [];
        let V_RFIDDetails_Table_SelectionKeys = [];
        let outputKeySplGuid = cds.utils.uuid();
        let outputKeySplGuid2 = cds.utils.uuid();
        let rfiddetailsKeySplGuid = cds.utils.uuid();
        for (; i < request.data.RfidData.length; i++) {
            let curr = getToDel(request.data.RfidData[i]);
            To_Program_collection.push(request.data.RfidData[i].To_Program);
            V_RFIDDetails_Table_SelectionKeys.push({
                ASSET_ID: String(curr.ASSET_ID),
                ID: rfiddetailsKeySplGuid,
                GUID: `${cds.utils.uuid()}`
            });
        }
        To_Program_collection = To_Program_collection.sort();
        To_Program_collection = To_Program_collection.filter((e, inde, a) => adjacentDuplicateRemoveFilter(e, inde, a));
        let Output_Table = [];
        let RFID_Table = [];
        LOG.info("Abt to start making data selections at: ", new Date());
        let tx = hdb.tx();

        await tx.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries([...V_RFIDDetails_Table_SelectionKeys]));
        let V_RFIDDetails_Table = [];
        V_RFIDDetails_Table = await tx.run(`SELECT DISTINCT V_RFIDDETAILS.*
        FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
          INNER JOIN V_RFIDDETAILS AS V_RFIDDETAILS
          ON 
          CAST(T_COA_TEMP.ASSET_ID as varchar) = CAST(V_RFIDDETAILS.ALDERAN as varchar)
          WHERE T_COA_TEMP.ID='${rfiddetailsKeySplGuid}'`)
        V_RFIDDetails_Table = V_RFIDDetails_Table.map(el => {
            if (el.ALDERAN) el.ASSET_ID = el.ALDERAN
            return el
        })

        let V_RFIDDetails_Table_map = {};
        fillMultimap(V_RFIDDetails_Table_map, V_RFIDDetails_Table, ['ASSET_ID']);

        V_RFIDDetails_Table.forEach(el => {
            Output_Table_SelectionKeys.push({
                FROM_CM: el.CM,
                FROM_SITE: el.SITE,
                FROM_PRODUCT: el.CARRYOVEROLDPROGRAM,  /////
                AQID: el.MAPPED_AQID,
                ID: outputKeySplGuid,
                GUID: `${cds.utils.uuid()}`
            });
        })



        RFID_Table = await tx.run(`SELECT DISTINCT T_COA_RFID_TT.*
          FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
            INNER JOIN COM_APPLE_COA_T_COA_RFID_TT AS T_COA_RFID_TT
            ON 
            CAST(T_COA_TEMP.ASSET_ID as varchar) = CAST(T_COA_RFID_TT.ASSET_ID as varchar)
            WHERE T_COA_TEMP.ID='${rfiddetailsKeySplGuid}'`)

        let RFID_Table_map = {};
        fillMultimap(RFID_Table_map, RFID_Table, ['ASSET_ID']);

        RFID_Table.forEach(el => {
            Output_Table_SelectionKeys.push({
                FROM_CM: el.CM,
                FROM_SITE: el.SITE,
                AQID: el.MAPPED_AQID,
                ID: outputKeySplGuid2,
                GUID: `${cds.utils.uuid()}`
            });
        })
        await tx.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries([...Output_Table_SelectionKeys]));


        Output_Table = await tx.run(`(SELECT DISTINCT COM_APPLE_COA_T_COA_OUTPUT.*
        FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
          INNER JOIN COM_APPLE_COA_T_COA_OUTPUT AS COM_APPLE_COA_T_COA_OUTPUT
         ON T_COA_TEMP.AQID = COM_APPLE_COA_T_COA_OUTPUT.AQID
          AND T_COA_TEMP.FROM_CM = COM_APPLE_COA_T_COA_OUTPUT.FROM_CM
          AND T_COA_TEMP.FROM_SITE = COM_APPLE_COA_T_COA_OUTPUT.FROM_SITE
          AND T_COA_TEMP.FROM_PRODUCT = COM_APPLE_COA_T_COA_OUTPUT.FROM_PRODUCT
          WHERE T_COA_TEMP.ID='${outputKeySplGuid}' and COM_APPLE_COA_T_COA_OUTPUT.CO_TYPE='') 
          
          UNION DISTINCT
          
          (SELECT DISTINCT COM_APPLE_COA_T_COA_OUTPUT.*
          FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
            INNER JOIN COM_APPLE_COA_T_COA_OUTPUT AS COM_APPLE_COA_T_COA_OUTPUT
           ON T_COA_TEMP.AQID = COM_APPLE_COA_T_COA_OUTPUT.AQID
            AND T_COA_TEMP.FROM_CM = COM_APPLE_COA_T_COA_OUTPUT.FROM_CM
            AND T_COA_TEMP.FROM_SITE = COM_APPLE_COA_T_COA_OUTPUT.FROM_SITE
            WHERE T_COA_TEMP.ID='${outputKeySplGuid2}' and COM_APPLE_COA_T_COA_OUTPUT.CO_TYPE='')`)

        let Output_Table_map = {};
        fillMultimap(Output_Table_map, Output_Table, ['FROM_CM', 'FROM_SITE', 'FROM_PRODUCT', 'AQID', 'TO_CM', 'TO_SITE', 'TO_PRODUCT']);


        await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_TEMP WHERE ID='${rfiddetailsKeySplGuid}' or ID='${outputKeySplGuid}' or ID='${outputKeySplGuid2}'`)
        await tx.commit()

        let BOM_CM_Site_Table = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('CM as CM', 'SITE as SITE', 'GH_SITE as GH_SITE'));

        let BOM_CM_Site_Table_ghsite_map = {};
        let BOM_CM_Site_Table_cmsite_map = {};
        fillMultimap(BOM_CM_Site_Table_ghsite_map, BOM_CM_Site_Table, ['GH_SITE']);
        fillMultimap(BOM_CM_Site_Table_cmsite_map, BOM_CM_Site_Table, ['CM', 'SITE']);

        let BOM_Program_Table = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('PROGRAM as PROGRAM').where({
            PROGRAM: { in: To_Program_collection }
        }));

        let BOM_Program_Table_map = {};
        fillMultimap(BOM_Program_Table_map, BOM_Program_Table, ['PROGRAM']);
        LOG.info("Completed all data selections at: ", new Date());

        let global_to_add = [];
        let global_to_del = [];
        let global_to_add_output = [];
        let global_to_del_output = [];
        let errorMsgQueue = [];
        let updateCMBalanceSelectionKeys = [];
        i = 0;
        let t2 = new Date();
        LOG.info("Processing loop start at: ", t2);
        const RfidData = request.data.RfidData;
        const RFIDLENTH = RfidData.length;

        while (i < RFIDLENTH) {
            LOG.info("Processing row no ", i, " at ", new Date());
            let curr = RfidData[i];
            curr = capitalizeEditableFields(curr);
            let to_del, to_add, validation;
            to_del = getToDel(curr);


            removeToCMandSite(curr);
            let responseIndex = BOM_CM_Site_Table.findIndex(el => findResponseIndex(el, curr))
            if (responseIndex >= 0) {
                curr.To_CM = BOM_CM_Site_Table[responseIndex].CM;
                curr.To_Site = BOM_CM_Site_Table[responseIndex].SITE;
            }
            else {
                setCurrIfClear(curr);
            }
            let validationIndexVal = getMultiLevelValue(RFID_Table_map, [to_del['ASSET_ID']]);
            validation = [];
            if (validationIndexVal !== undefined) {
                validation.push(validationIndexVal);
            }

            to_add = getToAdd(curr, validation, userid, jwtdetails, V_RFIDDetails_Table_map);
            let getApprovalStatusArgObj = {};
            getApprovalStatusArgObj.userid = userid;
            getApprovalStatusArgObj.allowedAttributes = allowedAttributes;
            getApprovalStatusArgObj.Output_Table_map = Output_Table_map;
            getApprovalStatusArgObj.jwtdetails = jwtdetails;
            getApprovalStatusArgObj.V_RFIDDetails_Table_map = V_RFIDDetails_Table_map;
            getApprovalStatusArgObj.curr = curr;
            let coaOutputValidationArgObj = {};
            coaOutputValidationArgObj.curr = curr;
            coaOutputValidationArgObj.userid = userid;
            coaOutputValidationArgObj.validation = validation;
            coaOutputValidationArgObj.updateCMBalanceSelectionKeys = updateCMBalanceSelectionKeys;
            coaOutputValidationArgObj.jwtdetails = jwtdetails;
            request.req.params["LOG"] = LOG;
            switch (await getApprovalStatus(request, getApprovalStatusArgObj, log_id, errorMsgQueue, validation, BOM_CM_Site_Table, BOM_Program_Table)) {
                case 'invalid':
                    i++;
                    continue;
                case 'clear':
                    LOG.info("log_id : ", log_id, " | ", "case when status is being cleared");
                    await doCOAOutputReductionChange(coaOutputValidationArgObj, global_to_del_output, global_to_add_output, changes, Output_Table_map, BOM_CM_Site_Table, V_RFIDDetails_Table_map);
                    global_to_del.push(to_del);
                    updateChanges(to_add, validation, changes);
                    break;
                case 'pending':
                    LOG.info("log_id : ", log_id, " | ", "case when status is being changed to pending");
                    //add entries to rfid_tt table
                    global_to_del.push(to_del);
                    global_to_add.push(to_add);
                    updateChanges(to_add, validation, changes);
                    //update entries in COA_OUTPUT table
                    await doCOAOutputReductionChange(coaOutputValidationArgObj, global_to_del_output, global_to_add_output, changes, Output_Table_map, BOM_CM_Site_Table, V_RFIDDetails_Table_map);
                    break;
                case 'approved':
                    LOG.info("log_id : ", log_id, " | ", "case when status is being changed to approved");
                    global_to_del.push(to_del);
                    global_to_add.push(to_add);
                    updateChanges(to_add, validation, changes);
                    //add/update entries valid  COA_OUTPUT table
                    await doCOAOutputIncrementChange(coaOutputValidationArgObj, global_to_del_output, global_to_add_output, changes, BOM_CM_Site_Table, Output_Table_map, V_RFIDDetails_Table_map);
                    break;
                case 'rejected':
                    LOG.info("log_id : ", log_id, " | ", "case when status is being changed to rejected");
                    //update entries in the rfid_tt table
                    global_to_del.push(to_del);
                    global_to_add.push(to_add);
                    updateChanges(to_add, validation, changes);
                    break;
            }
            i = i + 1;
        }
        LOG.info("Processing loop end at: ", new Date());
        LOG.info("Total processing time : ", new Date() - t2);
        let arg = {};
        arg["log_id"] = log_id;
        arg["userid"] = userid;
        arg.updateCMBalanceSelectionKeys = updateCMBalanceSelectionKeys;
        arg.jwtdetails = jwtdetails;
        arg.request = request;
        arg.LOG = LOG;
        await pushToDB(global_to_del, global_to_add, global_to_del_output, global_to_add_output, errorMsgQueue, changes, arg);
        let l = 0;
        let errorFlag = false;
        for (; l < request.data.RfidData.length; l++) {
            request.data.RfidData[l]["ErrorMsg"] = errorMsgQueue[l];
            if (errorMsgQueue[l] !== "") {
                LOG.info("errorMsgQueue[l]: ", errorMsgQueue[l])
                errorFlag = true;
            }
        }
        if (errorFlag) {
            request.reject(400, JSON.stringify(request.data.RfidData));
        }
        return request.reply(request.data.RfidData);
    })

    function Check_and_request(request) {
        if (request.data.RfidData.length <= 0) {
            request.reject(400, 'Nothing to update');
        }
        else if (request.data.RfidData.length > 5000) {
            request.reject(400, "You cannot mass update more than 5000 records.");
        }
    }

    // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
    // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
    srv.before("GET", RFIDDetails, async (request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        const LOG = cds.log(getuuid(request), { label: 'RFIDDetails' });
        request.req.params["LOG"] = LOG;
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        allowedAttributes['RfidOnHandTTReadOnly'] = merge(allowedAttributes['RfidOnHandTTReadOnly'], allowedAttributes['RfidOnHandTTModify'], allowedAttributes['ApproveRfidOnHandTT'])
        let filterString = getFilterString(allowedAttributes['RfidOnHandTTReadOnly'], LOG);
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

    srv.after("GET", RFIDDetails, async (data, request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes['RfidOnHandTTModify'];
        request.results.forEach(e => {
            e.Edit = (allowed_cmsite[`${e.CM}-${e.SITE}`] !== undefined ||
                allowed_cmsite[`$unrestricted-${e.SITE}`] !== undefined ||
                allowed_cmsite[`${e.CM}-$unrestricted}`] !== undefined ||
                allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? 7 : 1;
        });
    }
    );

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function AttemptdecodeURIComponent(filters) {
        try {
            let ret = decodeURIComponent(filters);
            return ret;
        }
        catch (err) {
            return filters;
        }
    }

    srv.on("selectAllMassUpdate", async (request) => {
        const LOG = cds.log(getuuid(request), { label: 'selectAllMassUpdate' });
        LOG.info("in selectAllMassUpdate;");
        let filters = request.data.url;
        let action = request.data.Approval_Status.toLowerCase();
        let GHSiteValidityCheck = await cds.run(SELECT.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").where({
            "GH_SITE": request.data.To_GH_Site
        }));
        validate_data(action, request, GHSiteValidityCheck, LOG);
        filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' != ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
        filters = AttemptdecodeURIComponent(filters);
        let regex = /contains\((\w+),'(.+?)'\)/g;
        filters = filters.replace(regex, `($1 like '%$2%')`);
        regex = /substringof\('(.+?)',(\w+)\)/g;
        filters = filters.replace(regex, `($2 like '%$1%')`);
        let parsedFilters = cds.parse.expr(filters);
        let t1 = new Date();
        LOG.info("Making first giant select at: ", t1);
        let selectedRecordsToMassUpdate = await cds.run(SELECT.from(RFIDDetails).where(parsedFilters));
        LOG.info("Ending first giant select at: ", new Date());
        LOG.info("Total time taken for select: ", new Date() - t1);
        if (selectedRecordsToMassUpdate.length > 5000) {
            request.reject(400, "You cannot mass update more than 5000 records.")
        }
        if (action === "pending") {
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => {
                return (
                    {
                        RFID_Timestamp: el.TIMESTAMP,
                        Asset_Id: el.ALDERAN,
                        RFID: el.RFID,
                        AQID: el.AQID,
                        Raw_AQID: el.Raw_Aqid,
                        Mapped_AQID: el.Mapped_Aqid,
                        Short_Name: el.Short_Name,
                        Serial_Number: el.SERNR,
                        MFR: el.MFR,
                        EQ_Name: el.Equipment_Name,
                        Asset_Own: el.ASSETOWN,
                        CM: el.CM,
                        Site: el.SITE,
                        CM_Program: el.ZALDR_CMPROGRAM,
                        Asset_Status: el.STATUS,
                        Timestamp_3DV: el.createdAt,
                        Line_ID: el.LineId,
                        Override_lineId: el.Override_LineId,
                        Line_Type: el.LineType,
                        UPH: el.Uph,
                        Version: el.Version_Id,
                        Transfer_Flag: request.data.Transfer_Flag,
                        To_CM: GHSiteValidityCheck[0].CM,
                        To_Site: GHSiteValidityCheck[0].SITE,
                        To_Program: request.data.To_Program,
                        To_Business_Grp: request.data.To_Business_Grp,
                        Comments: request.data.Comment,
                        CarryOverAqid: el.CarryOverAqid,
                        CarryOverEqName: el.CarryOverEqName,
                        Approval_Status: "Pending",
                        Submit_Date: el.Submit_Dte,
                        Submit_By: el.Submit_By,
                        Review_Date: el.Review_Date,
                        Reviewed_By: el.Reviewed_By,
                        CarryOverOldProgram: el.CarryOverOldProgram,
                        To_GHSite: request.data.To_GH_Site,
                    }
                )
            })
        }
        else if (action === "approved" || action === "rejected") {
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => {
                return (
                    {
                        RFID_Timestamp: el.TIMESTAMP,
                        Asset_Id: el.ALDERAN,
                        RFID: el.RFID,
                        AQID: el.AQID,
                        Raw_AQID: el.Raw_Aqid,
                        Mapped_AQID: el.Mapped_Aqid,
                        Short_Name: el.Short_Name,
                        Serial_Number: el.SERNR,
                        MFR: el.MFR,
                        EQ_Name: el.Equipment_Name,
                        Asset_Own: el.ASSETOWN,
                        CM: el.CM,
                        Site: el.SITE,
                        CM_Program: el.ZALDR_CMPROGRAM,
                        Asset_Status: el.STATUS,
                        Timestamp_3DV: el.createdAt,
                        Line_ID: el.LineId,
                        Override_lineId: el.Override_LineId,
                        Line_Type: el.LineType,
                        UPH: el.Uph,
                        Version: el.Version_Id,
                        Transfer_Flag: request.data.Transfer_Flag,
                        To_CM: el.To_CM,
                        To_Site: el.To_Site,
                        To_Program: el.To_Program,
                        To_Business_Grp: el.Tp_Business_Grp,
                        Comments: el.Comments,
                        CarryOverAqid: el.CarryOverAqid,
                        CarryOverEqName: el.CarryOverEqName,
                        Approval_Status: capitalizeFirstLetter(action),
                        Submit_Date: el.Submit_Dte,
                        Submit_By: el.Submit_By,
                        Review_Date: el.Review_Date,
                        Reviewed_By: el.Reviewed_By,
                        CarryOverOldProgram: el.CarryOverOldProgram,
                        To_GHSite: el.To_GHSite
                    }
                )
            })
        }
        else if (action === "clear") {
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => convertToHaveApprovalStatusReset(el))
        }
        else if (action === "reset") {
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.filter(el => {
                if (el.Approval_Status.toLowerCase().trim() === "approved") {
                    return true;
                }
                return false;
            })
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => {
                return (
                    {
                        RFID_Timestamp: el.TIMESTAMP,
                        Asset_Id: el.ALDERAN,
                        RFID: el.RFID,
                        AQID: el.AQID,
                        Raw_AQID: el.Raw_Aqid,
                        Mapped_AQID: el.Mapped_Aqid,
                        Short_Name: el.Short_Name,
                        Serial_Number: el.SERNR,
                        MFR: el.MFR,
                        EQ_Name: el.Equipment_Name,
                        Asset_Own: el.ASSETOWN,
                        CM: el.CM,
                        Site: el.SITE,
                        CM_Program: el.ZALDR_CMPROGRAM,
                        Asset_Status: el.STATUS,
                        Timestamp_3DV: el.createdAt,
                        Line_ID: el.LineId,
                        Override_lineId: el.Override_LineId,
                        Line_Type: el.LineType,
                        UPH: el.Uph,
                        Version: el.Version_Id,
                        Transfer_Flag: request.data.Transfer_Flag,
                        To_CM: el.To_CM,
                        To_Site: el.To_Site,
                        To_Program: el.To_Program,
                        To_Business_Grp: el.Tp_Business_Grp,
                        Comments: el.Comments,
                        CarryOverAqid: el.CarryOverAqid,
                        CarryOverEqName: el.CarryOverEqName,
                        Approval_Status: "Pending",
                        Submit_Date: el.Submit_Dte,
                        Submit_By: el.Submit_By,
                        Review_Date: el.Review_Date,
                        Reviewed_By: el.Reviewed_By,
                        CarryOverOldProgram: el.CarryOverOldProgram,
                        To_GHSite: el.To_GHSite
                    }
                )
            })
        }
        LOG.info(`sending ${selectedRecordsToMassUpdate.length} for mass update`);

        await srv.post(rfid_tt_action, { RfidData: selectedRecordsToMassUpdate, auth: request.headers.authorization })
    })

    srv.on("resyncAlderaan", async (request) => {
        const LOG = cds.log(getuuid(request), { label: 'resyncAlderaan' });
        LOG.info("in resyncAlderaan");
        let selectedRecordsToMassUpdate = await cds.run(`SELECT * FROM V_RFIDDETAILS as t1 where 
        t1.LATEST_UPDATE_TS is not null and not (t1.LATEST_UPDATE_TS='')
        and ((not (t1.TABLE_UPDATE_TS=t1.LATEST_UPDATE_TS) or (t1.TABLE_UPDATE_TS is null)))
        and t1.approval_status = 'Approved' and t1.mapped_aqid is not null
        `);
        if (selectedRecordsToMassUpdate.length > 0) {
            selectedRecordsToMassUpdate = await cds.run(`SELECT * FROM V_RFIDDETAILS as t1 where 
            t1.LATEST_UPDATE_TS is not null and not (t1.LATEST_UPDATE_TS='')
            and ((not (t1.TABLE_UPDATE_TS=t1.LATEST_UPDATE_TS) or (t1.TABLE_UPDATE_TS is null and t1.LATEST_UPDATE_TS is not null)))
            and t1.approval_status = 'Approved' and t1.mapped_aqid is not null
            `)
            if (selectedRecordsToMassUpdate.length > 0) {
                selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => convertToHaveApprovalStatusPending(el))
            }
            let selectedRecordsToMassUpdate2 = await cds.run(`SELECT * FROM V_RFIDDETAILS as t1 where 
                t1.LATEST_UPDATE_TS is not null and not (t1.LATEST_UPDATE_TS='')
                and ((not (t1.TABLE_UPDATE_TS=t1.LATEST_UPDATE_TS) or (t1.TABLE_UPDATE_TS is null)))
                and t1.approval_status = 'Approved' and t1.mapped_aqid is null
                `)
            if (selectedRecordsToMassUpdate2.length > 0) {
                selectedRecordsToMassUpdate2 = selectedRecordsToMassUpdate2.map(el => convertToHaveApprovalStatusReset(el));
                selectedRecordsToMassUpdate = [...selectedRecordsToMassUpdate, ...selectedRecordsToMassUpdate2]

            }
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => appendResetFlagValueToAllRecords(el, "Reset-Aldr"))
            try {
                await srv.post(rfid_tt_action, { RfidData: selectedRecordsToMassUpdate, auth: request.headers.authorization })
            }
            catch (err) {
                LOG.info("updating changed alderan details throws a failure: ", err.response?.data || err.response || err.data || err)
            }

            let tx = hdb.tx();
            try {
                await tx.run(`
                UPDATE COM_APPLE_COA_T_COA_RFID_TT as t1
                set t1.TABLE_UPDATE_TS=(SELECT max(LATEST_UPDATE_TS) from V_RFIDDETAILS as t2 where
                    cast(t1.asset_id as varchar)=cast(t2.alderan as varchar)
                    and t1.aqid=t2.aqid
                    and t1.SAP_CM_Site=t2.SAP_CM_Site
                )
                `);
                await tx.commit();
            }
            catch (err) {
                await tx.rollback();
                LOG.info("updating table mapped_aqid failed: ", err.response?.data || err.response || err.data || err)
            }

            await resyncCOCount(LOG);


        }
        else {
            let tx = hdb.tx();
            try {

                await tx.run(`
                UPDATE COM_APPLE_COA_T_COA_RFID_TT as t1
                set t1.TABLE_UPDATE_TS=(SELECT max(LATEST_UPDATE_TS) from V_RFIDDETAILS as t2 where
                    cast(t1.asset_id as varchar)=cast(t2.alderan as varchar)
                    and t1.aqid=t2.aqid
                    and t1.SAP_CM_Site=t2.SAP_CM_Site
                )
                `);
                await tx.commit();
            }
            catch (err) {
                await tx.rollback();
                LOG.info("updating table mapped_aqid failed: ", err.response?.data || err.response || err.data || err)
            }
            await resyncCOCount(LOG);
        }

        await clearRecordsWhereMappedAQIDisNull(request, LOG);
    })

    async function clearRecordsWhereMappedAQIDisNull(request, LOG) {
        let selectedRecordsToMassUpdate = await cds.run(`SELECT * FROM V_RFIDDETAILS as t1 where 
        t1.mapped_aqid is null
        and (t1.approval_status = 'Approved' or t1.approval_status='Pending')
        `)

        if (selectedRecordsToMassUpdate.length > 0) {
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => convertToHaveApprovalStatusReset(el))


            try {
                await srv.post(rfid_tt_action, { RfidData: selectedRecordsToMassUpdate, auth: request.headers.authorization })
            }
            catch (err) {
                LOG.info("There was some error while resyncing: ", err.response?.data || err.response || err.data || err)
            }


            let tx = hdb.tx();
            try {
                await tx.run(`
                UPDATE COM_APPLE_COA_T_COA_RFID_TT as t1
                set t1.mapped_aqid=(SELECT max(mapped_aqid) from V_RFIDDETAILS as t2 where
                    cast(t1.asset_id as varchar)=cast(t2.alderan as varchar)
                    and t1.aqid=t2.aqid
                    and t1.SAP_CM_Site=t2.SAP_CM_Site
                )
                `);
                await tx.commit();
            }
            catch (err) {
                await tx.rollback();
                LOG.info("updating table mapped_aqid for blank mapped_aqid failed: ", err.response?.data || err.response || err.data || err)
            }

            await resyncCOCount(LOG);
        }
    }

    function convertToHaveApprovalStatusPending(el) {
        {
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
                    To_GHSite: el.TO_GHSITE
                }
            )
        }
    }

    function convertToHaveApprovalStatusReset(el) {
        {
            return (
                {
                    RFID_Timestamp: el.TIMESTAMP,
                    Asset_Id: el.ALDERAN,
                    RFID: el.RFID,
                    AQID: el.AQID,
                    Raw_AQID: el.Raw_Aqid,
                    Mapped_AQID: el.Mapped_Aqid,
                    Short_Name: el.Short_Name,
                    Serial_Number: el.SERNR,
                    MFR: el.MFR,
                    EQ_Name: el.Equipment_Name,
                    Asset_Own: el.ASSETOWN,
                    CM: el.CM,
                    Site: el.SITE,
                    CM_Program: el.ZALDR_CMPROGRAM,
                    Asset_Status: el.STATUS,
                    Timestamp_3DV: el.createdAt,
                    Line_ID: el.LineId,
                    Override_lineId: el.Override_LineId,
                    Line_Type: el.LineType,
                    UPH: el.Uph,
                    Version: el.Version_Id,
                    Transfer_Flag: el.Transfer_Flag,
                    To_CM: "",
                    To_Site: "",
                    To_Program: "",
                    To_Business_Grp: "",
                    Comments: "",
                    CarryOverAqid: el.CarryOverAqid,
                    CarryOverEqName: el.CarryOverEqName,
                    Approval_Status: capitalizeFirstLetter("pending"),
                    Submit_Date: el.Submit_Dte,
                    Submit_By: el.Submit_By,
                    Review_Date: el.Review_Date,
                    Reviewed_By: el.Reviewed_By,
                    CarryOverOldProgram: el.CarryOverOldProgram,
                    To_GHSite: ""
                }
            )
        }
    }

    function appendResetFlagValueToAllRecords(el, val) {
        el["Reset_Flag"] = val;
        return el;
    }

    srv.on("resyncMappedAqid", async (request) => {
        const LOG = cds.log(getuuid(request), { label: 'resyncMappedAqid' });
        LOG.info("in resyncMappedAqid");
        let selectedRecordsToMassUpdate = await cds.run(`SELECT * FROM V_RFIDDETAILS as t1 where 
        (t1.MAPPED_AQID is not null 
        and (not (t1.MAPPED_AQID=t1.TABLE_MAPPED_AQID)) or t1.TABLE_MAPPED_AQID is null)
        and t1.MAPPED_AQID in ('Multiple NB Found','Not Found','')
        and t1.approval_status = 'Approved'
        `)


        if (selectedRecordsToMassUpdate.length > 0) {


            try {
                await cds.run(`UPDATE COM_APPLE_COA_T_COA_RFID_TT
                set approval_status = 'Pending',reset_flag='Rst-MapAqid'
                where asset_id in (SELECT t1.alderan as asset_id FROM V_RFIDDETAILS as t1 where 
                    (t1.MAPPED_AQID is not null 
                    and (not (t1.MAPPED_AQID=t1.TABLE_MAPPED_AQID)) or t1.TABLE_MAPPED_AQID is null)
                    and t1.MAPPED_AQID in ('Multiple NB Found','Not Found','')
                    and t1.approval_status = 'Approved')
                `)
            }
            catch (err) {
                LOG.info("There was some error thrown while resyncing mapped-aqid: ", err.response?.data || err.response || err.data || err)
            }
            await resyncCOCount(LOG);
        }

        selectedRecordsToMassUpdate = await cds.run(`SELECT * FROM V_RFIDDETAILS as t1 where 
        (t1.MAPPED_AQID is not null 
        and (not (t1.MAPPED_AQID=t1.TABLE_MAPPED_AQID)) or t1.TABLE_MAPPED_AQID is null)
        and t1.approval_status = 'Approved'
        `)


        if (selectedRecordsToMassUpdate.length > 0) {
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => convertToHaveApprovalStatusPending(el))
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => appendResetFlagValueToAllRecords(el, "Rst-MapAqid"))


            try {
                await srv.post(rfid_tt_action, { RfidData: selectedRecordsToMassUpdate, auth: request.headers.authorization, resyncMappedAqidFlag: true })
            }
            catch (err) {
                LOG.info("There was some error thrown while resyncing mapped-aqid: ", err.response?.data || err.response || err.data || err)
            }
            await resyncCOCount(LOG);
        }

        selectedRecordsToMassUpdate = await cds.run(`SELECT * FROM V_RFIDDETAILS as t1 where 
        t1.mapped_aqid is null
        and (t1.approval_status = 'Approved' or t1.approval_status='Pending')
        `)





        if (selectedRecordsToMassUpdate.length > 0) {
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => convertToHaveApprovalStatusReset(el))
            selectedRecordsToMassUpdate = selectedRecordsToMassUpdate.map(el => appendResetFlagValueToAllRecords(el, "Reset-3DV"))

            try {
                await srv.post(rfid_tt_action, { RfidData: selectedRecordsToMassUpdate, auth: request.headers.authorization, resyncMappedAqidFlag: true })
            }
            catch (err) {
                LOG.info("There was some error while resyncing: ", err.response?.data || err.response || err.data || err)
            }


            let tx = hdb.tx();
            try {
                await tx.run(`
                UPDATE COM_APPLE_COA_T_COA_RFID_TT as t1
                set t1.mapped_aqid=(SELECT max(mapped_aqid) from V_RFIDDETAILS as t2 where
                    cast(t1.asset_id as varchar)=cast(t2.alderan as varchar)
                    and t1.aqid=t2.aqid
                    and t1.SAP_CM_Site=t2.SAP_CM_Site
                )
                `);
                await tx.commit();
            }
            catch (err) {
                await tx.rollback();
                LOG.info("updating table mapped_aqid failed: ", err.response?.data || err.response || err.data || err)
            }
            await resyncCOCount(LOG);
        }



    })

    function validate_data(action, request, GHSiteValidityCheck, LOG) {
        if (action !== "pending" && action !== "approved" && action !== "rejected" && action !== "clear" && action != "reset") {
            LOG.info(`The provided action is not valid`);
            request.reject(400, `The provided action is not valid`);
        }
        if (GHSiteValidityCheck.length <= 0 && (action === "pending")) {
            LOG.info("Entered GH Site is invalid");
            request.reject(400, `Entered GH Site is invalid`);
        }
        if ((!request.data.To_Business_Grp || request.data.To_Business_Grp === '') && (action === "pending")) {
            LOG.info("To Business Group cannot be empty");
            request.reject(400, `To Business Group cannot be empty`);
        }
        if ((!request.data.Comment || request.data.Comment === '') && (action === "pending")) {
            LOG.info("Comment cannot be empty");
            request.reject(400, `Comment cannot be empty`);
        }
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

    function isJobScheduler(jwtdetails) {
        return (jwtdetails.scope.map(el => el.indexOf(`JobScheduler`) >= 0).reduce((acc, cv) => { return (acc || cv) }));
    }

    function getallowedAttributes(jwtdetails, request) {
        const LOG = request.req.params["LOG"];
        let RoleNames;
        if (isJobScheduler(jwtdetails)) {
            RoleNames = {
                "xs.rolecollections": [
                    "UX:IGB_COA_ADMIN_RESTRICTED"
                ]
            }
        }
        else {
            RoleNames = jwtdetails['xs.system.attributes'];
        }
        let usrScope = [];
        for (let scope of jwtdetails.scope) {
            usrScope.push(scope.split('.')[1]);
        }
        let ScopesRelevantToThisApp = [`RfidOnHandTTModify`, `RfidOnHandTTReadOnly`, `SyncActionAll`, `ApproveRfidOnHandTT`]
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

        addToAllowedAttributes(ScopesRelevantToThisApp, RoleNames, allowedAttributes, srvCred, usrScope);
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


    function getFilterString(obj, LOG) {
        let arr = [];
        if (obj[`$unrestricted-$unrestricted`] !== undefined) return '';
        Object.keys(obj).forEach(key => {
            let tmparr = [];
            if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`CM='${key.slice(0, key.indexOf('-'))}'`);
            if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
            if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
            arr.push(tmparr[0]);
            tmparr = [];
            if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`TO_CM='${key.slice(0, key.indexOf('-'))}'`);
            if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`TO_SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
            if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
            arr.push(tmparr[0]);
        });
        if (arr.length > 0) {
            let str = `(${arr.join(") or (")})`;
            LOG.info("str: ", str);
            return str;
        }
        else {
            return (`((CM='NULL' and SITE='NULL') or (TO_CM='NULL' and TO_SITE='NULL'))`);
        }
    }

    function AuthorizationCheck(record, allowed_cmsite) {
        let result_value = true;
        if (Object.keys(allowed_cmsite).length !== 0) {
            result_value = (allowed_cmsite[`${record.CM}-${record.Site}`] !== undefined ||
                allowed_cmsite[`$unrestricted-${record.Site}`] !== undefined ||
                allowed_cmsite[`${record.CM}-$unrestricted}`] !== undefined ||
                allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? false : true;
        }
        return result_value;
    }



    async function determineDeletionTable(tx, LOG, tableName) {
        
        switch (tableName) {
            case "COM_APPLE_COA_T_COA_LINE_SUMMARY":
                await lineSummaryDeletion(tx, LOG);
                break;
            case "COM_APPLE_COA_T_COA_LINE_BRING_UP":
                await lineBringUpDeletion(tx, LOG);
                break;
            case "COM_APPLE_COA_T_COA_STATION_SUMMARY":
                await stationSummaryDeletion(tx, LOG);
                break;
            case "COM_APPLE_COA_T_COA_NONRFID_TT":
                await nonRfidTTDeletion(tx, LOG);
                break;
            case "COM_APPLE_COA_T_COA_SIMULATION_H":
                await simulationDeletion(tx, LOG);
                break;
            case "COM_APPLE_COA_T_COA_SIMU_NONRFID":
                await simuNonRfidDeletion(tx, LOG);
                break;
            case "COM_APPLE_COA_T_COA_SUBLINE":
                await sublineDeletion(tx, LOG);
                break;

            default:
                break;
        }
    }


    async function lineSummaryDeletion(tx, LOG) {
        try {
            const recDeleted = await tx.run(`
            SELECT *
            FROM 
                (SELECT 
                    *,
                    Row_Number() OVER( PARTITION BY 
                    CM,
                    SITE,
                    trim(LINE),
                    UPH,
                    STATION,
                    PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
                FROM COM_APPLE_COA_T_COA_LINE_SUMMARY
            )
            AS t2 where rn > 1`)

            LOG.info(JSON.stringify(recDeleted));

             await tx.run(`
            DELETE FROM COM_APPLE_COA_T_COA_LINE_SUMMARY AS t1
            WHERE EXISTS (SELECT *
                FROM 
                    (SELECT 
                        CM,
                        SITE,
                        LINE,
                        UPH,
                        STATION,
                        PROGRAM,
                        Row_Number() OVER( PARTITION BY 
                        CM,
                        SITE,
                        trim(LINE),
                        UPH,
                        STATION,
                        PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
                    FROM COM_APPLE_COA_T_COA_LINE_SUMMARY
                )
                AS t2
            WHERE t2.rn > 1
                AND t2.CM = t1.CM
                AND t2.Site = t1.Site
                AND t2.line = t1.line
                AND t2.uph = t1.uph
                AND t2.station = t1.station
                AND t2.program = t1.program)`)

            LOG.info('Deletion of Line Summary Completed');




        } catch (error) {
            await tx.rollback();
            LOG.info('Deletion of Line Summary Failed', error);
        }
    }
    async function lineBringUpDeletion(tx, LOG) {
        try {
            const recDeleted = await tx.run(`
            SELECT  *
            FROM 
                (SELECT 
                    *,
                    Row_Number() OVER( PARTITION BY 
                    CM,
                    SITE,
                    UPH,
                    trim(LINE),
                    STATION,
        
                    PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
                FROM COM_APPLE_COA_T_COA_LINE_BRING_UP
            ) AS t2 where rn > 1`)

            LOG.info(JSON.stringify(recDeleted));
             await tx.run(`
            DELETE FROM COM_APPLE_COA_T_COA_LINE_BRING_UP AS t1
            WHERE EXISTS (SELECT *
                FROM 
                    (SELECT 
                        CM,
                        SITE,
                        LINE,
                        STATION,
                        UPH,
                        PROGRAM,
                        Row_Number() OVER( PARTITION BY 
                        CM,
                        SITE,
                        UPH,
                        trim(LINE),
                        STATION,
                        PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
                    FROM COM_APPLE_COA_T_COA_LINE_BRING_UP
                )
                AS t2
            WHERE t2.rn > 1
                AND t2.CM = t1.CM
                AND t2.Site = t1.Site
                AND t2.line = t1.line
                AND t2.station = t1.station
                AND t2.uph = t1.uph
                AND t2.program = t1.program)`)

            LOG.info('Deletion of Line BringUp Completed');





        } catch (error) {
            await tx.rollback();
            LOG.info('Deletion of Line BringUp Failed', error);
        }
    }
    async function stationSummaryDeletion(tx, LOG) {
        try {
            const recDeleted = await tx.run(`
            SELECT *
            FROM 
                (SELECT 
                    *,
                    Row_Number() OVER( PARTITION BY 
                    CM,
                    SITE,
                    trim(LINE),
                    STATION,
                    PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
                FROM COM_APPLE_COA_T_COA_STATION_SUMMARY
            )
            AS t2 where rn > 1`);

            LOG.info(JSON.stringify(recDeleted));

            await tx.run(`
            DELETE FROM COM_APPLE_COA_T_COA_station_SUMMARY AS t1
            WHERE EXISTS (SELECT *
                FROM 
                    (SELECT 
                        CM,
                        SITE,
                        LINE,
                        STATION,
                        PROGRAM,
                        Row_Number() OVER( PARTITION BY 
                        CM,
                        SITE,
                        trim(LINE),
                        STATION,
                        PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
                    FROM COM_APPLE_COA_T_COA_station_SUMMARY
                )
                AS t2
            WHERE t2.rn > 1
                AND t2.CM = t1.CM
                AND t2.Site = t1.Site
                AND t2.line = t1.line
                AND t2.station = t1.station
                AND t2.program = t1.program)`);

            LOG.info('Deletion of Station Summary Completed');





        } catch (error) {
            await tx.rollback();
            LOG.info('Deletion of Station Summary Failed', error);
        }
    }
    async function nonRfidTTDeletion(tx, LOG) {
        try {
            const recDeleted = await tx.run(`
            SELECT *
            FROM 
                (SELECT 
                *,
                    Row_Number() OVER( PARTITION BY 
                    CM,
                    SITE,
                    trim(LINE_TYPE),
                    AQID,
                    SCOPE,
                    LINE_ID,
                    GROUP_PRIORITY,
                    SEQUENCE_NO,
                    MFR,
                    STATION,
                    UPH,
                    PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
                FROM COM_APPLE_COA_T_COA_NONRFID_TT
            )
            AS t2 where rn > 1
        `);

            LOG.info(JSON.stringify(recDeleted));

            await tx.run(`
DELETE FROM COM_APPLE_COA_T_COA_NONRFID_TT AS t1
WHERE EXISTS (SELECT *
	FROM 
		(SELECT 
			CM,
			SITE,
			LINE_TYPE,
			AQID,
			SCOPE,
			LINE_ID,
			GROUP_PRIORITY,
			SEQUENCE_NO,
			MFR,
			STATION,
			UPH,
			PROGRAM,
			Row_Number() OVER( PARTITION BY 
			CM,
			SITE,
			trim(LINE_TYPE),
			AQID,
			SCOPE,
			LINE_ID,
			GROUP_PRIORITY,
			SEQUENCE_NO,
			MFR,
			STATION,
			UPH,
			PROGRAM ORDER BY MODIFIEDAT desc ) AS rn
		FROM COM_APPLE_COA_T_COA_NONRFID_TT
	)
	AS t2
WHERE t2.rn > 1
	AND t2.CM = t1.CM
	AND t2.Site = t1.Site
	AND t2.line_type = t1.line_type
	AND t2.station = t1.station
	AND t2.uph = t1.uph
	AND t2.program = t1.program
	and t2.mfr = t1.mfr
	and t2.SEQUENCE_NO = t1.SEQUENCE_NO
	and t2.GROUP_PRIORITY = t2.GROUP_PRIORITY
	and t2.AQID = t1.aqid
	and t2.SCOPE = t1.scope
	and t2.LINE_ID = t1.LINE_ID
)`);

            LOG.info('Deletion of nonRfidTT Completed');




        } catch (error) {
            await tx.rollback();
            LOG.info('Deletion of nonRfidTT Failed', error);
        }
    }
    async function simulationDeletion(tx, LOG) {
        try {
            const recDeleted = await tx.run(`
            SELECT *
            FROM 
                (SELECT 
                *,
                    Row_Number() OVER( PARTITION BY 
                    SIMULATION_NAME,
                    FROM_GHSITE,
                    CM,
                    SITE,
                    PROGRAM,
                    LINE_ID,
                    trim(LINE_TYPE) ORDER BY MODIFIEDAT desc ) AS rn
                FROM COM_APPLE_COA_T_COA_SIMULATION_H
            )
            AS t2 where rn > 1`);
            LOG.info(JSON.stringify(recDeleted));
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMULATION_H AS t1
WHERE EXISTS (SELECT *
	FROM 
		(SELECT 
			SIMULATION_NAME,
			FROM_GHSITE,
			CM,
			SITE,
			PROGRAM,
			LINE_ID,
			LINE_TYPE,
			Row_Number() OVER( PARTITION BY 
			SIMULATION_NAME,
			FROM_GHSITE,
			CM,
			SITE,
			PROGRAM,
			LINE_ID,
			trim(LINE_TYPE)
			ORDER BY MODIFIEDAT desc ) AS rn
		FROM COM_APPLE_COA_T_COA_SIMULATION_H
	)
	AS t2
WHERE t2.rn > 1
	AND t2.CM = t1.CM
	AND t2.Site = t1.Site
	AND t2.line_type = t1.line_type
	AND t2.program = t1.program
	and t2.LINE_TYPE = t1.LINE_TYPE
	and t2.SIMULATION_NAME = t1.SIMULATION_NAME
	and t2.FROM_GHSITE = t2.FROM_GHSITE
)`);



        } catch (error) {
            await tx.rollback();
            LOG.info('Deletion of Simulation Header Failed', error);
        }
    }
    async function simuNonRfidDeletion(tx, LOG) {
        try {

            const recDeleted = await tx.run(`
            SELECT *
            FROM 
                (SELECT *,
                    Row_Number() OVER( PARTITION BY 
                        SIMULATION_NAME,
                    GH_SITE,
                    CM,
                    SITE,
                    PROGRAM,
                    LINE_ID,
                    trim(LINE_TYPE),
                    STATION,
                    AQID,
                    MAPPED_AQID,
                    GROUP_PRIORITY,
                    SCOPE,
                    UPH,
                    MFR,
                    SEQUENCE_NO
                    ORDER BY MODIFIEDAT desc ) AS rn from COM_APPLE_COA_T_COA_SIMU_NONRFID
            )
            AS t2 where rn > 1
        `);

        LOG.info(JSON.stringify(recDeleted));


            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMU_NONRFID AS t1
            WHERE EXISTS (SELECT *
                FROM 
                    (SELECT 
                        SIMULATION_NAME,
                        GH_SITE,
                        CM,
                        SITE,
                        PROGRAM,
                        LINE_ID,
                        LINE_TYPE,
                        STATION,
                        AQID,
                        MAPPED_AQID,
                        GROUP_PRIORITY,
                        SCOPE,
                        UPH,
                        MFR,
                        SEQUENCE_NO,
                        Row_Number() OVER( PARTITION BY 
                            SIMULATION_NAME,
                        GH_SITE,
                        CM,
                        SITE,
                        PROGRAM,
                        LINE_ID,
                        trim(LINE_TYPE),
                        STATION,
                        AQID,
                        MAPPED_AQID,
                        GROUP_PRIORITY,
                        SCOPE,
                        UPH,
                        MFR,
                        SEQUENCE_NO
                        ORDER BY MODIFIEDAT desc ) AS rn
                    FROM COM_APPLE_COA_T_COA_SIMU_NONRFID
                )
                AS t2
            WHERE t2.rn > 1
            and	t2.SIMULATION_NAME	= t1.SIMULATION_NAME
            and	t2.GH_SITE		= t1.GH_SITE
            and	t2.CM		= t1.CM
            and	t2.SITE		= t1.SITE
            and	t2.PROGRAM		= t1.PROGRAM
            and	t2.LINE_ID		= t1.LINE_ID
            and	t2.LINE_TYPE		= t1.LINE_TYPE
            and	t2.STATION		= t1.STATION
            and	t2.AQID		= t1.AQID
            and	t2.MAPPED_AQID		= t1.MAPPED_AQID
            and	t2.GROUP_PRIORITY		= t1.GROUP_PRIORITY
            and	t2.SCOPE		= t1.SCOPE
            and	t2.UPH		= t1.UPH
            and	t2.MFR		= t1.MFR
            and	t2.SEQUENCE_NO		= t1.SEQUENCE_NO)`);

            LOG.info('Deletion of Non Rfid Simulation Completed');





        } catch (error) {
            await tx.rollback();
            LOG.info('Deletion of Station Summary Failed', error);
        }
    }
    async function sublineDeletion(tx, LOG) {
        try {
            const recDeleted = await tx.run(`
            SELECT *
            FROM 
                (SELECT *,
                    Row_Number() OVER( PARTITION BY 
                    CM,
                    SITE,
                    PROGRAM,
                    trim(SUB_LINE_NAME),
                    UPH
                    ORDER BY MODIFIEDAT desc ) AS rn from COM_APPLE_COA_T_COA_SUBLINE
            )
            AS t2 where rn > 1`);

            LOG.info(JSON.stringify(recDeleted));

            await tx.run(`
            DELETE FROM COM_APPLE_COA_T_COA_SUBLINE AS t1
WHERE EXISTS (SELECT *
	FROM 
		(SELECT 
			CM,
			SITE,
			PROGRAM,
			SUB_LINE_NAME,
			UPH,
			Row_Number() OVER( PARTITION BY 
			CM,
			SITE,
			PROGRAM,
			trim(SUB_LINE_NAME),
			UPH
			ORDER BY MODIFIEDAT desc ) AS rn
		FROM COM_APPLE_COA_T_COA_SUBLINE
	)
	AS t2
WHERE t2.rn > 1
and	t2.CM		= t1.CM
and	t2.SITE		= t1.SITE
and	t2.PROGRAM		= t1.PROGRAM
and	t2.UPH		= t1.UPH
and	t2.SUB_LINE_NAME		= t1.SUB_LINE_NAME
)`);

            LOG.info('Deletion of Subline Completed');




        } catch (error) {
            await tx.rollback();
            LOG.info('Deletion of Subline Failed', error);
        }
    }



}
)