"use client";

import React, { useState } from 'react';
import Step1SinavBilgisi from '@/components/spectra-wizard/Step1SinavBilgisi';

export default function SpectraWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    examName: '',
    examType: '',
    publisher: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Hata almamak için fonksiyonu tip bağımsız hale getirdik
  const updateData = (newData: any) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl border p-8">
        {currentStep === 1 && (
          <Step1SinavBilgisi 
            data={formData} 
            updateData={updateData}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold">Adım 2: Cevap Anahtarı</h2>
            <button onClick={() => setCurrentStep(1)} className="mt-4 text-emerald-600 underline">Geri Dön</button>
          </div>
        )}
      </div>
    </div>
  );
}