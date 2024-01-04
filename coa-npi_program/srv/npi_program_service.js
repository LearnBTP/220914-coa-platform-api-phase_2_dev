'use strict';
const cds = require("@sap/cds");
const jwtDecode = require("jwt-decode");

module.exports = cds.service.impl(async (srv) => {
    const
        {
            CarryoverNPIProgram
        } = srv.entities;
    let before_data = [];
    srv.before("GET", "F4help", async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request),{label:'COA NPI Program: F4help'});
        try {
            if (typeof (request.req.params.uuid) === "undefined") {
                const uuid = getuuid(request);
                request.req.params = { "uuid": uuid, "user": request.user.id, "LOG": LOG};
            }
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

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

    async function getDropDownArray(request) {
        let search;
        let result_array = [];
        if (request._query.$search) {
            search = request._query.$search.replace(/"/g, ``);
        }
        const change = request.query.SELECT.columns[0].ref[0];
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        top = top.includes("infinity") ? 1000 : top;
        switch (change) {
            case 'Program':
                result_array = await fetchdata(change, search, CarryoverNPIProgram, top, skip);
                break;
            case 'Program_Description':
                result_array = await fetchdata(change, search, CarryoverNPIProgram, top, skip);
                break;
            default:
                break;
        }
        return result_array;
    }

    async function fetchdata(change, search, db, top, skip) {
        let dropdown_array = [];
        let whereclause = "";
        if(search){
            let regex = /\*+/g;
            search = search.replace(regex, `%`);
            regex = /_/g
            search = search.replace(regex, `\\_`);
            whereclause =  `(${change} like '%${search}%' escape '\\')`;
        }
        if(whereclause){
            whereclause = `(${whereclause}) and (${change} is not null) and (${change}<>'')`;
            let parsedFilters = cds.parse.expr(`(${whereclause})`);
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${change}`).where(parsedFilters).limit(top, skip)
                );
        }else{
            dropdown_array = await cds.run(SELECT.distinct.from(db).columns(`${change} as ${change}`).where(`(${change} is not null) and not(${change}='')`).limit(top, skip)
                );
        }
        return dropdown_array;
    }

    function getuuid(request) {
        if(request && request?.headers['x-correlationid']){
            return request.headers['x-correlationid'];
        }else{
            return cds.utils.uuid();
        }
    }

    function npi_program_data(request) {
        let record = [];
        if (request) {
            record.push("");
            record.push("");
            record.push("");
            record.push("");
            record.push(request.Program);
            record.push(request.Program_Description);
            record.push(request.modifiedBy_Name);
            record.push(request.modifiedBy_mail);
            record.push(request.createdBy_Name);
            record.push(request.createdBy_mail);
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
        }
        return record;
    }

    function update_changelog(TableName, changelog_data_a, request, LOG) {
        LOG.info(`Call Changelog service to update the changes to Changelog table`);
        try{
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
    } catch (error) {
        LOG.info(`Error: ${error}`);
    }
    }

    srv.after("POST",CarryoverNPIProgram, async (request,body) => {
        const LOG = body.req.params.LOG;
        try {
        LOG.info(`In after Event of POST action for Carryover NPI Program `);
        let old_record = [];
        let new_record = [];
        let changelog_data_a = [];
        let changelog_data = {}; 
        changelog_data.new_records = [];
        changelog_data.old_records = [];
        changelog_data.action = "INSERT";
        old_record = npi_program_data("");
        changelog_data.old_records.push(old_record);
        new_record = npi_program_data(request);
        changelog_data.new_records.push(new_record);
        changelog_data_a.push(changelog_data);
        update_changelog("T_COA_NPI_PROGRAM", changelog_data_a, body, LOG);
         } catch (error) {
            LOG.info(`Error: ${error}`);
            return "Error: " + JSON.stringify(error);
        }
     });

     srv.before("POST", CarryoverNPIProgram, async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request),{label:'COA NPI Program: POST CarryoverNPIProgram'});
        try {
            if(typeof(request.req.params.uuid) === "undefined"){
                const uuid = getuuid(request);
                request.req.params = {"uuid" : uuid, "user": request.user.id, "LOG": LOG};
               }
               LOG.info(`In before event of POST action for NPI Program `);
            await cds.run(SELECT.from(CarryoverNPIProgram).columns('Program as Program').where({
                Program: request.data.Program
            })).then( (response) => {
                if (response.length >= 1) {
                    let record = {};
                    record.Program = request.data.Program;
                    record.Program_Description = request.data.Program_Description;
                    record.Error = "Duplicate Entry" ;
                    request.reject(500, JSON.stringify(record));
                }
                const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
                request.data.createdBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                request.data.createdBy_mail = jwtdetails.email;
                request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
                request.data.modifiedBy_mail = jwtdetails.email;
            });
        } catch (error) {
            LOG.info(`Error: ${JSON.stringify(error)}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    srv.before("PUT",CarryoverNPIProgram, async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(getuuid(request),{label:'COA NPI Program: PUT CarryoverNPIProgram'});
        try{
           if(typeof(request.req.params.uuid) === "undefined"){
               const uuid = getuuid(request);
               request.req.params = {"uuid" : uuid, "user": request.user.id,"LOG" : LOG};
              } 
            LOG.info(`In before event of PUT action for Carryover NPI Program `);  
           const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
           request.data.modifiedBy_Name = `${jwtdetails.given_name} ${jwtdetails.family_name}`;
           request.data.modifiedBy_mail = jwtdetails.email;
           await cds.run(SELECT.from(CarryoverNPIProgram).where({
               Program: request.data.Program
           })).then(async (res) => {
               if (res.length > 0) {
                   res[0].uuid = request.req.params.uuid;
                   before_data.push(res[0]);
               }
           });
       }
   catch(error){
       LOG.info(`Error: ${error}`);
       return "Error: " + JSON.stringify(error);  
   }
   });


    srv.after("PUT",CarryoverNPIProgram, async (request, body) => {
        const LOG = body.req.params.LOG;
        try{
           LOG.info(`In after Event of PUT action for Carryover NPI Program `);
           if (before_data.length > 0) {
           await cds.run(SELECT.from(CarryoverNPIProgram).where({
               Program: request.Program
           })).then(async (response) => {
           if (response.length > 0) {
            let old_record = [];
            let new_record = [];
            let changelog_data_a = [];
            let changelog_data = {};
            changelog_data.new_records = [];
            changelog_data.old_records = [];
               changelog_data.action = "UPDATE";
               const index = before_data.findIndex(e1 => e1.Program === request.Program &&  e1.uuid === body.req.params.uuid);
               if(index >= 0){
               old_record = npi_program_data(before_data[index]);
               changelog_data.old_records.push(old_record);
               before_data.splice(index,1);
               new_record = npi_program_data(response[0]);
               changelog_data.new_records.push(new_record);
               changelog_data_a.push(changelog_data);
               update_changelog("T_COA_NPI_PROGRAM", changelog_data_a, body, LOG);
               }
       }
   });
       } }
       catch(error){
           LOG.info(`Error: ${error}`);
           return "Error: " + JSON.stringify(error);  
       }
    });
}
)
