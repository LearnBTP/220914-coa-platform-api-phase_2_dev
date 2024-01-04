using com.apple.coa as db  from '../db/schema';


 annotate AQID_Details with @(requires : ['AqidReadOnly','AqidModify']); 

@cds.query.limit: { default: 200000, max: 200000 }
service AQID_Details { 

    
    
    entity SyncAQIDStatus
    @(restrict: [
            {grant:'READ',  to: ['AqidReadOnly']},
            {grant:'WRITE', to: ['AqidModify']} ]) 
     as projection on db.T_COA_SYNC_AQID_STATUS;

    entity AQIDMapping 
    @(restrict: [
            {grant:'READ',  to: ['AqidReadOnly'], where: 'CM = $user.CM and Site = $user.Site'},
            {grant:'WRITE', to: ['AqidModify'], where: 'CM = $user.CM and Site = $user.Site'} ]) 
            as projection on db.T_COA_AQID_MAPPING;
    

    action beginFetch 
     @(requires: 'AqidModify')
    () ;

    @cds.persistence.skip
    entity F4help 
    @(restrict: [
            {grant:'READ',  to: ['AqidReadOnly','AqidModify']}]) 
    {
       key CM: String(30) @title: 'CM';
       key Raw_Aqid: String(18) @title : 'Raw Aqid';
       key Program: String(40) @title : 'Program';
       key MFR: String(255) @title : 'Manufacturer';
       key Site: String(30) @title : 'Site';
       key Recommendation_Type: String(18) @title : 'Recommendation Type';
       key GH_Site: String(30) @title : 'GH Site';
       key Cm_Recommendation : String(18) @title : 'CM Recommendation';
       key Short_Name : String(40) @title : 'Short Name';
       key Comment : String(150) @title : 'Comment';
       key Make_Aqid : String(18) @title : 'Make AQID';
       key Mapped_Aqid : String(18) @title : 'Mapped Aqid';
       key Equipment_Name : String(255) @title : 'Equipment Name'
    }

    @cds.persistence.skip
        entity Upload_AQIDMapping
        {
        csv : LargeBinary @odata.singleton  @Core.MediaType : 'text/csv';
        }

        @cds.persistence.skip
        entity aqid_mapping_action {
                AqidData : Composition of many AQIDMapping;
        };
        
        action selectAllMassUpdate
        @(requires : 'AqidModify')
        (
                url:String,
                Cm_Recommendation: String,
                Short_Name: String,
                Comment: String
        );

}