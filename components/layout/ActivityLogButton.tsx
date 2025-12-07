'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import ActivityLogDrawer from '@/components/activity/ActivityLogDrawer';

export default function ActivityLogButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        title="Aktivite Logları"
      >
        <FileText className="w-6 h-6" />
      </button>

      <ActivityLogDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}





