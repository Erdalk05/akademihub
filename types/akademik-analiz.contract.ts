// Ortak type tanımlamaları

export interface Exam {
  id: string;
  name: string;
  exam_date: string;
  exam_type: 'LGS' | 'TYT' | 'AYT';
  created_at: string;
  organization_id: string;
  total_students: number;
  average_net: number;
  status: 'completed' | 'processing' | 'draft';
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  student_no: string;
  grade_level: string;
  class_id: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  booklet_type: string;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  total_net: number;
  rank_in_school?: number;
  rank_in_class?: number;
  subjects?: SubjectResult[];
}

export interface SubjectResult {
  subject_name: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  percentage: number;
}

export interface DashboardStats {
  totalExams: number;
  totalStudents: number;
  averageNet: number;
  thisMonthExams: number;
  topStudents: Array<{
    student: Student;
    averageNet: number;
    examCount: number;
  }>;
  riskStudents: Array<{
    student: Student;
    lastNet: number;
    trend: number;
  }>;
}
```

## 🔗 SİSTEM BAĞLANTISI

Bu 5 dosya ile sistem şöyle çalışacak:

1. **Kullanıcı Flow:**
   - Sidebar'dan "Sınav Listesi" tıklanır
   - Tüm sınavlar listelenir (filtreleme, arama özelliği)
   - "Analiz" butonu → Exam Dashboard'a gider
   - "Karne" butonu → Karne sayfasına gider
   - "Sil" butonu → API call yaparak sınavı siler

2. **Veri Akışı:**
```
   Sihirbaz (Mevcut) → Supabase'e kayıt
   ↓
   Sonuçlar Sayfası → GET /api/akademik-analiz/wizard
   ↓
   Seçim yapıldığında → examId parametresi ile yönlendirme
   ↓
   Dashboard/Karne → examId ile veri çeker