using {
  managed,
  sap
} from '@sap/cds/common';

context com.apple.coa {


  @cds.persistence.exists
  entity T_COA_SIMU_RFID : managed {
    key Simulation_name : String(255);
    key GHSite          : String(30);
    key To_CM           : String(30);
    key To_Site         : String(30);
        To_GhSite       : String(30);
    key To_Program      : String(40);
        To_Business_Grp : String(5000);
        Raw_AQID        : String(18);
        Mapped_AQID     : String(18);
        Short_Name      : String(40);
        Serial_Number   : String(30);
        Asset_Own       : String(30);
        EQ_Name         : String(255);
        Area            : String(32);
        CM_Dept         : String(128);
        Lob_Name        : String(64);
        Status          : String(5);
        CO_Aqid         : String(18);
        CO_Eq           : String(255);
        CO_Program      : String(40);
    key Line_Id         : String(250);
        Line_Type       : String(128);
        UPH             : Integer;
        CM              : String(4);
    key Site            : String(30);
    key CM_Program      : String(40);
        Transfer_Flag   : String(1);
        Match_Status    : String(18);
        Match_Qty       : Integer;
        Mismatch_Qty    : Integer;
    key RFID            : String;
    key AQID            : String;
  }

  @cds.persistence.exists
  entity T_COA_SIMU_NONRFID : managed {
    key Simulation_name  : String(255);
    key GH_Site          : String(30);
    key CM               : String(30);
    key Site             : String(30);
    key Program          : String(40);
    key Aqid             : String(18);
        Mapped_Aqid      : String(18);
        Dept             : String(18);
    key Station          : String(128);
    key Group_Priority   : String(18);
    key Scope            : String(32);
    key Line_Type        : String(80);
    key UPH              : Integer;
        Alt_Station      : Integer;
        RFID_Scope       : String(32);
        Group_ID         : Integer;
        Line_Priority    : String(80);
        Equipment_Type   : String(32);
        Equipment_Name   : String(255);
        confLevel        : Integer;
    key Mfr              : String(255);
    key Line_Id          : String(250);
        Projected_Qty    : Decimal(15,2);
        Transfer_Qty     : Integer;
        Split            : String(1);
        To_GHSite        : String(30);
        To_Program       : String(40);
        To_Business_Grp  : String(50);
        Transfer_Flag    : String(1);
        Comments         : String(150);
        Status           : String(18);
    key Sequence_No      : Integer;
        Sync_Status      : String;
        Sync_on_Dt       : String;
        Sync_By_Name     : String;
        Submit_Dt      : Timestamp;
        Review_Date      : Timestamp;
        Review_By        : String;
        Modify_Date      : String;
        modifiedBy_Name  : String(255);
        Sync_By_email    : String;
        Submit_By_Email  : String;
        Reviewed_By_mail : String(255);
        modifiedBy_mail  : String(255);
        Sync_By          : String;
        Submit_By        : String(5000);
        Reviewed_By      : String(5000);
        Modified_By      : String(5000);
        To_CM            : String(30);
        To_Site          : String(30);
        From_SAP_CM_Site : String(61);
        To_SAP_CM_Site   : String(61);
        Match_Status     : String(18);
        Match_Qty        : Integer;
        Mismatch_Qty     : Integer;
  }

  @cds.persistence.exists
  entity T_COA_SIMU_CO : managed {
    key Simulation_name   : String(255);
    key From_GHSite       : String(30);
    key From_Product      : String(40);
    key From_Business_Grp : String(50);
    key To_Product        : String(40);
    key To_Site           : String(30);
    key To_Business_Grp   : String(50);
    key Apple_Id          : String(18);
        CO_Type           : String(10);
        Quantity          : Integer;
        Comment           : String(150);
        Match_Status      : String(18);
        Match_Qty         : Integer;
        Mismatch_Qty      : Integer;
  }

  @cds.persistence.exists
  entity T_COA_SIMULATION_H : managed {
    key Simulation_name : String(255);
    key From_GHSite     : String(30);
    key CM              : String(30);
    key Site            : String(30);
    key Program         : String(40);
    key Line_ID         : String(250);
    key Line_Type       : String(80);
        To_GHSite       : String(30);
        To_CM           : String(30);
        To_Site         : String(30);
        To_Program      : String(40);
        To_Business_Grp : String(18);
    virtual ![ErrorMsg]  : String(600);
  }

  @cds.persistence.exists
  entity T_COA_SIMULATION : managed {
    key Simulation_name : String(255);
        UserId          : String(30);
        Status          : String(30);
  }


  @cds.persistence.exists
  entity T_COA_BOM_STRUCTURE : managed {
    key CM              : String(30)  @mandatory;
    key Site            : String(30)  @mandatory;
    key Station         : String(255) @mandatory;
    key Level           : String(255) @mandatory;
    key Group_Priority  : String(18);
    key Aqid            : String(30)  @mandatory;
    key Program         : String(40)  @mandatory;
        Parent_Item     : String(255) null;
        Mp_Intent_Qty   : Integer;
        Scope           : String(32) null;
        Equipment_Type  : String(32) null;
        GH_Site         : String(30);
        SAP_CM_Site     : String(61);
        Dept            : String(18);
        modifiedBy_Name : String(255);
        modifiedBy_mail : String(255);
        createdBy_Name  : String(255);
        createdBy_mail  : String(255);
  }

  @cds.persistence.exists
  entity T_COA_LINE_SUMMARY : managed {
    key CM              : String(30) @mandatory;
    key Site            : String(30) @mandatory;
    key Line            : String(128);
    key Uph             : Integer;
    key Station         : String(128);
    key Program         : String(40);
        Gh_Spl          : Integer;
        GH_Site         : String(30);
        SAP_CM_Site     : String(61);
        modifiedBy_Name : String(255);
        modifiedBy_mail : String(255);
        createdBy_Name  : String(255);
        createdBy_mail  : String(255);
  }

  @cds.persistence.exists
  entity T_COA_RFID_ANNOTATION : managed {
    key CM                  : String(30);
    key Site                : String(40);
    key Building            : String(40);
    key Floor               : String(40);
    key Status              : String(20) default 'DRAFT';
    key Asset_ID            : Decimal(22);
        Rfid                : String(25);
        Alderaan_ID         : String(40);
        Override_LineId     : String(30);
        CarryOverAqid       : String(18);
        CarryOverOldProgram : String(40);
        CarryOverEqName     : String(255);
        isAqidChanged       : Boolean;
        isProgramChanged    : Boolean;
        EquipName           : String(40);
        Program             : String(40);
        Uph                 : Integer;
        LineType            : String(128);
        LineId              : String(250);
        Shape_Guid          : String(50);
        Version_Id          : String(30);
        Comments            : String(150);
        Rfid_XAxis          : Decimal;
        Rfid_YAxis          : Decimal;
        SAP_CM_Site         : String(61);
        modifiedBy_Name     : String(255);
        modifiedBy_mail     : String(255);
        createdBy_Name      : String(255);
        createdBy_mail      : String(255);
  }

}

@cds.persistence.exists
entity![V_RFIDDETAILS]{
  key![Raw_Aqid]            : String(18)   @Core.Computed;
  key![Mapped_Aqid]         : String(18)   @Core.Computed;
  key![Short_Name]          : String(40)   @Core.Computed;
  key![Equipment_Name]      : String(255)  @Core.Computed;
  key![MFR]                 : String(255)  @Core.Computed;
  key![AQID]                : String(18)   @Core.Computed;
  key![TIMESTAMP]           : String(30)   @Core.Computed;
  key![RFID]                : String(25)   @Core.Computed;
  key![AREA]                : String(32)   @Core.Computed;
  key![CM_DEPT]             : String(128)  @Core.Computed;
  key![LOB_NAME]            : String(64)   @Core.Computed;
  key![ALDERAN]             : String(40)   @Core.Computed;
  key![SERNR]               : String(30)   @Core.Computed;
  key![ASSETOWN]            : String(30)   @Core.Computed;
  key![SITE]                : String(30)   @Core.Computed;
  key![CM]                  : String(4)    @Core.Computed;
  key![ZALDR_CMPROGRAM]     : String(128)  @Core.Computed;
  key![ZALDR_SITE]          : String(32)   @Core.Computed;
  key![ZALDR_CM]            : String(32)   @Core.Computed;
  key![STATUS]              : String(5)    @Core.Computed;
  key![createdAt]           : Timestamp    @Core.Computed;
  key![Override_LineId]     : String(30)   @Core.Computed;
  key![CarryOverAqid]       : String(18)   @Core.Computed;
  key![CarryOverEqName]     : String(255)  @Core.Computed;
  key![CarryOverOldProgram] : String(40)   @Core.Computed;
  key![Uph]                 : Integer      @Core.Computed;
  key![LineType]            : String(128)  @Core.Computed;
  key![LineId]              : String(250)   @Core.Computed;
  key![Version_Id]          : String(30)   @Core.Computed;
  key![Transfer_Flag]       : String(1)    @Core.Computed: false;
  key![To_CM]               : String(30)   @Core.Computed: false;
  key![To_Site]             : String(30)   @Core.Computed: false;
  key![To_Program]          : String(40)   @Core.Computed: false;
  key![Tp_Business_Grp]     : String(5000) @Core.Computed: false;
  key![Comments]            : String(80)   @Core.Computed: false;
  key![Approval_Status]     : String(5000) @Core.Computed;
  key![Submit_Dte]          : Date         @Core.Computed;
  key![Submit_By]           : String(5000) @Core.Computed;
  key![Review_Date]         : Date         @Core.Computed;
  key![Reviewed_By]         : String(5000) @Core.Computed;
  key![SAP_CM_Site]         : String(61)   @Core.Computed;
  key![SAP_To_CM_Site]      : String(61)   @Core.Computed;
  key![To_GHSite]           : String(30)   @Core.Computed;
  key![Submit_By_Name]      : String(255)  @Core.Computed;
  key![Submit_By_mail]      : String(255)  @Core.Computed;
  key![Reviewed_By_Name]    : String(255)  @Core.Computed;
  key![Reviewed_By_mail]    : String(255)  @Core.Computed;
  key![modifiedBy_Name]     : String(255)  @Core.Computed;
  key![modifiedBy_mail]     : String(255)  @Core.Computed;
  key![createdBy_Name]      : String(255)  @Core.Computed;
  key![createdBy_mail]      : String(255)  @Core.Computed;
     virtual![ErrorMsg]     : String(600);
}

@cds.persistence.exists
entity V_NONRFID {
  key CM             : String(30) not null  @title: 'CM';
  key Site           : String(30) not null  @title: 'SITE';
  key Program        : String(40) not null  @title: 'PROGRAM';
  key Aqid           : String(255) not null @title: 'AQID';
  key Station        : String(18) not null  @title: 'STATION';
  key Scope          : String(32) not null  @title: 'SCOPE';
  key GH_Site        : String(30)           @title: 'GH_SITE';
  key SHORT_NAME     : String(255)          @title: 'SHORT_AQID';
  key Line           : String(128) not null @title: 'LINE_TYPE';
  key Group_Priority : String(18)           @title: 'GROUP_PRIORITY';
      Parent_Item    : String(255);
      ALT_Station    : Integer;
      grp            : String(18);
      Prio           : String(18);
      Uph            : Integer              @title: 'UPH';
      SPL            : Integer              @title: 'SPL';
      QPL            : Integer              @title: 'QPL';
      BOH            : Integer              @title: 'BOH';
      Carry_Over     : Integer              @title: 'CARRY_OVER';
  key RFID_Scope     : String(1) not null   @title: 'RFID_SCOPE';
      Equipment_Name : String(255)          @title: 'EQUIPMENT_NAME';
      Equipment_Type : String(32)           @title: 'EQUIPMENT_TYPE';
  key Mfr            : String(255) not null @title: 'MFR';
      Dept           : String(18)           @title: 'DEPT';
      Group          : Integer              @title: 'GROUP';
  key LineId         : String(250)           @title: 'LINEID';
  key confLevel      : Decimal(25, 6)       @title: 'CONFLEVEL';

}

@cds.persistence.exists
entity V_NONRFID_TT : managed {
  key ID               : String(36) default ''  @Core.Computed: true;
  key GH_Site          : String(30) default ''  @Core.Computed: true;
  key CM               : String(30) default ''  @Core.Computed: true;
  key Site             : String(30) default ''  @Core.Computed: true;
  key Program          : String(40) default ''  @Core.Computed: true;
  key Line_Type        : String(80) default ''  @Core.Computed: true;
  key Uph              : Integer default 0      @Core.Computed: true;
  key Aqid             : String(18) default ''  @Core.Computed: true;
  key Station          : String(128) default '' @Core.Computed: true;
  key Scope            : String(32) default ''  @Core.Computed: true;
  key Line_Id          : String(250) default ''  @Core.Computed: true;
      Parent_Item      : String(255) default '' @Core.Computed: true;
      Alt_Station      : Integer default 0      @Core.Computed: true;
  key Group_Priority   : String(18) default ''  @Core.Computed: true;
  key Sequence_No      : Integer default 0      @Core.Computed: true;
  key Split            : String(1)              @Core.Computed: true;
      Equipment_Name   : String(255)            @Core.Computed: true;
      confLevel        : Integer                @Core.Computed: true;
      Projected_Qty    : Integer                @Core.Computed: true;
      Transfer_Qty     : Integer                @Core.Computed: false;
  key Mfr              : String(255)            @Core.Computed: true;
      BusinessGrp      : String(18)             @Core.Computed: true;
      SAP_CM_Site      : String(61)             @Core.Computed: true;
      SAP_To_CM_Site   : String(61)             @Core.Computed: false;
      Dept             : String(18)             @Core.Computed: true;
      RFID_Scope       : String(32)             @Core.Computed: true;
      LastSyncDate     : Date                   @Core.Computed: true;
      Group_ID         : Integer                @Core.Computed: true;
      Line_Priority    : String(80)             @Core.Computed: true;
      Equipment_Type   : String(32)             @Core.Computed: true;
      To_CM            : String(30)             @Core.Computed: true;
      To_Site          : String(30)             @Core.Computed: true;
      To_Program       : String(40)             @Core.Computed: false;
      To_Business_Grp  : String(18)             @Core.Computed: false;
      To_GHSite        : String(30)             @Core.Computed: false;
      Transfer_Flag    : String(1)              @Core.Computed: false;
      Comments         : String(80)             @Core.Computed: false;
      Status           : String(18)             @Core.Computed: true;
      Submit_Date      : Date                   @Core.Computed: true;
      Submit_By        : String                 @Core.Computed: true;
      Review_Date      : Date                   @Core.Computed: true;
      Reviewed_By      : String                 @Core.Computed: true;
      modifiedBy_Name  : String(255)            @Core.Computed: true;
      modifiedBy_mail  : String(255)            @Core.Computed: true;
      createdBy_Name   : String(255)            @Core.Computed: true;
      createdBy_mail   : String(255)            @Core.Computed: true;
      Submit_By_Name   : String(255)            @Core.Computed: true;
      Submit_By_mail   : String(255)            @Core.Computed: true;
      Reviewed_By_Name : String(255)            @Core.Computed: true;
      Reviewed_By_mail : String(255)            @Core.Computed: true;
      Mapped_Aqid      : String(18)             @Core.Computed: true;
}

@cds.persistence.exists
entity V_SIMULATION : managed {

  key Simulation_name : String(255);
  key From_GHSite     : String(30);
  key Program         : String(40);
  key CM              : String(30);
  key Site            : String(30);
  key Line_ID         : String(250);
      Line_Type       : String(80);
      To_GHSite       : String(30);
      To_CM           : String(30);
      To_Site         : String(30);
      To_Program      : String(40);
      To_Business_Grp : String(18);
      createdAt       : Date;
      createdBy       : String(255);
      modifiedAt      : Date;
      modifiedBy      : String(255);

}

@cds.persistence.exists
entity V_CO_SIMU  {
  key FROM_GHSITE : String(255);
  key FROM_PRODUCT     : String(30);
  key FROM_BUSINESS_GRP         : String(40);
  key TO_PRODUCT              : String(30);
  key TO_CM            : String(30);
  key TO_SITE         : String(80);
  key TO_BUSINESS_GRP       : String(80);
  key APPLE_ID       : String(30);
  key QUANTITY           : String(30);
  key COMMENT         : String(30);
  key MATCH_STATUS      : String(40);
  key MATCH_QTY : Integer;
  key MISMATCH_QTY       : Integer;
  key SOURCE       : String(15);
  key LINE_ID         : String(250);
  key LINE_TYPE         : String(80);
}
