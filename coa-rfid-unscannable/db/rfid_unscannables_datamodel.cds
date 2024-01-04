using { managed, sap, cuid
      } from '@sap/cds/common';

context com.apple.coa { 

@cds.persistence.exists
entity T_COA_RFID_UNSCANNABLE_TT : managed, cuid {
        key GH_Site           : String(30) @Core.Computed : true;
        key CM                : String(30) @Core.Computed : true;
        key Site              : String(30) @Core.Computed : true;
        key Program           : String(40) @Core.Computed : true;
        key AQID              : String(18) @Core.Computed : true;
        key Sequence_No       : Integer    @Core.Computed : true;
            From_Business_Grp : String(18) @Core.Computed : true;
            NPI_Indicator     : String(10) @Core.Computed : true;
            Projected_Qty     : Integer    @Core.Computed : true;
            Flex_Kits         : String(1)  @Core.Computed : false;
            Transfer_Flag     : String(1)  @Core.Computed : false;
            To_GHSite         : String(30) @Core.Computed : false;
            To_CM             : String(30) ;
            To_Site           : String(30) ;
            To_Program        : String(40) @Core.Computed : false;
            To_Business_Grp   : String(18) @Core.Computed : false;
            Qty               : Integer    @Core.Computed : false;
            Status            : String(25) @Core.Computed : false;
            Review_Date       : Timestamp  @Core.Computed : false;
            Reviewed_By       : String     @Core.Computed : false;
            modifiedBy_Name   : String(255);
            modifiedBy_mail   : String(255);
            createdBy_Name    : String(255);
            createdBy_mail    : String(255);
            Reviewed_By_Name  : String(255);
            Reviewed_By_mail  : String(255);
            SAP_CM_Site       : String(61) ;
            SAP_To_CM_Site    : String(61) ;
            Comment           : String(80);
            Mapped_Aqid       : String(18);
            Reset_Flag        : String(12);
    virtual Error             : String(150);
    virtual SPLIT             : String(1);
    virtual Parent            : String(10);
    }
}

@cds.persistence.calcview
@cds.persistence.exists 
Entity ![V_UNSCANNABLES] {
    key     ![GH_SITE]           : String(30);
    key     ![CM]                : String(30);
    key     ![SITE]              : String(30);
    key     ![FROM_BUSINESS_GRP] : String(18);
    key     ![PROGRAM]           : String(40);
    key     ![AQID]              : String(18);
    key     ![SEQUENCE_NO]       : Integer;
    key     ![NPI_INDICATOR]     : String(10); 
    key     ![MAPPED_AQID]       : String(18); 
    key     ![EQUIPMENT_NAME]    : String(255);
    key     ![MFR]               : String(255);
    key     ![PO_TYPE]           : String(32);
    key     ![SCOPE]             : String(255);
    key     ![CONSUMABLES]       : String(1);
    key     ![FLEX_KITS]         : String(1);
    key     ![PROJECTED_QTY]     : Integer;
    key     ![TRANSFER_FLAG]     : String(1);
    key     ![TO_GHSITE]         : String(30);
    key     ![TO_CM]             : String(30);
    key     ![TO_SITE]           : String(30);
    key     ![TO_BUSINESS_GRP]   : String(18);
    key     ![TO_PROGRAM]        : String(40);
    key     ![QTY]               : Integer;
    key     ![STATUS]            : String(25);
    key     ![REVIEW_DATE]       : Timestamp;
    key     ![REVIEWED_BY]       : String;
    key     ![MODIFIEDAT]        : Timestamp;
    key     ![MODIFIEDBY]        : String;
    key     ![CREATEDAT]         : Timestamp;
    key     ![CREATEDBY]         : String;
    key     ![CREATEDBY_NAME]    : String(255);
    key     ![CREATEDBY_MAIL]    : String(255);
    key     ![MODIFIEDBY_NAME]   : String(255);
    key     ![MODIFIEDBY_MAIL]   : String(255);
    key     ![REVIEWED_BY_NAME]  : String(255);
    key     ![REVIEWED_BY_MAIL]  : String(255);
    key     ![SAP_CM_SITE]       : String(61);
    key     ![SAP_TO_CM_SITE]    : String(61);
    key     ![COMMENT]           : String(80);
    key     ![ID]                : String(36);
    key     ![SYNC_STATUS]       : String(20);
    key     ![ERROR]             : String(255);
    key     ![TABLE_MAPPED_AQID] : String(18);
    key     ![RESET_FLAG]        : String(12);
    virtual ![SPLIT]             : String(1);
    virtual ![Parent]            : String(10);
    virtual ![Edit]              : Integer @Core.Computed : true ;
}

@cds.persistence.calcview
@cds.persistence.exists 
Entity ![V_UNSCANNABLE_PROJ] {
    key     ![GH_SITE]           : String(32);
    key     ![CM]                : String(30);
    key     ![SITE]              : String(30);
    key     ![PROGRAM]           : String(40);
    key     ![FROM_BUSINESS_GRP] : String(18);
    key     ![AQID]              : String(18);
    key     ![PROJECTED_QTY]     : Integer;
    key     ![SAP_CM_SITE]       : String(61); 
    key     ![NPI_INDICATOR]     : String(10); 
}
