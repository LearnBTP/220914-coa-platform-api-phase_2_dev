using { com.apple.coa as coa } from '../db/schema';
using V_NONRFID_PROJECTION from '../db/schema';

annotate nonrfid_projection with @(requires : [
'ProjectionTableReadOnly', 'ProjectionTableModify'
]);

@cds.query.limit: { default: 200000, max: 200000 }
service nonrfid_projection {


        @cds.persistence.skip
        @(requires : 'ProjectionTableModify')
        entity Upload_NonRFID_Projection
        {
                csv : LargeBinary @odata.singleton  @Core.MediaType : 'text/csv';
        }

        

        @cds.persistence.skip
        @(requires : 'ProjectionTableModify')
        entity NonRFID_Projection_Action 
        {
                NonRFIDData : Composition of many NonRFIDProjectionDetails;
        };

        @cds.persistence.skip
        @(requires : 'ProjectionTableModify')
        entity ResetQPL 
        {
                NonRFIDData : Composition of many NonRFIDProjectionDetails;
        };

        
        
        action selectAllMassUpdate
        @(requires : 'ProjectionTableModify')
        (
                url:String,
                RFID_SCOPE: String,
                CARRY_OVER: Integer,
                QPL: Integer,
                DEPT: String
        );

        action selectAllResetQPL
        @(requires : 'ProjectionTableModify')
        (
                url:String,
                action: String
        );


@readonly
@cds.persistence.skip
entity F4help 
@(restrict: [
        {grant:'READ',  to: ['ProjectionTableReadOnly', 'ProjectionTableModify']}]) 
        {
    key SITE: String @title : 'SITE';
    key CM: String @title : 'CM';
    key GH_SITE: String @title : 'GH_SITE';
    key PROGRAM: String @title : 'PROGRAM';
    key SCOPE: String @title : 'SCOPE';
    key LINE: String @title : 'LINE';
    key MP_INTENT_QTY: String @title : 'MP_INTENT_QTY';
    key AQID: String @title : 'AQID';
    key CONSUMABLES: String @title : 'CONSUMABLES';
    key PO_TYPE: String @title : 'PO_TYPE';
    key ALT_STATION: String @title: 'ALT_STATION';
    key QPL: Integer @title: 'QPL';
    key SPL: Integer @title: 'SPL';
    key BOH: Integer @title: 'BOH';
    key RELEASE_QTY: Integer @title: 'RELEASE_QTY';
}



entity NonRFIDProjectionDetails 
@(restrict: [
        {grant:'READ',  to: ['ProjectionTableReadOnly', 'ProjectionTableModify']},
        // {grant:'WRITE', to: ['ProjectionTableModify'], where: '(CM = $user.CM or To_CM = $user.CM) and ((Site = $user.Site or SITE = $user.Site) or To_Site = $user.Site)'} 
]) 
as projection on V_NONRFID_PROJECTION;

// to Export uniq records gh_site,program,aqid frm ui
entity Projection_Export 
@(restrict: [
       {grant:'READ',  to: ['ProjectionTableReadOnly', 'ProjectionTableModify']},
]) 
as projection on V_NONRFID_PROJECTION;
}
