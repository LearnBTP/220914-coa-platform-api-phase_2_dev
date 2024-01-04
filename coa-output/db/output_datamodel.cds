using { managed, sap
      } from '@sap/cds/common';

context com.apple.coa {

@cds.persistence.exists
entity T_COA_OUTPUT : managed {
    key From_CM : String(30) @Core.Computed : true ;
    key From_Site : String(30) @Core.Computed : true ;
    key From_Product : String(40) @Core.Computed : true ;
    key AQID : String(18) @Core.Computed : true ;
    key To_CM : String(30) @Core.Computed : true ;
    key To_Site : String(30) @Core.Computed : true ;
    key To_Product : String(40) @Core.Computed : true;
    key CO_Type : String(10) @Core.Computed : true;
    From_GHSite : String(30) @Core.Computed : true;
    To_GHSite : String(30) @Core.Computed : true;
    From_Business_Grp : String(50) @Core.Computed : true ;
    To_Business_Grp : String(50) @Core.Computed : true ;
    EQ_Name : String(255) @Core.Computed : true ;
    MFR : String(225) @Core.Computed : true ;
    Quantity : Decimal(15, 2) @Core.Computed : true ;
    CM_Balance_Qty : Decimal(15, 2) @Core.Computed : false ;
    Approved_By : String ;
    Review_Date : Timestamp ;
    Status: String(20)  @assert.range enum { New; Pending;
                              Approved; Rejected};
    Comment : String(150) @Core.Computed : false ;
    SAP_CM_Site : String(61) @Core.Computed : true;
    SAP_To_CM_Site : String(61) @Core.Computed : true;
    modifiedBy_Name   : String(255);
    modifiedBy_mail   : String(255);
    createdBy_Name    : String(255);
    createdBy_mail    : String(255);
    Approved_By_Name  : String(255);
    Approved_By_mail  : String(255);    
    virtual BeError: String(150) @Core.Computed : true ;
    virtual Edit              : Integer @Core.Computed : true ;
}
}

@cds.persistence.calcview
@cds.persistence.exists 
Entity ![V_OUTPUT] {
key     ![createdAt]: Timestamp  ; 
key     ![createdBy]: String(255)  ; 
key     ![modifiedAt]: Timestamp ;
key     ![modifiedBy]: String(255) ; 
key     ![From_CM]: String(30)  ; 
key     ![From_Site]: String(30) ; 
key     ![From_Product]: String(40)  ; 
key     ![AQID]: String(18) ; 
key     ![To_CM]: String(30)  ; 
key     ![To_Site]: String(30) ; 
key     ![To_Product]: String(40)  ; 
key     ![From_GHSite]: String(30) ; 
key     ![To_GHSite]: String(30) ; 
key     ![From_Business_Grp] : String(50);
key     ![To_Business_Grp] : String(50);
key     ![EQ_Name]: String(255)   ; 
key     ![MFR]: String(255)  ; 
key     ![Quantity] : Decimal(15, 2);
key     ![CM_Balance_Qty]: Decimal(15, 2);
key     ![Approved_By]: String  ; 
key     ![Review_Date]: Timestamp ; 
key     ![Status]: String(20) ; 
key     ![Comment]: String(80) ; 
key     ![SAP_CM_Site]: String(61) ; 
key     ![SAP_To_CM_Site]: String(61) ; 
key     ![SHORT_NAME] : String(40);
key     ![modifiedBy_Name]   : String(255);
key     ![modifiedBy_mail]   : String(255);
key     ![createdBy_Name]    : String(255);
key     ![createdBy_mail]    : String(255);
key     ![Approved_By_Name]  : String(255);
key     ![Approved_By_mail]  : String(255); 
key     ![CO_Type] : String(10);
virtual ![BeError]: String(150);
virtual ![Edit]              : Integer @Core.Computed : true ;
}

@cds.persistence.calcview
@cds.persistence.exists 
Entity ![V_OUTPUT_EXPORT] {
key     ![From_GHSite]: String(30) ; 
key     ![From_CM]: String(30)  ; 
key     ![From_Site]: String(30) ; 
key     ![From_Product]: String(40)  ; 
key     ![From_Business_Grp] : String(50);
key     ![AQID]: String(18) ; 
key     ![To_GHSite]: String(30) ; 
key     ![To_CM]: String(30)  ; 
key     ![To_Site]: String(30) ; 
key     ![To_Product]: String(40)  ; 
key     ![To_Business_Grp] : String(50);
key     ![Quantity] : Decimal(15, 2);
}

