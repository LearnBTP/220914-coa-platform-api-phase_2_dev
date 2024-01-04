using ChangelogService from './changlog_service';

/*********************************
*  CDS Annotations
**********************************/

annotate ChangelogService.changHistory with @(
    title              : 'Change History',
    Common.Label       : 'Change History',
    Capabilities.FilterRestrictions     : {FilterExpressionRestrictions : [{
        Property          : 'modifiedAt',
        AllowedExpressions : 'SingleRange'
    }]},
    UI.TextArrangement : #TextOnly,
    cds.odata.valuelist,
    UI : {
    SelectionFields : [
        Key_Fields,
        Field_Name,
        Action_Type,
        Old_Value,
        New_Value,
        modifiedAt,
        modifiedBy_Name
    ],
    PresentationVariant  : {
        $Type : 'UI.PresentationVariantType',
        RequestAtLeast : [CM, To_CM,Site,To_Site, SAP_CM_Site, SAP_To_CM_Site]
    },
    LineItem        : [
        {
            $Type             : 'UI.DataField',
            Value             : Key_Fields,
            ![@UI.Importance] : #High
        },
        {
            $Type             : 'UI.DataField',
            Value             : Field_Name,
            ![@UI.Importance] : #High
        },
        {
            $Type             : 'UI.DataField',
            Value             : Action_Type,
            ![@UI.Importance] : #High
        },
        {
            $Type             : 'UI.DataField',
            Value             : Old_Value,
            ![@UI.Importance] : #High
        },
        {
            $Type             : 'UI.DataField',
            Value             : New_Value,
            ![@UI.Importance] : #High
        },
        {
            $Type             : 'UI.DataField',
            Value             : modifiedAt,
            ![@UI.Importance] : #High
        },
        {
            $Type             : 'UI.DataField',
            Value             : modifiedBy_Name,
            ![@UI.Importance] : #High
        },
        {
            $Type             : 'UI.DataField',
            Value             : CM
        },
        {
            $Type             : 'UI.DataField',
            Value             : To_CM
        },
        {
            $Type             : 'UI.DataField',
            Value             : Site
        },
        {
            $Type             : 'UI.DataField',
            Value             : To_Site
        },
        {
            $Type             : 'UI.DataField',
            Value             : SAP_CM_Site
        },
        {
            $Type             : 'UI.DataField',
            Value             : SAP_To_CM_Site
        }
    ]
}) {
    Key_Fields  @(
        title  : 'Key Fields'
    );
    Field_Name  @(
        title  : 'Field Name',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : 'Field_Name',
                    ValueListProperty : 'Field_Name'
                }
            ]
        }}
    );
    Action_Type @(
        title  : 'Action Type',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : 'Action_Type',
                    ValueListProperty : 'Action_Type'
                }
            ]
        }}
    );
    Old_Value   @(
        title  : 'Old Value',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : 'Old_Value',
                    ValueListProperty : 'Old_Value'
                }
            ]
        }}
    );
    New_Value   @(
        title  : 'New Value',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    LocalDataProperty : 'New_Value',
                    ValueListProperty : 'New_Value'
                }
            ]
        }}
    );
    modifiedAt  @(
        title  : 'Modified On',
        UI.HiddenFilter : false
    );
    modifiedBy  @(
        title  : 'Modified By ID',
        UI.HiddenFilter : false
    );
    modifiedBy_Name  @(
        title  : 'Modified By'
    );
    modifiedBy_mail @(
        title  : 'Modified By Mail'
    );
    CM  @(
        title  : 'CM',
        UI.HiddenFilter : true,
        UI.Hidden :  true
    );
    To_CM  @(
        title  : 'To CM',
        UI.HiddenFilter : true,
        UI.Hidden :  true
    );
    Site  @(
        title  : 'Site',
        UI.HiddenFilter : true,
        UI.Hidden :  true
    );
    To_Site  @(
        title  : 'To Site',
        UI.HiddenFilter : true,
        UI.Hidden :  true
    );
    SAP_CM_Site  @(
        title  : 'SAP CM Site',
        UI.HiddenFilter : true,
        UI.Hidden :  true
    );
    SAP_To_CM_Site  @(
        title  : 'SAP To CM Site',
        UI.HiddenFilter : true,
        UI.Hidden :  true
    );
    createdAt @(
        title: 'Created On'
    );
    createdBy @(
        title: 'Created By ID'
    );
    createdBy_Name @(
        title : 'Created By'
    );
    createdBy_mail @(
        title : 'Created By Mail'
    )
}
annotate ChangelogService.F4help with @(
 UI.TextArrangement : #TextOnly,
 
){
    Old_Value @(
        title : 'Old Value',
        UI.HiddenFilter : true
    );
    New_Value @(
        title : 'New Value',
        UI.HiddenFilter : true
    );
    Key_Fields @(
        title : 'Key Fields',
        UI.HiddenFilter : true
    );
    Action_Type @(
        title : 'Action Type',
        UI.HiddenFilter : true
    );
    Field_Name @(
        title : 'Field Name',
        UI.HiddenFilter : true
    );
}
