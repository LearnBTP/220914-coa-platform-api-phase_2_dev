using { managed, sap
      } from '@sap/cds/common';

context com.apple.coa {   
@cds.persistence.exists
entity T_COA_MAIN_LINE : managed {
    Key CM : String(30) @Core.Computed : true ;
    key Site : String(30) @Core.Computed : true ;
    key Program : String(40) @Core.Computed : true ;
        Uph : Integer @Core.Computed : false ;
    BoH : Integer @Core.Computed : false ;
    Fatp_Sustaining_Qty : Integer @Core.Computed : false ;
    Working_Hrs : Integer @Core.Computed : false ;
    Efficiency_Field : Integer @Core.Computed : false ;
    Comment : String(150) @Core.Computed : false ;
    SAP_CM_Site : String(61) @Core.Computed : true;
    GH_Site : String(30) @Core.Computed : false;
    modifiedBy_Name     : String(255) @Core.Computed : true ;
    modifiedBy_mail     : String(255) @Core.Computed : true ;
    createdBy_Name      : String(255) @Core.Computed : true ;
    createdBy_mail      : String(255) @Core.Computed : true ;
    virtual Error: String(150) @Core.Computed : true ;
     virtual Edit              : Integer @Core.Computed : true ;
}
 
@cds.persistence.exists
entity T_COA_SUBLINE : managed {
    Key CM : String(30) @Core.Computed : true;
    key Site : String(30) @Core.Computed : true;
    key Program : String(40) @Core.Computed : true;
    key Sub_Line_Name : String(80) @Core.Computed : true;
    key Uph : Integer @Core.Computed : true; 
    Yield: Integer @Core.Computed : false ;
    boH_Qty : Integer @Core.Computed : false ;
    Working_Hrs : Integer @Core.Computed : false;
    Remote_Site_Cap_Demand : Integer @Core.Computed : false;
    Comment : String(150) @Core.Computed : false;
    SAP_CM_Site : String(61) @Core.Computed : true;
    GH_Site : String(30) @Core.Computed : false;
    modifiedBy_Name     : String(255) @Core.Computed : true ;
    modifiedBy_mail     : String(255) @Core.Computed : true ;
    createdBy_Name      : String(255) @Core.Computed : true ;
    createdBy_mail      : String(255) @Core.Computed : true ;
    virtual Error: String(150) @Core.Computed : true;
    virtual Edit              : Integer @Core.Computed : true ;
}

@cds.persistence.exists
entity T_COA_RFID_TT : managed {
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
    }
}



