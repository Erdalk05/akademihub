import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Auth kontrolü
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = params.id;

    // Transaction benzeri silme işlemi - ilişkili verileri sil
    // 1. Önce student_exam_results
    const { error: resultsError } = await supabase
      .from('student_exam_results')
      .delete()
      .eq('exam_id', examId);

    if (resultsError) {
      console.error('Error deleting exam results:', resultsError);
      return NextResponse.json({ error: 'Sınav sonuçları silinemedi' }, { status: 500 });
    }

    // 2. booklet_answer_keys
    const { error: keysError } = await supabase
      .from('booklet_answer_keys')
      .delete()
      .eq('exam_id', examId);

    if (keysError) {
      console.error('Error deleting answer keys:', keysError);
      return NextResponse.json({ error: 'Cevap anahtarları silinemedi' }, { status: 500 });
    }

    // 3. exam_tests
    const { error: testsError } = await supabase
      .from('exam_tests')
      .delete()
      .eq('exam_id', examId);

    if (testsError) {
      console.error('Error deleting exam tests:', testsError);
      return NextResponse.json({ error: 'Sınav testleri silinemedi' }, { status: 500 });
    }

    // 4. Son olarak exams tablosu
    const { error: examError } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (examError) {
      console.error('Error deleting exam:', examError);
      return NextResponse.json({ error: 'Sınav silinemedi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Sınav başarıyla silindi' });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}