'use client';
export default function Page({ params }: { params: { examId: string } }) { return <div className="p-6"><h1 className="text-2xl font-bold">Sınav Detay</h1><p className="text-gray-500">ID: {params.examId}</p></div>; }

