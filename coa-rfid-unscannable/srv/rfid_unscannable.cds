using { com.apple.coa as coa } from '../db/rfid_unscannables_datamodel';
using V_UNSCANNABLES from '../db/rfid_unscannables_datamodel';
@cds.query.limit: { default: 200000, max: 200000 }

annotate rfid_unscannable with @(requires : ['system-user','UnScannableReadOnly','UnScannableModify','ApproveRfidOnHandTT','SyncActionAll']);
service rfid_unscannable {
entity Carryover_rfid_unscannable @(restrict: [
            {grant:'READ',  to: ['UnScannableReadOnly']},
            {grant:'READ', to: ['UnScannableModify']},
            {grant:'READ', to: ['ApproveRfidOnHandTT']},
            {grant:'READ', to: ['SyncActionAll']} ]) 
           as projection on V_UNSCANNABLES;

@readonly
@cds.persistence.skip
entity F4help @(restrict: [
            {grant:'READ',  to: ['UnScannableReadOnly']},
            {grant:'READ', to: ['UnScannableModify']},
            {grant:'READ', to: ['ApproveRfidOnHandTT']},
            {grant:'READ', to: ['SyncActionAll']} ]) {
       key GH_SITE: String(30) ;
       key TO_GHSITE: String(30) ;
       key PROGRAM : String(40);
       key TO_PROGRAM: String(40) ;
       key AQID: String(18) ;
       key TO_BUSINESS_GRP : String(18);
       key FROM_BUSINESS_GRP : String(18);
       key STATUS : String(25);
       key GH_SITE_ORG : String(30) ;
       key GH_SITE_MD : String(30) ;
       key PROGRAM_MD : String(40) ;
    }

@cds.persistence.skip
    entity Upload_Unscannable @(restrict: [
            {grant:'WRITE', to: ['UnScannableModify']} ])
    {
        csv : LargeBinary @odata.singleton  @Core.MediaType : 'text/csv';
        msg : String;
    } 

define type split_data: many{
        GH_SITE           : String(30);
        CM                : String(30);
        SITE              : String(30);
        PROGRAM           : String(40);
        FROM_BUSINESS_GRP : String(18);
        SEQUENCE_NO       : Integer;
        NPI_INDICATOR     : String(10);
        PROJECTED_QTY     : Integer;
        AQID              : String(18);
        TO_GHSITE         : String(30);
        TO_CM             : String(30);
        TO_SITE           : String(30);
        TO_PROGRAM        : String(40);
}

define type unscannable : many{
    GH_SITE           : String(30);
    CM                : String(30);
    SITE              : String(30);
    FROM_BUSINESS_GRP : String(18);
    PROGRAM           : String(40);
    NPI_INDICATOR     : String(10);
    AQID              : String(18);
    MAPPED_AQID       : String(18);
    EQUIPMENT_NAME    : String(255);
    MFR               : String(255);
    PO_TYPE           : String(32);
    SCOPE             : String(255);
    CONSUMABLES       : String(1);
    FLEX_KITS         : String(1);
    PROJECTED_QTY     : Integer;
    TRANSFER_FLAG     : String(1);
    TO_GHSITE         : String(30);
    TO_CM             : String(30);
    TO_SITE           : String(30);
    TO_BUSINESS_GRP   : String(18);
    TO_PROGRAM        : String(40);
    QTY               : Integer;
    STATUS            : String(25);
    REVIEW_DATE       : Timestamp;
    REVIEWED_BY       : String;
    MODIFIEDAT        : Timestamp;
    MODIFIEDBY        : String;
    CREATEDAT         : Timestamp;
    CREATEDBY         : String;
    CREATEDBY_NAME    : String(255);
    CREATEDBY_MAIL    : String(255);
    MODIFIEDBY_NAME   : String(255);
    MODIFIEDBY_MAIL   : String(255);
    REVIEWED_BY_NAME  : String(255);
    REVIEWED_BY_MAIL  : String(255);
    SAP_CM_SITE       : String(61);
    SAP_TO_CM_SITE    : String(61);
    SPLIT             : String(1);
    SEQUENCE_NO       : Integer;
    ID                : String(36);
    COMMENT           : String(80);
    SYNC_STATUS       : String(20);
    ERROR             : String(255);
    TABLE_MAPPED_AQID : String(18);
    RESET_FLAG        : String(12);
};

@cds.persistence.skip
    entity Unscannable_Split @(restrict: [
            {grant:'WRITE', to: ['UnScannableModify']} ])
    {
        SplitData : split_data;
        URL : String;
        Action: String(20);
    } 

@cds.persistence.skip
    entity Unscannable_action @(restrict: [
            {grant:'WRITE', to: ['UnScannableModify']},
            {grant:'WRITE', to: ['ApproveRfidOnHandTT']} ])
    {
        URL : String;
        UnscanData : unscannable;
        TO_GHSITE : String(30);
        TO_PROGRAM : String(30);
        FLEX_KITS : String(1);
        TRANSFER_FLAG : String(1);
        TO_BUSINESS_GRP: String(18);
        TO_CM : String(30);
        TO_SITE : String(30);
        QTY : Integer;
        Action:String(20);
        COMMENT : String(80);
        RESET_FLAG : String(12);
    } 

    define type syncdata : {
        syncall : String(1);
        GH_SITE : many String (30);
    }

    action Generate_Unscannable @(restrict: [
            {grant:'WRITE', to: ['SyncActionAll']} ])( request : syncdata ) returns array of syncdata;

    action resync_unscannable ();
}
