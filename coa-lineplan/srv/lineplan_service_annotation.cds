using lineplan from './lineplan_service';

/*********************************
*  CDS Annotations
**********************************/

annotate lineplan.CarryoverMainline with @(
    title              : 'Carryover Mainline',
    Common.Label       : 'Carryover Mainline',
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            GH_Site
        ]
    }},
    UI.TextArrangement : #TextOnly,
    cds.odata.valuelist,
    UI: {
        SelectionFields  : [
            GH_Site, Program, modifiedAt, modifiedBy_Name
        ],
        LineItem  : [
            {
                $Type : 'UI.DataField',
                Value : GH_Site,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Program,
                ![@HTML5.CssDefaults]: {width : '6rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Uph,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Working_Hrs,
                ![@HTML5.CssDefaults]: {width : '20rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Efficiency_Field,
                ![@HTML5.CssDefaults]: {width : '20rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : BoH,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Fatp_Sustaining_Qty,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Comment,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedAt,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedBy_Name,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : createdAt,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : createdBy_Name,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Error,
                ![@HTML5.CssDefaults]: {width : '20rem'}
            }
        ]
    }
) {
    GH_Site @(
        title : 'GH Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'GH_Site',
                ValueListProperty : 'Mainline_GH_Site',
            }
            ]
        }
        }
    );
    Site @(
        title : 'Site'
    );
    CM @(
        title : 'CM'
    );
    Program @(
        title : 'Program',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Program',
                ValueListProperty : 'Mainline_Program'
            }
            ]
        }
        }
    );
    Uph @(
        title : 'FATP UPH',
        Common : {
            FieldControl    : Edit
        }
    );
    Working_Hrs @(
        title : 'FATP Working hours',
        Common : {
            FieldControl    : Edit
        }
    );
    Efficiency_Field @(
        title : 'FATP Efficiency/Yield%',
        Common : {
            FieldControl    : Edit
        }
    );
    BoH @(
        title : 'FATP BOH Qty',
        Common : {
            FieldControl    : Edit
        }
    );
    Fatp_Sustaining_Qty @(
        title : 'FATP Sustaining line Qty',
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
    modifiedAt @(
        title : 'Modified On',
        UI.HiddenFilter : false
    );
    modifiedBy @(
        title : 'Modified By ID',
        UI.HiddenFilter : false
    );
    modifiedBy_Name @(
        title : 'Modified By'
    );
    modifiedBy_mail @(
        title : 'Modified By Mail'
    );
    createdAt @(
        title : 'Created On',
        UI.HiddenFilter : false
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
    Error @(
        title : 'Error' ,
        UI.HiddenFilter : true
    );
    SAP_CM_Site  @(
        title  : 'SAP CM Site',
        UI.HiddenFilter : true
    );
}

annotate lineplan.CarryoverSubline with @(
    title              : 'Carryover Subline',
    Common.Label       : 'Carryover Subline',
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            GH_Site
        ]
    }},
    UI.TextArrangement : #TextOnly,
    cds.odata.valuelist,
    UI: {
        SelectionFields  : [
            GH_Site, Program,Sub_Line_Name, modifiedAt,modifiedBy_Name
        ],
        LineItem  : [
            {
                $Type : 'UI.DataField',
                Value : GH_Site,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Program,
                ![@HTML5.CssDefaults]: {width : '6rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Sub_Line_Name,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Working_Hrs,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Uph,
                ![@HTML5.CssDefaults]: {width : '4rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Yield,
                ![@HTML5.CssDefaults]: {width : '4rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Remote_Site_Cap_Demand,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : boH_Qty,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Comment,
                ![@HTML5.CssDefaults]: {width : '17rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedAt,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedBy_Name,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : createdAt,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : createdBy_Name,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Error,
                ![@HTML5.CssDefaults]: {width : '20rem'}
            }
        ]
    }
){
    GH_Site @(
        title : 'GH Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'GH_Site',
                ValueListProperty : 'Subline_GH_Site',
            }
            ]
        }
        }
    );
    Site @(
        title : 'Site'
    );
    CM @(
        title : 'CM'
    );
    Program @(
        title : 'Program',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Program',
                ValueListProperty : 'Subline_Program'
            }
            ]
        }
        }
    );
    Sub_Line_Name @(
        title : 'Sub-Line Name',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Sub_Line_Name',
                ValueListProperty : 'Sub_Line_Name'
            }
            ]
        }
        }
    );
    Yield @(
        title : 'Yield',
        Common : {
            FieldControl    : Edit
        }
    );
    Uph @(
        title : 'UPH',
        Common : {
            FieldControl    : Edit
        }
    );
    boH_Qty @(
        title : 'BOH Qty',
        Common : {
            FieldControl    : Edit
        }
    );
    Working_Hrs @(
        title : 'Working Hours',
        Common : {
            FieldControl    : Edit
        }
    );
    Remote_Site_Cap_Demand @(
        title : 'Remote Site Capacity Demand',
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
    Error @(
        title : 'Error',
        UI.HiddenFilter : true
    );
    modifiedAt @(
        title : 'Modified On',
        UI.HiddenFilter : false,
    );
    modifiedBy @(
        title : 'Modified By ID',
        UI.HiddenFilter : false
    );
    modifiedBy_Name @(
        title : 'Modified By'
    );
    modifiedBy_mail @(
        title : 'Modified By Mail'
    );
    createdAt @(
        title : 'Created On',
        UI.HiddenFilter : false
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
    SAP_CM_Site  @(
        title  : 'SAP CM Site',
        UI.HiddenFilter : true
    );
}

annotate lineplan.CarryoverLineplan with @(
    title              : 'Carryover Lineplan',
    Common.Label       : 'Carryover Lineplan',
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            GH_Site
        ]
    }},
    UI.TextArrangement : #TextOnly,
    cds.odata.valuelist,
    UI: {
        SelectionFields  : [
            GH_Site, Program, Sub_Line_Name, Date_Subline, Upload_By_User_Subline_Name
        ],
        LineItem  : [
            {
                $Type : 'UI.DataField',
                Value : GH_Site,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Program,
                ![@HTML5.CssDefaults]: {width : '6rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Sub_Line_Name,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Uph,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : boH_Qty,
                ![@HTML5.CssDefaults]: {width : '4rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Working_Hrs,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Remote_Site_Cap_Demand,
                ![@HTML5.CssDefaults]: {width : '24rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : CO_LINE_QTY,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Actual_Lines_Chosen,
                ![@HTML5.CssDefaults]: {width : '24rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Comment_Mainline,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Comment_Subline,
                ![@HTML5.CssDefaults]: {width : '15rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Upload_By_User_Mainline_Name,
                ![@HTML5.CssDefaults]: {width : '25rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Upload_By_User_Subline_Name,
                ![@HTML5.CssDefaults]: {width : '25rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Date_Subline,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Date_Mainline,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            }
        ]
    }
){
    GH_Site @(
        title : 'GH Site',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'GH_Site',
                ValueListProperty : 'Lineplan_GH_Site',
            }
            ]
        }
        }
    );
    Site @(
        title : 'Site'
    );
    CM @(
        title : 'CM'
    );
    Program @(
        title : 'Program',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Program',
                ValueListProperty : 'Lineplan_Program'
            }
            ]
        }
        }
    );
    Sub_Line_Name @(
        title : 'Sub-Line Name',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Sub_Line_Name',
                ValueListProperty : 'Lineplan_Sub_Line_Name'
            }
            ]
        }
        }
    );
    Date_Subline @(
        title : 'Subline Created On'
    );
    Upload_By_User_Subline @(
        title : 'Modified By ID Subline'
    );
    Upload_By_User_Subline_Name @(
        title : 'Modified By Subline'
    );
    Upload_By_User_Subline_mail @(
        title : 'Modified By Subline Mail'
    );
    boH_Qty @(
        title : 'Sub-line BOH Qty'
    );
    Uph @(
        title : 'Sub-line UPH'
    );
    Working_Hrs @(
        title : 'Sub-line Working Hours'
    );
    Remote_Site_Cap_Demand @(
        title : 'Sub-line Remote Site Capacity Demand'
    );
    Fatp_Sustaining_Qty @(
        title : 'FATP Sustaining Qty'
    );
    Mainline_Uph @(
        title : 'Mainline UPH'
    );
    Yield @(
        title : 'Yield'
    );
    CO_LINE_QTY @(
        title : 'Sub-line CO Line Qty'
    );
    Actual_Lines_Chosen @(
        title : 'Sub-line Actual CO Line Qty'
    );
    Date_Mainline @(
        title : 'Mainline Created On'
    );
    Upload_By_User_Mainline @(
        title : 'Modified By ID Mainline'
    );
    Upload_By_User_Mainline_Name @(
        title : 'Modified By Mainline'
    );
    Upload_By_User_Mainline_mail @(
        title : 'Modified By Mainline Mail'
    );
    Comment_Mainline @(
        title : 'Comment Mainline'
    );
    Comment_Subline @(
        title : 'Comment Subline'
    );
    SAP_CM_Site  @(
        title  : 'SAP CM Site',
        UI.HiddenFilter : true
    );
}

annotate lineplan.F4help with @(
 UI.TextArrangement : #TextOnly,
 
){
    Mainline_Program @(
        title : 'Program',
        UI.HiddenFilter : true
    );
    Mainline_GH_Site @(
        title : 'GH Site',
        UI.HiddenFilter : true
    );
    Subline_Program @(
        title : 'Program',
        UI.HiddenFilter : true
    );
    Sub_Line_Name @(
        title : 'Sub-Line Name',
        UI.HiddenFilter : true
    );
    Subline_GH_Site @(
        title : 'GH Site',
        UI.HiddenFilter : true
    );
    Lineplan_Program @(
        title : 'Program',
        UI.HiddenFilter : true
    );
    Lineplan_Sub_Line_Name @(
        title : 'Sub-Line Name',
        UI.HiddenFilter : true
    );
    Lineplan_GH_Site @(
        title : 'GH Site',
        UI.HiddenFilter : true
    );
    Sub_Line_Name_org @(
        title : 'Sub-Line Name',
        UI.HiddenFilter : true
    );

}