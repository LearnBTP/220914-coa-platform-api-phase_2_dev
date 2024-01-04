using {com.apple.coa as coa} from '../db/line_simulation_datamodel';
using V_RFIDDETAILS from '../db/line_simulation_datamodel';
using V_CO_SIMU from '../db/line_simulation_datamodel';
using V_NONRFID_TT from '../db/line_simulation_datamodel';
using V_SIMULATION from '../db/line_simulation_datamodel';

// @cds.query.limit : {
//     default : 200000,
//     max     : 200000
// }

annotate Line_simulation with @(requires : ['LineSimulationReadOnly','LineSimulationModify']); 

@cds.query.limit: {
     default: 5000,
     max    : 5000
}
service Line_simulation {
     entity COSimu           
     @(restrict: [
            {grant:'READ',  to: ['LineSimulationReadOnly','LineSimulationModify']},
            {grant:'WRITE', to: ['LineSimulationModify']} ]) 
     as projection on coa.T_COA_SIMU_CO;

     entity RfidSimu  
     @(restrict: [
            {grant:'READ',  to: ['LineSimulationReadOnly','LineSimulationModify']},
            {grant:'WRITE', to: ['LineSimulationModify']} ])        
     as projection on coa.T_COA_SIMU_RFID;

     entity NonRfidSimu      
     @(restrict: [
            {grant:'READ',  to: ['LineSimulationReadOnly','LineSimulationModify']},
            {grant:'WRITE', to: ['LineSimulationModify']} ]) 
     as projection on coa.T_COA_SIMU_NONRFID;

     entity SimulationData   
     @(restrict: [
            {grant:'READ',  to: ['LineSimulationReadOnly','LineSimulationModify']},
            {grant:'WRITE', to: ['LineSimulationModify']} ]) 
     as projection on coa.T_COA_SIMULATION;

     entity SimulationHeader 
     @(restrict: [
            {grant:'READ',  to: ['LineSimulationReadOnly','LineSimulationModify']},
            {grant:'WRITE', to: ['LineSimulationModify']} ]) 
     as projection on coa.T_COA_SIMULATION_H;

     entity BomStructure 
     @(restrict: [
            {grant:'READ',  to: ['LineSimulationReadOnly','LineSimulationModify']}]) 
     as projection on coa.T_COA_BOM_STRUCTURE;

     entity ViewSimulation 
     @(restrict: [
            {grant:'READ',  to: ['LineSimulationReadOnly','LineSimulationModify']}]) 
     as projection on V_SIMULATION;

     
    
     entity DropDownHelp                    {
          key GH_Site        : String ;
          key CM             : String ;
          key Site           : String ;
          key Program        : String ;
          key LineId        : String ;
          key To_Business_Grp : String;
     }


action OnSimulate
@(requires : 'LineSimulationModify')
(
    simulationName : String
);

action DeleteSimulation
@(requires : 'LineSimulationModify')
(
    simulationName : String
);

action BeforeSimulateValidation

     (From_GHSite : many String, Program : many String

     ) returns {
          msg : String
     };

};