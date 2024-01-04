using AQID_Details from './fetch_srv';

/*********************************
*  CDS Annotations
**********************************/

annotate AQID_Details.AQIDMapping with @(
    title              : 'AQIDMapping',
    Common.Label       : 'AQIDMapping',
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
            GH_Site, Program, Raw_Aqid, Make_Aqid, Mapped_Aqid, Cm_Recommendation, Short_Name, MFR, Equipment_Name, Recommendation_Type, Comment
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
                ValueListProperty : 'GH_Site'
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
    Site @(
        title : 'Site',
        Common: { 
            ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Site',
                ValueListProperty : 'Site'
            }
            ]
        }
        }
    ) @Core.Computed;
    Raw_Aqid @(
        title : 'Raw AQID',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Raw_Aqid',
                ValueListProperty : 'Raw_Aqid'
            }
            ]
        }
        }
    ) @Core.Computed;
    Program @(
        title : 'Program',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Program',
                ValueListProperty : 'Program'
            }
            ]
        }
        }
    ) @Core.Computed;
    MFR @(
        title : 'Manufacturer',
        Common: { 
            ValueList : {
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
    ) @Core.Computed;
    Recommendation_Type @(
        title : 'Recommendation Type',
        Common: { 
            ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Recommendation_Type',
                ValueListProperty : 'Recommendation_Type'
            }
            ]
        }
        }
    ) @Core.Computed;
    modifiedAt @( 
        title: 'Updated On'
    ) @Core.Computed;
    modifiedBy @(
        title: 'Updated By ID',
         UI.HiddenFilter : false
    ) @Core.Computed;
     modifiedBy_Name @(
        title: 'Updated By',
         UI.HiddenFilter : false
    ) @Core.Computed;
    modifiedBy_mail @(
        title: 'Modified By Email',
         UI.HiddenFilter : false
    ) @Core.Computed;
    createdBy_Name @(
        title: 'Created By',
         UI.HiddenFilter : false
    ) @Core.Computed;
    createdBy_mail @(
        title: 'Created By Email',
         UI.HiddenFilter : false
    ) @Core.Computed;
    createdBy @(
        title: 'Created By ID',
         UI.HiddenFilter : false
    ) @Core.Computed;
    Update_By_Name @(
        title: 'Updated By',
         UI.HiddenFilter : true
    ) @Core.Computed;
    Update_By_mail @(
        title: 'Updated By Email',
         UI.HiddenFilter : false
    ) @Core.Computed;
    
    Mapped_Aqid @(
        title: 'Mapped AQID',
        Common: { 
            ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Mapped_Aqid',
                ValueListProperty : 'Mapped_Aqid'
            }
            ]
        }
        }
    ) @Core.Computed;
    Cm_Recommendation @(
        title: 'CM Manual Mapped AQID',
         Common: { 
            ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Cm_Recommendation',
                ValueListProperty : 'Cm_Recommendation'
            }
            ]
        },
        FieldControl    : Edit
        }
    ) @Core.Computed:false;
    Station @(
        title: 'Station',
        UI.Hidden : true,
        UI.HiddenFilter : true
    ) @Core.Computed;
    Stack_Item @(
        title: 'Stack Item'
    ) @Core.Computed;
    Make_Aqid @(
        title: 'Make AQID',
        Common: { 
            ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Make_Aqid',
                ValueListProperty : 'Make_Aqid'
            }
            ]
        }
        }
    ) @Core.Computed;
    Short_Name @(
        title: 'Short Name',
        Common: { 
            ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Short_Name',
                ValueListProperty : 'Short_Name'
            }
            ]
        },
        FieldControl    : Edit
        }
    ) @Core.Computed:false;
    Equipment_Name @(
        title: 'Equipment Name'
    ) @Core.Computed;
    Update_By_User @(
        title: 'Update by User',
        UI.HiddenFilter : true
    ) @Core.Computed;
    Comment @(
        title: 'Comment',
        Common: { 
            ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Comment',
                ValueListProperty : 'Comment'
            }
            ]
        },
        FieldControl    : Edit
        }

    ) @Core.Computed:false;
    TimeStamp @(
        UI.Hidden : true,
        UI.HiddenFilter : true
    ) @Core.Computed;
    SAP_CM_Site @(
        UI.Hidden : true,
        UI.HiddenFilter : true
    ) @Core.Computed;
}