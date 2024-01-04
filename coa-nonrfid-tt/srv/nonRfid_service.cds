using {com.apple.coa as coa} from '../db/nonRfidSchema';
using V_NONRFID_TT from '../db/nonRfidSchema';

annotate NonRfid_tt with @(requires: [
    'SyncActionAll',
    'nonRFIDTTReadOnly',
    'nonRFIDTTModify',
    'ApproveRfidOnHandTT'
]);

@cds.query.limit: {
    default: 200000,
    max    : 200000
}
service NonRfid_tt {

    define type data      : {
        // SyncALL     :      String(1);
        GH_Site     : many String(30);
        Program_Org : many String(40);
    };

    @readonly
    entity nonRfidTT @(restrict: [{
        grant: 'READ',
        to   : ['AnnotationReadOnly']
    }]) as projection on V_NONRFID_TT;

    action SyncNonRFIDTT @(restrict: [{
         grant: 'WRITE',
         to   : ['SyncActionAll']
     },
     {
         grant: 'READ',
         to   : ['SyncActionAll']
     }])
    (request : data);

    @readonly
    @cds.persistence.skip
    entity F4help                        @(restrict: [{
        grant: 'READ',
        to   : [
            'nonRFIDTTModify',
            'nonRFIDTTReadOnly'
        ]
    }]) {
        key GH_Site         : String     @title: 'From GH Site';
        key CM              : String     @title: 'CM';
        key Site            : String     @title: 'Site';
        key Program         : String     @title: 'CM Program [3DV]';
        key Aqid            : String     @title: 'AQID Non-RFID';
        key Uph             : Integer    @title: 'Uph (3DV)';
        key To_GHSite       : String     @title: 'To Site(GH)';
        key To_Business_Grp : String     @title: 'To Business Group';
        key To_Program      : String     @title: 'To Program';
        key Line_Id         : String     @title: 'Line Id (3DV)';
        key Line_Type       : String     @title: 'Line Type (3DV)';
        key Status          : String     @title: 'Transfer Approval Status';
        key Station         : String     @title: 'Station';
        key Group_Priority  : String     @title: 'Group Priority [Non-RFID]';
        key Submit_By_Name  : String     @title: 'Submited By';
        key GH_Site_Org     : String(30) @title: 'GH Site';
        key Program_Org     : String(30) @title: 'Program';
        key GH_Site_MD      : String(30);
        key Program_MD      : String(40);
        key Dept            : String     @title: 'Department';
        key Table           : String     @title: 'GH Site';

    }

    define type non_rf_id : many {
        ID               : String(36);
        GH_Site          : String(30);
        CM               : String(30);
        Site             : String(30);
        Program          : String(40);
        Line_Type        : String(80);
        Uph              : Integer;
        Aqid             : String(18);
        Station          : String(128);
        Scope            : String(32);
        Line_Id          : String(250);
        Parent_Item      : String(255);
        Alt_Station      : Integer;
        Group_Priority   : String(18);
        Sequence_No      : Integer;
        Split            : String(1);
        Equipment_Name   : String(255);
        confLevel        : Decimal;
        Projected_Qty    : Decimal;
        Override_Qty     : Decimal;
        Transfer_Qty     : Decimal;
        Mfr              : String(255);
        BusinessGrp      : String(18);
        Dept             : String(18);
        RFID_Scope       : String(32);
        Group_ID         : Integer;
        Line_Priority    : String(80);
        Equipment_Type   : String(32);
        To_CM            : String(30);
        To_Site          : String(30);
        To_Program       : String(40);
        To_Business_Grp  : String;
        To_GHSite        : String(30);
        Transfer_Flag    : String(1);
        Comments         : String(80);
        Status           : String(18);
        Submit_Date      : Timestamp;
        Submit_By        : String;
        Review_Date      : Timestamp;
        Reviewed_By      : String;
        modifiedBy_Name  : String(255);
        modifiedBy_mail  : String(255);
        createdBy_Name   : String(255);
        createdBy_mail   : String(255);
        Submit_By_Name   : String(255);
        Submit_By_mail   : String(255);
        Reviewed_By_Name : String(255);
        Reviewed_By_mail : String(255);
        SAP_CM_Site      : String(61);
        SAP_To_CM_Site   : String(61);
        Mapped_Aqid      : String(18);
        LastSyncDate     : Timestamp;
        LastSyncBy       : String(255);
        LastSyncStatus   : String(20);
        URL              : String;
        virtual Error    : String(150);
        virtual Parent   : String(10);
        virtual Edit     : Integer;
        modifiedAt       : Timestamp;
        modifiedBy       : String;
        createdAt        : Timestamp;
        createdBy        : String;
    };

    @cds.persistence.skip
    entity nonrfid_tt_action @(restrict: [
        {
            grant: 'READ',
            to   : ['nonRFIDTTReadOnly']
        },
        {
            grant: 'WRITE',
            to   : ['nonRFIDTTModify']
        }
    ]) {
        NonRfidData : non_rf_id;
        action      : String(10)
    };

    action selectAllMassUpdate @(requires: 'nonRFIDTTModify')(URL : String, To_GHSite : String, To_Program : String, To_Business_Grp : String, Comments : String, Transfer_Flag : String, Transfer_Qty : Decimal);

    @cds.persistence.skip
    entity Upload_Nonrfid @(restrict: [
            {grant:'WRITE', to: ['nonRFIDTTModify']} ])
    {
        csv : LargeBinary @odata.singleton  @Core.MediaType : 'text/csv';
        msg : String;
    } 

    action resync_nonrfid_tt(); 
}
