using { managed, sap
      } from '@sap/cds/common';

context com.apple.coa {   

}

@cds.persistence.exists 
Entity ![V_RFIDDETAILS] {
key     ![Raw_Aqid]: String(18) @Core.Computed  ; 
key     ![Mapped_Aqid]: String(18) @Core.Computed ; 
key     ![Short_Name]: String(40) @Core.Computed ; 
key     ![Equipment_Name]: String(255)  @Core.Computed ; 
key     ![MFR]: String(255)  @Core.Computed ; 
key     ![AQID]: String(18) @Core.Computed ; 
key     ![TIMESTAMP]: String(30) @Core.Computed ; 
key     ![RFID]: String(25)  @Core.Computed ;
key     ![AREA]: String(32)  @Core.Computed ; 
key     ![CM_DEPT]: String(128)  @Core.Computed ; 
key     ![LOB_NAME]: String(64)  @Core.Computed ;  
key     ![ALDERAN]: String(40) @Core.Computed ; 
key     ![SERNR]: String(30) @Core.Computed  ; 
key     ![ASSETOWN]: String(30) @Core.Computed ; 
key     ![SITE]: String(30) @Core.Computed  ; 
key     ![CM]: String(4) @Core.Computed  ; 
key     ![ZALDR_CMPROGRAM]: String(128)  @Core.Computed ; 
key     ![ZALDR_SITE]: String(32)  @Core.Computed ; 
key     ![ZALDR_CM]: String(32)  @Core.Computed ; 
key     ![STATUS]: String(5)  @Core.Computed ; 
key     ![createdAt]: Timestamp @Core.Computed  ; 
key     ![Override_LineId]: String(30) @Core.Computed ; 
key     ![CarryOverAqid]: String(18) @Core.Computed ; 
key     ![CarryOverEqName]: String(255) @Core.Computed  ; 
key     ![CarryOverOldProgram]: String(40) @Core.Computed ; 
key     ![Uph]: Integer @Core.Computed ; 
key     ![LineType]: String(128) @Core.Computed ; 
key     ![LineId]: String(250) @Core.Computed ; 
key     ![Version_Id]: String(30) @Core.Computed ; 
key     ![Transfer_Flag]: String(1) @Core.Computed : false ; 
key     ![To_CM]: String(30) @Core.Computed : false ; 
key     ![To_Site]: String(30) @Core.Computed : false ; 
key     ![To_Program]: String(40) @Core.Computed : false  ; 
key     ![Tp_Business_Grp]: String(5000) @Core.Computed : false ; 
key     ![Comments]: String(80) @Core.Computed : false ; 
key     ![Approval_Status]: String(5000) @Core.Computed  ; 
key     ![Submit_Dte]: Date @Core.Computed  ; 
key     ![Submit_By]: String(5000) @Core.Computed  ; 
key     ![Review_Date]: Date @Core.Computed ; 
key     ![Reviewed_By]: String(5000) @Core.Computed ; 
key     ![SAP_CM_Site]: String(61) @Core.Computed ; 
key     ![SAP_To_CM_Site]: String(61) @Core.Computed ;
key     ![To_GHSite]: String(30) @Core.Computed ;
key     ![Submit_By_Name]: String(255) @Core.Computed ;
key     ![Submit_By_mail]: String(255) @Core.Computed ;
key     ![Reviewed_By_Name]: String(255) @Core.Computed ;
key     ![Reviewed_By_mail]: String(255) @Core.Computed ;
key     ![modifiedBy_Name]: String(255) @Core.Computed ;
key     ![modifiedBy_mail]: String(255) @Core.Computed ;
key     ![createdBy_Name]: String(255) @Core.Computed ;
key     ![createdBy_mail]: String(255) @Core.Computed ;
key     ![modifiedAt]: Timestamp @Core.Computed ;
key     ![Reset_Flag]: String(12) @Core.Computed ;
virtual ![ErrorMsg]: String(600);
virtual ![Edit] : Integer;
}
