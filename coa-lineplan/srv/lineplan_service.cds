using { com.apple.coa as coa } from '../db/lineplan_datamodel';
annotate lineplan with @(requires : ['MainLineReadOnly','SubLineReadOnly', 'LinePlanReadOnly', 'MainLineModify', 'SubLineModify', 'RfidOnHandTTReadOnly', 'RfidOnHandTTModify']); 
@cds.query.limit: { default: 200000, max: 200000 }
service lineplan {

entity CarryoverMainline 
    @(restrict: [   
            {grant:'READ',  to: ['MainLineReadOnly']},
            {grant:'WRITE', to: ['MainLineModify']} ]) 
            as projection on coa.T_COA_MAIN_LINE; 

entity CarryoverSubline 
    @(restrict: [
            {grant:'READ',  to: ['SubLineReadOnly']},
            {grant:'WRITE', to: ['SubLineModify']} ]) 
            as projection on coa.T_COA_SUBLINE;

@cds.persistence.skip
    entity Upload_MainLine @(restrict: [
            {grant:'WRITE', to: ['MainLineModify']} ]) 
    {
        csv : LargeBinary @odata.singleton  @Core.MediaType : 'text/csv';
        msg : String;
    }    

@cds.persistence.skip
    entity Upload_SubLine @(restrict: [
            {grant:'WRITE', to: ['SubLineModify']} ])
    {
        csv : LargeBinary @odata.singleton  @Core.MediaType : 'text/csv';
        msg : String;
    } 


@readonly
    entity CarryoverLineplan @(restrict: [
            {grant:'READ',  to: ['LinePlanReadOnly']}]) as SELECT 
                    key CarryoverSubline.CM : String(30),
                    key CarryoverSubline.Site :  String(30),
                    key CarryoverSubline.Program : String(40),
                    key CarryoverSubline.Sub_Line_Name : String(80),
                    key CarryoverSubline.Uph as Uph :  Integer,
                    CarryoverSubline.GH_Site : String(30),
                    CarryoverSubline.boH_Qty as boH_Qty : Integer,
                    CarryoverSubline.Working_Hrs as Working_Hrs : Integer ,
                    CarryoverSubline.Remote_Site_Cap_Demand as Remote_Site_Cap_Demand : Integer,
                    CarryoverMainline.Fatp_Sustaining_Qty as Fatp_Sustaining_Qty : Integer,
                    CarryoverMainline.Uph as Mainline_Uph : Integer,
                    CarryoverSubline.Yield as Yield  : Integer,
                    case CarryoverSubline.Working_Hrs
                    when 0 then CarryoverSubline.boH_Qty
                    else 
                        case CarryoverSubline.Uph
                        when 0 then CarryoverSubline.boH_Qty
                        else 
                            case CarryoverSubline.Yield
                            when 0 then CarryoverSubline.boH_Qty
                            else case
                            when (CarryoverSubline.boH_Qty - (CEIL(((CarryoverMainline.Fatp_Sustaining_Qty * CarryoverMainline.Working_Hrs * CarryoverMainline.Uph * (CarryoverMainline.Efficiency_Field / 100)) + CarryoverSubline.Remote_Site_Cap_Demand) / (CarryoverSubline.Uph * CarryoverSubline.Working_Hrs * (CarryoverSubline.Yield / 100))))) >= 0 then (CarryoverSubline.boH_Qty - (CEIL(((CarryoverMainline.Fatp_Sustaining_Qty * CarryoverMainline.Working_Hrs * CarryoverMainline.Uph * (CarryoverMainline.Efficiency_Field / 100)) + CarryoverSubline.Remote_Site_Cap_Demand) / (CarryoverSubline.Uph * CarryoverSubline.Working_Hrs * (CarryoverSubline.Yield / 100)))))
                            else 0
                            end
                            end
                        end
                    end as CO_LINE_QTY : Integer64,
                    COUNT(
                        distinct CarryoverRfid.Line_Id
                    ) as Actual_Lines_Chosen       : Integer64,
                    CarryoverMainline.modifiedAt as Date_Mainline : DateTime,
                    CarryoverMainline.modifiedBy as Upload_By_User_Mainline : String(255),
                    CarryoverMainline.modifiedBy_Name as Upload_By_User_Mainline_Name : String(255),
                    CarryoverMainline.modifiedBy_mail as Upload_By_User_Mainline_mail : String(255),
                    CarryoverMainline.Comment as Comment_Mainline : String(150),
                    CarryoverSubline.modifiedAt as Date_Subline : DateTime,
                    CarryoverSubline.modifiedBy as Upload_By_User_Subline : String(255),
                    CarryoverSubline.modifiedBy_Name as Upload_By_User_Subline_Name : String(255),
                    CarryoverSubline.modifiedBy_mail as Upload_By_User_Subline_mail : String(255),
                    CarryoverSubline.Comment as Comment_Subline : String(150),
                    CarryoverSubline.SAP_CM_Site as SAP_CM_Site : String(61)
                FROM  CarryoverSubline
                INNER JOIN CarryoverMainline
                ON CarryoverSubline.CM = CarryoverMainline.CM
                AND CarryoverSubline.Site = CarryoverMainline.Site
                AND CarryoverSubline.Program = CarryoverMainline.Program
                LEFT OUTER JOIN coa.T_COA_RFID_TT as CarryoverRfid 
                ON CarryoverSubline.CM = CarryoverRfid.To_CM
                AND CarryoverSubline.Site = CarryoverRfid.To_Site
                AND CarryoverSubline.Program = CarryoverRfid.To_Program
                AND CarryoverSubline.Sub_Line_Name = CarryoverRfid.Line_Type
                AND CarryoverRfid.Line_Id <> '' 
                and CarryoverRfid.Line_Id <> 'null' 
                and CarryoverRfid.Line_Id <> 'NULL'
                and CarryoverRfid.Approval_Status  = 'Approved'
                GROUP BY CarryoverSubline.CM, CarryoverSubline.Site, CarryoverSubline.Program, CarryoverSubline.Sub_Line_Name, CarryoverSubline.Uph,
                        CarryoverSubline.GH_Site ,CarryoverMainline.Fatp_Sustaining_Qty, CarryoverMainline.Working_Hrs,CarryoverMainline.Uph,
                         CarryoverMainline.Efficiency_Field, CarryoverSubline.Remote_Site_Cap_Demand,
                         CarryoverSubline.Working_Hrs, CarryoverSubline.Yield, CarryoverSubline.boH_Qty,
                         CarryoverMainline.modifiedAt, CarryoverMainline.modifiedBy, CarryoverMainline.modifiedBy_Name ,
                        CarryoverMainline.modifiedBy_mail, CarryoverMainline.Comment,CarryoverSubline.modifiedAt ,
                        CarryoverSubline.modifiedBy,CarryoverSubline.modifiedBy_Name, CarryoverSubline.modifiedBy_mail,
                        CarryoverSubline.Comment, CarryoverSubline.SAP_CM_Site;             

@readonly
@cds.persistence.skip
entity F4help @(restrict: [
            {grant:'READ',  to: ['MainLineReadOnly']},
            {grant:'READ', to: ['MainLineModify']},
            {grant:'READ',  to: ['SubLineReadOnly']},
            {grant:'READ',  to: ['SubLineModify']},
            {grant:'READ',  to: ['LinePlanReadOnly']} ]) {
       key Mainline_Program      : String(40) ;
       key Mainline_GH_Site      : String(30) ;
       key Subline_Program       : String(40) ;
       key Sub_Line_Name         : String(80) ;
       key Sub_Line_Name_org     : String(80);
       key Subline_GH_Site       : String(30) ;
       key Lineplan_Program      : String(40) ;
       key Lineplan_Sub_Line_Name: String(80) ;
       key Lineplan_GH_Site      : String(30) ;
    }

define type data_m: many{
    createdAt : Timestamp  ; 
    createdBy: String(255)  ; 
    modifiedAt: Timestamp ;
    modifiedBy: String(255) ; 
    CM : String(30);
    Site : String(30);
    Program : String(40);
    Uph : Integer;
    BoH : Integer;
    Fatp_Sustaining_Qty : Integer;
    Working_Hrs : Integer;
    Efficiency_Field : Integer;
    Comment : String(150);
    SAP_CM_Site : String(61);
    GH_Site : String(30);
    modifiedBy_Name     : String(255);
    modifiedBy_mail     : String(255);
    createdBy_Name      : String(255);
    createdBy_mail      : String(255);
    Error: String(150);
}

define type data_s : many {
    createdAt : Timestamp  ; 
    createdBy: String(255)  ; 
    modifiedAt: Timestamp ;
    modifiedBy: String(255) ; 
    CM : String(30);
    Site : String(30);
    Program : String(40);
    Sub_Line_Name : String(80) ;
    Yield: Integer  ;
    Uph : Integer  ;  
    boH_Qty : Integer   ;
    Working_Hrs : Integer  ;
    Remote_Site_Cap_Demand : Integer  ;
    Comment : String(150)  ;
    SAP_CM_Site : String(61) ;
    GH_Site : String(30)  ;
    modifiedBy_Name     : String(255);
    modifiedBy_mail     : String(255);
    createdBy_Name      : String(255);
    createdBy_mail      : String(255);
    Error: String(150)  ;
}

@cds.persistence.skip
    entity mainline_action @(restrict: [
            {grant:'WRITE', to: ['MainLineModify']} ]) 
     {
        Mainlinedata : data_m;
        URL : String;
        BoH : Integer;
        Uph : Integer;
        Fatp_Sustaining_Qty : Integer;
        Working_Hrs : Integer;
        Efficiency_Field : Integer;
        Comment : String(150);
    };

@cds.persistence.skip
    entity subline_action @(restrict: [
            {grant:'WRITE', to: ['SubLineModify']} ]) 
     {
        Sublinedata : data_s;
        URL : String;
        Yield: Integer;
        boH_Qty : Integer;
        Working_Hrs : Integer;
        Remote_Site_Cap_Demand : Integer;
        Comment : String(150);
    };
}
