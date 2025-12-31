import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    CheckCircle,
    UploadCloud,
    FileSpreadsheet,
    Users,
    Building2,
    ArrowRight,
    Database,
    AlertCircle,
    ChevronRight,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// === CONFIGURATION ===
const DATA_TYPES = {
    'Facturas': {
        id: 'Facturas',
        icon: FileSpreadsheet,
        description: 'Importar documentos y saldos pendientes (inv_docs).',
        fields: [
            'id_interno',
            'fecha_emision',
            'fecha_vencimiento',
            'rut_ci',
            'razon_social_cliente',
            'tipo_documento',
            'serie_numero',
            'moneda',
            'subtotal',
            'iva',
            'total_documento',
            'saldo_pendiente',
            'estado',
            'dias_de_mora',
            'ultima_gestion',
            'monto_total',
            'Detalle',
            'Comentario'
        ]
    },
    'Contactos': {
        id: 'Contactos',
        icon: Users,
        description: 'Agenda de contactos y decisores (contactos).',
        fields: [
            'id_contacto_ext',
            'client_ref',
            'cliente',
            'nombre',
            'apellido',
            'cargo',
            'movil',
            'tel',
            'email',
            'rol_cod'
        ]
    },
    'Clientes': {
        id: 'Clientes',
        icon: Building2,
        description: 'Base maestra de clientes y límites (clientes_maestra).',
        fields: [
            'id_cliente',
            'rut_ci',
            'razon_social',
            'nombre_fantasia',
            'departamento',
            'direccion',
            'tel',
            'email_facturacion',
            'clasificacion',
            'status_riesgo',
            'estado_actual',
            'limite_de_credito',
            'plazo_pago_dias',
            'fecha_alta',
            'agente'
        ]
    }
};

// Simple Fuzzy Match Helper
const findBestMatch = (target, options) => {
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = normalize(target);

    // 1. Exact Match (normalized)
    const exact = options.find(opt => normalize(opt) === targetNorm);
    if (exact) return exact;

    // 2. Partial Includes
    const partial = options.find(opt => normalize(opt).includes(targetNorm) || targetNorm.includes(normalize(opt)));
    if (partial) return partial;

    return '';
};

export default function DataImportWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [dataType, setDataType] = useState(null);
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [parsedData, setParsedData] = useState([]);
    const [mapping, setMapping] = useState({});
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [results, setResults] = useState(null);

    // --- STEP 1: SELECTION ---
    const handleSelectType = (type) => {
        setDataType(type);
    };

    const nextStep = () => {
        if (step === 1 && dataType) setStep(2);
        if (step === 2 && file) processFile();
    };

    // --- STEP 2: UPLOAD ---
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (f) => {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const isValid = f && validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));

        if (isValid) {
            setFile(f);
        } else {
            alert('Por favor sube un archivo válido (.xlsx, .xls o .csv)');
        }
    };

    const processFile = async () => {
        setUploading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Extract Headers (Row 1)
                const headerData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const extractedHeaders = headerData[0] || [];

                // Extract Full Data (Array of Objects)
                const fullData = XLSX.utils.sheet_to_json(worksheet);

                if (extractedHeaders.length === 0) {
                    alert('El archivo parece estar vacío o sin encabezados.');
                    setUploading(false);
                    return;
                }

                setHeaders(extractedHeaders);
                setParsedData(fullData);

                // Pre-fill Mapping logic
                const initialMap = {};
                if (dataType && DATA_TYPES[dataType]) {
                    DATA_TYPES[dataType].fields.forEach(field => {
                        initialMap[field] = findBestMatch(field, extractedHeaders);
                    });
                }
                setMapping(initialMap);

                setUploading(false);
                setStep(3);
            } catch (error) {
                console.error("Error parsing file:", error);
                alert("Hubo un error al procesar el archivo.");
                setUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // --- STEP 3: MAPPING ---
    const handleMapChange = (internalField, fileHeader) => {
        setMapping(prev => ({ ...prev, [internalField]: fileHeader }));
    };

    const handleFinalize = async () => {
        setUploading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        try {
            const payload = {
                type: dataType, // 'Facturas', 'Contactos', 'Clientes'
                data: parsedData,
                mapping: mapping
            };

            const session = await supabase.auth.getSession();
            const token = session?.data?.session?.access_token;

            const res = await fetch(`${API_URL}/api/import/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Error en el servidor al procesar.');

            const json = await res.json();
            setResults(json.stats);
            setUploading(false);
            setSuccess(true);
            setStep(4); // Move to results step (conceptually)

        } catch (err) {
            console.error("Import Error:", err);
            alert("Error al importar datos: " + err.message);
            setUploading(false);
        }
    };

    // --- RENDER HELPERS ---
    const StepIndicator = () => (
        <div className="flex justify-center items-center gap-4 mb-10 w-full max-w-2xl mx-auto">
            {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                    <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                        step > s ? "bg-accent border-accent text-sidebar" :
                            step === s ? "bg-accent/20 border-accent text-accent" :
                                "bg-white/5 border-white/10 text-text-muted"
                    )}>
                        {step > s ? <CheckCircle size={18} /> : s}
                    </div>
                    {/* Line Connector */}
                    {s < 3 && (
                        <div className={clsx(
                            "h-0.5 flex-1 transition-colors duration-300 rounded-full",
                            step > s ? "bg-accent" : "bg-white/10"
                        )} style={{ maxWidth: '100px' }}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    // --- MAIN VIEW ---
    if (success && results) {
        const total = results.new + results.updated + results.duplicates + results.errors;
        const getPct = (val) => total > 0 ? (val / total) * 100 : 0;

        return (
            <div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-300 max-w-4xl mx-auto w-full">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Proceso Completado</h2>
                <p className="text-text-muted mb-8 text-center max-w-lg">
                    Se han procesado {total} registros de <strong>{dataType}</strong>.
                    Aquí tienes el resumen de la operación.
                </p>

                {/* VISUAL REPORT */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
                    {/* NEW - Green */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                        <div className="text-green-400 font-bold text-3xl mb-1">{results.new}</div>
                        <div className="text-xs uppercase font-bold text-text-muted tracking-wider">Nuevos</div>
                        <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${getPct(results.new)}%` }}></div>
                        </div>
                    </div>

                    {/* UPDATED - Blue */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                        <div className="text-blue-400 font-bold text-3xl mb-1">{results.updated}</div>
                        <div className="text-xs uppercase font-bold text-text-muted tracking-wider">Actualizados</div>
                        <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${getPct(results.updated)}%` }}></div>
                        </div>
                    </div>

                    {/* DUPLICATES - Yellow/Orange */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                        <div className="text-orange-400 font-bold text-3xl mb-1">{results.duplicates}</div>
                        <div className="text-xs uppercase font-bold text-text-muted tracking-wider">Duplicados</div>
                        <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${getPct(results.duplicates)}%` }}></div>
                        </div>
                    </div>

                    {/* ERRORS - Red */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                        <div className="text-red-400 font-bold text-3xl mb-1">{results.errors}</div>
                        <div className="text-xs uppercase font-bold text-text-muted tracking-wider">Errores/Ignorados</div>
                        <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${getPct(results.errors)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* GRAPH VISUALIZATION (Simple Stacked Bar) */}
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex mb-8">
                    {results.new > 0 && <div className="h-full bg-green-500" style={{ width: `${getPct(results.new)}%` }} title="Nuevos"></div>}
                    {results.updated > 0 && <div className="h-full bg-blue-500" style={{ width: `${getPct(results.updated)}%` }} title="Actualizados"></div>}
                    {results.duplicates > 0 && <div className="h-full bg-orange-500" style={{ width: `${getPct(results.duplicates)}%` }} title="Duplicados"></div>}
                    {results.errors > 0 && <div className="h-full bg-red-500" style={{ width: `${getPct(results.errors)}%` }} title="Errores"></div>}
                </div>


                <div className="flex gap-4">
                    <button
                        onClick={() => { setSuccess(false); setStep(1); setDataType(null); setFile(null); setResults(null); }}
                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors border border-white/5"
                    >
                        Nueva Importación
                    </button>
                    <button
                        onClick={() => navigate('/tablero-gestion')}
                        className="px-6 py-3 rounded-xl bg-accent text-sidebar font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                    >
                        Ir al Tablero
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col">
            {/* HEADER */}
            <div className="mb-6 md:mb-8 text-center shrink-0">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2 flex items-center justify-center gap-3">
                    <Database className="text-accent" /> Asistente de Importación
                </h1>
                <p className="text-sm md:text-base text-text-muted">Mapea y carga tus datos en 3 sencillos pasos.</p>
            </div>

            <StepIndicator />

            {/* CONTENT AREA */}
            <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">

                {/* STEP 1: SELECTION */}
                {step === 1 && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto custom-scrollbar p-1">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 text-center">Selecciona el tipo de datos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 shrink-0">
                            {Object.values(DATA_TYPES).map((type) => {
                                const Icon = type.icon;
                                const isSelected = dataType === type.id;
                                return (
                                    <div
                                        key={type.id}
                                        onClick={() => handleSelectType(type.id)}
                                        className={clsx(
                                            "p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 group relative overflow-hidden",
                                            isSelected
                                                ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-xl"
                                                : "border-white/5 bg-sidebar hover:border-white/10 hover:bg-white/5"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition-colors",
                                            isSelected ? "bg-accent text-sidebar" : "bg-white/5 text-text-muted group-hover:text-white"
                                        )}>
                                            <Icon size={20} className="md:w-6 md:h-6" />
                                        </div>
                                        <h4 className={clsx("text-base md:text-lg font-bold mb-1 md:mb-2", isSelected ? "text-accent" : "text-white")}>
                                            {type.id}
                                        </h4>
                                        <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                                            {type.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end mt-auto pt-4 border-t border-white/5 sticky bottom-0 bg-sidebar/95 backdrop-blur py-2">
                            <button
                                disabled={!dataType}
                                onClick={nextStep}
                                className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-accent text-sidebar font-bold rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 text-sm md:text-base"
                            >
                                Siguiente <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: UPLOAD */}
                {step === 2 && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto custom-scrollbar p-1">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 text-center">Carga tu archivo (.xlsx / .csv)</h3>

                        <div
                            onDrop={handleFileDrop}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            className={clsx(
                                "flex-1 min-h-[200px] border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center p-6 md:p-10 cursor-pointer relative group shrink-0",
                                isDragging
                                    ? "border-accent bg-accent/10 scale-[1.02] shadow-xl shadow-accent/20"
                                    : "border-white/10 bg-white/2 hover:bg-white/5 hover:border-accent/50"
                            )}
                        >
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                accept=".xlsx, .xls, .csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />

                            {file ? (
                                <div className="text-center animate-in zoom-in duration-200 pointer-events-none">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileSpreadsheet size={32} className="md:w-10 md:h-10" />
                                    </div>
                                    <p className="text-lg md:text-xl font-bold text-white mb-1 break-all px-4">{file.name}</p>
                                    <p className="text-xs md:text-sm text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                                    <button className="mt-4 text-xs font-bold text-red-400 hover:text-red-300 z-20 relative pointer-events-auto" onClick={(e) => {
                                        e.preventDefault();
                                        setFile(null);
                                    }}>
                                        Eliminar archivo
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center group-hover:scale-105 transition-transform duration-200 flex flex-col items-center pointer-events-none">
                                    <div className={clsx(
                                        "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 border transition-colors",
                                        isDragging
                                            ? "bg-accent text-sidebar border-accent"
                                            : "bg-accent/10 text-accent border-accent/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                    )}>
                                        <UploadCloud size={32} className="md:w-10 md:h-10" />
                                    </div>
                                    <p className="text-base md:text-lg font-bold text-white mb-2">
                                        {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo aquí'}
                                    </p>
                                    <span className="mb-4 text-xs md:text-sm text-text-muted">o</span>
                                    <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-medium group-hover:bg-white/10 transition-colors">
                                        Buscar en mi equipo
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-6 md:mt-8 pt-4 border-t border-white/5 sticky bottom-0 bg-sidebar/95 backdrop-blur py-2">
                            <button
                                onClick={() => setStep(1)}
                                className="text-text-muted hover:text-white font-bold px-4 transition-colors text-sm md:text-base"
                            >
                                Atrás
                            </button>
                            <button
                                disabled={!file || uploading}
                                onClick={processFile}
                                className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-accent text-sidebar font-bold rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 text-sm md:text-base"
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : 'Procesar Archivo'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: MAPPING */}
                {step === 3 && (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Confirma el Mapeo</h3>
                                <p className="text-sm text-text-muted mt-1">Asocia las columnas de tu archivo con los campos del sistema.</p>
                            </div>
                            <span className="text-xs font-mono bg-white/5 border border-white/10 px-2 py-1 rounded text-text-muted">
                                Archivo: {file?.name}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-white/10 rounded-xl bg-sidebar/50">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 text-xs uppercase font-bold text-text-muted sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4 border-b border-white/10 w-1/3">Campo del Sistema</th>
                                        <th className="p-4 border-b border-white/10 text-center"><ArrowRight size={14} /></th>
                                        <th className="p-4 border-b border-white/10 w-1/2">Columna en Archivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {DATA_TYPES[dataType].fields.map((field) => (
                                        <tr key={field} className="hover:bg-white/2 transition-colors">
                                            <td className="p-4 text-sm font-medium text-white">
                                                {field}
                                                {['RUT', 'Total', 'Email'].some(r => field.includes(r)) && <span className="text-red-400 ml-1">*</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                <ChevronRight size={16} className="text-white/20 inline-block" />
                                            </td>
                                            <td className="p-4">
                                                <div className="relative">
                                                    <select
                                                        value={mapping[field] || ''}
                                                        onChange={(e) => handleMapChange(field, e.target.value)}
                                                        className={clsx(
                                                            "w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all appearance-none cursor-pointer",
                                                            mapping[field] ? "border-accent/50 text-white" : "border-white/10 text-text-muted"
                                                        )}
                                                    >
                                                        <option value="">-- Ignorar --</option>
                                                        {headers.map(h => (
                                                            <option key={h} value={h}>{h}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        {mapping[field] ? <CheckCircle size={14} className="text-accent" /> : <AlertCircle size={14} className="text-white/20" />}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between mt-8 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setStep(2)}
                                className="text-text-muted hover:text-white font-bold px-4 transition-colors"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleFinalize}
                                disabled={uploading}
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 disabled:opacity-50 transition-all shadow-lg shadow-green-600/20"
                            >
                                {uploading ? <Loader2 className="animate-spin" /> : 'Finalizar Importación'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
