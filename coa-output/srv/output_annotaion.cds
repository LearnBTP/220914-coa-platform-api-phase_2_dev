using output from './output';

/*********************************
*  CDS Annotations
**********************************/

annotate output.CO_Output with @(
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            To_GHSite
        ]
    },
    InsertRestrictions : {
        $Type : 'Capabilities.InsertRestrictionsType',
        Insertable : false
    },
    DeleteRestrictions : {
        $Type : 'Capabilities.DeleteRestrictionsType',
        Deletable : false
    }
    },
    UI: {
        SelectionFields : [
            To_GHSite, To_Product, To_Business_Grp, From_GHSite, From_Product, From_Business_Grp, AQID, MFR, SHORT_NAME, EQ_Name,Status
        ],
          LineItem  : [
        {
            $Type : 'UI.DataField',
            Value : From_GHSite,
            ![@HTML5.CssDefaults]: {width : '8rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : From_Product,
            ![@HTML5.CssDefaults]: {width : '8rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : From_Business_Grp,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : AQID,
            ![@HTML5.CssDefaults]: {width : '6rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : To_GHSite,
            ![@HTML5.CssDefaults]: {width : '8rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : To_Product,
            ![@HTML5.CssDefaults]: {width : '6rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : To_Business_Grp,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : MFR,
            ![@HTML5.CssDefaults]: {width : '6rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : EQ_Name,
            ![@HTML5.CssDefaults]: {width : '10rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : SHORT_NAME,
            ![@HTML5.CssDefaults]: {width : '8rem'}
        },
        
        
        {
            $Type : 'UI.DataField',
            Value : Quantity,
            ![@HTML5.CssDefaults]: {width : '6rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : CM_Balance_Qty,
            ![@HTML5.CssDefaults]: {width : '8rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : Comment,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : Status,
            ![@HTML5.CssDefaults]: {width : '35rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : Review_Date,
            ![@HTML5.CssDefaults]: {width : '30rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : createdBy_Name,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : createdAt,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : modifiedBy_Name,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : modifiedAt,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        },
        {
            $Type : 'UI.DataField',
            Value : BeError,
            ![@HTML5.CssDefaults]: {width : '15rem'}
        }
        ]
    }
    
)
{
    From_GHSite @(
        title : 'From GH Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'From_GHSite',
                ValueListProperty : 'From_GHSite'
            }
            ]
        }
        }
    );
    From_Product @(
        title : 'From Product',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'From_Product',
                ValueListProperty : 'From_Product'
            }
            ]
        }
        }
    );
    From_Business_Grp @(
        title : 'From Business Group',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'From_Business_Grp',
                ValueListProperty : 'From_Business_Grp'
            }
            ]
        }
        }
    );
    AQID @(
        title : 'AppleID',
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
    );
    SHORT_NAME @(
        title : 'Short Name',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'SHORT_NAME',
                ValueListProperty : 'SHORT_NAME'
            }
            ]
        }
        }
    );
    To_GHSite @(
        title : 'To GH Site',
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
    );
    To_Product @(
        title : 'To Product',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'To_Product',
                ValueListProperty : 'To_Product'
            }
            ]
        }
        }
    );
    To_Business_Grp @(
        title : 'To Business Group',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'To_Business_Grp',
                ValueListProperty : 'To_Business_Grp'
            }
            ]
        }
        }
    );
    EQ_Name @(
        title : 'EQ Name',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'EQ_Name',
                ValueListProperty : 'EQ_Name'
            }
            ]
        }
        }
    );
    MFR @(
        title : 'MFR',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'MFR',
                ValueListProperty : 'MFR'
            }
            ]
        }
        }
    );
    Quantity @(
        title : 'Quantity' 
    );
    CM_Balance_Qty @(
        title : 'CM Balance Qty',
        Common : {
            FieldControl    : Edit
        }
    );
    Comment @(
        title : 'Comment',
        Common : {
            FieldControl    : Edit
        }
    );
    Status @(
        title : 'CO Balance Approval Status',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Status',
                ValueListProperty : 'Status'
            }
            ]
        }
        }
    );
    Approved_By @( 
        title : 'CO Balance Approved By ID'
    );
    Approved_By_Name @( 
        title : 'CO Balance Approved By'
    );
    Approved_By_mail @( 
        title : 'CO Balance Approved By Mail'
    );
    Review_Date @(
        title : 'Approved/Rejected Date'
    );
    createdBy @(
        title : 'Created By ID',
        UI.HiddenFilter : false
    );
    createdBy_Name @(
        title : 'Created By'
    );
    createdBy_mail @(
        title : 'Created By Mail'
    );
    createdAt @(
        title : 'Created On',
        UI.HiddenFilter : false
    );
    modifiedBy @(
        title : 'Updated By ID',
        UI.HiddenFilter : false
    );
    modifiedBy_Name @(
        title : 'Updated By'
    );
    modifiedBy_mail @(
        title : 'Updated By Mail'
    );
    modifiedAt @(
        title : 'Updated On',
        UI.HiddenFilter : false
    );
    BeError @(
        title : 'Validation Errors',
        UI.HiddenFilter : true 
    );
    From_Site @(
        title : 'From Site'
    );
    From_CM @(
        title : 'From CM'
    );
    To_Site @(
        title : 'To Site'
    );
    To_CM @(
        title : 'To CM'
    );
    SAP_CM_Site @(
        title : 'SAP From CM Site',
        UI.HiddenFilter : true
    );
    SAP_To_CM_Site @(
        title : 'SAP To CM Site',
        UI.HiddenFilter : true
    );
    CO_Type @(
        title : 'CO Type'
    );

}

annotate output.F4help with @(
 UI.TextArrangement : #TextOnly
){
    To_GHSite @(
        title : 'To GH Site',
        UI.HiddenFilter : true
    );
    To_Product @(
        title : 'To Product',
        UI.HiddenFilter : true
    );
    To_Business_Grp @(
        title : 'To Business Group',
        UI.HiddenFilter : true
    );
    From_GHSite @(
        title : 'From GH Site',
        UI.HiddenFilter : true
    );
    From_Product @(
        title : 'From Product',
        UI.HiddenFilter : true
    );
    From_Business_Grp @(
        title : 'From Business Group',
        UI.HiddenFilter : true
    );
    AQID @(
        title : 'AppleID',
        UI.HiddenFilter : true
    );
    MFR @(
        title : 'MFR',
        UI.HiddenFilter : true
    );
    SHORT_NAME @(
        title : 'Short Name',
        UI.HiddenFilter : true
    );
    EQ_Name @(
        title : 'EQ Name',
        UI.HiddenFilter : true
    );
    Status @(
        title : 'Status',
        UI.HiddenFilter : true
    );
    
}
