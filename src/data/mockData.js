export const RiskLevel = {
  HIGH: 'ALTO',
  MEDIUM: 'MEDIO',
  LOW: 'BAJO'
};

export const DebtorArchetype = {
  STRATEGIC: 'ESTRATÉGICO',
  FORGETFUL: 'DESCUIDADO',
  FINANCIAL_DISTRESS: 'PROBLEMAS FINANCIEROS',
  DISPUTE: 'DISPUTA COMERCIAL'
};

export const MOCK_DEBTORS = [
  {
    id: '849201',
    name: 'Juan Perez',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxnPPqxnYaT9dEJ2utVIA9b8EdMyEHSkfQBEtiGjoA-IYG2nVwyQjLvgHTJW4C4bOImMMju13OslsiFiNicNcIAfzhUS3vexpSX4Sag0hM1evG1BjS_UDF03wdPWxgl8qorhAeTmyCxV1In_e04cUzHHT62IjGwbPl5Y7APTWfwyutWm0XRI4d9qW59a0KXsFJ1ENBFyWXIjA2kU8V-NSiS5BBITqij-buJ0SuPj4JSf81k3Yt2ElK1KsgOPF7ToBjANAMTLWE1IQA',
    totalDebt: 45200,
    overdueDays: 68,
    riskScore: 85,
    riskLevel: RiskLevel.HIGH,
    archetype: DebtorArchetype.STRATEGIC,
    lastAction: 'Email Enviado (hace 2d)',
    location: 'México D.F.',
    phone: '+52 55 1234 5678',
    email: 'juan.perez@email.com',
    employer: 'Retail Corp',
    paymentProbability: 32,
    paymentTrend: [10, 25, 45, 30, 20, 15],
    lastPromise: 'Incumplida (Jun 12)',
    aiAction: {
      title: 'Acción Recomendada',
      description: 'Enviar recordatorio por WhatsApp entre 4PM - 6PM. Alta probabilidad de respuesta (85%).',
      icon: 'message'
    }
  },
  {
    id: '772109',
    name: 'Maria Rodriguez',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhNfdIB3WBMMP7ppx1fJZugD0BZ_pE4QoEHWCNKm4aHc3N_vShw5jdMrrdDetTzyCz72AT1jIt8DjG82z12wjjWqd2XZT2Y0aBMN4yk8On-tpWA0JmSzEECYSQEQSWtBfUkQsNFs5YTwySwrwx6ZDz90o12UIiWt9RvnlSbw0lzDjX0Z-zR8lGpwpB67VJRVc_vGt3cblVy_MyJAU4TazIk1w_7l5vRD9DSE2o3D9qzhPbkay2wek_pTOxBvpgC5R2FhcyQtYWnJE',
    totalDebt: 12850,
    overdueDays: 32,
    riskScore: 60,
    riskLevel: RiskLevel.MEDIUM,
    archetype: DebtorArchetype.FORGETFUL,
    lastAction: 'Llamada Sin Respuesta (hace 1d)',
    location: 'Lima, PE',
    phone: '+51 99 9876 543',
    email: 'maria.r@email.com',
    employer: 'Servicios Logísticos SA',
    paymentProbability: 65,
    paymentTrend: [50, 60, 55, 70, 65, 80],
    lastPromise: 'Pendiente (Hoy)',
    aiAction: {
      title: 'Oportunidad',
      description: 'Ofrecer descuento del 5% si paga hoy. Cliente receptivo a incentivos.',
      icon: 'discount'
    }
  },
  {
    id: '92833',
    name: 'TechSolutions Ltd',
    totalDebt: 120400,
    overdueDays: 12,
    riskScore: 15,
    riskLevel: RiskLevel.LOW,
    archetype: DebtorArchetype.FINANCIAL_DISTRESS,
    lastAction: 'Pago Programado',
    location: 'Santiago, CL',
    phone: '+56 9 8765 4321',
    email: 'finanzas@techsolutions.cl',
    employer: 'N/A (Empresa)',
    paymentProbability: 90,
    paymentTrend: [90, 95, 100, 90, 85, 95],
    lastPromise: 'Cumplida (May 20)',
    aiAction: {
      title: 'Monitoreo',
      description: 'Mantener seguimiento automático. No se requiere intervención manual por el momento.',
      icon: 'check'
    }
  }
];

export const MOCK_MESSAGES = [
  {
    id: '1',
    sender: 'system',
    content: 'Workflow #45 activated: Recordatorio automático enviado.',
    timestamp: new Date(Date.now() - 86400000),
    channel: 'sms'
  },
  {
    id: '2',
    sender: 'agent',
    content: 'Estimada Maria, le recordamos que su factura vence mañana. Por favor, regularice su situación.',
    timestamp: new Date(Date.now() - 86000000),
    channel: 'sms'
  },
  {
    id: '3',
    sender: 'debtor',
    content: 'Hola, recibí el mensaje. Tuve un problema con el banco pero ya me pagaron.',
    timestamp: new Date(Date.now() - 3600000),
    channel: 'whatsapp'
  },
  {
    id: '4',
    sender: 'debtor',
    content: 'Hola, puedo pagar la mitad este viernes sin falta.',
    timestamp: new Date(Date.now() - 3500000),
    channel: 'whatsapp'
  }
];
