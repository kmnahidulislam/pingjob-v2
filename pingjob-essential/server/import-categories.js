import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const categories = [
  { id: 4, name: '.NET', description: 'net-developer' },
  { id: 29, name: 'Business Analyst', description: 'business-analyst' },
  { id: 30, name: 'Java', description: 'java-developer' },
  { id: 31, name: 'Oracle DBA', description: 'oracle-dba' },
  { id: 32, name: 'Oracle Apps DBA', description: 'oracle-applications-dba' },
  { id: 33, name: 'Project Manager', description: 'project-manager' },
  { id: 34, name: 'Program Manager', description: 'program-manager' },
  { id: 35, name: 'Salesforce.com', description: 'salesforcecom' },
  { id: 36, name: 'DevOps Engineer', description: 'devops-engineer' },
  { id: 37, name: 'Quality Analyst', description: 'quality-analyst' },
  { id: 39, name: 'Data Analyst', description: 'data-analyst' },
  { id: 40, name: 'Data Architect', description: 'data-architect' },
  { id: 41, name: 'Security Architect', description: 'security-architect' },
  { id: 42, name: 'PHP Developer', description: 'php-developer' },
  { id: 43, name: 'SDET', description: 'sdet' },
  { id: 44, name: 'Technical Writer', description: 'technical-writer' },
  { id: 46, name: 'Mobile Engineer', description: 'mobile-engineer' },
  { id: 47, name: 'C Developer', description: 'c-developer' },
  { id: 48, name: 'Unix Administrator', description: 'unix-administrator' },
  { id: 49, name: 'Windows Administrator', description: 'windows-administrator' },
  { id: 51, name: 'SAP Fun', description: 'sap-functional' },
  { id: 52, name: 'SAP Basis Consultant', description: 'sap-basis-consultant' },
  { id: 53, name: 'SAP Tech Consultant', description: 'sap-technical-consultant' },
  { id: 55, name: 'Oracle Apps', description: 'oracle-apps' },
  { id: 56, name: 'Oracle Developer', description: 'oracle-developer' },
  { id: 57, name: 'Hyperion', description: 'hyperion' },
  { id: 60, name: 'Qlikview', description: 'qlikview' },
  { id: 61, name: 'Informatica', description: 'informatica' },
  { id: 63, name: 'SQL Server', description: 'sql-server' },
  { id: 66, name: 'Power BI Dev', description: 'power-bi-developer' },
  { id: 67, name: 'Data Scientist', description: 'data-scientist' },
  { id: 69, name: 'Network Admin', description: 'network-administrator' },
  { id: 70, name: 'Scrum Master', description: 'scrum-master' },
  { id: 71, name: 'Software Architect', description: 'software-architect' },
  { id: 72, name: 'Solution Architect', description: 'solution-architect' },
  { id: 73, name: 'Infra Architect', description: 'infrastructure-architect' },
  { id: 74, name: 'Help Desk', description: 'help-desk' },
  { id: 75, name: 'User Interface', description: 'User-Interface' },
  { id: 79, name: 'JIRA Admin', description: 'jira-administrator' },
  { id: 80, name: 'Sitecore Dev', description: 'sitecore-developer' },
  { id: 81, name: 'Big Data', description: 'BigData' },
  { id: 82, name: 'ETL Tester', description: 'etl-tester' },
  { id: 83, name: 'PeopleSoft Dev', description: 'peoplesoft-developer' },
  { id: 85, name: 'Application Packager', description: 'application-packager' },
  { id: 86, name: 'AS/400 Developer', description: 'as400-developer' },
  { id: 87, name: 'Biztalk Developer', description: 'biztalk-developer' },
  { id: 88, name: 'Build Release', description: 'build-release' },
  { id: 89, name: 'Android Developer', description: 'android-developer' },
  { id: 91, name: 'Cassandra Admin', description: 'cassandra-administrator' },
  { id: 92, name: 'Cisco Network Admin', description: 'cisco-network-administrator' },
  { id: 93, name: 'Citrix Administrator', description: 'citrix-administrator' },
  { id: 94, name: 'Clinical Consultant', description: 'clinical-consultant' },
  { id: 95, name: 'SAS Consultant', description: 'sas-consultant' },
  { id: 96, name: 'ColdFusion Developer', description: 'coldfusion-developer' },
  { id: 99, name: 'Data Modeler', description: 'data-modeler' },
  { id: 100, name: 'DB2 DBA', description: 'db2-dba' },
  { id: 101, name: 'Documentum', description: 'documentum-developer' },
  { id: 102, name: 'EDI Analyst', description: 'edi-analyst' },
  { id: 103, name: 'Embedded Developer', description: 'embedded-developer' },
  { id: 105, name: 'Flex Developer', description: 'flex-developer' },
  { id: 106, name: 'Genesys Developer', description: 'genesys-developer' },
  { id: 107, name: 'Identity & Access Mngmt', description: 'identity-and-access-management' },
  { id: 109, name: 'IIB Developer', description: 'iib-developer' },
  { id: 110, name: 'iOS Developer', description: 'ios-developer' },
  { id: 111, name: 'JD Edwards Dev', description: 'jd-edwards-developer' },
  { id: 112, name: 'Linux Administrator', description: 'linux-administrator' },
  { id: 113, name: 'Mainframe Developer', description: 'mainframe-developer' },
  { id: 115, name: 'Microsoft Dynamics Dev', description: 'microsoft-dynamics-developer' },
  { id: 116, name: 'MicroStrategy Dev', description: 'microstrategy-developer' },
  { id: 117, name: 'Middleware Admin', description: 'middleware-administrator' },
  { id: 118, name: 'MuleSoft Developer', description: 'mulesoft-developer' },
  { id: 119, name: 'OBIEE Developer', description: 'obiee-developer' },
  { id: 121, name: 'Office 365 Admin', description: 'office-365-administrator' },
  { id: 122, name: 'Pega Developer', description: 'pega-developer' },
  { id: 124, name: 'Perf Monitoring Engg', description: 'performance-monitoring-engineer' },
  { id: 126, name: 'Project Coordinator', description: 'project-coordinator' },
  { id: 128, name: 'Python developer', description: 'python-developer' },
  { id: 129, name: 'Remedy Developer', description: 'remedy-developer' },
  { id: 130, name: 'Ruby on Rails Dev', description: 'ruby-on-rails-developer' },
  { id: 131, name: 'BPM Consultant', description: 'bpm-consultant' },
  { id: 134, name: 'ServiceNow Dev', description: 'servicenow-developer' },
  { id: 135, name: 'Sharepoint', description: 'sharepoint-developer-administrator' },
  { id: 136, name: 'Siebel Admin', description: 'siebel-administrator' },
  { id: 137, name: 'SOA Developer', description: 'soa-developer' },
  { id: 139, name: 'Storage Consultant', description: 'storage-consultant' },
  { id: 140, name: 'Sybase DBA', description: 'sybase-dba' },
  { id: 141, name: 'Tableau Developer', description: 'tableau-developer' },
  { id: 142, name: 'Teradata', description: 'teradata-developer-dba' },
  { id: 143, name: 'TIBCO Developer', description: 'tibco-developer' },
  { id: 144, name: 'TIVOLI Administrator', description: 'tivoli-administrator' },
  { id: 145, name: 'Validation Expert', description: 'validation-expert' },
  { id: 147, name: 'Webmethods', description: 'webmethods' },
  { id: 149, name: 'Web Developer', description: 'webdeveloper' },
  { id: 154, name: 'Visual Basic Dev', description: 'visualbasicdeveloper' },
  { id: 155, name: 'VMware Admin', description: 'vmwareadministrator' },
  { id: 159, name: 'SAP QA', description: 'sapqa' },
  { id: 161, name: 'ETL Developer', description: 'etldeveloper' },
  { id: 162, name: 'Test Manager', description: 'testmanager' },
  { id: 163, name: 'Drupal Developer', description: 'drupaldeveloper' },
  { id: 164, name: 'Guidewire', description: 'guidewire' },
  { id: 165, name: 'MySQL Expert', description: 'mysqlexpert' },
  { id: 166, name: 'Power Builder Dev', description: 'powerbuilderdeveloper' },
  { id: 167, name: 'ATG', description: 'atg' },
  { id: 168, name: 'AWS', description: 'aws' },
  { id: 169, name: 'Azure Expert', description: 'azureexpert' },
  { id: 170, name: 'Agile Coach', description: 'agilecoach' },
  { id: 171, name: 'RPA Developer', description: 'rpadeveloper' },
  { id: 172, name: 'Software Developer', description: 'softwaredeveloper' },
  { id: 174, name: 'AEM Developer', description: 'aemdeveloper' },
  { id: 175, name: 'Support', description: 'support' },
  { id: 176, name: 'Blockchain Developer', description: 'blockchaindeveloper' },
  { id: 177, name: 'Cloud', description: 'cloud' },
  { id: 178, name: 'Configuration Mngmt', description: 'configurationmanagement' },
  { id: 179, name: 'Filenet', description: 'filenet' },
  { id: 180, name: 'Firmware', description: 'firmware' },
  { id: 181, name: 'Site Reliability Engg', description: 'sitereliabilityengineer' },
  { id: 182, name: 'Talend', description: 'talend' },
  { id: 183, name: 'Others', description: 'others' },
  { id: 184, name: 'Kronos Dev', description: 'kronos-developer' },
  { id: 185, name: 'Lawson', description: 'Lawson' },
  { id: 186, name: 'Workday', description: 'Workday' },
  { id: 187, name: 'Snowflake', description: 'snowflake' },
  { id: 188, name: 'Appian', description: 'appian' },
  { id: 189, name: 'Business intelligence', description: 'business-intelligence' },
  { id: 190, name: 'Engineer', description: 'engineer' },
  { id: 191, name: 'GIS', description: 'gis' },
  { id: 192, name: 'Informix', description: 'informix' },
  { id: 193, name: 'Kafka', description: 'kafka' },
  { id: 194, name: 'Lotus Notes', description: 'lotus-notes' },
  { id: 195, name: 'Machine language', description: 'machine-language' },
  { id: 196, name: 'Magento', description: 'Magento' },
  { id: 197, name: 'Maximo', description: 'maximo' },
  { id: 198, name: 'Alteryx', description: 'alteryx' },
  { id: 200, name: 'Delphi', description: 'delphi' },
  { id: 202, name: 'Graphic Designer', description: 'graphic-designer' },
  { id: 209, name: 'Manhattan WMS', description: 'manhattan-wms' },
  { id: 211, name: 'Data Engineer', description: 'data-engineer' },
  { id: 212, name: 'MongoDB', description: 'MongoDB' }
];

async function importCategories() {
  try {
    console.log('Starting category import...');
    
    // Clear existing categories first
    await pool.query('DELETE FROM categories');
    console.log('Cleared existing categories');
    
    // Insert all categories
    for (const category of categories) {
      const query = `
        INSERT INTO categories (id, name, description, "createdAt", "updatedAt") 
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          "updatedAt" = NOW()
      `;
      
      await pool.query(query, [category.id, category.name, category.description]);
      console.log(`Imported: ${category.name}`);
    }
    
    console.log(`Successfully imported ${categories.length} categories!`);
    
    // Reset the sequence to continue from the highest ID
    const maxId = Math.max(...categories.map(c => c.id));
    await pool.query(`SELECT setval('categories_id_seq', ${maxId})`);
    console.log(`Reset sequence to start from ${maxId + 1}`);
    
  } catch (error) {
    console.error('Error importing categories:', error);
  } finally {
    await pool.end();
  }
}

importCategories();