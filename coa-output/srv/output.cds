using { com.apple.coa as coa } from '../db/output_datamodel';
using V_OUTPUT from '../db/output_datamodel';
using V_OUTPUT_EXPORT from '../db/output_datamodel';

@cds.query.limit: { default: 200000, max: 200000 }
annotate output with @(requires : ['system-user','COOutputReadOnly','COOutputModify']); 

service output {
entity CarryoverOutput @(restrict: [
            {grant:'READ',  to: ['COOutputReadOnly']},
            {grant:'READ', to: ['COOutputModify']} ]) 
           as projection on coa.T_COA_OUTPUT;

@readonly
entity CO_Output 
@(restrict: [
        {grant:'READ',  to: ['COOutputReadOnly']},
        {grant:'READ', to: ['COOutputModify']} ]) 
  as projection on V_OUTPUT;
@readonly
entity CO_Output_Export 
@(restrict: [
        {grant:'READ',  to: ['COOutputReadOnly']},
        {grant:'READ', to: ['COOutputModify']} ]) 
  as projection on V_OUTPUT_EXPORT;

@readonly
@cds.persistence.skip
entity F4help @(restrict: [
            {grant:'READ',  to: ['COOutputReadOnly']},
            {grant:'WRITE', to: ['COOutputModify']}]) { 
       key To_GHSite : String(30);
       key To_Product: String(40) ;
       key To_Business_Grp : String(50);
       key From_GHSite: String(30) ;
       key From_Product: String(40) ;
       key From_Business_Grp : String(50) ;
       key AQID: String(18) ;
       key MFR : String(225) ;
       key SHORT_NAME: String(40) ;
       key EQ_Name : String(255) ;
       key Status : String(20);
    }

@cds.persistence.skip
    entity Upload_Output @(restrict: [
            {grant:'WRITE', to: ['COOutputModify']}])
    {
        csv : LargeBinary @odata.singleton  @Core.MediaType : 'text/csv';
        msg : String;
    } 

define type data: many{
createdAt : Timestamp  ; 
createdBy: String(255)  ; 
modifiedAt: Timestamp ;
modifiedBy: String(255) ; 
From_CM: String(30)  ; 
From_Site: String(30) ; 
From_Product: String(40)  ; 
AQID: String(18) ; 
To_CM: String(30)  ; 
To_Site: String(30) ; 
To_Product: String(40)  ; 
CO_Type : String(10) ;
From_GHSite: String(30) ; 
To_GHSite: String(30) ; 
From_Business_Grp : String(50);
To_Business_Grp : String(50);
EQ_Name: String(255)   ; 
MFR: String(255)  ; 
Quantity : Decimal(15, 2) ;
CM_Balance_Qty: Decimal(15, 2)    ; 
Approved_By: String  ; 
Review_Date: Timestamp ; 
Status: String(20) ; 
Comment: String(80) ; 
SAP_CM_Site: String(61) ; 
SAP_To_CM_Site: String(61) ; 
modifiedBy_Name   : String(255);
modifiedBy_mail   : String(255);
createdBy_Name    : String(255);
createdBy_mail    : String(255);
Approved_By_Name  : String(255);
Approved_By_mail  : String(255); 
SHORT_NAME: String(40) ;   
}

@cds.persistence.skip
    entity output_action  @(restrict: [
            {grant:'WRITE', to: ['COOutputModify']}]) {
        OutputData : data;
        URL : String;
        CM_Balance_Qty: Decimal(15, 2)   ; 
        Action:String(20);
        Comment: String(80) ; 
    };
}
