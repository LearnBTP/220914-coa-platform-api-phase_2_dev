using Line_simulation from './line_simulation_service';

/**
 * ***
 *
 * CDS Annotations
 *
 * ***
 */

annotate Line_simulation.RfidSimu with @()

{
    GHSite          @(title: 'GH Site');
    To_CM           @(title: 'To CM');
    To_Site         @(title: 'To Site');
    To_Program      @(title: 'To Program');
    To_Business_Grp @(title: 'To Business Group');
    Raw_AQID        @(title: 'Raw Aqid');
    Mapped_AQID     @(title: 'Mapped Aqid');
    Short_Name      @(title: 'Short Name');
    Serial_Number   @(title: 'Serial Number');
    Asset_Own       @(title: 'Asset Own');
    EQ_Name         @(title: 'EQ Name');
    Area            @(title: 'Area');
    CM_Dept         @(title: 'CM Dept');
    Lob_Name        @(title: 'Lob Name');
    Status          @(title: 'Status');
    CO_Aqid         @(title: 'CO Aqid');
    CO_Eq           @(title: 'CO Eq');
    CO_Program      @(title: 'CO Program');
    Line_Id         @(title: 'Line Id');
    Line_Type       @(title: 'Line Type');
    UPH             @(title: 'UPH');
    CM              @(title: 'CM');
    Site            @(title: 'Site');
    CM_Program      @(title: 'CM Program');
    Transfer_Flag   @(title: 'Transfer Flag');
    Match_Status    @(title: 'Match Status');
    Match_Qty       @(title: 'Match Quantity');
    Mismatch_Qty    @(title: 'Mismatch Quantity');
    RFID            @(title: 'RFID');
    AQID            @(title: 'AQID');
}

annotate Line_simulation.NonRfidSimu with @() {
    GH_Site          @(title: 'GH Site');
    CM               @(title: 'CM');
    Site             @(title: 'Site');
    Program          @(title: 'Program');
    Aqid             @(title: 'Aqid');
    Dept             @(title: 'Dept');
    Station          @(title: 'Station');
    Group_Priority   @(title: 'Group Priority');
    Scope            @(title: 'Scope');
    Line_Type        @(title: 'Line Type');
    UPH              @(title: 'UPH');
    Alt_Station      @(title: 'Alt Station');
    RFID_Scope       @(title: 'RFID Scope');
    Group_ID         @(title: 'Group Id');
    Line_Priority    @(title: 'Line Priority');
    Equipment_Type   @(title: 'Equipment Type');
    Equipment_Name   @(title: 'Equipment Name');
    confLevel        @(title: 'Conflevel');
    Mfr              @(title: 'Mfr');
    Line_Id          @(title: 'Line Id');
    Projected_Qty    @(title: 'Projected Quantity');
    Transfer_Qty     @(title: 'Transfer Quantity');
    Split            @(title: 'Split');
    To_GHSite        @(title: 'To GH Site');
    To_Business_Grp  @(title: 'To Business Group');
    To_Program       @(title: 'To Program');
    Transfer_Flag    @(title: 'Transfer Flag');
    Comments         @(title: 'Comments');
    Status           @(title: 'Status');
    Sequence_No      @(title: 'Sequence Number');
    Sync_Status      @(title: 'Sync Status');
    Sync_on_Dt       @(title: 'Sync On Date');
    Sync_By_Name     @(title: 'Sync By Name');
    Submit_Dt        @(title: 'Submit Date');
    Review_Date      @(title: 'Review Date');
    Review_By        @(title: 'Review By');
    Modify_Date      @(title: 'Modify Date');
    modifiedBy_Name  @(title: 'Modified By Name');
    Sync_By_email    @(title: 'Sync By Email');
    Submit_By_Email  @(title: 'Submit by Email');
    Reviewed_By_mail @(title: 'Reviewed By Mail');
    modifiedBy_mail  @(title: 'Modified By Mail');
    Sync_By          @(title: 'Sync By');
    Submit_By        @(title: 'Submit By');
    Reviewed_By      @(title: 'Reviewed By');
    Modified_By      @(title: 'Modified By');
    To_CM            @(title: 'To CM');
    To_Site          @(title: 'To Site');
    From_SAP_CM_Site @(title: 'From SAP CM Site');
    To_SAP_CM_Site   @(title: 'To SAP CM Site');
    Match_Status     @(title: 'Match Status');
    Match_Qty        @(title: 'Match Quantity');
    Mismatch_Qty     @(title: 'Mismatch Quantity');

}

annotate Line_simulation.COSimu with @() {
    From_GHSite       @(title: 'GH Site');
    From_Product      @(title: 'From Product');
    From_Business_Grp @(title: 'From Business Group');
    To_Product        @(title: 'To Product');
    To_Site           @(title: 'To Site');
    To_Business_Grp   @(title: 'To Business Group');
    Apple_Id          @(title: 'Apple Id');
    Quantity          @(title: 'Quantity');
    Comment           @(title: 'Comment');
    Match_Status      @(title: 'Match Status');
    Match_Qty         @(title: 'Match Quantity');
    Mismatch_Qty      @(title: 'Mismatch Quantity');


}

annotate Line_simulation.RfidTT with @() {
    Submit_By_Name      @(title: 'Submit By');
    Submit_By_mail      @(title: 'Submit By Email');
    Reviewed_By_Name    @(title: 'Reviewed By');
    Reviewed_By_mail    @(title: 'Reviewed By Email');
    modifiedBy_Name     @(title: 'Modified By');
    modifiedBy_mail     @(title: 'Modified By Email');
    createdBy_Name      @(title: 'Created By');
    createdBy_mail      @(title: 'Created By Email');
    CM                  @(title: 'CM');
    SITE                @(title: 'Site');
    SAP_CM_Site         @(title: 'SAP CM Site');
    SAP_To_CM_Site      @(title: 'SAP TO CM Site');
    ZALDR_CMPROGRAM     @(title: 'CM Program (Alderaan)');
    ALDERAN             @(title: 'Asset Number');
    ZALDR_SITE          @(title: 'From Site(Alderaan)');
    ZALDR_CM            @(title: 'From CM (Alderaan)');
    To_CM               @(title: 'To CM');
    To_Site             @(title: 'To Site');
    To_Program          @(title: 'To Program');
    LineId              @(title: 'Line Id (3DV)');
    RFID                @(title: 'RFID');
    AREA                @(title: 'Area (Alderaan)');
    CM_DEPT             @(title: 'CM Dept. (Alderaan)');
    LOB_NAME            @(title: 'LoB (Alderaan)');
    AQID                @(title: 'AQID(Alderaan)');
    Approval_Status     @(title: 'Transfer Approval Status');
    SERNR               @(title: 'Serial Number (Alderaan)');
    Raw_Aqid            @(title: 'Raw AQID');
    Mapped_Aqid         @(title: 'Mapped AQID');
    Short_Name          @(title: 'Short Name');
    ASSETOWN            @(title: 'Asset Ownership (Alderaan)');
    Equipment_Name      @(title: 'Equipment Name(Alderaan)');
    MFR                 @(title: 'Equipment Manufacturer(Alderaan)');
    STATUS              @(title: 'Status (Alderaan)');
    createdAt           @(title: 'TimeStamp(3DV)');
    Override_LineId     @(title: 'Override Line Id');
    Uph                 @(title: 'Uph (3DV)');
    LineType            @(title: 'Line Type (3DV)');
    Version_Id          @(title: 'Version Id');
    Transfer_Flag       @(title: 'Transfer Flag');
    Submit_Dte          @(title: 'Submit date');
    Submit_By           @(title: 'Submit by ID');
    Review_Date         @(title: 'Review date');
    Reviewed_By         @(title: 'Reviewed by ID');
    CarryOverAqid       @(title: 'CO AQID (3DV)');
    CarryOverOldProgram @(title: 'CO Program (3DV)');
    CarryOverEqName     @(title: 'CO EQ Name (3DV)');
    Comments            @(title: 'Comments');
    Tp_Business_Grp     @(title: 'To Business Group');
    ErrorMsg            @(title: 'Validation Error');
    TIMESTAMP           @(title: 'Enrolled ON');
    To_GHSite           @(title: 'To Site(GH)');
}

annotate Line_simulation.nonRfidTT with @() {
    GH_Site          @(title: 'GH Site');
    CM               @(title: 'CM');
    Site             @(title: 'Site');
    Program          @(title: 'CM Program');
    Aqid             @(title: 'AQID (non-RFID)');
    BusinessGrp      @(title: 'Business Group');
    Group_Priority   @(title: 'Group Priority (non-RFID)', );
    Dept             @(title: 'Department', );
    Scope            @(title: 'Scope');
    RFID_Scope       @(title: 'RFID Scope');
    Station          @(title: 'Projected Station (non-RFID)', );
    Alt_Station      @(title: 'Alternate Station');
    Parent_Item      @(title: 'Parent Item');
    Group_ID         @(title: 'Group ID');
    Line_Priority    @(title: 'Line Priority');
    Equipment_Type   @(title: 'Equipment Type');
    Equipment_Name   @(title: 'EQ Name (Non-RFID)');
    confLevel        @(title: 'Projection (Confidence Level)');
    Mfr              @(title: 'MFR');
    Mapped_Aqid      @(title: 'Mapped Aqid');
    Line_Type        @(title: 'Line Type', );
    Uph              @(title: 'UPH');
    Line_Id          @(title: 'Line ID', );
    Projected_Qty    @(title: 'Projected Qty');
    Transfer_Qty     @(title: 'Split Tranfer Qty');
    To_GHSite        @(title: 'To Site(GH)');
    To_Program       @(title: 'To Program');
    To_Business_Grp  @(title: 'To Business Group');
    Transfer_Flag    @(title: 'Transfer Flag');
    Comments         @(title: 'Comments');
    Status           @(title: 'Transfer Approval Status');
    Submit_By_Name   @(title: 'Submit by Name');
    Submit_Date      @(title: 'Submitted Date');
    Review_Date      @(title: 'Reviewed Date');
    Reviewed_By_Name @(title: 'Reviewed by Name');
    modifiedBy_Name  @(title: 'Modified by Name');
    modifiedAt       @(title: 'Modified Date');
}

annotate Line_simulation.co_simu_view with @() {
    FROM_GHSITE       @(title: 'From GH Site');
    FROM_PRODUCT      @(title: 'From Product');
    FROM_BUSINESS_GRP @(title: 'From Business Group');
    TO_PRODUCT        @(title: 'To Product');
    TO_CM             @(title: 'To CM');
    TO_SITE           @(title: 'To Site');
    TO_BUSINESS_GRP   @(title: 'To Business Group');
    APPLE_ID          @(title: 'Apple ID');
    QUANTITY          @(title: 'Quantity');
    COMMENT           @(title: 'Comment');
    MATCH_STATUS      @(title: 'Match Status');
    MATCH_QTY         @(title: 'Match Quantity');
    MISMATCH_QTY      @(title: 'Mis Match Quantity');
    SOURCE            @(title: 'Source');
    LINE_ID           @(title: 'Line Id');
    LINE_TYPE         @(title: 'Line Type');
}
