// ========================================
// CHECK LIVE TRIGGERS IN DATABASE
// ========================================
// This script connects to your database and shows all current triggers

const sql = require('mssql');
require('dotenv').config({ path: './backend/.env' });

const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'MediQueue',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkLiveTriggers() {
    try {
        console.log('========================================');
        console.log('CONNECTING TO DATABASE...');
        console.log('========================================');
        console.log(`Server: ${config.server}`);
        console.log(`Database: ${config.database}`);
        console.log(`User: ${config.user}`);
        console.log('');

        // Connect to database
        await sql.connect(config);
        console.log('✓ Connected successfully!\n');

        // Query 1: Get all triggers with basic info
        console.log('========================================');
        console.log('CURRENT LIVE TRIGGERS');
        console.log('========================================\n');

        const triggersQuery = `
            SELECT 
                SCHEMA_NAME(t.schema_id) AS SchemaName,
                OBJECT_NAME(t.parent_id) AS TableName,
                t.name AS TriggerName,
                t.type_desc AS TriggerType,
                t.is_disabled AS IsDisabled,
                t.create_date AS CreatedDate,
                t.modify_date AS ModifiedDate
            FROM sys.triggers t
            WHERE t.parent_class = 1
            ORDER BY TableName, TriggerName;
        `;

        const result = await sql.query(triggersQuery);
        
        if (result.recordset.length === 0) {
            console.log('⚠️  NO TRIGGERS FOUND IN DATABASE!\n');
        } else {
            console.log(`Found ${result.recordset.length} trigger(s):\n`);
            
            result.recordset.forEach((trigger, index) => {
                console.log(`${index + 1}. ${trigger.TriggerName}`);
                console.log(`   Table: ${trigger.TableName}`);
                console.log(`   Status: ${trigger.IsDisabled ? '❌ DISABLED' : '✅ ENABLED'}`);
                console.log(`   Created: ${trigger.CreatedDate.toISOString().split('T')[0]}`);
                console.log(`   Modified: ${trigger.ModifiedDate.toISOString().split('T')[0]}`);
                console.log('');
            });
        }

        // Query 2: Count by table
        console.log('========================================');
        console.log('TRIGGERS BY TABLE');
        console.log('========================================\n');

        const countQuery = `
            SELECT 
                OBJECT_NAME(parent_id) AS TableName,
                COUNT(*) AS TriggerCount,
                SUM(CASE WHEN is_disabled = 1 THEN 1 ELSE 0 END) AS DisabledCount,
                SUM(CASE WHEN is_disabled = 0 THEN 1 ELSE 0 END) AS EnabledCount
            FROM sys.triggers
            WHERE parent_class = 1
            GROUP BY parent_id
            ORDER BY TriggerCount DESC;
        `;

        const countResult = await sql.query(countQuery);
        
        if (countResult.recordset.length > 0) {
            countResult.recordset.forEach(row => {
                console.log(`${row.TableName}:`);
                console.log(`  Total: ${row.TriggerCount} | Enabled: ${row.EnabledCount} | Disabled: ${row.DisabledCount}`);
            });
            console.log('');
        }

        // Query 3: Get trigger definitions
        console.log('========================================');
        console.log('TRIGGER DEFINITIONS (CODE)');
        console.log('========================================\n');

        for (const trigger of result.recordset) {
            const defQuery = `
                SELECT OBJECT_DEFINITION(OBJECT_ID('${trigger.TriggerName}')) AS Definition;
            `;
            
            const defResult = await sql.query(defQuery);
            
            if (defResult.recordset[0].Definition) {
                console.log('----------------------------------------');
                console.log(`Trigger: ${trigger.TriggerName}`);
                console.log(`Table: ${trigger.TableName}`);
                console.log(`Status: ${trigger.IsDisabled ? 'DISABLED' : 'ENABLED'}`);
                console.log('----------------------------------------');
                console.log(defResult.recordset[0].Definition);
                console.log('\n');
            }
        }

        // Summary
        console.log('========================================');
        console.log('SUMMARY');
        console.log('========================================');
        
        const enabled = result.recordset.filter(t => !t.IsDisabled).length;
        const disabled = result.recordset.filter(t => t.IsDisabled).length;
        
        console.log(`Total Triggers: ${result.recordset.length}`);
        console.log(`✅ Enabled: ${enabled}`);
        console.log(`❌ Disabled: ${disabled}`);
        console.log('');

        // List trigger names for easy reference
        if (result.recordset.length > 0) {
            console.log('Trigger Names (for reference):');
            result.recordset.forEach(t => {
                console.log(`  - ${t.TriggerName} (${t.TableName}) ${t.IsDisabled ? '[DISABLED]' : ''}`);
            });
        }

        console.log('\n✓ Check complete!');

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error('Full error:', err);
    } finally {
        await sql.close();
    }
}

// Run the check
checkLiveTriggers();
