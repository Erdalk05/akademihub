import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 1️⃣ En son sınav
    const { data: exam } = await supabase
      .from('exams')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!exam) {
      return NextResponse.json(defaultResponse())
    }

    // 2️⃣ Sınav sonuçları
    const { data: results } = await supabase
      .from('student_exam_results')
      .select('net')
      .eq('exam_id', exam.id)

    if (!results || results.length === 0) {
      return NextResponse.json(defaultResponse())
    }

    const nets = results.map(r => Number(r.net) || 0)
    const totalStudents = nets.length
    const sum = nets.reduce((a, b) => a + b, 0)
    const averageNet = sum / totalStudents
    const maxNet = Math.max(...nets)

    const variance =
      nets.reduce((acc, n) => acc + Math.pow(n - averageNet, 2), 0) /
      totalStudents

    const stdDev = Math.sqrt(variance)

    return NextResponse.json({
      totalStudents,
      averageNet: Number(averageNet.toFixed(2)),
      maxNet,
      stdDev: Number(stdDev.toFixed(2)),
      histogram: [],
      leaderboard: []
    })
  } catch (error) {
    return NextResponse.json(defaultResponse())
  }
}

function defaultResponse() {
  return {
    totalStudents: 0,
    averageNet: 0,
    maxNet: 0,
    stdDev: 0,
    histogram: [],
    leaderboard: []
  }
}
