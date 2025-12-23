/**
 * Data Providers Index
 * Tüm data provider'ları tek yerden export eder
 */

// Students
export {
  getStudentsCached,
  invalidateStudentsCache,
  getStudentFromCache,
  getCacheStatus
} from './studentsDataProvider';

// Finance
export {
  getInstallmentsCached,
  getExpensesCached,
  getOtherIncomeCached,
  getDashboardDataCached,
  invalidateFinanceCache,
  invalidateSpecificCache
} from './financeDataProvider';
