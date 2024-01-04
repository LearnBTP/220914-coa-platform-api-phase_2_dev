'use strict';
const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");

module.exports = cds.service.impl(async (srv) => {
    const {
        BomStructure,
    } = srv.entities; 

    let hdb = await cds.connect.to("db");
    let glb_auth;

    // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
    // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
    srv.before('READ', "RfidSimu", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In READ RfidSimu'});
        LOG.info(uuid + "in before Read RfidSimu");
        await validateGET(request, 'GHSITE', uuid);
    })

    srv.before('READ', "NonRfidSimu", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In READ NonRfidSimu'});
        LOG.info(uuid + "in before Read NonRfidSimu");
        await validateGET(request, 'GH_SITE', uuid);
    })

    srv.before('READ', "COSimu", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In READ COSimu'});
        LOG.info(uuid + "in before Read COSimu");
        await validateGET(request, 'FROM_GHSITE', uuid);
    })

    srv.before('READ', "SimulationHeader", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In READ SimulationHeader'});
        LOG.info(uuid + "in before Read SimulationHeader");
        await validateGET(request, 'FROM_GHSITE', uuid);
    })

    srv.before('READ', "ViewSimulation", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In READ ViewSimulation'});
        LOG.info(uuid + "in before ViewSimulation validation");
        await validateGET(request, 'FROM_GHSITE', uuid);
    })
    

    async function validateGET(request,term, uuid)
    {
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributes(jwtdetails, request);
        let BOM_CM_Site_Table_ghsite_map = await cds.run(`SELECT DISTINCT CM,SITE,GH_SITE from COM_APPLE_COA_T_COA_BOM_STRUCTURE where CM!=''`);
        allowedAttributes['LineSimulationReadOnly'] = merge(allowedAttributes['LineSimulationReadOnly'], allowedAttributes['LineSimulationModify'])
        let filterString = getFilterStringOnGHSite(allowedAttributes['LineSimulationReadOnly'],BOM_CM_Site_Table_ghsite_map,term)
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

    function buildTmpArray(key,table,tmparr)
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

    function getFilterStringOnGHSite(obj, table, term) {
        let tmparr = {};
        if (obj[`$unrestricted-$unrestricted`] !== undefined) return '';
        Object.keys(obj).forEach(key => buildTmpArray(key,table,tmparr))
        if (Object.keys(tmparr).length > 0) {
            let strArray = [];
            Object.keys(tmparr).forEach(el=>{
                strArray.push(`(${term}='${el}')`)
            })
            console.log("str: ", `(${(strArray.join(' or '))})`);
            return `(${(strArray.join(' or '))})`
        }
        else {
            return (`(${term}='NULL')`)
        }
    }

    srv.before('SimulationData', async (request) => {
        let curr = request.data;
        let BOM_CM_Site_Table = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('CM as CM', 'SITE as SITE', 'GH_SITE as GH_SITE'));
        let BOM_Program_Table = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('PROGRAM as PROGRAM'));
        let Line_ID_Table = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_RFID_ANNOTATION").columns('LINEID as LINEID'));



        let responseIndex = BOM_CM_Site_Table.findIndex(el => findResponseIndex(el, curr))
        if (responseIndex >= 0) {
            curr.To_CM = BOM_CM_Site_Table[responseIndex].CM;
            curr.To_Site = BOM_CM_Site_Table[responseIndex].SITE;

        }
        else {
            request.reject(400, { "MSG": "TO_GHSITE is invalid" })
        }



        responseIndex = BOM_CM_Site_Table.findIndex(el => findResponseIndex(el, curr))
        if (responseIndex >= 0) {
            curr.From_CM = BOM_CM_Site_Table[responseIndex].CM;
            curr.From_Site = BOM_CM_Site_Table[responseIndex].SITE;

        }
        else {
            request.reject(400, { "MSG": "From_GHSITE is invalid" })
        }

        responseIndex = Line_ID_Table.findIndex(el => findResponseIndexLineId(el, curr))
        if (responseIndex >= 0) {
            curr.LINEID = Line_ID_Table[responseIndex].LINEID;

        }

        else {
            request.reject(400, { "MSG": "LINEID is invalid" })
        }



        responseIndex = BOM_Program_Table.findIndex(el => findResponseIndexProgram(el, curr))
        if (responseIndex >= 0) {
            curr.Program = BOM_Program_Table[responseIndex].Program;

        }

        else {
            request.reject(400, { "MSG": "Program is invalid" })
        }


        responseIndex = BOM_Program_Table.findIndex(el => findResponseIndexToProgram(el, curr))
        if (responseIndex >= 0) {
            curr.To_Program = BOM_Program_Table[responseIndex].To_Program;

        }

        else {
            request.reject(400, { "MSG": "To Program is invalid" })
        }


    })
 

    srv.before('POST', 'SimulationHeader', async (request) => { 
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In SimulationHeader - Line Simulation'})
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedCMSite = getAllowedAttributes(jwtdetails, request);
        postProcessAllowedCMSite(allowedCMSite);
        

        



        let curr = request.data;



        let BOM_From_GHSite = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('GH_SITE as GH_SITE','CM as CM','SITE as SITE').where({GH_SITE: request.data.From_GHSite}));
        let BOM_To_GHSite = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('GH_SITE as GH_SITE','CM as CM','SITE as SITE').where({GH_SITE: request.data.To_GHSite}));

        let BOM_From_Program = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('PROGRAM as PROGRAM').where({PROGRAM: request.data.Program}));

        let BOM_To_Program = await cds.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_BOM_STRUCTURE").columns('PROGRAM as PROGRAM').where({PROGRAM: request.data.To_Program}));

        let Line_ID_Table = await cds.run(SELECT.distinct.from("V_RFIDDETAILS").columns('LINEID as LINEID').where({LINEID: request.data.Line_ID, ZALDR_SITE: request.data.From_GHSite, CARRYOVEROLDPROGRAM: request.data.Program}));
        Line_ID_Table = [...Line_ID_Table,...await cds.run(SELECT.distinct.from("V_NONRFID_TT").columns('LINE_ID as LINEID').where({LINE_ID: request.data.Line_ID, GH_SITE: request.data.From_GHSite, PROGRAM: request.data.Program}))]

        let responseIndex = BOM_From_GHSite.findIndex(el => findResponseIndex(el, curr))
        if (responseIndex >= 0) {
            request.data.CM = BOM_From_GHSite[responseIndex].CM;
            request.data.Site = BOM_From_GHSite[responseIndex].SITE;

        }
        else {
            curr.ErrorMsg = "Invalid From GHSite";
        }



        responseIndex = BOM_To_GHSite.findIndex(el => findResponseIndexToGHSite(el, curr))
        if (responseIndex >= 0) {
            request.data.To_CM = BOM_To_GHSite[responseIndex].CM;
            request.data.To_Site = BOM_To_GHSite[responseIndex].SITE;

        }
        else {
            if(curr.ErrorMsg){
                curr.ErrorMsg = curr.ErrorMsg +  " and Invalid To GHSite";
            }else{
                curr.ErrorMsg = "Invalid To GHSite";
            }
        }

        curr = validateBeforeHeaderSave(BOM_From_Program,BOM_To_Program,Line_ID_Table,curr,request);


        if (curr.ErrorMsg) {
            request.reject(400, JSON.stringify(curr));
        }


    
            let currRequest = request.data;
            if (allowedCMSite[`LineSimulationModify`].findIndex(el => compareCMSite(el, currRequest.CM, currRequest.Site)) < 0) {
                console.log(`this record has ${currRequest.CM}, ${currRequest.Site} while user has access to `, allowedCMSite[`LineSimulationModify`])
                console.log("User does not have access to modify this CM-Site data");
                LOG.info(`this record has ${currRequest.CM}, ${currRequest.Site} while user has access to `, allowedCMSite[`LineSimulationModify`])
                LOG.info(`User does not have access to modify this CM-Site data`);
                currRequest.ErrorMsg = "User does not have access to modify this CM-Site data";
                request.reject(400, JSON.stringify(currRequest));
            }



    })

    srv.on("OnSimulate", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In OnSimulate - Line Simulation'})
        const tx = hdb.tx();
        let simulationName = request.data.simulationName;
        cds.context.http.res.status(204).send({msg : "Processing started"});
        try{
        await cds.run(UPDATE("COM_APPLE_COA_T_COA_SIMULATION").where({Simulation_name: simulationName}).set({Status: "InProgress"}));  
        await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SIMU_RFID").columns('simulation_name as simulation_name').where({  
        })).then(async (response) => {
            if (response.length > 1) {
                await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMU_RFID where simulation_name='${simulationName}'`)
            }
        });


        await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SIMU_NONRFID").columns('simulation_name as simulation_name').where({  
        })).then(async (response) => {
            if (response.length > 1) {
                await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMU_NONRFID where simulation_name='${simulationName}'`)
            }
        });

        await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SIMU_CO").columns('simulation_name as simulation_name').where({  
        })).then(async (response) => {
            if (response.length > 1) {
                await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMU_CO where simulation_name='${simulationName}'`)
            }
        });
        
        
        await tx.run(`INSERT INTO COM_APPLE_COA_T_COA_SIMU_RFID (
            SIMULATION_NAME,GHSITE,TO_CM,TO_SITE,TO_GHSITE,TO_PROGRAM,TO_BUSINESS_GRP,RAW_AQID,MAPPED_AQID,SHORT_NAME,SERIAL_NUMBER,ASSET_OWN,
            EQ_NAME,AREA,CM_DEPT,LOB_NAME,STATUS,CO_AQID,CO_EQ,CO_PROGRAM,LINE_ID,LINE_TYPE,UPH,CM,SITE,CM_PROGRAM,TRANSFER_FLAG,RFID,AQID,MATCH_QTY,MISMATCH_QTY,MATCH_STATUS
        )
        (SELECT 
            SIMULATION_NAME,GHSITE,TO_CM,TO_SITE,TO_GHSITE,TO_PROGRAM,TO_BUSINESS_GRP,RAW_AQID,MAPPED_AQID,SHORT_NAME,SERIAL_NUMBER,ASSET_OWN,
            EQ_NAME,AREA,CM_DEPT,LOB_NAME,STATUS,CO_AQID,CO_EQ,CO_PROGRAM,LINE_ID,LINE_TYPE,UPH,CM,SITE,CM_PROGRAM,TRANSFER_FLAG,RFID,AQID,MATCH_QTY,MISMATCH_QTY,MATCH_STATUS
            from V_SIMU_RFID where SIMULATION_NAME='${simulationName}')
        `);
        
        await tx.run(`INSERT INTO COM_APPLE_COA_T_COA_SIMU_NONRFID (
            SIMULATION_NAME,GH_SITE,CM,SITE,PROGRAM,AQID,MAPPED_AQID,DEPT,STATION,GROUP_PRIORITY,SCOPE,LINE_TYPE,UPH,ALT_STATION,RFID_SCOPE,GROUP_ID,
            LINE_PRIORITY,EQUIPMENT_TYPE,EQUIPMENT_NAME,CONFLEVEL,MFR,LINE_ID,PROJECTED_QTY,TRANSFER_QTY,SPLIT,TO_GHSITE,TO_PROGRAM,TO_BUSINESS_GRP,
            TRANSFER_FLAG,COMMENTS,STATUS,SEQUENCE_NO,SYNC_STATUS,SYNC_ON_DT,SYNC_BY_NAME,SUBMIT_DT,REVIEW_DATE,REVIEW_BY,MODIFY_DATE,MODIFIEDBY_NAME,
            SYNC_BY_EMAIL,SUBMIT_BY_EMAIL,REVIEWED_BY_MAIL,MODIFIEDBY_MAIL,SYNC_BY,SUBMIT_BY,REVIEWED_BY,MODIFIED_BY,TO_CM,TO_SITE,FROM_SAP_CM_SITE,TO_SAP_CM_SITE,MATCH_QTY,MISMATCH_QTY,MATCH_STATUS
        )
        (SELECT SIMULATION_NAME,GH_SITE,CM,SITE,PROGRAM,AQID,MAPPED_AQID,DEPT,STATION,GROUP_PRIORITY,SCOPE,LINE_TYPE,UPH,ALT_STATION,RFID_SCOPE,GROUP_ID,
            LINE_PRIORITY,EQUIPMENT_TYPE,EQUIPMENT_NAME,CONFLEVEL,MFR,LINE_ID,PROJECTED_QTY,TRANSFER_QTY,SPLIT,TO_GHSITE,TO_PROGRAM,TO_BUSINESS_GRP,
            TRANSFER_FLAG,COMMENTS,STATUS,SEQUENCE_NO,SYNC_STATUS,SYNC_ON_DT,SYNC_BY_NAME,SUBMIT_DT,REVIEW_DATE,REVIEW_BY,MODIFY_DATE,MODIFIEDBY_NAME,
            SYNC_BY_EMAIL,SUBMIT_BY_EMAIL,REVIEWED_BY_MAIL,MODIFIEDBY_MAIL,SYNC_BY,SUBMIT_BY,REVIEWED_BY,MODIFIED_BY,TO_CM,TO_SITE,FROM_SAP_CM_SITE,TO_SAP_CM_SITE,MATCH_QTY,MISMATCH_QTY,MATCH_STATUS
            
            FROM (SELECT 
            *,
            Row_Number() over(partition by SIMULATION_NAME,GH_SITE,CM,SITE,PROGRAM,AQID,MAPPED_AQID,STATION,GROUP_PRIORITY,SCOPE,LINE_TYPE,UPH,MFR,LINE_ID, SEQUENCE_NO ) as rn
            from V_SIMU_NONRFID where SIMULATION_NAME='${simulationName}') where rn = 1)        
        `)

        await tx.run(`INSERT INTO COM_APPLE_COA_T_COA_SIMU_CO (
                SIMULATION_NAME,FROM_GHSITE,FROM_PRODUCT,FROM_BUSINESS_GRP,TO_PRODUCT,TO_SITE,TO_BUSINESS_GRP,APPLE_ID,CO_TYPE,QUANTITY,MATCH_QTY,MISMATCH_QTY,MATCH_STATUS
        )
		(SELECT SIMULATION_NAME,FROM_GHSITE,FROM_PRODUCT,FROM_BUSINESS_GRP,TO_PRODUCT,TO_SITE,TO_BUSINESS_GRP,APPLE_ID,CO_TYPE,QUANTITY,MATCH_QTY,MISMATCH_QTY,MATCH_STATUS
             from V_SIMU_RFID_CO where simulation_name='${simulationName}')
        `)
        await cds.run(UPDATE("COM_APPLE_COA_T_COA_SIMULATION").where({Simulation_name: simulationName}).set({Status: "Completed"}));  
        await tx.commit();
        
        
            
        }
        catch (err) {
            await cds.run(UPDATE("COM_APPLE_COA_T_COA_SIMULATION").where({Simulation_name: simulationName}).set({Status: "Error"}));  
            await tx.rollback();
            let error = (err.response?.data || err.response || err.data || err)
            LOG.info(uuid + `Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.on("DeleteSimulation", async (request) => 
    {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In DeleteSimulation - Line Simulation'})
        const tx = hdb.tx();
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let simulationName = request.data.simulationName;
        LOG.info(uuid + `Deleting simu-name='${simulationName}' and createdBy='${jwtdetails.user_name}'`);
        let isAllowedChk = await cds.run(`SELECT TOP 1 * from COM_APPLE_COA_T_COA_SIMULATION_H where simulation_name='${simulationName}' and createdBy='${jwtdetails.user_name}'`)
        if (isAllowedChk.length<=0)
            request.reject(400, "Only user creating the simulation has privelege to delete it")
        LOG.info(uuid+"We found isAllowedChk as something: ", isAllowedChk[0]);
        try{
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMU_RFID where simulation_name='${simulationName}'`)
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMU_NONRFID where simulation_name='${simulationName}'`)
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMU_CO where simulation_name='${simulationName}'`)
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMULATION_H where simulation_name='${simulationName}'`)
            await tx.run(`DELETE FROM COM_APPLE_COA_T_COA_SIMULATION where simulation_name='${simulationName}'`)
            await tx.commit();
        }
        catch(err)
        {
            await tx.rollback()
            let error = (err.response?.data || err.response || err.data || err)
            LOG.info(uuid + `Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.on("BeforeSimulateValidation", async (request) => {


        let From_GHSite = '';
        let Program = '';
        let data;
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getAllowedAttributes(jwtdetails, request);
        let BOM_CM_Site_Table_ghsite_map = await cds.run(`SELECT DISTINCT CM,SITE,GH_SITE from COM_APPLE_COA_T_COA_BOM_STRUCTURE where CM!=''`);
        allowedAttributes['LineSimulationReadOnly'] = merge(allowedAttributes['LineSimulationReadOnly'], allowedAttributes['LineSimulationModify'])
        let filterString = getFilterStringOnGHSite(allowedAttributes['LineSimulationReadOnly'],BOM_CM_Site_Table_ghsite_map,'ZALDR_SITE')
        let filterString2 = getFilterStringOnGHSite(allowedAttributes['LineSimulationReadOnly'],BOM_CM_Site_Table_ghsite_map,'GH_SITE')
        let addString = ` and (${filterString})`;
        let addString2 = ` and (${filterString2})`;
        if (filterString==='')addString = '';
        if (filterString2==='')addString2 = '';
        if(request.data.From_GHSite && request.data.Program){

        request.data.From_GHSite.forEach(element => {
            if(From_GHSite === ''){
                From_GHSite = `'${String(From_GHSite)}'`
            }else{
                From_GHSite = From_GHSite + ',' + `'${String(element)}'`
            }
        });

        request.data.Program.forEach(element => {
            if(Program === ''){
                Program = `'${String(Program)}'`
            }else{
                Program = Program + ',' + `'${String(element)}'`
            }
        });

        
        data = await cds.run(`(SELECT distinct lineid as lineid,zaldr_site as gh_site, carryoveroldprogram as carryoveroldprogram
            FROM V_RFIDDETAILS
            where zaldr_site in (${From_GHSite}) and carryoveroldprogram in (${Program}) and lineid!='' and lineid is not null ${addString})
            
            union
            
            (SELECT distinct line_id as lineid, gh_site as gh_site, program as carryoveroldprogram
            FROM V_NONRFID_TT
            where GH_SITE in (${From_GHSite}) and program in (${Program}) and line_id!='' and line_id is not null ${addString2})`);
            
        
        } else{
            data = await cds.run(`(SELECT distinct lineid as lineid,zaldr_site as gh_site, carryoveroldprogram as carryoveroldprogram
                FROM V_RFIDDETAILS
                where lineid!='' and lineid is not null ${addString})
                
                union
                
                (SELECT distinct line_id as lineid, gh_site as gh_site, program as carryoveroldprogram
                FROM V_NONRFID_TT
                where line_id!='' and line_id is not null ${addString2})`);
        }
        request._.res.send({ msg: data });


    });

    srv.on("SimulationData", async () => {
        let simulationData = [];


        const tx = hdb.tx();
        simulationData = await tx.run(SELECT.distinct.from("COM_APPLE_COA_T_COA_SIMULATION"));

        return simulationData;

    })

    srv.before("DropDownHelp", async (request) => {
        let guid = getuuid(request);
        request.req.params["guid"] = guid;

    });

    srv.on("GET", "DropDownHelp", async (request) => {
        const uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In GET DropDownHelp - Line Simulation'});
        let guid = request.req.params["guid"];
        try {
            const dropdown_array = await getDropDownArray(request);
            request.results = dropdown_array;
        } catch (error) {
            LOG.error(uuid + `COA - ${guid} - Error: ${error}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    async function getDropDownArray(request) {
        let search;
        let result_array = [];
        if (request._query.$search) {
            search = request._query.$search.replace(/"/g, ``);
        }
        const change = request.query.SELECT.columns[0].ref[0];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        const allowedattributes = jwtdetails['xs.user.attributes'];
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        switch (change) {
            case 'GH_Site':

                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'Site':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'CM':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'Program':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'To_CM':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'To_Site':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'To_Program':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'To_GH_Site':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            case 'LineId':
                result_array = await fetchdata(allowedattributes, change, search, "COM_APPLE_COA_T_COA_RFID_ANNOTATION", top, skip);
                break;
            case 'To_Business_Grp':
                result_array = await fetchdata(allowedattributes, change, search, BomStructure, top, skip);
                break;
            default:
                break;
        }
        return result_array;
    }

    async function fetchdata(allowedattributes, change, search, db, top, skip) {
        let dropdown_array = [];
        let allowed_cmsite = [];
        let whereclause = "";
        allowed_cmsite = get_cmsite(allowedattributes);
        whereclause = build_filter(allowed_cmsite, whereclause, allowedattributes);
        if (search) {
            let regex = /\*+/g;
            search = search.replace(regex, `%`);
            regex = /_/g
            search = search.replace(regex, `\\_`);
            whereclause = whereclause ? `((${whereclause}) and (${change} like '%${search}%' escape '\\'))` : `(${change} like '%${search}%' escape '\\')`;
        }
        if (whereclause) {
            let parsedFilters = cds.parse.expr(`(${whereclause})`);
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${change}`).where(parsedFilters).limit(top, skip)
            );
        } else {
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${change}`).limit(top, skip)
            );
        }
        return dropdown_array;
    }

    function get_cmsite(allowedattributes) {
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
        return allowed_cmsite;
    }

    function getuuid(request) {
        return request.headers['x-correlation-id'];
    }

    function build_filter(allowed_cmsite, filters, allowedattributes) {
        let cm_site_filter;

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

        return filters;
    }

    function build_cm_site_filter(allowed, field1, field2, cm_site_filter) {

        return cm_site_filter;
    }

    function findResponseIndex(el, curr) {
        if (el.GH_SITE === curr.From_GHSite) {
            return true;
        }
        return false;
    }

    function findResponseIndexToGHSite(el, curr) {
        if (el.GH_SITE === curr.To_GHSite) {
            return true;
        }
        return false;
    }

    function findResponseIndexLineId(el, curr) {
        if (el.LINEID === curr.Line_ID) {
            return true;
        }
        return false;
    }

    function findResponseIndexProgram(el, curr) {
        if (el.PROGRAM === curr.Program) {
            return true;
        }
        return false;
    }

    function findResponseIndexToProgram(el, curr) {
        if (el.PROGRAM === curr.To_Program) {
            return true;
        }
        return false;
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

    function getAllowedAttributes(jwtdetails, request) {
        let uuid = getuuid(request);
        const LOG = cds.log(uuid,{label:'In getAllowedAttributes - Line Simulation'});
        const RoleNames = jwtdetails['xs.system.attributes'];
        let ScopesRelevantToThisApp = [`LineSimulationModify`, `LineSimulationReadOnly`]
        let allowedattributes = {};
        ScopesRelevantToThisApp.forEach((scope) => {
            if (allowedattributes[scope] === undefined) allowedattributes[scope] = {}
        })
        try {
            let srvCred = {};
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
            addToAllowedAttributes(ScopesRelevantToThisApp,RoleNames,allowedattributes,srvCred)//,usrScope)
            

        }
        catch (err) {
            LOG.error(uuid + "Unable to load coa-authorization: ", err.response?.data || err.response || err);
            request.reject(400, "Unable to load coa-authorization");
        }
        return allowedattributes;



    }

    function augmentArray(obj, arr) {
        for (let i = 0; i < arr.length; i++)augment(obj, arr[i]);
    }


    function augment(obj, term) {
        if (obj[term] === undefined) obj[term] = term;
    }

    function merge(obj1, obj2) {
        return ({ ...obj1, ...obj2 });
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

    function compareCMSite(el, rCM, rSite) {
        if (el.CM !== '$unrestricted' && el.CM !== rCM) {
            return false;
        }
        if (el.Site !== '$unrestricted' && el.Site !== rSite) {
            return false;
        }
        return true;
    }

    function convertToArray(obj) {
        return Object.keys(obj);
    }

    function validateBeforeHeaderSave(BOM_From_Program,BOM_To_Program,Line_ID_Table,curr,request){

        let responseIndex = 0; 

        responseIndex = BOM_From_Program.findIndex(el => findResponseIndexProgram(el, curr))
        if (responseIndex >= 0) {
            request.data.Program = BOM_From_Program[responseIndex].PROGRAM;

        }

        else {
            if(curr.ErrorMsg){
                curr.ErrorMsg = curr.ErrorMsg +  " and Invalid Program";
            } else{
                curr.ErrorMsg = "Invalid Program";
            }
        }


        responseIndex = BOM_To_Program.findIndex(el => findResponseIndexToProgram(el, curr))
        if (responseIndex >= 0) {
            request.data.To_Program = BOM_To_Program[responseIndex].PROGRAM;

        }

        else {
            if(curr.ErrorMsg){
            curr.ErrorMsg = curr.ErrorMsg +  " and Invalid To Program";
            }else{
                curr.ErrorMsg = "Invalid To Program";
            }
        }

        responseIndex = Line_ID_Table.findIndex(el => findResponseIndexLineId(el, curr))
        if (responseIndex >= 0) {
            request.data.LINEID = Line_ID_Table[responseIndex].LINEID;

        }

        else {
            if(curr.ErrorMsg){
                curr.ErrorMsg = curr.ErrorMsg +  " and Invalid LineId";
            }else{
                curr.ErrorMsg = "Invalid LineId";
            }
        }

        return curr;
    }

});







