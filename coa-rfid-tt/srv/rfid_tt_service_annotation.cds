using rfid_tt from './rfid_tt_service';

/*********************************
*  CDS Annotations
**********************************/

annotate rfid_tt.RFIDDetails with @(
    title              : 'RFIDDetails',
    Common.Label       : 'RFIDDetails',
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            ZALDR_SITE
        ]
    }},
    UI.TextArrangement : #TextOnly,
    cds.odata.valuelist,
    UI: {
        SelectionFields  : [
            ZALDR_SITE, CarryOverOldProgram, AREA, To_GHSite, To_Program, Tp_Business_Grp, RFID, ALDERAN, SERNR, LineId, LineType, CM_DEPT, Approval_Status, CarryOverAqid, Mapped_Aqid, CarryOverEqName, Short_Name, STATUS, Submit_By_Name
        ]
    }
) {
    Submit_By_Name @(
        title : 'Submit By'
    ) @Core.Computed;
    Reset_Flag @(
        title : 'Reset Flag'
    ) @Core.Computed;
    Submit_By_mail @(
        title : 'Submit By Email'
    ) @Core.Computed;
    Reviewed_By_Name @(
        title : 'Reviewed By'
    ) @Core.Computed;
    Reviewed_By_mail @(
        title : 'Reviewed By Email'
    ) @Core.Computed;
    modifiedBy_Name @(
        title : 'Modified By'
    ) @Core.Computed;
    modifiedBy_mail @(
        title : 'Modified By Email'
    ) @Core.Computed;
    createdBy_Name @(
        title : 'Created By'
    ) @Core.Computed;
    createdBy_mail @(
        title : 'Created By Email'
    ) @Core.Computed;
    CM @(
        title : 'CM'
    ) @Core.Computed;
    SITE @(
        title : 'Site'
    ) @Core.Computed;
    SAP_CM_Site @(
        title : 'SAP CM Site',
        UI.HiddenFilter : true
    );
    SAP_To_CM_Site @(
        title : 'SAP TO CM Site',
        UI.HiddenFilter : true
    );
    ZALDR_CMPROGRAM @(
        title : 'CM Program (Alderaan)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'ZALDR_CMPROGRAM',
                ValueListProperty : 'ZALDR_CMPROGRAM'
            }
            ]
        }
        }
    ) @Core.Computed;
    ALDERAN @(
        title : 'Asset Number',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'ALDERAN',
                ValueListProperty : 'ALDERAN'
            }
            ]
        }
        }
    ) @Core.Computed;
    ZALDR_SITE @(
        title : 'From Site(Alderaan)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'ZALDR_SITE',
                ValueListProperty : 'ZALDR_SITE'
            }
            ]
        }
        }
    ) @Core.Computed;
    ZALDR_CM @(
        title : 'From CM (Alderaan)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'ZALDR_CM',
                ValueListProperty : 'ZALDR_CM'
            }
            ]
        }
        }
    ) @Core.Computed;
    To_CM @(
        title : 'To CM',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'To_CM',
                ValueListProperty : 'To_CM'
            }
            ]
        }
        }
    ) @Core.Computed;
    To_Site @(
        title : 'To Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'To_Site',
                ValueListProperty : 'To_Site'
            }
            ]
        }
        }
    ) @Core.Computed;
    To_Program @(
        title : 'To Program',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'To_Program',
                ValueListProperty : 'To_Program'
            }
            ]
        },
        FieldControl    : Edit
        }
    ) @Core.Computed:false;
    LineId @(
        title : 'Line Id (3DV)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'LineId',
                ValueListProperty : 'LineId'
            }
            ]
        }
        }
    ) @Core.Computed;
    RFID @(
        title : 'RFID',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'RFID',
                ValueListProperty : 'RFID'
            }
            ]
        }
        }
    ) @Core.Computed;
    AREA @(
        title: 'Area (Alderaan)'
    ) @Core.Computed;
    CM_DEPT @(
        title: 'CM Dept. (Alderaan)'
    ) @Core.Computed;
    LOB_NAME @(
        title: 'LoB (Alderaan)'
    ) @Core.Computed;
    AQID @(
        title : 'AQID(Alderaan)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'AQID',
                ValueListProperty : 'AQID'
            }
            ]
        }
        }
    ) @Core.Computed;
    Approval_Status @(
        title : 'Transfer Approval Status',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Approval_Status',
                ValueListProperty : 'Approval_Status'
            }
            ]
        }
        }
    ) @Core.Computed;
    SERNR @(
        title : 'Serial Number (Alderaan)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'SERNR',
                ValueListProperty : 'SERNR'
            }
            ]
        }
        }
    ) @Core.Computed;
    Raw_Aqid @(
        title: 'Raw AQID'
    ) @Core.Computed;
    Mapped_Aqid @(
        title: 'Mapped AQID'
    ) @Core.Computed;
    Short_Name @(
        title: 'Short Name'
    ) @Core.Computed;
    ASSETOWN @(
        title: 'Asset Ownership (Alderaan)'
    ) @Core.Computed;
    Equipment_Name @(
        title: 'Equipment Name(Alderaan)'
    ) @Core.Computed;
    MFR @(
        title: 'Equipment Manufacturer(Alderaan)'
    ) @Core.Computed;
    STATUS @(
        title: 'Status (Alderaan)'
    ) @Core.Computed;
    createdAt @(
        title: 'TimeStamp(3DV)'
    ) @Core.Computed;
    Override_LineId @(
        title: 'Override Line Id',
        UI.Hidden : true,
        UI.HiddenFilter : true
    ) @Core.Computed;
    Uph @(
        title: 'Uph (3DV)'
    ) @Core.Computed;
    LineType @(
        title: 'Line Type (3DV)'
    ) @Core.Computed;
    Version_Id @(
        title: 'Version Id'
    ) @Core.Computed;
    Transfer_Flag @(
        title: 'Transfer Flag',
        Common : {
            FieldControl    : Edit
        }
    ) @Core.Computed:false;
    Submit_Dte @(
        title: 'Submit date'
    ) @Core.Computed;
    Submit_By @(
        title: 'Submit by ID'
    ) @Core.Computed;
    Review_Date @(
        title: 'Review date'
    ) @Core.Computed;
    Reviewed_By @(
        title: 'Reviewed by ID'
    ) @Core.Computed;
    CarryOverAqid @(
        title: 'CO AQID (3DV)'
    ) @Core.Computed;
    CarryOverOldProgram @(
        title : 'CO Program (3DV)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'CarryOverOldProgram',
                ValueListProperty : 'CarryOverOldProgram'
            }
            ]
        }
        }
    ) @Core.Computed;
    CarryOverEqName @(
        title: 'CO EQ Name (3DV)'
    ) @Core.Computed;
    Comments @(
        title: 'Comments',
        Common : {
            FieldControl    : Edit
        }
    ) @Core.Computed:false;
    Tp_Business_Grp  @(
        title: 'To Business Group',
        Common : {
            FieldControl    : Edit
        }
    ) @Core.Computed:false;
    modifiedAt  @(
        title: 'Modified On'
    ) @Core.Computed;
    ErrorMsg @(
        title: 'Validation Error'
    ) @Core.Computed;
    TIMESTAMP @(
        title: 'Enrolled ON'
    ) @Core.Computed;
    To_GHSite @(
        title : 'To Site(GH)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'To_GHSite',
                ValueListProperty : 'To_GHSite'
            }
            ]
        }
        }
    ) @Core.Computed;
}