using {managed,

} from '@sap/cds/common';

context com.apple.coa {

  @cds.persistence.exists
  entity T_COA_NONRFID_TT : managed {
        ID: String(36) default ''  @Core.Computed : true; 
        GH_Site          : String(30) default ''  @Core.Computed : true; 
        key CM               : String(30) default ''  @Core.Computed : true; 
        key Site             : String(30) default ''  @Core.Computed : true; 
        key Program          : String(40) default ''  @Core.Computed : true; 
        key Line_Type        : String(80) default ''  @Core.Computed : true; 
        key Uph              : Integer default 0 @Core.Computed : true;
        key Aqid             : String(18) default '' @Core.Computed : true;
            Mapped_Aqid      : String(18);
        key Station          : String(128) default '' @Core.Computed : true;
        key Scope            : String(32) default '' @Core.Computed : true;
        key Line_Id          : String(250) default '' @Core.Computed : true;
            Parent_Item      : String(255) default '' @Core.Computed : true;
            Alt_Station      : Integer default 0 @Core.Computed : true;
        key Group_Priority   : String(18) default '' @Core.Computed : true;
        key Sequence_No      : Integer default 0 @Core.Computed : true;
            Split            : String(1) default '' @Core.Computed : true;
            Equipment_Name   : String(255) @Core.Computed : true;
            confLevel        : Decimal(15,2) @Core.Computed : true;
            Projected_Qty    : Decimal(15,2) @Core.Computed : true;
            Transfer_Qty     : Decimal(15,2) @Core.Computed : true;
            Override_Qty     : Decimal(15,2) @Core.Computed : true;
        Key Mfr              : String(255) @Core.Computed : true;
            BusinessGrp      : String(18) @Core.Computed : true;
            SAP_CM_Site      : String(61) @Core.Computed : true;
            SAP_To_CM_Site   : String(61) @Core.Computed : true;
            Dept             : String(18) @Core.Computed : true;
            RFID_Scope	     : String(32) @Core.Computed : true;
            Group_ID         : Integer @Core.Computed : true;
            Line_Priority    : String(80) @Core.Computed : true;
            Equipment_Type   : String(32) @Core.Computed : true;
            To_CM            : String(30) @Core.Computed : true; 
            To_Site          : String(30) @Core.Computed : true;
            To_Program       : String(40) @Core.Computed : false;
            To_Business_Grp  : String @Core.Computed : false;
            To_GHSite        : String(30) @Core.Computed : false;
            Transfer_Flag    : String(1) @Core.Computed : false;
            Comments         : String(80) @Core.Computed : false;
            Status           : String(18) @Core.Computed : true;
            Submit_Date      : Timestamp @Core.Computed : true;
            Submit_By        : String @Core.Computed : true;
            Review_Date      : Timestamp @Core.Computed : true;
            Reviewed_By      : String @Core.Computed : true;
            modifiedBy_Name  : String(255) @Core.Computed : true;
            modifiedBy_mail  : String(255) @Core.Computed : true;
            createdBy_Name   : String(255) @Core.Computed : true;
            createdBy_mail   : String(255) @Core.Computed : true;
            Submit_By_Name   : String(255) @Core.Computed : true;
            Submit_By_mail   : String(255) @Core.Computed : true;
            Reviewed_By_Name : String(255) @Core.Computed : true;
            Reviewed_By_mail : String(255) @Core.Computed : true;
            Error            : String(150) @Core.Computed : true;
    }
}
@cds.persistence.exists
  entity V_NONRFID_TT : managed {
            ID: String(36)  default ''  @Core.Computed : true; 
            GH_Site          : String(30) default '' @Core.Computed : true ;
        key CM               : String(30) default '' @Core.Computed : true ;
        key Site             : String(30) default '' @Core.Computed : true ;
        key Program          : String(40) default '' @Core.Computed : true ;
        key Line_Type        : String(80) default '' @Core.Computed : true ;
        key Uph              : Integer default 0 @Core.Computed : true ;
        key Aqid             : String(18) default '' @Core.Computed : true ;
        key Station          : String(128) default '' @Core.Computed : true ;
        key Scope            : String(32) default '' @Core.Computed : true ;
        key Line_Id          : String(250) default '' @Core.Computed : true ;
            Parent_Item      : String(255) default '' @Core.Computed : true ;
            Alt_Station      : Integer default 0 @Core.Computed : true ;
        key Group_Priority   : String(18) default '' @Core.Computed : true ;
            Grp              : String(18) default '' @Core.Computed : true ;
            Prio             : String(18) default '' @Core.Computed : true ;
        key Sequence_No      : Integer default 0 @Core.Computed : true ;
            Split            : String(1)  @Core.Computed : true ;
            Equipment_Name   : String(255) @Core.Computed : true ;
            confLevel        : Decimal(15,2) @Core.Computed : true ;
            Projected_Qty    : Decimal(15,2) @Core.Computed : true ;
            Transfer_Qty     : Decimal(15,2) @Core.Computed : false;
            Override_Qty     : Decimal(15,2) @Core.Computed : true;
        Key Mfr              : String(255) @Core.Computed : true;
            BusinessGrp      : String(18) @Core.Computed : true;
            SAP_CM_Site      : String(61) @Core.Computed : true;
            SAP_To_CM_Site   : String(61) @Core.Computed : true;
            Dept             : String(18) @Core.Computed : true;
            RFID_Scope	     : String(32) @Core.Computed : true;
            LastSyncDate     : Timestamp @Core.Computed : true;
            LastSyncBy       : String(255) @Core.Computed : true;
            LastSyncStatus   : String(20) @Core.Computed : true;
            Group_ID         : Integer @Core.Computed : true;
            Line_Priority    : String(80) @Core.Computed : true;
            Equipment_Type   : String(32) @Core.Computed : true;
            To_CM            : String(30) @Core.Computed : true;
            To_Site          : String(30) @Core.Computed : true;
            To_Program       : String(40) @Core.Computed : false;
            To_Business_Grp  : String @Core.Computed : false;
            To_GHSite        : String(30) @Core.Computed : false;
            Transfer_Flag    : String(1) @Core.Computed : false;
            Comments         : String(80) @Core.Computed : false;
            Status           : String(18) @Core.Computed : true;
            Submit_Date      : Timestamp @Core.Computed : true;
            Submit_By        : String @Core.Computed : true;
            Review_Date      : Timestamp @Core.Computed : true;
            Reviewed_By      : String @Core.Computed : true;
            modifiedBy_Name  : String(255) @Core.Computed : true;
            modifiedBy_mail  : String(255) @Core.Computed : true;
            createdBy_Name   : String(255) @Core.Computed : true;
            createdBy_mail   : String(255) @Core.Computed : true;
            Submit_By_Name   : String(255) @Core.Computed : true;
            Submit_By_mail   : String(255) @Core.Computed : true;
            Reviewed_By_Name : String(255) @Core.Computed : true;
            Reviewed_By_mail : String(255) @Core.Computed : true;
            Mapped_Aqid      : String(18) @Core.Computed : true;
            Table_Mapped_Aqid: String(18) @Core.Computed : true;
            Reset_Flag       : String(12) @Core.Computed : true;
            Error: String(150) @Core.Computed : true ;
            virtual ![Parent]            : String(10);
            virtual Edit                 : Integer @Core.Computed : true ;
    }
@cds.persistence.exists
entity V_NONRFID {
  key CM             : String(30) not null  @title : 'CM';
  key Site           : String(30) not null  @title : 'SITE';
  key Program        : String(40) not null  @title : 'PROGRAM';
  key Aqid           : String(255) not null @title : 'AQID';
  key Station        : String(18) not null  @title : 'STATION';
  key Scope          : String(32) not null  @title : 'SCOPE';
  key GH_Site        : String(30)           @title : 'GH_SITE';
  key SHORT_NAME     : String(255)          @title : 'SHORT_AQID';
  key Line           : String(128) not null @title : 'LINE_TYPE';
  key Group_Priority : String(18)           @title : 'GROUP_PRIORITY';
      Area           : String(32) not null @title : 'Business_Grp';
      Parent_Item : String(255) ;
      ALT_Station : Integer;
      grp            : String(18);
      Prio           : String(18);
      Uph            : Integer              @title : 'UPH';
      SPL            : Integer              @title : 'SPL';
      QPL            : Integer              @title : 'QPL';
      BOH            : Integer              @title : 'BOH';
      Carry_Over     : Integer              @title : 'CARRY_OVER';
  key RFID_Scope     : String(1) not null   @title : 'RFID_SCOPE';
      Equipment_Name : String(255)  @title: 'EQUIPMENT_NAME' ; 
      Equipment_Type: String(32)  @title: 'EQUIPMENT_TYPE' ; 
  key Mfr: String(255) not null  @title: 'MFR' ; 
      Dept: String(18)  @title: 'DEPT' ; 
      Group: Integer  @title: 'GROUP' ; 
  key LineId         : String(250)           @title : 'LINEID';
      Mapped_Aqid    : String(255);
  key confLevel      : Decimal(15,2)       @title : 'CONFLEVEL';
      Line_Priority    : Integer @Core.Computed : true;

}
