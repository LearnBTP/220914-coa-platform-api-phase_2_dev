using npi_program from './npi_program_service';

/*********************************
*  CDS Annotations
**********************************/

annotate npi_program.CarryoverNPIProgram with @(
    title              : 'Carryover NPI Program',
    Common.Label       : 'Carryover NPI Program',
    Capabilities : {
    FilterRestrictions : {
        $Type              : 'Capabilities.FilterRestrictionsType',
        RequiredProperties : [
            Program
        ]
    }},
    UI.TextArrangement : #TextOnly,
    cds.odata.valuelist,
    UI: {
        SelectionFields  : [
         Program, Program_Description, createdAt, createdBy_Name
        ],
        LineItem  : [
            {
                $Type : 'UI.DataField',
                Value : Program,
                ![@HTML5.CssDefaults]: {width : '8rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : Program_Description,
                ![@HTML5.CssDefaults]: {width : '6rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : createdAt,
                ![@HTML5.CssDefaults]: {width : '20rem'}
            },
            {
                $Type : 'UI.DataField',
                Value : createdBy_Name,
                ![@HTML5.CssDefaults]: {width : '10rem'}
            }
        ]
    }
) {
    Program @(
        title : 'Program',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Program',
                ValueListProperty : 'Program',
            }
            ]
        }
        }
    );
    Program_Description @(
        title : 'Program Description',
        Common: { ValueList : {
            CollectionPath : 'F4help',
            SearchSupported : true,
            Parameters : [ {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : 'Program_Description',
                ValueListProperty : 'Program_Description'
            }
            ]
        }
        }
    );
    modifiedAt @(
        title : 'Modified On',
        UI.HiddenFilter : false
    );
    modifiedBy @(
        title : 'Upload By User',
        UI.HiddenFilter : false
    );
    modifiedBy_Name @(
        title : 'Upload By User Name'
    );
    modifiedBy_mail @(
        title : 'Upload By User Mail'
    );
    createdAt @(
        title : 'Created On',
        UI.HiddenFilter : false
    );
    createdBy @(
        title : 'Created By',
        UI.HiddenFilter : false
    );
    createdBy_Name @(
        title : 'Created By Name'
    );
    createdBy_mail @(
        title : 'Created By Mail'
    );
}
annotate npi_program.F4help with @(
 UI.TextArrangement : #TextOnly,
 
){
    Program @(
        title : 'Program',
        UI.HiddenFilter : true
    );
    Program_Description @(
        title : 'Program Description',
        UI.HiddenFilter : true
    );
}



