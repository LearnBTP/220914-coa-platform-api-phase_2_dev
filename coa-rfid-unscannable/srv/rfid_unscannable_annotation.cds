using rfid_unscannable from './rfid_unscannable';

/*********************************
*  CDS Annotations
**********************************/

annotate rfid_unscannable.Carryover_rfid_unscannable with @(
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            GH_SITE
        ]
    }
    },
    UI: {
        SelectionFields : [
            GH_SITE, TO_GHSITE, PROGRAM, TO_PROGRAM, FROM_BUSINESS_GRP, TO_BUSINESS_GRP,AQID,
            STATUS, COMMENT
        ],
        LineItem  : [
            {
            $Type : 'UI.DataField',
            Value : GH_SITE,
            ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : PROGRAM,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : FROM_BUSINESS_GRP,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : AQID,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : EQUIPMENT_NAME,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : MFR,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : PO_TYPE,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : SCOPE,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : CONSUMABLES,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : TO_GHSITE,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : TO_PROGRAM,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : TO_BUSINESS_GRP,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : FLEX_KITS,
                ![@HTML5.CssDefaults]: {width : '6rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : COMMENT,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : TRANSFER_FLAG,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : PROJECTED_QTY,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : QTY,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : MAPPED_AQID,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : SPLIT,
                ![@HTML5.CssDefaults]: {width : '6rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : STATUS,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : CREATEDBY_NAME,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : CREATEDAT,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : MODIFIEDBY_NAME,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : MODIFIEDAT,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : REVIEWED_BY_NAME,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : REVIEW_DATE,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : SYNC_STATUS,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : RESET_FLAG,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : ERROR,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            }
        ]
    }
    
)
{
    GH_SITE @(
        title : 'From GH Site',
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
    )@Core.Computed;
    FROM_BUSINESS_GRP @(
        title : 'From Business Group',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'FROM_BUSINESS_GRP',
                ValueListProperty : 'FROM_BUSINESS_GRP'
            }
            ]
        }
        }
    )@Core.Computed;
    PROGRAM @(
        title : 'From Product',
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
    )@Core.Computed;
    // STATION @(
    //     title : 'Projected Station'
    // )@Core.Computed;
    AQID @(
        title : 'CO AQID',
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
    )@Core.Computed;
    EQUIPMENT_NAME @(
        title : 'Equipment Name'
    )@Core.Computed;
    MFR @(
        title : 'Manufacturer'
    )@Core.Computed;
    SEQUENCE_NO @(
        title : 'Sequence No.'
    )@Core.Computed;
    PO_TYPE @(
        title : 'PO Type'
    )@Core.Computed;
    SCOPE @(
        title : 'Scope'
    )@Core.Computed;
    CONSUMABLES @(
        title : 'Consumables'
    )@Core.Computed;
    FLEX_KITS @(
        title : 'Flex Kits',
        Common : {
            FieldControl    : Edit
        }
    )@Core.Computed: false;
    PROJECTED_QTY @(
        title : 'Projected Qty'
    )@Core.Computed;
    TRANSFER_FLAG @(
        title : 'Transfer Flag',
        Common : {
            FieldControl    : Edit
        },
    )@Core.Computed: false;
    TO_GHSITE @(
        title : 'To GH Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'TO_GHSITE',
                ValueListProperty : 'TO_GHSITE'
            }
            ]
        },
        FieldControl    : Edit
        }
    )@Core.Computed: false;
    TO_PROGRAM @(
        title : 'To Product',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'TO_PROGRAM',
                ValueListProperty : 'TO_PROGRAM'
            }
            ]
        },
        FieldControl    : Edit
        }
    )@Core.Computed: false;
    TO_BUSINESS_GRP @(
        title : 'To Business Group',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'TO_BUSINESS_GRP',
                ValueListProperty : 'TO_BUSINESS_GRP'
            }
            ]
        },
        FieldControl    : Edit
        }
    )@Core.Computed: false;
    QTY @(
        title : 'Transfer Quantity',
        Common : {
            FieldControl    : Edit
        }
    )@Core.Computed: false;
    MAPPED_AQID @(
        title : 'Mapped AQID'
    )@Core.Computed;
    STATUS @(
        title : 'Transfer Approval Status',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'STATUS',
                ValueListProperty : 'STATUS'
            }
            ]
        }
        }
    )@Core.Computed;
    REVIEWED_BY_NAME @(
        title : 'Reviewed By'
    )@Core.Computed;
    REVIEW_DATE @(
        title : 'Reviewed On'
    )@Core.Computed;
    SAP_CM_SITE @(
        title : 'From SAP CM Site'
    )@Core.Computed;
    SAP_TO_CM_SITE @(
        title : 'To SAP CM Site'
    )@Core.Computed;
    CM @(
        title : 'CM'
    )@Core.Computed;
    SITE @(
        title : 'Site'
    )@Core.Computed;
    TO_CM @(
        title : 'To CM'
    )@Core.Computed;
    TO_SITE @(
        title : 'To Site'
    )@Core.Computed;
    MODIFIEDBY_NAME @(
        title : 'Submitted By'
    )@Core.Computed;
    MODIFIEDBY_MAIL @(
        title : 'Submitted By Mail'
    )@Core.Computed;
    MODIFIEDBY @(
        title : 'Submitted By SAP ID'
    )@Core.Computed;
    MODIFIEDAT @(
        title : 'Submitted On'
    )@Core.Computed;
    CREATEDBY_NAME @(
        title : 'Created By'
    )@Core.Computed;
    CREATEDBY_MAIL @(
        title : 'Created By Mail'
    )@Core.Computed;
    CREATEDBY @(
        title : 'Created By SAP ID'
    )@Core.Computed;
    CREATEDAT @(
        title : 'Created On'
    )@Core.Computed;
    REVIEWED_BY @(
        title : 'Review By SAP ID'
    )@Core.Computed;
    REVIEWED_BY_MAIL @(
        title : 'Review By Mail'
    )@Core.Computed;
    COMMENT @(
        title : 'Comment',
        Common : {
            FieldControl    : Edit
        }
    )@Core.Computed : false;
    NPI_INDICATOR @(
        title : 'NPI Indicator'
    )@Core.Computed : true;
    SYNC_STATUS @(
        title : 'Sync Status'
    )@Core.Computed : true;
    RESET_FLAG @(
        title : 'Reset Flag'
    )@Core.Computed : true;
     ERROR @(
        title : 'Validation Errors'
    )@Core.Computed : true;
    TABLE_MAPPED_AQID @(
        title : 'Table Mapped Aqid',
        UI.HiddenFilter : true,
        UI.Hidden: true
    )@Core.Computed;
}

annotate rfid_unscannable.F4help with @(
 UI.TextArrangement : #TextOnly
){
    GH_SITE @(
        title : 'GH Site',
        UI.HiddenFilter : true
    );
    TO_GHSITE @(
        title : 'To GH Site',
        UI.HiddenFilter : true
    );
    AQID @(
        title : 'CO AQID',
        UI.HiddenFilter : true
    );
    TO_PROGRAM @(
        title : 'To Product',
        UI.HiddenFilter : true
    );
    PROGRAM @(
        title : 'From Product',
        UI.HiddenFilter : true
    );
    FROM_BUSINESS_GRP @(
        title : 'From Business Group',
        UI.HiddenFilter : true
    );
    TO_BUSINESS_GRP @(
        title : 'To Business Group',
        UI.HiddenFilter : true
    );
    STATUS @(
        title : 'Transper Approval Status',
        UI.HiddenFilter : true
    );
    GH_SITE_ORG @(
        title : 'GH Site',
        UI.HiddenFilter : true
    );
}
