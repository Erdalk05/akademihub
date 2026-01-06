'use client';

/**
 * AkademiHub Sonuç Gezgini
 * Sınav sonuçlarını tablo halinde görüntüleme
 * 
 * Çakışmalar sarı ile işaretlenir
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  ArrowUpDown,
  Users,
  Award,
  TrendingUp,
} from 'lucide-react';
import { colors } from './theme';
import { StudentResult, Conflict, SubjectResult } from '../core/types';

// ============================================
// 📋 TİPLER
// ============================================

interface ResultsExplorerProps {
  results: StudentResult[];
  conflicts?: Conflict[];
  examName?: string;
  onRecalculate?: () => void;
  onExport?: () => void;
  onResolveConflict?: (conflict: Conflict) => void;
}

type SortField = 'rank' | 'name' | 'totalNet' | 'totalScore';
type SortOrder = 'asc' | 'desc';

// ============================================
// 🎨 STİLLER
// ============================================

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: colors.text.primary,
  },
  
  actions: {
    display: 'flex',
    gap: '0.75rem',
  },
  
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: 'white',
    color: colors.text.primary,
    border: `1px solid ${colors.secondary[200]}`,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  primaryButton: {
    backgroundColor: colors.primary[500],
    color: 'white',
    border: 'none',
  },
  
  searchContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  
  searchInput: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'white',
    border: `2px solid ${colors.secondary[200]}`,
    borderRadius: '0.75rem',
    transition: 'border-color 0.2s',
  },
  
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    color: colors.text.primary,
  },
  
  statsRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  
  table: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '1rem',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  
  tableHeader: {
    backgroundColor: colors.secondary[50],
  },
  
  th: {
    padding: '1rem',
    textAlign: 'left' as const,
    fontSize: '0.875rem',
    fontWeight: '600',
    color: colors.text.secondary,
    borderBottom: `2px solid ${colors.secondary[200]}`,
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'background-color 0.2s',
  },
  
  thSortable: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  td: {
    padding: '1rem',
    fontSize: '0.875rem',
    color: colors.text.primary,
    borderBottom: `1px solid ${colors.secondary[100]}`,
  },
  
  conflictRow: {
    backgroundColor: colors.conflict.background,
  },
  
  conflictBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.625rem',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  
  rankBadge: (rank: number) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.875rem',
    backgroundColor: rank <= 3 
      ? rank === 1 ? '#FEF3C7' : rank === 2 ? '#E5E7EB' : '#FED7AA'
      : colors.secondary[100],
    color: rank <= 3
      ? rank === 1 ? '#92400E' : rank === 2 ? '#374151' : '#9A3412'
      : colors.text.primary,
  }),
  
  subjectBadge: (percentage: number) => ({
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginRight: '0.25rem',
    marginBottom: '0.25rem',
    backgroundColor: percentage >= 70 ? '#DCFCE7' : percentage >= 50 ? '#FEF9C3' : '#FEE2E2',
    color: percentage >= 70 ? '#166534' : percentage >= 50 ? '#854D0E' : '#991B1B',
  }),
  
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderTop: `1px solid ${colors.secondary[100]}`,
    backgroundColor: colors.secondary[50],
  },
  
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
};

// ============================================
// 📦 ANA BİLEŞEN
// ============================================

export function ResultsExplorer({
  results,
  conflicts = [],
  examName = 'Sınav Sonuçları',
  onRecalculate,
  onExport,
  onResolveConflict,
}: ResultsExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Çakışmalı öğrenci numaraları
  const conflictStudentNos = useMemo(() => 
    new Set(conflicts.map(c => c.studentNo)),
    [conflicts]
  );

  // Filtreleme ve sıralama
  const filteredResults = useMemo(() => {
    let filtered = [...results];
    
    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.studentNo.includes(query) ||
        r.tc?.includes(query)
      );
    }
    
    // Sıralama
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'tr');
          break;
        case 'totalNet':
          comparison = a.totalNet - b.totalNet;
          break;
        case 'totalScore':
          comparison = a.totalScore - b.totalScore;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [results, searchQuery, sortField, sortOrder]);

  // Sayfalama
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / pageSize);

  // Sıralama değiştir
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  // İstatistikler
  const stats = useMemo(() => ({
    totalStudents: results.length,
    averageScore: results.length > 0 
      ? results.reduce((sum, r) => sum + r.totalScore, 0) / results.length 
      : 0,
    averageNet: results.length > 0 
      ? results.reduce((sum, r) => sum + r.totalNet, 0) / results.length 
      : 0,
    conflictCount: conflicts.length,
  }), [results, conflicts]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{examName}</h1>
        <div style={styles.actions}>
          <button 
            style={styles.button}
            onClick={onRecalculate}
          >
            <RefreshCw size={18} />
            Yeniden Hesapla
          </button>
          <button 
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={onExport}
          >
            <Download size={18} />
            Excel İndir
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <Users size={24} color={colors.primary[500]} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.25rem', color: colors.text.primary }}>
              {stats.totalStudents}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.text.secondary }}>Öğrenci</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <TrendingUp size={24} color={colors.info} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.25rem', color: colors.text.primary }}>
              {stats.averageNet.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.text.secondary }}>Ort. Net</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <Award size={24} color={colors.success} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.25rem', color: colors.text.primary }}>
              {stats.averageScore.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.text.secondary }}>Ort. Puan</div>
          </div>
        </div>
        {stats.conflictCount > 0 && (
          <div style={{ ...styles.statCard, backgroundColor: colors.conflict.background }}>
            <AlertTriangle size={24} color={colors.conflict.medium} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.25rem', color: colors.conflict.medium }}>
                {stats.conflictCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: colors.conflict.medium }}>Çakışma</div>
            </div>
          </div>
        )}
      </div>

      {/* Arama */}
      <div style={styles.searchContainer}>
        <div style={styles.searchInput}>
          <Search size={20} color={colors.text.muted} />
          <input
            type="text"
            placeholder="Öğrenci ara (isim, numara veya TC)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
        </div>
        <button style={styles.button}>
          <Filter size={18} />
          Filtrele
        </button>
      </div>

      {/* Tablo */}
      <div style={styles.table}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={styles.tableHeader}>
            <tr>
              <th 
                style={styles.th}
                onClick={() => handleSort('rank')}
              >
                <div style={styles.thSortable}>
                  Sıra
                  <SortIcon field="rank" currentField={sortField} order={sortOrder} />
                </div>
              </th>
              <th 
                style={styles.th}
                onClick={() => handleSort('name')}
              >
                <div style={styles.thSortable}>
                  Öğrenci
                  <SortIcon field="name" currentField={sortField} order={sortOrder} />
                </div>
              </th>
              <th style={{ ...styles.th, textAlign: 'center' }}>D / Y / B</th>
              <th 
                style={{ ...styles.th, textAlign: 'center' }}
                onClick={() => handleSort('totalNet')}
              >
                <div style={{ ...styles.thSortable, justifyContent: 'center' }}>
                  Net
                  <SortIcon field="totalNet" currentField={sortField} order={sortOrder} />
                </div>
              </th>
              <th 
                style={{ ...styles.th, textAlign: 'center' }}
                onClick={() => handleSort('totalScore')}
              >
                <div style={{ ...styles.thSortable, justifyContent: 'center' }}>
                  Puan
                  <SortIcon field="totalScore" currentField={sortField} order={sortOrder} />
                </div>
              </th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Ders Bazlı</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Durum</th>
              <th style={{ ...styles.th, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedResults.map((result, index) => {
              const hasConflict = conflictStudentNos.has(result.studentNo);
              const conflict = conflicts.find(c => c.studentNo === result.studentNo);
              
              return (
                <motion.tr
                  key={result.studentNo}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  style={hasConflict ? styles.conflictRow : {}}
                >
                  <td style={styles.td}>
                    <span style={styles.rankBadge(result.rank)}>
                      {result.rank}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600' }}>{result.name}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>
                      {result.studentNo}
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={{ color: colors.success, fontWeight: '600' }}>{result.totalCorrect}</span>
                    {' / '}
                    <span style={{ color: colors.error, fontWeight: '600' }}>{result.totalWrong}</span>
                    {' / '}
                    <span style={{ color: colors.text.muted }}>{result.totalEmpty}</span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: '600' }}>
                    {result.totalNet.toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: colors.primary[600] }}>
                    {result.totalScore.toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                      {result.subjects.slice(0, 4).map(subject => (
                        <span 
                          key={subject.subjectId}
                          style={styles.subjectBadge(subject.percentage)}
                          title={`${subject.subjectName}: ${subject.net.toFixed(1)} net`}
                        >
                          {subject.subjectName.substring(0, 3)}: {subject.percentage}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {hasConflict ? (
                      <button
                        style={{ 
                          ...styles.conflictBadge, 
                          border: 'none', 
                          cursor: 'pointer',
                          backgroundColor: '#FEF3C7',
                        }}
                        onClick={() => {
                          setSelectedConflict(conflict || null);
                          setShowConflictModal(true);
                        }}
                      >
                        <AlertTriangle size={14} />
                        Çakışma
                      </button>
                    ) : (
                      <CheckCircle size={20} color={colors.success} />
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '0.375rem',
                      }}
                      onClick={() => setSelectedStudent(result)}
                    >
                      <Eye size={18} color={colors.text.secondary} />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* Sayfalama */}
        <div style={styles.pagination}>
          <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>
            {filteredResults.length} sonuçtan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredResults.length)} arası gösteriliyor
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{ ...styles.button, padding: '0.5rem 0.75rem' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Önceki
            </button>
            <span style={{ padding: '0.5rem 1rem', fontWeight: '600' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              style={{ ...styles.button, padding: '0.5rem 0.75rem' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      {/* Çakışma Modal */}
      <AnimatePresence>
        {showConflictModal && selectedConflict && (
          <ConflictModal
            conflict={selectedConflict}
            onClose={() => {
              setShowConflictModal(false);
              setSelectedConflict(null);
            }}
            onResolve={() => {
              onResolveConflict?.(selectedConflict);
              setShowConflictModal(false);
              setSelectedConflict(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Öğrenci Detay Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentDetailModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// 🔄 SIRALAMA İKONU
// ============================================

function SortIcon({ 
  field, 
  currentField, 
  order 
}: { 
  field: SortField; 
  currentField: SortField; 
  order: SortOrder;
}) {
  if (field !== currentField) {
    return <ArrowUpDown size={14} color={colors.text.muted} />;
  }
  return order === 'asc' 
    ? <ChevronUp size={14} color={colors.primary[500]} />
    : <ChevronDown size={14} color={colors.primary[500]} />;
}

// ============================================
// ⚠️ ÇAKIŞMA MODAL
// ============================================

function ConflictModal({
  conflict,
  onClose,
  onResolve,
}: {
  conflict: Conflict;
  onClose: () => void;
  onResolve: () => void;
}) {
  return (
    <motion.div
      style={styles.modal}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modalContent}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: colors.conflict.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={24} color={colors.conflict.medium} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.text.primary, margin: 0 }}>
              Çakışma Tespit Edildi
            </h3>
            <p style={{ fontSize: '0.875rem', color: colors.text.secondary, margin: 0 }}>
              {conflict.type.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div style={{ 
          backgroundColor: colors.background.subtle, 
          padding: '1rem', 
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Öğrenci:</strong> {conflict.name}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Öğrenci No:</strong> {conflict.studentNo}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>TC:</strong> {conflict.tc}
          </div>
          <div style={{ 
            padding: '0.75rem',
            backgroundColor: colors.conflict.background,
            borderRadius: '0.5rem',
            marginTop: '1rem',
          }}>
            <strong>Sorun:</strong> {conflict.description}
          </div>
        </div>

        {conflict.existingData && (
          <div style={{ 
            backgroundColor: '#EEF2FF', 
            padding: '1rem', 
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#4338CA' }}>
              Mevcut Kayıt:
            </div>
            {conflict.existingData.name && <div>İsim: {conflict.existingData.name}</div>}
            {conflict.existingData.studentNo && <div>No: {conflict.existingData.studentNo}</div>}
            {conflict.existingData.tc && <div>TC: {conflict.existingData.tc}</div>}
          </div>
        )}

        {conflict.suggestedAction && (
          <div style={{ 
            padding: '0.75rem',
            backgroundColor: colors.primary[50],
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            color: colors.primary[700],
          }}>
            <strong>Öneri:</strong> {conflict.suggestedAction}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            style={{ ...styles.button, flex: 1 }}
            onClick={onClose}
          >
            Kapat
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}
            onClick={onResolve}
          >
            <CheckCircle size={18} />
            Çöz
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// 👤 ÖĞRENCİ DETAY MODAL
// ============================================

function StudentDetailModal({
  student,
  onClose,
}: {
  student: StudentResult;
  onClose: () => void;
}) {
  return (
    <motion.div
      style={styles.modal}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{ ...styles.modalContent, maxWidth: '600px' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={styles.rankBadge(student.rank)}>
            {student.rank}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.text.primary, margin: 0 }}>
              {student.name}
            </h3>
            <p style={{ fontSize: '0.875rem', color: colors.text.secondary, margin: 0 }}>
              {student.studentNo} • Yüzdelik: %{student.percentile}
            </p>
          </div>
        </div>

        {/* Özet */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: colors.background.subtle, borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.success }}>{student.totalCorrect}</div>
            <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>Doğru</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: colors.background.subtle, borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.error }}>{student.totalWrong}</div>
            <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>Yanlış</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: colors.background.subtle, borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.info }}>{student.totalNet.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>Net</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: colors.primary[50], borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.primary[600] }}>{student.totalScore.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: colors.primary[600] }}>Puan</div>
          </div>
        </div>

        {/* Ders Bazlı */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Ders Bazlı Sonuçlar</h4>
          {student.subjects.map(subject => (
            <div 
              key={subject.subjectId}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: colors.background.subtle,
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontWeight: '500' }}>{subject.subjectName}</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: colors.success }}>{subject.correct}D</span>
                <span style={{ color: colors.error }}>{subject.wrong}Y</span>
                <span style={{ fontWeight: '600' }}>{subject.net.toFixed(2)} Net</span>
                <span style={styles.subjectBadge(subject.percentage)}>
                  %{subject.percentage}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          style={{ ...styles.button, width: '100%', justifyContent: 'center' }}
          onClick={onClose}
        >
          Kapat
        </button>
      </motion.div>
    </motion.div>
  );
}

export default ResultsExplorer;

