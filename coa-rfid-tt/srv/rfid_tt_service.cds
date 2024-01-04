using { com.apple.coa as coa } from '../db/schema';
using V_RFIDDETAILS from '../db/schema';
annotate rfid_tt with @(requires : [
     'RfidOnHandTTReadOnly', 'RfidOnHandTTModify', 'ApproveRfidOnHandTT', 'JobScheduler','system-user','jobscheduler'
]);

@cds.query.limit: { default: 200000, max: 200000 }
service rfid_tt {


define type rfidTableStructure:
{
    RFID_Timestamp : String; 
    Asset_Id : String;
    RFID: String;
    AQID: String;
    Raw_AQID: String;
    Mapped_AQID: String;
    Short_Name: String;
    Serial_Number: String;
    MFR: String;
    EQ_Name: String;
    Asset_Own: String;
    CM: String;
    Site: String;
    CM_Program: String;
    Asset_Status: String;
    Timestamp_3DV: String;
    Line_ID: String;
    Override_lineId: String;
    Line_Type: String;
    UPH: Integer;
    Version: String;
    Transfer_Flag: String;
    To_CM: String;
    To_Site: String;
    To_Program: String;
    To_Business_Grp: String;
    Comments: String;
    CarryOverAqid: String;
    CarryOverEqName: String;
    Approval_Status: String;
    Submit_Date: String;
    Submit_By: String;
    Review_Date: String;
    Reviewed_By: String;
    CarryOverOldProgram : String;
    To_GHSite : String;
    Reset_Flag : String(12);
}


@cds.persistence.skip
entity rfid_tt_action {
    RfidData : array of rfidTableStructure;
};

@readonly
@cds.persistence.skip
entity F4help 
@(restrict: [
        {grant:'READ',  to: ['RfidOnHandTTReadOnly', 'RfidOnHandTTModify']}]) 
        {
    key To_CM: String @title : 'To CM';
    key To_Site: String @title : 'To Site';
    key ZALDR_CMPROGRAM: String @title : 'CM Program';
    key To_Program: String @title : 'To Program';
    key LineId: String @title : 'Line Id';
    key RFID: String @title : 'RFID';
    key AQID: String @title : 'AQID';
    key Approval_Status: String @title : 'Approval Status';
    key ALDERAN: String @title : 'Asset Number';
    key SERNR: String @title : 'Serial Number';
    key To_GHSite : String @title : 'To Site(GH)';
    key ZALDR_SITE : String @title : 'From Site(Alderaan)';
    key ZALDR_CM : String @title : 'From CM(Alderaan)';
    key CarryOverOldProgram : String @title : 'CO Program (3DV)';
}

entity RFIDDetails 
@(restrict: [
        {grant:'READ',  to: ['RfidOnHandTTReadOnly']},
        {grant:'WRITE', to: ['RfidOnHandTTModify']} ]) 

as projection on V_RFIDDETAILS;

action selectAllMassUpdate
@(requires : 'RfidOnHandTTModify')
(
        url:String,
        To_GH_Site: String,
        To_Program: String,
        To_Business_Grp: String,
        Comment: String,
        Approval_Status : String,
        Transfer_Flag : String
);

action resyncAlderaan
@(requires: 'system-user')
(
       
);

action resyncMappedAqid
(
       
);

action bringToSyncWithCurrentDesign(flags: array of String);



}
