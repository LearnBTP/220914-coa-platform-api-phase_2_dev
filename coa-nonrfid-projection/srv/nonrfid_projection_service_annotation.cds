using nonrfid_projection from './nonrfid_projection_service';

/*********************************
*  CDS Annotations
**********************************/

annotate nonrfid_projection.NonRFIDProjectionDetails with @(
    title              : 'NonRFIDProjectionDetails',
    Common.Label       : 'NonRFIDProjectionDetails',
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            GH_SITE, PROGRAM
        ]
    }},
    UI.TextArrangement : #TextOnly,
    cds.odata.valuelist,
    UI: {
        SelectionFields  : [
            GH_SITE, PROGRAM, LINE, UPH, AQID, SHORT_NAME, STATION, RFID_SCOPE, SPL, QPL, BOH, RELEASE_QTY, ALT_STATION
            // ,ZALDR_SITE, CarryOverOldProgram, AREA, To_GHSite, To_Program, Tp_Business_Grp, RFID, ALDERAN, SERNR, LineId, LineType, CM_DEPT, Approval_Status, CarryOverAqid, Mapped_Aqid, CarryOverEqName, Short_Name, STATUS, Submit_By
        ]
    }
) {
    SITE @(
        title : 'Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'SITE',
                ValueListProperty : 'SITE'
            }
            ]
        }
        }
    ) @Core.Computed;
    CM @(
        title : 'CM',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'CM',
                ValueListProperty : 'CM'
            }
            ]
        }
        }
    ) @Core.Computed;
    GH_SITE @(
        title : 'GH Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'GH_SITE',
                ValueListProperty : 'GH_SITE'
            }
            ]
        }
        }
    ) @Core.Computed;
    PROGRAM @(
        title : 'CM Program (3DV)',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'PROGRAM',
                ValueListProperty : 'PROGRAM'
            }
            ]
        }
        }
    ) @Core.Computed;
    SCOPE @(
        title : 'Scope',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'SCOPE',
                ValueListProperty : 'SCOPE'
            }
            ]
        }
        }
    ) @Core.Computed;
    LINE @(
        title : 'Line Type',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'LINE',
                ValueListProperty : 'LINE'
            }
            ]
        }
        }
    ) @Core.Computed;
    MP_INTENT_QTY @(
        title : 'MP Intent Qty',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'MP_INTENT_QTY',
                ValueListProperty : 'MP_INTENT_QTY'
            }
            ]
        }
        }
    ) @Core.Computed;
    AQID @(
        title : 'AQID (non-RFID)',
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
    CONSUMABLES @(
        title : 'Consumables',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'CONSUMABLES',
                ValueListProperty : 'CONSUMABLES'
            }
            ]
        }
        }
    ) @Core.Computed;
    PO_TYPE @(
        title : 'PO Type',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'PO_TYPE',
                ValueListProperty : 'PO_TYPE'
            }
            ]
        }
        }
    ) @Core.Computed;
    UPH @(
        title: 'UPH'
    ) @Core.Computed;
    STATION @(
        title: 'Projected Station'
    ) @Core.Computed;
    AREA @(
        title: 'Area'
    ) @Core.Computed;
    DISPLAY_NAME @(
        title: 'Display Name'
    ) @Core.Computed;
    GROUP @(
        title: 'Group'
    ) @Core.Computed;
    SPL @(
        title: 'SPL'
    ) @Core.Computed;
    ALT_STATION @(
        title: 'Alternate Station'
    ) @Core.Computed;
    PARENT_ITEM @(
        title: 'Parent Item'
    ) @Core.Computed;
    LEVEL @(
        title: 'Level'
    ) @Core.Computed;
    GROUP_PRIORITY @(
        title: 'Group Priority'
    ) @Core.Computed;
    EQUIPMENT_TYPE @(
        title: 'Equipment Type'
    ) @Core.Computed;
    DEPT @(
        title: 'Department',
        Common : {
            FieldControl    : Edit
        }
    ) @Core.Computed:false;
    EQUIPMENT_NAME @(
        title: 'Equipment Name'
    ) @Core.Computed;
    MFR @(
        title: 'MFR'
    ) @Core.Computed;
    CATEGORY @(
        title: 'Category'
    ) @Core.Computed;
    SPARE_QTY @(
        title: 'Spare Qty'
    ) @Core.Computed;
    SPARE_RATE @(
        title: 'Spare Rate'
    ) @Core.Computed;
    RELEASE_QTY @(
        title: 'Release Qty'
    ) @Core.Computed;
    QPL @(
        title: 'QPL Qty',
        Common : {
            FieldControl    : Edit
        }
    ) @Core.Computed:false;
    BOH @(
        title: 'BOH Qty'
    ) @Core.Computed;
    SHORT_NAME @(
        title: 'Short AQID'
    ) @Core.Computed;
    RFID_SCOPE @(
        title: 'RFID Scope',
        Common : {
            FieldControl    : Edit
        }
    ) @Core.Computed:false;
    CARRY_OVER @(
        title: 'Carry Over Qty',
        Common : {
            FieldControl    : Edit
        }
    ) @Core.Computed:false;
    MODIFIEDBY_NAME @(
        title : 'Updated By Name'
    ) @Core.Computed;
    MODIFIEDBY_MAIL @(
        title : 'Updated By Email'
    ) @Core.Computed;
    CREATEDBY_NAME @(
        title : 'Created By Name'
    ) @Core.Computed;
    CREATEDBY_MAIL @(
        title : 'Created By Email'
    ) @Core.Computed;
    CREATEDAT @(
        title : 'Created At'
    ) @Core.Computed;
    MODIFIEDAT @(
        title : 'Updated At'
    ) @Core.Computed;
    Balance_Qty @(
        title : 'Leftover Qty'
    ) @Core.Computed;
    ID @(
        title: 'ID',
        UI.Hidden : true,
        UI.HiddenFilter : true
    ) @Core.Computed;
    // Submit_By_mail @(
    //     title : 'Submit By Email'
    // ) @Core.Computed;
    // Reviewed_By_Name @(
    //     title : 'Reviewed By Name'
    // ) @Core.Computed;
    // Reviewed_By_mail @(
    //     title : 'Reviewed By Email'
    // ) @Core.Computed;
    // modifiedBy_Name @(
    //     title : 'Modified By Name'
    // ) @Core.Computed;
    // modifiedBy_mail @(
    //     title : 'Modified By Email'
    // ) @Core.Computed;
    // createdBy_Name @(
    //     title : 'Created By Name'
    // ) @Core.Computed;
    // createdBy_mail @(
    //     title : 'Created By Email'
    // ) @Core.Computed;
    // CM @(
    //     title : 'CM'
    // ) @Core.Computed;
    // SITE @(
    //     title : 'Site'
    // ) @Core.Computed;
    // SAP_CM_Site @(
    //     title : 'SAP CM Site',
    //     UI.HiddenFilter : true
    // );
    // SAP_To_CM_Site @(
    //     title : 'SAP TO CM Site',
    //     UI.HiddenFilter : true
    // );
    // ZALDR_CMPROGRAM @(
    //     title : 'CM Program (Alderaan)',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'ZALDR_CMPROGRAM',
    //             ValueListProperty : 'ZALDR_CMPROGRAM'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // ALDERAN @(
    //     title : 'Asset Number',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'ALDERAN',
    //             ValueListProperty : 'ALDERAN'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // ZALDR_SITE @(
    //     title : 'From Site(Alderaan)',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'ZALDR_SITE',
    //             ValueListProperty : 'ZALDR_SITE'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // ZALDR_CM @(
    //     title : 'From CM (Alderaan)',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'ZALDR_CM',
    //             ValueListProperty : 'ZALDR_CM'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // To_CM @(
    //     title : 'To CM',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'To_CM',
    //             ValueListProperty : 'To_CM'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // To_Site @(
    //     title : 'To Site',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'To_Site',
    //             ValueListProperty : 'To_Site'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // To_Program @(
    //     title : 'To Program',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'To_Program',
    //             ValueListProperty : 'To_Program'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed:false;
    // LineId @(
    //     title : 'Line Id (3DV)',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'LineId',
    //             ValueListProperty : 'LineId'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // RFID @(
    //     title : 'RFID',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'RFID',
    //             ValueListProperty : 'RFID'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // AREA @(
    //     title: 'Area (Alderaan)'
    // ) @Core.Computed;
    // CM_DEPT @(
    //     title: 'CM Dept. (Alderaan)'
    // ) @Core.Computed;
    // LOB_NAME @(
    //     title: 'LoB (Alderaan)'
    // ) @Core.Computed;
    // AQID @(
    //     title : 'AQID(Alderaan)',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'AQID',
    //             ValueListProperty : 'AQID'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // Approval_Status @(
    //     title : 'Transfer Approval Status',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'Approval_Status',
    //             ValueListProperty : 'Approval_Status'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // SERNR @(
    //     title : 'Serial Number (Alderaan)',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'SERNR',
    //             ValueListProperty : 'SERNR'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
    // Raw_Aqid @(
    //     title: 'Raw AQID'
    // ) @Core.Computed;
    // Mapped_Aqid @(
    //     title: 'Mapped AQID'
    // ) @Core.Computed;
    // Short_Name @(
    //     title: 'Short Name'
    // ) @Core.Computed;
    // ASSETOWN @(
    //     title: 'Asset Ownership (Alderaan)'
    // ) @Core.Computed;
    // Equipment_Name @(
    //     title: 'Equipment Name(Alderaan)'
    // ) @Core.Computed;
    // MFR @(
    //     title: 'Equipment Manufacturer(Alderaan)'
    // ) @Core.Computed;
    // STATUS @(
    //     title: 'Status (Alderaan)'
    // ) @Core.Computed;
    // createdAt @(
    //     title: 'Created On'
    // ) @Core.Computed;
    // Override_LineId @(
    //     title: 'Override Line Id',
    //     UI.Hidden : true,
    //     UI.HiddenFilter : true
    // ) @Core.Computed;
    // Uph @(
    //     title: 'Uph (3DV)'
    // ) @Core.Computed;
    // LineType @(
    //     title: 'Line Type (3DV)'
    // ) @Core.Computed;
    // Version_Id @(
    //     title: 'Version Id'
    // ) @Core.Computed;
    // Transfer_Flag @(
    //     title: 'Transfer Flag'
    // ) @Core.Computed:false;
    // Submit_Dte @(
    //     title: 'Submit date'
    // ) @Core.Computed;
    // Submit_By @(
    //     title: 'Submit by'
    // ) @Core.Computed;
    // Review_Date @(
    //     title: 'Review date'
    // ) @Core.Computed;
    // Reviewed_By @(
    //     title: 'Reviewed by'
    // ) @Core.Computed;
    // CarryOverAqid @(
    //     title: 'CO AQID (3DV)'
    // ) @Core.Computed;
    // CarryOverOldProgram @(
    //     title: 'CO Program (3DV)'
    // ) @Core.Computed;
    // CarryOverEqName @(
    //     title: 'CO EQ Name (3DV)'
    // ) @Core.Computed;
    // Comments @(
    //     title: 'Comments'
    // ) @Core.Computed:false;
    // Tp_Business_Grp  @(
    //     title: 'To Business Group'
    // ) @Core.Computed:false;
    // modifiedAt  @(
    //     title: 'Modified On'
    // ) @Core.Computed;
    // ErrorMsg @(
    //     title: 'Validation Error'
    // ) @Core.Computed;
    // TIMESTAMP @(
    //     title: 'TimeStamp(3DV)'
    // ) @Core.Computed;
    // To_GHSite @(
    //     title : 'To Site(GH)',
    //     Common: { ValueList : {
    //         CollectionPath : 'F4help',
    //         SearchSupported : true,
    //         Parameters : [ {
    //             $Type : 'Common.ValueListParameterInOut',
    //             LocalDataProperty : 'To_GHSite',
    //             ValueListProperty : 'To_GHSite'
    //         }
    //         ]
    //     }
    //     }
    // ) @Core.Computed;
}
