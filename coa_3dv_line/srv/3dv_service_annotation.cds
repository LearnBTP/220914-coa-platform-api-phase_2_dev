using Annotation3DV from './3dv_service';

/**
 * ***
 *
 * CDS Annotations
 *
 * ***
 */


annotate Annotation3DV.AnnotationDetails with @(
    title              : 'RFIDs',
    Common.Label       : 'RFIDs',
    UI.TextArrangement : #TextOnly,
    
    UI                 : { 
        PresentationVariant : {
        SortOrder       : [ 
            {
                Property    : modifiedAt,
                Descending  : true,
            },
            {
                Property    : LineId,
                Descending  : true,
            }
        ],
        Visualizations  : ['@UI.LineItem'],
    },
        LineItem : [
        {
            $Type                 : 'UI.DataField',
            Value                 : Asset_id,
            ![@HTML5.CssDefaults] : {width : '9rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : LineId,
            ![@HTML5.CssDefaults] : {width : '8rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Rfid,
            ![@HTML5.CssDefaults] : {width : '16rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Sernr,
            ![@HTML5.CssDefaults] : {width : '10rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : ZZVModel,
            ![@HTML5.CssDefaults] : {width : '10rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Aqid,
            ![@HTML5.CssDefaults] : {width : '6rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : EquipName,
            ![@HTML5.CssDefaults] : {width : '16rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Equip_Status,
            ![@HTML5.CssDefaults] : {width : '8rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : CM_DEPT,
            ![@HTML5.CssDefaults] : {width : '6rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Equip_CM,
            ![@HTML5.CssDefaults] : {width : '6rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Equip_Site,
            ![@HTML5.CssDefaults] : {width : '6rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Program,
            ![@HTML5.CssDefaults] : {width : '6rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Equip_Manf,
            ![@HTML5.CssDefaults] : {width : '8rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : CarryOverAqid,
            ![@HTML5.CssDefaults] : {width : '8rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : CarryOverEqName,
            ![@HTML5.CssDefaults] : {width : '16rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : CarryOverOldProgram,
            ![@HTML5.CssDefaults] : {width : '6rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Override_LineId,
            ![@HTML5.CssDefaults] : {width : '8rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : LineType,
            ![@HTML5.CssDefaults] : {width : '9rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Uph,
            ![@HTML5.CssDefaults] : {width : '6rem'}
        },
        {
            $Type                 : 'UI.DataField',
            Value                 : Comments,
            ![@HTML5.CssDefaults] : {width : '15rem'}
        },
        {
            $Type                     : 'UI.DataField',
            Value                     : ErrorMsg,
            Criticality               : #Negative,
            CriticalityRepresentation : #WithoutIcon,
            ![@HTML5.CssDefaults]     : {width : '35rem'}
        },
    ]

    }
) {
    Asset_id            @(title : 'Asset Id');
    LineId              @(title : 'Line Id');
    Rfid                @(title : 'Rfid');
    Sernr               @(title : 'Serial No');
    ZZVModel            @(title : 'Eq. Model No');
    Aqid                @(title : 'AQID');
    EquipName           @(title : 'Eq. Name');
    Equip_Status        @(title : 'Eq. Status');
    CM_DEPT             @(title : 'CM Department');
    Equip_CM            @(title : 'Eq. CM');
    Equip_Site          @(title : 'Eq. Site');
    Program             @(title : 'Program');
    Equip_Manf          @(title : 'Vendor');
    CarryOverAqid       @(title : 'CO Make AQID');
    CarryOverEqName     @(title : 'CO Eq. Name');
    CarryOverOldProgram @(title : 'CO Prgm');
    Override_LineId     @(title : 'Override LineId');
    LineType            @(title : 'Line Type');
    Uph                 @(title : 'UPH');
    Comments            @(title : 'Comments');
    ErrorMsg            @(title : 'Validation Errors');
}


annotate Annotation3DV.HeaderAnnotation with @(
    Capabilities : {FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [Alderaan_Site]
    }},
    UI           : {SelectionFields : [
        Alderaan_Site,
        Alderaan_CM,
        Building,
        Floor,
        Status,
        Scan_Start_Date,
        Scan_End_Date,
        LineId,
        LineType,
        Area,
        ModifiedAt,
        ModifiedBy_Name
    ],

    }
) {
    Alderaan_CM      @(
        title  : 'Alderaan CM',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Alderaan_CM',
                ValueListProperty : 'Alderaan_CM'
            }]
        }}
    );
    SAP_CM_Site      @(
        title           : 'From CM',
        UI.HiddenFilter : true
    );
    Alderaan_Site    @(
        title  : 'Alderaan Site',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Alderaan_Site',
                ValueListProperty : 'Alderaan_Site'
            }]
        }}
    );
    Building         @(
        title  : 'Building',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Building',
                ValueListProperty : 'Building'
            }]
        }}
    );
    Floor            @(
        title  : 'Floor',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Floor',
                ValueListProperty : 'Floor'
            }]
        }}
    );
    Site             @(title : 'Site');
    CM               @(title : 'CM');
    LineId           @(
        title  : 'Line ID',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'LineId',
                ValueListProperty : 'LineId'
            }]
        }}
    );
    LineType         @(
        title  : 'Line Type',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'LineType',
                ValueListProperty : 'LineType'
            }]
        }}
    );
    Area             @(
        title  : 'Area',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Area',
                ValueListProperty : 'Area'
            }]
        }}
    );
    Image_FileName   @(UI.HiddenFilter : true);
    Image_FileId     @(UI.HiddenFilter : true);
    Origin_X         @(UI.HiddenFilter : true);
    Origin_Y         @(UI.HiddenFilter : true);
    Scale_X          @(UI.HiddenFilter : true);
    Scale_Y          @(UI.HiddenFilter : true);
    Line             @(UI.HiddenFilter : true);
    Lock             @(UI.HiddenFilter : true);
    createdBy        @(UI.HiddenFilter : true);
    ModifiedAt       @(title : 'Modified At');
    ModifiedBy       @(title : 'Modified By ID');
    ModifiedBy_Name       @(title : 'Modified By');
    ModifiedBy_mail       @(title : 'Modified By Mail');
    Status            @(
        title  : 'Status',
        Common : {ValueList : {
            CollectionPath  : 'F4help',
            SearchSupported : true,
            Parameters      : [{
                $Type             : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Status',
                ValueListProperty : 'Status'
            }]
        }}
    );
}

annotate Annotation3DV.F4help with @(
    title              : 'Search Help',
    Common.Label       : 'Search Help',
    UI.TextArrangement : #TextOnly,

) {
    Building      @(UI.HiddenFilter : true);
    Floor         @(UI.HiddenFilter : true);
    Area          @(UI.HiddenFilter : true);
    LineType      @(UI.HiddenFilter : true);
    LineId        @(UI.HiddenFilter : true);
    Alderaan_CM   @(UI.HiddenFilter : true);
    Alderaan_Site @(UI.HiddenFilter : true);
    Status        @(UI.HiddenFilter : true);
}