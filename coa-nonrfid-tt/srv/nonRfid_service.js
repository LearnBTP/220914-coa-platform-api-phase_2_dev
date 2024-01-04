const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");
const csv = require("csv-parser");
const fs = require("fs");

module.exports = cds.service.impl(async (srv) => {
    const
        {
            nonrfid_tt_action,
            nonRfidTT,
            Upload_Nonrfid
        } = srv.entities;
    const statusObj = {
        save: 'Pending', approve: 'Approved', reject: 'Rejected', cancel: 'Cancel', reset: 'Reset',
        mreset: 'reset', mapprove: 'Approved', mreject: 'Rejected', mcancel: 'Cancel'
    }
    let before_data = [];
    let completed = false;
    let somethingToInsert = false;
    let projection = {};
    projection.projection_insert = [];
    projection.projection_delete = [];
    let glb_auth;
    let hdb = await cds.connect.to("db");
    srv.on("SyncNonRFIDTT", async (request) => {

        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'SyncNonRFIDTT' });
        try {
            const tx = hdb.tx();
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));

            let allowedAttribute = getAllowedAttributes(jwtdetails, request, LOG);
            if (allowedAttribute.length === 0) {
                cds.context.http.res.status(200).send(JSON.stringify({ msg: "Not Authorized" }));
            }
            else {

                // Update Sync Status

                let allGHSitePgm = await fetchValidSites4Processing(request, allowedAttribute, tx);

                if (allGHSitePgm.length > 0) {
                    let keys = await getGHSitesAndUpdateSyncTable(allGHSitePgm, uuid, request, jwtdetails);
                    // build response based on keys.InProg
                    let final_message = get_message(keys);
                    cds.context.http.res.status(200).send(JSON.stringify({ msg: final_message }));
                    try {
                        await asyncProcessingLogic(tx, jwtdetails, uuid, keys, LOG);
                    } catch (err) {
                        LOG.info(JSON.stringify(err.message));
                    }

            } else {
                try {
                    let where = '';
                    where = build_where_clause (request, where);
                    if (where != '') {
                        await tx.run(`UPDATE COM_APPLE_COA_T_COA_SYNC_STATUS set  Status = 'Success',
                        Error = '' where ${where}`);
                        where = where_with_allowedattri(allowedAttribute, where);
                        await tx.run(`DELETE from COM_APPLE_COA_T_COA_NONRFID_TT where ${where}`)
                        await tx.commit();
                        cds.context.http.res.status(200).send(JSON.stringify({ msg: "No Data Exist" }));
                    }
                } catch (err_else) {
                    await tx.rollback();
                    LOG.info(uuid + JSON.stringify(err_else.message));
                }

            }
        }
        } catch (error_syn) {
            LOG.info(JSON.stringify(error_syn.message));
        }
    });
    
    function build_where_clause (request, where){
        if (request.data.request && request.data.request.GH_Site) {
            where = prepareArray4where(where, request.data.request.GH_Site, 'GH_Site');
        }
        if (request.data.request && request.data.request.Program_Org) {
            where = prepareArray4where(where, request.data.request.Program_Org, 'Program');
        }
        return where;
    }

    function where_with_allowedattri(allowedAttribute, where) {
        if (!(allowedAttribute.includes('$unrestricted-$unrestricted'))) {
            where = prepareArray4where(where, allowedAttribute, 'SAP_CM_Site');
        }
        return where;
    }

    function get_message(keys) {
        let msg;
        if (keys.InProg.length > 0) {
            msg = keys.InProg;
        } else {
            msg = "Processing Started";
        }
        return msg;
    }

    async function getGHSitesAndUpdateSyncTable(allGHSitePgm, uuid, request, jwtdetails) {
        let sync_status = [], validGHSitePgm = [];
        const tx_sync = hdb.tx();
        let site = {}, pgm = {}, keys = { gh_site: [], Program: [], InProg: {} };
        let Sync_Status = await tx_sync.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SYNC_STATUS").where({
            APP: 'NonRfidTT'
        }));
        let RoleNames = jwtdetails['xs.system.attributes'];
        let admin = RoleNames["xs.rolecollections"].find(e => e === "COA_ADMIN_T");
        for (let Rec of allGHSitePgm) {
            let sync_rec = {};
            let inProcess = Sync_Status.find(el => el.GH_SITE === Rec.GH_Site && el.Program === Rec.Program && el.STATUS === 'In Progress');
            if (inProcess === undefined && admin === undefined) {
                validGHSitePgm.push(Rec);
                let exist = sync_status.find(el => (el.GH_SITE === Rec.GH_Site && el.PROGRAM === Rec.Program))
                if (exist === undefined) {
                    sync_rec.ID = uuid;

                    sync_rec.CREATEDAT = new Date().toISOString();
                    sync_rec.CREATEDBY = request.user.id;
                    sync_rec.CREATEDBY_NAME = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
                    sync_rec.CREATEDBY_MAIL = String(jwtdetails.email);
                    sync_rec.GH_SITE = Rec.GH_Site;
                    sync_rec.APP = "NonRfidTT";
                    sync_rec.STATUS = 'In Progress';
                    sync_rec.PROGRAM = Rec.Program;
                    sync_status.push(sync_rec);
                    site[Rec.GH_Site] = Rec.GH_Site;
                    pgm[Rec.Program] = Rec.Program;
                }
            } else {
                keys.InProg.push(Rec); // keep unique rec
            }
        }
        keys.Program = Object.keys(pgm);
        keys.gh_site = Object.keys(site);
        keys.validGHSitePgm = validGHSitePgm;
        if (keys.gh_site.length > 0) {
            tx_sync.run(DELETE.from("COM_APPLE_COA_T_COA_SYNC_STATUS").where({
                APP: "NonRfidTT",
                GH_SITE: { in: keys.gh_site },
                PROGRAM: { in: keys.Program }
            }));

        }
        if (sync_status.length > 0) {
            await tx_sync.run(INSERT.into("COM_APPLE_COA_T_COA_SYNC_STATUS").entries(sync_status));
            await tx_sync.commit();
        }
        return keys;
    }

    async function asyncProcessingLogic(tx, jwtdetails, uuid, keys, LOG) {
        let allGHSitePgm = keys.validGHSitePgm

        for (let key of allGHSitePgm) {
            try {
                let ReqTableData = await fetch_dbOldData_4_Gh_Site(key, tx);
                LOG.info(`${key.GH_Site} : ${key.Program} : Processing started`);
                let ReqTabMap = getMaps(ReqTableData, LOG);
                await startAsyncCalls4GHSite(ReqTabMap, ReqTableData, uuid, jwtdetails, key, LOG);
            } catch (err) {
                await tx.rollback();
                LOG.info(':asyncProcessingLogic:' + key.GH_Site + key.Program + JSON.stringify(err.message));
                UpdateSyncTable(uuid, 'Processing failed', 'Error', key);
            }
        }

    }
    async function startAsyncCalls4GHSite(ReqTabMap, ReqTableData, uuid, jwtdetails, CurrKeys, LOG) {

        let tx = hdb.tx();

        let newDbUpdates = { NonRfid_tt: [], NonRfid_tt_DelKeys: [], COAOUtput_Insert: [], COAOutput_DeleteKeys: [], Projection_DelKey: [], Projection_Insert: [] };
        let newUpdate = { NonRfid_tt: [], NonRfid_tt_DelKeys: [], COAOUtput_Insert: [], COAOutput_DeleteKeys: [], Projection_DelKey: [], Projection_Insert: [], Existing_TTRec: {} };
        try {
            let BohQty = { BohQty: ReqTableData.BohQty };
            ReqTabMap.allRec = ReqTableData.allRec;
            ReqTabMap.OutputRec = ReqTableData.OutputRec;

            if (ReqTabMap.allRec.length > 0) {
                newUpdate = cal_Projection_per_Program(ReqTabMap, jwtdetails, BohQty, ReqTableData.Existing_ALL_TTRec, LOG);
            }
            // check approved records in existing tt rec and do the reset start--
            for (let rec of ReqTableData.Existing_ALL_TTRec) {
                let ttVerifiedRec = filter_KeyReleventDbTTRecord(rec, newUpdate.Existing_TTRec);
                if (ttVerifiedRec.length === 0 && rec.Status === 'Approved') {
                    let Output = ReqTabMap.OutputRec.find(el => el.From_GHSite === rec.GH_Site && el.From_Product === rec.Program && el.To_GHSite === rec.To_GHSite
                        && el.To_Product === rec.To_Program && el.CO_Type === "Non RFID" && el.AQID === rec.Aqid);
                    newUpdate = prepareCOOutputChanges(rec, newUpdate, Output, jwtdetails);
                }
            }
            let totOutputRec = { COAOutput_DeleteKeys: [], COAOUtput_Insert: [] };
            totOutputRec = PopulateCOAouput4GHSite(newUpdate, totOutputRec);
            newUpdate = prepareProjectionBalanceQty(ReqTableData.ProjectionData, BohQty, newUpdate, LOG);

            newDbUpdates.NonRfid_tt = newUpdate.NonRfid_tt;
            newDbUpdates.Projection_DelKey = newUpdate.Projection_DelKey;
            newDbUpdates.Projection_Insert = newUpdate.Projection_Insert;
            newDbUpdates.COAOutput_DeleteKeys = totOutputRec.COAOutput_DeleteKeys;
            newDbUpdates.COAOUtput_Insert = totOutputRec.COAOUtput_Insert;

            await insertIntoTable(newDbUpdates, tx, CurrKeys, uuid, LOG);
        } catch (error) {
            LOG.info('startAsyncCalls4GHSite:' + JSON.stringify(error.message));
            throw new Error((JSON.stringify(error.message)));
        }

    }
    function PopulateCOAouput4GHSite(newOutputData, totOutputRec) {
        for (let output of newOutputData.COAOUtput_Insert) {
            let opIdx = totOutputRec.COAOUtput_Insert.findIndex(el =>
                el.From_CM === output.From_CM && el.From_Site === output.From_Site && el.From_Product === output.From_Product && el.CO_Type === output.CO_Type
                && el.To_CM === output.To_CM && el.To_Site === output.To_Site && el.To_Product === output.To_Product && el.AQID === output.AQID);
            if (opIdx < 0) {
                output.Quantity = output.Quantity - output.subQuantity;
                if (output.Quantity < 0 || output.Quantity === null || isNaN(output.Quantity)) {
                    output.Quantity = 0;
                }
                delete output.subQuantity;
                totOutputRec.COAOUtput_Insert.push(output);
                totOutputRec.COAOutput_DeleteKeys.push({
                    From_CM: output.From_CM, From_Site: output.From_Site, From_Product: output.From_Product,
                    AQID: output.AQID, To_CM: output.To_CM, To_Site: output.To_Site, To_Product: output.To_Product, CO_Type: output.CO_Type
                });
            } else {
                totOutputRec.COAOUtput_Insert[opIdx].Quantity = totOutputRec.COAOUtput_Insert[opIdx].Quantity - output.subQuantity;
                if (totOutputRec.COAOUtput_Insert[opIdx].Quantity < 0 || totOutputRec.COAOUtput_Insert[opIdx].Quantity === null ||
                    isNaN(totOutputRec.COAOUtput_Insert[opIdx].Quantity)) {
                    totOutputRec.COAOUtput_Insert[opIdx].Quantity = 0;
                }
            }
        }
        return totOutputRec;
    }

    function filter_KeyReleventDbTTRecord(item, ReqTabMap) {
        if (item.Line_Id) {
            item.LineId = item.Line_Id;
        }
        if (item.Line_Type) {
            item.Line = item.Line_Type;
        }
        let Existing_ALL_TTRec = [];
        if (ReqTabMap[item.GH_Site] && ReqTabMap[item.GH_Site][item.Program] &&
            ReqTabMap[item.GH_Site][item.Program][item.Uph] &&
            ReqTabMap[item.GH_Site][item.Program][item.Uph][item.Station] &&
            ReqTabMap[item.GH_Site][item.Program][item.Uph][item.Station][item.Line] &&
            ReqTabMap[item.GH_Site][item.Program][item.Uph][item.Station][item.Line][item.LineId] &&
            ReqTabMap[item.GH_Site][item.Program][item.Uph][item.Station][item.Line][item.LineId][item.Aqid] &&
            ReqTabMap[item.GH_Site][item.Program][item.Uph][item.Station][item.Line][item.LineId][item.Aqid][item.Scope] &&
            ReqTabMap[item.GH_Site][item.Program][item.Uph][item.Station][item.Line][item.LineId][item.Aqid][item.Scope][item.Group_Priority]) {
            Existing_ALL_TTRec = ReqTabMap[item.GH_Site][item.Program][item.Uph][item.Station][item.Line][item.LineId][item.Aqid][item.Scope][item.Group_Priority];
        }

        return Existing_ALL_TTRec;
    }
    function getMaps(ReqTableData, LOG) {
        try {
            let keyArray = ["GH_Site", "Program", "Uph", "Station", "Line", "CM", "Site", "From_GHSite", "From_Product", "Line_Type", "Line_Id", "Aqid", "Scope", "Group_Priority"];

            let ALL_TTRecMap = {}, ProjectionMap = {};

            for (let rec1 of ReqTableData.Existing_ALL_TTRec) {
                Sync_fillMultilevel(ALL_TTRecMap, [rec1[keyArray[0]], rec1[keyArray[1]], rec1[keyArray[2]], rec1[keyArray[3]],
                rec1[keyArray[9]], rec1[keyArray[10]], rec1[keyArray[11]], rec1[keyArray[12]], rec1[keyArray[13]]], rec1)
            }
            for (let rec2 of ReqTableData.ProjectionData) {
                Sync_fillMultilevel(ProjectionMap, [rec2[keyArray[5]], rec2[keyArray[6]], rec2[keyArray[1]], rec2[keyArray[2]], rec2[keyArray[3]], rec2[keyArray[4]]], rec2)
            }

            return { ALL_TTRecMap: ALL_TTRecMap, ProjectionMap: ProjectionMap };
        } catch (error) {
            LOG.info(`getMaps Issue`)
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function Sync_fillMultilevel(map1, arr, val) {
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
                if (tillPrev[arr[i]] === undefined) {
                    tillPrev[arr[i]] = [];
                }
                tillPrev[arr[i]].push(val);
            }
        }
    }


    async function fetch_dbOldData_4_Gh_Site(keys, tx) {
        let ReqTableData = { allRec: [], CM_SiteData: {}, ProjectionData: [], Existing_ALL_TTRec: [], OutputRec: [], BohQty: [] }

        ReqTableData.allRec = await tx.run(SELECT.distinct.from("V_NONRFID").where({
            GH_Site: keys.GH_Site,
            Program: keys.Program,

        }).orderBy(
            { "GH_Site": "asc", "Program": "asc", "Uph": "asc", "Line": "asc", "Station": "asc", "Line_Priority": "asc", "LineId": "asc", "grp": "asc", "Prio": "asc", "Aqid": "asc" }
        ));

        ReqTableData.OutputRec = await tx.run(SELECT.distinct.columns(
            "From_CM", "From_Site", "From_Product", "AQID", "To_CM", "To_Site", "To_Product", "CO_Type", "From_GHSite", "To_GHSite", "From_Business_Grp",
            "To_Business_Grp", "EQ_Name", "MFR", "Quantity", "CM_Balance_Qty", "Approved_By", "Review_Date", "Status", "Comment", "SAP_CM_Site", "SAP_To_CM_Site",
            "modifiedBy_Name", "modifiedBy_mail", "createdBy_Name", "createdBy_mail", "Approved_By_Name", "Approved_By_mail", "createdAt", "createdBy", "modifiedAt",
            "modifiedBy"
        ).from("COM_APPLE_COA_T_COA_OUTPUT").where({
            From_GHSite: keys.GH_Site,
            From_Product: keys.Program,
            CO_Type: 'Non RFID'

        }));
        ReqTableData.CM_SiteData = await tx.run(SELECT.distinct.columns("CM", "Site").from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").where({
            GH_Site: keys.GH_Site
        }).limit(1, 0));
        ReqTableData.ProjectionData = await tx.run(SELECT.distinct.columns(
            "ID", "CM", "Site", "Program", "Station", "Aqid", "Uph", "Line", "Level", "Group_Priority",
            "SUBSTR_BEFORE(Group_Priority, '-') AS Grp",
            "SUBSTR_AFTER(Group_Priority, '-') AS Prio",
            "Mfr", "Balance_Qty", "QPL_User", "Carry_Over", "RFID_Scope",
            "modifiedBy_Name", "modifiedBy_mail", "createdBy_Name", "createdBy_mail", "Scope"
        ).from("V_NONRFID_PROJECTION").where({
            CM: ReqTableData.CM_SiteData[0].CM,
            Site: ReqTableData.CM_SiteData[0].Site,
            Program: keys.Program,
            RFID_Scope: 'N',
            ID: { '!=': '' },


        }).orderBy(
            'PROGRAM asc', 'UPH asc', 'LINE asc', 'STATION asc', 'SCOPE asc', 'Grp asc', 'Prio asc'
        ));
        ReqTableData.BohQty = await tx.run(SELECT.distinct.columns(
            "CM", "Site", "Program", "Aqid", "MIN(BOH) as BOH"
        ).from("V_NONRFID_PROJECTION").where({
            CM: ReqTableData.CM_SiteData[0].CM,
            Site: ReqTableData.CM_SiteData[0].Site,
            Program: keys.Program,
            RFID_Scope: 'N',
            BOH: { '>': 0 },


        }).groupBy("CM", "Site", "Program", "Aqid"));
        ReqTableData.Existing_ALL_TTRec = await tx.run(SELECT.distinct.columns(
            "ID", "GH_Site", "CM", "Site", "Program", "Line_Type", "Uph", "Aqid", "Mapped_Aqid", "Station", "Scope", "Line_Id", "Parent_Item", "Alt_Station", "Group_Priority", "Sequence_No",
            "Equipment_Name", "confLevel", "Projected_Qty", "Transfer_Qty", "Mfr", "BusinessGrp", "SAP_CM_Site", "SAP_To_CM_Site", "Dept", "RFID_Scope", "Override_Qty",
            "Group_ID", "Line_Priority", "Equipment_Type", "To_CM", "To_Site", "To_Program", "To_Business_Grp", "To_GHSite", "Transfer_Flag", "Comments", "Status",
            "Submit_Date", "Submit_By", "Review_Date", "Reviewed_By", "modifiedBy_Name", "modifiedBy_mail", "createdBy_Name", "createdBy_mail", "Submit_By_Name",
            "Submit_By_mail", "Reviewed_By_Name", "Reviewed_By_mail"
        ).from("COM_APPLE_COA_T_COA_NONRFID_TT").where({
            GH_Site: keys.GH_Site,
            Program: keys.Program,

        }));
        return ReqTableData;
    }
    async function fetchValidSites4Processing(request, allowedAttribute, tx) {
        let where = '';
        if (request.data.request && request.data.request.GH_Site) {
            where = prepareArray4where(where, request.data.request.GH_Site, 'GH_Site');
        }
        if (request.data.request && request.data.request.Program_Org) {
            where = prepareArray4where(where, request.data.request.Program_Org, 'Program');
        }
        if (!(allowedAttribute.includes('$unrestricted-$unrestricted'))) {
            where = prepareArray4where(where, allowedAttribute, 'SAP_CM_Site');
        }

        let allGHSitePgm = await tx.run(`select  * from ( SELECT  GH_Site, Program, SAP_CM_Site from V_NONRFID 
            union
            SELECT  GH_Site, Program, SAP_CM_Site from V_NONRFID_TT ) where
                ${where}`
        );
        if (!(allGHSitePgm)) { allGHSitePgm = []; }

        allGHSitePgm = convert_to_camel(allGHSitePgm);

        return allGHSitePgm;
    }
    function prepareArray4where(where, array, field) {
        let str = '';
        for (let rec of array) {
            if (str === '') {
                str = `'${rec}'`;
            } else {
                str = str + ',' + `'${rec}'`;
            }
        }
        if (where === '') {
            where = `${field} in ( ${str} )`
        } else {
            where = `${where} and ${field} in ( ${str} )`;
        }
        return where;
    }

    function getAllowedAttributes(jwtdetails, request, LOG) {
        let usrScope = [];
        for (let scope of jwtdetails.scope) {
            let reqScope = scope.split('.')[1];
            if (reqScope === 'SyncActionAll') {
                usrScope.push(reqScope); break;
            }
        }
        const RoleNames = jwtdetails['xs.system.attributes'];
        let allowedattributes = { sync: [] };

        try {
            let srvCred = {};
            srvCred = getServiceCredentials(srvCred);
            allowedattributes = getSyncAttributes(RoleNames, srvCred, usrScope, allowedattributes);

        } catch (err) {
            LOG.info("AuthObject Parse error");
            request.reject(JSON.stringify({ msg: "AuthObject Parse error" }));

        }

        return allowedattributes.sync;

    }
    function getServiceCredentials(srvCred) {

        if (glb_auth) {
            srvCred = glb_auth;
        } else {
            const xsenv = require("@sap/xsenv");
            xsenv.loadEnv();

            let authJson = '';

            let iterate = true, cnt = 1;
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
        return srvCred;
    }
    function getSyncAttributes(RoleNames, srvCred, usrScope, allowedattributes) {
        for (let roleName of RoleNames["xs.rolecollections"]) {
            if (srvCred && srvCred[roleName] !== undefined) {
                if (srvCred[roleName]['SyncActionAll'] !== undefined && usrScope.includes('SyncActionAll')) {
                    allowedattributes = setAccessFlag('SyncActionAll', 'sync', allowedattributes, srvCred[roleName])
                }
            }
        }
        return allowedattributes;
    }
    function setAccessFlag(scope, mode, allowedattributes, Role) {
        let idx;
        for (let rec of Role[scope]['CM-Site']) {
            idx = allowedattributes[mode].findIndex(el => el === rec);
            if (idx < 0) {
                allowedattributes[mode].push(rec);
            }
        }
        return allowedattributes;
    }
    async function UpdateSyncTable(uuid, Error, Status, CurrKeys) {
        const tx_update = hdb.tx();
        try {
            await tx_update.run(UPDATE("COM_APPLE_COA_T_COA_SYNC_STATUS")
                .with({
                    Status: Status,
                    Error: Error
                })
                .where({
                    ID: String(uuid),
                    GH_Site: CurrKeys.GH_Site,
                    Program: CurrKeys.Program
                }));
            await tx_update.commit();
        } catch {
            await tx_update.rollback();
        }

    }
    function cal_Projection_per_Program(ReqTabMap, jwtdetails, BohQty, Existing_ALL_TTRec, LOG) {
        try {
            let allRec = [];
            let DBUpdates = { NonRfid_tt: [], NonRfid_tt_DelKeys: [], COAOUtput_Insert: [], COAOutput_DeleteKeys: [], Projection_DelKey: [], Projection_Insert: [], Existing_TTRec: {} };
            let DBOldData = { NonRfid_tt: {}, OutputRec: [], ProjectionRec: {} }

            allRec = ReqTabMap.allRec;

            DBOldData.OutputRec = ReqTabMap.OutputRec;
            let AqidConsumeQty = [];

            for (let item of allRec) {
                let Existing_TTRec = filter_KeyReleventDbTTRecord(item, ReqTabMap.ALL_TTRecMap);
                let Split_Rec = Existing_TTRec.filter(el => el.GH_Site === item.GH_Site && el.Program === item.Program &&
                    el.Line_Type === item.Line && el.Uph === item.Uph && el.Station === item.Station && el.Line_Id === item.LineId
                    & el.CM === item.CM && el.Site === item.Site &&
                    el.Aqid === item.Aqid && el.Sequence_No !== 0 &&
                    el.Scope === item.Scope && el.Group_Priority === item.Group_Priority);
                BohQty.Existing_ALL_TTRec = Existing_ALL_TTRec;


                let OldTTIdx = Existing_TTRec.findIndex(cel => cel.CM === item.CM &&
                    cel.Site === item.Site &&
                    cel.Program === item.Program &&
                    cel.Station === item.Station &&
                    cel.Aqid === item.Aqid &&
                    cel.GH_Site === item.GH_Site &&
                    cel.Scope === item.Scope &&
                    cel.Line_Type === item.Line &&
                    cel.Uph === item.Uph &&
                    cel.Line_Id === item.LineId &&
                    cel.Group_Priority === item.Group_Priority &&
                    cel.Sequence_No === 0);
                DBOldData.NonRfid_tt = Existing_TTRec[OldTTIdx];

                let retValues = validateAndPoulateItem(item, DBOldData, allRec, AqidConsumeQty, BohQty, LOG);

                DBOldData = retValues.DBOldData;
                AqidConsumeQty = retValues.AqidConsumeQty;

                DBUpdates = prepareNonRFIDTTRecord(item, DBOldData.NonRfid_tt, jwtdetails, false, DBUpdates, DBOldData.OutputRec, LOG);
                DBUpdates = AppendSplitRecords(Split_Rec, DBUpdates, DBOldData.OutputRec, item, jwtdetails, LOG);
                if (Existing_TTRec.length > 0) {
                    let keyArray = ["GH_Site", "Program", "Uph", "Station", "Line", "CM", "Site", "From_GHSite", "From_Product", "Line_Type", "Line_Id", "Aqid", "Scope", "Group_Priority"];

                    Sync_fillMultilevel(DBUpdates.Existing_TTRec, [Existing_TTRec[OldTTIdx][keyArray[0]], Existing_TTRec[OldTTIdx][keyArray[1]], Existing_TTRec[OldTTIdx][keyArray[2]],
                    Existing_TTRec[OldTTIdx][keyArray[3]], Existing_TTRec[OldTTIdx][keyArray[9]], Existing_TTRec[OldTTIdx][keyArray[10]],
                    Existing_TTRec[OldTTIdx][keyArray[11]], Existing_TTRec[OldTTIdx][keyArray[12]], Existing_TTRec[OldTTIdx][keyArray[13]]],
                        Existing_TTRec[OldTTIdx])
                }
            }

            return DBUpdates;
        } catch (error) {
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function getSplitAndGroupRec(Existing_ALL_TTRec, item) {
        return Existing_ALL_TTRec.filter(el => el.GH_Site === item.GH_Site && el.Program === item.Program &&
            el.Line_Type === item.Line_Type && el.Uph === item.Uph && el.Station === item.Station && el.Line_Id === item.Line_Id
            && el.Aqid === item.Aqid && el.Scope === item.Scope && el.Group_Priority === item.Group_Priority
        );

    }
    function validateAndPoulateItem(item, DBOldData, allRec, AqidConsumeQty, BohQty, LOG) {
        try {
            AqidConsumeQty = calculateProjectionQPL(item, AqidConsumeQty, allRec, BohQty, DBOldData.NonRfid_tt, LOG);
            let resultArray = {};
            resultArray.item = item;
            resultArray.DBOldData = DBOldData;
            resultArray.AqidConsumeQty = AqidConsumeQty;
            return resultArray;
        } catch (error) {
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function getAQIDsBohOfOneGroup(GRP_Rec, BohQty) {
        let totGrpBOH = 0, grouprec, aqidBoh;
        for (grouprec of GRP_Rec) {
            aqidBoh = BohQty.BohQty.find(ael => ael.CM === grouprec.CM && ael.Site === grouprec.Site &&
                ael.Program === grouprec.Program && ael.Aqid === grouprec.Aqid)
            if (aqidBoh) {
                totGrpBOH = totGrpBOH + aqidBoh.BOH;
            }
        }
        return totGrpBOH;
    }
    function getTotalProjectionQty(Existing_ALL_TTRec, ConsumeQpl, item, grpPrio, OldTTRec) {
        ConsumeQpl.GrpPrjQtyTot = 0;
        if (grpPrio === 'X') {
            let grprec = Existing_ALL_TTRec.filter(cel => cel.CM === item.CM &&
                cel.Site === item.Site &&
                cel.Program === item.Program &&
                cel.Station === item.Station &&
                cel.GH_Site === item.GH_Site &&
                cel.Line_Type === item.Line &&
                cel.Uph === item.Uph &&
                cel.Line_Id === item.LineId &&
                cel.Group_Priority.split("-")[0] === item.grp &&
                cel.Sequence_No === 0);
            for (let grp of grprec) {
                ConsumeQpl.GrpPrjQtyTot = Number(ConsumeQpl.GrpPrjQtyTot) + Number(grp.Projected_Qty);
            }
        } else {
            if (OldTTRec) {
                ConsumeQpl.GrpPrjQtyTot = OldTTRec.Projected_Qty;
            }
        }
    }
    function calculateProjectionQPL(item, AqidConsumeQty, allRec, BohQty, OldTTRec, LOG) {
        try {
            let ConsumeQpl = AqidConsumeQty.find(cel => cel.GH_Site === item.GH_Site && cel.Station === item.Station && cel.Program === item.Program &&
                cel.Line_Type === item.Line && cel.Uph === item.Uph &&
                ((cel.Aqid === item.Aqid && cel.grp === item.grp && item.grp === '') || (item.grp !== '' && cel.grp === item.grp && cel.LineId == item.LineId)));
            item.QPL = parseFloat(item.QPL).toFixed(2);
            if (ConsumeQpl === undefined) {
                let GRP_Rec = [];
                ConsumeQpl = {};
                item.QPL = update_QPL(item);
                ConsumeQpl.TotQPL = item.QPL;
                let aqidBoh, BOH = 0;
                ConsumeQpl.GrpPrjQtyTot = 0;
                if (item.grp !== '') {
                    GRP_Rec = allRec.filter(el => el.GH_Site === item.GH_Site && el.Program === item.Program &&
                        el.Line === item.Line && el.Uph === item.Uph && el.Station === item.Station && el.LineId === item.LineId
                        && el.CM === item.CM && el.Site === item.Site && el.grp === item.grp && item.grp !== '');

                    BOH = getAQIDsBohOfOneGroup(GRP_Rec, BohQty);
                    getTotalProjectionQty(BohQty.Existing_ALL_TTRec, ConsumeQpl, item, 'X', OldTTRec);
                }
                else {
                    aqidBoh = BohQty.BohQty.find(ael => ael.CM === item.CM && ael.Site === item.Site && ael.Program === item.Program && ael.Aqid === item.Aqid);
                    if (aqidBoh) {
                        BOH = aqidBoh.BOH;
                    }
                    getTotalProjectionQty(BohQty.Existing_ALL_TTRec, ConsumeQpl, item, ' ', OldTTRec);
                }
                ConsumeQpl.CM = item.CM;
                ConsumeQpl.Site = item.Site;
                ConsumeQpl.Program = item.Program;
                ConsumeQpl.Mfr = item.Mfr;
                ConsumeQpl.LineId = item.LineId;
                ConsumeQpl.Aqid = item.Aqid;
                ConsumeQpl.Station = item.Station;
                ConsumeQpl.GH_Site = item.GH_Site;
                ConsumeQpl.Scope = item.Scope;
                ConsumeQpl.Line_Type = item.Line;
                ConsumeQpl.Uph = item.Uph;
                ConsumeQpl.grp = item.grp;
                ConsumeQpl.Group_Priority = item.Group_Priority;
                ConsumeQpl.QPL = item.QPL;
                ConsumeQpl.Trigger = '1';
                ConsumeQpl.Reset = false;

                prepareBalanceQty(BohQty, item, GRP_Rec, BOH, ConsumeQpl, OldTTRec, LOG);

                AqidConsumeQty.push(ConsumeQpl);
            }
            else {

                prepareItemQPL(item, ConsumeQpl, allRec, BohQty, OldTTRec, LOG);
            }
            return AqidConsumeQty;
        } catch (error) {
            LOG.info('calculateProjectionQPL' + error.message)
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function prepareBalanceQty(BohQty, item, GRP_Rec, BOH, ConsumeQpl, OldTTRec, LOG) {
        try {
            let aqidBoh;
            if (GRP_Rec.length > 0) {
                // with group Priority Logic
                aqidBoh = BohQty.BohQty.find(ael => ael.CM === item.CM && ael.Site === item.Site && ael.Program === item.Program && ael.Aqid === item.Aqid);
                if (aqidBoh) {
                    checkAvailableBOH(OldTTRec, item, ConsumeQpl, aqidBoh, 'C', LOG);

                }
            } else {
                // Without Group Priority Logic
                aqidBoh = BohQty.BohQty.find(ael => ael.CM === item.CM && ael.Site === item.Site && ael.Program === item.Program && ael.Aqid === item.Aqid);
                if (aqidBoh) {
                    checkAvailableBOH(OldTTRec, item, ConsumeQpl, aqidBoh, 'I', LOG);
                } else {
                    item.QPl = '0.00';
                }
            }
        } catch (error) {
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function checkAvailableBOH(OldTTRec, item, ConsumeQpl, aqidBoh, flgQPL, LOG) {
        try {
            let QPL;
            if (flgQPL === 'C') {
                QPL = ConsumeQpl.QPL;
            } else if (flgQPL === 'I') {
                QPL = item.QPL;
            }
            if (Number(aqidBoh.BOH) < Number(QPL)) {
                item.QPL = aqidBoh.BOH;
                if (flgQPL === 'I') {
                    ConsumeQpl.QPL = item.QPL;
                    ConsumeQpl.TotQPL = item.QPL;
                }
            }
            determineQPLAndResetReq(OldTTRec, item, ConsumeQpl, aqidBoh);
            if (Number(aqidBoh.BOH) < 0) {
                LOG.info('BOH went into negative value, Please check calculation wrong');
            }
        } catch (error) {
            throw new Error((JSON.stringify(error.message)));
        }
    }

    function determineQPLAndResetReq(OldTTRec, item, ConsumeQpl, aqidBoh) {
        aqidBoh.BOH = parseFloat(aqidBoh.BOH).toFixed(2);

        if (Number(ConsumeQpl.GrpPrjQtyTot) === Number(ConsumeQpl.TotQPL) && OldTTRec && Number(aqidBoh.BOH) >= Number(OldTTRec.Override_Qty)) {
            aqidBoh.BOH = aqidBoh.BOH - OldTTRec.Override_Qty;
            ConsumeQpl.QPL = ConsumeQpl.QPL - OldTTRec.Override_Qty;
            item.Reset = false;
            item.QPL = OldTTRec.Projected_Qty;
        } else {
            if (Number(aqidBoh.BOH) >= Number(item.QPL)) {
                aqidBoh.BOH = aqidBoh.BOH - item.QPL;
                ConsumeQpl.QPL = ConsumeQpl.QPL - item.QPL;
            } else {
                ConsumeQpl.QPL = ConsumeQpl.QPL - aqidBoh.BOH;
                aqidBoh.BOH = '0.00';
            }

            ConsumeQpl.Reset = true;
            item.Reset = true;
        }
    }

    function update_QPL(item) {
        if (!(item.ALT_Station === '' || item.ALT_Station === undefined || item.ALT_Station === 0)) {
            if (!(item.confLevel === null || Number(item.confLevel) === 0 || isNaN(item.confLevel))) {
                item.QPL = item.confLevel * item.QPL;
            }
        }
        return item.QPL;
    }

    function prepareItemQPL(item, ConsumeQpl, allRec, BohQty, OldTTRec, LOG) {
        try {
            let BOH = 0, GRP_Rec = [], aqidBoh;

            if (item.grp === '') {

                aqidBoh = BohQty.BohQty.find(ael => ael.CM === item.CM && ael.Site === item.Site && ael.Program === item.Program && ael.Aqid === item.Aqid);
                if (aqidBoh) {
                    BOH = aqidBoh.BOH;
                }
                item.QPL = update_QPL(item);
                ConsumeQpl.QPL = item.QPL;
                ConsumeQpl.TotQPL = item.QPL;
                ConsumeQpl.Trigger = '1';
                if (OldTTRec) {
                    ConsumeQpl.GrpPrjQtyTot = OldTTRec.Projected_Qty;
                } else {
                    ConsumeQpl.GrpPrjQtyTot = 0;
                }
                prepareBalanceQty(BohQty, item, GRP_Rec, BOH, ConsumeQpl, OldTTRec, LOG);
            }
            else if (item.grp !== '') {
                item.QPL = ConsumeQpl.QPL;
                GRP_Rec = allRec.filter(el => el.GH_Site === item.GH_Site && el.Program === item.Program &&
                    el.Line === item.Line && el.Station === item.Station && el.LineId === item.LineId && el.Uph === item.Uph
                    && el.CM === item.CM && el.Site === item.Site && el.grp === item.grp && item.grp !== '');
                ConsumeQpl.Trigger = '2';
                BOH = getAQIDsBohOfOneGroup(GRP_Rec, BohQty);
                prepareBalanceQty(BohQty, item, GRP_Rec, BOH, ConsumeQpl, OldTTRec, LOG);

            }
            item.QPL = check_QTY(item.QPL);
        } catch (error) {
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function check_QTY(QTY) {
        if (Number(QTY) < 0) { QTY = 0; }
        return QTY;
    }


    function prepareProjectionBalanceQty(ProjectionData, BohQty, DBUpdates, LOG) {
        try {
            let aqidBoh;
            for (let prjRec of ProjectionData) {
                let balance = 0;
                aqidBoh = BohQty.BohQty.find(el => el.CM === prjRec.CM && el.Site === prjRec.Site && el.Aqid === prjRec.Aqid);
                if (aqidBoh?.BOH !== undefined) {
                    balance = aqidBoh.BOH;
                }
                check_and_push_recs(prjRec, balance, DBUpdates)

            }
            return DBUpdates;
        } catch (error) {
            LOG.info('calculateProjectionQPL' + error.message)
            throw new Error((JSON.stringify(error.message)));
        }
    }

    function check_and_push_recs(prjRec, balQty, DBUpdates) {
        if (Number(prjRec.Balance_Qty) !== Number(balQty) && !(DBUpdates.Projection_DelKey.includes(prjRec.ID))) {

            prjRec.Balance_Qty = balQty;
            delete prjRec.Grp;
            delete prjRec.Prio;
            DBUpdates.Projection_Insert.push(prjRec);
            DBUpdates.Projection_DelKey.push(prjRec.ID);
        }
        return DBUpdates;
    }
    function prepareCOOutputChanges(item, DBUpdates, output, jwtdetails) {

        if (output) {
            let opIdx = DBUpdates.COAOUtput_Insert.findIndex(el =>
                el.From_CM === output.From_CM && el.From_Site === output.From_Site && el.From_Product === output.From_Product &&
                el.AQID === output.AQID && el.To_CM === output.To_CM && el.To_Site === output.To_Site && el.To_Product === output.To_Product &&
                el.CO_Type === output.CO_Type);
            if (opIdx < 0) {
                output.subQuantity = Number(item.Transfer_Qty);
                output.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                output.modifiedBy_mail = jwtdetails.email;
                if (output.Status === 'Approved') {
                    output.Status = 'Pending';
                }
                output.CM_Balance_Qty = 0;
                delete output.modifiedBy; delete output.modifiedAt;
                output.Comment = 'Quantity Reset';
                DBUpdates.COAOUtput_Insert.push(output);
                DBUpdates.COAOutput_DeleteKeys.push({
                    From_CM: output.From_CM, From_Site: output.From_Site, From_Product: output.From_Product,
                    AQID: output.AQID, To_CM: output.To_CM, To_Site: output.To_Site, To_Product: output.To_Product, CO_Type: output.CO_Type
                });
            } else {
                DBUpdates.COAOUtput_Insert[opIdx].subQuantity = Number(DBUpdates.COAOUtput_Insert[opIdx].subQuantity) + Number(item.Transfer_Qty);
            }
        }
        return DBUpdates;
    }
    function TransferQuantityValidation(item, OldTTRec, Reset) {
        if (Reset === true || Number(OldTTRec.Projected_Qty) !== Number(item.Projected_Qty)) {
            item.Status = 'Override Qty Reset';
            item.Override_Qty = item.Projected_Qty;
            item.Transfer_Qty = 0.00;
            item.Error = 'There is a change in Projected Quantity. So, Override Quantity is reset.';
        }
        return item;
    }
    function AppendSplitRecords(Split_Rec, DBUpdates, OutputRec, Item, jwtdetails, LOG) {
        try {
            if (Split_Rec.length >= 0) {
                for (let splitItem of Split_Rec) {
                    DBUpdates = prepareNonRFIDTTRecord(Item, splitItem, jwtdetails, true, DBUpdates, OutputRec, LOG);
                }
            }
            return DBUpdates;
        } catch (error) {
            LOG.info('calculateProjectionQPL' + error.message)
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function declareTTRec(OldTTRec, item, jwtdetails) {
        let RecTT = {
            ID: (OldTTRec) ? OldTTRec.ID : getuuid(),
            CM: item.CM,
            Site: item.Site,
            Program: item.Program,
            Station: item.Station,
            Aqid: item.Aqid,
            GH_Site: item.GH_Site,
            Scope: item.Scope,
            Line_Type: item.Line,
            Uph: item.Uph,
            Line_Id: (item.LineId === null || item.LineId === undefined) ? '' : item.LineId,
            Status: '',
            confLevel: item.confLevel,
            Group_Priority: item.Group_Priority,
            Sequence_No: 0,
            Parent_Item: (item.Parent_Item === null || item.Parent_Item === undefined) ? '' : item.Parent_Item,
            Alt_Station: (item.ALT_Station === null || item.ALT_Station === undefined) ? 0 : item.ALT_Station,
            createdBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
            createdBy_mail: jwtdetails.email,
            modifiedBy_Name: `${jwtdetails.given_name} ${jwtdetails.family_name}`,
            modifiedBy_mail: jwtdetails.email,
            RFID_Scope: item.RFID_Scope,
            Projected_Qty: parseFloat(item.QPL).toFixed(2),
            Override_Qty: parseFloat(item.QPL).toFixed(2),
            Transfer_Qty: 0.00,
            Error: item.Error,
            SAP_CM_Site: item.CM + '-' + item.Site,
            Group_ID: item.Group,
            Equipment_Name: item.Equipment_Name,
            Equipment_Type: item.Equipment_Type,
            Dept: item.Dept,
            Mapped_Aqid: item.Mapped_Aqid,
            Mfr: item.Mfr,
            BusinessGrp: item.Area,
        };
        return RecTT;
    }
    function prepareNonRFIDTTRecord(item, OldTTRec, jwtdetails, split_flg, DBUpdates, OutputRec, LOG) {
        try {
            let RecTT = declareTTRec(OldTTRec, item, jwtdetails);

            if (OldTTRec) {
                RecTT.Sequence_No = OldTTRec.Sequence_No;
                RecTT.createdBy = OldTTRec.createdBy;
                RecTT.createdAt = OldTTRec.createdAt;
                RecTT.createdBy_Name = OldTTRec.createdBy_Name;
                RecTT.createdBy_mail = OldTTRec.createdBy_mail;
                RecTT.Equipment_Name = OldTTRec.Equipment_Name;
                RecTT.Transfer_Qty = OldTTRec.Transfer_Qty;
                RecTT.Mfr = OldTTRec.Mfr;
                RecTT.Mapped_Aqid = OldTTRec.Mapped_Aqid;
                RecTT.BusinessGrp = OldTTRec.BusinessGrp ? OldTTRec.BusinessGrp : RecTT.BusinessGrp;
                RecTT.SAP_CM_Site = OldTTRec.SAP_CM_Site;
                RecTT.SAP_To_CM_Site = OldTTRec.SAP_To_CM_Site;
                RecTT.Dept = OldTTRec.Dept;
                RecTT.RFID_Scope = OldTTRec.RFID_Scope;
                RecTT.Group_ID = OldTTRec.Group_ID;
                RecTT.Line_Priority = OldTTRec.Line_Priority;
                RecTT.Equipment_Type = OldTTRec.Equipment_Type;
                RecTT.To_CM = OldTTRec.To_CM;
                RecTT.To_Site = OldTTRec.To_Site;
                RecTT.To_Program = OldTTRec.To_Program;
                RecTT.To_Business_Grp = OldTTRec.To_Business_Grp;
                RecTT.To_GHSite = OldTTRec.To_GHSite;
                RecTT.Transfer_Flag = OldTTRec.Transfer_Flag;
                RecTT.Comments = OldTTRec.Comments;
                RecTT.Status = OldTTRec.Status;
                RecTT.Submit_Date = OldTTRec.Submit_Date;
                RecTT.Submit_By = OldTTRec.Submit_By;
                RecTT.Review_Date = OldTTRec.Review_Date;
                RecTT.Reviewed_By = OldTTRec.Reviewed_By;
                RecTT.Submit_By_Name = OldTTRec.Submit_By_Name;
                RecTT.Submit_By_mail = OldTTRec.Submit_By_mail;
                RecTT.Reviewed_By_Name = OldTTRec.Reviewed_By_Name;
                RecTT.Reviewed_By_mail = OldTTRec.Reviewed_By_mail;
                if (OldTTRec.Projected_Qty === RecTT.Projected_Qty && OldTTRec.Override_Qty !== undefined) {
                    RecTT.Override_Qty = OldTTRec.Override_Qty;
                }
                RecTT.Override_Qty = parseFloat(RecTT.Override_Qty).toFixed(2);

                DBUpdates = ProcessOtherTables(RecTT, OutputRec, DBUpdates, jwtdetails, OldTTRec, item.Reset, LOG);

            }
            let nonTTidx = DBUpdates.NonRfid_tt.findIndex(cel => cel.CM === RecTT.CM &&
                cel.Site === RecTT.Site &&
                cel.Program === RecTT.Program &&
                cel.Station === RecTT.Station &&
                cel.Aqid === RecTT.Aqid &&
                cel.Scope === RecTT.Scope &&
                cel.Line_Type === RecTT.Line_Type &&
                cel.Uph === RecTT.Uph &&
                cel.Line_Id === RecTT.Line_Id &&
                cel.Group_Priority === RecTT.Group_Priority &&
                cel.Sequence_No === RecTT.Sequence_No);
            if (nonTTidx < 0) {
                DBUpdates.NonRfid_tt.push(RecTT);
            } else {
                LOG.info(`duplicate: CM- ${RecTT.CM} , Site- ${RecTT.Site} , Prg- ${RecTT.Program}, Station- ${RecTT.Station},AQID-${RecTT.Aqid},
                                    Scope- ${RecTT.Scope},Line- ${RecTT.Line_Type},uph-${RecTT.Uph}, Lineid-${RecTT.Line_Id}, GP- ${RecTT.Group_Priority},SeqNo-${RecTT.Sequence_No} `);
            }
            return DBUpdates;

        } catch (error) {
            LOG.info('calculateProjectionQPL' + error.message)
            throw new Error((JSON.stringify(error.message)));
        }
    }
    function ProcessOtherTables(RecTT, OutputRec, DBUpdates, jwtdetails, OldTTRec, Reset, LOG) {
        try {
            if (RecTT.Status === 'Approved' && Reset === true) {
                let Output = OutputRec.find(el => el.From_GHSite === RecTT.GH_Site && el.From_Product === RecTT.Program && el.To_GHSite === RecTT.To_GHSite
                    && el.To_Product === RecTT.To_Program && el.CO_Type === "Non RFID" && el.AQID === RecTT.Mapped_Aqid)
                DBUpdates = prepareCOOutputChanges(RecTT, DBUpdates, Output, jwtdetails);
            }
            RecTT = TransferQuantityValidation(RecTT, OldTTRec, Reset);
            return DBUpdates;
        } catch (error) {
            LOG.info('calculateProjectionQPL' + error.message)
            throw new Error((JSON.stringify(error.message)));
        }
    }
    async function insertIntoTable(DBUpdates, tx, CurrKeys, uuid, LOG) {

        let queries = [], queries2 = [];
        try {

            await tx.run(DELETE.from('COM_APPLE_COA_T_COA_NONRFID_TT').where({
                GH_Site: CurrKeys.GH_Site,
                Program: CurrKeys.Program
            }));

            if (DBUpdates.NonRfid_tt.length > 0) {
                await tx.run(INSERT.into('COM_APPLE_COA_T_COA_NONRFID_TT').entries(DBUpdates.NonRfid_tt));
            }
            if (DBUpdates.Projection_DelKey.length > 0) {
                queries = [];
                queries = delete_via_id(DBUpdates.Projection_DelKey, queries, "COM_APPLE_COA_T_COA_NONRFID_PROJECTION");
                await tx.run(queries);
            }

            if (DBUpdates.Projection_Insert.length > 0) {
                await tx.run(INSERT.into('COM_APPLE_COA_T_COA_NONRFID_PROJECTION').entries(DBUpdates.Projection_Insert));
            }

            if (DBUpdates.COAOutput_DeleteKeys.length > 0) {
                queries2 = deleteInChunk(DBUpdates.COAOutput_DeleteKeys, queries2, "COM_APPLE_COA_T_COA_OUTPUT");
                if (queries2.length > 0) {
                    await tx.run(queries2);
                }

            }
            if (DBUpdates.COAOUtput_Insert.length > 0) {
                await tx.run(INSERT.into('COM_APPLE_COA_T_COA_OUTPUT').entries(DBUpdates.COAOUtput_Insert));
            }
            await tx.commit();
            LOG.info(CurrKeys.GH_Site + ':' + CurrKeys.Program + ':Sync Successful');
            UpdateSyncTable(uuid, '', 'Success', CurrKeys);

        }

        catch (err) {
            LOG.info(err.message + ':' + CurrKeys.GH_Site + " table insert failed");
            LOG.info(JSON.stringify(err));
            await tx.rollback();
            UpdateSyncTable(uuid, 'Error while inserting data to table', 'Error', CurrKeys);
            return err;

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


    srv.before("POST", nonrfid_tt_action, async (request) => {
        const LOG = cds.log(getuuid(request), { label: 'BeforeEvent' });
        try {
            if (typeof request.query?.INSERT?.entries[0].auth !== "undefined") {
                request.headers.authorization = request.query.INSERT.entries[0].auth;
                request.data = { NonRfidData: request.query.INSERT.entries[0].NonRfidData, action: request.query.INSERT.entries[0].Action };
                if (request.req === undefined) request.req = {};
                if (request.req.params === undefined) request.req.params = {};
                request.req.params.Reset_Flag = request.query.INSERT.entries[0].Reset_Flag;
            }

            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            if (typeof (request.req.params.uuid) === "undefined") {
                const uuid = getuuid(request);
                request.req.params = { "uuid": uuid, "user": request.user.id, "user_name": `${jwtdetails.given_name} ${jwtdetails.family_name}`, "user_mail": jwtdetails.email, ...request.req.params };
            }
            // Validations
            let errMsg = validateAndPrepareErrorMsg(request);
            if (errMsg) {
                request.reject(500, errMsg);
            }

        } catch (error) {
            LOG.info(`COA NonRFIDTT - Error: ${JSON.stringify(error.message)}`);
            return `Error: ${JSON.stringify(error.message)} `;
        }
    });
    function validateAndPrepareErrorMsg(request) {
        let errMsg;
        if (request.data.action === 'split' || request.data.action === 'd_split') {
            if (request.data.NonRfidData.length > 1 && request.data.action === 'split') {
                errMsg = 'Split functionality is possible only on one record at a time'
            }
            if (request.data.NonRfidData.length <= 0) {
                errMsg = 'Nothing to process for ' + statusObj[request.data.action];
            }
            if (request.data.NonRfidData.length > 5000) {
                errMsg = statusObj[request.data.action] + ' is not allowed for more than 5K records';
            }
        }
        return errMsg;
    }
    function check_split_auth(jwtdetails, request, LOG) {
        let allowedAttributes = getAllowedAttributesCommon(jwtdetails, request, LOG);
        let allowed_cmsite = allowedAttributes[`nonRFIDTTModify`];
        let Error = AuthorizationCheck(request.data.NonRfidData[0], allowed_cmsite);
        if (Error) {
            request.reject(500, `${Error}`);
        }
    }

    srv.on("POST", nonrfid_tt_action, async (request) => {
        const tx = hdb.tx();
        const label = (request?.data?.action) ? request.data.action : 'unknown'
        const LOG = cds.log(request.req.params?.uuid, { label: label });
        let response;
        try {
            LOG.info(`COA NonRFIDTT - In On event of NonRFIDTT`);
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            if (request.data.action === 'split') {
                check_split_auth(jwtdetails, request, LOG);
                response = await split_non_rfid(tx, request, LOG);
            }
            if (request.data.action === 'dsplit') {
                response = await delete_split_non_rfid(tx, request, LOG);
            }
            if (request.data.action === 'save' || request.data.action === 'approve' || request.data.action === 'reject' || request.data.action === 'cancel' || request.data.action === 'reset') {
                response = await process_non_rfid(tx, request, LOG);
            }
            if (request.data.action === 'mapprove' || request.data.action === 'mreject' || request.data.action === 'mcancel' || request.data.action === 'mreset' || request.data.action === 'mdelete') {
                request.data.URL = request.data.NonRfidData[0].URL;
                response = await process_non_rfid(tx, request, LOG);
            }
        }
        catch (error) {
            LOG.info(`COA NonRFIDTT  - Error: ${JSON.stringify(error.message)}`);
            return `Error: ${JSON.stringify(error.message)} `;
        }
        await cds.context.http.res.status(200).send(JSON.stringify({ msg: response }));
    });

    srv.before("GET", nonRfidTT, async (request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        const LOG = cds.log(getuuid(request), { label: 'BeforeEvent' });
        let allowedAttributes = getAllowedAttributesCommon(jwtdetails, request, LOG);
        allowedAttributes['nonRFIDTTReadOnly'] = merge(allowedAttributes['SyncActionAll'], allowedAttributes['nonRFIDTTReadOnly'], allowedAttributes['nonRFIDTTModify'], allowedAttributes['ApproveRfidOnHandTT']);
        let filterString = getFilterString(allowedAttributes['nonRFIDTTReadOnly'], '', LOG);
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

    srv.after("GET", nonRfidTT, async (data, request) => {
        const LOG = cds.log(getuuid(request), { label: 'AfterEvent' });
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributesCommon(jwtdetails, request, LOG);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`nonRFIDTTModify`];
        request.results.forEach(e => {
            if (e.Sequence_No === 0) {
                e.Parent = "Parent";
            }
            e.Edit = (allowed_cmsite[`${e.CM}-${e.Site}`] !== undefined ||
                allowed_cmsite[`$unrestricted-${e.Site}`] !== undefined ||
                allowed_cmsite[`${e.CM}-$unrestricted}`] !== undefined || allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? 7 : 1;
        });
    });

    srv.before("selectAllMassUpdate", async (request) => {
        let uuid;
        try {
            uuid = getuuid(request);
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            request.req.params = { "uuid": uuid, "user": request.user.id, "user_name": `${jwtdetails.given_name} ${jwtdetails.family_name}`, "user_mail": jwtdetails.email };
        } catch (error) {
            const LOG = cds.log(uuid, { label: 'selectAllMU' });
            LOG.info(`COA Carryover selectAllMassUpdate - Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.on("selectAllMassUpdate", async (request) => {
        let response;
        const tx1 = hdb.tx();
        request.data.action = 'save';
        const LOG = cds.log(getuuid(request), { label: request.data.action });
        response = await process_non_rfid(tx1, request, LOG);
        await cds.context.http.res.status(200).send(JSON.stringify({ msg: response }));
    });

    function data_validation(record, input, db_nonrfid, newQTYSelAll) {
        let flg = false;
        if (record.Error === "") {
            let totQTY = 0, totBalQTY = 0;
            let oldData = getSplitAndGroupRec(db_nonrfid, record);
            let newData = getSplitAndGroupRec(input, record);

            // Override Qty
            let parentItem = input.find(rec => rec.GH_Site === record.GH_Site && rec.Program === record.Program &&
                rec.Aqid === record.Aqid && rec.Scope === record.Scope && rec.Line_Type === record.Line_Type &&
                rec.Group_Priority === record.Group_Priority && rec.Line_Id === record.Line_Id &&
                rec.Uph === record.Uph && rec.Station === record.Station &&
                rec.Sequence_No === 0);
            if (parentItem === undefined) {
                parentItem = oldData.find(pel => pel.GH_Site === record.GH_Site && pel.Program === record.Program &&
                    pel.Line_Type === record.Line_Type && pel.Uph === record.Uph && pel.Station === record.Station &&
                    pel.Line_Id === record.Line_Id &&
                    pel.Aqid === record.Aqid && pel.Scope === record.Scope && pel.Group_Priority === record.Group_Priority && pel.Sequence_No === 0);
            }
            oldData.map(el => {
                if (parentItem) {
                    totQTY = Number(parentItem.Override_Qty);
                }
                // Total TR Qty
                let new_rec_index = newData.findIndex(rec => rec.GH_Site === el.GH_Site && rec.Program === el.Program &&
                    rec.Aqid === el.Aqid && rec.Line_Id === el.Line_Id && rec.Line_Type === el.Line_Type &&
                    rec.Uph === el.Uph && rec.Station === el.Station && rec.Scope === el.Scope &&
                    rec.Group_Priority === el.Group_Priority && rec.Sequence_No === el.Sequence_No)
                if (new_rec_index >= 0) {
                    totBalQTY = get_totbalQTY(Number(newQTYSelAll), totBalQTY, newData, new_rec_index);
                    newData.splice(new_rec_index, 1);
                }
                else {
                    totBalQTY = totBalQTY + Number(el.Transfer_Qty);
                }

            });
            let temp = compare_BalQTY_QTY(totBalQTY, totQTY, newData, record);
            record.Error = temp.Error;
            flg = temp.flg;
        }
        record.Error = record.Error === 'Skip Validation' ? '':record.Error;
        return { error: record.Error, QTYExceed: flg };
    }

    function get_totbalQTY(newQTYSelAll, totBalQTY, newData, new_rec_index) {
        if (newQTYSelAll) {
            totBalQTY = totBalQTY + newQTYSelAll;
        } else {
            totBalQTY = totBalQTY + Number(newData[new_rec_index].Transfer_Qty);
        }
        return totBalQTY;
    }

    function compare_BalQTY_QTY(totBalQTY, totQTY, newData, data) {
        let record = {};
        record.Error = "";
        if (newData.length > 0) {
            newData.forEach(pel => {
                if (pel.GH_Site === data.GH_Site && pel.Line_Type === data.Line_Type
                    && pel.Uph === data.Uph && pel.Station === data.Station && pel.Program === data.Program &&
                    pel.Line_Id === data.Line_Id && pel.Aqid === data.Aqid && pel.Scope === data.Scope &&
                    pel.Group_Priority === data.Group_Priority) {
                    totBalQTY = totBalQTY + Number(pel.Transfer_Qty);
                }
            })
        }
        if (totQTY !== totBalQTY) {
            record.Error = "Sum of transfer qty (parent+splitted records) should be equal to parent override qty";
            record.flg = true;
        }
        return record;
    }

    function fill_error(param, QTY_exceed_a, record) {
            const index = QTY_exceed_a.findIndex(pel => pel.GH_Site === record.GH_Site && pel.Program === record.Program &&
                pel.Line_Type === record.Line_Type && pel.Uph === record.Uph && pel.Station === record.Station &&
                pel.Line_Id === record.Line_Id && pel.Aqid === record.Aqid && pel.Scope === record.Scope &&
                pel.Group_Priority === record.Group_Priority);
            if (index < 0) {
                let QTY_exceed = {};
                QTY_exceed.CM = record.CM;
                QTY_exceed.Site = record.Site;
                QTY_exceed.GH_Site = record.GH_Site;
                QTY_exceed.Aqid = record.Aqid;
                QTY_exceed.Program = record.Program;
                QTY_exceed.Line_Id = record.Line_Id;
                QTY_exceed.Line_Type = record.Line_Type;
                QTY_exceed.Uph = record.Uph;
                QTY_exceed.Station = record.Station;
                QTY_exceed.Group_Priority = record.Group_Priority;
                QTY_exceed.Scope = record.Scope;
                if (param.QTYExceed) {
                    QTY_exceed.Error = "Quantity is exceeding the Override Quantity";
                }else{
                    QTY_exceed.Error = 'Skip Validation';
                }
                QTY_exceed_a.push(QTY_exceed);
            }
        return QTY_exceed_a;
    }

    function set_transfer_status(data, inAllSelection) {
        let transfer_status = inAllSelection.Status;
        if (data.Override_Qty && (data.To_GHSite !== "" && data.To_GHSite !== undefined && data.To_GHSite !== null)) {
            transfer_status = "Pending";
        }
        return transfer_status;
    }
    function save_records(data, insert_data, del_filter, changelog_data, DB_data, request, leftOverQty) {
        const LOG = request.req.params.LOG;
        let old_record = [];
        let new_record = [];
        if (data.Error === "") {
            let inAllSelection = getMultiLevelValue(DB_data.map1, [data.CM, data.Site, data.Aqid, data.Program, data.Line_Id, data.Line_Type, data.Uph, data.Station, data.Group_Priority, data.Scope, data.Sequence_No]);
            if (inAllSelection !== undefined) {
                old_record = Nonrfid_data(inAllSelection);
                //Override qty update
                let transfer_status = set_transfer_status(data, inAllSelection);
                data = fill_data_bydb(data, inAllSelection);
                data.Reviewed_By = "";
                data.Reviewed_By_Name = "";
                data.Reviewed_By_mail = "";
                data.modifiedAt = new Date().toISOString();
                data.modifiedBy = request.user.id;
                data.modifiedBy_Name = request.req.params.user_name;
                data.modifiedBy_mail = request.req.params.user_mail;
                if (!inAllSelection.Status || inAllSelection.Status === null) {
                    data.Submit_By = request.user.id;
                    data.Submit_By_mail = request.req.params.user_mail;
                    data.Submit_By_Name = request.req.params.user_name;
                    data.Submit_Date = new Date().toISOString();
                }
                if (data.Error === "") {
                    changelog_data.changelog_nonrfid_u.old_records.push(old_record);
                    if (inAllSelection.Status === "Approved") {
                        let outcome = sub_from_output(DB_data.Output, inAllSelection, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                        insert_data.Output_Insert = outcome.Output_Insert;
                        changelog_data.changelog_output_u = outcome.changelog_data;
                        del_filter.del_filter_o = outcome.del_filter_a;
                    }
                    data.Status = transfer_status;
                    delete data.Error;
                    delete data.Table_Mapped_Aqid;
                    insert_data.Nonrfid_Insert.push(data);
                    new_record = Nonrfid_data(data);
                    changelog_data.changelog_nonrfid_u.new_records.push(new_record);
                    del_filter.del_filter_u.push(data.ID);

                    //update projection
                    let outcome_projection = update_projection_balance_qty(DB_data, data, insert_data.Projection_Insert, del_filter.del_filter_p, leftOverQty, LOG);
                    del_filter.del_filter_p = outcome_projection.del_filter;
                    insert_data.Projection_Insert = outcome_projection.insert_data;

                    //Save Split Records if change in override qty.
                    let outcome_split = save_split_record(DB_data, inAllSelection, data, insert_data, changelog_data, del_filter, request);
                    del_filter = outcome_split.del_filter;
                    changelog_data = outcome_split.changelog_data;
                    insert_data = outcome_split.insert_data;
                }
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function append_record(record, Final_A, Error_A, record_type) {
        if (record_type === 'Error') {
            if (record.Error) {
                Error_A.push(record);
            }
            return Error_A;
        } else {
            if (record.Error === "" || typeof record.Error === "undefined" || record.Error === null) {
                Final_A.push(record);
            }
            return Final_A;
        }
    }

    function deleteInChunk(delQueue, queries, table) {
        if (delQueue.length > 0) {
            let chunkSize = 800;
            let k = 0;
            for (; k < delQueue.length; k += chunkSize) {
                let deleteChunk = delQueue.slice(k, k + chunkSize);
                let delQ = changeObjArrayToQuery(deleteChunk);
                queries.push(DELETE.from(table).where(delQ));
            }
        }
        return queries;
    }
    function delete_via_id(del_filter_a, queries, table) {
        if (table === undefined) {
            table = "COM_APPLE_COA_T_COA_NONRFID_TT";
        }
        if (del_filter_a.length > 0) {
            let chunkSize = 2500;
            let k;
            for (k = 0; k < del_filter_a.length; k += chunkSize) {
                let selectChunkKeys = del_filter_a.slice(k, k + chunkSize);
                queries.push(DELETE.from(table).where({ ID: { in: selectChunkKeys } }));
            }
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

    function update_changelog(changelog_data_a, request, LOG) {
        LOG.info(` Call Changelog service to update the changes to Changelog table`);
        const core = require("@sap-cloud-sdk/core");
        const xsenv = require("@sap/xsenv");
        xsenv.loadEnv();
        const sDestinationName = "COA_APIM_CC";
        let result_a = [];
        try {
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
            LOG.info('Change log data', requestData);
            LOG.info('Successfully handle the update change log')
        }
        catch (error) {
            LOG.info(`COA NonRFIDTT - Error: ${JSON.stringify(error)}`);
        }
    }

    srv.before("GET", "F4help", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid, { label: 'F4Help' });
        try {
            if (typeof (request.req.params.LOG) === "undefined") {
                request.req.params = { "LOG": LOG, "user": request.user.id };
            }
            LOG.info(`COA - Check Authorization before getting F4help values on before event`);
        } catch (error) {
            LOG.info(`COA NonRFIDTT - Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    function getuuid(request) {
        if (request && request?.headers['x-correlationid']) {
            return request.headers['x-correlationid'];
        } else {
            return cds.utils.uuid();
        }
    }

    srv.on("GET", "F4help", async (request) => {
        const LOG = request.req.params.LOG;
        LOG.info(`COA  - In On event of Get action for F4help`);
        try {
            const dropdown_array = await getDropDownArray(LOG, request, request.query.SELECT.columns[0].ref[0]);
            request.results = dropdown_array;
        } catch (error) {
            LOG.info(`COA - Error: ${error}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function getDropDownArray(LOG, request, temp_field) {
        let search;
        let result_array = [];
        if (request._query.$search) {
            search = request._query.$search.replace(/"/g, ``);
        }
        const change = request.query.SELECT.columns[0].ref[0];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributesCommon(jwtdetails, request, LOG);
        allowedAttributes['nonRFIDTTReadOnly'] = merge(allowedAttributes['SyncActionAll'], allowedAttributes['nonRFIDTTModify'], allowedAttributes['nonRFIDTTReadOnly'], allowedAttributes['ApproveRfidOnHandTT'])
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        if (top) {
            top = top.includes("infinity") ? 1000 : top;
        }
        const header = { "LOG": LOG, "top": top, "skip": skip, "change": change }

        if (change === "GH_Site_MD" || change === "Program_MD") {
            let tmp_fld = temp_field.replace('_MD', '');
            result_array = await fetchdata(allowedAttributes['nonRFIDTTReadOnly'], tmp_fld, search, nonRfidTT, header);
        } else if (change === 'GH_Site_Org') {
            result_array = await fetchdata(allowedAttributes['SyncActionAll'], 'GH_Site', search, "COM_APPLE_COA_T_COA_BOM_STRUCTURE", header);
        }
        else if (change === 'Program_Org') {
            result_array = await fetchdata(allowedAttributes['SyncActionAll'], 'Program', search, "COM_APPLE_COA_T_COA_BOM_STRUCTURE", header);
        }
        else {
            result_array = await fetchdata(allowedAttributes['nonRFIDTTReadOnly'], change, search, nonRfidTT, header);
        }
        return result_array;
    }

    async function fetchdata(allowedattributes, change, search, db, header) {
        let top = header.top, skip = header.skip, field = header.change, LOG = header.LOG;
        let dropdown_array = [];
        let f4 = (field === "GH_Site_Org" || field === "Program_Org" || field === "GH_Site_MD" || field === "Program_MD") ? 'X' : '';
        let whereclause = getFilterString(allowedattributes, f4, LOG);
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
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${field}`).where(parsedFilters).limit(top, skip));
        } else {
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${field}`).where(`(${change} is not null) and not(${change}='')`).limit(top, skip));
        }
        return dropdown_array;
    }

    function get_msg(Err_records, action) {
        if (Err_records.length > 0) {
            return Err_records;
        } else {
            return action ? action : "Data Updated Successfully";
        }
    }

    async function split_non_rfid(tx, request, LOG) {
        let NonRfidRequestData = request.data.NonRfidData[0];
        try {
            let message;
            let Result = {};
            let DB_data = {};
            DB_data.Sync_Status = [];
            Result.From_GHSite = [];
            Result.From_Program = [];
            Result.From_GHSite.push(NonRfidRequestData.GH_Site);
            Result.From_Program.push(NonRfidRequestData.Program);
            DB_data = await validate_SyncStatus(Result, DB_data, tx);
            if (check_sync_status(NonRfidRequestData, DB_data.Sync_Status)) {
                request.reject(500, `Sync is in Progress for this GH Site and Program`);
            }
            LOG.info(`COA NonRFIDTT Split ${request.data.action} - In On event of NonRFIDTT split_non_rfid()`);
            let whereC = {
                SAP_CM_Site: NonRfidRequestData.SAP_CM_Site,
                Program: NonRfidRequestData.Program,
                Line_Type: NonRfidRequestData.Line_Type,
                Line_Id: NonRfidRequestData.Line_Id,
                Aqid: NonRfidRequestData.Aqid,
                Station: NonRfidRequestData.Station,
                Uph: NonRfidRequestData.Uph,
            };
            let NonRFIDs = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_NONRFID_TT").where(whereC).orderBy('Sequence_No desc'));
            NonRFIDs = convert_nonrfid_to_camel(NonRFIDs);

            if (NonRFIDs.length > 0) {
                if (NonRFIDs.length >= NonRfidRequestData.Override_Qty) {
                    message = get_msg("", "Split Item Count is exeeding the limit of Override Qty");
                }
                else {
                    NonRFIDs[0].ID = getuuid();
                    NonRFIDs[0].Sequence_No = NonRFIDs[0].Sequence_No + 1;
                    NonRFIDs[0].Transfer_Qty = 0;
                    NonRFIDs[0].To_CM = NonRFIDs[0].To_Site = NonRFIDs[0].To_GHSite = NonRFIDs[0].To_Program = NonRFIDs[0].To_Business_Grp = NonRFIDs[0].Transfer_Flag =
                        NonRFIDs[0].Comments = NonRFIDs[0].Status = NonRFIDs[0].SAP_To_CM_Site = NonRFIDs[0].Reviewed_By =
                        NonRFIDs[0].Review_Date = NonRFIDs[0].Reviewed_By_Name = NonRFIDs[0].Reviewed_By_mail = NonRFIDs[0].Submit_By =
                        NonRFIDs[0].Submit_Date = NonRFIDs[0].Submit_By_Name = NonRFIDs[0].Submit_By_mail = NonRFIDs[0].Mapped_Aqid = null;   //NC Added Mapped_Aqid here

                    NonRFIDs[0].modifiedBy_Name = request.req.params.user_name;
                    NonRFIDs[0].modifiedBy_mail = request.req.params.user_mail;
                    NonRFIDs[0].modifiedBy = request.user.id;
                    NonRFIDs[0].modifiedAt = new Date().toISOString();
                    NonRFIDs[0].createdBy_Name = request.req.params.user_name;
                    NonRFIDs[0].createdBy_mail = request.req.params.user_mail;
                    NonRFIDs[0].createdBy = request.user.id;
                    NonRFIDs[0].createdAt = new Date().toISOString();
                    delete NonRFIDs[0].Table_Mapped_Aqid;
                    await tx.run(INSERT.into("COM_APPLE_COA_T_COA_NONRFID_TT").entries(NonRFIDs[0]));
                    await tx.commit();
                    message = get_msg("", "Successfully Splitted");
                }
            }
            else {
                LOG.info(`COA NonRFIDTT Split Save  - Matching record is not found`);
                message = get_msg("", "Matching record is not found");
            }
            return message;
        }
        catch (err) {
            await tx.rollback();
            LOG.info(`COA NonRFIDTT Split  - Error: ${JSON.stringify(err)}`);
            return `Error: ${JSON.stringify(err)} `;
        }
    }

    async function delete_split_non_rfid(tx, request, LOG) {
        try {
            let Temp = [];
            let changelog_data = {};
            let nonrfid_err = [];
            changelog_data.new_records = [];
            changelog_data.old_records = [];
            let del_split_a = [];
            let queries = [];
            let DB_data = {};
            DB_data.Nonrfid = [];
            DB_data.Output = [];
            DB_data.keyArray = ["CM", "Site", "Aqid", "Program", "Line_Id", "Line_Type", "Uph", "Station", "Group_Priority", "Scope", "Sequence_No"];
            DB_data.Sync_Status = [];
            DB_data.map1 = {};
            let Result = {};
            Result.From_GHSite = [];
            Result.From_Program = [];
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getAllowedAttributesCommon(jwtdetails, request, LOG);
            let allowed_cmsite = allowedAttributes[`nonRFIDTTModify`];

            request.data.NonRfidData.forEach(e => {
                let temp = {};
                temp.ID = getuuid();
                temp.GUID = request.req.params.uuid;
                temp.CM = e.CM;
                temp.Site = e.Site;
                temp.GH_Site = e.GH_Site;
                temp.To_GHSite = e.To_GHSite;
                temp.To_Program = e.To_Program;
                temp.Program = e.Program;
                temp.Aqid = e.Aqid;
                temp.Line_Id = e.Line_Id;
                temp.Line_Type = e.Line_Type;
                temp.Uph = e.Uph
                temp.Station = e.Station;
                temp.Group_Priority = e.Group_Priority;
                temp.Scope = e.Scope;
                temp.Mfr = e.Mfr;
                temp.Sequence_No = e.Sequence_No;
                temp.Grp = e.Group_Priority.substring(0, e.Group_Priority.indexOf('-'));
                Temp.push(temp);
                Result.From_GHSite = Append_IfUnique(Result.From_GHSite, e.GH_Site);
                Result.From_Program = Append_IfUnique(Result.From_Program, e.Program);
            });
            await push_temp_data(Temp);
            DB_data = await validate_SyncStatus(Result, DB_data, tx);
            DB_data = await get_nonrfid_output_dbdata(tx, request, DB_data);
            fillMultimap(DB_data.map1, DB_data.Nonrfid, DB_data.keyArray);
            await delete_temp_data(request.req.params.uuid);

            request.data.NonRfidData.forEach(element => {
                let inAllSelection = getMultiLevelValue(DB_data.map1, [element.CM, element.Site, element.Aqid, element.Program, element.Line_Id, element.Line_Type, element.Uph, element.Station, element.Group_Priority, element.Scope, element.Sequence_No]);
                let sync_ip_error = check_sync_status(element, DB_data.Sync_Status);
                if (inAllSelection !== undefined) {
                    if (inAllSelection.Sequence_No === 0) {
                        element.Error = "Parent record can't be deleted";
                        nonrfid_err = append_record(element, '', nonrfid_err, 'Error');
                    } else if (inAllSelection.Status === 'Approved') {
                        element.Error = `Approved record can't be deleted`;
                        nonrfid_err.push(element);
                    } else if (sync_ip_error) {
                        element.Error = sync_ip_error;
                        nonrfid_err.push(element);
                    } else if (AuthorizationCheck(element, allowed_cmsite)) {
                        element.Error = `User doesn't have authorization for this CM-SITE combination`;
                        nonrfid_err.push(element);
                    } else if (inAllSelection.Transfer_Qty) {
                        element.Error = "Transfer Quantity should be zero to delete";
                        nonrfid_err.push(element);
                    }
                    else {
                        del_split_a.push(inAllSelection.ID);
                    }
                }
                else {
                    element.Error = "Matching record is not found";
                    nonrfid_err = append_record(element, '', nonrfid_err, 'Error');
                }

            });
            if (del_split_a.length > 0) {
                queries = delete_via_id(del_split_a, queries);
            }
            if (queries.length > 0) {
                await tx.run(queries);
                await tx.commit();
            }
            return nonrfid_err.length > 0 ? get_msg(nonrfid_err) : get_msg(nonrfid_err, 'Record deleted successfully');
        }
        catch (error) {
            LOG.info(`COA Delete Split ${request.data.action} - Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    }

    async function process_non_rfid(tx, request, LOG) {

        try {
            let output_err = [];
            let finalResponse;
            const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
            let allowedAttributes = getAllowedAttributesCommon(jwtdetails, request, LOG);
            if (request.data.URL) {
                if (request.data.Transfer_Qty !== undefined && isNaN(Number(request.data.Transfer_Qty))) {
                    request.reject(500, 'Invalid Transfer Qty');
                }
                let filters = request.data.URL;
                filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' <> ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
                let regex = /contains\((\w+),‘(\w+)‘\)/g;
                filters = filters.replace(regex, `($1 like ‘%$2%’)`);
                let filterString = request.data.action === "mapprove" ? getFilterString(allowedAttributes[`ApproveRfidOnHandTT`], 'X', LOG) : getFilterString(allowedAttributes[`nonRFIDTTModify`], 'X', LOG);
                filters = filterString ? `(${filterString}) and ${filters}` : filters;
                let result = await cds.run(SELECT.from("V_NONRFID_TT").where(cds.parse.expr(filters)));
                check_and_reject(result, request);
                output_err = await selectall_action(request, result, tx, LOG);
                finalResponse = get_msg(output_err);
            } else {
                check_and_reject(request.data.NonRfidData, request);
                output_err = await block_mass_update(request, tx, allowedAttributes, LOG);
                finalResponse = output_err ? get_msg(output_err) : get_msg('', 'Successfully Processed');
            }
            return finalResponse;
        } catch (error) {
            LOG.info(`COA NonRFIDTT ${request.data.action} - Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    }

    function check_and_reject(result, request) {
        if (result.length > 5000) {
            request.reject(500, `Mass ${request.data.action.charAt(0).toUpperCase() + request.data.action.slice(1)} is allowed only for 5K records`);
        }
        else if (result.length <= 0) {
            request._.res.send({ msg: "User doesn't have authorization for this CM-SITE combination" });
        }
    }

    async function block_mass_update(request, tx, allowedattributes, LOG) {
        try {
            LOG.info('in block mass update 1');
            let nonrfid_err = [];
            let insert_data = {};
            insert_data.Output_Insert = [];
            insert_data.Nonrfid_Insert = [];
            insert_data.Projection_Insert = [];
            let queries = [];
            let changelog_data_a = [];
            let changelog_data = {};
            changelog_data.changelog_nonrfid_u = {};
            changelog_data.changelog_output_u = {};
            changelog_data.changelog_output_i = {};
            changelog_data.changelog_nonrfid_u.new_records = [];
            changelog_data.changelog_nonrfid_u.old_records = [];
            changelog_data.changelog_output_u.new_records = [];
            changelog_data.changelog_output_u.old_records = [];
            changelog_data.changelog_output_i.new_records = [];
            changelog_data.changelog_output_i.old_records = [];
            let del_filter = {};
            del_filter.del_filter_u = [];
            del_filter.del_filter_o = [];
            del_filter.del_filter_p = [];
            let DB_data = {};
            DB_data.GH_Site = [];
            DB_data.Sync_Status = [];
            DB_data.Program = [];
            DB_data.Nonrfid = [];
            DB_data.Output = [];
            DB_data.keyArray = ["CM", "Site", "Aqid", "Program", "Line_Id", "Line_Type", "Uph", "Station", "Group_Priority", "Scope", "Sequence_No"];
            DB_data.map1 = {};
            DB_data.BohQty = [];
            DB_data.NonrfidBoh = [];
            DB_data.Projection = [];
            let range = {};
            range.GH_Site = [];
            range.Program = [];
            range.WhereCondition = [];
            range.Output = [];
            range.Temp = [];
            range.From_GHSite = [];
            range.From_Program = [];
            range.Aqid = [];
            let QTY_exceed_a = [];
            let outcome = {};
            let final_array = {};
            let outcome4;
            range = build_range(range, request.data.NonRfidData, request);
            DB_data = await get_dbdata(tx, range, DB_data, request);
            let allowed_cmsite = request.data.action === "approve" ? allowedattributes[`ApproveRfidOnHandTT`] : allowedattributes[`nonRFIDTTModify`];
            switch (request.data.action) {
                case "approve":
                    request.data.NonRfidData.forEach(e => {
                        LOG.info('in approve loop 2');
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        e.Error = AuthorizationCheck(e, allowed_cmsite);
                        e = ValidationCheckForApproval(e);
                        outcome = approve_records(e, insert_data, del_filter, changelog_data, DB_data, DB_data.Output, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        insert_data = final_array.insert_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "reject":
                    request.data.NonRfidData.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        e.Error = AuthorizationCheck(e, allowed_cmsite);
                        outcome = reject_records(e, insert_data, del_filter, changelog_data, DB_data, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "cancel":
                    request.data.NonRfidData.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        e.Error = AuthorizationCheck(e, allowed_cmsite);
                        outcome = cancel_records(e, insert_data, del_filter, changelog_data, DB_data, DB_data.Output, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        insert_data = final_array.insert_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "reset":
                    request.data.NonRfidData.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        e.Error = AuthorizationCheck(e, allowed_cmsite);
                        outcome = reset_records(e, insert_data, del_filter, changelog_data, DB_data, DB_data.Output, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        insert_data = final_array.insert_data;
                        if (request.req?.params?.Reset_Flag !== undefined) {
                            final_array.insert_data.Nonrfid_Insert.forEach(el => {
                                el.Reset_Flag = request.req.params.Reset_Flag;
                            })
                        }
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "save":
                    request.data.NonRfidData.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        e.Error = validate_projection_boh_qty(e, request.data.NonRfidData, DB_data, LOG);
                        e.Error = check_mand_fields(e);
                        if (e.Error === 'OQPass') {
                            e.Error = '';
                            e.Error = AuthorizationCheck(e, allowed_cmsite);
                            let leftOverQty = calculate_balance_qty(e, request.data.NonRfidData, DB_data);
                            request.req.params.LOG = LOG;
                            outcome = save_records(e, insert_data, del_filter, changelog_data, DB_data, request, leftOverQty);
                        }
                        else {
                            e = validate_data(e, DB_data);
                            e.Error = AuthorizationCheck(e, allowed_cmsite);
                            e.Error = check_qty_exceed(QTY_exceed_a, e);
                            let param = data_validation(e, request.data.NonRfidData, DB_data.Nonrfid, '');
                            e.Error = param.error;
                            QTY_exceed_a = fill_error(param, QTY_exceed_a, e);
                            let leftOverQty = calculate_balance_qty(e, request.data.NonRfidData, DB_data);
                            request.req.params.LOG = LOG;
                            outcome = save_records(e, insert_data, del_filter, changelog_data, DB_data, request, leftOverQty);
                        }
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        insert_data = final_array.insert_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });

                    outcome4 = update_override_qty(insert_data, DB_data, del_filter);
                    insert_data = outcome4.insert_data;
                    del_filter = outcome4.del_filter;
                    break;
            }
            LOG.info('outside loop 3');
            queries = delete_via_id(del_filter.del_filter_u, queries);
            queries = delete_via_id(del_filter.del_filter_p, queries, 'COM_APPLE_COA_T_COA_NONRFID_PROJECTION');
            queries = deleteInChunk(del_filter.del_filter_o, queries, 'COM_APPLE_COA_T_COA_OUTPUT');
            LOG.info(`outside loop 4 queries - ${queries}`);
            if (queries.length > 0) {
                await tx.run(queries);
            }
            if (insert_data.Output_Insert.length > 0) {
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_OUTPUT").entries(insert_data.Output_Insert));
            }
            if (insert_data.Nonrfid_Insert.length > 0) {
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_NONRFID_TT").entries(insert_data.Nonrfid_Insert));
            }
            if (insert_data.Projection_Insert.length > 0) {
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_NONRFID_PROJECTION").entries(insert_data.Projection_Insert));
            }
            await tx.commit();
            changelog_data_a = push_changelog(changelog_data.changelog_output_i, changelog_data_a, "INSERT", "T_COA_OUTPUT");
            changelog_data_a = push_changelog(changelog_data.changelog_output_u, changelog_data_a, "UPDATE", "T_COA_OUTPUT");
            changelog_data_a = push_changelog(changelog_data.changelog_nonrfid_u, changelog_data_a, "UPDATE", "T_COA_NONRFID_TT");
            if (changelog_data_a.length > 0) {
                // need to add change log
                LOG.info(`outside loop 5 change log request - ${changelog_data_a}`);
                update_changelog(changelog_data_a, request, LOG);
                LOG.info(`outside loop 6 change log response - ${changelog_data_a}`);
            }
            LOG.info(`outside loop 7 Loop close - ${nonrfid_err}`);
            return nonrfid_err;
        } catch (error) {
            await tx.rollback();
            LOG.info(`COA NonRFIDTT ${request.data.action} - Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    }

    function update_override_qty(insert_data, DB_data, del_filter) {
        let currOldData, newOvr, newInsData = [];
        for (let record of insert_data.Nonrfid_Insert) {
            if (record.Sequence_No === 0) {
                let idx = DB_data.Nonrfid.findIndex(el => el.CM === record.CM && el.Site === record.Site && el.Program === record.Program && el.Aqid === record.Aqid &&
                    el.Line_Id === record.Line_Id && el.Line_Type === record.Line_Type && el.Uph === record.Uph && el.Station === record.Station
                    && el.Sequence_No === 0);
                if (idx >= 0 && Number(record.Override_Qty) !== Number(DB_data.Nonrfid[idx].Override_Qty)) {
                    newOvr = Number(record.Override_Qty);
                    currOldData = DB_data.Nonrfid.filter(el => el.CM === record.CM && el.Site === record.Site && el.Program === record.Program && el.Aqid === record.Aqid &&
                        el.Line_Id === record.Line_Id && el.Line_Type === record.Line_Type && el.Uph === record.Uph && el.Station === record.Station && el.Sequence_No !== 0);

                    for (let olddbrec of currOldData) {
                        let newRec = insert_data.Nonrfid_Insert.find(el => el.CM === olddbrec.CM && el.Site === olddbrec.Site && el.Program === olddbrec.Program && el.Aqid === olddbrec.Aqid &&
                            el.Line_Id === olddbrec.Line_Id && el.Line_Type === olddbrec.Line_Type && el.Uph === olddbrec.Uph && el.Station === olddbrec.Station &&
                            el.Sequence_No === olddbrec.Sequence_No)
                        let outcome2 = update_overrideqty(newRec, olddbrec, newInsData, del_filter, newOvr);
                        newInsData = outcome2.newInsData;
                        del_filter = outcome2.del_filter;
                        newRec = outcome2.newRec;
                    }
                }
            }
        }
        if (newInsData.length > 0) {
            insert_data.Nonrfid_Insert = insert_data.Nonrfid_Insert.concat(newInsData);
        }
        return { insert_data, del_filter };
    }

    function update_overrideqty(newRec, olddbrec, newInsData, del_filter, newOvr) {
        if (newRec) {
            newRec.Override_Qty = newOvr;
        }
        else {
            delete olddbrec.Table_Mapped_Aqid;
            olddbrec.Override_Qty = newOvr;
            newInsData.push(olddbrec);
            del_filter.del_filter_u.push(olddbrec.ID);
        }
        return { newInsData, del_filter, newRec };
    }

    function check_mand_fields(data) {
        if (data.Error === "") {
            if (data.Override_Qty >= 0 && (data.To_GHSite === "" || data.To_GHSite === undefined || data.To_GHSite === null) && (data.To_Program === "" || data.To_Program === undefined
                || data.To_Program === null) && (data.To_Business_Grp === null || data.To_Business_Grp === "" || data.To_Business_Grp === undefined)
                && (data.Comments === "" || data.Comments === undefined || data.Comments === null)) {
                data.Error = `OQPass`;
            }
            else if (data.Override_Qty === 0 || data.To_GHSite === "" || data.To_GHSite === undefined || data.To_GHSite === null || data.To_Program === "" || data.To_Program === undefined
                || data.To_Program === null || data.To_Business_Grp === null || data.To_Business_Grp === "" || data.To_Business_Grp === undefined
                || data.Comments === "" || data.Comments === undefined || data.Comments === null) {
                data.Error = `You can’t keep the editable field's as blank`;
            }
        }
        return data.Error;
    }

    function validate_data(record, DB_data) {
        if (record.Error === "" || typeof record.Error === "undefined") {
            record = validate_GH_SITE(DB_data, record);
            record = validate_PROGRAM(DB_data, record);
            record = validate_MappedAqid(record);

            // Check the Transfer Quantity Validation for Splitted Record.
            if (record.Transfer_Qty && isNaN(Number(record.Transfer_Qty))) {

                record.Error = record.Error === "" ? `Invalid Transfer Quantity` : `${record.Error} and Invalid Transfer Quantity`;
            }
        }
        return record;
    }

    function validate_GH_SITE(DB_data, record) {
        const index = DB_data.GH_Site.findIndex(e1 => e1.GH_Site === record.To_GHSite);
        if (index < 0) {
            record.Error = record.Error === "" ? `Invalid To Function Location` : `${record.Error} and Invalid To Function Location`;
        } else {
            record.To_CM = DB_data.GH_Site[index].CM;
            record.To_Site = DB_data.GH_Site[index].Site;
            record.SAP_To_CM_Site = `${record.To_CM}-${record.To_Site}`;
        }
        return record;
    }

    function validate_PROGRAM(DB_data, record) {
        const index = DB_data.Program.findIndex(e1 => e1.Program === record.To_Program);
        if (index < 0) {
            record.Error = record.Error === "" ? `Invalid To PROGRAM` : `${record.Error} and Invalid To PROGRAM`;
        }
        return record;
    }

    function validate_MappedAqid(record) {
        let mapped_aqid_trimmed = getBlankStringIfUndefinedOrNull(record.Mapped_Aqid).toLowerCase().trim();
        if (!record.Mapped_Aqid || mapped_aqid_trimmed === '' || mapped_aqid_trimmed === 'not found' || mapped_aqid_trimmed === 'multiple nb found' || mapped_aqid_trimmed === 'undefined' || mapped_aqid_trimmed === undefined) {
            record.Error = record.Error ? `${record.Error} and Invalid Mapped AQID`: `Invalid Mapped AQID`;
        }
        return record;
    }

    function AuthorizationCheck(record, allowed_cmsite) {
        if (record.Error === "" || typeof record.Error === "undefined") {
            if (Object.keys(allowed_cmsite).length !== 0) {
                record.Error = (allowed_cmsite[`${record.CM}-${record.Site}`] !== undefined ||
                    allowed_cmsite[`$unrestricted-${record.Site}`] !== undefined ||
                    allowed_cmsite[`${record.CM}-$unrestricted}`] !== undefined ||
                    allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? '' : `User doesn't have authorization for this CM-SITE combination`;
            }
        }
        return record.Error;
    }

    function build_range(range, NonRFIdData, request) {
        NonRFIdData.forEach(e => {
            range.GH_Site = Append_IfUnique(range.GH_Site, e.To_GHSite);
            range.Program = Append_IfUnique(range.Program, e.To_Program);
            range.From_GHSite = Append_IfUnique(range.From_GHSite, e.GH_Site);
            range.From_Program = Append_IfUnique(range.From_Program, e.Program);
            let temp = {};
            temp.ID = getuuid();
            temp.GUID = request.req.params.uuid;
            temp.CM = e.CM;
            temp.GH_Site = e.GH_Site;
            temp.Site = e.Site;
            temp.To_GHSite = e.To_GHSite;
            temp.To_Program = e.To_Program;
            temp.Program = e.Program;
            temp.Aqid = e.Aqid;
            temp.Mapped_Aqid = e.Mapped_Aqid;
            temp.Line_Id = e.Line_Id;
            temp.Line_Type = e.Line_Type;
            temp.Uph = e.Uph
            temp.Grp = e.Group_Priority.substring(0, e.Group_Priority.indexOf('-'));
            temp.Station = e.Station;
            temp.Group_Priority = e.Group_Priority;
            temp.Scope = e.Scope;
            temp.Mfr = e.Mfr;
            temp.Sequence_No = e.Sequence_No;
            range.Aqid = Append_IfUnique(range.Aqid, e.Aqid);
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

    async function get_dbdata(tx, Result, DB_data, request) {
        DB_data = await get_GHSite_data(Result, DB_data, tx);
        DB_data = await validate_SyncStatus(Result, DB_data, tx);
        DB_data = await get_Projection_BohQty(Result, DB_data, tx);
        DB_data = await get_Projection_Data(Result, DB_data, tx);

        if (Result.Program.length > 0) {
            DB_data.Program = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('Program as Program').where({
                Program: { in: Result.Program }
            }));
        }
        await push_temp_data(Result.Temp);
        DB_data = await get_nonrfid_output_dbdata(tx, request, DB_data);
        DB_data = await get_NonRFID_BOHData(tx, request, DB_data);
        fillMultimap(DB_data.map1, DB_data.Nonrfid, DB_data.keyArray);
        await delete_temp_data(request.req.params.uuid);
        return DB_data;
    }

    async function get_nonrfid_output_dbdata(tx, request, DB_data) {
        DB_data.Nonrfid = await cds.run(`SELECT distinct V_COA_NONRFID_TT.*
                                            FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                            INNER JOIN V_NONRFID_TT AS V_COA_NONRFID_TT
                                            ON T_COA_TEMP.CM = V_COA_NONRFID_TT.CM
                                            AND T_COA_TEMP.Site = V_COA_NONRFID_TT.Site
                                            AND ( ( T_COA_TEMP.Aqid = V_COA_NONRFID_TT.Aqid  AND T_COA_TEMP.Grp = V_COA_NONRFID_TT.Grp ) OR 
                                                   (T_COA_TEMP.Grp = V_COA_NONRFID_TT.Grp AND T_COA_TEMP.Grp != '') )
                                            AND T_COA_TEMP.Program = V_COA_NONRFID_TT.Program
                                            AND T_COA_TEMP.Line_Id = V_COA_NONRFID_TT.Line_Id
                                            AND T_COA_TEMP.Line_Type = V_COA_NONRFID_TT.Line_Type
                                            AND T_COA_TEMP.Uph = V_COA_NONRFID_TT.Uph
                                            AND T_COA_TEMP.Station = V_COA_NONRFID_TT.Station
                                            AND T_COA_TEMP.Group_Priority = V_COA_NONRFID_TT.Group_Priority
                                            AND T_COA_TEMP.Scope = V_COA_NONRFID_TT.Scope
                                            WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);

        DB_data.Nonrfid = convert_nonrfid_to_camel(DB_data.Nonrfid);

        DB_data.Output = await cds.run(`SELECT distinct T_COA_OUTPUT.*
                                            FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                            INNER JOIN COM_APPLE_COA_T_COA_OUTPUT AS T_COA_OUTPUT
                                            ON T_COA_TEMP.GH_SITE = T_COA_OUTPUT.FROM_GHSITE
                                            AND T_COA_TEMP.PROGRAM = T_COA_OUTPUT.FROM_PRODUCT
                                            --AND T_COA_TEMP.MAPPED_AQID = T_COA_OUTPUT.AQID
                                            AND T_COA_TEMP.TO_GHSITE = T_COA_OUTPUT.TO_GHSITE
                                            AND T_COA_TEMP.TO_PROGRAM = T_COA_OUTPUT.TO_PRODUCT
                                            AND T_COA_OUTPUT.CO_TYPE = 'Non RFID'
                                            WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);

        DB_data.Output = convert_output_to_camel(DB_data.Output);

        return DB_data;
    }

    function convert_nonrfid_to_camel(Nonrfid) {

        let UpdateObj = Nonrfid.map(
            obj => {
                return {
                    "ID": obj.ID, "GH_Site": obj.GH_SITE, "CM": obj.CM, "Site": obj.SITE,
                    "Program": obj.PROGRAM, "Aqid": obj.AQID, "Line_Type": obj.LINE_TYPE, "Line_Id": obj.LINE_ID,
                    "Uph": obj.UPH, "Station": obj.STATION, "Scope": obj.SCOPE, "Parent_Item": obj.PARENT_ITEM, "Alt_Station": obj.ALT_STATION,
                    "Group_Priority": obj.GROUP_PRIORITY,
                    "Sequence_No": obj.SEQUENCE_NO,
                    "Equipment_Name": obj.EQUIPMENT_NAME,
                    "confLevel": obj.CONFLEVEL,
                    "Projected_Qty": Number(obj.PROJECTED_QTY),
                    "Override_Qty": Number(obj.OVERRIDE_QTY),
                    "Transfer_Qty": Number(obj.TRANSFER_QTY),
                    "Mfr": obj.MFR,
                    "BusinessGrp": obj.BUSINESSGRP,
                    "SAP_CM_Site": obj.SAP_CM_SITE,
                    "SAP_To_CM_Site": obj.SAP_TO_CM_SITE,
                    "Dept": obj.DEPT,
                    "RFID_Scope": obj.RFID_SCOPE,
                    "Group_ID": obj.GROUP_ID,
                    "Line_Priority": obj.LINE_PRIORITY,
                    "Equipment_Type": obj.EQUIPMENT_TYPE,
                    "To_CM": obj.TO_CM,
                    "To_Site": obj.TO_SITE,
                    "To_Program": obj.TO_PROGRAM,
                    "To_Business_Grp": obj.TO_BUSINESS_GRP,
                    "To_GHSite": obj.TO_GHSITE,
                    "Transfer_Flag": obj.TRANSFER_FLAG,
                    "Comments": obj.COMMENTS,
                    "Status": obj.STATUS,
                    "Submit_Date": obj.SUBMIT_DATE,
                    "Submit_By": obj.SUBMIT_BY,
                    "Review_Date": obj.REVIEW_DATE,
                    "Reviewed_By": obj.REVIEWED_BY,
                    "modifiedBy_Name": obj.MODIFIEDBY_NAME,
                    "modifiedBy_mail": obj.MODIFIEDBY_MAIL,
                    "createdBy_Name": obj.CREATEDBY_NAME,
                    "createdBy_mail": obj.CREATEDBY_MAIL,
                    "Submit_By_Name": obj.SUBMIT_BY_NAME,
                    "Submit_By_mail": obj.SUBMIT_BY_MAIL,
                    "Reviewed_By_Name": obj.REVIEWED_BY_NAME,
                    "Reviewed_By_mail": obj.REVIEWED_BY_MAIL,
                    "createdAt": obj.CREATEDAT,
                    "createdBy": obj.CREATEDBY,
                    "modifiedAt": obj.MODIFIEDAT,
                    "modifiedBy": obj.MODIFIEDBY,
                    "Mapped_Aqid": obj.MAPPED_AQID,
                    "Table_Mapped_Aqid": obj.TABLE_MAPPED_AQID
                }
            }
        );
        return UpdateObj;
    }


    function convert_to_camel(Nonrfid) {
        let UpdateObj;

        UpdateObj = Nonrfid.map(
            obj => {
                if (obj.PROGRAM !== undefined) {
                    return {
                        "Program": obj.PROGRAM,
                        "GH_Site": obj.GH_SITE
                    }
                } else {
                    return obj;
                }

            }
        );

        return UpdateObj;
    }

    function convert_output_to_camel(Output) {
        let outputObj = Output.map(
            obj => {
                return {
                    "From_CM": obj.FROM_CM, "From_Site": obj.FROM_SITE, "From_Product": obj.FROM_PRODUCT, "AQID": obj.AQID,
                    "To_CM": obj.TO_CM, "To_Site": obj.TO_SITE, "To_Product": obj.TO_PRODUCT, "CO_Type": obj.CO_TYPE,
                    "From_GHSite": obj.FROM_GHSITE, "To_GHSite": obj.TO_GHSITE, "From_Business_Grp": obj.FROM_BUSINESS_GRP,
                    "To_Business_Grp": obj.TO_BUSINESS_GRP, "EQ_Name": obj.EQ_NAME,
                    "MFR": obj.MFR, "Quantity": obj.QUANTITY, "CM_Balance_Qty": obj.CM_BALANCE_QTY,
                    "Approved_By": obj.APPROVED_BY, "Review_Date": obj.REVIEW_DATE, "Status": obj.STATUS,
                    "Comment": obj.COMMENT, "SAP_CM_Site": obj.SAP_CM_SITE, "SAP_To_CM_Site": obj.SAP_TO_CM_SITE,
                    "modifiedBy_Name": obj.MODIFIEDBY_NAME, "modifiedBy_mail": obj.MODIFIEDBY_MAIL, "createdBy_Name": obj.CREATEDBY_NAME,
                    "createdBy_mail": obj.CREATEDBY_MAIL, "Approved_By_Name": obj.APPROVED_BY_NAME, "Approved_By_mail": obj.APPROVED_BY_MAIL,
                    "createdAt": obj.CREATEDAT, "createdBy": obj.CREATEDBY, "modifiedAt": obj.MODIFIEDAT, "modifiedBy": obj.MODIFIEDBY
                }
            }
        );
        return outputObj;
    }
    async function get_GHSite_data(Result, DB_data, tx) {
        if (Result.GH_Site.length > 0) {
            DB_data.GH_Site = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('GH_Site as GH_Site', 'CM as CM', 'Site as Site').where({
                GH_Site: { in: Result.GH_Site }
            }));
        }
        return DB_data;
    }

    async function validate_SyncStatus(Result, DB_data, tx) {
        if (Result.From_GHSite.length > 0 && Result.From_Program.length > 0) {
            DB_data.Sync_Status = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SYNC_STATUS").where({
                GH_SITE: { in: Result.From_GHSite },
                PROGRAM: { in: Result.From_Program },
                APP: 'NonRfidTT'
            }));
        }
        return DB_data;
    }


    function approve_records(data, insert_data, del_filter, changelog_data, DB_data, Output, request) {
        let old_record = [];
        let new_record = [];
        if (data.Error === "") {
            let inAllSelection = getMultiLevelValue(DB_data.map1, [data.CM, data.Site, data.Aqid, data.Program, data.Line_Id, data.Line_Type, data.Uph, data.Station, data.Group_Priority, data.Scope, data.Sequence_No]);
            if (inAllSelection !== undefined) {
                if (inAllSelection.Status === "Pending" && inAllSelection.Transfer_Qty !== 0) {
                    old_record = Nonrfid_data(inAllSelection);
                    changelog_data.changelog_nonrfid_u.old_records.push(old_record);
                    data = fill_data_bydb(data, inAllSelection);
                    data.Status = statusObj[request.data.action];
                    data.Review_Date = new Date().toISOString();
                    data.Reviewed_By = request.user.id;
                    data.Reviewed_By_Name = request.req.params.user_name;
                    data.Reviewed_By_mail = request.req.params.user_mail;
                    data.modifiedAt = new Date().toISOString();
                    data.modifiedBy = request.user.id;
                    data.modifiedBy_Name = request.req.params.user_name;
                    data.modifiedBy_mail = request.req.params.user_mail;
                    delete data.Error;
                    insert_data.Nonrfid_Insert.push(data);
                    data.Mapped_Aqid = inAllSelection.Mapped_Aqid;
                    new_record = Nonrfid_data(data);
                    changelog_data.changelog_nonrfid_u.new_records.push(new_record);
                    del_filter.del_filter_u.push(data.ID);
                    let outcome = add_to_output(Output, inAllSelection, insert_data.Output_Insert, changelog_data, del_filter.del_filter_o, request);


                    insert_data.Output_Insert = outcome.Output_Insert;
                    changelog_data = outcome.changelog_data;
                    del_filter.del_filter_o = outcome.del_filter_a;
                } else {
                    data.Error = "Only Pending records with Transfer Qty not equal to zero can be Approved";
                }
            }
            else {
                data.Error = "Matching record is not found";
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function Nonrfid_data(request) {
        let record = [];
        if (request) {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.ID);
            record.push(request.GH_Site);
            record.push(request.CM);
            record.push(request.Site);
            record.push(request.Program);
            record.push(request.Line_Type);
            record.push(request.Uph);
            record.push(request.Aqid);
            record.push("");
            record.push(request.Station);
            record.push(request.Scope);
            record.push(request.Line_Id);
            record.push(request.Parent_Item);
            record.push(request.Alt_Station);
            record.push(request.Group_Priority);
            record.push(request.Sequence_No);
            record.push("");
            record.push(request.Equipment_Name);
            record.push(request.confLevel);
            record.push(request.Projected_Qty);
            record.push(request.Transfer_Qty);
            record.push(request.Override_Qty);
            record.push(request.Mfr);
            record.push(request.BusinessGrp);
            record.push(request.SAP_CM_Site);
            record.push(request.SAP_To_CM_Site);
            record.push(request.Dept);
            record.push(request.RFID_Scope);
            record.push(request.Group_ID);
            record.push(request.Line_Priority);
            record.push(request.Equipment_Type);
            record.push(request.To_CM);
            record.push(request.To_Site);
            record.push(request.To_Program);
            record.push(request.To_Business_Grp);
            record.push(request.To_GHSite);
            record.push(request.Transfer_Flag);
            record.push(request.Comments);
            record.push(request.Status);
            record.push(request.Submit_Date);
            record.push(request.Submit_By);
            record.push(request.Review_Date);
            record.push(request.Reviewed_By);
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.Submit_By_Name);
            record.push(request.Submit_By_mail);
            record.push(request.Reviewed_By_Name);
            record.push(request.Reviewed_By_mail);
            record.push("");
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
            record.push(0);
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

    function ValidationCheckForApproval(e) {
        e.Transfer_Qty = Number(e.Transfer_Qty);
        if (e.Transfer_Qty && isNaN(Number(e.Transfer_Qty))) {
            e.Error = e.Error === "" ? `Invalid Transfer Quantity` : `${e.Error} and Invalid Transfer Quantity`;
        }
        let mapped_aqid_trimmed = getBlankStringIfUndefinedOrNull(e.Mapped_Aqid).toLowerCase().trim();
        if (!e.Mapped_Aqid || mapped_aqid_trimmed === '' || mapped_aqid_trimmed === 'not found' || mapped_aqid_trimmed === 'multiple nb found' || mapped_aqid_trimmed === 'undefined' || mapped_aqid_trimmed === undefined) {
            e.Error = e.Error ? `${e.Error} and Invalid Mapped AQID`: `Invalid Mapped AQID`;
        }
        return e;
    }

    function getBlankStringIfUndefinedOrNull(arg)
    {
        return (arg || '')
    }

    function containsOnlyNumbers(str) {
        return /^\d+$/.test(str);
    }

    function reject_records(data, insert_data, del_filter, changelog_data, DB_data, request) {
        let old_record = [];
        let new_record = [];
        if (data.Error === "") {
            let inAllSelection = getMultiLevelValue(DB_data.map1, [data.CM, data.Site, data.Aqid, data.Program, data.Line_Id, data.Line_Type, data.Uph, data.Station, data.Group_Priority, data.Scope, data.Sequence_No]);
            if (inAllSelection !== undefined) {
                if (inAllSelection.Status === "Pending") {
                    old_record = Nonrfid_data(inAllSelection);
                    changelog_data.changelog_nonrfid_u.old_records.push(old_record);
                    data = fill_data_bydb(data, inAllSelection);
                    data.Status = statusObj[request.data.action];
                    data.Review_Date = new Date().toISOString();
                    data.Reviewed_By = request.user.id;
                    data.Reviewed_By_Name = request.req.params.user_name;
                    data.Reviewed_By_mail = request.req.params.user_mail;
                    data.modifiedAt = new Date().toISOString();
                    data.modifiedBy = request.user.id;
                    data.modifiedBy_Name = request.req.params.user_name;
                    data.modifiedBy_mail = request.req.params.user_mail;
                    delete data.Error;
                    insert_data.Nonrfid_Insert.push(data);
                    new_record = Nonrfid_data(data);
                    changelog_data.changelog_nonrfid_u.new_records.push(new_record);
                    del_filter.del_filter_u.push(data.ID);
                } else {
                    data.Error = "Only Pending records can be Rejected";
                }
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function cancel_records(data, insert_data, del_filter, changelog_data, DB_data, Output, request) {
        let old_record = [];
        let new_record = [];
        if (data.Error === "") {
            let inAllSelection = getMultiLevelValue(DB_data.map1, [data.CM, data.Site, data.Aqid, data.Program, data.Line_Id, data.Line_Type, data.Uph, data.Station, data.Group_Priority, data.Scope, data.Sequence_No]);
            if (inAllSelection !== undefined) {
                if ((inAllSelection.Status === "Approved" || inAllSelection.Status === "Pending" || inAllSelection.Status === "Rejected") && (inAllSelection.Transfer_Qty === 0)) {
                    data = fill_data_bydb(data, inAllSelection);
                    if (inAllSelection.Sequence_No === 0) {
                    old_record = Nonrfid_data(inAllSelection);
                    changelog_data.changelog_nonrfid_u.old_records.push(old_record);
                    data.Status = "";
                    data.Review_Date = null;
                    data.Reviewed_By = "";
                    data.Reviewed_By_Name = "";
                    data.Reviewed_By_mail = "";
                    data.modifiedAt = new Date().toISOString();
                    data.modifiedBy_Name = request.req.params.user_name;
                    data.modifiedBy_mail = request.req.params.user_mail;
                    data.modifiedBy = request.user.id;
                    data.To_GHSite = "";
                    data.To_CM = "";
                    data.To_GHSite = "";
                    data.To_Business_Grp = "";
                    data.To_Program = "";
                    data.Comments = "";
                    data.Transfer_Flag = "";
                    data.Transfer_Qty = 0;
                    delete data.Error;
                    insert_data.Nonrfid_Insert.push(data);
                    new_record = Nonrfid_data(data);
                    changelog_data.changelog_nonrfid_u.new_records.push(new_record);
                    }
                    del_filter.del_filter_u.push(data.ID);
                } else {
                    data.Error = "Only Pending or Approved records with transfer quantity zero can be cancelled";
                }
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    function push_changelog(changelog_data, changelog_data_a, action, table) {
        if (changelog_data.new_records.length > 0 || changelog_data.old_records.length > 0) {
            changelog_data.action = action;
            changelog_data.table = table;
            changelog_data_a.push(changelog_data);
        }
        return changelog_data_a;
    }

    function reset_records(data, insert_data, del_filter, changelog_data, DB_data, Output, request) {
        let old_record = [];
        let new_record = [];
        if (data.Error === "") {
            let inAllSelection = getMultiLevelValue(DB_data.map1, [data.CM, data.Site, data.Aqid, data.Program, data.Line_Id, data.Line_Type, data.Uph, data.Station, data.Group_Priority, data.Scope, data.Sequence_No]);
            if (inAllSelection !== undefined) {
                if (inAllSelection.Status === "Approved") {
                    data = fill_data_bydb(data, inAllSelection);
                    old_record = Nonrfid_data(inAllSelection);
                    changelog_data.changelog_nonrfid_u.old_records.push(old_record);
                    data.Status = "Pending";
                    data.Review_Date = null;
                    data.Reviewed_By = "";
                    data.Reviewed_By_Name = "";
                    data.Reviewed_By_mail = "";
                    data.modifiedAt = new Date().toISOString();
                    data.modifiedBy = request.user.id;
                    data.modifiedBy_Name = "";
                    data.modifiedBy_mail = "";
                    delete data.Error;
                    insert_data.Nonrfid_Insert.push(data);
                    new_record = Nonrfid_data(data);
                    changelog_data.changelog_nonrfid_u.new_records.push(new_record);
                    del_filter.del_filter_u.push(data.ID);
                    let outcome = sub_from_output(Output, inAllSelection, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                    insert_data.Output_Insert = outcome.Output_Insert;
                    changelog_data.changelog_output_u = outcome.changelog_data;
                    del_filter.del_filter_o = outcome.del_filter_a;
                } else {
                    data.Error = "Only Approved records can be Reset"
                }
            }
        }
        return { data, del_filter, changelog_data, insert_data };
    }

    async function selectall_action(request, result, tx, LOG) {
        try {
            let nonrfid_err = [];
            let insert_data = {};
            insert_data.Output_Insert = [];
            insert_data.Nonrfid_Insert = [];
            let queries = [];
            let changelog_data_a = [];
            let changelog_data = {};
            changelog_data.changelog_nonrfid_u = {};
            changelog_data.changelog_output_u = {};
            changelog_data.changelog_output_i = {};
            changelog_data.changelog_nonrfid_u.new_records = [];
            changelog_data.changelog_nonrfid_u.old_records = [];
            changelog_data.changelog_output_u.new_records = [];
            changelog_data.changelog_output_u.old_records = [];
            changelog_data.changelog_output_i.new_records = [];
            changelog_data.changelog_output_i.old_records = [];
            let del_filter = {};
            del_filter.del_filter_u = [];
            del_filter.del_filter_o = [];
            let DB_data = {};
            DB_data.GH_Site = [];
            DB_data.Sync_Status = [];
            DB_data.Program = [];
            DB_data.Nonrfid = [];
            DB_data.Output = [];
            DB_data.keyArray = ["CM", "Site", "Aqid", "Program", "Line_Id", "Line_Type", "Uph", "Station", "Group_Priority", "Scope", "Sequence_No"];
            DB_data.map1 = {};
            DB_data.BohQty = [];
            DB_data.NonrfidBoh = [];
            DB_data.Projection = [];
            let range = {};
            range.GH_Site = [];
            range.Program = [];
            range.Temp = [];
            range.From_GHSite = [];
            range.From_Program = [];
            range.Aqid = [];
            let QTY_exceed_a = [];
            let final_array = {};
            let outcome = {};
            range = selectall_range(range, result, request);
            LOG.info(`mass update range ${range}`);
            DB_data = await get_dbdata(tx, range, DB_data, request);
            
            LOG.info(`mass update db date ${DB_data}`);
            if (request.data.action === 'save') {
                request = fill_cm_site(request, DB_data);
            }
            switch (request.data.action) {
                case "mapprove":
                    result.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        e = ValidationCheckForApproval(e);
                        outcome = approve_records(e, insert_data, del_filter, changelog_data, DB_data, DB_data.Output, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        insert_data = final_array.insert_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "mreject":
                    result.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        outcome = reject_records(e, insert_data, del_filter, changelog_data, DB_data, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "mcancel":
                    result.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        outcome = cancel_records(e, insert_data, del_filter, changelog_data, DB_data, DB_data.Output, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        insert_data = final_array.insert_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "mreset":
                    result.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        outcome = reset_records(e, insert_data, del_filter, changelog_data, DB_data, DB_data.Output, request);
                        final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                        del_filter = final_array.del_filter;
                        changelog_data = final_array.changelog_data;
                        insert_data = final_array.insert_data;
                        nonrfid_err = final_array.nonrfid_err;
                    });
                    break;
                case "save":
                    result.forEach(e => {
                        outcome = {};
                        final_array = {};
                        e.Error = "";
                        e.Error = check_sync_status(e, DB_data.Sync_Status);
                        e.To_GHSite = request.data.To_GHSite;
                        e.To_Program = request.data.To_Program;
                        e.Transfer_Flag = request.data.Transfer_Flag;
                        e.Comments = request.data.Comments;
                        e.To_Business_Grp = request.data.To_Business_Grp;
                        e.Transfer_Qty = Number(request.data.Transfer_Qty);
                        e = validate_data(e, DB_data);
                        e.Error = check_qty_exceed(QTY_exceed_a, e);
                        let param = data_validation(e, result, DB_data.Nonrfid, request.data.Transfer_Qty);
                        e.Error = param.error;
                        QTY_exceed_a = fill_error(param, QTY_exceed_a, e);
                        if (e.Error === "") {
                            request.req.params.LOG = LOG;
                            outcome = selectall_save(e, insert_data, del_filter, changelog_data, DB_data, DB_data.Output, request);
                            final_array = get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err);
                            del_filter = final_array.del_filter;
                            changelog_data = final_array.changelog_data;
                            insert_data = final_array.insert_data;
                            nonrfid_err = final_array.nonrfid_err;
                        } else {
                            nonrfid_err.push(e);
                        }
                    });
                    break;
                case "mdelete":
                    return await delete_mass_non_rfid(result, DB_data, tx);
            }
            queries = delete_via_id(del_filter.del_filter_u, queries);
            queries = deleteInChunk(del_filter.del_filter_o, queries, 'COM_APPLE_COA_T_COA_OUTPUT');
            if (queries.length > 0) {
                await tx.run(queries);
            }
            if (insert_data.Output_Insert.length > 0) {
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_OUTPUT").entries(insert_data.Output_Insert));
            }
            if (insert_data.Nonrfid_Insert.length > 0) {
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_NONRFID_TT").entries(insert_data.Nonrfid_Insert));
            }
            await tx.commit();
            changelog_data_a = push_changelog(changelog_data.changelog_output_i, changelog_data_a, "INSERT", "T_COA_OUTPUT");
            changelog_data_a = push_changelog(changelog_data.changelog_output_u, changelog_data_a, "UPDATE", "T_COA_OUTPUT");
            changelog_data_a = push_changelog(changelog_data.changelog_nonrfid_u, changelog_data_a, "UPDATE", "T_COA_NONRFID_TT");
            if (changelog_data_a.length > 0) {
                //need to add change log function
                update_changelog(changelog_data_a, request, LOG);
            }
            return nonrfid_err;
        }
        catch (err) {
            await tx.rollback();
            LOG.info(`COA Select All - Error: ${JSON.stringify(err)}`);
            return `Error: ${JSON.stringify(err)} `;
        }
    }

    function check_qty_exceed(QTY_exceed_a, record) {
        if (record.Error === "") {
            const index = QTY_exceed_a.findIndex(pel => pel.GH_Site === record.GH_Site && pel.Program === record.Program &&
                pel.Line_Type === record.Line_Type && pel.Uph === record.Uph && pel.Station === record.Station &&
                pel.Line_Id === record.Line_Id && pel.Aqid === record.Aqid && pel.Scope === record.Scope &&
                pel.Group_Priority === record.Group_Priority);
            if(index >= 0){
                record.Error = QTY_exceed_a[index].Error;
            }
        }
        return record.Error;
    }


    function get_final_objects(e, outcome, del_filter, changelog_data, insert_data, nonrfid_err) {
        if (e.Error === "") {
            del_filter = outcome.del_filter;
            changelog_data = outcome.changelog_data;
            e = outcome.data;
            insert_data = outcome.insert_data;
        }
        else {
            nonrfid_err = append_record(e, '', nonrfid_err, 'Error');
        }
        return { e, del_filter, changelog_data, insert_data, nonrfid_err };
    }

    function selectall_save(data, insert_data, del_filter, changelog_data, DB_data, Output, request) {
        const LOG = request.req.params.LOG;
        let old_record = [];
        let new_record = [];
        if (data.Error === "") {
            LOG.info(`mass update selectall_save data ${data}`);
            let inAllSelection = getMultiLevelValue(DB_data.map1, [data.CM, data.Site, data.Aqid, data.Program, data.Line_Id, data.Line_Type, data.Uph, data.Station, data.Group_Priority, data.Scope, data.Sequence_No]);
            if (inAllSelection !== undefined) {
                old_record = Nonrfid_data(inAllSelection);
                data = fill_data_bydb(request.data, inAllSelection);
                data.Override_Qty = Number(inAllSelection.Override_Qty);
                data.Review_Date = null;
                data.Reviewed_By = "";
                data.Reviewed_By_Name = "";
                data.Reviewed_By_mail = "";
                data.modifiedAt = new Date().toISOString();
                data.modifiedBy = request.user.id;
                data.modifiedBy_Name = request.req.params.user_name;
                data.modifiedBy_mail = request.req.params.user_mail;
                if (!inAllSelection.Status) {
                    data.Submit_By = request.user.id;
                    data.Submit_By_mail = request.req.params.user_mail;
                    data.Submit_By_Name = request.req.params.user_name;
                    data.Submit_Date = new Date().toISOString();
                }
                data.Error = check_mand_fields(data);
                if (data.Error === "") {
                    changelog_data.changelog_nonrfid_u.old_records.push(old_record);
                    if (inAllSelection.Status === "Approved") {
                        let outcome = sub_from_output(Output, inAllSelection, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                        insert_data.Output_Insert = outcome.Output_Insert;
                        changelog_data.changelog_output_u = outcome.changelog_data;
                        del_filter.del_filter_o = outcome.del_filter_a;
                    }
                    data.Status = "Pending";
                    insert_data.Nonrfid_Insert.push(data);
                    delete data.Error;
                    new_record = Nonrfid_data(data);
                    changelog_data.changelog_nonrfid_u.new_records.push(new_record);
                    del_filter.del_filter_u.push(data.ID)
                }
            }
            return { data, del_filter, changelog_data, insert_data };
        }
    }

    function selectall_range(range, result, request) {
        range.GH_Site = Append_IfUnique(range.GH_Site, request.data.To_GHSite);
        range.Program = Append_IfUnique(range.Program, request.data.To_Program);
        result.forEach(e => {

            e.Transfer_Qty = Number(e.Transfer_Qty);
            e.Override_Qty = Number(e.Override_Qty);
            e.Projected_Qty = Number(e.Projected_Qty);
            e.confLevel = Number(e.confLevel);
            let temp = {};
            temp.ID = getuuid();
            temp.GUID = request.req.params.uuid;
            temp.CM = e.CM;
            temp.GH_Site = e.GH_Site;
            temp.Site = e.Site;
            temp.To_GHSite = e.To_GHSite;
            temp.To_Program = e.To_Program;
            temp.Program = e.Program;
            temp.Aqid = e.Aqid;
            temp.Mapped_Aqid = e.Mapped_Aqid;
            temp.Line_Id = e.Line_Id;
            temp.Line_Type = e.Line_Type;
            temp.Uph = e.Uph
            temp.Station = e.Station;
            temp.Group_Priority = e.Group_Priority;
            temp.Scope = e.Scope;
            temp.Mfr = e.Mfr;
            temp.Sequence_No = e.Sequence_No;
            temp.Grp = e.Group_Priority.substring(0, e.Group_Priority.indexOf('-'));
            range.From_GHSite = Append_IfUnique(range.From_GHSite, e.GH_Site);
            range.From_Program = Append_IfUnique(range.From_Program, e.Program);
            range.Aqid = Append_IfUnique(range.Aqid, e.Aqid);
            range.Temp.push(temp);
        });
        return range;
    }

    function fill_cm_site(request, DB_data) {
        if (DB_data.GH_Site.length > 0) {
            request.data.To_CM = DB_data.GH_Site[0].CM;
            request.data.To_Site = DB_data.GH_Site[0].Site;
        } else {
            request.reject(500, `Invalid To Function Location`);
        }
        if (DB_data.Program.length < 1) {
            request.reject(500, `Invalid To Program`);
        }
        return request;
    }

    async function push_temp_data(Temp) {
        const tx1 = hdb.tx();
        try {
            if (Temp.length > 0) {
                await tx1.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries(Temp));
                await tx1.commit();
            }
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

    function fill_data_bydb(data, DB_data) {
        let record = {};
        record.ID = DB_data.ID;
        record.GH_Site = DB_data.GH_Site;
        record.CM = DB_data.CM;
        record.Site = DB_data.Site;
        record.Program = DB_data.Program ? DB_data.Program : '';
        record.BusinessGrp = DB_data.BusinessGrp ? DB_data.BusinessGrp : '';
        record.Aqid = DB_data.Aqid;
        record.Sequence_No = DB_data.Sequence_No ? DB_data.Sequence_No : 0;
        record.Projected_Qty = Number(DB_data.Projected_Qty);
        record.Station = DB_data.Station;
        record.confLevel = DB_data.confLevel;
        record.Alt_Station = DB_data.Alt_Station;
        record.Uph = DB_data.Uph;
        record.Group_Priority = DB_data.Group_Priority;
        record.Group_ID = DB_data.Group_ID;
        record.Line_Id = DB_data.Line_Id;
        record.Line_Type = DB_data.Line_Type;
        record.Line_Priority = DB_data.Line_Priority;
        record.Equipment_Name = DB_data.Equipment_Name;
        record.Equipment_Type = DB_data.Equipment_Type;
        record.RFID_Scope = DB_data.RFID_Scope;
        record.Dept = DB_data.Dept;
        record.Mfr = DB_data.Mfr;
        record.Parent_Item = DB_data.Parent_Item;
        record.Scope = DB_data.Scope;
        record.createdAt = DB_data.createdAt;
        record.createdBy = DB_data.createdBy;
        record.createdBy_Name = DB_data.createdBy_Name;
        record.createdBy_mail = DB_data.createdBy_mail;
        record.modifiedAt = DB_data.modifiedAt;
        record.modifiedBy = DB_data.modifiedBy;
        record.modifiedBy_Name = DB_data.modifiedBy_Name;
        record.modifiedBy_mail = DB_data.modifiedBy_mail;
        record.To_GHSite = data.To_GHSite ? data.To_GHSite : DB_data.To_GHSite;
        record.To_CM = data.To_CM ? data.To_CM : DB_data.To_CM;
        record.To_Site = data.To_Site ? data.To_Site : DB_data.To_Site;
        record.To_Program = data.To_Program ? data.To_Program : DB_data.To_Program;
        record.To_Business_Grp = data.To_Business_Grp ? data.To_Business_Grp.toUpperCase() : DB_data.To_Business_Grp;
        record.Transfer_Flag = data.Transfer_Flag;
        record.Comments = data.Comments ? data.Comments : DB_data.Comments;
        record.Override_Qty = Number(data.Override_Qty);
        let transferQty = 0;
        if (data.Transfer_Qty || data.Transfer_Qty === 0) {
            transferQty = Number(data.Transfer_Qty);
        }
        else if (data.To_GHSite && data.Override_Qty) {
            transferQty = Number(data.Override_Qty);
        }
        else if (DB_data.Transfer_Qty) {
            transferQty = Number(DB_data.Transfer_Qty);
        }
        record.Transfer_Qty = transferQty;
        record.SAP_CM_Site = DB_data.SAP_CM_Site;
        record.SAP_To_CM_Site = `${record.To_CM}-${record.To_Site}`;
        record.Reviewed_By = DB_data.Reviewed_By;
        record.Review_Date = DB_data.Review_Date;
        record.Reviewed_By_Name = DB_data.Reviewed_By_Name;
        record.Reviewed_By_mail = DB_data.Reviewed_By_mail;
        record.Submit_By = DB_data.Submit_By;
        record.Submit_Date = DB_data.Submit_Date;
        record.Submit_By_Name = DB_data.Submit_By_Name;
        record.Submit_By_mail = DB_data.Submit_By_mail;
        record.Mapped_Aqid = DB_data.Mapped_Aqid;      //NC
        record.Error = "";
        return record;
    }

    async function delete_mass_non_rfid(result, NonRFID, tx) {
        let changelog_data = {};
        let nonrfid_err = [];
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        let del_split_a = [];
        let queries = [];
        result.forEach(element => {
            element.Error = "";
            let inAllSelection = getMultiLevelValue(NonRFID.map1, [element.CM, element.Site, element.Aqid, element.Program, element.Line_Id, element.Line_Type, element.Uph, element.Station, element.Group_Priority, element.Scope, element.Sequence_No]);
            let sync_ip_error = check_sync_status(element, NonRFID.Sync_Status);
            if (inAllSelection !== undefined) {
                if (inAllSelection.Sequence_No === 0) {
                    element.Error = `Parent records cannot be deleted`;
                    nonrfid_err.push(element);
                }
                else if (inAllSelection.Status === 'Approved') {
                    element.Error = `Approved record can't be deleted`;
                    nonrfid_err.push(element);
                }
                else if (sync_ip_error) {
                    element.Error = sync_ip_error;
                    nonrfid_err.push(element);
                }
                else {
                    del_split_a.push(inAllSelection.ID);
                }
            }
            else {
                element.Error = `Marching records is not found`;
                nonrfid_err.push(element);
            }
        });

        if (del_split_a.length > 0) {
            queries = delete_via_id(del_split_a, queries);
        }
        if (queries.length > 0) {
            await tx.run(queries);
        }
        await tx.commit();
        let msg = nonrfid_err.length > 0 ? get_msg(nonrfid_err) : get_msg(nonrfid_err, 'Record deleted successfully');
        return msg;
    }

    function add_to_output(DB_Output, record, Output_Insert, changelog_data, del_filter_a, request) {
        let Output_Insert_Index = Output_Insert.findIndex(e => e.From_GHSite === record.GH_Site && e.From_Product === record.Program && e.AQID === record.Mapped_Aqid && e.To_GHSite === record.To_GHSite && e.To_Product === record.To_Program && e.CO_Type === "Non RFID");
        let finalQuantity = record.Transfer_Qty ? record.Transfer_Qty : record.Override_Qty;
        if (Output_Insert_Index >= 0) {
            Output_Insert[Output_Insert_Index].Quantity = Output_Insert[Output_Insert_Index].Quantity + Number(finalQuantity);
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
        let finalQuantity = record.Transfer_Qty ? record.Transfer_Qty : record.Override_Qty;
        let Reset_data = get_output_recs(DB_Output, record);
        const index1 = Output_Insert.findIndex(e => e.From_GHSite === record.GH_Site && e.From_Product === record.Program && e.AQID === record.Mapped_Aqid);
        if (index1 < 0) {

            Reset_data.forEach(el => {
                el.Quantity = Number(el.Quantity);
                old_record = output_data(el);
                changelog_data = push_to_changelog_array(action, changelog_data, old_record);
                el.Quantity = get_upd_qty(el.Quantity, action, finalQuantity, el, record);
                el.modifiedAt = new Date().toISOString();
                el.modifiedBy = request.user.id;
                el.Comment = `Quantity Reset`;
                el.CM_Balance_Qty = 0;
                el.Approved_By = "";
                el.Review_Date = null;
                el.Approved_By_Name = "";
                el.Approved_By_mail = "";
                el.From_Business_Grp = el.From_Business_Grp ? el.From_Business_Grp : record.BusinessGrp;
                el.Status = get_op_status(request, el.Status, el.Quantity);
                new_record = output_data(el);
                action === "Add" ? changelog_data.changelog_output_u.new_records.push(new_record) : changelog_data.new_records.push(new_record);
                Output_Insert.push(el);
                let del_filter = {};
                del_filter.From_CM = el.From_CM;
                del_filter.From_Site = el.From_Site;
                del_filter.From_Product = el.From_Product;
                del_filter.AQID = el.AQID;
                del_filter.To_CM = el.To_CM;
                del_filter.To_Site = el.To_Site;
                del_filter.To_Product = el.To_Product;
                del_filter.CO_Type = el.CO_Type;
                del_filter_a.push(del_filter);
            });
        }
        const index = Reset_data.findIndex(e => e.From_GHSite === record.GH_Site && e.From_Product === record.Program && e.AQID === record.Mapped_Aqid && e.To_GHSite === record.To_GHSite && e.To_Product === record.To_Program && e.CO_Type === "Non RFID");
        if (index < 0 && action === "Add") {
            let outcome = create_new_co_op(changelog_data, Output_Insert, record, request);
            Output_Insert = outcome.Output_Insert;
            changelog_data = outcome.changelog_data;
        }
        return { Output_Insert, changelog_data, del_filter_a };
    }

    function reset_qty_sub(DB_Output, Output_Insert, record, changelog_data, request, del_filter_a, action) {
        let old_record = [];
        let new_record = [];
        let finalQuantity = record.Transfer_Qty ? record.Transfer_Qty : record.Override_Qty;
        let Reset_data = get_output_recs_sub(DB_Output, record);
        const index1 = Output_Insert.findIndex(e => e.From_GHSite === record.GH_Site && e.From_Product === record.Program && e.AQID === record.Table_Mapped_Aqid);
        if (index1 < 0) {
            Reset_data.forEach(e => {
                e.Quantity = Number(e.Quantity);
                old_record = output_data(e);
                changelog_data = push_to_changelog_array(action, changelog_data, old_record);
                e.Quantity = get_upd_qty(e.Quantity, action, finalQuantity, e, record);
                e.modifiedAt = new Date().toISOString();
                e.modifiedBy = request.user.id;
                e.Comment = `Quantity Reset`;
                e.CM_Balance_Qty = 0;
                e.Approved_By = "";
                e.Review_Date = null;
                e.Approved_By_Name = "";
                e.Approved_By_mail = "";
                e.Status = get_op_status(request, e.Status, e.Quantity);
                new_record = output_data(e);
                action === "Add" ? changelog_data.changelog_output_u.new_records.push(new_record) : changelog_data.new_records.push(new_record);
                Output_Insert.push(e);
                let del_filter = {};
                del_filter.From_CM = e.From_CM;
                del_filter.From_Site = e.From_Site;
                del_filter.From_Product = e.From_Product;
                del_filter.AQID = e.AQID;
                del_filter.To_CM = e.To_CM;
                del_filter.To_Site = e.To_Site;
                del_filter.To_Product = e.To_Product;
                del_filter.CO_Type = e.CO_Type;
                del_filter_a.push(del_filter);
            });
        }
        const index = Reset_data.findIndex(e => e.From_GHSite === record.GH_Site && e.From_Product === record.Program && e.AQID === record.Table_Mapped_Aqid && e.To_GHSite === record.To_GHSite && e.To_Product === record.To_Program && e.CO_Type === "Non RFID");
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

    function get_op_status(request, Status, Quantity) {
        Quantity = Number(Quantity);
        if (request.data.action === 'cancel' || request.data.action === 'mcancel') {
            Status = Quantity > 0 ? "Pending" : "";
        }
        else {
            Status = (Status === "Rejected" || Status === "") ? Status : "Pending";
        }
        return Status;
    }

    function create_new_co_op(changelog_data, Output_Insert, record, request) {
        let old_record = [];
        let new_record = [];
        let finalQuantity = record.Transfer_Qty ? record.Transfer_Qty : record.Override_Qty;
        let Output =
        {
            From_CM: record.CM,
            From_Site: record.Site,
            From_Product: record.Program,
            AQID: record.Mapped_Aqid,
            To_CM: record.To_CM,
            To_Site: record.To_Site,
            To_Product: record.To_Program,
            From_GHSite: record.GH_Site,
            To_GHSite: record.To_GHSite,
            From_Business_Grp: record.BusinessGrp,
            To_Business_Grp: record.To_Business_Grp,
            EQ_Name: record.Equipment_Name,
            MFR: record.Mfr,
            Quantity: Number(finalQuantity),
            CM_Balance_Qty: 0,
            Approved_By: "",
            Review_Date: null,
            Status: "",
            Comment: "",
            SAP_CM_Site: record.SAP_CM_Site,
            SAP_To_CM_Site: record.SAP_To_CM_Site,
            modifiedAt: new Date().toISOString(),
            modifiedBy: request.user.id,
            modifiedBy_Name: null,
            modifiedBy_mail: null,
            createdAt: new Date().toISOString(),
            createdBy: request.user.id,
            createdBy_Name: null,
            createdBy_mail: null,
            Approved_By_Name: "",
            Approved_By_mail: "",
            CO_Type: "Non RFID"
        };
        old_record = output_data("");
        changelog_data.changelog_output_i.old_records.push(old_record);
        new_record = output_data(Output);
        changelog_data.changelog_output_i.new_records.push(new_record);
        Output_Insert.push(Output);
        return { Output_Insert, changelog_data };
    }

    function get_upd_qty(data, action, Qty, e, record) {
        Qty = Number(Qty);
        if (e.From_GHSite === record.GH_Site && e.From_Product === record.Program && e.AQID === record.Table_Mapped_Aqid && e.To_GHSite === record.To_GHSite && e.To_Product === record.To_Program && e.CO_Type === "Non RFID") {
            if (action === "Add") {
                data = data + Qty;
            } else {
                data = data - Qty < 0 ? 0 : data - Qty;
            }
        }
        return data;
    }

    function sub_from_output(DB_Output, record, Output_Insert, changelog_data, del_filter_a, request) {
        let DB_Output_Index = Output_Insert.findIndex(e => e.From_GHSite === record.GH_Site && e.From_Product === record.Program && e.AQID === record.Table_Mapped_Aqid && e.To_GHSite === record.To_GHSite && e.To_Product === record.To_Program && e.CO_Type === "Non RFID");
        let finalQuantity = record.Transfer_Qty ? record.Transfer_Qty : record.Override_Qty;

        if (DB_Output_Index >= 0) {
            Output_Insert[DB_Output_Index].Quantity = (Output_Insert[DB_Output_Index].Quantity - finalQuantity) < 0 ? 0 : (Output_Insert[DB_Output_Index].Quantity - finalQuantity);
        }
        else {
            let outcome = reset_qty_sub(DB_Output, Output_Insert, record, changelog_data, request, del_filter_a, "Subtract");
            Output_Insert = outcome.Output_Insert;
            changelog_data = outcome.changelog_data;
            del_filter_a = outcome.del_filter_a;
        }
        return { Output_Insert, changelog_data, del_filter_a };
    }

    function get_output_recs(QTYCal, data) {
        return QTYCal.filter(el => {
            if (el.From_GHSite === data.GH_Site && el.From_Product === data.Program && el.AQID === data.Mapped_Aqid) {
                return el;
            }
        });
    }

    function get_output_recs_sub(QTYCal, data) {
        return QTYCal.filter(el => {
            if (el.From_GHSite === data.GH_Site && el.From_Product === data.Program && el.AQID === data.Table_Mapped_Aqid) {
                return el;
            }
        });
    }

    function getAllowedAttributesCommon(jwtdetails, request, LOG) {
        const RoleNames = jwtdetails['xs.system.attributes'];
        let ScopesRelevantToThisApp = [`nonRFIDTTReadOnly`, `nonRFIDTTModify`, `SyncActionAll`, `ApproveRfidOnHandTT`];
        let allowedAttributes = {};
        ScopesRelevantToThisApp.forEach((scope) => {
            if (allowedAttributes[scope] === undefined) allowedAttributes[scope] = {}
        })
        try {
            let srvCred = {};
            srvCred = getServiceCredentials(srvCred);

            addAllowedAttributes(allowedAttributes, RoleNames, srvCred, ScopesRelevantToThisApp);

            return allowedAttributes;
        }
        catch (err) {
            LOG.info("AuthObject Parse error: ", err.response?.data || err.response || err);
            request.reject(400, "AuthObject Parse error");
        }
    }
    function addAllowedAttributes(allowedAttributes, RoleNames, srvCred, ScopesRelevantToThisApp) {
        for (let roleName of RoleNames["xs.rolecollections"]) {
            if (srvCred && srvCred[roleName] !== undefined) {
                ScopesRelevantToThisApp.forEach((scope) => {
                    if (srvCred[roleName][scope] !== undefined) augmentArray(allowedAttributes[scope], srvCred[roleName][scope]["CM-Site"])
                });
            }
        }
        return allowedAttributes;
    }
    function getFilterString(obj, f4, LOG) {
        let arr = [];
        if (obj[`$unrestricted-$unrestricted`] !== undefined || Object.keys(obj).length === 0) return '';
        Object.keys(obj).forEach(key => {
            let tmparr = [];
            if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`CM='${key.slice(0, key.indexOf('-'))}'`);
            if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`Site='${key.slice(key.indexOf('-') + 1, key.length)}'`);
            if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
            arr.push(tmparr[0]);
            if (f4 !== 'X') {
                tmparr = [];
                arr = set_filter_arr(arr, tmparr, key);
            }
        });
        if (arr.length > 0) {
            let str = `(${arr.join(") or (")})`;
            LOG.info("str: ", str);
            return str;
        }
        else {
            return f4 === 'X' ? (`(CM='NULL' and Site='NULL')`) : (`((CM='NULL' and Site='NULL') or (To_CM='NULL' and To_Site='NULL'))`);
        }
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

    function set_filter_arr(arr, tmparr, key) {
        if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`To_CM='${key.slice(0, key.indexOf('-'))}'`);
        if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`To_Site='${key.slice(key.indexOf('-') + 1, key.length)}'`);
        if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
        arr.push(tmparr[0]);
        return arr;
    }

    function save_split_record(DB_data, inAllSelection, data, insert_data, changelog_data, del_filter, request) {
        if (inAllSelection.Sequence_No === 0 && Number(data.Override_Qty) !== Number(inAllSelection.Override_Qty)) {
            let SplitRecords = DB_data.Nonrfid.filter(el => el.CM === data.CM && el.Site === data.Site && el.Program === data.Program && el.Aqid === data.Aqid &&
                el.Line_Id === data.Line_Id && el.Line_Type === data.Line_Type && el.Uph === data.Uph && el.Station === data.Station && el.Sequence_No !== 0);
            for (let SplitRecord of SplitRecords) {
                if (SplitRecord.Status === 'Approved' || SplitRecord.Status === 'Rejected') {
                    let split_old_record = Nonrfid_data(SplitRecord);
                    let Splitdata = fill_data_bydb('', SplitRecord);
                    Splitdata.Reviewed_By = "";
                    Splitdata.Reviewed_By_Name = "";
                    Splitdata.Reviewed_By_mail = "";
                    Splitdata.modifiedAt = new Date().toISOString();
                    Splitdata.modifiedBy = request.user.id;
                    Splitdata.modifiedBy_Name = request.req.params.user_name;
                    Splitdata.modifiedBy_mail = request.req.params.user_mail;
                    Splitdata.Status = 'Pending';
                    changelog_data.changelog_nonrfid_u.old_records.push(split_old_record);
                    delete Splitdata.Error;
                    delete Splitdata.Table_Mapped_Aqid;
                    insert_data.Nonrfid_Insert.push(Splitdata);
                    let split_new_record = Nonrfid_data(Splitdata);
                    changelog_data.changelog_nonrfid_u.new_records.push(split_new_record);
                    del_filter.del_filter_u.push(Splitdata.ID);
                    if (SplitRecord.Status === 'Approved') {
                        let outcome = sub_from_output(DB_data.Output, SplitRecord, insert_data.Output_Insert, changelog_data.changelog_output_u, del_filter.del_filter_o, request);
                        insert_data.Output_Insert = outcome.Output_Insert;
                        changelog_data.changelog_output_u = outcome.changelog_data;
                        del_filter.del_filter_o = outcome.del_filter_a;
                    }
                }
            }
        }
        return { del_filter, changelog_data, insert_data };
    }

    function check_sync_status(data, Sync_Status) {
        let inProgress = Sync_Status.find(el => el.STATUS === 'In Progress' && el.GH_SITE === data.GH_Site && el.PROGRAM === data.Program);
        if (inProgress) {
            data.Error = data.Error ? `${data.Error} and Sync is in Progress for this GH Site and Program` : `Sync is in Progress for this GH Site and Program`;
        }
        return data.Error;
    }

    srv.on("PUT", Upload_Nonrfid, async (request) => {
        request.req.params.LOG.info(`COA - In On Event of Upload_Nonrfid`);
        await waitFor(() => completed === true).then(() => {
            request.req.params.LOG.info(`COA - The wait is over!`);
            if (!somethingToInsert) {
                request.req.params.LOG.info(`COA  - Nothing to Update`);
            } else {
                request.req.params.LOG.info(`COA  - Records updated successfully`);
            }
        });
    });

    function waitFor(conditionFunction) {
        const poll = (resolve) => {
            if (conditionFunction()) resolve();
            else setTimeout(() => poll(resolve), 400);
        };
        return new Promise(poll);
    }

    srv.before("PUT", Upload_Nonrfid, async (request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let uuid;
        if (typeof (request.req.params.uuid) === "undefined") {
            uuid = getuuid(request);
        } else {
            uuid = request.req.params.uuid;
        }

        const LOG = cds.log(uuid, { label: 'Upload' });
        request.req.params = { "LOG": LOG, "user": request.user.id, "user_name": `${jwtdetails.given_name} ${jwtdetails.family_name}`, "user_mail": jwtdetails.email, "uuid": uuid };

        let allowedAttributes = getAllowedAttributesCommon(jwtdetails, request, LOG);
        LOG.info(`COA Carryover Nonrfid - In Before event of UPLOAD Carryover Nonrfid action`);
        const tx = hdb.tx();
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`nonRFIDTTModify`];
        completed = false;
        LOG.info(`COA Carryover Nonrfid  - Starting of Upload action `);
        let Nonrfid_update = [];
        let qty_exceed_a = [];
        let Result = {};
        Result.GH_Site = [];
        Result.Program = [];
        Result.Temp = [];
        Result.Nonrfid = [];
        Result.From_GHSite = [];
        Result.From_Program = [];
        Result.Aqid = [];
        let DB_data = {};
        DB_data.GH_Site = [];
        DB_data.Sync_Status = [];
        DB_data.Program = [];
        DB_data.Nonrfid = [];
        DB_data.Output = [];
        DB_data.Nonrfid_Split = [];
        DB_data.Nonrfid_map = {};
        DB_data.Output_map = {};
        DB_data.BohQty = [];
        DB_data.NonrfidBoh = [];
        DB_data.Projection = [];
        let Err_records = [];
        let readable;
        let Split_Override_Record = [];
        const {
            Readable
        } = require("stream");
        if (process.env.NODE_ENV !== 'test') {
            readable = Readable.from(request.data.csv);
        } else {
            let filename = "/home/user/projects/220914-coa-platform-api/coa-nonrfid-tt/tests/Nonrfid.csv";
            readable = fs.createReadStream(filename);
        }
        readable
            .pipe(csv())
            .on("data", async function (csvrow) {
                Result = collect_Nonrfid(csvrow, Result, request, LOG);
            })
            .on("finish", async function () {
                try {
                    let flag = checkiflimitexceeds(Result, request, LOG);
                    if (flag) {
                        somethingToInsert = true;
                        DB_data = await get_fu_dbdata(tx, Result, DB_data, request, 'X');
                        await Promise.all(Result.Nonrfid.map(async (record) => {
                            let Override_Qty_Update;

                            const index_QTY = qty_exceed_a.findIndex(el => el.GH_Site === record.GH_Site && el.Program === record.Program && el.Aqid === record.Aqid &&
                                el.Line_Id === record.Line_Id && el.Line_Type === record.Line_Type && el.Uph === record.Uph && el.Station === record.Station && el.Scope === record.Scope &&
                                el.Group_Priority === record.Group_Priority);

                            if (index_QTY >= 0 && qty_exceed_a[index_QTY].Error !== 'Skip Validation') {
                                record.Error = qty_exceed_a[index_QTY].Error;
                                let outcome4 = Push_ErrRecs(record, Err_records, Override_Qty_Update, Split_Override_Record);
                                Err_records = outcome4.Err_records;
                                Split_Override_Record = outcome4.Split_Override_Record;

                            } else {
                                record.Error = validate_projection_boh_qty(record, Result.Nonrfid, DB_data, LOG);
                                let leftOverQty = calculate_balance_qty(record, Result.Nonrfid, DB_data);
                                let outcome1 = fill_file_upload_dbdata(record, DB_data, request, Result, leftOverQty, Override_Qty_Update, LOG);
                                record = outcome1.record;
                                Override_Qty_Update = outcome1.Override_Qty_Update;
                                record.Error = check_mand_fields(record);
                                record = validate_data(record, DB_data);
                                record = updateError(record);
                                record.Error = AuthorizationCheck(record, allowed_cmsite);
                                record.Error = check_qty_exceed(qty_exceed_a, record);
                                let param = data_validation(record, Result.Nonrfid, DB_data.Nonrfid, '');
                                record.Error = param.error;
                                qty_exceed_a = fill_error(param, qty_exceed_a, record);
                                Nonrfid_update = get_update_recs(record, Nonrfid_update, request);
                                let outcome5 = Push_ErrRecs(record, Err_records, Override_Qty_Update, Split_Override_Record);
                                Err_records = outcome5.Err_records;
                                Split_Override_Record = outcome5.Split_Override_Record;
                            }
                        }));
                        LOG.info('verified')
                        Nonrfid_update = update_split_override_qty(DB_data, Split_Override_Record, Result, request, Nonrfid_update)
                        await update_data_into_db(Nonrfid_update, tx, request, DB_data, LOG);
                        completed = true;
                        let message = get_msg(Err_records, "Records Uploaded Successfully");
                        request._.res.send({ msg: message });
                    }
                }
                catch (error) {
                    await tx.rollback(error);
                    LOG.info(`COA Carryover Nonrfid - Error: ${JSON.stringify(error)}`);
                    return `Error: ${JSON.stringify(error)} `;
                }
            }
            );
    });
    function updateError(record) {
        if (record.Error === 'OQPass') {
            record.Error = ``;
        }
        return record;
    }
    function collect_Nonrfid(csvrow, Result, request, LOG) {
        try {
            let Nonrfid =
            {
                GH_Site: csvrow["GH Site"],
                Program: csvrow["CM Program"],
                Uph: Number(csvrow["UPH"]),
                Line_Type: csvrow["Line Type"],
                Line_Id: csvrow["Line ID"],
                Aqid: csvrow["AQID (non-RFID)"],
                Parent_Item: csvrow["Parent Item"],
                Station: csvrow["Projected Station (non-RFID)"],
                Alt_Station: Number(csvrow["Alternate Station"]),
                Scope: csvrow["Scope"],
                RFID_Scope: csvrow["RFID Scope"],
                Group_Priority: csvrow["Group Priority (non-RFID)"],
                confLevel: Number(csvrow["Projection (Confidence Level)"]),
                Projected_Qty: Number(csvrow["Projected Qty"]),
                Override_Qty: Number(csvrow["Override Quantity"]),
                To_GHSite: csvrow["To GH Site"],
                To_Program: csvrow["To Program"],
                To_Business_Grp: csvrow["To Business Group"],
                Transfer_Qty: Number(csvrow["Transfer Quantity"]),
                Transfer_Flag: csvrow["Transfer Flag"].trim(),
                Comments: csvrow["Comments"],
                Split: csvrow["Split"],
                Status: (csvrow["To GH Site"] !== '' && csvrow["To Program"] !== '' && csvrow["To Business Group"] !== '') ? 'Pending' : '',
                BusinessGrp: csvrow["Business Group"],
                Group_ID: Number(csvrow["Group ID"]),
                Mapped_Aqid: csvrow["Mapped AQID"],
                Line_Priority: csvrow["Line Priority"],
                Dept: csvrow["Department"],
                Equipment_Type: csvrow["Equipment Type"],
                Mfr: csvrow["MFR"],
                Submit_By_Name: "",
                Submit_Date: null,
                modifiedBy_Name: "",
                modifiedAt: null,
                Reviewed_By_Name: "",
                Review_Date: null,
                Sequence_No: (csvrow["Sequence_No"] == '') ? '' : Number(csvrow["Sequence_No"]),
                SAP_CM_Site: "",
                SAP_To_CM_Site: "",
                Error: ""
            };

            let uniquekey;
            if (Result.Nonrfid.length > 0) {
                uniquekey = Result.Nonrfid.find(data => data.CM === Nonrfid.CM && data.Site === Nonrfid.Site && data.Program === Nonrfid.Program && data.Aqid === Nonrfid.Aqid &&
                    data.Line_Id === Nonrfid.Line_Id && data.Line_Type === Nonrfid.Line_Type && data.Uph === Nonrfid.Uph && data.Station === Nonrfid.Station
                    && data.Sequence_No === Nonrfid.Sequence_No
                );
            }
            if (typeof uniquekey !== "undefined") {
                Nonrfid.Sequence_No = '';
            }

            if (!csvrow["GH Site"] || !csvrow["CM Program"] || !csvrow["AQID (non-RFID)"] || !csvrow["Line Type"] || !csvrow["UPH"] || !csvrow["Projected Station (non-RFID)"] || !csvrow["Scope"] || (!containsOnlyNumbers(Nonrfid.Sequence_No) && Nonrfid.Sequence_No != '')) {
                Nonrfid.Error = Nonrfid.Error ? `${Nonrfid.Error} and Key fields are mandatory` : `Key fields are mandatory`;
            }
            else {
                Result.GH_Site = Append_IfUnique(Result.GH_Site, Nonrfid.To_GHSite);
                Result.Program = Append_IfUnique(Result.Program, Nonrfid.To_Program);
                Result.From_GHSite = Append_IfUnique(Result.From_GHSite, Nonrfid.GH_Site);
                Result.From_Program = Append_IfUnique(Result.From_Program, Nonrfid.Program);
                let temp = {};
                temp.ID = getuuid();
                temp.GUID = request.req.params.uuid;
                temp.GH_Site = Nonrfid.GH_Site;
                temp.To_GHSite = Nonrfid.To_GHSite;
                temp.To_Program = Nonrfid.To_Program;
                temp.Program = Nonrfid.Program;
                temp.Aqid = Nonrfid.Aqid;
                temp.Mapped_Aqid = Nonrfid.Mapped_Aqid;
                temp.Line_Id = Nonrfid.Line_Id;
                temp.Line_Type = Nonrfid.Line_Type;
                temp.Uph = Nonrfid.Uph
                temp.Grp = Nonrfid.Group_Priority.substring(0, Nonrfid.Group_Priority.indexOf('-'));
                temp.Station = Nonrfid.Station;
                temp.Group_Priority = Nonrfid.Group_Priority;
                temp.Scope = Nonrfid.Scope;
                temp.Mfr = Nonrfid.Mfr;
                Result.Aqid = Append_IfUnique(Result.Aqid, Nonrfid.Aqid);
                temp.Sequence_No = (Nonrfid.Sequence_No == '') ? 0 : Number(Nonrfid.Sequence_No);
                Result.Temp.push(temp);
            }
            Result.Nonrfid.push(Nonrfid);
            return Result;
        }
        catch (err) {
            LOG.info(`COA Carryover Nonrfid  - Error: ${JSON.stringify(err)}`);
            return Result;
        }
    }

    function checkiflimitexceeds(Result, request, LOG) {
        if (Result.Nonrfid.length > 10000) {
            request._.res.send({ msg: `File upload is allowed only for 10k records` });
            return false;
        } else {
            if (Result.Nonrfid.length < 1) {
                LOG.info(`COA Carryover Nonrfid - Nothing to Update`);
                somethingToInsert = false;
                completed = true;
                request._.res.send({ msg: "Nothing to Update" });
                return false;
            }
        }
        return true;
    }

    function Push_ErrRecs(record, Err_records, Override_Qty_Update, Split_Override_Record) {
        if (record.Error) {
            Err_records.push(record);
        }
        else if (Override_Qty_Update) {
            //update override qty
            Split_Override_Record.push(record);
        }
        return { Err_records, Split_Override_Record };
    }

    function get_update_recs(record, Nonrfid_update, request) {
        if (record.Error === "" || record.Error === undefined) {
            record.Error = "";
            record.modifiedAt = new Date().toISOString();
            record.modifiedBy = request.user.id;
            record.modifiedBy_Name = request.req.params.user_name;
            record.modifiedBy_mail = request.req.params.user_mail;
            record.Reviewed_By = "";
            record.Review_Date = null;
            record.Reviewed_By_Name = "";
            record.Reviewed_By_mail = "";
            Nonrfid_update.push(record);
        }
        return Nonrfid_update;
    }

    async function update_data_into_db(update_data, tx, request, DB_data, LOG) {
        let changelog_data_a = [];
        let changelog_nonrfid = {};
        let changelog_output = {};
        let del_filter_a = [];
        let del_filter_o = [];
        let Output_Insert = [];
        if (update_data.length > 0) {
            changelog_nonrfid.new_records = [];
            changelog_nonrfid.old_records = [];
            changelog_output.new_records = [];
            changelog_output.old_records = [];
            let queries = [];
            update_data.forEach(element1 => {

                const index = before_data.findIndex(e1 => e1.CM === element1.CM && e1.Site === element1.Site && e1.Program === element1.Program && e1.Aqid === element1.Aqid &&
                    e1.Line_Id === element1.Line_Id && e1.Line_Type === element1.Line_Type && e1.Uph === element1.Uph && e1.Station === element1.Station && e1.Sequence_No === element1.Sequence_No && e1.uuid === request.req.params.uuid);
                if (index >= 0) {
                    let outcome = get_output_array(DB_data, before_data[index], changelog_output, del_filter_o, Output_Insert, before_data[index].Status, request);
                    del_filter_o = outcome.del_filter_o;
                    changelog_output = outcome.changelog_output;
                    Output_Insert = outcome.Output_Insert;
                    let old_record = [];
                    let new_record = [];
                    old_record = Nonrfid_data(before_data[index]);
                    changelog_nonrfid.old_records.push(old_record);
                    before_data.splice(index, 1);
                    new_record = Nonrfid_data(element1);
                    changelog_nonrfid.new_records.push(new_record);
                    del_filter_a.push(element1.ID);
                }
                element1 = delete_unwanted_fields(element1);
            }
            );
            queries = delete_via_id(del_filter_a, queries);
            queries = deleteInChunk(del_filter_o, queries, "COM_APPLE_COA_T_COA_OUTPUT");
            queries = delete_via_id(projection.projection_delete, queries, "COM_APPLE_COA_T_COA_NONRFID_PROJECTION");
            LOG.info('projection delete data', projection.projection_delete);
            LOG.info('projection insert data', projection.projection_insert);
            LOG.info('file upload db queries', queries);
            if (queries.length > 0) {
                await tx.run(queries);
            }
            await insert_into_db(update_data, "COM_APPLE_COA_T_COA_NONRFID_TT", tx);
            await insert_into_db(Output_Insert, "COM_APPLE_COA_T_COA_OUTPUT", tx);
            await insert_into_db(projection.projection_insert, "COM_APPLE_COA_T_COA_NONRFID_PROJECTION", tx);
            changelog_data_a = push_changelog(changelog_output, changelog_data_a, "UPDATE", "T_COA_OUTPUT");
            changelog_data_a = push_changelog(changelog_nonrfid, changelog_data_a, "UPDATE", "T_COA_NONRFID_TT");
        }
        await tx.commit();
        //empty the array.
        projection.projection_insert = [];
        projection.projection_delete = [];
        if (changelog_data_a.length > 0) {
            update_changelog(changelog_data_a, request, LOG);
        }
    }

    async function insert_into_db(insert_data, db, tx) {
        if (insert_data.length > 0) {
            await tx.run(INSERT.into(db).entries(insert_data));
        }
    }

    function get_output_array(DB_data, record, changelog_output, del_filter_o, Output_Insert, STATUS, request) {
        if (STATUS === "Approved") {
            record.CO_Type = 'Non RFID';
            let key_array = ["CM", "Site", "Program", "Mapped_Aqid", "To_CM", "To_Site", "To_Program", "CO_Type"];
            let tempGetKeyArray = getTempKeys(record, key_array);
            let map_found = getMultiLevelValue(DB_data.Output_map, tempGetKeyArray);
            if (map_found !== undefined) {
                let outcome = sub_from_output(DB_data.Output, record, Output_Insert, changelog_output, del_filter_o, request);
                changelog_output = outcome.changelog_data;
                Output_Insert = outcome.Output_Insert;
                del_filter_o = outcome.del_filter_a;
            }
            delete record.CO_Type;
        }
        return { changelog_output, Output_Insert, del_filter_o };
    }

    function delete_unwanted_fields(data) {
        delete data.Error;
        delete data.Edit;
        return data;
    }

    function getTempKeys(currRequest, keyArray) {
        let retArr = [];
        let i = 0;
        for (; i < keyArray.length; i++) {
            retArr.push(currRequest[keyArray[i]])
        }
        return retArr;
    }

    function convert_split_to_camel(Nonrfid) {
        let UpdateObj = Nonrfid.map(
            obj => {
                return {
                    "CM": obj.CM,
                    "Site": obj.SITE,
                    "GH_Site": obj.GH_SITE,
                    "Program": obj.PROGRAM,
                    "Aqid": obj.AQID,
                    "Line_Type": obj.LINE_TYPE,
                    "Line_Id": obj.LINE_ID,
                    "Uph": obj.UPH,
                    "Station": obj.STATION,
                    "Group_Priority": obj.GROUP_PRIORITY,
                    "Mfr": obj.MFR,
                    "Scope": obj.SCOPE,
                    "Sequence_No": obj.SEQUENCE_NO,
                    "Sequence_Cnt": obj.SEQUENCE_CNT
                }
            }
        );
        return UpdateObj;
    }

    function fill_file_upload_dbdata(record, DB_data, request, Result, leftOverQty, Override_Qty_Update, LOG) {
        try {
            if (record.Error === "" || typeof record.Error === "undefined") {

                let key_array = ["GH_Site", "Aqid", "Program", "Line_Id", "Line_Type", "Uph", "Station", "Group_Priority", "Scope", "Sequence_No"];
                let tempGetKeyArray = getTempKeys(record, key_array);
                let map_found = getMultiLevelValue(DB_data.Nonrfid_map, tempGetKeyArray);
                record.Override_Qty = getParentOverrideQty(DB_data, Result.Nonrfid, record);
                if (map_found === undefined) {
                    let index = get_split_index(DB_data.Nonrfid_Split, record);
                    record.Sequence_No = 0;
                    key_array = ["GH_Site", "Aqid", "Program", "Line_Id", "Line_Type", "Uph", "Station", "Group_Priority", "Scope", "Sequence_No"];
                    tempGetKeyArray = getTempKeys(record, key_array);
                    map_found = getMultiLevelValue(DB_data.Nonrfid_map, tempGetKeyArray);
                    if (map_found === undefined || index < 0) {
                        record.Error = `Entry doesn't exist`;
                    } else if ((DB_data.Nonrfid_Split[index].Sequence_Cnt + 1) <= record.Override_Qty) {
                        record.ID = getuuid();
                        record.GH_Site = map_found.GH_Site;
                        record.CM = map_found.CM;
                        record.Site = map_found.Site;
                        record.Program = map_found.Program;
                        record.Uph = map_found.Uph;
                        record.Line_Id = map_found.Line_Id;
                        record.Line_Type = map_found.Line_Type;
                        record.Line_Priority = map_found.Line_Priority;
                        record.Scope = map_found.Scope;
                        record.Equipment_Name = map_found.Equipment_Name;
                        record.Equipment_Type = map_found.Equipment_Type;
                        record.Dept = map_found.Dept;
                        record.confLevel = map_found.confLevel;
                        record.Station = map_found.Station;
                        record.Alt_Station = map_found.Alt_Station;
                        record.Group_Priority = map_found.Group_Priority;
                        record.Group_ID = map_found.Group_ID;
                        record.RFID_Scope = map_found.RFID_Scope;
                        record.Mfr = map_found.Mfr;
                        record.Parent_Item = map_found.Parent_Item;
                        record.BusinessGrp = map_found.BusinessGrp;
                        record.Aqid = map_found.Aqid;
                        record.Sequence_No = DB_data.Nonrfid_Split[index].Sequence_No + 1;
                        record.Projected_Qty = map_found.Projected_Qty;
                        record.modifiedBy_Name = request.req.params.user_name;
                        record.modifiedBy_mail = request.req.params.user_mail;
                        record.modifiedBy = request.user.id;
                        record.modifiedAt = new Date().toISOString();
                        record.createdBy_Name = request.req.params.user_name;
                        record.createdBy_mail = request.req.params.user_mail;
                        record.createdBy = request.user.id;
                        record.createdAt = new Date().toISOString();
                        record.Mapped_Aqid = map_found.Mapped_Aqid;
                        record.SAP_CM_Site = `${map_found.CM}-${map_found.Site}`;
                        record.SAP_To_CM_Site = "";
                        record.Reviewed_By = "";
                        record.Review_Date = null;
                        record.Reviewed_By_Name = "";
                        record.Reviewed_By_mail = "";
                        DB_data.Nonrfid_Split[index].Sequence_No = DB_data.Nonrfid_Split[index].Sequence_No + 1;
                        DB_data.Nonrfid_Split[index].Sequence_Cnt = DB_data.Nonrfid_Split[index].Sequence_Cnt + 1;
                    } else {
                        record.Error = 'Split Item Count is exeeding the limit of Override Qty';
                    }
                } else {
                    record.Error = check_sync_status(record, DB_data.Sync_Status);
                    record = fill_data_bydb(record, map_found);
                    record.Status = set_transfer_status(record, map_found);
                    record.Mapped_Aqid = map_found.Mapped_Aqid;
                    map_found.uuid = request.req.params.uuid;
                    before_data.push(map_found);
                    Override_Qty_Update = getOverrideQtyUUpdate(record, map_found, Override_Qty_Update);

                    //update projection
                    update_projection_balance_qty(DB_data, record, projection.projection_insert, projection.projection_delete, leftOverQty, LOG);
                }
            }
        }
        catch (error) {
            LOG.info(`COA Carryover fill_file_upload_dbdata - Error: ${JSON.stringify(error)}`);
        }
        return { record, Override_Qty_Update };
    }

    function getOverrideQtyUUpdate(record, map_found, Override_Qty_Update) {
        if (record.Sequence_No === 0 && record.Override_Qty !== map_found.Override_Qty && Override_Qty_Update !== 'X') {
            Override_Qty_Update = 'X';
        }
        return Override_Qty_Update;
    }

    function update_split_override_qty(DB_data, parent_records, results, request, Nonrfid_update) {
        for (let record of parent_records) {
            let SplitRecords = DB_data.Nonrfid.filter(e => e.GH_Site === record.GH_Site && e.Program === record.Program &&
                e.Aqid === record.Aqid && e.Line_Id === record.Line_Id && e.Line_Type === record.Line_Type && e.Uph === record.Uph &&
                e.Group_Priority === record.Group_Priority && e.Scope === record.Scope && e.Station === record.Station && e.Sequence_No !== 0
            );

            for (let SplitRecord of SplitRecords) {
                let index = results.Nonrfid.findIndex(e => e.GH_Site === SplitRecord.GH_Site && e.Program === SplitRecord.Program &&
                    e.Aqid === SplitRecord.Aqid && e.Line_Id === SplitRecord.Line_Id && e.Line_Type === SplitRecord.Line_Type && e.Uph === SplitRecord.Uph &&
                    e.Group_Priority === SplitRecord.Group_Priority && e.Scope === SplitRecord.Scope && e.Station === SplitRecord.Station && e.Sequence_No === SplitRecord.Sequence_No
                );

                if (index < 0 || results.Nonrfid[index].Error) {
                    // Update Override Qty
                    let temp_data = { ...SplitRecord };
                    temp_data.uuid = request.req.params.uuid;
                    before_data.push(temp_data);
                    SplitRecord.Override_Qty = record.Override_Qty;
                    if (SplitRecord.Status === 'Approved' || SplitRecord.Status === 'Rejected') {
                        SplitRecord.Reviewed_By = "";
                        SplitRecord.Reviewed_By_Name = "";
                        SplitRecord.Reviewed_By_mail = "";
                        SplitRecord.modifiedAt = new Date().toISOString();
                        SplitRecord.modifiedBy = request.user.id;
                        SplitRecord.modifiedBy_Name = request.req.params.user_name;
                        SplitRecord.modifiedBy_mail = request.req.params.user_mail;
                        SplitRecord.Status = 'Pending';
                    }
                    delete SplitRecord.Error;
                    delete SplitRecord.Table_Mapped_Aqid;
                    Nonrfid_update.push(SplitRecord);
                }
            }
        }
        return Nonrfid_update;
    }


    function get_split_index(Nonrfid_Split_a, record) {
        return Nonrfid_Split_a.findIndex(e => e.GH_Site === record.GH_Site && e.Program === record.Program &&
            e.Aqid === record.Aqid && e.Line_Id === record.Line_Id && e.Line_Type === record.Line_Type && e.Uph === record.Uph &&
            e.Group_Priority === record.Group_Priority && e.Scope === record.Scope && e.Station === record.Station
        );
    }

    async function get_fu_dbdata(tx, Result, DB_data, request, FU) {
        let keyArray;
        DB_data = await get_GHSite_data(Result, DB_data, tx);
        DB_data = await validate_SyncStatus(Result, DB_data, tx);
        DB_data = await get_Projection_BohQty(Result, DB_data, tx);
        DB_data = await get_Projection_Data(Result, DB_data, tx);


        if (Result.Program.length > 0) {
            DB_data.Program = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('PROGRAM as Program').where({
                Program: { in: Result.Program }
            }));
        }
        await push_temp_data(Result.Temp);
        DB_data.Nonrfid = await tx.run(`SELECT distinct V_COA_NONRFID_TT.*
                                        FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                        INNER JOIN V_NONRFID_TT AS V_COA_NONRFID_TT
                                        ON T_COA_TEMP.GH_Site = V_COA_NONRFID_TT.GH_Site
                                        AND ( ( T_COA_TEMP.Aqid = V_COA_NONRFID_TT.Aqid  AND T_COA_TEMP.Grp = V_COA_NONRFID_TT.Grp ) OR 
                                            (T_COA_TEMP.Grp = V_COA_NONRFID_TT.Grp AND T_COA_TEMP.Grp != '') )
                                        AND T_COA_TEMP.Program = V_COA_NONRFID_TT.Program
                                        AND T_COA_TEMP.Line_Id = V_COA_NONRFID_TT.Line_Id
                                        AND T_COA_TEMP.Line_Type = V_COA_NONRFID_TT.Line_Type
                                        AND T_COA_TEMP.Uph = V_COA_NONRFID_TT.Uph
                                        AND T_COA_TEMP.Station = V_COA_NONRFID_TT.Station
                                        AND T_COA_TEMP.Group_Priority = V_COA_NONRFID_TT.Group_Priority
                                        AND T_COA_TEMP.Scope = V_COA_NONRFID_TT.Scope
                                        WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);
        DB_data.Nonrfid = convert_nonrfid_to_camel(DB_data.Nonrfid);
        DB_data = await get_NonRFID_BOHData(tx, request, DB_data);
        if (DB_data.Nonrfid.length > 0) {
            keyArray = ["GH_Site", "Aqid", "Program", "Line_Id", "Line_Type", "Uph", "Station", "Group_Priority", "Scope", "Sequence_No"];
            fillMultimap(DB_data.Nonrfid_map, DB_data.Nonrfid, keyArray);
        }
        if (FU === 'X') {
            DB_data.Nonrfid_Split = await cds.run(`SELECT distinct V_COA_NONRFID_TT.CM, V_COA_NONRFID_TT.Site,V_COA_NONRFID_TT.GH_Site,
                                    V_COA_NONRFID_TT.Aqid,V_COA_NONRFID_TT.Program,
                                    V_COA_NONRFID_TT.Line_Id,V_COA_NONRFID_TT.Line_Type,
                                    V_COA_NONRFID_TT.Uph,V_COA_NONRFID_TT.Station,
                                    V_COA_NONRFID_TT.Group_Priority, V_COA_NONRFID_TT.Scope,
                                    count(distinct V_COA_NONRFID_TT.ID) as Sequence_Cnt,
                                    max(V_COA_NONRFID_TT.Sequence_No) as Sequence_No
                                    FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                    INNER JOIN V_NONRFID_TT AS V_COA_NONRFID_TT
                                    ON T_COA_TEMP.GH_Site = V_COA_NONRFID_TT.GH_Site
                                    AND ( ( T_COA_TEMP.Aqid = V_COA_NONRFID_TT.Aqid  AND T_COA_TEMP.Grp = V_COA_NONRFID_TT.Grp ) OR 
                                        (T_COA_TEMP.Grp = V_COA_NONRFID_TT.Grp AND T_COA_TEMP.Grp != '') )
                                    AND T_COA_TEMP.Program = V_COA_NONRFID_TT.Program
                                    AND T_COA_TEMP.Line_Id = V_COA_NONRFID_TT.Line_Id
                                    AND T_COA_TEMP.Line_Type = V_COA_NONRFID_TT.Line_Type
                                    AND T_COA_TEMP.Uph = V_COA_NONRFID_TT.Uph
                                    AND T_COA_TEMP.Station = V_COA_NONRFID_TT.Station
                                    AND T_COA_TEMP.Group_Priority = V_COA_NONRFID_TT.Group_Priority
                                    AND T_COA_TEMP.Scope = V_COA_NONRFID_TT.Scope
                                    WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'
                                    GROUP BY V_COA_NONRFID_TT.CM, V_COA_NONRFID_TT.Site,V_COA_NONRFID_TT.GH_Site,
                                    V_COA_NONRFID_TT.Aqid,V_COA_NONRFID_TT.Program,V_COA_NONRFID_TT.Line_Id,
                                    V_COA_NONRFID_TT.Line_Type,V_COA_NONRFID_TT.Uph,V_COA_NONRFID_TT.Station,
                                    V_COA_NONRFID_TT.Group_Priority,V_COA_NONRFID_TT.Scope`);
            DB_data.Nonrfid_Split = convert_split_to_camel(DB_data.Nonrfid_Split);
        }

        DB_data.Output = await cds.run(`SELECT distinct T_COA_OUTPUT.*
                                        FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                        INNER JOIN COM_APPLE_COA_T_COA_OUTPUT AS T_COA_OUTPUT
                                        ON T_COA_TEMP.GH_SITE = T_COA_OUTPUT.FROM_GHSITE
                                        AND T_COA_TEMP.PROGRAM = T_COA_OUTPUT.FROM_PRODUCT
                                        AND T_COA_TEMP.MAPPED_AQID = T_COA_OUTPUT.AQID
                                        AND T_COA_TEMP.TO_GHSITE = T_COA_OUTPUT.TO_GHSITE
                                        AND T_COA_TEMP.TO_PROGRAM = T_COA_OUTPUT.TO_PRODUCT
                                        AND T_COA_OUTPUT.CO_TYPE = 'Non RFID'
                                        WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);
        DB_data.Output = convert_output_to_camel(DB_data.Output);

        if (DB_data.Output.length > 0) {
            keyArray = ["From_CM", "From_Site", "From_Product", "AQID", "To_CM", "To_Site", "To_Product", "CO_Type"];
            fillMultimap(DB_data.Output_map, DB_data.Output, keyArray);
        }

        await delete_temp_data(request.req.params.uuid);
        return DB_data;
    }



    srv.before("resync_nonrfid_tt", async (request) => {
        const LOG = cds.log(getuuid(request), { label: 'BeforeEvent' });
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                const uuid = getuuid(request);
                request.req.params = { "uuid": uuid, "user": request.user.id };
            }
        } catch (error) {
            LOG.info(`COA Carryover NonRFID-tt - Action : resync_nonrfid_tt - Error: ${JSON.stringify(error)}`);
        }
    });


    srv.on("resync_nonrfid_tt", async (request) => {
        const LOG = cds.log(getuuid(request), { label: 'AfterEvent' });
        LOG.info(`COA Carryover NonRFID-tt - Inside resync_nonrfid_tt`);
        try {
            let selectedRecordsToMassUpdate = await cds.run(SELECT.from("V_NONRFID_TT").where(cds.parse.expr(`((Mapped_Aqid is null and Table_Mapped_Aqid is not null)
                       or (Mapped_Aqid is not null and Table_Mapped_Aqid is null)
                       or (Mapped_Aqid!=Table_Mapped_Aqid))
                       and Status = 'Approved'`)));
            LOG.info(`Was able to select ${selectedRecordsToMassUpdate.length} records`);
            if (selectedRecordsToMassUpdate.length > 0) {
                let chunkSize = 5000;
                for (let k = 0; k < selectedRecordsToMassUpdate.length; k += chunkSize) {
                    let updChunk = selectedRecordsToMassUpdate.slice(k, k + chunkSize);
                    await srv.post(nonrfid_tt_action, { NonRfidData: updChunk, Action: "reset", auth: request.headers.authorization, "Reset_Flag": 'Rst-MapAqid' })
                }
            }
        } catch (err) {
            LOG.info(`COA Carryover NonRFID-tt - Action : resync_nonrfid_tt - There was some error thrown while resyncing mapped-aqid: `, err.response?.data || err.response || err.data || err);
        }
    });

    async function get_Projection_BohQty(Result, DB_data, tx) {
        if (Result.From_GHSite.length > 0 && Result.Aqid.length > 0 && Result.From_Program.length > 0) {
            DB_data.BohQty = await cds.run(SELECT.distinct.columns(
                "GH_Site", "Program", "Aqid", "MIN(BOH) as BOH"
            ).from("V_NONRFID_PROJECTION").where({
                GH_Site: { in: Result.From_GHSite },
                Aqid: { in: Result.Aqid },
                Program: { in: Result.From_Program },
                RFID_Scope: 'N',
                BOH: { '>': 0 }
            }).groupBy("GH_Site", "Program", "Aqid"));
        }
        return DB_data;
    }

    async function get_Projection_Data(Result, DB_data, tx) {
        if (Result.From_GHSite.length > 0 && Result.Aqid.length > 0 && Result.From_Program.length > 0) {
            DB_data.Projection = await cds.run(SELECT.distinct.columns(
                "ID", "CM", "Site", "Program", "GH_Site", "Station", "Aqid", "Scope", "UPH", "Line",
                "Level", "Group_Priority", "Mfr", "Balance_Qty", "QPL_User", "Carry_Over", "RFID_Scope",
                "modifiedBy_Name", "modifiedBy_mail", "createdBy_Name", "createdBy_mail"
            ).from("V_NONRFID_PROJECTION").where({
                GH_Site: { in: Result.From_GHSite },
                Aqid: { in: Result.Aqid },
                Program: { in: Result.From_Program },
                RFID_Scope: 'N'
            }));
        }
        return DB_data;
    }



    async function get_NonRFID_BOHData(tx, request, DB_data) {
        DB_data.NonrfidBoh = await cds.run(`SELECT distinct V_COA_NONRFID_TT.*
                                FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                                INNER JOIN V_NONRFID_TT AS V_COA_NONRFID_TT
                                ON T_COA_TEMP.GH_Site = V_COA_NONRFID_TT.GH_Site
                                AND T_COA_TEMP.Program = V_COA_NONRFID_TT.Program
                                AND T_COA_TEMP.Aqid = V_COA_NONRFID_TT.Aqid
                                WHERE T_COA_TEMP.GUID = '${request.req.params.uuid}'`);

        DB_data.NonrfidBoh = convert_nonrfid_to_camel(DB_data.NonrfidBoh);
        return DB_data;
    }

    function validate_projection_boh_qty(record, input, DB_data, LOG) {
        if (record.Error === "") {
            let BOHQty = 0, totBalQTY = 0;
            let oldData = DB_data.NonrfidBoh.filter(rec => rec.GH_Site === record.GH_Site && rec.Program === record.Program &&
                rec.Aqid === record.Aqid && rec.Sequence_No === 0);
            let newData = input.filter(inp => inp.Sequence_No === 0);
            let projectionData = DB_data.BohQty.find(el => el.GH_Site === record.GH_Site && el.Program === record.Program && el.Aqid === record.Aqid);

            if (projectionData) {
                BOHQty = projectionData.BOH;
                LOG.info('projection boh qty', BOHQty);
                oldData.map(el => {
                    let new_rec_index = newData.findIndex(rec => rec.GH_Site === el.GH_Site && rec.Program === el.Program &&
                        rec.Aqid === el.Aqid && rec.Line_Type === el.Line_Type && rec.Uph === el.Uph &&
                        rec.Station === el.Station && rec.Line_Id === el.Line_Id && rec.Scope === el.Scope &&
                        rec.Group_Priority === el.Group_Priority)
                    if (new_rec_index >= 0) {
                        totBalQTY = totBalQTY + Number(newData[new_rec_index].Override_Qty);
                        newData.splice(new_rec_index, 1);
                    }
                    else {
                        totBalQTY = totBalQTY + Number(el.Override_Qty);
                    }
                });
                record = compare_BOH_QTY(totBalQTY, BOHQty, newData, record);
            }
        }
        return record.Error;
    }

    function compare_BOH_QTY(totBalQTY, totQTY, newData, data) {
        if (newData.length > 0) {
            newData.forEach(pel => {
                if (pel.GH_Site === data.GH_Site && pel.Program === data.Program &&
                    pel.Line_Type === data.Line_Type && pel.Uph === data.Uph && pel.Station === data.Station &&
                    pel.Line_Id === data.Line_Id && pel.Aqid === data.Aqid && pel.Scope === data.Scope &&
                    pel.Group_Priority === data.Group_Priority) {
                    totBalQTY = totBalQTY + Number(pel.Transfer_Qty);
                }
            })
        }
        if (totQTY < totBalQTY) {
            data.Error = "Sum Override Qty should not exceed BOH qty";
        }
        return data;
    }

    function update_projection_balance_qty(DB_data, data, insert_data, del_filter, leftOverQty, LOG) {
        if (typeof leftOverQty !== "undefined" && data.Sequence_No === 0) {
            let matchingRecords = DB_data.Projection.filter(el => el.GH_Site === data.GH_Site && el.Program === data.Program && el.Aqid === data.Aqid);
            LOG.info('boh leftover qty', leftOverQty);
            matchingRecords.forEach(e => {
                if (del_filter.indexOf(e.ID) === -1) {
                    e.Balance_Qty = leftOverQty;
                    delete e.GH_Site;
                    insert_data.push(e);
                    del_filter.push(e.ID);
                }
            });
        }
        return { del_filter, insert_data };
    }

    function calculate_balance_qty(record, input, DB_data) {
        let BOHQty = 0;
        if (record.Error === "") {
            let oldData = DB_data.NonrfidBoh.filter(rec => rec.GH_Site === record.GH_Site && rec.Program === record.Program &&
                rec.Aqid === record.Aqid && rec.Sequence_No === 0)
            let newData = input.filter(rec => rec.GH_Site === record.GH_Site && rec.Program === record.Program &&
                rec.Aqid === record.Aqid && rec.Sequence_No === 0)

            let projectionData = DB_data.BohQty.find(el => el.GH_Site === record.GH_Site && el.Program === record.Program && el.Aqid === record.Aqid);
            if (projectionData) {
                BOHQty = projectionData.BOH;
                oldData.map(el => {
                    let new_rec_index = newData.findIndex(ne => ne.GH_Site === el.GH_Site && ne.Program === el.Program &&
                        ne.Aqid === el.Aqid && ne.Line_Type === el.Line_Type && ne.Uph === el.Uph &&
                        ne.Station === el.Station && ne.Line_Id === el.Line_Id && ne.Scope === el.Scope &&
                        ne.Group_Priority === el.Group_Priority && ne.Sequence_No === 0)
                    if (new_rec_index >= 0) {
                        BOHQty = BOHQty - Number(newData[new_rec_index].Override_Qty);
                        newData.splice(new_rec_index, 1);
                    }
                    else {
                        BOHQty = BOHQty - Number(el.Override_Qty);
                    }
                });
            }
        }
        return BOHQty;
    }

    function getParentOverrideQty(DB_data, Result, record) {
        let parent_over_qty;
        let index = Result.findIndex(ne => ne.GH_Site === record.GH_Site && ne.Program === record.Program &&
            ne.Aqid === record.Aqid && ne.Line_Type === record.Line_Type && ne.Uph === record.Uph &&
            ne.Station === record.Station && ne.Line_Id === record.Line_Id && ne.Scope === record.Scope &&
            ne.Group_Priority === record.Group_Priority && ne.Sequence_No === 0)
        if (index >= 0) {
            parent_over_qty = Result[index].Override_Qty;
        }
        else {
            let record1 = { ...record };
            record1.Sequence_No = 0
            let key_array = ["GH_Site", "Aqid", "Program", "Line_Id", "Line_Type", "Uph", "Station", "Group_Priority", "Scope", "Sequence_No"];
            let tempGetKeyArray = getTempKeys(record1, key_array);
            let map_found = getMultiLevelValue(DB_data.Nonrfid_map, tempGetKeyArray);
            if (map_found) {
                parent_over_qty = map_found.Override_Qty
            }
        }
        return parent_over_qty
    }

})