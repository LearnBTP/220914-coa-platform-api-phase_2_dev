using { com.apple.coa as coa } from '../db/npi_program_datamodel';
@cds.query.limit: { default: 200000, max: 200000 }

annotate npi_program with @(requires : ['NPIProgramModify']);

service npi_program {

entity CarryoverNPIProgram @(restrict: [
            {grant:'READ',  to: ['NPIProgramModify']},
            {grant:'WRITE', to: ['NPIProgramModify']} ]) as projection on coa.T_COA_NPI_PROGRAM;

@readonly
@cds.persistence.skip
entity F4help @(restrict: [
            {grant:'READ',  to: ['NPIProgramModify']}])
    {
       key Program : String(40);
       key Program_Description :  String(255);
    }
}

