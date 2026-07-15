/**
 * Backup Database Script for NexiaMind AI
 *
 * This script creates a complete backup of the Supabase database including:
 * - Table structure (DDL): columns, primary keys, foreign keys, check constraints
 * - Table data (DML)
 * - Indexes (classical + vector)
 * - Row Level Security policies and triggers
 *
 * Usage: node scripts/database/backup-db.js
 *
 * Environment Variables Required:
 *   SUPABASE_URL: Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY: Service role key with full access
 *
 * Prerequisite: run scripts/database/setup-exec-sql-functions.sql ONCE in the
 * Supabase SQL Editor. It creates two RPC functions (`exec_sql_query`,
 * `exec_sql_batch`) this script calls via the REST API to perform schema
 * introspection and SQL execution — `information_schema`/`pg_catalog` and
 * raw SQL execution are not exposed through the regular PostgREST table API.
 *
 * Output:
 *   - scripts/database/backups/backup-nexiamind-<timestamp>.sql (human-readable)
 *   - scripts/database/backups/backup-nexiamind-<timestamp>.json (machine-readable
 *     array of statements, consumed directly by restore-db.js — avoids re-parsing
 *     the .sql file, which would need to handle embedded semicolons/newlines in data)
 *
 * Note: this is a hand-rolled backup, not a full `pg_dump` equivalent —
 * sequences, custom functions, and extensions are not captured.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} catch (err) {
  console.error(`Error: Invalid Supabase configuration — ${err.message}`);
  process.exit(1);
}

// Tables to back up, in dependency order (parents before children)
const TABLES = ['profiles', 'documents', 'chunks', 'embeddings', 'conversations', 'messages', 'sync_logs'];

const PAGE_SIZE = 1000;

/**
 * Execute a read-only SQL query via the exec_sql_query RPC function and
 * return the result rows as a plain JS array.
 */
async function execQuery(sql) {
  const { data, error } = await supabase.rpc('exec_sql_query', { query: sql });
  if (error) {
    throw new Error(
      `exec_sql_query a échoué: ${error.message}\n`
      + `Avez-vous exécuté scripts/database/setup-exec-sql-functions.sql sur ce projet Supabase ?\n`
      + `Requête: ${sql}`
    );
  }
  return data || [];
}

/** Fail fast if `table` isn't one of our known tables — defense in depth
 * before interpolating it into a SQL string sent to exec_sql_query. */
function assertKnownTable(table) {
  if (!TABLES.includes(table)) {
    throw new Error(`Unknown table: ${table}`);
  }
}

function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

function ensureBackupsDirectory() {
  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`Created backups directory: ${backupsDir}`);
  }
  return backupsDir;
}

/**
 * Escape a single SQL value for use in an INSERT statement.
 */
function escapeSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return String(value);
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/**
 * Fetch column definitions for a table, including the real underlying type
 * (udt_name) for user-defined/array types like pgvector's `vector`.
 */
async function getColumns(table) {
  assertKnownTable(table);
  const rows = await execQuery(
    `select column_name, data_type, udt_name, is_nullable, column_default
     from information_schema.columns
     where table_schema = 'public' and table_name = '${table}'
     order by ordinal_position`
  );

  return rows.map((col) => {
    let type = col.data_type;
    if (type === 'USER-DEFINED' || type === 'ARRAY') {
      type = col.udt_name;
    } else if (type === 'character varying') {
      type = 'varchar';
    } else if (type === 'timestamp with time zone') {
      type = 'timestamptz';
    }
    return {
      name: col.column_name,
      type,
      notNull: col.is_nullable === 'NO',
      defaultValue: col.column_default,
    };
  });
}

async function getPrimaryKey(table) {
  assertKnownTable(table);
  const rows = await execQuery(
    `select kcu.column_name, tc.constraint_name
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
     where tc.table_schema = 'public' and tc.table_name = '${table}' and tc.constraint_type = 'PRIMARY KEY'
     order by kcu.ordinal_position`
  );

  if (rows.length === 0) return null;
  return { name: rows[0].constraint_name, columns: rows.map((r) => r.column_name) };
}

async function getForeignKeys(table) {
  assertKnownTable(table);
  const rows = await execQuery(
    `select
       tc.constraint_name,
       kcu.column_name,
       ccu.table_schema as ref_schema,
       ccu.table_name as ref_table,
       ccu.column_name as ref_column
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
     join information_schema.constraint_column_usage ccu
       on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
     where tc.table_schema = 'public' and tc.table_name = '${table}' and tc.constraint_type = 'FOREIGN KEY'
     order by tc.constraint_name, kcu.ordinal_position`
  );

  const byConstraint = new Map();
  for (const row of rows) {
    if (!byConstraint.has(row.constraint_name)) {
      byConstraint.set(row.constraint_name, {
        name: row.constraint_name,
        columns: [],
        refSchema: row.ref_schema,
        refTable: row.ref_table,
        refColumns: [],
      });
    }
    const fk = byConstraint.get(row.constraint_name);
    fk.columns.push(row.column_name);
    fk.refColumns.push(row.ref_column);
  }
  return Array.from(byConstraint.values());
}

async function getCheckConstraints(table) {
  assertKnownTable(table);
  const rows = await execQuery(
    `select tc.constraint_name, cc.check_clause
     from information_schema.table_constraints tc
     join information_schema.check_constraints cc
       on tc.constraint_name = cc.constraint_name and tc.table_schema = cc.constraint_schema
     where tc.table_schema = 'public' and tc.table_name = '${table}' and tc.constraint_type = 'CHECK'
       and tc.constraint_name not like '%_not_null'`
  );
  return rows.map((r) => ({ name: r.constraint_name, expression: r.check_clause }));
}

async function getPolicies(table) {
  assertKnownTable(table);
  return execQuery(
    `select policyname, permissive, roles, cmd, qual, with_check
     from pg_policies
     where schemaname = 'public' and tablename = '${table}'`
  );
}

async function getTriggers(table) {
  assertKnownTable(table);
  const rows = await execQuery(
    `select pg_get_triggerdef(t.oid) as definition
     from pg_trigger t
     where t.tgrelid = ('public.' || quote_ident('${table}'))::regclass and not t.tgisinternal`
  );
  return rows.map((r) => r.definition);
}

async function isRlsEnabled(table) {
  assertKnownTable(table);
  const rows = await execQuery(
    `select relrowsecurity from pg_class where oid = ('public.' || quote_ident('${table}'))::regclass`
  );
  return rows[0]?.relrowsecurity === true;
}

function generateCreateTableStatements(table, columns, primaryKey, foreignKeys, checkConstraints) {
  const statements = [];

  const columnDefs = columns
    .map((col) => {
      let def = `  ${quoteIdent(col.name)} ${col.type}`;
      if (col.notNull) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    })
    .join(',\n');

  statements.push(`CREATE TABLE IF NOT EXISTS public.${quoteIdent(table)} (\n${columnDefs}\n)`);

  if (primaryKey) {
    statements.push(
      `ALTER TABLE public.${quoteIdent(table)} ADD CONSTRAINT ${quoteIdent(primaryKey.name)} `
      + `PRIMARY KEY (${primaryKey.columns.map(quoteIdent).join(', ')})`
    );
  }

  for (const fk of foreignKeys) {
    statements.push(
      `ALTER TABLE public.${quoteIdent(table)} ADD CONSTRAINT ${quoteIdent(fk.name)} `
      + `FOREIGN KEY (${fk.columns.map(quoteIdent).join(', ')}) `
      + `REFERENCES ${fk.refSchema}.${quoteIdent(fk.refTable)} (${fk.refColumns.map(quoteIdent).join(', ')})`
    );
  }

  for (const check of checkConstraints) {
    statements.push(
      `ALTER TABLE public.${quoteIdent(table)} ADD CONSTRAINT ${quoteIdent(check.name)} CHECK (${check.expression})`
    );
  }

  return statements;
}

function generatePolicyStatements(table, rlsEnabled, policies) {
  const statements = [];
  if (rlsEnabled) {
    statements.push(`ALTER TABLE public.${quoteIdent(table)} ENABLE ROW LEVEL SECURITY`);
  }
  for (const p of policies) {
    const roles = Array.isArray(p.roles) && p.roles.length > 0 ? p.roles.join(', ') : 'public';
    let stmt = `CREATE POLICY ${quoteIdent(p.policyname)} ON public.${quoteIdent(table)} `
      + `AS ${p.permissive === 'PERMISSIVE' ? 'PERMISSIVE' : 'RESTRICTIVE'} FOR ${p.cmd} TO ${roles}`;
    if (p.qual) stmt += ` USING (${p.qual})`;
    if (p.with_check) stmt += ` WITH CHECK (${p.with_check})`;
    statements.push(stmt);
  }
  return statements;
}

/**
 * Fetch all rows of a table as INSERT statements, paginated to bound memory
 * use and to avoid truncating large tables.
 */
async function getTableDataStatements(table) {
  assertKnownTable(table);
  const columns = (await getColumns(table)).map((c) => c.name);
  if (columns.length === 0) return [];

  const columnList = columns.map(quoteIdent).join(', ');
  const orderColumn = quoteIdent(columns[0]);
  const statements = [];
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await execQuery(
      `select * from public.${quoteIdent(table)} order by ${orderColumn} limit ${PAGE_SIZE} offset ${offset}`
    );
    if (rows.length === 0) break;

    for (const row of rows) {
      const values = columns.map((c) => escapeSqlValue(row[c])).join(', ');
      statements.push(`INSERT INTO public.${quoteIdent(table)} (${columnList}) VALUES (${values})`);
    }

    offset += PAGE_SIZE;
    if (rows.length < PAGE_SIZE) break;
  }

  return statements;
}

/**
 * Fetch classical/vector index definitions (our `idx_*` naming convention).
 */
async function getIndexStatements() {
  const rows = await execQuery(
    `select indexname, tablename, indexdef
     from pg_indexes
     where schemaname = 'public' and indexname like 'idx_%'
       and tablename = any(array[${TABLES.map((t) => `'${t}'`).join(', ')}])
     order by tablename, indexname`
  );
  return rows.map((r) => r.indexdef);
}

async function backupDatabase() {
  console.log('Starting database backup...\n');

  const timestamp = generateTimestamp();
  const backupsDir = ensureBackupsDirectory();
  const sqlFile = path.join(backupsDir, `backup-nexiamind-${timestamp}.sql`);
  const jsonFile = path.join(backupsDir, `backup-nexiamind-${timestamp}.json`);

  console.log(`Backup file: ${sqlFile}`);

  const statements = [];

  for (const table of TABLES) {
    console.log(`\nProcessing table: ${table}`);

    const [columns, primaryKey, foreignKeys, checkConstraints, rlsEnabled, policies, triggers] = await Promise.all([
      getColumns(table),
      getPrimaryKey(table),
      getForeignKeys(table),
      getCheckConstraints(table),
      isRlsEnabled(table),
      getPolicies(table),
      getTriggers(table),
    ]);

    if (columns.length === 0) {
      console.log(`  ⚠️  Table not found or has no columns, skipping: ${table}`);
      continue;
    }

    const structureStatements = [
      ...generateCreateTableStatements(table, columns, primaryKey, foreignKeys, checkConstraints),
      ...generatePolicyStatements(table, rlsEnabled, policies),
      ...triggers,
    ];
    statements.push(...structureStatements);
    console.log(`  ✓ Structure captured (${columns.length} columns, ${foreignKeys.length} FKs, ${policies.length} policies, ${triggers.length} triggers)`);

    const dataStatements = await getTableDataStatements(table);
    statements.push(...dataStatements);
    if (dataStatements.length > 0) {
      console.log(`  ✓ ${dataStatements.length} rows exported`);
    } else {
      console.log(`  - ${table} is empty`);
    }
  }

  console.log('\nCapturing indexes...');
  const indexStatements = await getIndexStatements();
  statements.push(...indexStatements);
  console.log(`  ✓ ${indexStatements.length} indexes captured`);

  const header = [
    `-- NexiaMind AI Database Backup`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Schema: public`,
    ``,
  ].join('\n');

  fs.writeFileSync(sqlFile, header + statements.map((s) => `${s};`).join('\n') + '\n', 'utf8');
  fs.writeFileSync(jsonFile, JSON.stringify(statements, null, 2), 'utf8');

  const fileSize = fs.statSync(sqlFile).size;
  const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

  console.log(`\n✅ Backup completed successfully!`);
  console.log(`   SQL file:  ${sqlFile}`);
  console.log(`   JSON file: ${jsonFile} (used by restore-db.js)`);
  console.log(`   Size: ${sizeInMB} MB`);
  console.log(`   Tables: ${TABLES.length}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Verify the backup file: ${sqlFile}`);
  console.log(`  2. To restore: node scripts/database/restore-db.js --file=${path.basename(sqlFile)}`);

  return sqlFile;
}

backupDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Backup failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
