const mysql = require('mysql2/promise');

let pool;
function getPool() {
  if (!pool) {
    const resolveTemplate = (val) => {
      if (typeof val !== 'string') return val;
      const m = val.match(/^\$\{([^}]+)\}$/);
      if (m && m[1]) {
        return process.env[m[1]] || val;
      }
      return val;
    };

    let host = resolveTemplate(process.env.DB_HOST) || process.env.MYSQL_HOST || 'localhost';
    let portRaw = resolveTemplate(process.env.DB_PORT) || process.env.MYSQL_PORT || '3306';
    let user = resolveTemplate(process.env.DB_USER) || process.env.MYSQL_USER || 'root';
    let password = resolveTemplate(process.env.DB_PASSWORD) || process.env.MYSQL_PASSWORD || '';
    // If using root implicitly, prefer MYSQL_ROOT_PASSWORD when present
    if (user === 'root' && process.env.MYSQL_ROOT_PASSWORD) {
      password = process.env.MYSQL_ROOT_PASSWORD;
    }
    let database = resolveTemplate(process.env.DB_NAME) || process.env.MYSQL_DATABASE || 'rentwiseDB';

    let port = Number.parseInt(portRaw, 10) || 3306;
    if (host === 'rentwiseDB') {
      port = 3306; // always use container port when talking to Docker MySQL service
    }

    // Minimal one-time log to aid setup; no secrets printed
    console.log(`[DB] Connecting host=${host} port=${port} user=${user} db=${database}`);

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

const TABLE = 'gov_house_transactions';

async function ensureTable() {
  const p = getPool();
  await p.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id VARCHAR(64) PRIMARY KEY,
      rentApprovalDate VARCHAR(16),
      town VARCHAR(64),
      block VARCHAR(32),
      streetName VARCHAR(128),
      flatType VARCHAR(32),
      monthlyRent INT,
      source VARCHAR(64),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  // Backfill columns when table exists from an older schema (without relying on IF NOT EXISTS)
  async function addColumnIfMissing(columnName, ddl) {
    const [rows] = await p.execute(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [TABLE, columnName]
    );
    const exists = rows && rows[0] && Number(rows[0].c) > 0;
    if (!exists) {
      await p.execute(`ALTER TABLE ${TABLE} ADD COLUMN ${ddl}`);
    }
  }
  await addColumnIfMissing('rentApprovalDate', 'rentApprovalDate VARCHAR(16)');
  await addColumnIfMissing('block', 'block VARCHAR(32)');
  await addColumnIfMissing('streetName', 'streetName VARCHAR(128)');
  await addColumnIfMissing('flatType', 'flatType VARCHAR(32)');
  await addColumnIfMissing('monthlyRent', 'monthlyRent INT');
  await addColumnIfMissing('source', 'source VARCHAR(64)');
}

function mapRecordToRow(r) {
  const id = String(r._id ?? `${r.block || ''}-${r.street_name || ''}-${r.rent_approval_date || ''}-${r.flat_type || ''}`);
  return [
    id,
    r.rent_approval_date || null,
    r.town || null,
    r.block || null,
    r.street_name || null,
    r.flat_type || null,
    r.monthly_rent != null ? Math.round(Number(r.monthly_rent)) : null,
    null, // source (filled later if null)
  ];
}

async function upsertRecords(records, sourceLabel = 'datastore') {
  if (!records || !records.length) return { inserted: 0, updated: 0 };
  const p = getPool();
  await ensureTable();

  // Always use per-row UPSERT to avoid packet/placeholder limits entirely
  let totalAffected = 0;
  const singleSql = `
    INSERT INTO ${TABLE} (
      id, rentApprovalDate, town, block, streetName, flatType, monthlyRent, source
    ) VALUES (?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      rentApprovalDate=VALUES(rentApprovalDate), town=VALUES(town), block=VALUES(block),
      streetName=VALUES(streetName), flatType=VALUES(flatType), monthlyRent=VALUES(monthlyRent),
      source=VALUES(source)
  `;

  let processed = 0;
  for (const r of records) {
    const row = mapRecordToRow(r);
    const params = row.map((v, idx) => ((idx === 7 && v == null) ? sourceLabel : v));
    await p.execute(singleSql, params);
    processed += 1;
    totalAffected += 1;
    if (processed % 200 === 0) {
      console.log(`[upsert] processed ${processed} rows this batch`);
    }
  }

  return { affectedRows: totalAffected };
}

module.exports = {
  ensureTable,
  upsertRecords,
  getCount: async function () {
    const p = getPool();
    await ensureTable();
    const [rows] = await p.execute(`SELECT COUNT(*) AS c FROM ${TABLE}`);
    return rows && rows[0] ? Number(rows[0].c) : 0;
  },
  getSample: async function (limit = 5) {
    const p = getPool();
    await ensureTable();
    const [rows] = await p.execute(`SELECT * FROM ${TABLE} ORDER BY updatedAt DESC LIMIT ?`, [Math.max(1, Math.min(100, Number(limit) || 5))]);
    return rows || [];
  },
  searchByTown: async function (filters = {}) {
    const p = getPool();
    await ensureTable();
    const where = [];
    const params = [];
    if (filters.town) { where.push('town = ?'); params.push(String(filters.town).toUpperCase()); }
    if (filters.flatType) { where.push('flatType = ?'); params.push(String(filters.flatType).toUpperCase()); }
    if (filters.minPrice != null) { where.push('monthlyRent >= ?'); params.push(Number(filters.minPrice)); }
    if (filters.maxPrice != null) { where.push('monthlyRent <= ?'); params.push(Number(filters.maxPrice)); }
    const limit = Math.max(1, Math.min(200, Number.isFinite(Number(filters.limit)) ? Number(filters.limit) : 20));
    const offset = Math.max(0, Number.isFinite(Number(filters.offset)) ? Number(filters.offset) : 0);
    const sql = `SELECT * FROM ${TABLE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY monthlyRent ASC LIMIT ${limit} OFFSET ${offset}`;
    console.log(sql)
    const [rows] = await p.execute(sql, params);
    return rows || [];
  },
  listTownsByScore: async function (filters = {}) {
    const p = getPool();
    await ensureTable();
    const where = [];
    const params = [];
    if (filters.flatType) { where.push('flatType = ?'); params.push(String(filters.flatType).toUpperCase()); }
    if (filters.minPrice != null) { where.push('monthlyRent >= ?'); params.push(Number(filters.minPrice)); }
    if (filters.maxPrice != null) { where.push('monthlyRent <= ?'); params.push(Number(filters.maxPrice)); }
    const limit = Math.max(1, Math.min(50, Number(filters.limit) || 10));
    const sql = `
      SELECT town,
             COUNT(*)                       AS listings,
             ROUND(AVG(monthlyRent))        AS avgMonthlyRent
      FROM ${TABLE}
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY town
      HAVING town IS NOT NULL AND town <> ''
      ORDER BY listings DESC
      LIMIT ?
    `;
    const [rows] = await p.execute(sql, [...params, limit]);
    return rows || [];
  },
};


