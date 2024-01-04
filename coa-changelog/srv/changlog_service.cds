using {com.apple.coa as coa} from '../db/changelog_datamodel';
using V_VIEW_TABLES from '../db/schema';
using V_KEY_FIELDS from '../db/schema';
annotate ChangelogService with @(requires : [
    'system-user',
    'AnnotationModify',
    'AqidModify',
    'RfidOnHandTTModify',
    'MainLineModify',
    'SubLineModify',
    'COOutputModify',
    'COOutputReadOnly',
    'SubLineReadOnly',
    'MainLineReadOnly',
    'RfidOnHandTTReadOnly',
    'AqidReadOnly',
    'AnnotationReadOnly'
]);


service ChangelogService @(impl : './changelog-service') {

    type tableData {
        statusCode : Integer;
        message    : String;
    }
    @readonly
    entity changHistory as projection on coa.T_COA_CHANGE_HISTORY order by modifiedAt desc;

    action compareTabels @(requires : [
        'system-user'
    ])
           (body : String) returns tableData;

    @cds.persistence.skip
    entity F4help @(requires :{grant:'READ',  to: [
    'system-user',
    'AnnotationModify',
    'AqidModify',
    'RfidOnHandTTModify',
    'MainLineModify',
    'SubLineModify',
    'COOutputModify',
    'COOutputReadOnly',
    'SubLineReadOnly',
    'MainLineReadOnly',
    'RfidOnHandTTReadOnly',
    'AqidReadOnly',
    'AnnotationReadOnly'
]}) {
        key Old_Value   : String(40) @title : 'Old_Value';
        key New_Value   : String(30) @title : 'New_Value';
        key Key_Fields  : String(30) @title : 'Key_Fields';
        key Action_Type : String(30) @title : 'Action_Type';
        key Field_Name : String(30) @title : 'Field_Name'
    }
}
