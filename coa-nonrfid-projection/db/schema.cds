using { managed, sap
      } from '@sap/cds/common';

context com.apple.coa {   

@cds.persistence.skip
entity rfidTableStructure
{
    RFID_Timestamp : String; 
    Asset_Id : String;
    key RFID: String;
    key AQID: String;
    Raw_AQID: String;
    Mapped_AQID: String;
    Short_Name: String;
    Serial_Number: String;
    MFR: String;
    EQ_Name: String;
    Asset_Own: String;
    CM: String;
    Site: String;
    CM_Program: String;///
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
    Approval_Status: String;
    Submit_Date: String;
    Submit_By: String;
    Review_Date: String;
    Reviewed_By: String;
    CarryOverOldProgram : String;
    CarryOverAqid: String;
    CarryOverEqName: String;
}
}



@cds.persistence.exists 
Entity V_NONRFID_PROJECTION {
    key ID: String(36) not null  @title: 'ID' ; 
    key SITE: String(30) not null  @title: 'SITE' ; 
    key CM: String(30) not null  @title: 'CM' ; 
    key GH_SITE: String(30)  @title: 'GH_SITE' ; 
    key PROGRAM: String(40) not null  @title: 'PROGRAM' ; 
    key LINE: String(128) not null  @title: 'LINE' ; 
    key UPH: Integer not null  @title: 'UPH' ; 
    key STATION: String(128) not null  @title: 'STATION' ; 
        AREA: String(32) not null  @title: 'AREA' ; 
        // GH_SPL: Integer  @title: 'GH_SPL' ; 
        DISPLAY_NAME: String(255)  @title: 'DISPLAY_NAME' ; 
        GROUP: Integer  @title: 'GROUP' ; 
        ALT_STATION: Integer  @title: 'ALT_STATION' ; 
        PARENT_ITEM: String(255)  @title: 'PARENT_ITEM' ; 
    key LEVEL: String(255) not null  @title: 'LEVEL' ; 
    key GROUP_PRIORITY: String(18) not null  @title: 'GROUP_PRIORITY' ; 
    key AQID: String(30) not null  @title: 'AQID' ; 
        MP_INTENT_QTY: Decimal(15,2)  @title: 'MP_INTENT_QTY' ; 
    key SCOPE: String(32)  @title: 'SCOPE' ; 
        EQUIPMENT_TYPE: String(32)  @title: 'EQUIPMENT_TYPE' ; 
        DEPT: String(18)  @title: 'DEPT' ; 
        EQUIPMENT_NAME: String(255)  @title: 'EQUIPMENT_NAME' ; 
    key MFR: String(255) not null  @title: 'MFR' ; 
        PO_TYPE: String(32)  @title: 'PO_TYPE' ; 
        CONSUMABLES: String(1)  @title: 'CONSUMABLES' ; 
        CATEGORY: String(255)  @title: 'CATEGORY' ; 
        SPARE_QTY: Integer  @title: 'SPARE_QTY' ; 
        SPARE_RATE: Integer  @title: 'SPARE_RATE' ; 
        RELEASE_QTY: Integer  @title: 'RELEASE_QTY' ; 
        QPL: Integer  @title: 'QPL' ; 
        CARRY_OVER: Integer  @title: 'CARRY_OVER' ; 
        SHORT_NAME: String @title: 'Short AQID';
        BOH: Integer  @title: 'BOH' ; 
        SPL: Integer  @title: 'SPL' ; 
        Balance_Qty: Decimal(15,2)  @title: 'Balance Qty' ; 
        RFID_SCOPE: String(1)  @title: 'RFID_SCOPE' ; 
        MODIFIEDBY_NAME: String(255);
        MODIFIEDBY_MAIL: String(255);
        CREATEDBY_NAME: String(255);
        CREATEDBY_MAIL: String(255);
        CREATEDAT: Timestamp;
        MODIFIEDAT: Timestamp;
    virtual ![ErrorMsg]: String(600);
    virtual ![Edit] : Integer;
}