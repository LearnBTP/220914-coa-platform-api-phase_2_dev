using {
    managed,
    sap
} from '@sap/cds/common';

context com.apple.coa {
    @cds.persistence.exists
    entity T_COA_CHANGE_HISTORY {
        key Table       : String;
        key Key_Fields  : String(40);
        key Field_Name  : String(40);
        key Action_Type : String(20);
        key modifiedAt  : Timestamp   @cds.on.insert : $now  @cds.on.update  : $now;
            modifiedBy  : String(128) @cds.on.insert : $user  @cds.on.update : $user;
            createdBy  : String(128) @cds.on.insert : $user ;
            createdAt  : Timestamp   @cds.on.insert : $now ;
            Old_Value   : String(128);
            New_Value   : String(128);
            CM          : String(30);
            Site        :String(30);
            To_CM       :String(30);
            To_Site     :String(30);
            SAP_CM_Site : String(61);
            SAP_To_CM_Site : String(61);
            modifiedBy_Name : String(255);
            modifiedBy_mail : String(255);
            createdBy_Name  : String(255);
            createdBy_mail  : String(255);
    };

}
