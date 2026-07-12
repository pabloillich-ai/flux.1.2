import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  Smartphone,
  CheckCircle,
  DollarSign,
  Activity,
  Zap,
  Settings,
  ArrowUpRight,
  Database,
  Play,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';

export default function FluxLanding() {
  // --- STATE ---
  const [activeSimulatorTab, setActiveSimulatorTab] = useState('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState('preventivo');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  // Calculator States — variables de entrada del usuario
  const [annualBilling, setAnnualBilling] = useState(1800000);       // Facturación anual a crédito
  const [dsoPrevious, setDsoPrevious] = useState(42);                 // DSO actual (días)
  const [pastDueRate, setPastDueRate] = useState(12);                 // % de mora
  const [hoursInCollections, setHoursInCollections] = useState(1760); // hs/mes dedicadas a cobranza
  const [costPerHour, setCostPerHour] = useState(18);                 // USD/hora fully-loaded
  const [effortSavingsRate, setEffortSavingsRate] = useState(65);     // % ahorro esfuerzo (rango 60-70)
  const [interestPreset, setInterestPreset] = useState('promedio');   // 'conservador' | 'promedio' | 'agresivo'

  // FAQ State
  const [openFaq, setOpenFaq] = useState(null);

  // Demo Booking State
  const [demoStep, setDemoStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    erp: 'sap',
    volume: '100-500'
  });

  // Simulator Data States
  const [clients] = useState([
    { id: 1, name: "Acme Industrial S.A.", debt: 45000, daysPastDue: 18, status: "Preventivo Enviado", stage: "reminder" },
    { id: 2, name: "Tech Logistics Corp", debt: 82000, daysPastDue: 42, status: "Mora Temprana", stage: "warning" },
    { id: 3, name: "Grupo Constructor Delta", debt: 125000, daysPastDue: 5, status: "Al Día", stage: "healthy" },
    { id: 4, name: "Distribuidora del Pacífico", debt: 31000, daysPastDue: 67, status: "Mora Crítica", stage: "critical" },
    { id: 5, name: "Alimentos Procesados MX", debt: 59000, daysPastDue: 12, status: "Pre-vencimiento", stage: "reminder" }
  ]);

  // Forzar scroll al top al montar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle custom notifications
  const triggerToast = (message) => {
    setNotificationMsg(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  // --- Resultados del piloto FLUX (constantes fijas) ---
  const DSO_REDUCTION = 7; // Δ DSO garantizado por FLUX

  // --- Presets de tasa de interés anual ---
  const INTEREST_PRESETS = {
    conservador: 0.08,
    promedio: 0.12,
    agresivo: 0.18
  };
  const annualInterestRate = INTEREST_PRESETS[interestPreset];

  // --- Pricing FLUX: USD 1.000 por cada USD 500.000 de facturación, prorrateado ---
  const FLUX_PRICE_PER_BLOCK = 1000;
  const FLUX_BLOCK_SIZE = 500000;
  const fluxMonthlyCost = (annualBilling / FLUX_BLOCK_SIZE) * FLUX_PRICE_PER_BLOCK;
  const fluxAnnualCost = fluxMonthlyCost * 12;

  // --- Cálculo ROI ---
  const roiCalculations = useMemo(() => {
    const dsoFlux = dsoPrevious - DSO_REDUCTION;
    const dsoDayValue = annualBilling / 365;
    const capitalLiberado = DSO_REDUCTION * dsoDayValue;
    const ahorroCostoFinanciero = capitalLiberado * annualInterestRate;
    const effortRate = effortSavingsRate / 100;
    const hoursSavedMonthly = hoursInCollections * effortRate;
    const monthlyPayrollSavings = hoursSavedMonthly * costPerHour;
    const annualPayrollSavings = monthlyPayrollSavings * 12;
    const monthlyBillingLocal = annualBilling / 12;
    const portfolioAtRisk = monthlyBillingLocal * (pastDueRate / 100);
    const totalAnnualSavings = capitalLiberado + ahorroCostoFinanciero + annualPayrollSavings;
    const roiMultiple = fluxAnnualCost > 0 ? (totalAnnualSavings / fluxAnnualCost) : 0;
    const rawPayback = monthlyPayrollSavings > 0 ? fluxMonthlyCost / monthlyPayrollSavings : Infinity;
    const paybackMonths = isFinite(rawPayback) && rawPayback > 0
      ? (rawPayback < 1 ? 1 : Math.round(rawPayback))
      : 999;

    const fmt = (n) => n.toLocaleString('es-ES', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    });

    return {
      capitalLiberado: fmt(capitalLiberado),
      capitalLiberadoValue: capitalLiberado,
      ahorroCostoFinanciero: fmt(ahorroCostoFinanciero),
      ahorroCostoFinancieroValue: ahorroCostoFinanciero,
      annualPayrollSavings: fmt(annualPayrollSavings),
      annualPayrollSavingsValue: annualPayrollSavings,
      totalAnnualSavings: fmt(totalAnnualSavings),
      totalAnnualSavingsValue: totalAnnualSavings,
      hoursSavedMonthly: Math.round(hoursSavedMonthly),
      hoursSavedAnnual: Math.round(hoursSavedMonthly * 12),
      hoursInCollections,
      effortRate: effortSavingsRate,
      monthlyPayrollSavings: fmt(monthlyPayrollSavings),
      dsoPrevious,
      dsoFlux,
      dsoReduction: DSO_REDUCTION,
      dsoDayValue: fmt(dsoDayValue),
      dsoDayValueValue: dsoDayValue,
      annualBilling: fmt(annualBilling),
      annualInterestRate,
      interestPreset,
      portfolioAtRisk: fmt(portfolioAtRisk),
      pastDueRate,
      roiMultiple: roiMultiple.toFixed(1),
      paybackMonths
    };
  }, [
    annualBilling, dsoPrevious, pastDueRate, hoursInCollections,
    costPerHour, effortSavingsRate, annualInterestRate,
    fluxMonthlyCost, fluxAnnualCost, interestPreset
  ]);

  // Demo form handler
  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      triggerToast("Por favor completa los campos principales.");
      return;
    }
    setDemoStep(2);
    triggerToast("¡Tu solicitud de demo ha sido registrada!");
  };

  // Simulator interactions
  const handleSimulateReminder = (clientName) => {
    triggerToast(`Simulando envío de notificación de cobro inteligente a ${clientName}...`);
  };

  return (
    <div className="min-h-screen bg-[#060B13] text-gray-100 font-sans antialiased overflow-x-hidden selection:bg-[#10B981] selection:text-black">

      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0D1B2A] border border-[#10B981]/40 text-white px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(16,185,129,0.15)] backdrop-blur-md animate-bounce">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <p className="text-sm font-medium">{notificationMsg}</p>
          <button onClick={() => setShowNotification(false)} className="text-gray-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Background Liquid Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#3B82F6]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-[#10B981]/5 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[1000px] left-10 w-[450px] h-[450px] bg-gradient-to-br from-[#6366F1]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Navigation */}
      <header className="sticky top-0 z-40 bg-[#060B13]/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="flux-header-logo relative">
              <div className="flux-header-glow" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/0 border border-white/10 rounded-lg p-1.5 group-hover:border-[#10B981]/50 transition-colors">
                <img src="/FLUXLOGO.png" alt="FLUX Logo" className="h-9 w-auto object-contain" />
              </div>
            </div>
            <span className="hidden sm:flex flex-col leading-none">
              <span className="text-white font-extrabold text-base tracking-tight">FLUX</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#10B981] font-bold">Technologies</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#vehiculo" className="hover:text-white transition-colors">¿Qué hacemos?</a>
            <a href="#motor" className="hover:text-white transition-colors">Nuestra Creencia</a>
            <a href="#simulator" className="hover:text-white transition-colors">Ver Sistema</a>
            <a href="#roi" className="hover:text-white transition-colors">Calculadora ROI</a>
            <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <a
              href="#simulator"
              className="hidden sm:inline-flex text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition-all"
            >
              Probar Demo En Vivo
            </a>
            {/* Botón Acceso Premium → /login */}
            <Link
              to="/login"
              className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-black font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-[#10B981]/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <span>Acceso Premium</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">

              {/* Logo destacado */}
              <div className="flex justify-center lg:justify-start">
                <div className="flux-logo-wrap">
                  <div className="absolute inset-0 bg-[#10B981]/40 blur-2xl rounded-full flux-pulse" />
                  <div className="flux-ring flux-ring-outer" />
                  <div className="flux-ring flux-ring-inner" />
                  <div className="relative bg-gradient-to-br from-[#111A2E]/80 to-[#060B13]/80 backdrop-blur-sm rounded-2xl p-4 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
                    <div className="flux-border-shimmer" />
                    <div className="flux-scan" />
                    <img
                      src="/FLUXLOGO.png"
                      alt="FLUX Logo"
                      className="flux-img h-16 md:h-20 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm font-medium text-gray-300 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>La revolución de la cobranza B2B interactiva</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                Tu tiempo y tu capital, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#3B82F6] bg-clip-text text-transparent">
                  fluyendo a tu favor.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                En <strong className="text-white font-medium">FLUX</strong> destrabamos el flujo de caja y la comunicación de tu empresa mediante la automatización inteligente del ciclo de cobranzas B2B. Eliminamos la fricción operativa para que tu negocio crezca sin interrupciones.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <a
                  href="#demo"
                  className="w-full sm:w-auto text-center bg-gradient-to-r from-[#10B981] to-[#3B82F6] hover:from-[#34D399] hover:to-[#60A5FA] text-black font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-[#10B981]/15 transition-all hover:scale-105"
                >
                  Mejorar Mi Flujo de Caja
                </a>
                <a
                  href="#simulator"
                  className="w-full sm:w-auto text-center bg-[#1E293B]/70 hover:bg-[#1E293B] border border-white/10 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:border-white/25"
                >
                  <Play className="w-5 h-5 text-[#10B981] fill-current" />
                  <span>Explorar Simulador</span>
                </a>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-3">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Compatible con tus sistemas actuales</p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 opacity-60 hover:opacity-90 transition-opacity">
                  <span className="text-sm font-semibold tracking-wider text-gray-300">SAP ERP</span>
                  <span className="text-sm font-semibold tracking-wider text-gray-300">ORACLE Cloud</span>
                  <span className="text-sm font-semibold tracking-wider text-gray-300">MICROSOFT Dynamics</span>
                  <span className="text-sm font-semibold tracking-wider text-gray-300">QUICKBOOKS Enterprise</span>
                  <span className="text-sm font-semibold tracking-wider text-gray-300">LOCAL APIs</span>
                </div>
              </div>

            </div>

            {/* Hero Right Visuals */}
            <div className="lg:col-span-5 relative mt-10 lg:mt-0">
              <div className="relative mx-auto max-w-[440px] lg:max-w-none bg-gradient-to-b from-[#111A2E] to-[#080E1A] p-6 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">FLUX Live Engine Status</span>
                  </div>
                  <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full font-semibold">Online</span>
                </div>

                <div className="relative flex flex-col items-center justify-center py-6 bg-[#0B1220] rounded-2xl border border-white/5 mb-6 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm text-gray-400">Reducción Promedio de DSO</p>
                  <p className="text-6xl font-black text-white tracking-tighter my-2 bg-gradient-to-r from-white to-[#10B981] bg-clip-text text-transparent">
                    -35%
                  </p>
                  <p className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Ciclo de cobro optimizado</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0B1220] p-4 rounded-xl border border-white/5">
                    <span className="text-xs text-gray-400 block mb-1">Efectividad Mensajes</span>
                    <span className="text-xl font-bold text-white block">94.2%</span>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-full w-[94%]" />
                    </div>
                  </div>
                  <div className="bg-[#0B1220] p-4 rounded-xl border border-white/5">
                    <span className="text-xs text-gray-400 block mb-1">Capital Liberado</span>
                    <span className="text-xl font-bold text-white block">$24.8M USD</span>
                    <span className="text-[10px] text-gray-500 block mt-2">Retorno de caja natural</span>
                  </div>
                </div>

                <div className="mt-4 bg-[#1E293B]/40 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-[#10B981]/15 rounded-lg text-[#10B981]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">SAP Sincronizado</p>
                      <p className="text-[10px] text-gray-400">Hace 4 segundos</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white bg-white/5 px-2.5 py-1 rounded-md">240 Acciones/min</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PROPUESTA ÚNICA DE VALOR (PUV) SECTION */}
      <section id="vehiculo" className="py-24 bg-[#09101E] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#10B981] font-bold mb-3">Filosofía Operativa</h2>
            <p className="text-3xl md:text-4xl font-extrabold text-white">
              Diseñado para que tu capital nunca deje de avanzar
            </p>
            <p className="text-gray-400 mt-4">
              Dividimos nuestra propuesta de valor en tres pilares que sostienen el rendimiento financiero de las corporaciones modernas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Card 1: Qué hacemos */}
            <div id="motor" className="bg-[#0D1525] p-8 rounded-2xl border border-white/5 hover:border-[#10B981]/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">El Vehículo: ¿Qué hacemos?</h3>
                <p className="text-[#10B981] text-xs font-medium uppercase tracking-widest mb-4">La Lógica del Sistema</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Automatizamos y optimizamos el ciclo completo de comunicaciones y cobranzas B2B. Eliminamos radicalmente la fricción operativa, permitiendo que las facturas se liquiden a tiempo sin desgastar la relación comercial con tus clientes.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 mt-8 flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span>Cobros 100% automatizados</span>
              </div>
            </div>

            {/* Card 2: Por qué lo hacemos */}
            <div className="bg-[#0D1525] p-8 rounded-2xl border border-white/5 hover:border-[#3B82F6]/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">El Motor: ¿Por qué lo hacemos?</h3>
                <p className="text-[#3B82F6] text-xs font-medium uppercase tracking-widest mb-4">Nuestra Creencia Fundamental</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Porque creemos que las interrupciones en la comunicación, los procesos y el dinero generan estrés nocivo y estancamiento. Las empresas nacieron para avanzar, y para lograrlo, el capital y la información deben fluir de manera natural.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 mt-8 flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle className="w-4 h-4 text-[#3B82F6]" />
                <span>Cero estancamiento operativo</span>
              </div>
            </div>

            {/* Card 3: Para qué lo hacemos */}
            <div className="bg-[#0D1525] p-8 rounded-2xl border border-white/5 hover:border-[#6366F1]/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">La Emoción: ¿Para qué lo hacemos?</h3>
                <p className="text-[#6366F1] text-xs font-medium uppercase tracking-widest mb-4">El Resultado Humano y Comercial</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Para devolverle a las empresas la tranquilidad financiera y el tiempo productivo. Queremos que tus equipos se enfoquen en el crecimiento estratégico y el desarrollo del negocio mientras la salud del flujo de caja se mantiene de forma autónoma.
                </p>
              </div>
              <div className="pt-6 border-t border-white/5 mt-8 flex items-center gap-2 text-xs text-gray-300">
                <CheckCircle className="w-4 h-4 text-[#6366F1]" />
                <span>Tranquilidad y enfoque estratégico</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* MAIN INTERACTIVE SIMULATOR */}
      <section id="simulator" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-[#10B981] font-bold block mb-3">Live Experience</span>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Explora la interfaz de FLUX en tiempo real
            </h2>
            <p className="text-gray-400 mt-4 text-base leading-relaxed">
              Interactúa con el simulador interactivo para ver cómo fluye la información financiera, se coordinan las alertas inteligentes y se integran los sistemas de ERP.
            </p>
          </div>

          {/* Premium Panel Outer Box */}
          <div className="bg-[#0B111E] rounded-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden">

            {/* Top Bar of the Simulator */}
            <div className="bg-[#0E1728] px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-white/5 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                </div>
                <div className="h-4 w-[1px] bg-white/15" />
                <span className="text-xs text-gray-400 font-mono tracking-wider">app.flux.io/workspace_premium</span>
              </div>

              {/* Selector Tabs */}
              <div className="flex flex-wrap gap-1 bg-[#060B13] p-1.5 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveSimulatorTab('overview')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeSimulatorTab === 'overview' ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/15' : 'text-gray-400 hover:text-white'}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Panel General</span>
                </button>
                <button
                  onClick={() => setActiveSimulatorTab('channels')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeSimulatorTab === 'channels' ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/15' : 'text-gray-400 hover:text-white'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mensajería Inteligente</span>
                </button>
                <button
                  onClick={() => setActiveSimulatorTab('erp')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeSimulatorTab === 'erp' ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/15' : 'text-gray-400 hover:text-white'}`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>ERP Sync</span>
                </button>
                <button
                  onClick={() => setActiveSimulatorTab('workflows')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeSimulatorTab === 'workflows' ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/15' : 'text-gray-400 hover:text-white'}`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Reglas de Negocio</span>
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6 md:p-8 min-h-[460px]">

              {/* TAB 1: OVERVIEW */}
              {activeSimulatorTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#0E1728] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">Cuentas por Cobrar Activas</span>
                        <span className="text-2xl font-bold text-white">$342,000 USD</span>
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-[#0E1728] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">Mora Promedio (DSO)</span>
                        <span className="text-2xl font-bold text-white">27 Días</span>
                      </div>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-[#10B981]">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-[#0E1728] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">Cobro Automatizado Total</span>
                        <span className="text-2xl font-bold text-white">88.5%</span>
                      </div>
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <Zap className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* List of accounts */}
                  <div className="bg-[#0E1728] rounded-xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-sm font-bold text-white">Cartera de Clientes Activa</span>
                        <span className="text-xs bg-[#10B981]/15 text-[#10B981] px-2.5 py-0.5 rounded-full font-semibold">Sincronizado</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="Filtrar cliente..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#060B13] border border-white/10 rounded-lg py-1.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs md:text-sm">
                        <thead className="bg-[#0A0F1D] text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-white/5">
                          <tr>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Saldo Pendiente</th>
                            <th className="p-4">Mora (Días)</th>
                            <th className="p-4">Estado del Sistema</th>
                            <th className="p-4 text-right">Acción Rápida</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {clients
                            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((client) => (
                              <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 font-semibold text-white flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                                  <span>{client.name}</span>
                                </td>
                                <td className="p-4 font-mono font-medium text-gray-200">
                                  ${client.debt.toLocaleString('es-ES')} USD
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded font-bold ${
                                    client.daysPastDue > 45 ? 'text-red-400 bg-red-400/10' :
                                    client.daysPastDue > 15 ? 'text-amber-400 bg-amber-400/10' :
                                    'text-emerald-400 bg-emerald-400/10'
                                  }`}>
                                    {client.daysPastDue} Días
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="text-gray-300">{client.status}</span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleSimulateReminder(client.name)}
                                    className="bg-white/5 hover:bg-[#10B981] hover:text-black text-gray-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                                  >
                                    Notificar Ahora
                                  </button>
                                </td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHANNELS */}
              {activeSimulatorTab === 'channels' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#0E1728] p-5 rounded-xl border border-white/5">
                      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#10B981]" />
                        <span>Canal de Notificación Oficial</span>
                      </h4>
                      <p className="text-xs text-gray-400 mb-4">
                        FLUX utiliza la API oficial de WhatsApp para enviar mensajes con tasa de apertura del 98%. Sin bloqueos de números comerciales.
                      </p>

                      <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-gray-500 block">Tipo de Alerta</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedWorkflow('preventivo')}
                            className={`p-3 text-xs font-bold rounded-lg text-left border ${selectedWorkflow === 'preventivo' ? 'bg-[#10B981]/10 border-[#10B981] text-white' : 'bg-[#060B13] border-white/10 text-gray-400 hover:text-white'}`}
                          >
                            Preventivo (Vence en 5d)
                          </button>
                          <button
                            onClick={() => setSelectedWorkflow('vencido')}
                            className={`p-3 text-xs font-bold rounded-lg text-left border ${selectedWorkflow === 'vencido' ? 'bg-[#10B981]/10 border-[#10B981] text-white' : 'bg-[#060B13] border-white/10 text-gray-400 hover:text-white'}`}
                          >
                            Vencido (Mora Temprana)
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <span className="text-xs text-gray-400 block">Variables Dinámicas Mapeadas:</span>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-1 rounded">{"{Nombre_Cliente}"}</span>
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-1 rounded">{"{Nro_Factura}"}</span>
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-1 rounded">{"{Monto_Total}"}</span>
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2 py-1 rounded">{"{Boton_Pago}"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Mobile Chat */}
                  <div className="lg:col-span-7 flex justify-center">
                    <div className="w-full max-w-[340px] bg-[#070D19] rounded-[40px] border-[8px] border-[#1E293B] shadow-2xl overflow-hidden relative">

                      <div className="bg-[#1E293B] px-4 py-2 flex items-center justify-between text-[11px] text-gray-300">
                        <span>10:10 AM</span>
                        <div className="w-16 h-4 bg-black rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2" />
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>WhatsApp API</span>
                        </div>
                      </div>

                      <div className="bg-[#0E1728] p-4 flex items-center gap-3 border-b border-white/5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#10B981] to-[#3B82F6] flex items-center justify-center font-bold text-black text-xs">
                          FL
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1">
                            <span>Flux Alerts</span>
                            <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</span>
                          </p>
                          <p className="text-[9px] text-[#10B981]">Cuenta Oficial de Empresa</p>
                        </div>
                      </div>

                      <div className="p-4 h-64 overflow-y-auto space-y-4 bg-[#050A12] text-xs">
                        <div className="text-center">
                          <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-1 rounded-md">Hoy</span>
                        </div>

                        <div className="bg-[#0E1B2E] border border-[#10B981]/20 p-3 rounded-2xl rounded-tl-none max-w-[90%] text-gray-100 shadow-md">
                          {selectedWorkflow === 'preventivo' ? (
                            <>
                              <p className="font-semibold text-white mb-1">Estimado equipo de Acme Industrial,</p>
                              <p className="text-gray-300 leading-relaxed text-[11px]">
                                Le recordamos amablemente que su factura <span className="text-[#10B981] font-mono">#B2B-8921</span> por <span className="font-semibold text-white">$45,000 USD</span> vencerá en 5 días.
                              </p>
                              <div className="mt-3 bg-[#10B981] text-black font-bold text-center py-2 rounded-xl text-[11px] hover:bg-[#34D399] transition-colors cursor-pointer">
                                💳 Pagar Factura Directamente
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-white mb-1">Estimado equipo de Tech Logistics,</p>
                              <p className="text-gray-300 leading-relaxed text-[11px]">
                                Esperamos que se encuentren bien. Detectamos un saldo vencido de <span className="text-red-400 font-semibold">$82,000 USD</span> correspondiente a la factura <span className="text-amber-400 font-mono">#B2B-7741</span> (42 días de mora).
                              </p>
                              <div className="mt-3 space-y-2">
                                <div className="bg-[#10B981] text-black font-bold text-center py-2 rounded-xl text-[11px] cursor-pointer">
                                  💳 Pagar Factura Vencida
                                </div>
                                <div className="bg-white/10 text-white text-center py-2 rounded-xl text-[11px] cursor-pointer hover:bg-white/15 transition-colors">
                                  📅 Agendar Reunión de Pago
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#0E1728] p-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Respuestas automatizadas listas...</span>
                        <div className="w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center text-black">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ERP SYNC */}
              {activeSimulatorTab === 'erp' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0E1728] p-5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-white">SAP S/4HANA</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs text-gray-400">
                          Sincronización automatizada de facturas y abonos cada 15 minutos de forma bidireccional.
                        </p>
                      </div>
                      <button
                        onClick={() => triggerToast("Comenzando prueba de conexión con módulo SAP FI...")}
                        className="mt-6 bg-[#060B13] hover:bg-[#10B981] hover:text-black text-[#10B981] text-xs font-bold py-2 rounded-lg border border-[#10B981]/20 hover:border-transparent transition-all"
                      >
                        Probar Conexión
                      </button>
                    </div>

                    <div className="bg-[#0E1728] p-5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-white">Microsoft Dynamics</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs text-gray-400">
                          Lectura automática de estados de cuenta y clientes directamente desde Microsoft Business Central.
                        </p>
                      </div>
                      <button
                        onClick={() => triggerToast("Comenzando prueba de conexión con Dynamics 365...")}
                        className="mt-6 bg-[#060B13] hover:bg-[#10B981] hover:text-black text-[#10B981] text-xs font-bold py-2 rounded-lg border border-[#10B981]/20 hover:border-transparent transition-all"
                      >
                        Probar Conexión
                      </button>
                    </div>

                    <div className="bg-[#0E1728] p-5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-white">Webhooks & API Rest</span>
                          <span className="text-xs bg-[#10B981]/15 text-[#10B981] px-2 py-0.5 rounded-full font-semibold">Listo</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Para sistemas de desarrollo propio. Documentación OpenAPI robusta para integrar en un día.
                        </p>
                      </div>
                      <button
                        onClick={() => triggerToast("Abriendo documentación interactiva de la API de FLUX...")}
                        className="mt-6 bg-[#060B13] hover:bg-[#10B981] hover:text-black text-[#10B981] text-xs font-bold py-2 rounded-lg border border-[#10B981]/20 hover:border-transparent transition-all"
                      >
                        Explorar Endpoints
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#060B13] p-4 rounded-xl border border-white/5">
                    <p className="text-xs font-bold text-white mb-2">Logs Recientes de Integración:</p>
                    <div className="font-mono text-[11px] text-gray-400 space-y-1">
                      <p><span className="text-[#10B981]">[OK]</span> 10:05 AM - Importación completada: 142 facturas desde SAP FI.</p>
                      <p><span className="text-[#10B981]">[OK]</span> 10:00 AM - Actualización de pagos: $45,000 USD aplicados a cuenta #9921.</p>
                      <p><span className="text-blue-400">[INFO]</span> 09:45 AM - API Sync: Ejecución periódica exitosa para 5 conectores.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WORKFLOWS */}
              {activeSimulatorTab === 'workflows' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Editor de Reglas de Cobranza Automática</h4>
                      <p className="text-xs text-gray-400">Determina qué acciones realiza el sistema FLUX según el comportamiento del cliente.</p>
                    </div>
                    <button
                      onClick={() => triggerToast("¡Flujo guardado con éxito en el servidor de pruebas!")}
                      className="bg-[#10B981] hover:bg-[#34D399] text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      Guardar Flujo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                    {/* Step 1 */}
                    <div className="bg-[#0E1728] p-4 rounded-xl border border-white/5 relative">
                      <span className="absolute -top-3 -right-3 w-6 h-6 bg-[#10B981] rounded-full text-black font-extrabold flex items-center justify-center text-xs">1</span>
                      <p className="text-xs font-bold text-white mb-2">Al emitir Factura</p>
                      <p className="text-[11px] text-gray-400 mb-4">Sincronización inicial y envío de copia PDF al cliente.</p>
                      <div className="bg-[#060B13] p-2.5 rounded text-[10px] text-gray-300 font-mono">
                        Acción: Email Automático
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-[#0E1728] p-4 rounded-xl border border-[#10B981]/30 relative">
                      <span className="absolute -top-3 -right-3 w-6 h-6 bg-[#10B981] rounded-full text-black font-extrabold flex items-center justify-center text-xs">2</span>
                      <p className="text-xs font-bold text-[#10B981] mb-2">5 días antes del Vencimiento</p>
                      <p className="text-[11px] text-gray-400 mb-4">Aviso de cortesía preventivo con botón de auto-pago.</p>
                      <div className="bg-[#060B13] p-2.5 rounded text-[10px] text-[#10B981] font-mono">
                        Acción: WhatsApp Inteligente
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-[#0E1728] p-4 rounded-xl border border-white/5 relative">
                      <span className="absolute -top-3 -right-3 w-6 h-6 bg-[#10B981] rounded-full text-black font-extrabold flex items-center justify-center text-xs">3</span>
                      <p className="text-xs font-bold text-white mb-2">Día del Vencimiento</p>
                      <p className="text-[11px] text-gray-400 mb-4">Alerta de vencimiento inmediata y link de financiamiento.</p>
                      <div className="bg-[#060B13] p-2.5 rounded text-[10px] text-gray-300 font-mono">
                        Acción: WhatsApp + Email
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-[#0E1728] p-4 rounded-xl border border-white/5 relative">
                      <span className="absolute -top-3 -right-3 w-6 h-6 bg-[#10B981] rounded-full text-black font-extrabold flex items-center justify-center text-xs">4</span>
                      <p className="text-xs font-bold text-white mb-2">Mora Tardía (+15 días)</p>
                      <p className="text-[11px] text-gray-400 mb-4">Asignación automática a ejecutivo y llamada telefónica de cobro.</p>
                      <div className="bg-[#060B13] p-2.5 rounded text-[10px] text-gray-300 font-mono">
                        Acción: Ticket CRM Interno
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="bg-[#0E1728] px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
              <p>📍 Los datos y simulaciones presentados se adaptan según tu volumen financiero real.</p>
              <a href="#roi" className="text-[#10B981] hover:underline font-bold">Calcular tu ROI específico →</a>
            </div>

          </div>

        </div>
      </section>

      {/* CALCULADORA DE ROI INTERACTIVA */}
      <section id="roi" className="py-24 bg-[#09101E] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* ROI Left - Controls */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-[#10B981] font-bold block mb-3">Retorno de Inversión</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                  Calcula el impacto inmediato en tu caja
                </h2>
                <p className="text-gray-400 mt-4 leading-relaxed">
                  Ajusta los sliders de acuerdo con la realidad operativa actual de tu empresa para ver cuánto dinero y tiempo recuperará FLUX mensualmente de manera automatizada.
                </p>
              </div>

              {/* Sliders Container */}
              <div className="space-y-6 bg-[#0E1728] p-6 rounded-2xl border border-white/5">

                {/* Facturación Anual a Crédito */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>Facturación Anual a Crédito</span>
                    <span className="text-white">${annualBilling.toLocaleString('es-ES')} USD</span>
                  </div>
                  <input
                    type="range"
                    min="240000"
                    max="12000000"
                    step="60000"
                    value={annualBilling}
                    onChange={(e) => setAnnualBilling(Number(e.target.value))}
                    className="w-full h-2 bg-[#060B13] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>$240k</span>
                    <span>$12M+</span>
                  </div>
                </div>

                {/* DSO Previo */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>DSO Actual (Previo)</span>
                    <span className="text-white">{dsoPrevious} días</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="1"
                    value={dsoPrevious}
                    onChange={(e) => setDsoPrevious(Number(e.target.value))}
                    className="w-full h-2 bg-[#060B13] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>20 días</span>
                    <span>90 días</span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    DSO FLUX proyectado: <span className="text-[#10B981] font-semibold">{dsoPrevious - 7} días</span>
                    {' '}(−7 garantizado por el piloto)
                  </p>
                </div>

                {/* % Mora (informativo) */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>% Cartera en Mora (informativo)</span>
                    <span className="text-white">{pastDueRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    step="1"
                    value={pastDueRate}
                    onChange={(e) => setPastDueRate(Number(e.target.value))}
                    className="w-full h-2 bg-[#060B13] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>2%</span>
                    <span>40%</span>
                  </div>
                </div>

                {/* Horas dedicadas hoy a cobranza */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>Horas/mes dedicadas a Cobranza</span>
                    <span className="text-white">{hoursInCollections.toLocaleString('es-ES')} hs</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={hoursInCollections}
                    onChange={(e) => setHoursInCollections(Number(e.target.value))}
                    className="w-full h-2 bg-[#060B13] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>50</span>
                    <span>5.000</span>
                  </div>
                </div>

                {/* Costo por hora */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>Costo Promedio Hora de Nómina</span>
                    <span className="text-white">USD {costPerHour}/h</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={costPerHour}
                    onChange={(e) => setCostPerHour(Number(e.target.value))}
                    className="w-full h-2 bg-[#060B13] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>USD 5</span>
                    <span>USD 50</span>
                  </div>
                </div>

                {/* % Ahorro de esfuerzo (rango piloto 60-70%) */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                    <span>% Ahorro de Esfuerzo (rango piloto)</span>
                    <span className="text-white">{effortSavingsRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="70"
                    step="1"
                    value={effortSavingsRate}
                    onChange={(e) => setEffortSavingsRate(Number(e.target.value))}
                    className="w-full h-2 bg-[#060B13] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>60% conservador</span>
                    <span>70% optimista</span>
                  </div>
                </div>

                {/* Tasa de Interés Anual — Preset */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                    Tasa de Interés Anual (costo del capital)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['conservador', 'promedio', 'agresivo'].map(p => (
                      <button
                        key={p}
                        onClick={() => setInterestPreset(p)}
                        className={`py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                          interestPreset === p
                            ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                            : 'bg-[#060B13] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className="block">{p}</span>
                        <span className="block text-[9px] mt-0.5 opacity-70">
                          {(INTEREST_PRESETS[p] * 100).toFixed(0)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ROI Right - Output Cards */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-br from-[#111A2E] to-[#080E1A] p-8 rounded-3xl border border-[#10B981]/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />

                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#10B981]" />
                  <span>Beneficio Estimado con FLUX</span>
                </h3>
                <p className="text-[10px] text-gray-500 mb-4">
                  Caso de éxito piloto: <span className="text-[#10B981] font-semibold">−7 días DSO</span> · <span className="text-[#10B981] font-semibold">60-70% de ahorro en esfuerzo</span> · cobertura 100% de la cartera.
                </p>

                {/* Cartera en riesgo (resumen ejecutivo) */}
                <div className="mb-6 bg-[#0B1220] p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cartera en Mora (referencia)</p>
                  <p className="text-lg font-black text-white">{roiCalculations.portfolioAtRisk}</p>
                  <p className="text-[9px] text-gray-500 mt-1">{pastDueRate}% de la facturación mensual</p>
                </div>

                <div className="space-y-4">
                  {/* Output 1: Capital Liberado por DSO */}
                  <div className="bg-[#0B1220] p-5 rounded-2xl border border-white/5">
                    <span className="text-xs text-gray-400 block mb-1">Capital de Trabajo Liberado</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black text-white">{roiCalculations.capitalLiberado} USD</span>
                      <span className="text-xs text-gray-400">/año</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      <span className="font-mono text-gray-300">({roiCalculations.dsoPrevious} − {roiCalculations.dsoFlux}) × {roiCalculations.dsoDayValue}/día</span>
                      {' '}= {roiCalculations.dsoReduction} días × valor de 1 día de DSO.
                      <br />
                      <span className="text-gray-500">Sobre facturación anual a crédito de {roiCalculations.annualBilling}.</span>
                    </p>
                  </div>

                  {/* Output 2: Ahorro por Costo Financiero */}
                  <div className="bg-[#0B1220] p-5 rounded-2xl border border-white/5">
                    <span className="text-xs text-gray-400 block mb-1">Ahorro por Costo Financiero del Capital</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black text-blue-400">{roiCalculations.ahorroCostoFinanciero} USD</span>
                      <span className="text-xs text-gray-400">/año</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      <span className="font-mono text-gray-300">Capital Liberado × {(roiCalculations.annualInterestRate * 100).toFixed(0)}%</span>
                      {' '}= {roiCalculations.capitalLiberado} × {(roiCalculations.annualInterestRate * 100).toFixed(0)}%.
                      <br />
                      <span className="text-gray-500">Tasa de interés preset: <strong className="text-white capitalize">{roiCalculations.interestPreset}</strong>.</span>
                    </p>
                  </div>

                  {/* Output 3: DSO Pasaje */}
                  <div className="bg-[#0B1220] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Reducción del Ciclo DSO Proyectado</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-400">{roiCalculations.dsoPrevious} → {roiCalculations.dsoFlux}</span>
                        <span className="text-sm text-gray-300">Días promedio</span>
                      </div>
                      <span className="block text-[10px] text-gray-500 mt-1">
                        Caso de éxito piloto: −{roiCalculations.dsoReduction} días sobre DSO histórico B2B
                      </span>
                    </div>
                  </div>

                  {/* Output 4: Horas del equipo liberadas (Nómina) */}
                  <div className="bg-[#0B1220] p-5 rounded-2xl border border-white/5">
                    <span className="text-xs text-gray-400 block mb-1">Ahorro en Esfuerzo Mensual (Horas del Equipo)</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-black text-[#10B981]">{roiCalculations.hoursSavedMonthly.toLocaleString('es-ES')} hs</span>
                      <span className="text-xs text-gray-400">liberadas/mes</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                      <span className="text-[#10B981] font-semibold">{roiCalculations.hoursSavedAnnual.toLocaleString('es-ES')} hs/año</span>
                      {' '}· equivale a {roiCalculations.monthlyPayrollSavings} USD/mes en nómina liberada.
                      <br />
                      <span className="text-gray-500">
                        Cálculo: {hoursInCollections.toLocaleString('es-ES')} hs dedicadas hoy × {effortSavingsRate}% de ahorro × USD {costPerHour}/h.
                      </span>
                    </p>
                  </div>

                  {/* Output 5 destacada: AHORRO ANUAL TOTAL */}
                  <div className="bg-gradient-to-br from-[#10B981]/15 to-[#059669]/5 p-5 rounded-2xl border border-[#10B981]/40">
                    <span className="text-xs text-[#10B981] uppercase font-bold tracking-wider block mb-1">
                      ★ Impacto Total Anual
                    </span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-4xl font-black text-white">{roiCalculations.totalAnnualSavings} USD</span>
                      <span className="text-xs text-gray-400">/año</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                      = Capital Liberado + Ahorro por Costo Financiero + Ahorro de Esfuerzo anual.
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#10B981]/20 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-gray-500">ROI estimado</p>
                        <p className="text-white font-bold text-base">{roiCalculations.roiMultiple}x</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payback</p>
                        <p className="text-white font-bold text-base">
                          {roiCalculations.paybackMonths >= 999
                            ? 'N/A'
                            : `~${roiCalculations.paybackMonths} ${roiCalculations.paybackMonths === 1 ? 'mes' : 'meses'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <p className="text-[10px] text-gray-500 mb-4">
                    El costo de FLUX se recupera ampliamente y estabiliza Collection & Cashflow de forma sostenida.
                  </p>
                  <a
                    href="#demo"
                    className="inline-flex items-center gap-2 text-black bg-[#10B981] hover:bg-[#34D399] font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                  >
                    <span>Solicitar Reporte de Viabilidad</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* COMPARATIVA DE EFICIENCIA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-[#3B82F6] font-bold block mb-3">La Diferencia</span>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            ¿Por qué la cobranza manual está frenando tu negocio?
          </h2>
          <p className="text-gray-400 mt-4 leading-relaxed">
            Las interrupciones constantes por tareas manuales desgastan a tu equipo y restan liquidez diaria. Compara el modelo tradicional frente al motor inteligente FLUX.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Tradicional */}
          <div className="bg-[#0E1728]/50 p-8 rounded-2xl border border-red-500/20 relative">
            <span className="absolute top-4 right-4 bg-red-500/10 text-red-400 font-bold text-xs px-3 py-1 rounded-full">Tradicional</span>
            <h3 className="text-xl font-bold text-white mb-4">Gestión de Cobros Manual</h3>

            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span>Llamadas aleatorias e incómodas de cobro por falta de orden estructurado.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span>Uso ineficiente de hojas de cálculo de Excel que se desactualizan al instante.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span>Fuga de información y falta de trazabilidad en los mensajes con los clientes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span>Estrés en el equipo de finanzas, forzándolos a ser cobradores en vez de estrategas.</span>
              </li>
            </ul>
          </div>

          {/* FLUX */}
          <div className="bg-gradient-to-br from-[#10B981]/10 to-[#0B111E] p-8 rounded-2xl border border-[#10B981]/40 relative">
            <span className="absolute top-4 right-4 bg-[#10B981]/20 text-[#10B981] font-bold text-xs px-3 py-1 rounded-full">Con FLUX</span>
            <h3 className="text-xl font-bold text-white mb-4">Flujo de Cobro Inteligente</h3>

            <ul className="space-y-4 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <span className="text-[#10B981] font-bold mt-0.5">✓</span>
                <span>Comunicaciones automatizadas amigables basadas en comportamiento histórico.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#10B981] font-bold mt-0.5">✓</span>
                <span>Sincronización en tiempo real y directa con tu ERP (SAP, Dynamics, QuickBooks).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#10B981] font-bold mt-0.5">✓</span>
                <span>Auditoría transparente y logs de cada WhatsApp, email y llamada programada.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#10B981] font-bold mt-0.5">✓</span>
                <span>Tranquilidad y enfoque absoluto de tus líderes en la expansión del negocio.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" className="py-24 bg-[#09101E] border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-[#10B981] font-bold block mb-3">Soporte Tecnológico</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Preguntas Frecuentes
            </h2>
            <p className="text-gray-400 mt-2">
              Todo lo que necesitas saber sobre la integración de FLUX en tu infraestructura actual.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "¿Es necesario tener conocimientos de programación para integrar FLUX?",
                a: "No. FLUX cuenta con conectores directos y sin código para los ERPs más populares (SAP S/4HANA, Dynamics, Oracle Cloud y QuickBooks). Nuestro equipo de ingenieros de soporte se encarga de la configuración inicial en menos de 24 horas hábiles sin costo adicional."
              },
              {
                q: "¿Cómo funciona el envío de mensajes a través de WhatsApp?",
                a: "Utilizamos la API Oficial de Meta (WhatsApp Business Platform). Esto te garantiza el 100% de entrega, previene bloqueos de números comerciales, permite usar la marca/nombre de tu empresa con insignia de verificación y habilita botones de respuesta rápida para que tus clientes paguen directo desde el chat."
              },
              {
                q: "¿Los datos financieros de mi empresa están seguros con FLUX?",
                a: "La seguridad es nuestra mayor prioridad. Contamos con cifrado AES-256 para todos los datos almacenados, protocolos TLS de extremo a extremo para las transferencias y cumplimos estrictamente con las normativas internacionales de protección de datos (GDPR y regulaciones financieras locales)."
              },
              {
                q: "¿Cuánto tiempo toma ver resultados después de la activación?",
                a: "La mayoría de nuestros socios corporativos experimentan una reducción del 15% al 20% en su indicador de DSO dentro de los primeros 30 días de uso continuo del motor de automatización preventiva de FLUX."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#0E1728] rounded-xl border border-white/5 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between text-white font-bold text-sm md:text-base focus:outline-none"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#10B981]" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-gray-400 text-xs md:text-sm leading-relaxed border-t border-white/5 bg-[#0A0F1D]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* LEAD ACQUISITION / BOOK DEMO FORM */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="bg-gradient-to-tr from-[#111A2E] via-[#0E1728] to-[#0D1525] rounded-3xl border border-[#10B981]/30 p-8 md:p-12 lg:p-16 relative overflow-hidden shadow-2xl">

            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#10B981]/15 rounded-full blur-[80px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs uppercase tracking-[0.2em] text-[#10B981] font-extrabold block">Acceso Prioritario</span>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  Comienza a liberar tu flujo de caja hoy
                </h2>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                  Completa el formulario para reservar una auditoría de cuentas por cobrar gratuita y una sesión guiada de nuestra plataforma en vivo con un especialista de FLUX.
                </p>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#10B981]/25 flex items-center justify-center text-[#10B981]">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-gray-300">Auditoría de DSO gratuita (valorada en $350 USD).</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#10B981]/25 flex items-center justify-center text-[#10B981]">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-gray-300">Prueba guiada de sincronización con tu base de datos sandbox.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#10B981]/25 flex items-center justify-center text-[#10B981]">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-gray-300">Sin contratos forzosos durante la etapa de pruebas.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                {demoStep === 1 ? (
                  <form onSubmit={handleDemoSubmit} className="bg-[#060B13] p-6 md:p-8 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-2">Solicitar una Demostración</h3>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos Mendoza"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#0E1728] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#10B981] transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Correo Electrónico Corporativo</label>
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[#0E1728] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#10B981] transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Nombre de la Empresa</label>
                        <input
                          type="text"
                          required
                          placeholder="Acme S.A."
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          className="w-full bg-[#0E1728] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#10B981] transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">ERP Actual</label>
                        <select
                          value={formData.erp}
                          onChange={(e) => setFormData({...formData, erp: e.target.value})}
                          className="w-full bg-[#0E1728] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#10B981] transition-colors"
                        >
                          <option value="sap">SAP ERP / S4HANA</option>
                          <option value="dynamics">Microsoft Dynamics</option>
                          <option value="oracle">Oracle Cloud</option>
                          <option value="quickbooks">Quickbooks</option>
                          <option value="custom">API / Desarrollo Propio</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#10B981] to-[#3B82F6] hover:from-[#34D399] hover:to-[#60A5FA] text-black font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all hover:scale-[1.01]"
                      >
                        Agendar Auditoría Gratis
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-500 text-center">
                      Respetamos la confidencialidad de tus datos financieros bajo acuerdos NDA estrictos.
                    </p>
                  </form>
                ) : (
                  <div className="bg-[#060B13] p-8 rounded-2xl border border-[#10B981] space-y-6 text-center shadow-xl">
                    <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">¡Todo Listo, {formData.name}!</h3>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Hemos registrado tu interés por <span className="text-white font-bold">{formData.company}</span>. Un especialista en integración con <span className="text-[#10B981] font-semibold uppercase">{formData.erp}</span> se pondrá en contacto contigo a través de <span className="text-white">{formData.email}</span> para programar el demo de 15 minutos.
                      </p>
                    </div>
                    <button
                      onClick={() => setDemoStep(1)}
                      className="bg-white/5 hover:bg-white/10 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      Volver a empezar
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ALIANZAS Y SOCIOS */}
      <section id="aliados" className="py-20 bg-[#09101E] border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.25em] text-[#10B981] font-bold block mb-3">Aliados Estratégicos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Respaldados por instituciones líderes
            </h2>
            <p className="text-gray-400 mt-3 text-sm md:text-base">
              FLUX cuenta con el apoyo de organismos que impulsan la innovación, la tecnología y la formación profesional en Uruguay.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 items-center">

            {/* Uruguay Technology */}
            <div className="group bg-[#0E1728] hover:bg-[#111A2E] border border-white/5 hover:border-[#10B981]/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)]">
              <div className="h-28 flex items-center justify-center">
                <img
                  src="/partners-uruguay-technology.jpg"
                  alt="Uruguay Technology"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold group-hover:text-[#10B981] transition-colors">
                Uruguay Technology
              </p>
            </div>

            {/* INEFOP */}
            <div className="group bg-[#0E1728] hover:bg-[#111A2E] border border-white/5 hover:border-[#10B981]/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)]">
              <div className="h-28 flex items-center justify-center">
                <img
                  src="/partners-inefop.png"
                  alt="Logo INEFOP - Apoya 4"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold group-hover:text-[#10B981] transition-colors">
                INEFOP
              </p>
            </div>

            {/* Ingenio LATU */}
            <div className="group bg-[#0E1728] hover:bg-[#111A2E] border border-white/5 hover:border-[#10B981]/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)]">
              <div className="h-28 flex items-center justify-center">
                <img
                  src="/partners-ingenio-latu.png"
                  alt="Ingenio LATU"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold group-hover:text-[#10B981] transition-colors">
                Ingenio LATU
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#040810] border-t border-white/5 py-16 text-xs text-gray-500 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/FLUXLOGO.png" alt="FLUX Logo" className="h-7 w-auto object-contain" />
              </div>
              <p className="text-gray-400">
                Tu tiempo y tu capital, fluyendo a tu favor. La plataforma líder de optimización de ciclos de cobro B2B.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Navegación</p>
              <ul className="space-y-2">
                <li><a href="#vehiculo" className="hover:text-white transition-colors">¿Qué hacemos?</a></li>
                <li><a href="#motor" className="hover:text-white transition-colors">Nuestra Creencia</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Simulador En Vivo</a></li>
                <li><a href="#roi" className="hover:text-white transition-colors">Calculadora ROI</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</p>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Acuerdo de NDA Estándar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cumplimiento GDPR</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Soporte Corporativo</p>
              <p className="text-gray-400 leading-relaxed mb-2">
                ¿Tienes dudas técnicas sobre la integración con tu ERP personalizado?
              </p>
              <a href="mailto:soporte@flux.io" className="text-[#10B981] hover:underline font-bold block">
                soporte@flux.io
              </a>
            </div>

          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} FLUX Technologies Inc. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">Estatus del Servidor (99.99%)</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
