// AkademiHub Free Report Builder 7.0
// ------------------------------------------------------------
// SQL Builder + Core Engine iskeleti
// - İstekten parametrik SQL üretir
// - Şimdilik yalnızca SELECT + JOIN + WHERE + GROUP BY + ORDER BY desteklenir
// - Gerçek çalıştırma API route içinde yapılacak

import {
  REPORT_RELATIONS,
  fieldExists,
  findTable,
  getField,
} from './freeReportSchema';

export type AggregateFunc =
  | 'SUM'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'COUNT'
  | 'COUNT_DISTINCT';

export interface SelectField {
  table: string;
  field: string;
  alias?: string;
  aggregate?: AggregateFunc;
}

export type RelativeDatePreset =
  | 'today'
  | 'last_7_days'
  | 'this_month'
  | 'this_year'
  | 'last_year';

export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'contains'
  | 'between'
  | 'in'
  | 'relative_date';

export interface Filter {
  table: string;
  field: string;
  op: FilterOperator;
  value: any;
  valueTo?: any; // between üst sınırı
  preset?: RelativeDatePreset; // relative_date için
}

export interface GroupByField {
  table: string;
  field: string;
  dateTrunc?: 'day' | 'week' | 'month' | 'year';
}

export interface OrderBy {
  table: string;
  field: string;
  direction?: 'asc' | 'desc';
}

export interface FreeReportRequest {
  primaryTable: string;
  joins?: string[]; // ek tablolar (ör: ['finance_payments', 'finance_installments'])
  select: SelectField[];
  filters?: Filter[];
  groupBy?: GroupByField[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface BuiltQuery {
  sql: string;
  params: any[];
}

// Basit doğrulamalar
function validateRequest(req: FreeReportRequest) {
  const errors: string[] = [];

  if (!findTable(req.primaryTable)) {
    errors.push(`Bilinmeyen primaryTable: ${req.primaryTable}`);
  }

  req.joins?.forEach((table) => {
    if (!findTable(table)) {
      errors.push(`Bilinmeyen join tablosu: ${table}`);
    }
  });

  req.select.forEach((s) => {
    if (!fieldExists(s.table, s.field)) {
      errors.push(`Alan bulunamadı: ${s.table}.${s.field}`);
    }
  });

  req.filters?.forEach((f) => {
    if (!fieldExists(f.table, f.field)) {
      errors.push(`Filtre alanı bulunamadı: ${f.table}.${f.field}`);
    }
  });

  if (errors.length > 0) {
    const error = new Error(errors.join(' | '));
    // @ts-expect-error custom flag
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

// Tablo → alias eşleşmesi (t0, t1, t2...)
function buildTableAliases(primary: string, joins: string[] = []) {
  const aliases: Record<string, string> = {};
  let index = 0;
  aliases[primary] = `t${index}`;
  joins.forEach((table) => {
    index += 1;
    aliases[table] = `t${index}`;
  });
  return aliases;
}

// İki tablo arasındaki join tanımını bul
function findRelation(a: string, b: string) {
  return REPORT_RELATIONS.find(
    (rel) =>
      (rel.fromTable === a && rel.toTable === b) ||
      (rel.fromTable === b && rel.toTable === a),
  );
}

export function buildReportQuery(req: FreeReportRequest): BuiltQuery {
  validateRequest(req);

  const joins = req.joins || [];
  const aliases = buildTableAliases(req.primaryTable, joins);
  const params: any[] = [];

  // SELECT
  const selectSql = req.select
    .map((s) => {
      const tableAlias = aliases[s.table];
      if (!tableAlias) {
        throw new Error(`Tablo alias bulunamadı: ${s.table}`);
      }
      const col = `"${tableAlias}"."${s.field}"`;
      const expr = s.aggregate ? `${s.aggregate}(${col})` : col;
      const alias = s.alias || `${s.table}_${s.field}`;
      return `${expr} AS "${alias}"`;
    })
    .join(', ');

  // FROM + JOIN
  let fromSql = `FROM "${req.primaryTable}" ${aliases[req.primaryTable]}`;

  joins.forEach((joinTable) => {
    const rel = findRelation(req.primaryTable, joinTable);
    if (!rel) {
      // Şimdilik yalnızca primary ↔ join ilişkisine izin veriyoruz
      throw new Error(
        `JOIN ilişkisi bulunamadı: ${req.primaryTable} ↔ ${joinTable}`,
      );
    }

    const aAlias = aliases[rel.fromTable];
    const bAlias = aliases[rel.toTable];
    if (!aAlias || !bAlias) {
      throw new Error('JOIN alias hatası');
    }

    fromSql += ` LEFT JOIN "${rel.toTable}" ${bAlias} ON "${aAlias}"."${rel.fromField}" = "${bAlias}"."${rel.toField}"`;
  });

  // WHERE
  const whereClauses: string[] = [];

  req.filters?.forEach((f) => {
    const tableAlias = aliases[f.table];
    if (!tableAlias) {
      throw new Error(`Filtre için tablo alias bulunamadı: ${f.table}`);
    }
    const col = `"${tableAlias}"."${f.field}"`;

    switch (f.op) {
      case '=':
      case '!=':
      case '>':
      case '<':
      case '>=':
      case '<=':
        params.push(f.value);
        whereClauses.push(`${col} ${f.op} $${params.length}`);
        break;
      case 'contains':
        params.push(`%${String(f.value)}%`);
        whereClauses.push(`${col} ILIKE $${params.length}`);
        break;
      case 'between':
        params.push(f.value);
        params.push(f.valueTo);
        whereClauses.push(`${col} BETWEEN $${params.length - 1} AND $${params.length}`);
        break;
      case 'in':
        if (!Array.isArray(f.value) || f.value.length === 0) break;
        const placeholders = f.value.map((v) => {
          params.push(v);
          return `$${params.length}`;
        });
        whereClauses.push(`${col} IN (${placeholders.join(', ')})`);
        break;
      case 'relative_date': {
        const fieldMeta = getField(f.table, f.field);
        if (!fieldMeta || fieldMeta.type !== 'date') {
          throw new Error(
            `relative_date filtresi sadece tarih alanlarında kullanılabilir: ${f.table}.${f.field}`,
          );
        }
        const preset: RelativeDatePreset | undefined = f.preset;
        if (!preset) break;
        // Postgres CURRENT_DATE tabanlı basit tarih kısayolları
        if (preset === 'today') {
          whereClauses.push(`${col}::date = CURRENT_DATE`);
        } else if (preset === 'last_7_days') {
          whereClauses.push(
            `${col}::date >= CURRENT_DATE - INTERVAL '7 days'`,
          );
        } else if (preset === 'this_month') {
          whereClauses.push(
            `${col} >= date_trunc('month', CURRENT_DATE) AND ${col} < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')`,
          );
        } else if (preset === 'this_year') {
          whereClauses.push(
            `${col} >= date_trunc('year', CURRENT_DATE) AND ${col} < (date_trunc('year', CURRENT_DATE) + INTERVAL '1 year')`,
          );
        } else if (preset === 'last_year') {
          whereClauses.push(
            `${col} >= (date_trunc('year', CURRENT_DATE) - INTERVAL '1 year') AND ${col} < date_trunc('year', CURRENT_DATE)`,
          );
        }
        break;
      }
      default:
        break;
    }
  });

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // GROUP BY
  let groupBySql = '';
  if (req.groupBy && req.groupBy.length > 0) {
    const groupCols = req.groupBy.map((g) => {
      const tableAlias = aliases[g.table];
      if (!tableAlias) {
        throw new Error(`GROUP BY için tablo alias bulunamadı: ${g.table}`);
      }
      const col = `"${tableAlias}"."${g.field}"`;
      if (g.dateTrunc) {
        return `DATE_TRUNC('${g.dateTrunc}', ${col})`;
      }
      return col;
    });
    groupBySql = `GROUP BY ${groupCols.join(', ')}`;
  }

  // ORDER BY
  let orderBySql = '';
  if (req.orderBy && req.orderBy.length > 0) {
    const orders = req.orderBy.map((o) => {
      const tableAlias = aliases[o.table];
      if (!tableAlias) {
        throw new Error(`ORDER BY için tablo alias bulunamadı: ${o.table}`);
      }
      const dir = o.direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      return `"${tableAlias}"."${o.field}" ${dir}`;
    });
    orderBySql = `ORDER BY ${orders.join(', ')}`;
  }

  // LIMIT / OFFSET
  let limitOffsetSql = '';
  if (typeof req.limit === 'number') {
    params.push(req.limit);
    limitOffsetSql += ` LIMIT $${params.length}`;
  }
  if (typeof req.offset === 'number') {
    params.push(req.offset);
    limitOffsetSql += ` OFFSET $${params.length}`;
  }

  const sql = `SELECT ${selectSql} ${fromSql} ${whereSql} ${groupBySql} ${orderBySql} ${limitOffsetSql}`.trim();

  return { sql, params };
}


