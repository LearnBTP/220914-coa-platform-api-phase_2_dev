using  com.apple.coa  from '../db/3dv_datamodel';
using V_AQID_ANNOTATION from '../db/3dv_datamodel';
using V_3DV_HEADER from '../db/3dv_datamodel';

annotate Annotation3DV with @(requires : ['system-user','AnnotationReadOnly','AnnotationModify']); 
@cds.query.limit: { default: 7000, max: 7000 }
service Annotation3DV  {

       @readonly
    entity GetRFIDAnnotation @(restrict: [
            {grant:'READ',  to: ['AnnotationReadOnly'] },
            {grant:'WRITE', to: ['AnnotationModify'] } ]) as projection on coa.T_COA_RFID_ANNOTATION;       
    @readonly
    entity Get3DVHeader @(restrict: [
            {grant:'READ',  to: ['AnnotationReadOnly'] },
            {grant:'WRITE', to: ['AnnotationModify'] } ]) as projection on coa.T_COA_3DV_HEADER;
    @readonly        
    entity GetShapes @(restrict: [
            {grant:'READ',  to: ['AnnotationReadOnly']},
            {grant:'WRITE', to: ['AnnotationModify']} ]) as projection on coa.T_COA_SHAPES order by modifiedAt desc;
    @readonly          
    entity GetVertices @(restrict: [
            {grant:'READ',  to: ['AnnotationReadOnly']},
            {grant:'WRITE', to: ['AnnotationModify']} ]) as projection on coa.T_COA_VERTICES; 
    
    @readonly
    entity AnnotationDetails 
   @(restrict: [
            {grant:'READ',  to: ['AnnotationReadOnly']} 
            ]) 
            as projection on V_AQID_ANNOTATION ;
    
    @readonly
    entity HeaderAnnotation as projection on V_3DV_HEADER;

    @readonly
    entity HeaderAnnotation_V  @(restrict: [
            {grant:'READ',  to: ['AnnotationReadOnly']}]) as SELECT 
                FROM
                coa.T_COA_RFID_ANNOTATION  INNER JOIN 
                coa.T_COA_3DV_HEADER  ON 
                T_COA_RFID_ANNOTATION.CM = T_COA_3DV_HEADER.CM
                AND T_COA_RFID_ANNOTATION.Site = T_COA_3DV_HEADER.Site
                AND T_COA_RFID_ANNOTATION.Floor = T_COA_3DV_HEADER.Floor
                AND T_COA_RFID_ANNOTATION.Status = T_COA_3DV_HEADER.Status
                AND T_COA_RFID_ANNOTATION.Building = T_COA_3DV_HEADER.Building
                DISTINCT { Key T_COA_RFID_ANNOTATION.CM, 
                           Key T_COA_RFID_ANNOTATION.Site, 
                           Key T_COA_RFID_ANNOTATION.Building, 
                           Key T_COA_RFID_ANNOTATION.Floor, 
                           Key T_COA_RFID_ANNOTATION.Status, 
                           Max(T_COA_RFID_ANNOTATION.LineType) as LineType : String, 
                           Max(T_COA_RFID_ANNOTATION.LineId) as LineId: String(250), 
                           Max(T_COA_3DV_HEADER.modifiedAt) as ModifiedAt : DateTime,
                           Max(T_COA_3DV_HEADER.modifiedBy) as ModifiedBy : String, 
                           Max(T_COA_3DV_HEADER.createdBy) as createdBy : String, 
                           Max(T_COA_3DV_HEADER.modifiedBy_Name) as ModifiedBy_Name : String,
                           Max(T_COA_3DV_HEADER.modifiedBy_mail) as ModifiedBy_mail : String,   
                           Max(T_COA_3DV_HEADER.SAP_CM_Site)  as SAP_CM_Site: String,                
                           Max(T_COA_3DV_HEADER.Area) as Area : String(30),
                           Max(T_COA_3DV_HEADER.Image_FileName) as Image_FileName : String, 
                           Max(T_COA_3DV_HEADER.Line) as Line : String @title: 'Alderaan Line', 
                           Max(T_COA_3DV_HEADER.Image_FileId) as Image_FileId : String, 
                           Max(T_COA_3DV_HEADER.Origin_X) as Origin_X : Decimal, 
                           Max(T_COA_3DV_HEADER.Origin_Y) as Origin_Y : Decimal, 
                           Max(T_COA_3DV_HEADER.Lock) as Lock : String @title: 'Lock', 
                           Max(T_COA_3DV_HEADER.Alderaan_CM) as Alderaan_CM : String @title: 'Alderaan CM', 
                           Max(T_COA_3DV_HEADER.Alderaan_Site) as Alderaan_Site : String @title: 'Alderaan Site', 
                           Max(T_COA_3DV_HEADER.Scan_Start_Date) as Scan_Start_Date : DateTime @title: 'Scan Start Date', 
                           Max(T_COA_3DV_HEADER.Scan_End_Date) as Scan_End_Date : DateTime @title: 'Scan End Date', 
                           Max(T_COA_3DV_HEADER.Scale_X) as Scale_X : Decimal, 
                           Max(T_COA_3DV_HEADER.Scale_Y) as Scale_Y : Decimal,
                           '' as AllowModify:String
                          }
                GROUP BY T_COA_RFID_ANNOTATION.CM, T_COA_RFID_ANNOTATION.Floor, T_COA_RFID_ANNOTATION.Building, T_COA_RFID_ANNOTATION.Site, T_COA_RFID_ANNOTATION.Status;  
                
   
    @cds.persistence.skip
    entity F4help 
   @(restrict: [
            {grant:'READ',  to: ['AnnotationModify', 'AnnotationReadOnly']}])
        {
        key Building : String(40) @title : 'Building';
        key Floor : String(40) @title : 'Floor';
        key Area: String(30) @title : 'Area'; 
        key LineType: String(20) @title : 'Line Type';
        key LineId: String(250) @title : 'Line ID'; 
        key Alderaan_CM: String(20) @title : 'Alderaan CM'; 
        key Alderaan_Site: String(20) @title : 'Alderaan Site'; 
         key Status: String(20) @title : 'Status';
    }

    @cds.persistence.skip
    entity DropDown   {
       key Type: String(40);
       key Id: String(20);
       key Value: String(40);
       key FilterNameValue: String(50);
    }
    
    @cds.persistence.skip
    entity guidGenerator {
        @(restrict: [
            {grant:'READ',  to: ['AnnotationReadOnly']}])      
        key guid: String(50);        
    }


/**************************
*  Types
**************************/
define type data : {
        GUID : String;
        ImageWidth: String;
        ImageHeight : String;
        JSON : {
            Data : {
                building : String;
                floor : String;
                area : String;
                cm: String;
                site: String;
                image: String;
                startDate: DateTime;
                endDate: DateTime;
                line: String;
                tags: String;
                sapCode : String;

                origin : {
                    x : Decimal;
                    y : Decimal;
                };
                scale: {
                    x : Decimal;
                    y : Decimal;
                };
                orientation: {
                    x : String;
                    y : String;
                }
            }
        };
        CSV : {
            Data : many {
                epc: String;
                asset_id : String;
                x_m : String;
                y_m : String;
                err_m : String;
            }
        };
    }
 define type ShapeData : {
                Building : String;
                Floor : String;
                Site : String;
                CM: String;
                line: String;
                Status: String;
                Shape_Guid: String;
                canvasDim : {
                    width : Integer;
                    height : Integer;
                };
                scale: {
                    X : Decimal;
                    Y : Decimal;
                };
                origin: {
                     X: Decimal;
                     Y: Decimal;
                };
            
            Shape_Vertices : Array of {
                Vertices_X: Integer;
                Vertices_Y : Integer;
                Sequence_No : Integer;           
            };
             otherShapes : Array of { data: Array of {
                Vertices_X: Integer;
                Vertices_Y : Integer;
                Sequence_No : Integer;   
             }
                        
            }           
    };
    
    define type publishdata : {
        header : {
            Floor : String;
            Site : String;
            CM : String;
            Building :  String;
            Status : String;
            Required_Version : String;
            skip: String(1);
        };
        shapes : {
          new_shapes: many {
            Shape_Guid : String;
            Shape_Color : String;
            Shape_Type : String;
            Shape_Name : String;
            LineId : String;
            LineType : String;
            Uph : Integer;  
            Line_Priority     : Integer;      
  
            Shape_Vertices : {
                results: many {
                    Vertices_X : Integer;
                    Vertices_Y : Integer;
                    Sequence_No : Integer; 
                };
            }
          };
          upd_shapes: many {
            Shape_Guid : String;
            Shape_Color : String;
            Shape_Type : String;
            Shape_Name : String;
            LineId : String;
            LineType : String;
            Uph : Integer;      
            ConfirmedBy: String;
            ConfirmedOn: String;
            ConfirmedRequired: Boolean; 
            Line_Priority     : Integer;                           
          };
          del_shapes: array of String
        };
        rfid : many {
            //Asset_ID : Decimal(22) ;
            Rfid : String;
            Comments : String;
            Shape_Guid : String;
            LineId : String;
            LineType : String;
            Uph : Integer;
            Aqid: String(18);
            CarryOverOldProgram: String(40);
            CarryOverAqid: String(18);
            Override_LineId: String(30);
            Shape_Color: String(20);
            Line_Priority     : Integer;
        };
    };
    define type headerkey : {
        Lock: Boolean;
        Building : String(40);
        Floor : String(40);
        Site: String(40);
        CM: String(20);
        Status: String(20)
    };

    define type header : {
        Building : String(40);
        Floor : String(40);
        Site: String(40);
        CM: String(20);
    };

 /**************************
*  Actions
**************************/
action store3DVAnnotationData @(requires: 'system-user') (contextData : data); 
    action checkRFIDInsideShape  @(requires: ['AnnotationReadOnly', 'AnnotationModify'])(request :ShapeData) returns array of GetRFIDAnnotation;
    action publishAnnotation  @(requires: 'AnnotationModify') (request : publishdata) returns array of AnnotationDetails;
    action createDraftAnnotation @(requires: 'AnnotationModify') (request : publishdata) returns array of AnnotationDetails;
    action saveAsAnnotation  @(requires: 'AnnotationModify') (request : publishdata) returns array of AnnotationDetails;
    action locking @(requires: 'AnnotationModify') (request : headerkey);
    action lockManager @(requires: 'system-user') ();
    action check_draft_record @(requires: ['AnnotationReadOnly', 'AnnotationModify']) (request : header) returns {msg : String};
}