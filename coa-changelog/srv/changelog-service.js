'use strict';
const cds = require('@sap/cds');
const jwtDecode = require('jwt-decode');
const config = {
    "MAIN_LINE": "T_COA_MAIN_LINE",
    "AQIUD_MAIN": "T_COA_AQID_MAIN",
    "LINEPLAN": "T_COA_LINEPLAN",
    "SUBLINE": "T_COA_SUBLINE",
    "RFID": "T_COA_RFID_TT",
    "ANNOTATION": "T_COA_RFID_ANNOTATION",
    "OUTPUT": "T_COA_OUTPUT",
    "USER_ATTRIBUTES": "xs.user.attributes",
    "KEY_TABLE": "V_KEY_FIELDS",
    "CONSTRAINT_KEY": "PRIMARY KEY",
    "FIELDS_TABLE": "V_VIEW_TABLES",
    "errors": {
        "NOT_ALLOWED": "User does not have permissions to access app",
        "ENITIY_EXISTS": "ENTITY_ALREADY_EXISTS",
        "INERNAL_ERROR": 500,
        "NOT_AUTHORIZED_ERROR": 400,
        "NOT_AUTHORIZED": "User doesn't have access to read Changelog Records",
        "ACCESS_ERROR": "There was error gaining access",
        "NO_ROLE_ERROR": "Access denied, There is no role to access the table",
        "ROLE_NOT_ALLOWED": "doesn't have access to modify Changelog Records"
    },
    "roles": {
        "MAINLINE_READ_ONLY": "MainLineReadOnly",
        "AQUID": "AqidModify",
        "SUBLINE": "SubLineModify",
        "RFID": "RfidOnHandTTModify",
        "MAINLINE_MODIFY": "MainLineModify",
        "ANNOTATION": "AnnotationModify",
        "OUTPUT": "COOutputModify"
    }
}

module.exports = cds.service.impl(async (srv) => {
    const
        {
            changHistory
        } = srv.entities;
    let hdb = await cds.connect.to('db');
    let glb_auth;


    /**
     * POST request to compare table data and insert or update table CHANGE_HISTORY
     */
    srv.on('compareTabels', async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(request.headers['x-correlation-id'],{label:'compareTabels'});
        try {
            let values = JSON.parse(request.data.body);
            values.forEach(async (element) => {
                const tx = hdb.tx();
                //deconstruct the request data
                const { TableName, old_records, new_records, actionType, user_data } = element;
                LOG.info(`Table name for change history is: ${TableName}`);
                const oldRecords = { ...old_records }//convert arrray to JSON object
                //function to compare old records against new records
                const dif = compare(oldRecords, new_records);
                //function to get the key and non-key columns based on table name
                const { keyColumns, new_recs } = await getTableData(TableName, dif.output, tx, LOG);
                if (keyColumns.error || keyColumns === []) {
                    LOG.info('There are no key columns found');
                    throw new Error('There are no key columns found');
                }
                const newRecords = { ...new_recs };//convert arrray to JSON object
                let keyFields = [];
                //filter to add just the column name values to the key fileds array 
                switch (actionType) {
                    case "INSERT":
                        keyFields = getkeyfields_insert(new_records, keyColumns);
                        break;
                    case "UPDATE":
                        keyFields = getkeyfields_update(newRecords, keyColumns);
                        break;
                    default:
                        break;
                }
                //call the database function to update the table
                const { statusCode, countOfQueries } = await updateDatabase(TableName, actionType, dif, keyFields, tx, user_data, LOG);
                LOG.info(`${statusCode}, Successfully updated the DB with ${countOfQueries} records`);
                console.log(`${statusCode}, Successfully updated the DB with ${countOfQueries} records`);
            });
        } catch (error) {
            //Log an error code if there are any errors thrown
            LOG.info(`ERROR in compare tables: ${error}`);
            request.reject(config.errors.INERNAL_ERROR, JSON.stringify(error));
        }
    });

    async function fetchdata(allowedAttributes, change, search, db, top, skip, field) {
        let dropdown_array = [];
        // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, SITE values on role attributes in right order.
        // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
        let whereclause = getFilterString(allowedAttributes);
        whereclause = skip_dupl_fields(whereclause);
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

    function skip_dupl_fields(whereclause) {
        let skip_filter;
        skip_filter = `( Field_Name != 'EQUIPMENT_NAME' and  Field_Name != 'EQ_NAME' and Field_Name != 'LINE_ID' and Field_Name != 'LINE_TYPE' and Field_Name != 'COMMENT' ) `;
        whereclause = whereclause ? `${whereclause} and ${skip_filter}` : skip_filter;
        return whereclause;
    }

    async function getDropDownArray(request, LOG) {
        let search;
        let result_array = [];
        if (request._query.$search) {
            search = request._query.$search.replace(/"/g, ``);
        }
        const change = request.query.SELECT.columns[0].ref[0];
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request, LOG);
        let allowed_cmsite = [];
        allowed_cmsite = merge_3(allowedAttributes['COOutputReadOnly'], allowedAttributes['COOutputModify'], allowedAttributes['ApproveCoOutput']);
        allowed_cmsite = merge_3(allowedAttributes['AnnotationReadOnly'], allowedAttributes['AnnotationModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['AqidReadOnly'], allowedAttributes['AqidModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['RfidOnHandTTReadOnly'], allowedAttributes['RfidOnHandTTModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['MainLineReadOnly'], allowedAttributes['MainLineModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['SubLineReadOnly'], allowedAttributes['SubLineModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['ProjectionTableReadOnly'], allowedAttributes['ProjectionTableModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['nonRFIDTTReadOnly'], allowedAttributes['nonRFIDTTModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['UnScannableReadOnly'], allowedAttributes['UnScannableModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['LineSimulationReadOnly'], allowedAttributes['LineSimulationModify'], allowed_cmsite);
        allowed_cmsite = merge_3(allowedAttributes['NPIProgramModify'], allowedAttributes['ApproveRfidOnHandTT'], allowed_cmsite);
        let top;
        let skip;
        top = request._queryOptions.$top;
        skip = request._queryOptions.$skip;
        if (top) {
            top = top.includes("infinity") ? 1000 : top;
        }
        result_array = await fetchdata(allowed_cmsite, change, search, changHistory, top, skip, change);
        return result_array;
    }

    srv.on("GET", "F4help", async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(request.headers['x-correlation-id'],{label:'F4help'});
        LOG.info(`COA - In On event of Get action for F4help`);
        console.log(`COA - In On event of Get action for F4help`);
        try {
            const dropdown_array = await getDropDownArray(request, LOG);
            request.results = dropdown_array;
        } catch (error) {
            LOG.info(`COA - Error: ${error}`);
            console.log(`COA - Error: ${error}`);
            return `Error: ${JSON.stringify(error)} `;
        }
    });

    /**
     * 
     * @param {*} TableName 
     * @param {*} new_recs 
     * @param {*} TX 
     * 
     * returns the key fields and non key fields
     */
    async function getTableData(TableName, new_recs, TX, LOG) {
        if (!TableName || TableName === '') {
            throw new Error('Table Name missing');
        }
        //retrieve the key fields from the SYS.INDEX_COLUMNS
        try {
            //retrive the key columns fro the requesting table
            let keyColumns = await getKeyColumns(TableName, TX, LOG);
            //loop through the new_recs and and get non key fields from SYS.TABLE_COLUMNS
            let index = 0;
            for (const i of new_recs.originalRecords) {
                let original = i;
                let fieldName = [];
                fieldName.push(await getOriginalPosition(original, TableName, TX, LOG));
                new_recs.originalRecords[index++].field = fieldName.flat();
            }
            return { keyColumns, new_recs };
        } catch (error) {
            LOG.info('Unable to reterieve table data', error);
            throw new Error('Unable to reterieve table data', error);
        }
    }
    /**
     * 
     * @param {*} original 
     * @param {*} tableName 
     * @param {*} tx 
     * iterates over the positions in the positions object and calls the function to get the nonkey field based on that position
     */
    let getOriginalPosition = async (original, tableName, tx, LOG) => {
        let fieldName = [];
        for (const j of original.position) {
            const op = j;
            const spot = op;
            const position = spot + 1
            fieldName.push(await getNonKeyFieldsFromDB(tableName, position, tx, LOG));
        }
        return fieldName.flat();
    }
    /**
     * 
     * @param {*} tableName 
     * retrieve key fields from SYS.INDEX_COLUMNS
     */
    let getKeyColumns = async (tableName, TX, LOG) => {
        const TABLE_KEYS = config.KEY_TABLE;
        const CONSTRAINT = config.CONSTRAINT_KEY;
        try {
            if (process.env.NODE_ENV === 'test') {
                return [{ COLUMN_NAME: 'CM' }, { COLUMN_NAME: 'SITE' }, { COLUMN_NAME: 'PROGRAM' }, { COLUMN_NAME: 'SUB_LINE_NAME' }];
            } else {
                return await TX.run(SELECT
                    .from(TABLE_KEYS)
                    .columns('COLUMN_NAME')
                    .where({ Table_Name: `COM_APPLE_COA_${tableName}`, Constraint: CONSTRAINT }));
            }
        } catch (error) {
            let err = error;
            LOG.info({ err, message: `Failed to retrive ${tableName} key fields` });
            throw new Error(err);
        }

    }
    /**
     * 
     * @param {*} tableName 
     * @param {*} position 
     * @param {*} TX 
     * returns the column name from SYS.TABLE_COLUMNS based on the position of the non key filed from the original payload
     */
    let getNonKeyFieldsFromDB = async (tableName, position, TX, LOG) => {
        const TABLE_FIELDS = config.FIELDS_TABLE;
        try {
            if (process.env.NODE_ENV === 'test') {
                return ['YIELD', 'COMMENT'];
            } else {
                return await TX.run(SELECT
                    .from(TABLE_FIELDS)
                    .columns('COLUMN_NAME')
                    .where({ Table_Name: `COM_APPLE_COA_${tableName}`, Position: position }))
                    .then(res => {
                        //add non key field to the new_recs
                        return res[0].COLUMN_NAME;
                    });
            }
        } catch (error) {
            LOG.info('ERROR: ', error);
            return { error, message: `Unable to retrieve non key fields for ${tableName}` };
        }

    }

    /**
     *
     * @param {*} tableName
     * @param {*} action_type
     * @param {*} data
     * @param {*} TX
     * @param {*} fields
     *
     * Returns a success message
     *
     * Returns a failure message if there are any failures
     */
    let updateDatabase = async (tableName, action_type, data, keyFields, TX, user_data, LOG) => {
        LOG.info('in populate db function');
        if (!tableName) {
            throw new Error('In update database function no table name specified');
        }
        let statusCode = 200;
        try {
            const { sql, countOfQueries } = await createQuerires(tableName, data.output, action_type, keyFields, user_data, TX, LOG);
            try{
                if(countOfQueries > 0){
                    await TX.run(sql);
                    await TX.commit();
                }
            }catch(err){
                await TX.rollback();
                LOG.info(`Error in Insertion to changelog table: ${err.message}`)
                console.log(`Error in Insertion to changelog table: ${err.message}`);
            }
            LOG.info(`Successfully updated the DB with ${countOfQueries} records `);
            return { statusCode, countOfQueries };
        } catch (error) {
            const { message, code } = error;
            if (message === config.ENITIY_EXISTS) {
                LOG.info('code', code, 'message', message);
                await TX.rollback(error);
                throw new Error(JSON.stringify({ message }));
            } else {
                LOG.info('Rolling back transaction', message);
                await TX.rollback(error);
                throw new Error({ message });
            }
        }
    }


    /**
     * 
     * @param {*} tableName 
     * @param {*} data 
     * @param {*} action_type 
     * creates the queries based on the action_type INSERT, UPDATE, DELETE
     * Pushes the queries to a an array and sends to the calling function for processing to the DB
     */
    let createQuerires = async (tableName, data, action_type, keyFields, user_data, TX, LOG) => {
        const actionType = action_type.toUpperCase();
        let insertQueries = [];
        let index = 0;
        let sql;
        let insertCount = 0;
        try{
            //loop through the original records array and build querries for each
            for (const i of data.originalRecords) {
                //inside loop que update
                const original = i;
                let insert = await getFieldValue(original, tableName, actionType, keyFields[index], user_data, TX, LOG);
                if(insert.length > 0){
                    insertQueries.push(insert);
                }
                index++;

            }
            //builds a single insert query for multiple inserts. If inserts are being lost might need to break query into multiple since only 1000 inserts are allowed on a single insert
            if(insertQueries.length > 0){
                let flatQueries = insertQueries.flat();
                insertCount = flatQueries.length;
                sql = INSERT.into(changHistory, ...insertQueries.flat());
            }
            //returns the queries for update, delete, or inseert and the count of all queries to be executed. 
            //Since all inserts are one single insert take the length of the insert query add it to the total number of queries and minus one from it to remove the the single insert query
            //countOfQueries is for logging only at this time
            return { sql, countOfQueries: insertCount };
        }catch(error){
            throw new Error('Error in createQuerires Function: ', error );
        }
    }

    let getFieldValue = async (original, tableName, actionType, keyFields, user_data, TX, LOG) => {
        //loop over the field and the value to get any arrays that length is greater than 1 and create a sql statment for each one
        let k = 0;
        let insert = [];
        let column_pos = [];
        let cm_site = {};
        try{
            if (process.env.NODE_ENV === 'test') {
                column_pos = [{ COLUMN_NAME: 'CM', POSITION: 5 }, { COLUMN_NAME: 'SITE', POSITION: 6 }, { COLUMN_NAME: 'FROM_CM', POSITION: 7 }, { COLUMN_NAME: 'TO_CM', POSITION: 8 }, { COLUMN_NAME: 'FROM_SITE', POSITION: 9 }, { COLUMN_NAME: 'TO_SITE', POSITION: 10 }];
            } else {
                column_pos = await TX.run(SELECT.distinct.from("V_VIEW_TABLES").columns('COLUMN_NAME as COLUMN_NAME', 'POSITION as POSITION').where({
                    TABLE_NAME: `COM_APPLE_COA_${tableName}`,
                    COLUMN_NAME: { in: ['CM', 'SITE', 'FROM_CM', 'FROM_SITE', 'TO_CM', 'TO_SITE'] }
                })
                );
            }
            for (let j = k; j < original.field.length && k < original.updatedFieldValue.length; j++, k++) {
                //needs to have a date specified to avoid the duplicate entry exception on insert. Once inserted the Date/Time will be based on the inserted time
                let pos = original.position[j];
                LOG.info('Date and time started', new Date());
                const field = original.field[j];
                let newValue;
                let oldValue;
                if (original.updatedFieldValue[k] !== "undefined" && original.updatedFieldValue[k] !== "NULL"
                    && original.updatedFieldValue[k] !== null) {
                    newValue = original.updatedFieldValue[k].toString();
                }
                if (original.record[pos] !== "undefined" && original.record[pos] !== "NULL"
                    && original.record[pos] !== null) {
                    oldValue = original.record[pos].toString();
                }
                cm_site = get_cmsitevalue(actionType, column_pos, original.field, original.updatedFieldValue, original.record);
                insert.push({
                    Table: tableName,
                    Key_Fields: keyFields.toString(),
                    Field_Name: field.toString(),
                    Action_Type: actionType,
                    Old_Value: oldValue,
                    New_Value: newValue,
                    modifiedBy: user_data.user,
                    createdBy: user_data.user,
                    CM: cm_site.CM,
                    Site: cm_site.Site,
                    To_CM: cm_site.To_CM,
                    To_Site: cm_site.To_Site,
                    SAP_CM_Site: `${cm_site.CM}-${cm_site.Site}`,
                    SAP_To_CM_Site: `${cm_site.To_CM}-${cm_site.To_Site}`,
                    modifiedBy_Name: user_data.name,
                    modifiedBy_mail: user_data.email,
                    createdBy_Name: user_data.name,
                    createdBy_mail: user_data.email
                });
            }
            return insert;
        }catch(error){
            throw new Error('Error in getFieldValue Function: ', error );
        }
    }

    function get_cmsitevalue(action, column_pos, field, value, record) {
        let cm_site = {};
        try{
            column_pos.forEach(element => {
                if (action === 'INSERT') {
                    cm_site = get_cmsite_insert(element, field, value, cm_site);
                } else {
                    cm_site = get_cmsite_update(element, record, cm_site);
                }
            });
            return cm_site;
        }catch(error){
            throw new Error('Error in get_cmsitevalue Function: ', error );
        }
    }

    function get_cmsite_insert(element, field, value, cm_site) {
        let index;
        if( element.COLUMN_NAME === 'CM' || element.COLUMN_NAME === 'FROM_CM' ){
            index = field.findIndex(e1 => e1 === element.COLUMN_NAME);
                if (index >= 0) {
                    cm_site.CM = get_stringvalue(value[index]);
                }
        }else if(element.COLUMN_NAME === 'SITE' || element.COLUMN_NAME === 'FROM_SITE'){
            index = field.findIndex(e1 => e1 === element.COLUMN_NAME);
                if (index >= 0) {
                    cm_site.Site = get_stringvalue(value[index]);
                }
        }else if(element.COLUMN_NAME === 'TO_CM'){
            index = field.findIndex(e1 => e1 === element.COLUMN_NAME);
                if (index >= 0) {
                    cm_site.To_CM = get_stringvalue(value[index]);
                }
        }else if(element.COLUMN_NAME === 'TO_SITE'){
            index = field.findIndex(e1 => e1 === element.COLUMN_NAME);
                if (index >= 0) {
                    cm_site.To_Site = get_stringvalue(value[index]);
                }
        }
        return cm_site;
    }

    function get_cmsite_update(element, record, cm_site) {
        switch (element.COLUMN_NAME) {
            case 'CM':
                cm_site.CM = get_stringvalue(record[element.POSITION - 1]);
                break;
            case 'SITE':
                cm_site.Site = get_stringvalue(record[element.POSITION - 1]);
                break;
            case 'FROM_CM':
                cm_site.CM = get_stringvalue(record[element.POSITION - 1]);
                break;
            case 'TO_CM':
                cm_site.To_CM = get_stringvalue(record[element.POSITION - 1]);
                break;
            case 'FROM_SITE':
                cm_site.Site = get_stringvalue(record[element.POSITION - 1]);
                break;
            case 'TO_SITE':
                cm_site.To_Site = get_stringvalue(record[element.POSITION - 1]);
                break;
        }
        return cm_site;
    }

    function get_stringvalue(value) {
        let string_value;
        if (value !== "undefined" && value !== "NULL"
            && value !== null) {
            string_value = value.toString();
        }
        return string_value;
    }
    /**
     *
     * @param {*} original
     * @param {*} copy
     * returns the filtered table data from the request
     */
    function compare(original, copy) {
        let output = {};
        try{
            output.originalRecords = [];
            //Object.entries returns the key value pairs of an object
            for (let [k, v] of Object.entries(original)) {
                if (typeof v === "object" && v !== null) {
                    if (!copy.hasOwnProperty(k)) {
                        copy[k] = v; // 2
                    }

                    let newValue = compare(v, copy[k]);
                    copy.Keys = undefined;
                    let updatedFieldValue = newValue.copy.filter(y => y !== undefined)
                    let res = [];
                    copy[k].filter(async (e, index) => {
                        if (e !== undefined) {
                            res.push(index);
                        }
                    })
                    output.originalRecords.push({ record: v, position: res, updatedFieldValue });
                } else {
                    copy[k] = checkifequal(v, copy[k]);
                }
            }
            return { copy, output };
        }catch(error){
            throw new Error('Error in Compare Function: ', error );
        }
    }

    function checkifequal(x, y) {
        if (x === null || x === 'NULL' || x === 'null') {
            x = '';
        }
        if (y === null || y === "NULL" || y === 'null') {
            y = '';
        }
        //Object.is determines if two values are the same value and then if they are delete them
        if (Object.is(x, y)) {
            y = undefined;
        }
        return y;
    }
    function getkeyfields_insert(new_records, keyColumns) {
        let keyFields = [];
        try{
            new_records.forEach(element => {
                let value;
                for (let index = 4; index < keyColumns.length + 4; index++) {
                    if (value) {
                        value = `${value},${element[index]}`;
                    } else {
                        value = element[index];
                    }
                }
                keyFields.push(value);
            });
            return keyFields;
        }catch(error){
            throw new Error('Error in getkeyfields_insert Function: ', error );
        }
    }

    function getkeyfields_update(newRecords, keyColumns) {
        let keyFields = [];
        try{
            newRecords.originalRecords.forEach(element => {
                let value;
                for (let index = 4; index < keyColumns.length + 4; index++) {
                    if (value) {
                        value = `${value},${element.record[index]}`;
                    } else {
                        value = element.record[index];
                    }
                }
                keyFields.push(value);
            });
            return keyFields;
        }catch(error){
            throw new Error('Error in getkeyfields_update Function: ', error );
        }
    }

    // CM-SITE 1-1 restriction is strictly dependent on maintaining CM, Site values on role attributes in right order.
    // If the values are not maintained correctly OR they are not coming in correct order in decoded JWT token then this validation will NOT work.
    srv.before("GET", changHistory, async (request) => {
        cds.env.features.kibana_formatter = true;
        const LOG = cds.log(request.headers['x-correlation-id'],{label:'changHistory'});
        const jwtdetails = (jwtDecode(String(request.headers.authorization).slice(7)));
        let allowedAttributes = getallowedAttributes(jwtdetails, request, LOG);
        let allowed_cmsite = {};
        allowed_cmsite = get_cmsite(allowedAttributes, request);
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
    });

    function get_cmsite(allowedAttributes, request) {
        let allowed_cmsite = [];
        if (request._query.$filter.includes('T_COA_3DV_HEADER') || request._query.$filter.includes('T_COA_RFID_ANNOTATION')) {
            allowed_cmsite = merge_2(allowedAttributes['AnnotationReadOnly'], allowedAttributes['AnnotationModify'])
        } else if (request._query.$filter.includes('T_COA_AQID_MAPPING')) {
            allowed_cmsite = merge_2(allowedAttributes['AqidModify'], allowedAttributes['AqidReadOnly'])
        } else if (request._query.$filter.includes('T_COA_MAIN_LINE')) {
            allowed_cmsite = merge_2(allowedAttributes['MainLineReadOnly'], allowedAttributes['MainLineModify'])
        } else if (request._query.$filter.includes('T_COA_SUBLINE')) {
            allowed_cmsite = merge_2(allowedAttributes['SubLineReadOnly'], allowedAttributes['SubLineModify'])
        } else if (request._query.$filter.includes('T_COA_RFID_TT')) {
            allowed_cmsite = merge_3(allowedAttributes['RfidOnHandTTReadOnly'], allowedAttributes['RfidOnHandTTModify'], allowedAttributes['ApproveRfidOnHandTT'])
        } else if (request._query.$filter.includes('T_COA_OUTPUT')) {
            allowed_cmsite = merge_3(allowedAttributes['COOutputReadOnly'], allowedAttributes['COOutputReadOnly'], allowedAttributes['ApproveCoOutput'])
        } else if (request._query.$filter.includes('T_COA_NONRFID_PROJECTION')) {
            allowed_cmsite = merge_2(allowedAttributes['ProjectionTableReadOnly'], allowedAttributes['ProjectionTableModify'])
        } else if (request._query.$filter.includes('T_COA_NPI_PROGRAM')) {
            allowed_cmsite = allowedAttributes['NPIProgramModify']
        } else if (request._query.$filter.includes('T_COA_RFID_UNSCANNABLE_TT')) {
            allowed_cmsite = merge_3(allowedAttributes['UnScannableReadOnly'], allowedAttributes['UnScannableModify'], allowedAttributes['ApproveRfidOnHandTT'])
        } else if (request._query.$filter.includes('T_COA_NONRFID_TT')) {
            allowed_cmsite = merge_3(allowedAttributes['nonRFIDTTReadOnly'], allowedAttributes['nonRFIDTTModify'], allowedAttributes['ApproveRfidOnHandTT'])
        }
        return allowed_cmsite;
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

    function getallowedAttributes(jwtdetails, request, LOG) {
        const RoleNames = jwtdetails['xs.system.attributes'];
        let usrScope = [];
        for (let scope of jwtdetails.scope) {
            usrScope.push(scope.split('.')[1]);
        }
        let ScopesRelevantToThisApp = [`AnnotationReadOnly`, `AnnotationModify`,
            `AqidModify`, `AqidReadOnly`,
            `MainLineReadOnly`, `MainLineModify`,
            `SubLineReadOnly`, `SubLineModify`,
            `RfidOnHandTTReadOnly`, `RfidOnHandTTModify`, `ApproveRfidOnHandTT`,
            `COOutputReadOnly`, `COOutputReadOnly`, `ApproveCoOutput`,
            `ProjectionTableReadOnly`, `ProjectionTableModify`,
            `NPIProgramModify`, `UnScannableReadOnly`,
            `UnScannableModify`, `nonRFIDTTModify`, `nonRFIDTTReadOnly`];
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
            addToAllowedAttributes(ScopesRelevantToThisApp,RoleNames,allowedAttributes,srvCred,usrScope)
            
        }
        catch (err) {
            LOG.info("Unable to load coa-authorization: ", err.response?.data || err.response || err);
            console.log("Unable to load coa-authorization: ", err.response?.data || err.response || err);
            request.reject(400, "Unable to load coa-authorization");
        }
        return allowedAttributes;
    }

    function augmentArray(obj, arr) {
        let i;
        for (i = 0; i < arr.length; i++)augment(obj, arr[i]);
    }

    function augment(obj, term) {
        if (obj[term] === undefined) obj[term] = term;
    }

    function merge_3(obj1, obj2, obj3) {
        return ({ ...obj1, ...obj2, ...obj3 });
    }

    function merge_2(obj1, obj2) {
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
            tmparr = [];
            if (key.slice(0, key.indexOf('-')) !== `$unrestricted`) tmparr.push(`TO_CM='${key.slice(0, key.indexOf('-'))}'`);
            if (key.slice(key.indexOf('-') + 1, key.length) !== `$unrestricted`) tmparr.push(`TO_SITE='${key.slice(key.indexOf('-') + 1, key.length)}'`);
            if (tmparr.length > 1) tmparr[0] = `${tmparr[0]} and ${tmparr[1]}`
            arr.push(tmparr[0]);
        });
        if (arr.length > 0) {
            let str = `(${arr.join(") or (")})`;
            return str;
        }
        else {
            return (`((CM='NULL' and SITE='NULL') or (TO_CM='NULL' and TO_SITE='NULL'))`);
        }
    }
});
