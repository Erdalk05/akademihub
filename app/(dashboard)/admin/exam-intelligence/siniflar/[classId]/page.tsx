'use client';
export default function Page({ params }: { params: { classId: string } }) { return <div className="p-6"><h1 className="text-2xl font-bold">Sınıf Detay</h1><p className="text-gray-500">Sınıf: {params.classId}</p></div>; }

