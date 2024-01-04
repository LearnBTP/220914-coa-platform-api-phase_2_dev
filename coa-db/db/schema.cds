using {
    managed,
    sap.common.CodeList as CodeList,
    cuid
} from '@sap/cds/common';

context com.apple.coa {


    type CONSUMABLE_DEFAULT : String(1) enum {
        Yes = 'Y';
        No  = 'N';
    }

    entity T_COA_AQID_MAIN : managed {
        key CM              : String(30)         @mandatory;
        key Site            : String(30)         @mandatory;
        key Aqid            : String(18)         @mandatory;
        key Mfr             : String(255)        @mandatory;
        key Program         : String(40);
            @mandatory
            Equipment_Name  : String(255);
            Category        : String(255);
            Sub_Category    : String(255) null;
            Po_Type         : String(32) null;
            Release_Qty     : Integer null;
            Consumables     : CONSUMABLE_DEFAULT @assert.range;
            Stack_item      : String(1);
            PO_Qty          : Integer null;
            PR_Qty          : Integer null;
            Spare_Qty       : Integer null;
            Spare_Rate      : Integer null;
            GH_Site         : String(30);
            SAP_CM_Site     : String(61);
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    }

    annotate T_COA_AQID_MAIN with @(

    cds.odata.valuelist) {
        Consumables @(
            title                           : 'Consumable',
            assert.enum,
            Common.ValueListWithFixedValues : true,
        /*   Common.ValueList                : {
               CollectionPath : 'CONSUMABLESDESC',
               Parameters     : [
                   {
                       $Type             : 'Common.ValueListParameterInOut',
                       LocalDataProperty : 'CONSUMABLES',
                       ValueListProperty : 'CONSUMABLES'
                   },
                   {
                       $Type             : 'Common.ValueListParameterDisplayOnly',
                       ValueListProperty : 'episodeIDDesc'
                   }
               ]
           } */
        );
    };


    /* annotate T_COA_AQID_MAIN with {
        code
        @(
            Common : {
                Text : name,
                TextArrangement : #TextOnly,
                ValueList : {
                    Label : '{i18n>ChangeEvent}', CollectionPath : 'ChangeEvent',
                    Parameters : [ { $Type : 'Common.ValueListParameterInOut', ValueListProperty : 'code', LocalDataProperty : code }, { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name', } ]
                }
            }
        );
    }; */

    entity T_COA_BOM_STRUCTURE : managed {
        key CM              : String(30)  @mandatory;
        key Site            : String(30)  @mandatory;
        key Station         : String(255) @mandatory;
        key Level           : String(255) @mandatory;
        key Group_Priority  : String(18);
        key Aqid            : String(30)  @mandatory;
        key Program         : String(40)  @mandatory;
            Parent_Item     : String(255) null;
            Mp_Intent_Qty   : Decimal(15,2);
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

    entity T_COA_LINE_BRING_UP : managed {
        key CM              : String(30) @mandatory;
        key Site            : String(30);
        key Line            : String(128);
        key Uph             : Integer;
        key Station         : String(128);
        key Program         : String(40);
            WW              : String;
            Line_Qty        : Integer null;
            Floor_Qty       : Integer null;
            Building_Qty    : Integer null;
            Site_Qty        : Integer;
            GH_Site         : String(30);
            SAP_CM_Site     : String(61);
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    }

    entity T_COA_STATION_SUMMARY : managed {
        key CM              : String(30) @mandatory;
        key Site            : String(30) @mandatory;
        key Line            : String(128);
        key Station         : String(128);
        key Program         : String(40);
            Display_Name    : String(255);
            ALT_Station     : Integer null;
            Group           : Integer null;
            GH_Site         : String(30);
            SAP_CM_Site     : String(61);
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    }

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

    entity T_COA_SYNC_AQID_STATUS : managed {
        key Log_Id          : String @mandatory;
            Status          : String;
            ReasonForStatus : String;
            DateGND         : Timestamp;
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    }

    entity T_COA_MAIN_LINE : managed {
        key CM                  : String(30);
        key Site                : String(30);
        key Program             : String(40);
            Uph                 : Integer ;
            BoH                 : Integer;
            Fatp_Sustaining_Qty : Integer;
            Working_Hrs         : Integer;
            Efficiency_Field    : Integer;
            Comment             : String(150);
            SAP_CM_Site         : String(61);
            GH_Site             : String(30);
            modifiedBy_Name     : String(255);
            modifiedBy_mail     : String(255);
            createdBy_Name      : String(255);
            createdBy_mail      : String(255);
    }


    entity T_COA_SUBLINE : managed {
        key CM                     : String(30);
        key Site                   : String(30);
        key Program                : String(40);
        key Sub_Line_Name          : String(80);
        key Uph                    : Integer default 0;
            Yield                  : Integer;
            boH_Qty                : Integer;
            Working_Hrs            : Integer;
            Remote_Site_Cap_Demand : Integer;
            Comment                : String(150);
            SAP_CM_Site            : String(61);
            GH_Site                : String(30);
            modifiedBy_Name        : String(255);
            modifiedBy_mail        : String(255);
            createdBy_Name         : String(255);
            createdBy_mail         : String(255);
    }

    entity T_COA_AQID_MAPPING : managed {
        key Raw_Aqid            : String(18);
        key Mapped_Aqid         : String(18);
            Cm_Recommendation   : String(18);
        key Program             : String(40);
        key Station             : String(128);
        key Site                : String(30);
        key CM                  : String(30);
        key GH_Site             : String(30);
            Stack_Item          : String(1);
            Make_Aqid           : String(18);
            Short_Name          : String(40);
            Equipment_Name      : String(255);
            MFR                 : String(255);
            Recommendation_Type : String(18) @assert.range enum {
                SystemRecommended   = 'S';
                Exceptions          = 'E';
                UserRecommendations = 'U'
            };
            TimeStamp           : String(18);
            Update_By_User      : String(18);
            Comment             : String(150);
            SAP_CM_Site         : String(61);
            modifiedBy_Name     : String(255);
            modifiedBy_mail     : String(255);
            createdBy_Name      : String(255);
            createdBy_mail      : String(255);
            Update_By_Name      : String(255);
            Update_By_mail      : String(255);
            virtual Error       : String(150);
            virtual Edit        : Integer;
    }

    entity T_COA_RFID_TT : managed {
        Asset_ID             : Decimal(22) default 0;
        Mapped_Aqid          : String(18);
        key Aqid             : String(18);
        key CM               : String(30);
        key Site             : String(30);
        key CM_Program       : String(40);
        key Rfid             : String(25);
        key Line_Id          : String(250);
        key Uph              : Integer;
        key Version          : String(30);
            Serial_Number    : String(30);
            Line_Type        : String(80);
            Transfer_Flag    : String(1);
            To_CM            : String(30);
            To_Site          : String(30);
            To_Program       : String(40);
            Tp_Business_Grp  : String;
            To_Business_Grp  : String;
            Comments         : String(80);
            Approval_Status  : String;
            Submit_Dte       : Date;
            Submit_By        : String;
            Review_Date      : Date;
            Reviewed_By      : String;
            SAP_CM_Site      : String(61);
            SAP_To_CM_Site   : String(61);
            To_GHSite        : String(30);
            modifiedBy_Name  : String(255);
            modifiedBy_mail  : String(255);
            createdBy_Name   : String(255);
            createdBy_mail   : String(255);
            Submit_By_Name   : String(255);
            Submit_By_mail   : String(255);
            Reviewed_By_Name : String(255);
            Reviewed_By_mail : String(255);
            SITE_TABLE_UPDATE_TS: String(50) default '';
            AREA_TABLE_UPDATE_TS: String(50) default '';
            TABLE_UPDATE_TS: String(50) default '';
            Reset_Flag: String(12);
    }

    entity T_COA_3DV_HEADER : managed {
        key Building             : String(40);
        key Floor                : String(40);
        key Site                 : String(40);
        key CM                   : String(20);
        key Status               : String(20) default 'DRAFT';
            Alderaan_Site        : String(40);
            Alderaan_CM          : String(20);
            Scan_Start_Date      : DateTime;
            Scan_End_Date        : DateTime;
            Area                 : String(20);
            Image_FileName       : String(50);
            Image_FileId         : String(80);
            Origin_X             : Decimal;
            Origin_Y             : Decimal;
            Scale_X              : Decimal;
            Scale_Y              : Decimal;
            Orientation_X        : String(20);
            Orientation_Y        : String(20);
            Line                 : String(40);
            ImageWidth           : Integer;
            ImageHeight          : Integer;
            Last_Active_Date     : DateTime;
            Last_Active_User     : String;
            Lock                 : String(1);
            SAP_CM_Site          : String(61);
            modifiedBy_Name      : String(255);
            modifiedBy_mail      : String(255);
            createdBy_Name       : String(255);
            createdBy_mail       : String(255);
            Last_Active_UserName : String(255);
            Last_Active_UserMail : String(255);
    }

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
            EquipName           : String(255);
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
            Line_Priority       : Integer;
    }

    entity T_COA_SHAPES : managed {
        key Floor             : String(40);
        key Site              : String(40);
        key CM                : String(20);
        key Building          : String(40);
        key Shape_Guid        : String(50);
        key Status            : String(20) default 'DRAFT';
            Uph               : Integer;
            LineType          : String(128);
            LineId            : String(250);
            Shape_Name        : String(40);
            Shape_Type        : String(20);
            Shape_Color       : String(20);
            rfidMoved         : Boolean;
            ConfirmedBy       : String;
            ConfirmedOn       : DateTime;
            ConfirmedRequired : Boolean;
            SAP_CM_Site       : String(61);
            Shape_Vertices    : Composition of many T_COA_VERTICES
                                    on  Shape_Vertices.Shape_Guid = Shape_Guid
                                    and Shape_Vertices.Status     = Status;
            modifiedBy_Name   : String(255);
            modifiedBy_mail   : String(255);
            createdBy_Name    : String(255);
            createdBy_mail    : String(255);
            ConfirmedBy_Name  : String(255);
            ConfirmedBy_mail  : String(255);
            Line_Priority     : Integer;
    }

    entity T_COA_VERTICES : managed {
        key Shape_Guid      : String(50);
        key Status          : String(20) default 'DRAFT';
        key Vertices_X      : Integer;
        key Vertices_Y      : Integer;
            Sequence_No     : Integer;
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    }

    entity T_COA_OUTPUT : managed {
        key From_CM           : String(30);
        key From_Site         : String(30);
        key From_Product      : String(40);
        key AQID              : String(18);
        key To_CM             : String(30);
        key To_Site           : String(30);
        key To_Product        : String(40);
        key CO_Type           : String(10) default '';
            From_GHSite       : String(30);
            To_GHSite         : String(30);
            From_Business_Grp : String(50);
            To_Business_Grp   : String(50);
            EQ_Name           : String(255);
            MFR               : String(225);
            Quantity          : Decimal(15, 2);
            CM_Balance_Qty    : Decimal(15, 2);
            Approved_By       : String;
            Review_Date       : Timestamp;
            Status            : String(20);
            Comment           : String(80);
            SAP_CM_Site       : String(61);
            SAP_To_CM_Site    : String(61);
            modifiedBy_Name   : String(255);
            modifiedBy_mail   : String(255);
            createdBy_Name    : String(255);
            createdBy_mail    : String(255);
            Approved_By_Name  : String(255);
            Approved_By_mail  : String(255);
    }

    entity T_COA_CHANGE_HISTORY : managed {
        key Table           : String;
        key Key_Fields      : String;
        key Field_Name      : String(40);
        key Action_Type     : String(20);
        key modifiedAt      : Timestamp    @cds.on.insert : $now   @cds.on.update : $now;
            modifiedBy      : String(128)  @cds.on.insert : $user  @cds.on.update : $user;
            Old_Value       : String;
            New_Value       : String(128);
            CM              : String(30);
            Site            : String(30);
            To_CM           : String(30);
            To_Site         : String(30);
            SAP_CM_Site     : String(61);
            SAP_To_CM_Site  : String(61);
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    }

    entity T_COA_GH_SITE_MAPPING : managed {
        key CM              : String(30);
        key Site            : String(30);
            GH_Site         : String(30);
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    }

    entity T_COA_NONRFID_TT : managed {
        ID                   : String(36) not null  @title: 'ID' default ''; 
        GH_Site              : String(30) default '';
        key CM               : String(30) default '';
        key Site             : String(30) default '';
        key Program          : String(40) default '';
        key Line_Type        : String(80) default '';
        key Uph              : Integer default 0;
        key Aqid             : String(18) default '';
            Mapped_Aqid      : String(18);
        key Station          : String(128) default '';
        key Scope            : String(32) default '';
        key Line_Id          : String(250) default '';
            Parent_Item      : String(255) default '';
            Alt_Station      : Integer default 0;
        key Group_Priority   : String(18) default '';
        key Sequence_No      : Integer default 0;
            Split            : String(1) default '' ;
            Equipment_Name   : String(255);
            confLevel        : Decimal(15,2);
            Projected_Qty    : Decimal(15,2) default 0;
            Transfer_Qty     : Decimal(15,2) default 0;
            Override_Qty     : Decimal(15,2) default 0;
        Key Mfr              : String(255);
            BusinessGrp      : String(18);
            SAP_CM_Site      : String(61);
            SAP_To_CM_Site   : String(61);
            Dept             : String(18);
            RFID_Scope	     : String(32);
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
            Error            : String(150);
            Reset_Flag: String(12);
    }

    entity T_COA_NONRFID_PROJECTION : managed {
            ID: String(36) not null  @title: 'ID' ; 
        key CM              : String(30);
        key Site            : String(30);
            // GH_Site         : String(30) default '';
        key Program         : String(40) default '';
        key Station         : String(128) default '';
        key Aqid            : String(255) default '';
            Scope           : String(32) default '';
            // Po_Type         : String(32) default '';
        key Uph             : Integer default 0;
        key Line            : String(128) default '';
        key Level           : String(255) default '';
            // Group           : Integer default 0;
            // Parent_Item     : String(255) default '';
            // Release_Qty     : Integer default 0;
            // Spare_Qty       : Integer default 0;
            // Spare_Rate      : Integer default 0;
            // ALT_Station     : Integer default 0;
        key Group_Priority  : String(18) default '';
            // Equipment_Name  : String(255) default '';
        key Mfr  : String(255) default '';
            // Short_AQID      : String(255);
            // Line_Type       : String(128);
            // SPL             : Integer;
            Balance_Qty        : Decimal(15,2) default 0;
            QPL_User           : Integer;
            // BOH             : Integer;
            Carry_Over      : Integer;
            RFID_Scope      : String(1);
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
            Dept       : String(128);
    }

    entity T_COA_RFID_UNSCANNABLE_TT : managed, cuid {
        key GH_Site           : String(30) ;
        key CM                : String(30) ;
        key Site              : String(30) ;
        key Program           : String(40) ;
        key AQID              : String(18) ;
        key Sequence_No       : Integer;
            From_Business_Grp : String(18) ;
            NPI_Indicator     : String(10);
            Projected_Qty     : Integer;
            Flex_Kits         : String(1)  ;
            Transfer_Flag     : String(1)  ;
            To_GHSite         : String(30) ;
            To_CM             : String(30) ;
            To_Site           : String(30) ;
            To_Program        : String(40) ;
            To_Business_Grp   : String(18) ;
            Qty               : Integer    ;
            Status            : String(25) ;
            Review_Date       : Timestamp  ;
            Reviewed_By       : String     ;
            modifiedBy_Name   : String(255);
            modifiedBy_mail   : String(255);
            createdBy_Name    : String(255);
            createdBy_mail    : String(255);
            Reviewed_By_Name  : String(255);
            Reviewed_By_mail  : String(255);
            SAP_CM_Site       : String(61) ;
            SAP_To_CM_Site    : String(61) ;
            Comment           : String(80);
            Error             : String(150);
            Mapped_Aqid       : String(18);
            Reset_Flag        : String(12);
    }

    entity T_COA_NPI_PROGRAM : managed {
        key Program : String(40);
        Program_Description :  String(255);
        modifiedBy_Name   : String(255);
        modifiedBy_mail   : String(255);
        createdBy_Name    : String(255);
        createdBy_mail    : String(255);
    }

    entity  T_COA_SYNC_STATUS : managed , cuid {
        key GH_Site : String(30);
        key Program: String(40) default '';
        key App : String(20);
        createdBy_Name    : String(255);
        createdBy_mail    : String(255);
        Status : String(20);
        Error : String(255);
    }

    entity T_COA_SIMU_RFID : managed {
        key Simulation_name : String(255) default '';
        key GHSite          : String(30) default '';
        key To_CM           : String(30) default '';
        key To_Site         : String(30) default '';
            To_GhSite       : String(30) ;
        key To_Program      : String(40) default '';
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
        key Line_Id         : String(250) default '';
            Line_Type       : String(128);
            UPH             : Integer;
            CM              : String(4);
        key Site            : String(30) default '';
        key CM_Program      : String(40) default '';
            Transfer_Flag   : String(1);
            Match_Status    : String(18);
            Match_Qty       : Integer;
            Mismatch_Qty    : Integer;
        key RFID            : String;
        key AQID            : String;
    }



  entity T_COA_SIMU_NONRFID : managed {
    key Simulation_name  : String(255);
    key GH_Site          : String(30);
    key CM               : String(30);
    key Site             : String(30);
    key Program          : String(40);
    key Aqid             : String(18);
    key Mapped_Aqid      : String(18) default '';
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

  entity T_COA_SIMU_CO : managed {
        key Simulation_name   : String(255) default '';
        key From_GHSite       : String(30) default '';
        key From_Product      : String(40) default '';
        key From_Business_Grp : String(50);
        key To_Product        : String(40) default '';
        key To_Site           : String(30) default '';
        key To_Business_Grp   : String(50);
        key Apple_Id          : String(18);
        key CO_Type           : String(10) default '';
        Quantity          : Integer;
        Comment           : String(150);
        Match_Status      : String(18);
        Match_Qty         : Integer;
        Mismatch_Qty      : Integer;
  }
  entity T_COA_TEMP : managed , cuid {
    key GUID : UUID;
    From_GHSite       : String(30);
    GH_Site           : String(30) ;
    CM                : String(30) ;
    Site              : String(30) ;
    Program           : String(40) ;
    Line         : String(80);
    From_Business_Grp : String(18) ;
    Line_Type         : String(80);
    Uph               : Integer    ;
    Level             : String(255);
    Mfr               : String(255);
    Sequence_No       : Integer;
    From_CM           : String(30);
    From_Site         : String(30);
    From_Product      : String(40);
    To_CM             : String(30);
    To_Site           : String(30);
    To_Product        : String(40);
    Aqid              : String(18);
    Mapped_AQID       : String(18);
    Station           : String(255);
    Scope             : String(32);
    Line_Id           : String(250);
    Parent_Item       : String(255) ;
    Alt_Station       : Integer;
    Group_Priority    : String(18) ;
    Grp               : String(18) ;
    To_GHSite         : String(30);
    To_Program        : String(40);
    NPI_Indicator     : String(10);
    GROUP: Integer;
    CREATEDBY_NAME: String(255);
    CREATEDBY_MAIL: String(255);
    SAP_CM_SITE: String(10);
    DISPLAY_NAME: String(255);
    STATUSDATA: String(1);
    Equipment_Name  : String(255);
    Category        : String(255);
    Sub_Category    : String(255);
    Po_Type         : String(32);
    Release_Qty     : Integer ;
    Consumables     : CONSUMABLE_DEFAULT @assert.range;
    Stack_item      : String(1);
    PO_Qty          : Integer null;
    PR_Qty          : Integer null;
    Spare_Qty       : Integer null;
    Spare_Rate      : Integer null;
    modifiedBy_Name : String(255);
    modifiedBy_mail : String(255);
    Mp_Intent_Qty   : Decimal(15,2);
    Equipment_Type  : String(32) null;
    Dept            : String(18);
    WW              : String;
    Line_Qty        : Integer null;
    Floor_Qty       : Integer null;
    Building_Qty    : Integer null;
    Site_Qty        : Integer;
    Gh_Spl          : Integer;
    ASSET_ID        : String(22);
    SHORT_NAME      : String(40);
    SPL             : Integer;
    QPL             : Integer;
    RFID_Scope	     : String(32);
  }

//     entity T_COA_ROLES : managed {
//     key AppId: String(20);
//     key RoleCollection : String(100);
//     key Scope : String(100);
//     key CM_Site : String(61);
//   }

    entity T_COA_SIMULATION : managed {
        key Simulation_name : String(255);
            UserId          : String(30);
            Status          : String(30);
    }

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
    }

}


@cds.persistence.exists
entity![V_AQIDANDBOMJOIN]{
    key![createdBy]      : String(255);
    key![modifiedBy]     : String(255);
    key![CM]             : String(30);
    key![Site]           : String(30);
    key![Aqid]           : String(18);
    key![Mfr]            : String(255);
    key![Station]        : String(255);
    key![Program]        : String(40);
    key![Equipment_Name] : String(255);
    key![Stack_item]     : String(1);
    key![GH_Site]        : String(30);
    key![Group_Priority] : String(18);
    key![Equipment_Type] : String(32);
    key![createdAt]      : Timestamp;
    key![modifiedAt]     : Timestamp;
//    modifiedBy_Name   : String(255);
//    modifiedBy_mail   : String(255);
//    createdBy_Name    : String(255);
//    createdBy_mail    : String(255);
}
