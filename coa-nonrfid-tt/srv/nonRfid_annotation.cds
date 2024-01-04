using NonRfid_tt from './nonRfid_service';

/**
 * ***
 *
 * CDS Annotations
 *
 * ***
 */
annotate NonRfid_tt.nonRfidTT with @(
    title             : 'Carryover NonRFID TT',
    Common.Label      : 'Carryover NonRFID TT',
    Capabilities      : {FilterRestrictions: {
        $Type             : 'Capabilities.FilterRestrictionsType',
        RequiredProperties: [GH_Site]
    }},
    UI.TextArrangement: #TextOnly,
    cds.odata.valuelist,
    UI                : {SelectionFields: [
        GH_Site,
        Program,
        Uph,
        Line_Type,
        Line_Id,
        Station,
        Aqid,
        Mapped_Aqid,
        To_GHSite,
        To_Program,
        To_Business_Grp,
        Status,
        Submit_By_Name,
        Submit_Date
    ],
    LineItem  : [
            {
                $Type : 'UI.DataField',
                Value : GH_Site,
                ![@HTML5.CssDefaults]: {width : '12rem'}
                
            },
            {
                $Type : 'UI.DataField',
                Value : Program,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Uph,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Line_Type,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Line_Id,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Aqid,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Mapped_Aqid,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Parent_Item,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Station,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Alt_Station,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },    
            {
                $Type : 'UI.DataField',
                Value : Scope,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },    
            {
                $Type : 'UI.DataField',
                Value : RFID_Scope,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },  
            {
                $Type : 'UI.DataField',
                Value : Group_Priority,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : confLevel,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Projected_Qty,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Override_Qty,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : To_GHSite ,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : To_Program,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : To_Business_Grp,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Transfer_Flag,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Transfer_Qty,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Comments,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Status,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Error,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : LastSyncDate,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : LastSyncBy,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : LastSyncStatus,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : BusinessGrp,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Group_ID,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Line_Priority,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Dept,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Equipment_Name,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Equipment_Type,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Mfr,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : Submit_By_Name,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },    
            {
                $Type : 'UI.DataField',
                Value : Submit_Date,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }, 
            {
                $Type : 'UI.DataField',
                Value : modifiedBy_Name,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedAt,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Reviewed_By_Name,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Review_Date,
                ![@HTML5.CssDefaults]: {width : '12rem'}
            }
        ]}
) {
    GH_Site           @(
        title : 'GH Site',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'GH_Site',
                ValueListProperty: 'GH_Site'
            }]
        }}
    )                                                                        ;
    CM           @(
        title : 'CM',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'CM',
                ValueListProperty: 'CM'
            }]
        }}
    )                                                                        ;
    Site           @(
        title : 'Site',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Site',
                ValueListProperty: 'Site'
            }]
        }}
    )                                                                        ;
    Program           @(
        title : 'CM Program',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Program',
                ValueListProperty: 'Program'
            }]
        }}
    )                                                                        ;
    Aqid              @(
        title : 'AQID (non-RFID)',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Aqid',
                ValueListProperty: 'Aqid'
            }]
        }}
    )                                                                        ;
    BusinessGrp       @(title: 'From Business Group')                             ;
    Group_Priority           @(
        title : 'Group Priority (non-RFID)',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Group_Priority',
                ValueListProperty: 'Group_Priority'
            }]
        }}
    )                                                                        ;
    Dept           @(
        title : 'Department',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Dept',
                ValueListProperty: 'Dept'
            }]
        }}
    )                                                                        ;
    Scope             @(title: 'Scope')                                      ;
    RFID_Scope	      @(title: 'RFID Scope')                                 ;
    Station           @(
        title : 'Projected Station (non-RFID)',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Station',
                ValueListProperty: 'Station'
            }]
        }}
    )                                                                        ;
    Alt_Station       @(title: 'Alternate Station')                          ;
    Parent_Item       @(title: 'Parent Item')                                ;
    Group_ID          @(title: 'Group ID')                                   ;
    Line_Priority     @(title: 'Line Priority')                              ;
    Equipment_Type    @(title: 'Equipment Type')                             ;
    Equipment_Name    @(title: 'EQ Name (Non-RFID)')                         ;
    confLevel         @(title: 'Projection (Confidence Level)')              ;
    Mfr               @(title: 'MFR')                                        ;
    Mapped_Aqid       @(title:'Mapped AQID') ;
    Line_Type           @(
        title : 'Line Type',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Line_Type',
                ValueListProperty: 'Line_Type'
            }]
        }}
    )                                                                        ;
    Uph               @(title: 'UPH')                                        ;
    Line_Id           @(
        title : 'Line ID',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Line_Id',
                ValueListProperty: 'Line_Id'
            }]
        }}
    )                                                                        ;
    Projected_Qty     @(title: 'Projected Qty')                              ;
    Override_Qty     @(title: 'Override Qty')                              ;
    Transfer_Qty      @(title: 'Split Tranfer Qty')                          ; 
    To_GHSite         @(
        title : 'To Site(GH)',
        Common: {
            ValueList   : {
                CollectionPath : 'F4help',
                SearchSupported: true,
                Parameters     : [{
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: 'To_GHSite',
                    ValueListProperty: 'To_GHSite'
                }]
            },
            FieldControl: Edit
        }
    )                                                                         ;                                 
    To_Program        @(
        title : 'To Program',
        Common: {
            ValueList   : {
                CollectionPath : 'F4help',
                SearchSupported: true,
                Parameters     : [{
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: 'To_Program',
                    ValueListProperty: 'To_Program'
                }]
            },
            FieldControl: Edit
        }
    )                                                                          ;
    To_Business_Grp        @(
        title : 'To Business Group',
        Common: {
            ValueList   : {
                CollectionPath : 'F4help',
                SearchSupported: true,
                Parameters     : [{
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: 'To_Business_Grp',
                    ValueListProperty: 'To_Business_Grp'
                }]
            },
            FieldControl: Edit
        }
    )                                                                          ;
    Transfer_Flag     @(
        title: 'Transfer Flag',
        Common : {
            FieldControl    : Edit
        }
    )                                                                          ;
    Comments          @(title: 'Comments')                                     ;
    Status           @(
        title : 'Transfer Approval Status',
        Common: {
            ValueList   : {
                CollectionPath : 'F4help',
                SearchSupported: true,
                Parameters     : [{
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: 'Status',
                    ValueListProperty: 'Status'
                }]
            },
            FieldControl: Edit
        }
    )                                                                            ;
    Error               @(title: 'Message')                                      ;
    Submit_By_Name            @(
        title : 'Submit by Name',
        Common: {ValueList: {
            CollectionPath : 'F4help',
            SearchSupported: true,
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: 'Submit_By_Name',
                ValueListProperty: 'Submit_By_Name'
            }]
        }}
    )                                                                            ;
    Submit_Date      @(title: 'Submitted Date')                                  ;    
    Review_Date      @(title: 'Reviewed Date')                                   ;
    Reviewed_By_Name @(title: 'Reviewed by Name')                                ;
    modifiedBy_Name  @(title: 'Modified by Name')                                ;
    modifiedAt       @(title: 'Modified Date')                                   ;
    Edit @(
        title : 'Edit',
        UI.HiddenFilter : true,
        UI.Hidden: true
    );
    Grp @(
        title : 'Group',
        UI.HiddenFilter : true,
        UI.Hidden: true
    );
    ID @(
        title : 'ID',
        UI.HiddenFilter : true,
        UI.Hidden: true
    );
    Prio @(
        title : 'Priority',
        UI.HiddenFilter : true,
        UI.Hidden: true
    );
    Table_Mapped_Aqid @(
        title : 'Table Mapped AQID',
        UI.HiddenFilter : true,
        UI.Hidden: true
    );
}
