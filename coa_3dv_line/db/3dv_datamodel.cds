using { managed
      } from '@sap/cds/common';

context com.apple.coa {
    
@cds.persistence.exists
entity T_COA_3DV_HEADER : managed {
    key Building : String(40);
    key Floor : String(40);
    key Site: String(40);
    key CM: String(20);
    key Status: String(20) default 'DRAFT';
    Alderaan_Site: String(40);
    Alderaan_CM: String(20);
    Scan_Start_Date: DateTime;
    Scan_End_Date: DateTime;
    Area : String(20);
    Image_FileName : String(50);
    Image_FileId: String(80);
    Origin_X : Decimal;
    Origin_Y : Decimal;
    Scale_X : Decimal;
    Scale_Y : Decimal;
    Orientation_X : String(20);
    Orientation_Y : String(20);
    Line: String(40);
    ImageWidth: Integer;
    ImageHeight: Integer;
    Last_Active_Date:DateTime;
    Last_Active_User : String;
    Lock : String(1);
    SAP_CM_Site         : String(61) ;
    modifiedBy_Name      : String(255);
    modifiedBy_mail      : String(255);
    createdBy_Name       : String(255);
    createdBy_mail       : String(255);
    Last_Active_UserName : String(255);
    Last_Active_UserMail : String(255);
}

@cds.persistence.exists
entity T_COA_RFID_ANNOTATION : managed {
    key CM: String(30);
    key Site: String(40);
    key Building : String(40);
    key Floor : String(40);
    key Status: String(20) default 'DRAFT';
    key Asset_ID : Decimal(22) ;
     Rfid : String(25);
    Alderaan_ID: String(40);
    Override_LineId: String(30);
    CarryOverAqid: String(18);
    CarryOverOldProgram: String(40);
    CarryOverEqName: String(255);
    isAqidChanged: Boolean;
    isProgramChanged: Boolean;
    EquipName: String(255);
    Program: String(40);
    Uph: Integer;
    LineType: String(128);
    LineId: String(250);
    Shape_Guid : String(50);
    Version_Id : String(30);
    Comments : String(150);
    Rfid_XAxis : Decimal;
    Rfid_YAxis : Decimal;
    SAP_CM_Site : String(61) ;
    modifiedBy_Name     : String(255);
    modifiedBy_mail     : String(255);
    createdBy_Name      : String(255);
    createdBy_mail      : String(255);
    Line_Priority     : Integer;
    virtual ErrorMsg: String(150);
}

@cds.persistence.exists
entity T_COA_SHAPES: managed {
    key Floor : String(40);
    key Site: String(40);
    key CM: String(20);
    key Building : String(40);
    key Shape_Guid : String(50);  
    key Status: String(20) default 'DRAFT';
    Uph: Integer;
    LineType: String(20);
    LineId: String(250);    
    Shape_Name: String(40);
    Shape_Type: String(20);
    Shape_Color: String(20);
    rfidMoved: Boolean; 
    ConfirmedBy: String;
    ConfirmedOn: DateTime;
    ConfirmedRequired: Boolean;     
    SAP_CM_Site         : String(61) ;
    Shape_Vertices: Composition of many T_COA_VERTICES on Shape_Vertices.Shape_Guid = Shape_Guid
                                                    and Shape_Vertices.Status = Status;
    modifiedBy_Name   : String(255);
    modifiedBy_mail   : String(255);
    createdBy_Name    : String(255);
    createdBy_mail    : String(255);
    ConfirmedBy_Name  : String(255);
    ConfirmedBy_mail  : String(255);
    Line_Priority     : Integer;
                                                  
}

@cds.persistence.exists
entity T_COA_VERTICES : managed  {
   key Shape_Guid :  String(50);
   key Status: String(20) default 'DRAFT';
   key Vertices_X : Integer;
   key Vertices_Y : Integer;
    Sequence_No    : Integer;
    modifiedBy_Name : String(255);
    modifiedBy_mail : String(255);
    createdBy_Name  : String(255);
    createdBy_mail  : String(255);
}


}
@cds.persistence.calcview
@cds.persistence.exists 
Entity ![V_AQID_ANNOTATION] {
key     ![Rfid]: String(25)  @title: 'RFID Tag' ; 
key     ![Sernr]: String(30)  @title: 'EQ Sr no.' ; 
key     ![ZZVModel]: String(150)  @title: 'EQ Model no.' ; 
key     ![Aqid]: String(18)  @title: 'AQID' ; 
key     ![CM]: String(30)  @title: 'SAP Site Code' ; 
key     ![Site]: String(40)  @title: 'Alderaan Site' ; 
key     ![Zaldr_Site]: String(32)  @title: 'LOB' ; 
key     ![Alderaan_Site]: String(40)  @title: 'ALDERAAN_SITE: ALDERAAN_SITE' ; 
key     ![Alderaan_CM]: String(20)  @title: 'ALDERAAN_CM: ALDERAAN_CM' ; 
key     ![Floor]: String(40)  @title: 'Floor' ; 
key     ![Building]: String(40)  @title: 'Building' ; 
key     ![Equip_Manf]: String(255)  @title: 'Vendor' ; 
key     ![Equip_Status]: String(5)  @title: 'Equip Status' ; 
key     ![Equip_CM]: String(30)  @title: 'Equip Cm' ; 
key     ![Equip_Site]: String(30)  @title: 'Equip Site' ; 
key     ![Status]: String(20)  @title: 'Status' ; 
key     ![LineType]: String(128)  @title: 'Line Type' ; 
key     ![LineId]: String(250)  @title: 'Line Id' ; 
key     ![Uph]: Integer  @title: 'UPH: UPH' ; 
key     ![Comments]: String(150)  @title: 'Comments' ; 
key     ![Scan_Start_Date]: String  @title: 'Scan Start Date' ; 
key     ![Scan_End_Date]: String  @title: 'Scan End Date' ; 
key     ![Shape_Guid]: String(50)  @title: 'SHAPE_GUID: SHAPE_GUID' ; 
key     ![Rfid_XAxis]: Decimal(34)  @title: 'RFID_XAXIS: RFID_XAXIS' ; 
key     ![Rfid_YAxis]: Decimal(34)  @title: 'RFID_YAXIS: RFID_YAXIS' ; 
key     ![CarryOverAqid]: String(18)  @title: 'CARRYOVERAQID: CARRYOVERAQID' ; 
key     ![CarryOverOldProgram]: String(40)  @title: 'CARRYOVEROLDPROGRAM: CARRYOVEROLDPROGRAM' ; 
key     ![CarryOverEqName]: String(255)  @title: 'CARRYOVEREQNAME: CARRYOVEREQNAME' ; 
key     ![EquipName]: String(255)  @title: 'EQUIPNAME: EQUIPNAME' ; 
key     ![Program]: String(30)  @title: 'PROGRAM: PROGRAM' ; 
key     ![Override_LineId]: String(30)  @title: 'OVERRIDE_LINEID: OVERRIDE_LINEID' ;
key     ![Shape_Color]: String(20)  @title: 'Shape_Color: Shape Color' ; 
key    ![Asset_id]: String(40) @title: 'Asset Id';
virtual ![ErrorMsg]: String(130);
        ![SAP_CM_Site]: String(61);
        ![Line_Priority]: Integer;
        ![modifiedAt]: Timestamp;
        ![CM_DEPT]: String(128);
}

@cds.persistence.calcview
@cds.persistence.exists 
Entity ![V_3DV_HEADER] {
key     ![CM]: String(30)  @title: 'CM' ; 
key     ![Site]: String(40)  @title: 'Site' ; 
key     ![Building]: String(40)  @title: 'Building' ; 
key     ![Floor]: String(40)  @title: 'Floor' ; 
key     ![Status]: String(20)  @title: 'Status' ; 
key     ![LineType]: String(128)  @title: 'Line Type' ; 
key     ![LineId]: String(250)  @title: 'Line ID' ; 
key     ![ModifiedAt]: DateTime  @title: 'Modified At' ; 
key     ![ModifiedBy]: String  @title: 'Modified By SAP ID' ; 
key     ![ModifiedBy_Name]: String  @title: 'Modified By' ; 
key     ![ModifiedBy_mail]: String  @title: 'Modified By Mail' ; 
key     ![SAP_CM_Site]: String(61)  @title: 'SAP CM Site' ; 
key     ![Area]: String(20)  @title: 'Area' ; 
key     ![Image_FileName]: String(50)  @title: 'Image File Name' ; 
key     ![Line]: String(40)  @title: 'Alderaan Line' ; 
key     ![Image_FileId]: String(80)  @title: 'Image FileID' ; 
key     ![Origin_X]: Decimal  @title: 'Origin X' ; 
key     ![Origin_Y]: Decimal @title: 'Origin Y' ; 
key     ![Lock]: String(1)  @title: 'Lock' ; 
key     ![Alderaan_CM]: String(20)  @title: 'Alderaan CM' ; 
key     ![Alderaan_Site]: String(20)  @title: 'Alderaan Site' ; 
key     ![Scan_Start_Date]: DateTime  @title: 'Scan Start Date' ; 
key     ![Scan_End_Date]: DateTime  @title: 'Scan End Date' ; 
key     ![Scale_X]: Decimal  @title: 'Scale X' ; 
key     ![Scale_Y]: Decimal  @title: 'Scale Y' ; 
key     ![AllowModify]: String(1)  @title: 'Modify' ; 
key     ![createdBy]: String  @title: 'Created By SAP ID' ; 
}
