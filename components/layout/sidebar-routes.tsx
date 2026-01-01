// Akademik Analiz menü kısmını şöyle güncelleyin:

{
    label: 'Exam Intelligence Platform',
    icon: <GraduationCap size={20} />,
    href: '/admin/akademik-analiz',
    submenu: [
      {
        label: 'Analiz Dashboard',
        href: '/admin/akademik-analiz/exam-dashboard',
        icon: <Brain size={16} />
      },
      {
        label: 'Yeni Sınav',
        href: '/admin/akademik-analiz/sihirbaz',
        icon: <FileSpreadsheet size={16} />
      },
      {
        label: 'Sınav Listesi',
        href: '/admin/akademik-analiz/sonuclar',
        icon: <Target size={16} />
      },
      {
        label: 'Karne Tablosu',
        href: '/admin/akademik-analiz/karne',
        icon: <FileText size={16} />
      }
    ]
  }