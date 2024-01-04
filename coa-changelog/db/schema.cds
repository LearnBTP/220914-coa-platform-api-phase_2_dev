using { sap
      } from '@sap/cds/common';

@cds.persistence.exists
Entity ![V_VIEW_TABLES]{
    key ![COLUMN_NAME]: String(50) @titile: 'COLUMN_NAME';
    key ![INDEX_TYPE]: String(50) @titile: 'INDEX_TYPE';
    key ![POSITION]: Integer @titile: 'POSITION';
    key ![TABLE_NAME]: String (50) @title: 'TABLE_NAME';
}

@cds.persistence.exists
Entity ![V_KEY_FIELDS]{
    key ![CONSTRAINT]: String(100) @title: 'CONSTRAINT'
}