using { managed, sap
      } from '@sap/cds/common';

context com.apple.coa {   
@cds.persistence.exists
entity T_COA_NPI_PROGRAM : managed {
        key Program : String(40) @Core.Computed : true ;
        Program_Description :  String(255);
        modifiedBy_Name     : String(255) @Core.Computed : true ;
        modifiedBy_mail     : String(255) @Core.Computed : true ;
        createdBy_Name      : String(255) @Core.Computed : true ;
        createdBy_mail      : String(255) @Core.Computed : true ;
        virtual Error       : String(150) @Core.Computed : true ;
    }
}