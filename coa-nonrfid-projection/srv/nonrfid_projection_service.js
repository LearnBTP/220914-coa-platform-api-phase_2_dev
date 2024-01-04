const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");
const csv = require("csv-parser");
let fs = require('fs');



module.exports = cds.service.impl(async (srv) => {
    const
        {
            Upload_NonRFID_Projection,
            NonRFID_Projection_Action,
            NonRFIDProjectionDetails,
            ResetQPL,
            Upload_NonRFID_Projection_for_QPL
        } = srv.entities;



    let hdb = await cds.connect.to("db");
    let completed = false;
    let glb_auth;
    let somethingToInsert = false;

    function removeIDFromOrderBy(request)
    {
        if (request.query?.SELECT?.orderBy)
        {
            request.query.SELECT.orderBy = request.query.SELECT.orderBy.filter(el=>(!el.ref.includes(`ID`)))
        }
    }

    srv.before('READ', NonRFIDProjectionDetails, async (request) => {
        removeIDFromOrderBy(request);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributes(jwtdetails, request);
        allowedAttributes['ProjectionTableReadOnly'] = merge(allowedAttributes['ProjectionTableReadOnly'], allowedAttributes['ProjectionTableModify'])
        let filterString = getFilterString(allowedAttributes['ProjectionTableReadOnly'])
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
    })

    srv.after('READ',NonRFIDProjectionDetails, async (data, request) => {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributes(jwtdetails, request);
        let allowed_cmsite = [];
        allowed_cmsite = allowedAttributes[`ProjectionTableModify`]
        request.results.forEach(e => {
            e.Edit = (allowed_cmsite[`${e.CM}-${e.SITE}`] !== undefined ||
                allowed_cmsite[`$unrestricted-${e.SITE}`] !== undefined || 
                allowed_cmsite[`${e.CM}-$unrestricted}`] !== undefined ||  allowed_cmsite['$unrestricted-$unrestricted'] !== undefined) ? 7 : 1;
        });
    });


    function getFilterString(obj) {
        let arr = [];
        if (obj[`$unrestricted-$unrestricted`] !== undefined) return '';
        Object.keys(obj).forEach(key => {
            let tmparr = [];
            if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`CM='${key.slice(0, key.indexOf('-'))}'`);
            if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
            if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
            arr.push(tmparr[0]);
        })
        if (arr.length > 0) {
            let str = `(${arr.join(") or (")})`
            return str;
        }
        else {
            return (`(CM='NULL' and SITE='NULL')`)
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

    function augment(obj, term) {
        if (obj[term] === undefined) obj[term] = term;
    }

    function augmentArray(obj, arr) {
        let i ;
        for ( i = 0; i < arr.length; i++)augment(obj, arr[i]);
    }

    function merge(obj1, obj2) {
        return ({ ...obj1, ...obj2 });
    }

    function convertToArray(obj) {
        return Object.keys(obj);
    }

    function addToAllowedAttributes(ScopesRelevantToThisApp,RoleNames,allowedattributes,srvCred)
    {
        for (let roleName of RoleNames["xs.rolecollections"]) {
        if (srvCred[roleName] !== undefined) {
                ScopesRelevantToThisApp.forEach((scope) => {
                    if (srvCred[roleName][scope] !== undefined) augmentArray(allowedattributes[scope], srvCred[roleName][scope]["CM-Site"])
                });
            }
        }
    }

    function getLogFromRequestIfAvailable(request,label,store=false)
    {
        if (request.req?.params?.LOG!==undefined)return request.req?.params?.LOG;
        let LOG = cds.log(getUuidFromRequest(request), { label: label });
        if (store)
        {
            addReqToRequest(request);
            request.req.params.LOG=LOG;
        }
        return LOG;
    }

    function getAllowedAttributes(jwtdetails, request) {
        let LOG = getLogFromRequestIfAvailable(request,`getAllowedAtrributes`);
        const RoleNames = jwtdetails['xs.system.attributes'];
        let ScopesRelevantToThisApp = [`ProjectionTableModify`, `ProjectionTableReadOnly`]
        let allowedattributes = {};
        ScopesRelevantToThisApp.forEach((scope) => {
            if (allowedattributes[scope] === undefined) allowedattributes[scope] = {}
        })
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

        addToAllowedAttributes(ScopesRelevantToThisApp,RoleNames,allowedattributes,srvCred)

        return allowedattributes;

    }



    async function update_changelog(changes, request) {
        let LOG = getLogFromRequestIfAvailable(request,`update_changelog`);
        LOG.info(`Call Changelog service to update the changes to Changelog table`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let userid = (request.user?.id) ? (request.user?.id) : jwtdetails.email;
        const core = require("@sap-cloud-sdk/core");
        const xsenv = require("@sap/xsenv");
        xsenv.loadEnv();
        const sDestinationName = "COA_APIM_CC";
        let results = [];
        let result = {};
        let nonRfidProjectionupdatesOld = [];
        let nonRfidProjectionupdatesNew = [];
        let nonRfidProjectioninsertsOld = [];
        let nonRfidProjectioninsertsNew = [];
        let i = 0
        for (; i < changes.length; i++) {
            if (changes[i]["table_name"] === "COM_APPLE_COA_T_COA_NONRFID_PROJECTION" && changes[i]["action"] === "INSERT") {
                nonRfidProjectioninsertsOld.push(changes[i]["old"]);
                nonRfidProjectioninsertsNew.push(changes[i]["new"]);
            }
            else if (changes[i]["table_name"] === "COM_APPLE_COA_T_COA_NONRFID_PROJECTION" && changes[i]["action"] === "UPDATE") {
                nonRfidProjectionupdatesOld.push(changes[i]["old"]);
                nonRfidProjectionupdatesNew.push(changes[i]["new"]);
            }
        }
        if (nonRfidProjectioninsertsOld.length > 0) {
            result = {};
            result.TableName = "T_COA_NONRFID_PROJECTION";
            result.old_records = nonRfidProjectioninsertsOld;
            result.new_records = nonRfidProjectioninsertsNew;
            result.actionType = "INSERT";
            result.user_data = {};
            result.user_data.user = userid;
            result.user_data.name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
            result.user_data.email = jwtdetails.email;
            results.push(result);
        }
        if (nonRfidProjectionupdatesOld.length > 0) {
            result = {};
            result.TableName = "T_COA_NONRFID_PROJECTION";
            result.old_records = nonRfidProjectionupdatesOld;
            result.new_records = nonRfidProjectionupdatesNew;
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

    function nonrfid_projection_data(request) {
        let record = [];
        if (request) {
            record.push(0);
            record.push("");
            record.push(0);
            record.push("");
            record.push("");
            record.push(request.CM);
            record.push(request.SITE);
            record.push(request.PROGRAM);
            record.push(request.STATION);
            record.push(request.AQID);
            record.push((request.SCOPE || ""));
            record.push(request.UPH);
            record.push(request.LINE);
            record.push(request.LEVEL);
            record.push(request.GROUP_PRIORITY);
            record.push(request.MFR);
            record.push(0);   //BALANCE_QTY is never changed from this program
            record.push((chooseFirstDefined(request.QPL_USER, request.QPL) === undefined) ? 0 : chooseFirstDefined(request.QPL_USER, request.QPL));
            record.push(request.CARRY_OVER);
            record.push(request.RFID_SCOPE);
            record.push(request.MODIFIEDBY_NAME);
            record.push(request.MODIFIEDBY_MAIL);
            record.push(request.CREATEDBY_NAME);
            record.push(request.CREATEDBY_MAIL);
            record.push(request.DEPT || "");
        }
        else {
            record.push(0, "", 0, "", "", "", "", "", "", "","", 0, "", "", "", "", 0, 0, 0, "", "", "", "", "","");
        }
        return record;
    }

    function updateChanges(to_add, validation, changes) {
        let new_records = nonrfid_projection_data(to_add);
        let old_records;
        if (!validation) {
            old_records = nonrfid_projection_data(false);
            changes.push(
                {
                    "table_name": "COM_APPLE_COA_T_COA_NONRFID_PROJECTION",
                    "old": old_records,
                    "new": new_records,
                    "action": "INSERT"
                }
            )
        }
        else {
            old_records = nonrfid_projection_data(validation)
            changes.push(
                {
                    "table_name": "COM_APPLE_COA_T_COA_NONRFID_PROJECTION",
                    "old": old_records,
                    "new": new_records,
                    "action": "UPDATE"
                }
            )
        }

    }


    srv.before("GET", "F4help", async (request) => {
        let guid = getuuid();
        request.req.params["guid"] = guid;

    });


    srv.on("GET", "F4help", async (request) => {
        let guid = request.req.params["guid"];
        let LOG = getLogFromRequestIfAvailable(request,`GET_F4Help`);
        LOG.info(`COA - ${guid} - In On event of GET action of F4Help entity`);
        try {
            const dropdown_array = await getDropDownArray(request);
            request.results = dropdown_array;
        } catch (error) {
            LOG.info(`1.COA - ${guid} - Error: ${error}`);
            return `1.Error: ${JSON.stringify(error)} `;
        }
    });



    async function fetchdata(allowedattributes, field, change, search, db, top, skip) {
        let dropdown_array = [];
        let whereclause = "";
        // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
        // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
        // whereclause is equal to build_whereclause(allowedattributes);
        whereclause = getFilterString(allowedattributes);
        if (search) {
            let regex = /\*+/g;
            search = search?.replace(regex, `%`);
            regex = /_/g
            search = search?.replace(regex, `\\_`);
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



    async function getDropDownArray(request) {
        let search;
        if (request._query.$search) {
            search = request._query.$search.replace(/"/g, ``);
        }
        let dropdown_array = [];
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributes(jwtdetails, request);
        allowedAttributes['ProjectionTableReadOnly'] = {...allowedAttributes['ProjectionTableReadOnly'], ...allowedAttributes['ProjectionTableModify']}

        const change = request.query.SELECT.columns[0].ref[0];
        dropdown_array = await fetchdata(allowedAttributes['ProjectionTableReadOnly'], change, change, search, "V_NONRFID_PROJECTION", top, skip);

        return dropdown_array;
    }

    function getuuid() {
        return (cds.utils.uuid());
    }

    function getUuidFromRequest(request) {
        return (request && request?.headers['x-correlationid']) ? request.headers['x-correlationid'] : cds.utils.uuid();
    }



    function compareCMSite(el, rCM, rSite) {
        if (el.CM !== '$unrestricted' && el.CM !== rCM) {
            return false;
        }
        if (el.Site !== '$unrestricted' && el.Site !== rSite) {
            return false;
        }
        return true;
    }




    function chooseFirstDefined(el1, el2) {
        return el1 || el2;
    }

    function checkIfDefinedAndFill(curr, key, val=false)
    {
        if (curr[`${key}`]===undefined)
        {
            curr.err += ` | ${key} is not defined`
            return undefined;
        }
        if (val && val[curr[`${key}`]]===undefined)
        {
            curr.err += ` | ${key} value provided is invalid`
            return undefined;
        }
        return curr[`${key}`];
    }

    function checkIfDefinedAndValidateEditable(curr, key, val=false)
    {
        if (curr[`${key}`]===undefined)
        {
            return;
        }
        curr[`${key}`] = String(curr[`${key}`]).trim();
        if (val && val[curr[`${key}`]]===undefined)
        {
            curr.err += ` | ${key} value provided is invalid.`
            if (key==='RFID Scope')curr.err += ` It can only be Y/N`
            return;
        }
        if (key==='Carry Over Qty' || key==='QPL')
        {
            let string1=(curr[`${key}`])
            let num = Number(string1);
            if (String(num) === 'NaN') 
            {
                curr.err += ` | ${key} value provided is invalid. It can only be an integer.`
                return;
            }
        }
        return;
    }

    function addTositeProgramAqidMap(map, currGHSite, currCMProgram, currAQID, curr, insertIntoTempArray,request)
    {
        let LOG = getLogFromRequestIfAvailable(request,`addTositeProgramAqidMap`);
        if (map[`${currGHSite}`]===undefined)map[`${currGHSite}`]={};
        if (map[`${currGHSite}`][`${currCMProgram}`]===undefined)map[`${currGHSite}`][`${currCMProgram}`]={};
        if (map[`${currGHSite}`][`${currCMProgram}`][`${currAQID}`]===undefined)
        {
            let obj = {};
            obj[`GH_SITE`]=currGHSite;
            obj[`PROGRAM`]=currCMProgram;
            obj[`AQID`]=currAQID;
            insertIntoTempArray.push(obj);
            map[`${currGHSite}`][`${currCMProgram}`][`${currAQID}`]=curr;
        }
        else
        {
            curr.err = 'Duplicate records in the uploaded file';
            LOG.info(curr);
        }
    }

    function addToFullSizeMap(map, curr, insertIntoTempArray, fieldsExpectedInQPLUpload, fieldsExpectedInQPLUploadTableName)
    {
        let pointer = map;
        for (let i=0;i<fieldsExpectedInQPLUpload.length-3;i++)
        {
            let indicator = curr[`${fieldsExpectedInQPLUpload[i]}`];
            if (i===14)indicator = parseFloat(indicator);
            if (i===2 || i===13 || i===15 || i===16)indicator = parseInt(indicator);
            if (pointer[indicator]===undefined)pointer[indicator]={};
            pointer = pointer[indicator];
        }
        if (pointer[curr[`${fieldsExpectedInQPLUpload[fieldsExpectedInQPLUpload.length-3]}`]]===undefined)
        {
            let obj = {};
            for (let j=0;j<fieldsExpectedInQPLUpload.length-2;j++)
            {
                obj[`${fieldsExpectedInQPLUploadTableName[j]}`] = curr[`${fieldsExpectedInQPLUpload[j]}`]
            }
            insertIntoTempArray.push(obj);
            pointer[curr[`${fieldsExpectedInQPLUpload[fieldsExpectedInQPLUpload.length-3]}`]]=curr;
        }
        else
        {
            curr.err = 'Duplicate records in the uploaded file';
        }
    }

    function buildTmpArr(key,table,tmparr)
    {
        if (key.slice(0, key.indexOf('-')) === `$unrestricted`)
        {
            //pull all GH_sites which have site = key.slice(key.indexOf('-') + 1, key.length)
            let prosSites = table.filter(el=>(el.SITE === key.slice(key.indexOf('-') + 1, key.length)))
            prosSites.forEach(el=>{
                if (tmparr[el.GH_SITE]===undefined)tmparr[el.GH_SITE] = el.GH_SITE;
            })
        }
        else if (key.slice(key.indexOf('-') + 1, key.length) === `$unrestricted`)
        {
            //pull all GH_sites which have cm = key.slice(0, key.indexOf('-'))
            let prosCM = table.filter(el=>(el.CM === key.slice(0, key.indexOf('-'))))
            prosCM.forEach(el=>{
                if (tmparr[el.GH_SITE]===undefined)tmparr[el.GH_SITE] = el.GH_SITE;
            })
        }
        else
        {
            //pull required CM, site from table
            let prosCMSite = table.filter(el=>((el.CM === key.slice(0, key.indexOf('-'))) && (el.SITE === key.slice(key.indexOf('-') + 1, key.length))))
            prosCMSite.forEach(el=>{
                if (tmparr[el.GH_SITE]===undefined)tmparr[el.GH_SITE] = el.GH_SITE;
            })
        }
    }

    function getFilterStringOnGHSite(obj, table, fullTable) {
        let tmparr = {};
        if (obj[`$unrestricted-$unrestricted`] !== undefined)
        {
            fullTable.forEach(el=>{
                if (tmparr[el.GH_SITE]===undefined)tmparr[el.GH_SITE] = el.GH_SITE;
            })
            return tmparr;
        }
        Object.keys(obj).forEach(key => buildTmpArr(key,table,tmparr))
        return (tmparr)
    }
    
    function appendError(obj,body)
    {
        if (obj.err?.includes(body.trim()))return;
        obj.err+=body;
    }

    function doesCsvHaveProvidedFields(initialCsvData, fieldNameList)
    {
        let curr = initialCsvData[0];
        for (let i=0;i<fieldNameList.length;i++)
        {
            if(curr[fieldNameList[i]]===undefined)return false;
        }
        if(Object.keys(curr).length===fieldNameList.length) return true;
        else return false;
    }

    function checkForTemplateType(request, initialCsvData, fieldsExpectedInOriginalUpload, fieldsExpectedInQPLUpload)
    {
        if (doesCsvHaveProvidedFields(initialCsvData, fieldsExpectedInQPLUpload))return `QPL`
        if (doesCsvHaveProvidedFields(initialCsvData, fieldsExpectedInOriginalUpload))return `Original`
        throw JSON.stringify("The provided file does not adhere to the proper upload template"); 
    }

    async function getDataForOriginalUploadCase({uploadType,LOG,initialCsvData,GHSiteMap,ProgramMap,allowedGHSites,siteProgramAqidMap,insertIntoTempArray,request})
    {
        let allSelectionResults=[];
        uploadType.ut=`Original`;
        LOG.info("This is a case of original upload")
        for (let i=0;i<initialCsvData.length;i++)
        {
            LOG.info(`processing i=${i} now`);
            let curr = initialCsvData[i];
            curr.err = '';
            let currGHSite, currCMProgram, currAQID;
            currGHSite = checkIfDefinedAndFill(curr, `GH Site`, GHSiteMap);
            currCMProgram = checkIfDefinedAndFill(curr, `CM Program (3DV)`,ProgramMap);
            currAQID = checkIfDefinedAndFill(curr, `AQID (non-RFID)`);
            checkIfDefinedAndValidateEditable(curr, `RFID Scope`,{"Y":'Y',"N":'N'});
            checkIfDefinedAndValidateEditable(curr, `QPL`);
            checkIfDefinedAndValidateEditable(curr, `Carry Over Qty`);
            if (curr.err!=='')continue;
            if (allowedGHSites[currGHSite]===undefined)
            {
                appendError(curr,` | User does not have access to this GH_Site`);
                continue;
            }
            addTositeProgramAqidMap(siteProgramAqidMap, currGHSite, currCMProgram, currAQID, curr, insertIntoTempArray,request);
        }

        if (insertIntoTempArray.length <= 0) throw JSON.stringify(restructureErrObject(removeNonErrRecords(initialCsvData)))

        let tx = hdb.tx();

        let commonGuid = cds.utils.uuid();
        insertIntoTempArray = insertIntoTempArray.map(e => addIdAndGuid(e,commonGuid));
        try {
            LOG.info("started selection process at .", new Date());
            LOG.info("started insert at .", new Date());
            await tx.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries(insertIntoTempArray));
            LOG.info("inserted in at .", new Date());
            allSelectionResults = await tx.run(`SELECT distinct V_NONRFID_PROJECTION.*

            FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
            INNER JOIN V_NONRFID_PROJECTION AS V_NONRFID_PROJECTION

            ON T_COA_TEMP.Aqid = V_NONRFID_PROJECTION.Aqid
            AND T_COA_TEMP.Program = V_NONRFID_PROJECTION.Program
            AND T_COA_TEMP."GH_SITE" = V_NONRFID_PROJECTION."GH_SITE"

            WHERE T_COA_TEMP.ID='${commonGuid}'`)

            await tx.run(DELETE.from("COM_APPLE_COA_T_COA_TEMP").where({ ID: commonGuid }));
            await tx.commit();
        }
        catch(err)
        {
            tx.rollback();
            let errorLogId = cds.utils.uuid();
            initialCsvData.forEach(el=>{el.err += ` | There was an error while selecting data to update(${errorLogId})`})
            LOG.info (`${errorLogId} | ${err.response?.data || err.response || err.data || err}`)
            throw JSON.stringify(restructureErrObject(removeNonErrRecords(initialCsvData)));
        }

        allSelectionResults.map(el=>{
            let fromUploaded = siteProgramAqidMap[el.GH_SITE][el.PROGRAM][el.AQID];
            fromUploaded.found = true;
            if (getFirstDefined(fromUploaded[`RFID Scope`] , el.RFID_SCOPE)) el.RFID_SCOPE = getFirstDefined(fromUploaded[`RFID Scope`] , el.RFID_SCOPE)
            if (getFirstDefined(fromUploaded[`Carry Over Qty`] , el.CARRY_OVER)) el.CARRY_OVER = getFirstDefined(fromUploaded[`Carry Over Qty`] , el.CARRY_OVER)
            return el;
        })

        return allSelectionResults;
    }

    async function getDataForQPLUploadCase({uploadType,initialCsvData,LOG,siteProgramAqidMap,insertIntoTempArray,fieldsExpectedInQPLUpload,fieldsExpectedInQPLUploadTableName})
    {
        let allSelectionResults=[];
        uploadType.ut=`QPL`;
            LOG.info("This is a case of QPL upload")
            for (let i=0;i<initialCsvData.length;i++)
            {
                LOG.info(`processing i=${i} now`);
                let curr = initialCsvData[i];
                curr.err = '';
                checkIfDefinedAndValidateEditable(curr, `QPL`);
                if (curr.err!=='')continue;
                addToFullSizeMap(siteProgramAqidMap, curr, insertIntoTempArray, fieldsExpectedInQPLUpload, fieldsExpectedInQPLUploadTableName);
            }

            if (insertIntoTempArray.length <= 0) throw JSON.stringify(restructureErrObjectForQPL(removeNonErrRecords(initialCsvData),fieldsExpectedInQPLUpload, fieldsExpectedInQPLUploadTableName))

            let tx = hdb.tx();

            let commonGuid = cds.utils.uuid();
            insertIntoTempArray = insertIntoTempArray.map(e => addIdAndGuid(e,commonGuid));
            try {
                LOG.info("started selection process at .", new Date());
                LOG.info("started insert at .", new Date());
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries(insertIntoTempArray));
                LOG.info("inserted in at .", new Date());
                allSelectionResults = await tx.run(`SELECT distinct V_NONRFID_PROJECTION.*

                FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
                INNER JOIN V_NONRFID_PROJECTION AS V_NONRFID_PROJECTION

                ON 
                ${getNonEditableFieldEqualityString(fieldsExpectedInQPLUploadTableName)}

                WHERE T_COA_TEMP.ID='${commonGuid}'`)

                await tx.run(DELETE.from("COM_APPLE_COA_T_COA_TEMP").where({ ID: commonGuid }));
                await tx.commit();
            }
            catch(err)
            {
                await tx.rollback();
                let errorLogId = cds.utils.uuid();
                initialCsvData.forEach(el=>{el.err += ` | There was an error while selecting data to update(${errorLogId})`})
                LOG.info (`${errorLogId} | ${err.response?.data || err.response || err.data || err}`)
                throw JSON.stringify(restructureErrObjectForQPL(removeNonErrRecords(initialCsvData),fieldsExpectedInQPLUpload, fieldsExpectedInQPLUploadTableName));
            }

            allSelectionResults.map(el=>{
                el.MP_INTENT_QTY = parseFloat(el.MP_INTENT_QTY);
                let fromUploaded = siteProgramAqidMap;
                for (let i=0;i<fieldsExpectedInQPLUploadTableName.length-2;i++)
                {fromUploaded = fromUploaded[el[fieldsExpectedInQPLUploadTableName[i]]];}
                fromUploaded.found = true;
                if (getFirstDefined(fromUploaded[`QPL`] , el.QPL)) el.QPL = getFirstDefined(fromUploaded[`QPL`] , el.QPL)
                if (getFirstDefined(fromUploaded[`Department`] , el.DEPT)) el.DEPT = getFirstDefined(fromUploaded[`Department`] , el.DEPT)
                return el;
            })

            return allSelectionResults;
    }

    async function checkAndGetAllData(initialCsvData,siteProgramAqidMap,request,uploadType)
    {
        let LOG = getLogFromRequestIfAvailable(request,`checkAndGetAllData`);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributes(jwtdetails, request);
        let fieldsExpectedInOriginalUpload = [`GH Site`,`CM Program (3DV)`,`AQID (non-RFID)`,`RFID Scope`,`Carry Over Qty`];
        let fieldsExpectedInQPLUpload = [`GH Site`,`CM Program (3DV)`,`UPH`,`Line Type`,`AQID (non-RFID)`,`Short AQID`,`Parent Item`,`Scope`,`Alternate Station`,`Projected Station`,`Group Priority`,`Equipment Type`,`RFID Scope`,`SPL`,`MP Intent Qty`,`Spare Rate`,`Spare Qty`,`Consumables`,`PO Type`,`Equipment Name`,`MFR`,`Display Name`,`Category`,`Department`,`QPL`];
        let fieldsExpectedInQPLUploadTableName = [`GH_SITE`,`PROGRAM`,`UPH`,`LINE`,`AQID`,`SHORT_NAME`,`PARENT_ITEM`,`SCOPE`,`ALT_STATION`,`STATION`,`GROUP_PRIORITY`,`EQUIPMENT_TYPE`,`RFID_SCOPE`,`SPL`,`MP_INTENT_QTY`,`SPARE_RATE`,`SPARE_QTY`,`CONSUMABLES`,`PO_TYPE`,`EQUIPMENT_NAME`,`MFR`,`DISPLAY_NAME`,`CATEGORY`,`DEPT`,`QPL`];
        let BOM_CM_Site_Table_ghsite_map = await cds.run(`SELECT DISTINCT CM,SITE,GH_SITE from COM_APPLE_COA_T_COA_BOM_STRUCTURE where CM!=''`);
        let BOM_GHSite_Table_ghsite_map2 = await cds.run(`SELECT DISTINCT GH_SITE from COM_APPLE_COA_T_COA_BOM_STRUCTURE`);
        let ProgramValTable = await cds.run(`SELECT DISTINCT PROGRAM from V_NONRFID_PROJECTION`);
        let GHSiteMap = {};
        let ProgramMap = {}
        BOM_GHSite_Table_ghsite_map2.forEach(el=>{
            GHSiteMap[el.GH_SITE]=el.GH_SITE;
        })
        ProgramValTable.forEach(el=>{
            ProgramMap[el.PROGRAM]=el.PROGRAM;
        })
        allowedAttributes['ProjectionTableReadOnly'] = merge(allowedAttributes['ProjectionTableReadOnly'], allowedAttributes['ProjectionTableModify'])
        let allowedGHSites = getFilterStringOnGHSite(allowedAttributes['ProjectionTableReadOnly'],BOM_CM_Site_Table_ghsite_map,BOM_GHSite_Table_ghsite_map2)
        let insertIntoTempArray = [];
        let allSelectionResults = [];
        //check for which template this is. Reject otherwise
        let templateType = checkForTemplateType(request, initialCsvData, fieldsExpectedInOriginalUpload, fieldsExpectedInQPLUpload);
        if (templateType===`Original`)
        {
            allSelectionResults=await getDataForOriginalUploadCase({uploadType,LOG,initialCsvData,GHSiteMap,ProgramMap,allowedGHSites,siteProgramAqidMap,insertIntoTempArray,request});
            return allSelectionResults;
        }

        else if (templateType===`QPL`)
        {
            allSelectionResults=await getDataForQPLUploadCase({uploadType,initialCsvData,LOG,siteProgramAqidMap,insertIntoTempArray,fieldsExpectedInQPLUpload,fieldsExpectedInQPLUploadTableName});
            return allSelectionResults
        }

    }

    function getNonEditableFieldEqualityString(fieldsExpectedInQPLUploadTableName)
    {
        let arr = [];
        for(let i=0;i<fieldsExpectedInQPLUploadTableName.length-2;i++)
        {
            arr.push(`T_COA_TEMP.${fieldsExpectedInQPLUploadTableName[i]} = V_NONRFID_PROJECTION.${fieldsExpectedInQPLUploadTableName[i]}`)
        }
        return (arr.join(` AND `));
    }

    function removeNonErrRecords(initialCsvData)
    {
        initialCsvData = initialCsvData.filter(el=>{
           if (el.err===undefined || el.err==='')return false;
           return true;
        })
        return initialCsvData;
    }

    function checkIfDataHasError(initialCsvData)
    {
        initialCsvData.forEach(el=>{
            if (el.err!=='')
                throw (JSON.stringify(restructureErrObject(removeNonErrRecords(initialCsvData))));
        })
    }

    function rejectIfReadMoreTanLimitRows(arg,request, initialCsvData)
    {
        let fieldsExpectedInOriginalUpload = [`GH Site`,`CM Program (3DV)`,`AQID (non-RFID)`,`RFID Scope`,`Carry Over Qty`];
        let fieldsExpectedInQPLUpload = [`GH Site`,`CM Program (3DV)`,`UPH`,`Line Type`,`AQID (non-RFID)`,`Short AQID`,`Parent Item`,`Scope`,`Alternate Station`,`Projected Station`,`Group Priority`,`Equipment Type`,`RFID Scope`,`SPL`,`MP Intent Qty`,`Spare Rate`,`Spare Qty`,`Consumables`,`PO Type`,`Equipment Name`,`MFR`,`Display Name`,`Category`,`Department`,`QPL`];        
        let templateType = checkForTemplateType(request, initialCsvData, fieldsExpectedInOriginalUpload, fieldsExpectedInQPLUpload);
        if (templateType===`Original` && arg>10000) throw (JSON.stringify("You cannot upload a file with more than 10000 records"));
        if (templateType===`QPL` && arg>20000) throw (JSON.stringify("You cannot upload a file with more than 20000 records"))
    }

    function addReqToRequest(request)
    {
        if (request.req===undefined)request.req={};
        if (request.req.params===undefined)request.req.params={};
    }

    srv.before("PUT", Upload_NonRFID_Projection, async (request) => {
        let guid = getuuid();
        const LOG = cds.log(getUuidFromRequest(request), { label: 'NonRFID_Upload' });
        addReqToRequest(request);
        request.req.params["LOG"] = LOG;
        LOG.info("log_id : ", guid, " | ", "Upload started at .", new Date());
        const {
            Readable
        } = require("stream");
        let readable;
        let csvRawDump = [];
        completed = false;
        somethingToInsert = false;

        if (process.env.NODE_ENV !== 'test') {
            LOG.info("abt to make readable at .", new Date());
            readable = Readable.from(request.data.csv);
        }
        else {
            let filename = "/home/user/projects/p2d__1/coa-nonrfid-projection/Non-RFID-22.csv";
            readable = fs.createReadStream(filename);
        }
        LOG.info("abt to pipe at .", new Date());
        readable
            .pipe(csv())
            .on("data", async function (csvrow) {
                csvrow[`${Object.keys(csvrow)[0].trim()}`] = csvrow[Object.keys(csvrow)[0]];
                csvRawDump.push(csvrow);
            })
            .on("finish", async function () {
                LOG.info("in on finish at .", new Date());
                LOG.info("Read ", csvRawDump.length, " rows.")
                let siteProgramAqidMap = {};
                let uploadType = {};
                let initialCsvData = JSON.parse(JSON.stringify(csvRawDump));
                try {
                    rejectIfReadMoreTanLimitRows(csvRawDump.length,request, initialCsvData)
                    csvRawDump = await checkAndGetAllData(initialCsvData,siteProgramAqidMap,request,uploadType);
                    let tbi = ["UPH", "GROUP", "ALT_STATION", "MP_INTENT_QTY", "SPARE_QTY", "SPARE_RATE", "RELEASE_QTY", "QPL", "CARRY_OVER", "BOH"]
                    csvRawDump = csvRawDump.map(el => restructureDataKeys(el, tbi));
                    LOG.info("sending for actual processing at .", new Date());

                    let request1 = {};
                    request1.data = { NonRFIDData: csvRawDump, auth: request.headers.authorization };
                    if (csvRawDump.length > 40000)
                    {
                        throw (JSON.stringify("You cannot upload more than 40000 records"))
                    }
                    if (csvRawDump.length <= 0)
                    {
                        throw (JSON.stringify("No matching record found against the uploaded file"))
                    }
                    try{
                        before_NonRFID_Projection_Action(request1);
                        await on_NonRFID_Projection_Action(request1);
                    }
                    catch(error)
                    {
                        LOG.info("There was an error during massUpdate part of uploading: ", error);
                        let errorn = JSON.parse(error);
                        errorn.forEach(el=>{
                            if (el.ErrorMsg !== undefined && el.ErrorMsg !== '')appendErrorPostCheckingType(el,siteProgramAqidMap,uploadType)
                            
                        })
                    }
                    initialCsvData.forEach(el=>appendErrorToInitialCsvData(siteProgramAqidMap, el,uploadType));
                    checkIfDataHasError(initialCsvData);
                    await cds.context.http.res.status(200).send({ msg: "Changes saved successfully" });
                }
                catch (error) {
                    LOG.info("There was an error while uploading: ", error);
                    await cds.context.http.res.status(400).send({ msg: error });
                }
            }
            );
    });

    function appendErrorPostCheckingType(el,siteProgramAqidMap,uploadType)
    {
        if (uploadType.ut===`Original`)
            appendError(siteProgramAqidMap[el.GH_SITE][el.PROGRAM][el.AQID],` | ${el.ErrorMsg}`);
        else if (uploadType.ut===`QPL`)
        {
            let fieldsExpectedInQPLUploadTableName = [`GH_SITE`,`PROGRAM`,`UPH`,`LINE`,`AQID`,`SHORT_NAME`,`PARENT_ITEM`,`SCOPE`,`ALT_STATION`,`STATION`,`GROUP_PRIORITY`,`EQUIPMENT_TYPE`,`RFID_SCOPE`,`SPL`,`MP_INTENT_QTY`,`SPARE_RATE`,`SPARE_QTY`,`CONSUMABLES`,`PO_TYPE`,`EQUIPMENT_NAME`,`MFR`,`DISPLAY_NAME`,`CATEGORY`,`DEPT`,`QPL`];
            let pointer = siteProgramAqidMap;
            let i=0
            for (;i<fieldsExpectedInQPLUploadTableName.length-2;i++)
            {
                if (pointer[el[fieldsExpectedInQPLUploadTableName[i]]]!==undefined)pointer=pointer[el[fieldsExpectedInQPLUploadTableName[i]]];
                else break;
            }
            if (i===fieldsExpectedInQPLUploadTableName.length-2)
            appendError(pointer,` | ${el.ErrorMsg}`);
        }
    }

    function appendErrorToInitialCsvData(siteProgramAqidMap, el,uploadType)
    {
        let getMapRecord = fetchMapRecord(siteProgramAqidMap,el,uploadType);
        if (el.err==='' && getMapRecord!==undefined && getMapRecord?.found===undefined)
        {
            appendError(el,` | No matching record with this combination found`);
        }
        if(getMapRecord!==undefined && el.err==='')appendError(el,getMapRecord.err);
    }

    function fetchMapRecord(siteProgramAqidMap,el,uploadType)
    {
        if (uploadType.ut===`Original`)
        {
            if (siteProgramAqidMap[el[`GH Site`]]===undefined)return undefined;
            if (siteProgramAqidMap[el[`GH Site`]][el[`CM Program (3DV)`]]===undefined)return undefined;
            if (siteProgramAqidMap[el[`GH Site`]][el[`CM Program (3DV)`]][el[`AQID (non-RFID)`]]===undefined)return undefined;
            return siteProgramAqidMap[el[`GH Site`]][el[`CM Program (3DV)`]][el[`AQID (non-RFID)`]];
        }
        else if (uploadType.ut===`QPL`)
        {
            let fieldsExpectedInQPLUpload = [`GH Site`,`CM Program (3DV)`,`UPH`,`Line Type`,`AQID (non-RFID)`,`Short AQID`,`Parent Item`,`Scope`,`Alternate Station`,`Projected Station`,`Group Priority`,`Equipment Type`,`RFID Scope`,`SPL`,`MP Intent Qty`,`Spare Rate`,`Spare Qty`,`Consumables`,`PO Type`,`Equipment Name`,`MFR`,`Display Name`,`Category`,`Department`,`QPL`];
            let pointer = siteProgramAqidMap;
            let i=0
            for (;i<fieldsExpectedInQPLUpload.length-2;i++)
            {
                if (pointer[el[fieldsExpectedInQPLUpload[i]]]!==undefined)pointer=pointer[el[fieldsExpectedInQPLUpload[i]]];
                else break;
            }
            return returnPointerOnCondition({i,fieldsExpectedInQPLUpload,pointer});
        }
    }

    function returnPointerOnCondition({i,fieldsExpectedInQPLUpload,pointer})
    {
        if (i===fieldsExpectedInQPLUpload.length-2) return pointer
        else return undefined;
    }

    function renameObjKey(obj,oldKey,newKey)
    {
        if (obj[`${oldKey}`]!==undefined)
        {
            obj[`${newKey}`]=obj[`${oldKey}`]
            delete obj[`${oldKey}`];
        }
    }

    function restructureErrObject(error)
    {
        error.map(el=>{
            renameObjKey(el,`GH Site`,`GH_SITE`);
            renameObjKey(el,`CM Program (3DV)`,`PROGRAM`);
            renameObjKey(el,`AQID (non-RFID)`,`AQID`);
            renameObjKey(el,`Carry Over Qty`,`CARRY_OVER`);
            renameObjKey(el,`RFID Scope`,`RFID_SCOPE`);
            renameObjKey(el,`err`,`ErrorMsg`);
            return el;
        })
        return error;
    }

    function restructureErrObjectForQPL(error,fieldsExpectedInQPLUpload, fieldsExpectedInQPLUploadTableName)
    {
        error.map(el=>{
            for (let i=0;i<fieldsExpectedInQPLUpload.length-1;i++)renameObjKey(el,`${fieldsExpectedInQPLUpload[i]}`,`${fieldsExpectedInQPLUploadTableName[i]}`);
            renameObjKey(el,`err`,`ErrorMsg`);
            return el;
        })
        return error;
    }
    

    


    function restructureDataKeys(el, tbi) {
        // There existed code to make all keys of the object to upper-case here
        let i = 0;
        for (; i < tbi.length; i++) {
            el[tbi[i]] = isNaN(el[tbi[i]])?String(el[tbi[i]]):parseInt(el[tbi[i]]);
            if (el[tbi[i]]!==0 && !el[tbi[i]])el[tbi[i]] = null;
        }
        // there existed code to remove/add CARRY_OVER and QPL based on user intent
        return el;
    }

    


    srv.on("PUT", Upload_NonRFID_Projection, async (request) => {
        let LOG = getLogFromRequestIfAvailable(request,`Upload_NonRFID_Projection`);
        LOG.info(`COA - In On Event of Upload AQIDMapping`);
        await waitFor(() => completed === true).then(() => {
            LOG.info(`COA csv upload - The wait is over!`);
            if (!somethingToInsert) {
                LOG.info(`COA csv upload - Nothing to Update`);
            } else {
                LOG.info(`COA csv upload - Uploaded Successfully`);
            }
        });

    });

    srv.on("PUT", Upload_NonRFID_Projection_for_QPL, async (request) => {
        let LOG = getLogFromRequestIfAvailable(request,`Upload_NonRFID_Projection`);
        LOG.info(`COA - In On Event of Upload AQIDMapping`);
        await waitFor(() => completed === true).then(() => {
            LOG.info(`COA csv upload - The wait is over!`);
            if (!somethingToInsert) {
                LOG.info(`COA csv upload - Nothing to Update`);
            } else {
                LOG.info(`COA csv upload - Uploaded Successfully`);
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

    function fillAllSelectionResultPrefilled(request, allSelectionResultsarg) {
        if (request.headers?.NonRFIDProjTable) {
            allSelectionResultsarg.allSelectionResults = request.headers.NonRFIDProjTable;
        }
    }

    function massUpdateLengthCheck(request) {
        if (request.data?.NonRFIDData.length > 800000) {
            request.reject(400, "You cannot mass update more than 800000 records.")
        }
    }

    function removeRecordsWithBlankID(argallIDtoDelFromTable, allSelectionResults) {
        argallIDtoDelFromTable.allIDtoDelFromTable = allSelectionResults.map(el => {
            if (!el.ID || el.ID === '') {
                return 'abc';
            }
            return (el.ID);
        });
        argallIDtoDelFromTable.allIDtoDelFromTable = argallIDtoDelFromTable.allIDtoDelFromTable.filter(el => {
            if (el === 'abc') {
                return false;
            }
            return true;
        });
    }

    function generateKeyCollection(request, keyArray, keyCollection) {
        let i = 0;
        for (; i < request.data.NonRFIDData.length; i++) {
            let csvrow = request.data.NonRFIDData[i];
            let keyCollectionObj = {};
            keyArray.forEach(e => {
                keyCollectionObj[e] = csvrow[e];
            });
            keyCollection.push(keyCollectionObj);
        }
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

    function addIdAndGuid(e,commonGuid)
    {
        e.ID = commonGuid;
        e.GUID = cds.utils.uuid();
        return e;
    }

    async function getAllSelection(argallSelectionResults, keyCollection,request) {
        let LOG = getLogFromRequestIfAvailable(request,`getAllSelection`);
        if (argallSelectionResults.allSelectionResults.length <= 0) {
            let commonGuid = cds.utils.uuid();
            keyCollection = keyCollection.map(e => addIdAndGuid(e,commonGuid));
            let tx = hdb.tx();
            try {
                LOG.info("started selection process at .", new Date());
                LOG.info("started insert at .", new Date());
                await tx.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries(keyCollection));
                await tx.commit();
                LOG.info("inserted in at .", new Date());
                argallSelectionResults.allSelectionResults = await cds.run(`SELECT V_NONRFID_PROJECTION.*
            FROM COM_APPLE_COA_T_COA_TEMP AS T_COA_TEMP
              INNER JOIN V_NONRFID_PROJECTION AS V_NONRFID_PROJECTION
             ON T_COA_TEMP.Aqid = V_NONRFID_PROJECTION.Aqid
              AND T_COA_TEMP.Program = V_NONRFID_PROJECTION.Program
              AND T_COA_TEMP."GH_SITE" = V_NONRFID_PROJECTION."GH_SITE"
              AND T_COA_TEMP.Line = V_NONRFID_PROJECTION.Line
              AND T_COA_TEMP.Uph = V_NONRFID_PROJECTION.Uph
              AND T_COA_TEMP.Station = V_NONRFID_PROJECTION.Station
              AND T_COA_TEMP.Level = V_NONRFID_PROJECTION.Level
              AND T_COA_TEMP.Group_Priority = V_NONRFID_PROJECTION.Group_Priority
              AND T_COA_TEMP.Mfr = V_NONRFID_PROJECTION.Mfr
              WHERE T_COA_TEMP.ID='${commonGuid}'`)
                let tx2 = hdb.tx();
                await tx2.run(DELETE.from("COM_APPLE_COA_T_COA_TEMP").where({ ID: commonGuid }));
                await tx2.commit();
            }
            catch (errorr) {
                LOG.info("selction process failed: ", errorr);
            }
        }
    }

    function getFirstDefined(arg1,arg2)
    {
        return (arg1||arg2)
    }

    function prepareCurrRequest(insObj, currRequest, jwtdetails, currValRecord, errorMsgQueue, insertQueue, keyArray) {
        let isQPLModified = false;
        if ((currRequest.QPL) && ((!currValRecord.QPL_USER_DEFINED) || (currValRecord.QPL_USER_DEFINED !== currRequest.QPL))) {
            isQPLModified = true;
            currRequest.QPL_USER = currRequest.QPL;
        }
        if ((currRequest.QPL===0) && ((!currValRecord.QPL_USER_DEFINED) || (currValRecord.QPL_USER_DEFINED !== 0))) {
            isQPLModified = true;
            currRequest.QPL_USER = 0;
        }
        if (!(currValRecord.RFID_SCOPE) && !(currValRecord.CARRY_OVER)) {
            currRequest.CREATEDBY_NAME = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
            currRequest.CREATEDBY_MAIL = String(jwtdetails.email);
            currRequest.CREATEDAT = new Date().toISOString();
        }
        else {
            currRequest.MODIFIEDBY_NAME = String(`${jwtdetails.given_name} ${jwtdetails.family_name}`);
            currRequest.MODIFIEDBY_MAIL = String(jwtdetails.email);
            currRequest.MODIFIEDAT = new Date().toISOString();
            currRequest.CREATEDBY_NAME = getFirstDefined(currValRecord.CREATEDBY_NAME,String(`${jwtdetails.given_name} ${jwtdetails.family_name}`));
            currRequest.CREATEDBY_MAIL = getFirstDefined(currValRecord.CREATEDBY_MAIL,String(jwtdetails.email));
            currRequest.CREATEDAT = getFirstDefined(currValRecord.CREATEDAT,new Date().toISOString());
        }

        currRequest.RFID_SCOPE = String(currRequest.RFID_SCOPE).trim().toUpperCase();
        errorMsgQueue.push("");
        let it = 0;
        for (; it < keyArray.length; it++) {
            insObj[keyArray[it]] = currRequest[keyArray[it]];
        }
        insObj["CM"] = chooseFirstDefined(currRequest["CM"], '');
        insObj["SITE"] = chooseFirstDefined(currRequest["SITE"], '');
        delete insObj["GH_SITE"];
        insObj["RFID_SCOPE"] = currRequest["RFID_SCOPE"];
        insObj["CARRY_OVER"] = currRequest["CARRY_OVER"];
        insObj["BALANCE_QTY"] = parseFloat(currValRecord["BALANCE_QTY"] || "0.0");
        if (currRequest.DEPT!==null && currRequest.DEPT!==undefined && currRequest.DEPT!=='')insObj["DEPT"]=currRequest["DEPT"];
        if (isQPLModified) insObj["QPL_USER"] = currRequest["QPL_USER"];
        insObj["CREATEDBY_NAME"] = currRequest["CREATEDBY_NAME"];
        insObj["CREATEDBY_MAIL"] = currRequest["CREATEDBY_MAIL"];
        insObj["CREATEDAT"] = currRequest["CREATEDAT"];
        insObj["SCOPE"] = currRequest["SCOPE"];
        addDateInfoToCurrRequest({currRequest,insObj})
        insertQueue.push(insObj);
    }

    function addDateInfoToCurrRequest({currRequest,insObj})
    {
        if (currRequest["MODIFIEDBY_NAME"]) insObj["MODIFIEDBY_NAME"] = currRequest["MODIFIEDBY_NAME"];
        if (currRequest["MODIFIEDBY_MAIL"]) insObj["MODIFIEDBY_MAIL"] = currRequest["MODIFIEDBY_MAIL"];
        if (currRequest["MODIFIEDAT"]) insObj["MODIFIEDAT"] = currRequest["MODIFIEDAT"];
    }

    function getTempKeys(currRequest, keyArray) {
        let retArr = [];
        let i = 0;
        for (; i < keyArray.length; i++) {
            retArr.push(currRequest[keyArray[i]])
        }
        return retArr;
    }

    function postProcessAllowedCMSite(allowedCMSite) {
        Object.keys(allowedCMSite).forEach((key) => {
            allowedCMSite[key] = convertToArray(allowedCMSite[key])
            allowedCMSite[key] = allowedCMSite[key].map(el => {
                let obj = {};
                el = String(el);
                obj.CM = el.slice(0, el.indexOf(`-`));
                obj.Site = el.slice(el.indexOf(`-`) + 1, el.length);
                return obj;
            })
        })
    }

    function clearQPLProcessingLoop(request, errorMsgQueue, jwtdetails, nonRFIDProjectionProcessingLoopArgs) {
        let allowedCMSite = getAllowedAttributes(jwtdetails, request);
        postProcessAllowedCMSite(allowedCMSite);
        let keyArray = nonRFIDProjectionProcessingLoopArgs.keyArray;
        let changeQueue = nonRFIDProjectionProcessingLoopArgs.changeQueue;
        
        let i = 0;
        while (i < request.data.NonRFIDData.length) {
            let currRequest = request.data.NonRFIDData[i];
            let currError = "";
            let outcome = validate_data2(allowedCMSite, currRequest, i, errorMsgQueue,request);
            currError = outcome.currError;
            errorMsgQueue = outcome.errorMsgQueue;
            i = outcome.i;
            currRequest = outcome.currRequest;
            if(currError){
                continue;
            }
            errorMsgQueue.push("");
            let it = 0;
            let insObj={};
            for (; it < keyArray.length; it++) {
                insObj[keyArray[it]] = currRequest[keyArray[it]];
            }
            insObj['MODIFIEDAT']=(new Date().toISOString())
            changeQueue.push(insObj);

            i++;
        }
    }

    function nonRFIDProjectionProcessingLoop(request, errorMsgQueue, map1, jwtdetails, insertQueue, changes, nonRFIDProjectionProcessingLoopArgs) {
        let LOG = getLogFromRequestIfAvailable(request,`nonRFIDProjectionProcessingLoop`);
        let allowedCMSite = getAllowedAttributes(jwtdetails, request);
        postProcessAllowedCMSite(allowedCMSite);
        let keyArray = nonRFIDProjectionProcessingLoopArgs.keyArray;
        let i = 0;
        while (i < request.data.NonRFIDData.length) {
            let currRequest = request.data.NonRFIDData[i];
            let currError = "";
            let outcome = validate_date(allowedCMSite, currRequest, i, errorMsgQueue, request);
            currError = outcome.currError;
            errorMsgQueue = outcome.errorMsgQueue;
            i = outcome.i;
            currRequest = outcome.currRequest;
            if(currError){
                continue;
            }

            let tempGetKeyArray = [];
            tempGetKeyArray = getTempKeys(currRequest, keyArray)
            let inAllSelection = getMultiLevelValue(map1, tempGetKeyArray);

            if (inAllSelection === undefined) {
                LOG.info("You cannot create new entries. Entry with provided key combination not found.");
                currError = "You cannot create new entries. Entry with provided key combination not found.";
                errorMsgQueue.push(currError)
                i++;
                continue;
            }
            
            let insObj = {};
            let currValRecord = inAllSelection;
            prepareCurrRequest(insObj, currRequest, jwtdetails, currValRecord, errorMsgQueue, insertQueue, keyArray);
            updateChanges(insObj, currValRecord, changes)
            i++;
        }
    }

    function validate_data2(allowedCMSite, currRequest, i, errorMsgQueue,request) {
        let LOG = getLogFromRequestIfAvailable(request,`validate_data2`);
        let currError = "";
            if (allowedCMSite[`ProjectionTableModify`].findIndex(el => compareCMSite(el, currRequest.CM, currRequest.SITE)) < 0) {
                LOG.info("User does not have access to modify this CM-Site data");
                currError = "User does not have access to modify this CM-Site data";
                errorMsgQueue.push(currError)
                i++;
                return {errorMsgQueue, i, currError, currRequest};
            }

            return {errorMsgQueue, i, currError, currRequest};
    }


    function validate_date(allowedCMSite, currRequest, i, errorMsgQueue, request) {
        let LOG = getLogFromRequestIfAvailable(request,`validate_date`);
        let currError = "";
            if (allowedCMSite[`ProjectionTableModify`].findIndex(el => compareCMSite(el, currRequest.CM, currRequest.SITE)) < 0) {
                LOG.info("User does not have access to modify this CM-Site data");
                currError = "User does not have access to modify this CM-Site data";
                errorMsgQueue.push(currError)
                i++;
                return {errorMsgQueue, i, currError, currRequest};
            }
            // To allow any one editable field to be updated via mass update
            if(currRequest.CARRY_OVER===null && currRequest.RFID_SCOPE===null && currRequest.QPL===null && currRequest.DEPT===null)
            {
                LOG.info("All of carry_over, rfid_scope, Dept and QPL are null. There is nothing to update.");
                currError = "All of carry_over, rfid_scope, Dept and QPL are null. There is nothing to update.";
                errorMsgQueue.push(currError)
                i++;
                return {errorMsgQueue, i, currError, currRequest};
            }
            if ((currRequest.CARRY_OVER) && (currRequest.CARRY_OVER && isNaN(parseInt(currRequest.CARRY_OVER)))) {
                LOG.info("Carry over must be an integer");
                currError = "Carry over must be an integer";
                errorMsgQueue.push(currError)
                i++;
                return {errorMsgQueue, i, currError, currRequest};
            }
            if(currRequest.CARRY_OVER===null)
            {
                currRequest.CARRY_OVER = 0;                
            }
            currRequest.CARRY_OVER = currRequest.CARRY_OVER ? parseInt(currRequest.CARRY_OVER): currRequest.CARRY_OVER ;

             // To allow any one editable field to be updated via mass update
            if ((currRequest.RFID_SCOPE!==null && currRequest.RFID_SCOPE!=='') && ( String(currRequest.RFID_SCOPE).trim().length > 1 || !(String(currRequest.RFID_SCOPE).trim().toUpperCase() === 'Y' || String(currRequest.RFID_SCOPE).trim().toUpperCase() === 'N'))) {
                LOG.info("RFID SCOPE must be either Y or N");
                currError = "RFID SCOPE must be either Y or N";
                errorMsgQueue.push(currError)
                i++;
                return {errorMsgQueue, i, currError, currRequest};
            }

            if ((currRequest.QPL) && (currRequest.QPL && isNaN(parseInt(currRequest.QPL)))) {
                LOG.info("QPL must be an integer");
                currError = "QPL must be an integer";
                errorMsgQueue.push(currError)
                i++;
                return {errorMsgQueue, i, currError, currRequest};
            }
            if(currRequest.QPL!==null)
            {
                currRequest.QPL = parseInt(currRequest.QPL) ;
            }
            

            return {errorMsgQueue, i, currError, currRequest};
    }

    function getUpdatedErrMsgQueue(errorMsgQueue)
    {
        let m = 0;
        for (; m < errorMsgQueue.length; m++) {
            if (errorMsgQueue[m] === "") {
                errorMsgQueue[m] = "error while inserting/updating data into NonRFID Projection table";
            }
        }
        return errorMsgQueue;
    }

    async function pushToDBandChangelog(insertQueue, allIDtoDelFromTable, changes, request, errorMsgQueue) {
        let LOG = getLogFromRequestIfAvailable(request,`pushToDBandChangelog`);
        if (insertQueue.length > 0) {
            insertQueue = insertQueue.map(el => {
                el.ID = cds.utils.uuid();
                return el;
            })
            LOG.info("delete action start at .", new Date());
            let tx = hdb.tx();
            let k = 0;
            try {
                let chunkSize;
                if (allIDtoDelFromTable.length > 0) {
                     chunkSize = 2500;
                    for (; k < allIDtoDelFromTable.length; k += chunkSize) {
                        let selectChunkKeys = allIDtoDelFromTable.slice(k, k + chunkSize);
                        await tx.run(DELETE.from("COM_APPLE_COA_T_COA_NONRFID_PROJECTION").where({ ID: { in: selectChunkKeys } }));
                    }
                }
                LOG.info("del end insert start at .", new Date());
                chunkSize = 10000;
                k = 0; // Pooja Added this line to get things updated in DB as it was skipping the records till k value
                for (; k < insertQueue.length; k += chunkSize) {
                    let insertQueue_temp = insertQueue.slice(k, k + chunkSize);
                    await tx.run(INSERT.into("COM_APPLE_COA_T_COA_NONRFID_PROJECTION").entries(insertQueue_temp));
                }
                LOG.info("insert end commit at .", new Date());
                await tx.commit();
                try {
                    await update_changelog(changes, request);
                }
                catch (err) {
                    LOG.info('Error while calling messagelog: ', err.response?.data || err.response || err);
                }
                LOG.info("Successfully updated in the db at .", new Date());
            }
            catch (err) {
                await tx.rollback();
                LOG.info("Error while updating in db: ", err);
                getUpdatedErrMsgQueue(errorMsgQueue);
            }
        }
    }

    function appendAndSendError(request, errorMsgQueue) {
        let LOG = getLogFromRequestIfAvailable(request,`appendAndSendError`);
        let l = 0;
        let errorFlag = false;
        for (; l < request.data.NonRFIDData.length; l++) {
            request.data.NonRFIDData[l]["ErrorMsg"] = errorMsgQueue[l];
            if (errorMsgQueue[l] !== "") {
                errorFlag = true;
            }
        }
        if (errorFlag) {
            LOG.info("rejecting at .", new Date());
            let copydata = JSON.parse(JSON.stringify(request.data.NonRFIDData));
            copydata = copydata.filter(el => {
                if (el["ErrorMsg"] === "") {
                    return false;
                }
                return true;
            })
            LOG.info("rejecting with: ", JSON.stringify(copydata))
            throw (JSON.stringify(copydata));
        }
    }

    async function on_NonRFID_Projection_Action(request) {
        let LOG = getLogFromRequestIfAvailable(request,`on_NonRFID_Projection_Action`);
        LOG.info("in nonRFID_Projection Action at .", new Date());
        let allSelectionResults = [];
        let changes = [];
        let allSelectionResultsarg = {};
        allSelectionResultsarg.allSelectionResults = allSelectionResults;
        fillAllSelectionResultPrefilled(request, allSelectionResultsarg)
        allSelectionResults = allSelectionResultsarg.allSelectionResults
        let jwtdetails = (jwtDecode(String(request.headers?.authorization).slice(7)));
        let allowedCMSite = []
        massUpdateLengthCheck(request);
        let keyCollection = [];
        let keyArray = ["GH_SITE", "PROGRAM", "LINE", "UPH", "STATION", "LEVEL", "GROUP_PRIORITY", "AQID", "MFR"];
        generateKeyCollection(request, keyArray, keyCollection);
        let allIDtoDelFromTable = []
        LOG.info("started making selections at .", new Date());
        LOG.info("allSelectionResults.length ", allSelectionResults.length);
        let argallSelectionResults = {};
        argallSelectionResults.allSelectionResults = allSelectionResults;
        await getAllSelection(argallSelectionResults, keyCollection,request);
        allSelectionResults = argallSelectionResults.allSelectionResults;
        LOG.info("ended making selections at .", new Date());
        LOG.info("allSelectionResults.len: ", allSelectionResults.length, " at .", new Date());
        let argallIDtoDelFromTable = {};
        argallIDtoDelFromTable.allIDtoDelFromTable = allIDtoDelFromTable;
        removeRecordsWithBlankID(argallIDtoDelFromTable, allSelectionResults)
        allIDtoDelFromTable = argallIDtoDelFromTable.allIDtoDelFromTable
        let insertQueue = [];
        let errorMsgQueue = [];
        LOG.info("Making multiMap at .", new Date());
        let map1 = {};
        fillMultimap(map1, allSelectionResults, keyArray);
        LOG.info("allSelectionResults,len: ", allSelectionResults.length)
        LOG.info("filled multiMap at .", new Date());
        LOG.info("processing loop start at .", new Date());
        let nonRFIDProjectionProcessingLoopArgs = {};
        nonRFIDProjectionProcessingLoopArgs.allowedCMSite = allowedCMSite;
        nonRFIDProjectionProcessingLoopArgs.keyArray = keyArray;
        nonRFIDProjectionProcessingLoop(request, errorMsgQueue, map1, jwtdetails, insertQueue, changes, nonRFIDProjectionProcessingLoopArgs);
        LOG.info("processing loop finish at .", new Date());
        await pushToDBandChangelog(insertQueue, allIDtoDelFromTable, changes, request, errorMsgQueue);
        appendAndSendError(request, errorMsgQueue)
        LOG.info("success msg sent at .", new Date());
    }

    function before_NonRFID_Projection_Action(request) {
        let initialHeader = (String(request.data.auth));
        if (request.data?.NonRFIDProjTable) {
            if (request.headers === undefined) request.headers = {};
            request.headers.NonRFIDProjTable = request.data.NonRFIDProjTable;
        }
        if (request.data?.auth) {
            request.headers = { authorization: String(initialHeader), ...request.headers };
            request.data = { NonRFIDData: request.data.NonRFIDData }
        }
    }

    function getKeyFieldsEquality(keyArray)
    {
        let i = 0;
        let tempQueue = [];
        for(;i<keyArray.length;i++)
        {
            if (keyArray[i]==="GROUP_PRIORITY")
            {
                tempQueue.push(`t1.GROUP_PRIORITY=t2.PO_TYPE`);
                continue;
            }
            if (keyArray[i]==="GH_SITE")
            {
                tempQueue.push(`t1.CM=(SELECT max(t3.cm) as CM from (SELECT distinct t_temp.gh_site as gh_site,t_temp.cm as cm from COM_APPLE_COA_T_COA_BOM_STRUCTURE as t_temp) as t3 where t3.gh_site=t2.gh_site)`);
                tempQueue.push(`t1.SITE=(SELECT max(t4.site) as SITE from (SELECT distinct t_temp.gh_site as gh_site,t_temp.site as site from COM_APPLE_COA_T_COA_BOM_STRUCTURE as t_temp) as t4 where t4.gh_site=t2.gh_site)`);
                continue;
            }
            tempQueue.push(`t1.${keyArray[i]}=t2.${keyArray[i]}`)
        }
        return tempQueue.join(` and `)
    }

    async function pushQPLResetToDb(changeQueue, errorMsgQueue,keyArray, request) {
        let LOG = getLogFromRequestIfAvailable(request,`pushQPLResetToDb`);
        if (changeQueue.length > 0) {
            let splGuid = cds.utils.uuid();
            changeQueue = changeQueue.map(el => {
                el.ID = cds.utils.uuid();
                el.GUID = splGuid;
                el.PO_TYPE = el.GROUP_PRIORITY;
                delete el.GROUP_PRIORITY;
                return el;
            })
            LOG.info("delete action start at .", new Date());
            let tx = hdb.tx();
            let changed = 0;
            let preChange = [];
            let dateNew;
            try {
                LOG.info("insert into temp table started at .", new Date());
                let chunkSize = 10000;
                let k = 0; // Pooja Added this line to get things updated in DB as it was skipping the records till k value
                for (; k < changeQueue.length; k += chunkSize) {
                    let insertQueue_temp = changeQueue.slice(k, k + chunkSize);
                    await tx.run(INSERT.into("COM_APPLE_COA_T_COA_TEMP").entries(insertQueue_temp));
                }
                LOG.info("insert into temp table done and selection started at .", new Date())
                try
                {
                    preChange = await cds.run(`SELECT t1.* FROM V_NONRFID_PROJECTION as t1 inner join COM_APPLE_COA_T_COA_TEMP as t2
                    on ${getKeyFieldsEquality(keyArray)}
                    where t2.guid='${splGuid}'
                    and t1.qpl_user is not null
                    `); 
                }
                catch(err){
                    LOG.info("Memory limit issue, too many records to track in changelog ", err.response?.data || err.response || err.data || err);
                }
                LOG.info("selection done at .", new Date());
                dateNew = String(new Date().toISOString());
                changed = await tx.run(`UPDATE COM_APPLE_COA_T_COA_NONRFID_PROJECTION as t1
                set t1.qpl_user=null,t1.modifiedAt='${dateNew}'
                where exists(SELECT * FROM COM_APPLE_COA_T_COA_TEMP as t2
                    where ${getKeyFieldsEquality(keyArray)} 
                    and t2.guid='${splGuid}'
                    and t1.qpl_user is not null
                    )
                `);
                await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_TEMP as t1 where t1.guid='${splGuid}'`);
                await tx.commit();
                
            }
            catch (err) {
                await tx.rollback();
                LOG.info("Error while updating in db: ", err);
                getUpdatedErrMsgQueue(errorMsgQueue);
            }
            if (changed === 0 || changeQueue.length <= 0)
            {
                LOG.info("Nothing to Update")
                throw (JSON.stringify("Nothing to Update"));
            }

            let changes = [];
            preChange.forEach(el=>{
                let new_el = JSON.parse(JSON.stringify(el));
                new_el.QPL_USER = new_el.QPL_SYSTEM_CALCULATED;
                delete new_el.QPL;
                new_el.MODIFIEDAT = dateNew;
                updateChanges(new_el, el, changes);
            })
            try {
                await update_changelog(changes, request);
            }
            catch (err) {
                LOG.info('Error while calling messagelog: ', err.response?.data || err.response || err);
            }
        }
    }

    async function on_ResetQPL(request) {
        let LOG = getLogFromRequestIfAvailable(request,`on_ResetQPL`);
        let jwtdetails = (jwtDecode(String(request.headers?.authorization).slice(7)));
        let keyArray = ["GH_SITE", "PROGRAM", "LINE", "UPH", "STATION", "LEVEL", "GROUP_PRIORITY", "AQID", "MFR"];
        let changeQueue = [];
        let errorMsgQueue = [];
        let nonRFIDProjectionProcessingLoopArgs = {};
        nonRFIDProjectionProcessingLoopArgs.keyArray = keyArray;
        nonRFIDProjectionProcessingLoopArgs.changeQueue = changeQueue;
        clearQPLProcessingLoop(request, errorMsgQueue, jwtdetails, nonRFIDProjectionProcessingLoopArgs);
        await pushQPLResetToDb(changeQueue, errorMsgQueue,keyArray, request);
        appendAndSendError(request, errorMsgQueue)
        LOG.info("success msg sent at .", new Date());
    }

    srv.on("POST", ResetQPL, async (request) => {
        let LOG = getLogFromRequestIfAvailable(request,`ResetQPL`);
        try {
            await on_ResetQPL(request);
            await cds.context.http.res.status(200).send({ msg: "Changes saved successfully" });
        }
        catch (error) {
            LOG.info("There was an error while resetting qpl: ", error);
            await cds.context.http.res.status(400).send({ msg: JSON.stringify(error) });
        }
    })


    srv.on("POST", NonRFID_Projection_Action, async (request) => {
        let LOG = getLogFromRequestIfAvailable(request,`NonRFID_Projection_Action`);
        try {
            await on_NonRFID_Projection_Action(request);
            await cds.context.http.res.status(200).send({ msg: "Changes saved successfully" });
        }
        catch (error) {
            LOG.info("There was an error while saving data: ", error);
            await cds.context.http.res.status(400).send({ msg: JSON.stringify(error) });
        }
    })

    srv.before("POST", NonRFID_Projection_Action, async (request) => {
        before_NonRFID_Projection_Action(request);
    })

    function rejectBasedOnSelectionLength(selectedRecordsToMassUpdate,request)
    {
        if (selectedRecordsToMassUpdate.length > 800000) {
            request.reject(400, "You cannot mass update more than 800000 records.")
        }
        if (selectedRecordsToMassUpdate.length <= 0) {
            request.reject(400, "You cannot mass update 0 records.")
        }
    }

    srv.on("selectAllMassUpdate", async (request) => {
        let LOG = getLogFromRequestIfAvailable(request,`selectAllMassUpdate`);
        let logid = getuuid();
        LOG.info("log_id : ", logid, " | ", "in selectAllMassUpdate at: ", new Date());
        let filters = request.data.url;
        filters = decodeURIComponent(filters);
        validate_and_reject(request,logid);
        request.data.CARRY_OVER = parseInt(request.data.CARRY_OVER);
        request.data.RFID_SCOPE = String(request.data.RFID_SCOPE).trim().toUpperCase();
        if(request.data.QPL)request.data.QPL = parseInt(request.data.QPL);

        filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' != ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
        let regex = /contains\((\w+),'(\w+)'\)/g;
        filters = filters.replace(regex, `($1 like '%$2%')`);
        regex = /substringof\('(\w+)',(\w+)\)/g;
        filters = filters.replace(regex, `($2 like '%$1%')`);
        let parsedFilters = cds.parse.expr(filters);

        let selectedRecordsToMassUpdate = await cds.run(SELECT.from("V_NONRFID_PROJECTION").where(parsedFilters));
        rejectBasedOnSelectionLength(selectedRecordsToMassUpdate,request);

        let NonRFIDProjTable = JSON.parse(JSON.stringify(selectedRecordsToMassUpdate));
        LOG.info(`sending ${selectedRecordsToMassUpdate.length} for mass update at `, new Date());

        selectedRecordsToMassUpdate.map(el => {
            el.RFID_SCOPE = ( request.data.RFID_SCOPE && request.data.RFID_SCOPE !== 'NULL')? request.data.RFID_SCOPE : el.RFID_SCOPE;
            el.DEPT = ( request.data.DEPT!==null && request.data.DEPT !== 'NULL')? request.data.DEPT : el.DEPT;
            el.CARRY_OVER = request.data.CARRY_OVER ? request.data.CARRY_OVER : el.CARRY_OVER;
            fillEl({request,el});
            return el;
        })

        try {
            let request1 = {};
            let authH = String(request.headers.authorization);
            if (authH[0] === `'`) authH = authH.slice(1);
            if (authH[authH.length - 1] === `'`) authH = authH.slice(0, authH.length - 1);
            request1.data = { NonRFIDData: selectedRecordsToMassUpdate, auth: authH, NonRFIDProjTable: NonRFIDProjTable };
            before_NonRFID_Projection_Action(request1);
            await on_NonRFID_Projection_Action(request1);
            await cds.context.http.res.status(204).send({ msg: "Changes saved successfully" });
        }
        catch (error) {
            LOG.info("There was an error while uploading: ", error);
            await cds.context.http.res.status(400).send({ msg: JSON.stringify(error) });
        }
    })

    function fillEl({request,el})
    {
        if(request.data.QPL)el.QPL = request.data.QPL;
        if(request.data.QPL===0)el.QPL = 0;
        if(request.data.CARRY_OVER===0)el.CARRY_OVER = 0;
    }

    srv.on("selectAllResetQPL", async (request) => {
        let LOG = getLogFromRequestIfAvailable(request,`selectAllResetQPL`);
        let logid = getuuid();
        LOG.info("log_id : ", logid, " | ", "in selectAllResetQPL at: ", new Date());
        let filters = request.data.url;
        
        filters = filters.replace(/ eq /g, ' = ').replace(/ ne /g, ' != ').replace(/ lt /g, ' < ').replace(/ le /g, ' <= ').replace(/ gt /g, ' > ').replace(/ ge /g, ' >= ');
        let regex = /contains\((\w+),'(\w+)'\)/g;
        filters = filters.replace(regex, `($1 like '%$2%')`);
        regex = /substringof\('(\w+)',(\w+)\)/g;
        filters = filters.replace(regex, `($2 like '%$1%')`);
        let parsedFilters = cds.parse.expr(filters);

        let selectedRecordsToMassUpdate = await cds.run(SELECT.from("V_NONRFID_PROJECTION").where(parsedFilters));
        if (selectedRecordsToMassUpdate.length > 800000) {
            request.reject(400, "You cannot mass update more than 800000 records.")
        }
        if (selectedRecordsToMassUpdate.length <= 0) {
            request.reject(400, "You cannot mass update 0 records.")
        }

        let NonRFIDProjTable = JSON.parse(JSON.stringify(selectedRecordsToMassUpdate));
        LOG.info(`sending ${selectedRecordsToMassUpdate.length} for mass update at `, new Date());

       
        try {
            let request1 = {};
            let authH = String(request.headers.authorization);
            if (authH[0] === `'`) authH = authH.slice(1);
            if (authH[authH.length - 1] === `'`) authH = authH.slice(0, authH.length - 1);
            request1.data = { NonRFIDData: selectedRecordsToMassUpdate, auth: authH, NonRFIDProjTable: NonRFIDProjTable };
            before_NonRFID_Projection_Action(request1);
            await on_ResetQPL(request1);
            await cds.context.http.res.status(204).send({ msg: "Changes saved successfully" });
        }
        catch (error) {
            LOG.info("There was an error while uploading: ", error);
            await cds.context.http.res.status(400).send({ msg: JSON.stringify(error) });
        }
    })

    function validate_and_reject(request, logid) {
        let LOG = getLogFromRequestIfAvailable(request,`selectAllResetQPL`);
        // To allow any one editable field to be updated via mass update
        if (request.data.CARRY_OVER && isNaN(parseInt(request.data.CARRY_OVER))) {
            LOG.info("log_id : ", logid, " | ", "Entered CARRY_OVER is invalid, it must be an integer");
            request.reject(400, `Entered CARRY_OVER is invalid, it must be an integer`);
        }
        // To allow any one editable field to be updated via mass update
        if ((request.data.RFID_SCOPE)&&(request.data.RFID_SCOPE && ( String(request.data.RFID_SCOPE).trim().length > 1 || !(String(request.data.RFID_SCOPE).trim().toUpperCase() === 'Y' || String(request.data.RFID_SCOPE).trim().toUpperCase() === 'N')) )){
            LOG.info("log_id : ", logid, " | ", "RFID SCOPE must be either Y or N");// Corrected the Error msg
            request.reject(400, `RFID SCOPE must be either Y or N`); // Corrected the Error msg
        }
        // To allow any one editable field to be updated via mass update
        if (request.data.QPL && isNaN(parseInt(request.data.QPL))) {
            LOG.info("log_id : ", logid, " | ", "Entered QPL is invalid, it must be an integer");
            request.reject(400, `Entered QPL is invalid, it must be an integer`); // Corrected the Error msg
        }
    }

    // added to to Export uniq records gh_site,program,aqid from ui

    srv.before('READ', "Projection_Export", async (request) => {
        removeIDFromOrderBy(request);
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributes(jwtdetails, request);
        allowedAttributes['ProjectionTableReadOnly'] = merge(allowedAttributes['ProjectionTableReadOnly'], allowedAttributes['ProjectionTableModify'])
        let filterString = getFilterString(allowedAttributes['ProjectionTableReadOnly'])
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
    })

    srv.on("READ", "Projection_Export", async(request, data) => {
        let tx = hdb.tx();
        let top = request.query.SELECT.limit.rows.val;
        let skip  = request.query.SELECT.limit.offset.val;
        let totalCount  = await tx.run(SELECT.from(request.query.SELECT.from.ref[0]).columns('count( distinct GH_SITE,AQID,PROGRAM) as cnt' ).where(request.query.SELECT.where));
        let result  = await tx.run(SELECT.distinct.from(request.query.SELECT.from.ref[0]).columns('GH_SITE','AQID','PROGRAM').where(request.query.SELECT.where).groupBy('GH_SITE','AQID','PROGRAM').limit(top,skip));
        request.results = result;
        request.results['$count'] = totalCount;
        
    })


});  
