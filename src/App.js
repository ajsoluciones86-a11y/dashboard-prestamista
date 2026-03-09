import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { 
  Home, Users, Mail, Briefcase, Lock, Settings, Bell, Search, 
  ChevronDown, RefreshCcw, Clock, PieChart, DollarSign, TrendingUp, 
  BarChart2, Activity, X, Download, Check, Upload, FileText, CreditCard, Edit2, Eye, Cloud, Calculator, Menu
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';

// ============================================================================
// 1. CONFIGURACIÓN DE FIREBASE
// ============================================================================
const manualFirebaseConfig = {
  apiKey: "AIzaSyCz4997ZuPpvyaFee37fFeUn9SUE8QG7hQ",
  authDomain: "sistema-prestamos-43b76.firebaseapp.com",
  projectId: "sistema-prestamos-43b76",
  storageBucket: "sistema-prestamos-43b76.firebasestorage.app",
  messagingSenderId: "530325274830",
  appId: "1:530325274830:web:b94b09a171916b2722509f",
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : manualFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const getCollectionRef = (user, colName) => {
  if (typeof __app_id !== 'undefined') {
    if (!user) return null;
    return collection(db, 'artifacts', __app_id, 'users', user.uid, colName);
  }
  return collection(db, colName); 
};

const getDocRef = (user, colName, docId) => {
  if (typeof __app_id !== 'undefined') {
    if (!user) return null;
    return doc(db, 'artifacts', __app_id, 'users', user.uid, colName, docId);
  }
  return doc(db, colName, docId);
};

const getConfigRef = (user) => {
  if (typeof __app_id !== 'undefined') {
    if (!user) return null;
    return doc(db, 'artifacts', __app_id, 'users', user.uid, 'config', 'general');
  }
  return doc(db, 'config', 'general');
};

// Función auxiliar para sumar 1 mes seguro
const getFechaUnMesDespues = (fechaStr) => {
  if (!fechaStr) return '';
  const d = new Date(fechaStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
};

// Lógica Global de Estado de Préstamos
const getEstadoPrestamo = (prestamo) => {
  const saldoActual = parseFloat(prestamo.saldo !== undefined ? prestamo.saldo : prestamo.monto);
  if (saldoActual <= 0) return 'Pagado';

  let fechaVencimiento;
  if (prestamo.proximaFechaPago) {
    fechaVencimiento = new Date(prestamo.proximaFechaPago + 'T00:00:00');
  } else if (prestamo.fecha) {
    fechaVencimiento = new Date(prestamo.fecha + 'T00:00:00');
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
  } else {
    return 'Al día';
  }

  if (isNaN(fechaVencimiento.getTime())) return 'Al día';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffTime = fechaVencimiento.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Vencido'; 
  if (diffDays <= 3) return 'Por vencer'; 
  return 'Al día'; 
};

const UserContext = createContext(null);

// ============================================================================
// APP PRINCIPAL
// ============================================================================
export default function App() {
  const [currentView, setCurrentView] = useState('inicio');
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error Auth:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen bg-slate-100 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#316cb6]">
          <RefreshCcw size={32} className="animate-spin" />
          <p className="font-semibold">Conectando a la Base de Datos...</p>
        </div>
      </div>
    );
  }

  const navigateTo = (view) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false); 
  };

  return (
    <UserContext.Provider value={user}>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-800 flex-col md:flex-row overflow-hidden">
        
        {/* Cabecera Móvil */}
        <div className="md:hidden bg-[#316cb6] text-white p-4 flex items-center justify-between shadow-md z-20">
          <div className="font-bold flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#316cb6]">
              <Activity size={14} strokeWidth={3} />
            </div>
            A&J Soluciones
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 hover:bg-[#295c9e] rounded transition-colors">
            <Menu size={24} />
          </button>
        </div>

        {/* Overlay oscuro para móvil cuando el menú está abierto */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:static inset-y-0 left-0 w-[240px] md:w-[220px] bg-[#316cb6] text-white flex flex-col shadow-2xl md:shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 flex items-center gap-3 border-b border-[#407ac2]">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#316cb6] flex-shrink-0 shadow-sm">
               <Activity size={18} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] tracking-wide leading-tight">A&J Soluciones</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider font-medium">Panel de Control</span>
            </div>
            <button className="md:hidden ml-auto text-blue-200 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 py-4 overflow-y-auto">
            <SidebarItem icon={<Home size={18} />} label="Inicio" isActive={currentView === 'inicio'} onClick={() => navigateTo('inicio')} />
            <SidebarItem icon={<Users size={18} />} label="Clientes" isActive={currentView === 'clientes'} onClick={() => navigateTo('clientes')} />
            <SidebarItem icon={<Mail size={18} />} label="Préstamos" isActive={currentView === 'prestamos'} onClick={() => navigateTo('prestamos')} />
            <SidebarItem icon={<CreditCard size={18} />} label="Pagos" isActive={currentView === 'pagos'} onClick={() => navigateTo('pagos')} />
            <SidebarItem icon={<Briefcase size={18} />} label="Inversionistas" isActive={currentView === 'inversionistas'} onClick={() => navigateTo('inversionistas')} />
            <SidebarItem icon={<Lock size={18} />} label="Reportes" isActive={currentView === 'reportes'} onClick={() => navigateTo('reportes')} />
            <SidebarItem icon={<Calculator size={18} />} label="SUNAT" isActive={currentView === 'sunat'} onClick={() => navigateTo('sunat')} />
          </nav>

          <div className="p-4 border-t border-[#407ac2]">
            <div className="flex items-center gap-2 cursor-pointer text-blue-200 hover:text-white transition-colors">
              <Settings size={18} />
              <div className="flex flex-col gap-1 ml-1">
                 <div className="w-6 h-1 bg-[#5b8ed4] rounded-full"></div>
                 <div className="w-10 h-1 bg-[#5b8ed4] rounded-full"></div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto relative">
          <div className="p-4 sm:p-6 md:p-8 max-w-full lg:max-w-5xl mx-auto pb-20">
            {currentView === 'inicio' && <DashboardPrincipal />}
            {currentView === 'clientes' && <ListadoClientes />}
            {currentView === 'prestamos' && <ListadoPrestamos />}
            {currentView === 'inversionistas' && <ListadoInversionistas />}
            {currentView === 'pagos' && <Pagos />}
            {currentView === 'reportes' && <Reportes />}
            {currentView === 'sunat' && <ReporteSunat />}
          </div>
        </main>
      </div>
    </UserContext.Provider>
  );
}

function SidebarItem({ icon, label, isActive, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
        isActive ? 'bg-[#295c9e] border-l-4 border-white' : 'hover:bg-[#3876c4] border-l-4 border-transparent'
      }`}
    >
      <span className={isActive ? 'text-white' : 'text-blue-100'}>{icon}</span>
      <span className={`text-sm ${isActive ? 'font-medium text-white' : 'text-blue-100'}`}>{label}</span>
    </div>
  );
}

// ============================================================================
// VISTAS
// ============================================================================

function DashboardPrincipal() {
  const user = useContext(UserContext);
  
  const [capitalPropio, setCapitalPropio] = useState(0);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState('');
  const [capitalInversionistas, setCapitalInversionistas] = useState(0);
  const [capitalPrestado, setCapitalPrestado] = useState(0);
  const [prestamosDb, setPrestamosDb] = useState([]);
  const [interesesACobrar, setInteresesACobrar] = useState(0);
  const [gananciaMes, setGananciaMes] = useState(0);
  const [clientesNuevos, setClientesNuevos] = useState(0);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  useEffect(() => {
    const confRef = getConfigRef(user);
    const invRef = getCollectionRef(user, 'inversionistas');
    const presRef = getCollectionRef(user, 'prestamos');
    const cliRef = getCollectionRef(user, 'clientes');
    const pagRef = getCollectionRef(user, 'pagos');

    if (!confRef || !invRef || !presRef || !cliRef || !pagRef) return;

    const unsubConfig = onSnapshot(confRef, (docSnap) => {
      if (docSnap.exists()) {
        setCapitalPropio(parseFloat(docSnap.data().capitalPropio || 0));
        setCapitalInput(docSnap.data().capitalPropio || '');
      }
    });

    const unsubInv = onSnapshot(invRef, (snap) => {
      setCapitalInversionistas(snap.docs.reduce((sum, doc) => sum + parseFloat(doc.data().monto || 0), 0));
    });

    const unsubPres = onSnapshot(presRef, (snap) => {
      const data = snap.docs.map(doc => doc.data());
      setPrestamosDb(data);
      setCapitalPrestado(data.reduce((sum, d) => sum + parseFloat(d.saldo !== undefined ? d.saldo : d.monto || 0), 0));
      setInteresesACobrar(data.reduce((sum, d) => {
        const saldo = parseFloat(d.saldo !== undefined ? d.saldo : d.monto || 0);
        return sum + (saldo * (parseFloat(d.tasa || 0) / 100));
      }, 0));
    });

    const unsubClientes = onSnapshot(cliRef, (snap) => setClientesNuevos(snap.docs.length));

    const unsubPagos = onSnapshot(pagRef, (snap) => {
      const data = snap.docs.map(doc => doc.data());
      setGananciaMes(data.reduce((sum, d) => {
        if (d.concepto === 'Interés' || d.concepto === 'Ambos (Interés + Amortización)') {
            const gananciaBruta = parseFloat(d.interesCobrado || d.montoPagado || 0);
            const gananciaInversor = parseFloat(d.interesInversionistas || 0);
            return sum + Math.max(0, gananciaBruta - gananciaInversor); 
        }
        return sum;
      }, 0));
    });

    return () => { unsubConfig(); unsubInv(); unsubPres(); unsubClientes(); unsubPagos(); };
  }, [user]);

  const handleSaveCapital = async () => {
    setIsEditingCapital(false);
    const val = parseFloat(capitalInput) || 0;
    const confRef = getConfigRef(user);
    if(!confRef) return;
    await setDoc(confRef, { capitalPropio: val }, { merge: true });
  };

  const capitalDisponible = capitalPropio + capitalInversionistas - capitalPrestado;
  const prestamosActivos = prestamosDb.filter(p => parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0).length;
  const cuotasVencidas = prestamosDb.filter(p => getEstadoPrestamo(p) === 'Vencido').length;

  return (
    <div className="w-full lg:max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard Principal</h1>
        <div className="flex items-center gap-1 text-slate-500 text-sm bg-white px-3 py-1.5 rounded-full shadow-sm"><Bell size={16} /><span className="ml-1 hidden sm:inline">Panel Activo</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="bg-[#46ca6e] rounded-lg shadow-sm p-5 text-white relative overflow-hidden flex flex-col justify-center min-h-[110px]">
          <div className="relative z-10">
            <div className="text-xs sm:text-sm font-medium mb-1 opacity-90 flex items-center gap-1">
              Capital Propio 
              {!isEditingCapital && <Edit2 size={14} className="cursor-pointer hover:opacity-70 ml-1" onClick={() => { setIsEditingCapital(true); setCapitalInput(capitalPropio); }} />}
            </div>
            <div className="text-2xl sm:text-3xl font-bold flex items-center gap-1">
              <span className="text-lg opacity-80">S/</span> 
              {isEditingCapital ? (
                <input type="number" value={capitalInput} onChange={(e) => setCapitalInput(e.target.value)} onBlur={handleSaveCapital} onKeyDown={(e) => e.key === 'Enter' && handleSaveCapital()} autoFocus className="bg-white text-slate-800 text-lg sm:text-xl p-1 rounded w-32 outline-none"/>
              ) : (
                <span onClick={() => setIsEditingCapital(true)} className="cursor-pointer">{formatCurrency(capitalPropio)}</span>
              )}
            </div>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 opacity-20" size={80} />
        </div>
        
        <div className="bg-[#2f78d4] rounded-lg shadow-sm p-5 text-white relative overflow-hidden flex flex-col justify-center min-h-[110px]">
          <div className="relative z-10">
            <div className="text-xs sm:text-sm font-medium mb-1 opacity-90">Capital Inversionistas</div>
            <div className="text-2xl sm:text-3xl font-bold"><span className="text-lg opacity-80">S/</span> {formatCurrency(capitalInversionistas)}</div>
          </div>
          <BarChart2 className="absolute right-0 bottom-0 opacity-20" size={70} />
        </div>
        
        <div className="bg-[#f24e4e] rounded-lg shadow-sm p-5 text-white relative overflow-hidden flex flex-col justify-center min-h-[110px]">
          <div className="relative z-10">
            <div className="text-xs sm:text-sm font-medium mb-1 opacity-90">Capital Prestado (Activo)</div>
            <div className="text-2xl sm:text-3xl font-bold"><span className="text-lg opacity-80">S/</span> {formatCurrency(capitalPrestado)}</div>
          </div>
          <Activity className="absolute -right-4 -bottom-4 opacity-20" size={80} />
        </div>
        
        <div className="bg-[#f69d35] rounded-lg shadow-sm p-5 text-white relative overflow-hidden flex flex-col justify-center min-h-[110px]">
          <div className="relative z-10">
            <div className="text-xs sm:text-sm font-medium mb-1 opacity-90">Disponible</div>
            <div className="text-2xl sm:text-3xl font-bold"><span className="text-lg opacity-80">S/</span> {formatCurrency(capitalDisponible)}</div>
          </div>
          <BarChart2 className="absolute right-0 -bottom-2 opacity-20" size={75} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><RefreshCcw size={20} /></div>
          <div className="leading-tight">
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Activos</div>
            <div className="text-lg sm:text-xl font-bold text-slate-800">{prestamosActivos}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-full"><Clock size={20} /></div>
          <div className="leading-tight">
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Vencidos</div>
            <div className="text-lg sm:text-xl font-bold text-slate-800">{cuotasVencidas}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><PieChart size={20} /></div>
          <div className="leading-tight">
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Por Cobrar</div>
            <div className="text-sm sm:text-base font-bold text-slate-800">S/ {formatCurrency(interesesACobrar)}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center text-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-full"><DollarSign size={20} /></div>
          <div className="leading-tight">
            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">Ganancia Mes Neta</div>
            <div className="text-sm sm:text-base font-bold text-slate-800">S/ {formatCurrency(gananciaMes)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-700 bg-slate-50">Resumen General</div>
        <div className="p-5 flex flex-col gap-4 text-sm sm:text-base text-slate-600">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span>Total Prestado (Actual)</span>
            <span className="font-semibold text-slate-800">S/ {formatCurrency(capitalPrestado)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span>Total Cobrado (Ganancia Neta)</span>
            <span className="font-semibold text-slate-800 text-emerald-600">S/ {formatCurrency(gananciaMes)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span>Intereses Totales Por Cobrar</span>
            <span className="font-semibold text-slate-800 text-amber-600">S/ {formatCurrency(interesesACobrar)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Clientes Registrados</span>
            <span className="font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full text-xs">{clientesNuevos}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListadoClientes() {
  const user = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [clients, setClients] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  const [form, setForm] = useState({
    nombre: '', dni: '', telefono: '', direccion: '', banco: '', cuenta: ''
  });

  useEffect(() => {
    const cliRef = getCollectionRef(user, 'clientes');
    const presRef = getCollectionRef(user, 'prestamos');
    if(!cliRef || !presRef) return;

    const unsubC = onSnapshot(cliRef, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubP = onSnapshot(presRef, (snapshot) => {
      setPrestamos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => { unsubC(); unsubP(); };
  }, [user]);

  const handleGuardarCliente = async () => {
    if (!form.nombre || !form.telefono) return alert('Nombre y teléfono son obligatorios');
    setIsSaving(true);
    try {
      if (editingClientId) {
        const docRef = getDocRef(user, 'clientes', editingClientId);
        await updateDoc(docRef, { ...form });
      } else {
        const cliRef = getCollectionRef(user, 'clientes');
        await addDoc(cliRef, { ...form, createdAt: serverTimestamp() });
      }
      closeModal();
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClientId(null);
    setForm({ nombre: '', dni: '', telefono: '', direccion: '', banco: '', cuenta: '' });
  };

  const openNewClient = () => {
    setForm({ nombre: '', dni: '', telefono: '', direccion: '', banco: '', cuenta: '' });
    setEditingClientId(null);
    setIsModalOpen(true);
  };

  const openEditClient = (client) => {
    setForm({
      nombre: client.nombre || '', dni: client.dni || '', telefono: client.telefono || '', 
      direccion: client.direccion || '', banco: client.banco || '', cuenta: client.cuenta || ''
    });
    setEditingClientId(client.id);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(client => 
    (client.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.dni || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (String(client.telefono) || '').includes(searchTerm)
  );

  const getClientLoans = (clientId) => prestamos.filter(p => p.clienteId === clientId);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Listado de Clientes</h1>
        <button onClick={openNewClient} className="bg-[#3173c6] hover:bg-[#2860a8] text-white text-sm px-4 py-2.5 rounded shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto">
          <span>+</span> Nuevo Cliente
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, DNI o teléfono..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm sm:text-base focus:outline-none focus:border-blue-400 shadow-sm bg-white" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6">Nombre</th>
                <th className="py-3.5 px-4 sm:px-6">DNI</th>
                <th className="py-3.5 px-4 sm:px-6">Teléfono</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Préstamos Activos</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const activeLoansCount = getClientLoans(client.id).filter(p => parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0).length;
                  return (
                    <tr key={client.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 text-slate-700 font-medium">{client.nombre}</td>
                      <td className="py-3 px-4 sm:px-6 text-slate-500">{client.dni || '-'}</td>
                      <td className="py-3 px-4 sm:px-6 text-slate-600">{client.telefono}</td>
                      <td className="py-3 px-4 sm:px-6 text-center">
                        <span className="bg-slate-100 text-slate-700 py-1 px-3 rounded-full text-xs font-semibold">{activeLoansCount}</span>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEditClient(client)} className="bg-white text-slate-600 border border-slate-300 text-xs px-3 py-1.5 rounded hover:bg-slate-50 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => { setSelectedClient(client); setIsViewModalOpen(true); }} className="bg-[#3173c6] text-white text-xs px-3 py-1.5 rounded hover:bg-[#2860a8] shadow-sm transition-colors">
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="5" className="py-10 text-center text-slate-500">No se encontraron clientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo/Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingClientId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo</label>
                <input type="text" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] transition-shadow bg-slate-50 focus:bg-white" placeholder="Ej. Juan Pérez" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">DNI</label>
                  <input type="text" value={form.dni} onChange={e=>setForm({...form, dni: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] transition-shadow bg-slate-50 focus:bg-white" placeholder="Ej. 12345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={e=>setForm({...form, telefono: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] transition-shadow bg-slate-50 focus:bg-white" placeholder="Ej. 987 654 321" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
                <input type="text" value={form.direccion} onChange={e=>setForm({...form, direccion: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] transition-shadow bg-slate-50 focus:bg-white" placeholder="Ej. Av. Principal 123, Ciudad" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Banco</label>
                  <div className="relative">
                    <select value={form.banco} onChange={e=>setForm({...form, banco: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] appearance-none transition-shadow bg-slate-50 focus:bg-white">
                      <option value="">Seleccione...</option><option>BCP</option><option>Interbank</option><option>BBVA</option><option>Scotiabank</option><option>BanBif</option><option>Otro</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nro. de Cuenta</label>
                  <input type="text" value={form.cuenta} onChange={e=>setForm({...form, cuenta: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] transition-shadow bg-slate-50 focus:bg-white" placeholder="Ej. 191-1234567-0-00" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white sm:bg-slate-50">
              <button onClick={closeModal} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 sm:border-transparent">Cancelar</button>
              <button onClick={handleGuardarCliente} disabled={isSaving} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : editingClientId ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 truncate pr-2">Detalles - {selectedClient.nombre}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors flex-shrink-0"><X size={20} /></button>
            </div>
            
            <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto bg-slate-50/50">
              {(() => {
                const clientLoans = getClientLoans(selectedClient.id);
                const activeLoansCount = clientLoans.filter(p => parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0).length;
                return (
                  <>
                    <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Préstamos Activos</p>
                        <p className="font-bold text-slate-800 text-2xl">{activeLoansCount}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Saldo Deudor Total</p>
                        <p className="font-bold text-[#3173c6] text-2xl">
                          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
                            clientLoans.reduce((acc, loan) => acc + parseFloat(loan.saldo !== undefined ? loan.saldo : loan.monto || 0), 0)
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {clientLoans.length === 0 ? (
                        <p className="text-center text-slate-500 py-8 bg-white rounded-xl border border-slate-200">Este cliente no tiene préstamos registrados.</p>
                      ) : (
                        clientLoans.map((loan) => {
                          const estado = getEstadoPrestamo(loan);
                          return (
                            <div key={loan.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex flex-wrap gap-2 justify-between items-center mb-4 pb-3 border-b border-slate-100">
                                <h3 className="font-bold text-[#3173c6] flex items-center gap-1.5"><Briefcase size={16}/> ID: {loan.id.slice(0,6)}</h3>
                                <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold uppercase tracking-wide
                                  ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 
                                    estado === 'Vencido' ? 'bg-rose-100 text-rose-800' : 
                                    'bg-amber-100 text-amber-800'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full 
                                    ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-600' : 
                                      estado === 'Vencido' ? 'bg-rose-600' : 
                                      'bg-amber-600'}`}></span>
                                  {estado}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-5 gap-x-4">
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Fecha Inicio</p>
                                  <p className="text-sm font-semibold text-slate-700">{loan.fecha || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Monto Orig.</p>
                                  <p className="text-sm font-semibold text-slate-700">S/ {loan.monto}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Saldo Actual</p>
                                  <p className="text-sm font-bold text-rose-600">S/ {loan.saldo !== undefined ? loan.saldo : loan.monto}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Interés Mes</p>
                                  <p className="text-sm font-semibold text-slate-700">{loan.tasa}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Próximo Pago</p>
                                  <p className="text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block">{loan.proximaFechaPago || getFechaUnMesDespues(loan.fecha)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end bg-white sm:bg-slate-50">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-8 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListadoPrestamos() {
  const user = useContext(UserContext);
  
  const [clientsDb, setClientsDb] = useState([]);
  const [investorsDb, setInvestorsDb] = useState([]);
  const [prestamosDb, setPrestamosDb] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isViewLoanModalOpen, setIsViewLoanModalOpen] = useState(false);
  const [selectedLoanView, setSelectedLoanView] = useState(null);

  const [form, setForm] = useState({
    fecha: '', clienteId: '', monto: '', tasa: '', cuotas: '12'
  });
  
  const [financingSources, setFinancingSources] = useState(['propio']);
  const [isCuotaFija, setIsCuotaFija] = useState(true);
  const [montoCuota, setMontoCuota] = useState('');
  
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [bankAmounts, setBankAmounts] = useState({});
  const [bankVouchers, setBankVouchers] = useState({});
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const availableBanks = ['Efectivo', 'BCP', 'Interbank', 'BBVA', 'Scotiabank', 'BanBif', 'Yape / Plin', 'Otro'];

  const [selectedInvestors, setSelectedInvestors] = useState([]);
  const [investorAmounts, setInvestorAmounts] = useState({});
  const [isInvestorDropdownOpen, setIsInvestorDropdownOpen] = useState(false);

  const [documentStatus, setDocumentStatus] = useState('No Firmado');
  const [documentFile, setDocumentFile] = useState(null);
  const [comments, setComments] = useState('');

  const [previewModal, setPreviewModal] = useState({ isOpen: false, name: '', data: null });

  useEffect(() => {
    const cliRef = getCollectionRef(user, 'clientes');
    const invRef = getCollectionRef(user, 'inversionistas');
    const presRef = getCollectionRef(user, 'prestamos');
    if(!cliRef || !invRef || !presRef) return;

    const unsubC = onSnapshot(cliRef, (snap) => setClientsDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubI = onSnapshot(invRef, (snap) => setInvestorsDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubP = onSnapshot(presRef, (snap) => setPrestamosDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { unsubC(); unsubI(); unsubP(); };
  }, [user]);

  const toggleFinancingSource = (source) => {
    if (financingSources.includes(source)) {
      setFinancingSources(financingSources.filter(s => s !== source));
    } else {
      setFinancingSources([...financingSources, source]);
    }
  };

  const toggleBank = (bank) => {
    if (selectedBanks.includes(bank)) {
      setSelectedBanks(selectedBanks.filter(b => b !== bank));
      const newAmounts = { ...bankAmounts }; delete newAmounts[bank]; setBankAmounts(newAmounts);
      const newVouchers = { ...bankVouchers }; delete newVouchers[bank]; setBankVouchers(newVouchers);
    } else {
      setSelectedBanks([...selectedBanks, bank]);
    }
  };

  const toggleInvestor = (invId) => {
    if (selectedInvestors.includes(invId)) {
      setSelectedInvestors(selectedInvestors.filter(i => i !== invId));
      const newAmounts = { ...investorAmounts }; delete newAmounts[invId]; setInvestorAmounts(newAmounts);
    } else {
      setSelectedInvestors([...selectedInvestors, invId]);
    }
  };

  const handleBankAmountChange = (bank, amount) => setBankAmounts({ ...bankAmounts, [bank]: amount });
  const handleAmountChange = (investor, amount) => setInvestorAmounts({ ...investorAmounts, [investor]: amount });
  
  const handleBankVoucherUpload = (bank, e) => { 
    const file = e.target.files[0]; 
    if (!file) return;
    if (file.size > 800000) return alert('El archivo es demasiado grande (máx 800KB).'); 
    const reader = new FileReader();
    reader.onloadend = () => {
      setBankVouchers(prev => ({ ...prev, [bank]: { name: file.name, data: reader.result } })); 
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return;
    if (file.size > 800000) return alert('El archivo es demasiado grande (máx 800KB).'); 
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentFile({ name: file.name, data: reader.result }); 
    };
    reader.readAsDataURL(file);
  };

  const openPreview = (name, data) => {
    setPreviewModal({ isOpen: true, name, data });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLoanId(null);
    setForm({fecha: '', clienteId: '', monto: '', tasa: '', cuotas: '12'});
    setFinancingSources(['propio']); setIsCuotaFija(true); setMontoCuota('');
    setBankAmounts({}); setBankVouchers({}); setSelectedBanks([]);
    setInvestorAmounts({}); setSelectedInvestors([]);
    setComments(''); setDocumentStatus('No Firmado'); setDocumentFile(null);
  };

  const openNewLoan = () => {
    closeModal(); 
    setIsModalOpen(true);
  };

  const openEditLoan = (loan) => {
    setForm({
      fecha: loan.fecha || '', clienteId: loan.clienteId || '', monto: loan.monto || '', tasa: loan.tasa || '', cuotas: loan.cuotas || '12'
    });
    setFinancingSources(loan.financingSources || ['propio']);
    setIsCuotaFija(loan.isCuotaFija !== undefined ? loan.isCuotaFija : true);
    setMontoCuota(loan.montoCuota || '');
    setSelectedBanks(loan.selectedBanks || []);
    setBankAmounts(loan.bankAmounts || {});
    setBankVouchers(loan.bankVouchers || {});
    setSelectedInvestors(loan.selectedInvestors || []);
    setInvestorAmounts(loan.investorAmounts || {});
    setDocumentStatus(loan.documentStatus || 'No Firmado');
    setDocumentFile(loan.documentFile || null);
    setComments(loan.comments || '');
    
    setEditingLoanId(loan.id);
    setIsModalOpen(true);
  };

  const handleGuardarPrestamo = async () => {
    if (!form.clienteId || !form.monto || !form.fecha) return alert("Seleccione cliente, fecha y monto");
    setIsSaving(true);
    try {
      const clienteData = clientsDb.find(c => c.id === form.clienteId);
      
      const payload = {
        ...form,
        clienteNombre: clienteData ? clienteData.nombre : 'Desconocido',
        financingSources,
        isCuotaFija,
        montoCuota,
        selectedBanks,
        bankAmounts,
        bankVouchers, 
        selectedInvestors,
        investorAmounts,
        documentStatus,
        documentFile, 
        comments
      };

      if (editingLoanId) {
        const docRef = getDocRef(user, 'prestamos', editingLoanId);
        await updateDoc(docRef, payload);
      } else {
        const presRef = getCollectionRef(user, 'prestamos');
        const proximaFecha = getFechaUnMesDespues(form.fecha);
        await addDoc(presRef, {
          ...payload,
          saldo: form.monto, 
          proximaFechaPago: proximaFecha, 
          createdAt: serverTimestamp()
        });
      }
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPrestamos = prestamosDb.filter(p => 
    (p.clienteNombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  const getDesgloseGanancias = (prestamo) => {
    if (!prestamo) return { interesBruto: 0, gananciaInversionistas: 0, miGananciaReal: 0 };
    
    const saldoActual = parseFloat(prestamo.saldo !== undefined ? prestamo.saldo : prestamo.monto);
    const tasaPrestamo = parseFloat(prestamo.tasa || 0);
    const interesBruto = saldoActual * (tasaPrestamo / 100);

    let gananciaInversionistas = 0;
    if (prestamo.financingSources?.includes('inversionista') && prestamo.selectedInvestors) {
      prestamo.selectedInvestors.forEach(invId => {
         const inv = investorsDb.find(i => i.id === invId);
         const montoInv = parseFloat(prestamo.investorAmounts?.[invId] || 0);
         const tasaInv = parseFloat(inv?.tasa || 0);
         gananciaInversionistas += (montoInv * (tasaInv / 100));
      });
    }

    const miGananciaReal = Math.max(0, interesBruto - gananciaInversionistas);

    return { interesBruto, gananciaInversionistas, miGananciaReal };
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Listado de Préstamos</h1>
        <button onClick={openNewLoan} className="bg-[#3173c6] hover:bg-[#2860a8] text-white text-sm px-4 py-2.5 rounded shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto">
          <span>+</span> Nuevo Préstamo
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por cliente..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm sm:text-base focus:outline-none focus:border-blue-400 shadow-sm bg-white" />
      </div>

      {/* Tabla de Préstamos */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6 w-28">Creación</th>
                <th className="py-3.5 px-4 sm:px-6">Cliente</th>
                <th className="py-3.5 px-4 sm:px-6">Saldo / Orig</th>
                <th className="py-3.5 px-4 sm:px-6">Próx. Pago</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrestamos.length > 0 ? (
                filteredPrestamos.map((p) => {
                  const estado = getEstadoPrestamo(p);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 sm:px-6 text-slate-600">{p.fecha || '-'}</td>
                      <td className="py-3 px-4 sm:px-6 text-slate-700 font-medium">{p.clienteNombre}</td>
                      <td className="py-3 px-4 sm:px-6">
                        <span className="text-slate-800 font-semibold block leading-tight">S/ {parseFloat(p.saldo !== undefined ? p.saldo : p.monto).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400">Orig: S/ {p.monto}</span>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-slate-800 font-medium">{p.proximaFechaPago || getFechaUnMesDespues(p.fecha)}</td>
                      <td className="py-3 px-4 sm:px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wide
                          ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 
                            estado === 'Vencido' ? 'bg-rose-100 text-rose-800' : 
                            'bg-amber-100 text-amber-800'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full 
                            ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-600' : 
                              estado === 'Vencido' ? 'bg-rose-600' : 
                              'bg-amber-600'}`}></span>
                          {estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEditLoan(p)} className="bg-white border border-slate-300 text-slate-600 text-xs px-4 py-1.5 rounded hover:bg-slate-50 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => { setSelectedLoanView(p); setIsViewLoanModalOpen(true); }} className="bg-[#3173c6] text-white text-xs px-3 py-1.5 rounded hover:bg-[#2860a8] shadow-sm transition-colors">
                            Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="6" className="py-10 text-center text-slate-500">No hay préstamos registrados o que coincidan con la búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario de Préstamo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800">{editingLoanId ? 'Editar Préstamo' : 'Nuevo Préstamo'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-1.5 sm:mb-0">Fecha Inicio:</label>
                <div className="w-full sm:w-2/3">
                  <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-all"/>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-1.5 sm:mb-0">Cliente:</label>
                <div className="w-full sm:w-2/3 relative">
                  <select value={form.clienteId} onChange={e=>setForm({...form, clienteId: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 appearance-none focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-all">
                    <option value="">Seleccione un cliente...</option>
                    {clientsDb.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-1.5 sm:mb-0">Monto Original</label>
                <div className="w-full sm:w-2/3 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">S/</span>
                  <input type="number" placeholder="0.00" value={form.monto} onChange={e=>setForm({...form, monto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 pl-9 text-sm text-slate-800 font-bold focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-all" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-1.5 sm:mb-0">Tasa de Interés (%)</label>
                <div className="w-full sm:w-2/3 relative">
                  <input type="number" placeholder="Ej. 15" value={form.tasa} onChange={e=>setForm({...form, tasa: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 pr-8 text-sm text-slate-800 font-bold focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-all" />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">%</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-1.5 sm:mb-0">Número de Cuotas</label>
                <div className="w-full sm:w-2/3 relative">
                  <select value={form.cuotas} onChange={e=>setForm({...form, cuotas: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium appearance-none focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-all pr-8">
                    {[...Array(36)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} Meses</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-2 sm:mb-0 sm:mt-2">Tipo de Cuota:</label>
                <div className="w-full sm:w-2/3 flex flex-col gap-3">
                  <div className={`inline-flex items-center gap-2 border rounded-lg px-4 py-2 w-fit cursor-pointer transition-colors select-none ${isCuotaFija ? 'border-[#3173c6] bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`} onClick={() => setIsCuotaFija(!isCuotaFija)}>
                     <span className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${isCuotaFija ? 'bg-[#3173c6] text-white' : 'bg-slate-400 text-white'}`}>FIJA</span>
                     <div className={`w-3 h-3 rounded-full transition-colors ${isCuotaFija ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                  </div>
                  {isCuotaFija && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-xs font-medium text-slate-600">Monto por cuota:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm font-bold">S/</span>
                        <input type="number" value={montoCuota} onChange={(e) => setMontoCuota(e.target.value)} placeholder="0.00" className="w-full border border-slate-300 rounded-md p-2 pl-8 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] transition-all"/>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-2 sm:mb-0 sm:mt-2">Banco(s):</label>
                <div className="w-full sm:w-2/3 relative">
                  <div className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 bg-slate-50 focus-within:bg-white min-h-[42px] flex flex-wrap gap-2 cursor-pointer items-center pr-8 transition-colors" onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}>
                    {selectedBanks.length === 0 && <span className="text-slate-400">Seleccione métodos...</span>}
                    {selectedBanks.map(bank => (
                      <span key={bank} className="bg-white border border-slate-200 shadow-sm text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5">
                        {bank}
                        <X size={12} className="cursor-pointer text-slate-400 hover:text-rose-500 transition-colors" onClick={(e) => { e.stopPropagation(); toggleBank(bank); }}/>
                      </span>
                    ))}
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                  {isBankDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                      {availableBanks.map(bank => (
                        <label key={bank} className="flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 m-0 transition-colors">
                          <input type="checkbox" checked={selectedBanks.includes(bank)} onChange={() => toggleBank(bank)} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4"/>
                          {bank}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedBanks.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-end border-b border-slate-100 pb-4">
                  <div className="w-full sm:w-2/3 flex flex-col gap-3">
                    {selectedBanks.map(bank => {
                      const voucherObj = bankVouchers[bank];
                      const vName = voucherObj ? (typeof voucherObj === 'string' ? voucherObj : voucherObj.name) : null;
                      const vData = voucherObj && typeof voucherObj !== 'string' ? voucherObj.data : null;

                      return (
                        <div key={bank} className="flex flex-col gap-3 bg-blue-50/30 border border-blue-100 p-3.5 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-800 font-bold">{bank}</span>
                            <div className="flex items-center gap-1.5 relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium text-sm">S/</span>
                              <input type="number" placeholder="0.00" value={bankAmounts[bank] || ''} onChange={(e) => handleBankAmountChange(bank, e.target.value)} className="w-28 sm:w-32 border border-slate-300 rounded-md p-1.5 pl-8 text-sm text-right font-bold text-slate-800 focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6]" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-blue-100/50 pt-3">
                            <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-bold">Comprobante</span>
                            <div className="flex items-center gap-2">
                              <div className="relative overflow-hidden inline-block">
                                <button className="text-xs bg-white border border-slate-300 hover:border-[#3173c6] hover:text-[#3173c6] px-3 py-1.5 rounded-md text-slate-600 font-medium flex items-center gap-1.5 cursor-pointer max-w-[140px] transition-colors">
                                  <Upload size={12} className="flex-shrink-0" /> 
                                  <span className="truncate">{vName || 'Subir archivo'}</span>
                                </button>
                                <input type="file" onChange={(e) => handleBankVoucherUpload(bank, e)} className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full" />
                              </div>
                              {vName && (
                                <button onClick={(e) => { e.preventDefault(); openPreview(vName, vData); }} className="text-[#3173c6] bg-white hover:bg-blue-50 p-1.5 rounded-md border border-slate-300 shadow-sm transition-colors" title="Ver comprobante">
                                  <Eye size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-2 sm:mb-0 sm:mt-1">Financiar con:</label>
                <div className="w-full sm:w-2/3">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer" onClick={() => toggleFinancingSource('propio')}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${financingSources.includes('propio') ? 'bg-[#3173c6] border-[#3173c6]' : 'border-slate-300 bg-white'}`}>
                         {financingSources.includes('propio') && <Check size={14} className="text-white" />}
                      </div>
                      Capital Propio
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer" onClick={() => toggleFinancingSource('inversionista')}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${financingSources.includes('inversionista') ? 'bg-[#3173c6] border-[#3173c6]' : 'border-slate-300 bg-white'}`}>
                         {financingSources.includes('inversionista') && <Check size={14} className="text-white" />}
                      </div>
                      Inversionista
                    </label>
                  </div>

                  {financingSources.includes('inversionista') && (
                    <div className="mt-4 flex flex-col animate-in fade-in slide-in-from-top-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar Inversionistas:</label>
                      <div className="relative">
                        <div className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 bg-white min-h-[42px] flex flex-wrap gap-2 cursor-pointer items-center pr-8" onClick={() => setIsInvestorDropdownOpen(!isInvestorDropdownOpen)}>
                          {selectedInvestors.length === 0 && <span className="text-slate-400">Escoge uno o varios...</span>}
                          {selectedInvestors.map(invId => {
                            const inv = investorsDb.find(i => i.id === invId);
                            return (
                              <span key={invId} className="bg-blue-100/50 border border-blue-200 text-[#3173c6] px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5">
                                {inv ? inv.nombre : invId}
                                <X size={12} className="cursor-pointer hover:text-blue-800" onClick={(e) => { e.stopPropagation(); toggleInvestor(invId); }}/>
                              </span>
                            )
                          })}
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        {isInvestorDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {investorsDb.length === 0 && <p className="p-3 text-sm text-slate-500 text-center">No hay inversionistas registrados.</p>}
                            {investorsDb.map(inv => (
                              <label key={inv.id} className="flex items-center gap-3 p-3 text-sm font-medium text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 m-0">
                                <input type="checkbox" checked={selectedInvestors.includes(inv.id)} onChange={() => toggleInvestor(inv.id)} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4"/>
                                {inv.nombre}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedInvestors.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
                          {selectedInvestors.map(invId => {
                            const inv = investorsDb.find(i => i.id === invId);
                            return (
                              <div key={invId} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm">
                                <span className="text-sm text-slate-700 font-semibold">{inv ? inv.nombre : invId}</span>
                                <div className="flex items-center gap-1.5 relative">
                                  <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium text-sm">S/</span>
                                  <input type="number" placeholder="0.00" value={investorAmounts[invId] || ''} onChange={(e) => handleAmountChange(invId, e.target.value)} className="w-24 sm:w-28 border border-slate-300 rounded-md p-1.5 pl-7 text-sm text-right font-bold text-slate-800 focus:outline-none focus:border-[#3173c6]" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4">
                <label className="text-sm font-medium text-slate-700 w-full sm:w-1/3 mb-2 sm:mb-0 sm:mt-1">Doc. Préstamo:</label>
                <div className="w-full sm:w-2/3 flex flex-col gap-3">
                  <div className="relative">
                    <select value={documentStatus} onChange={(e) => setDocumentStatus(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-700 bg-slate-50 focus:bg-white appearance-none focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] transition-all">
                      <option value="No Firmado">No Firmado</option>
                      <option value="Firmado">Firmado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <div className="relative overflow-hidden inline-block flex-1">
                      <div className={`w-full border border-dashed rounded-lg p-3 text-center text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${documentFile ? 'border-[#3173c6] bg-blue-50 text-[#3173c6]' : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                        <FileText size={16} /> 
                        <span className="truncate max-w-[200px]">
                          {documentFile ? (typeof documentFile === 'string' ? documentFile : documentFile.name) : 'Adjuntar Contrato/Pagaré'}
                        </span>
                      </div>
                      <input type="file" onChange={handleDocumentUpload} className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full" />
                    </div>
                    {documentFile && (
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          const dName = typeof documentFile === 'string' ? documentFile : documentFile.name;
                          const dData = typeof documentFile === 'string' ? null : documentFile.data;
                          openPreview(dName, dData); 
                        }} 
                        className="flex items-center justify-center bg-white text-[#3173c6] hover:bg-blue-50 p-3 rounded-lg border border-slate-300 shadow-sm flex-shrink-0 transition-colors" title="Ver documento"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col pt-2 pb-4 gap-2">
                <label className="text-sm font-medium text-slate-700">Comentarios u Observaciones:</label>
                <textarea rows="3" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Escribe aquí cualquier detalle adicional..." className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] resize-none text-slate-700 bg-slate-50 focus:bg-white transition-all"></textarea>
              </div>

            </div>

            <div className="p-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white sm:bg-slate-50 mt-auto flex-shrink-0">
              <button onClick={closeModal} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 sm:border-transparent">Cancelar</button>
              <button onClick={handleGuardarPrestamo} disabled={isSaving} className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2">
                {isSaving ? <RefreshCcw size={18} className="animate-spin"/> : editingLoanId ? 'Actualizar Préstamo' : 'Crear Préstamo'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Ver Detalles de Préstamo */}
      {isViewLoanModalOpen && selectedLoanView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800 truncate pr-2">Detalles del Préstamo</h2>
              <button onClick={() => setIsViewLoanModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors flex-shrink-0"><X size={20} /></button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Cliente</p>
                  <p className="text-base font-bold text-[#3173c6]">{selectedLoanView.clienteNombre}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Fecha Inicio</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedLoanView.fecha || '-'}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Próximo Pago</p>
                  <p className="text-sm font-semibold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded w-fit">{selectedLoanView.proximaFechaPago || getFechaUnMesDespues(selectedLoanView.fecha)}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Monto Original</p>
                  <p className="text-sm font-semibold text-slate-800">S/ {selectedLoanView.monto}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Saldo Actual</p>
                  <p className="text-sm font-bold text-rose-600">S/ {selectedLoanView.saldo !== undefined ? selectedLoanView.saldo : selectedLoanView.monto}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Tasa Interés</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedLoanView.tasa}%</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Estado</p>
                  <span className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                    ${getEstadoPrestamo(selectedLoanView) === 'Al día' || getEstadoPrestamo(selectedLoanView) === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 
                      getEstadoPrestamo(selectedLoanView) === 'Vencido' ? 'bg-rose-100 text-rose-800' : 
                      'bg-amber-100 text-amber-800'}`}>
                    {getEstadoPrestamo(selectedLoanView)}
                  </span>
                </div>

                {/* Mostrar Inversionistas si existen */}
                {selectedLoanView.financingSources?.includes('inversionista') && selectedLoanView.selectedInvestors?.length > 0 && (
                  <div className="col-span-2 md:col-span-4 mt-2 bg-blue-50/80 p-3.5 rounded-lg border border-blue-200">
                    <p className="text-[10px] text-blue-800 mb-2 uppercase tracking-wider font-bold flex items-center gap-1"><Users size={12}/> Inversionistas Vinculados</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLoanView.selectedInvestors.map(invId => {
                        const inv = investorsDb.find(i => i.id === invId);
                        const amt = selectedLoanView.investorAmounts?.[invId] || 0;
                        return (
                          <span key={invId} className="bg-white border border-blue-300 text-blue-900 text-xs px-2.5 py-1 rounded shadow-sm font-semibold">
                            {inv ? inv.nombre : 'Desconocido'} (S/ {amt})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Cálculos de Rentabilidad */}
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <TrendingUp size={16} className="text-emerald-600" /> Rentabilidad del Préstamo
              </h3>
              
              {(() => {
                const desglose = getDesgloseGanancias(selectedLoanView);
                return (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 mb-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-3 border-b border-emerald-100/60">
                        <span className="text-sm font-medium text-emerald-700">Interés Mensual a Cobrar (Bruto):</span>
                        <span className="font-bold text-emerald-800">S/ {desglose.interesBruto.toFixed(2)}</span>
                      </div>
                      
                      {desglose.gananciaInversionistas > 0 && (
                        <div className="flex justify-between items-center pb-3 border-b border-emerald-100/60">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-rose-600">Interés para Inversionista(s):</span>
                            <span className="text-[10px] text-rose-500/80 font-semibold">Descuento automático</span>
                          </div>
                          <span className="font-bold text-rose-600">- S/ {desglose.gananciaInversionistas.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center bg-emerald-100/50 p-3 rounded-lg">
                        <span className="font-bold text-emerald-900 uppercase tracking-wide text-sm">Tu Ganancia Real (Neta):</span>
                        <span className="text-xl font-black text-emerald-700">S/ {desglose.miGananciaReal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Información Adicional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedLoanView.selectedBanks?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-bold">Bancos Asignados</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLoanView.selectedBanks.map(b => (
                        <span key={b} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium border border-slate-200">{b}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLoanView.documentFile && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-bold">Documento Adjunto</p>
                    <button 
                      onClick={() => openPreview(
                        typeof selectedLoanView.documentFile === 'string' ? selectedLoanView.documentFile : selectedLoanView.documentFile.name, 
                        typeof selectedLoanView.documentFile === 'string' ? null : selectedLoanView.documentFile.data
                      )}
                      className="flex items-center gap-2 text-sm font-bold text-[#3173c6] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-colors w-fit"
                    >
                      <Eye size={16} /> Ver Documento / Pagaré
                    </button>
                  </div>
                )}
              </div>
              
              {selectedLoanView.comments && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 p-4 rounded-lg shadow-sm">
                  <p className="text-[10px] text-yellow-700 mb-1 uppercase tracking-wider font-bold">Comentarios / Observaciones</p>
                  <p className="text-sm text-yellow-900">{selectedLoanView.comments}</p>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-200 flex justify-end bg-white sm:bg-slate-50 flex-shrink-0">
              <button onClick={() => setIsViewLoanModalOpen(false)} className="w-full sm:w-auto px-8 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm transition-colors">Cerrar Detalles</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Previsualización de Archivos */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-slate-800 truncate pr-4 flex items-center gap-2 text-sm sm:text-base">
                <Eye size={18} className="text-[#3173c6] flex-shrink-0" /> <span className="truncate">{previewModal.name}</span>
              </h3>
              <button onClick={() => setPreviewModal({isOpen: false, name: '', data: null})} className="text-slate-500 hover:text-slate-800 bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition-colors flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
              {previewModal.data ? (
                previewModal.data.startsWith('data:image/') ? (
                  <img src={previewModal.data} alt="Vista Previa" className="max-w-full max-h-full object-contain shadow-lg rounded bg-white" />
                ) : previewModal.data.startsWith('data:application/pdf') ? (
                  <iframe src={previewModal.data} className="w-full h-full rounded shadow-lg border-0 bg-white" title="PDF Preview" />
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center p-8">
                    <FileText size={48} className="mb-3 opacity-50 text-slate-400" />
                    <p className="font-medium text-lg">Vista previa no disponible</p>
                  </div>
                )
              ) : (
                <div className="text-center text-slate-500 flex flex-col items-center bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-slate-200 mx-4">
                  <Cloud size={64} className="mb-4 text-[#3173c6] opacity-80" />
                  <p className="text-lg sm:text-xl font-bold text-slate-700">Archivo antiguo o sin datos</p>
                  <p className="text-sm mt-3 text-slate-500 max-w-md leading-relaxed">Para visualizar este archivo, necesitas volver a subirlo o implementar Firebase Cloud Storage.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListadoInversionistas() {
  const user = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [editingInvestorId, setEditingInvestorId] = useState(null);
  
  const [investors, setInvestors] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  
  // States para Pagos a Inversionistas
  const [pagosInversionistas, setPagosInversionistas] = useState([]);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isEditPagoModalOpen, setIsEditPagoModalOpen] = useState(false);
  const [isViewPagoModalOpen, setIsViewPagoModalOpen] = useState(false);
  const [selectedPagoModal, setSelectedPagoModal] = useState(null);
  const [pagoSearchTerm, setPagoSearchTerm] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '', fecha: '', direccion: '', monto: '', tasa: '', banco: '' });
  
  const [pagoForm, setPagoForm] = useState({
    fecha: '', inversionistaId: '', monto: '', concepto: 'Interés'
  });
  const [editPagoForm, setEditPagoForm] = useState({
    id: '', inversionistaNombre: '', fecha: '', monto: '', concepto: ''
  });
  const [pagoDocumentoFile, setPagoDocumentoFile] = useState(null);

  const [previewModal, setPreviewModal] = useState({ isOpen: false, name: '', data: null });

  useEffect(() => {
    const invRef = getCollectionRef(user, 'inversionistas');
    const presRef = getCollectionRef(user, 'prestamos');
    const pagInvRef = getCollectionRef(user, 'pagos_inversionistas');
    
    if(!invRef || !presRef || !pagInvRef) return;

    const unsubI = onSnapshot(invRef, (snap) => setInvestors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubP = onSnapshot(presRef, (snap) => setPrestamos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubPagInv = onSnapshot(pagInvRef, (snap) => setPagosInversionistas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    
    return () => { unsubI(); unsubP(); unsubPagInv(); };
  }, [user]);

  const openPreview = (name, data) => {
    setPreviewModal({ isOpen: true, name, data });
  };

  const handleGuardarInv = async () => {
    if (!form.nombre) return alert('El nombre es obligatorio');
    setIsSaving(true);
    try {
      if (editingInvestorId) {
        const docRef = getDocRef(user, 'inversionistas', editingInvestorId);
        await updateDoc(docRef, { ...form });
      } else {
        const invRef = getCollectionRef(user, 'inversionistas');
        await addDoc(invRef, { ...form, createdAt: serverTimestamp() });
      }
      closeModal();
    } catch(e) { 
      console.error(e); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handlePagoDocumentoUpload = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return;
    if (file.size > 800000) return alert('El archivo es demasiado grande (máx 800KB).'); 
    const reader = new FileReader();
    reader.onloadend = () => {
      setPagoDocumentoFile({ name: file.name, data: reader.result }); 
    };
    reader.readAsDataURL(file);
  };

  const handleRegistrarPagoInv = async () => {
    if(!pagoForm.inversionistaId || !pagoForm.monto || !pagoForm.fecha) return alert("Seleccione un inversionista, digite la fecha y el monto.");
    setIsSaving(true);
    try {
      const inv = investors.find(i => i.id === pagoForm.inversionistaId);
      const pagInvRef = getCollectionRef(user, 'pagos_inversionistas');

      await addDoc(pagInvRef, {
        inversionistaId: inv.id,
        inversionistaNombre: inv.nombre,
        fecha: pagoForm.fecha,
        monto: pagoForm.monto,
        concepto: pagoForm.concepto,
        documento: pagoDocumentoFile,
        createdAt: serverTimestamp()
      });

      if (pagoForm.concepto === 'Devolución') {
        const nuevoMonto = Math.max(0, parseFloat(inv.monto || 0) - parseFloat(pagoForm.monto));
        const invRef = getDocRef(user, 'inversionistas', inv.id);
        await updateDoc(invRef, { monto: nuevoMonto.toString() });
      }

      alert("Pago a inversionista registrado correctamente");
      closePagoModal();
    } catch(e) {
      console.error(e);
      alert("Error al registrar el pago.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGuardarEditPagoInv = async () => {
    if(!editPagoForm.monto) return alert("El monto es obligatorio");
    setIsSaving(true);
    try {
      const docRef = getDocRef(user, 'pagos_inversionistas', editPagoForm.id);
      await updateDoc(docRef, {
        fecha: editPagoForm.fecha,
        monto: editPagoForm.monto,
        concepto: editPagoForm.concepto
      });
      setIsEditPagoModalOpen(false);
    } catch (e) {
      console.error("Error al actualizar pago:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvestorId(null);
    setForm({ nombre: '', dni: '', telefono: '', fecha: '', direccion: '', monto: '', tasa: '', banco: '' });
  };

  const closePagoModal = () => {
    setIsPagoModalOpen(false);
    setPagoForm({ fecha: '', inversionistaId: '', monto: '', concepto: 'Interés' });
    setPagoDocumentoFile(null);
  };

  const openNewInvestor = () => {
    setForm({ nombre: '', dni: '', telefono: '', fecha: '', direccion: '', monto: '', tasa: '', banco: '' });
    setEditingInvestorId(null);
    setIsModalOpen(true);
  };

  const openEditInvestor = (investor) => {
    setForm({
      nombre: investor.nombre || '', dni: investor.dni || '', telefono: investor.telefono || '', 
      fecha: investor.fecha || '', direccion: investor.direccion || '', monto: investor.monto || '', 
      tasa: investor.tasa || '', banco: investor.banco || ''
    });
    setEditingInvestorId(investor.id);
    setIsModalOpen(true);
  };

  const openEditPago = (pago) => {
    setEditPagoForm({
      id: pago.id,
      inversionistaNombre: pago.inversionistaNombre || '',
      fecha: pago.fecha || '',
      monto: pago.monto || '',
      concepto: pago.concepto || ''
    });
    setIsEditPagoModalOpen(true);
  };

  const filteredPagosInv = pagosInversionistas
    .filter(p => p.inversionistaNombre && p.inversionistaNombre.toLowerCase().includes(pagoSearchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Inversionistas</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setIsPagoModalOpen(true)} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm px-4 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto font-medium">
            <Upload size={16} className="text-[#3173c6]" /> Pago a Inversor
          </button>
          <button onClick={openNewInvestor} className="bg-[#3173c6] hover:bg-[#2860a8] text-white text-sm px-4 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto font-bold">
            <span>+</span> Añadir Inversionista
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-10">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6">Nombre</th>
                <th className="py-3.5 px-4 sm:px-6">Capital Invertido</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {investors.length > 0 ? investors.map((investor) => (
                <tr key={investor.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 sm:px-6 text-slate-700 font-medium">{investor.nombre}</td>
                  <td className="py-3 px-4 sm:px-6 text-slate-800 font-semibold">S/ {investor.monto || '0.00'}</td>
                  <td className="py-3 px-4 sm:px-6 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEditInvestor(investor)} className="bg-white text-slate-600 border border-slate-300 text-xs px-3 py-1.5 rounded hover:bg-slate-50 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => { setSelectedInvestor(investor); setIsDetailsModalOpen(true); }} className="bg-[#3173c6] text-white text-xs px-3 py-1.5 rounded hover:bg-[#2860a8] shadow-sm transition-colors">
                        Detalles
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="py-10 text-center text-slate-500">No hay inversionistas registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN: Historial de Pagos a Inversionistas */}
      <div className="w-full border-t border-slate-200 pt-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-700">Historial de Pagos Realizados</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={pagoSearchTerm}
              onChange={(e) => setPagoSearchTerm(e.target.value)}
              placeholder="Buscar por inversionista..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 shadow-sm text-slate-700 bg-white"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Fecha</th>
                  <th className="py-3 px-4 sm:px-6">Inversionista</th>
                  <th className="py-3 px-4 sm:px-6">Concepto</th>
                  <th className="py-3 px-4 sm:px-6">Monto</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagosInv.length > 0 ? (
                  filteredPagosInv.map((pago) => (
                    <tr key={pago.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">{pago.fecha || '-'}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-800 font-bold">{pago.inversionistaNombre}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold border ${pago.concepto === 'Devolución' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {pago.concepto}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-black text-[#3173c6]">S/ {pago.monto}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEditPago(pago)} className="bg-white border border-slate-300 text-slate-600 text-xs px-3 py-1.5 rounded hover:bg-slate-100 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => { setSelectedPagoModal(pago); setIsViewPagoModalOpen(true); }} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700 shadow-sm transition-colors">
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No se encontraron pagos a inversionistas registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nuevo/Editar Inversionista */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingInvestorId ? 'Editar Inversionista' : 'Registrar Inversionista'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo</label>
                <input type="text" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow" placeholder="Ej. Pedro Diaz" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">DNI</label>
                  <input type="text" value={form.dni} onChange={e=>setForm({...form, dni: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow" placeholder="Ej. 12345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={e=>setForm({...form, telefono: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow" placeholder="Ej. 987 654 321" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
                    <input type="text" value={form.direccion} onChange={e=>setForm({...form, direccion: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow" placeholder="Ej. Av. Principal 123" />
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Inversión</label>
                  <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto de Inversión (S/)</label>
                  <input type="number" value={form.monto} onChange={e=>setForm({...form, monto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow font-bold" placeholder="Ej. 10000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tasa Rendimiento (%)</label>
                  <input type="number" value={form.tasa} onChange={e=>setForm({...form, tasa: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow font-bold" placeholder="Ej. 12" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white sm:bg-slate-50">
              <button onClick={closeModal} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 border border-slate-200 sm:border-transparent rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleGuardarInv} disabled={isSaving} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm flex justify-center gap-2 items-center transition-colors">
                {isSaving ? <RefreshCcw size={16} className="animate-spin"/> : editingInvestorId ? 'Actualizar Inversor' : 'Guardar Inversor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles del Inversionista */}
      {isDetailsModalOpen && selectedInvestor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800 truncate pr-2">Detalles - {selectedInvestor.nombre}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors flex-shrink-0"><X size={20} /></button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-8 bg-blue-50/50 p-5 rounded-xl border border-blue-100 shadow-sm">
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">DNI</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedInvestor.dni || '-'}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Teléfono</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedInvestor.telefono || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Dirección</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedInvestor.direccion || '-'}</p>
                </div>
                <div className="col-span-2 border-t border-blue-100/50 pt-4">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Monto Invertido</p>
                  <p className="text-xl font-bold text-[#3173c6]">S/ {selectedInvestor.monto || '0.00'}</p>
                </div>
                <div className="col-span-2 border-t border-blue-100/50 pt-4">
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Tasa de Rendimiento</p>
                  <p className="text-xl font-bold text-emerald-600">{selectedInvestor.tasa || '0'}%</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Users size={16} className="text-[#3173c6]" />
                  Préstamos Asignados
                </h3>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Monto Original</th>
                          <th className="py-3 px-4">Próx. Pago</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const investorLoans = prestamos.filter(p => p.selectedInvestors && p.selectedInvestors.includes(selectedInvestor.id));
                          if (investorLoans.length === 0) return <tr><td colSpan="4" className="p-6 text-center text-slate-500">No hay préstamos asignados a este inversionista.</td></tr>;
                          return investorLoans.map((loan) => {
                            const estado = getEstadoPrestamo(loan);
                            return (
                              <tr key={loan.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="py-3.5 px-4 text-slate-800 font-medium">{loan.clienteNombre}</td>
                                <td className="py-3.5 px-4 text-slate-700 font-semibold">S/ {loan.monto}</td>
                                <td className="py-3.5 px-4 text-slate-500">{loan.proximaFechaPago || getFechaUnMesDespues(loan.fecha)}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                    ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 
                                      estado === 'Vencido' ? 'bg-rose-100 text-rose-800' : 
                                      'bg-amber-100 text-amber-800'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full 
                                      ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-600' : 
                                        estado === 'Vencido' ? 'bg-rose-600' : 
                                        'bg-amber-600'}`}></span>
                                    {estado}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-200 flex justify-end bg-white sm:bg-slate-50 flex-shrink-0">
              <button onClick={() => setIsDetailsModalOpen(false)} className="w-full sm:w-auto px-8 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Pago a Inversionista */}
      {isPagoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Registrar Salida de Dinero</h2>
              <button onClick={closePagoModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
                <p className="text-xs text-slate-600 mb-2">Seleccione a qué inversionista se le está realizando el pago.</p>
                <div className="relative">
                  <select value={pagoForm.inversionistaId} onChange={e=>setPagoForm({...pagoForm, inversionistaId: e.target.value})} className="w-full border border-blue-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] appearance-none bg-white font-semibold text-[#3173c6]">
                    <option value="">Seleccione un Inversionista...</option>
                    {investors.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.nombre} (Capital: S/ {inv.monto})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Fecha del Pago</label>
                  <input type="date" value={pagoForm.fecha} onChange={e=>setPagoForm({...pagoForm, fecha: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Monto Entregado (S/)</label>
                  <input type="number" value={pagoForm.monto} onChange={e=>setPagoForm({...pagoForm, monto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-shadow font-bold" placeholder="Ej. 500" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Concepto</label>
                    <div className="relative">
                      <select value={pagoForm.concepto} onChange={e=>setPagoForm({...pagoForm, concepto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] appearance-none bg-slate-50 focus:bg-white font-medium">
                        <option value="Interés">Pago de Interés (Ganancia)</option>
                        <option value="Devolución">Devolución de Capital</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                    {pagoForm.concepto === 'Devolución' && (
                      <p className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 font-medium">
                        ⚠️ Este monto se restará del "Capital Invertido" actual de este inversionista.
                      </p>
                    )}
                 </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Documento / Voucher</label>
                <div className="flex items-center gap-2 w-full">
                  <div className="relative overflow-hidden inline-block flex-1">
                    <div className={`w-full border border-dashed rounded-lg p-3 text-center text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${pagoDocumentoFile ? 'border-[#3173c6] bg-blue-50 text-[#3173c6]' : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                      <Upload size={16} /> 
                      <span className="truncate max-w-[200px]">
                        {pagoDocumentoFile ? pagoDocumentoFile.name : 'Subir archivo del pago'}
                      </span>
                    </div>
                    <input type="file" onChange={handlePagoDocumentoUpload} className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                  {pagoDocumentoFile && (
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        openPreview(pagoDocumentoFile.name, pagoDocumentoFile.data); 
                      }} 
                      className="flex items-center justify-center bg-white text-[#3173c6] hover:bg-blue-50 p-3 rounded-lg border border-slate-300 shadow-sm flex-shrink-0 transition-colors" title="Ver documento"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                </div>
              </div>

            </div>
            <div className="p-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white sm:bg-slate-50">
              <button onClick={closePagoModal} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 border border-slate-200 sm:border-transparent rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleRegistrarPagoInv} disabled={isSaving} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm flex justify-center gap-2 items-center transition-colors">
                {isSaving ? <RefreshCcw size={16} className="animate-spin"/> : 'Procesar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pago de Inversor */}
      {isEditPagoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Modificar Pago Realizado</h2>
              <button onClick={() => setIsEditPagoModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inversionista</label>
                  <input type="text" readOnly value={editPagoForm.inversionistaNombre} className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-not-allowed" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label>
                  <input type="date" value={editPagoForm.fecha} onChange={e=>setEditPagoForm({...editPagoForm, fecha: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6]" />
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto (S/)</label>
                  <input type="number" value={editPagoForm.monto} onChange={e=>setEditPagoForm({...editPagoForm, monto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-[#3173c6]" />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Concepto Aplicado</label>
                  <div className="relative">
                    <select value={editPagoForm.concepto} onChange={e=>setEditPagoForm({...editPagoForm, concepto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm appearance-none focus:outline-none focus:border-[#3173c6] bg-white">
                      <option value="Interés">Pago de Interés</option>
                      <option value="Devolución">Devolución de Capital</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
               </div>
               <p className="text-xs text-rose-500 bg-rose-50 p-2 rounded border border-rose-100">
                 <b>Nota:</b> Modificar un registro antiguo desde aquí no recalculará el capital actual del inversionista automáticamente. Si cambias un monto de "Devolución", ajusta el capital manualmente editando al Inversor.
               </p>
            </div>
            <div className="p-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white sm:bg-slate-50">
              <button onClick={() => setIsEditPagoModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 border border-slate-200 sm:border-transparent rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleGuardarEditPagoInv} disabled={isSaving} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors">
                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle de Pago Inversionista */}
      {isViewPagoModalOpen && selectedPagoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Recibo de Salida</h2>
              <button onClick={() => setIsViewPagoModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
              <div className={`${selectedPagoModal.concepto === 'Devolución' ? 'bg-rose-50/50 border-rose-100' : 'bg-blue-50/50 border-blue-100'} border rounded-xl p-4 mb-6 flex flex-col items-center justify-center text-center`}>
                 <p className={`text-xs uppercase tracking-widest font-bold mb-1 ${selectedPagoModal.concepto === 'Devolución' ? 'text-rose-600' : 'text-blue-600'}`}>Monto Entregado</p>
                 <p className={`text-4xl font-black ${selectedPagoModal.concepto === 'Devolución' ? 'text-rose-700' : 'text-[#3173c6]'}`}>S/ {selectedPagoModal.monto}</p>
                 <span className="mt-2 bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-slate-100">{selectedPagoModal.fecha}</span>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 px-2">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-bold">Inversionista</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPagoModal.inversionistaNombre}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-bold">Concepto</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPagoModal.concepto}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-bold">ID Transacción</p>
                  <p className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">{selectedPagoModal.id.slice(0,10)}</p>
                </div>
                
                {selectedPagoModal.documento && (
                  <div className="col-span-2 mt-2 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-bold">Comprobante / Voucher</p>
                    <button 
                      onClick={() => openPreview(selectedPagoModal.documento.name, selectedPagoModal.documento.data)}
                      className="flex items-center justify-center gap-2 text-sm font-bold text-[#3173c6] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-lg transition-colors w-full sm:w-fit"
                    >
                      <Eye size={18} /> Ver Documento Adjunto
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end bg-white sm:bg-slate-50">
              <button onClick={() => setIsViewPagoModalOpen(false)} className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-colors">Cerrar Recibo</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Previsualización de Archivos */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-slate-800 truncate pr-4 flex items-center gap-2 text-sm sm:text-base">
                <Eye size={18} className="text-[#3173c6] flex-shrink-0" /> <span className="truncate">{previewModal.name}</span>
              </h3>
              <button onClick={() => setPreviewModal({isOpen: false, name: '', data: null})} className="text-slate-500 hover:text-slate-800 bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition-colors flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
              {previewModal.data ? (
                previewModal.data.startsWith('data:image/') ? (
                  <img src={previewModal.data} alt="Vista Previa" className="max-w-full max-h-full object-contain shadow-lg rounded bg-white" />
                ) : previewModal.data.startsWith('data:application/pdf') ? (
                  <iframe src={previewModal.data} className="w-full h-full rounded shadow-lg border-0 bg-white" title="PDF Preview" />
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center p-8">
                    <FileText size={48} className="mb-3 opacity-50 text-slate-400" />
                    <p className="font-medium text-lg">Vista previa no disponible</p>
                  </div>
                )
              ) : (
                <div className="text-center text-slate-500 flex flex-col items-center bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-slate-200 mx-4">
                  <Cloud size={64} className="mb-4 text-[#3173c6] opacity-80" />
                  <p className="text-lg sm:text-xl font-bold text-slate-700">Archivo antiguo o sin datos</p>
                  <p className="text-sm mt-3 text-slate-500 max-w-md leading-relaxed">Para visualizar este archivo, necesitas volver a subirlo o implementar Firebase Cloud Storage.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pagos() {
  const user = useContext(UserContext);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);

  const [form, setForm] = useState({
    fechaPago: '', montoPagado: '', banco: '', concepto: 'Interés', comentario: ''
  });

  const [editPagoForm, setEditPagoForm] = useState({
    id: '', clienteNombre: '', fechaPrestamo: '', fechaPago: '', montoPagado: '', banco: '', concepto: '', comentario: ''
  });

  const [pagoVoucher, setPagoVoucher] = useState(null);

  const [prestamosDb, setPrestamosDb] = useState([]);
  const [pagosDb, setPagosDb] = useState([]);
  const [investorsDb, setInvestorsDb] = useState([]);
  
  // States para filtros del historial de pagos
  const [pagoSearchTerm, setPagoSearchTerm] = useState('');
  const [filterFechaPrestamo, setFilterFechaPrestamo] = useState('');

  const [isViewPagoModalOpen, setIsViewPagoModalOpen] = useState(false);
  const [isEditPagoModalOpen, setIsEditPagoModalOpen] = useState(false);
  const [selectedPagoModal, setSelectedPagoModal] = useState(null);

  const [previewModal, setPreviewModal] = useState({ isOpen: false, name: '', data: null });

  useEffect(() => {
    const presRef = getCollectionRef(user, 'prestamos');
    const pagRef = getCollectionRef(user, 'pagos');
    const invRef = getCollectionRef(user, 'inversionistas');
    
    if(!presRef || !pagRef || !invRef) return;

    const unsubP = onSnapshot(presRef, snap => setPrestamosDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPag = onSnapshot(pagRef, snap => setPagosDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubInv = onSnapshot(invRef, snap => setInvestorsDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { unsubP(); unsubPag(); unsubInv(); };
  }, [user]);

  const handleVoucherUpload = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return;
    if (file.size > 800000) return alert('El archivo es demasiado grande (máx 800KB).'); 
    const reader = new FileReader();
    reader.onloadend = () => {
      setPagoVoucher({ name: file.name, data: reader.result }); 
    };
    reader.readAsDataURL(file);
  };

  const openPreview = (name, data) => {
    setPreviewModal({ isOpen: true, name, data });
  };

  const filteredPrestamos = prestamosDb.filter(p => p.clienteNombre && p.clienteNombre.toLowerCase().includes(clienteSearch.toLowerCase()));
  
  // Filtro compuesto por Nombre de Cliente Y Fecha de Préstamo
  const filteredPagosHistory = pagosDb
    .filter(p => {
      const matchClient = p.clienteNombre && p.clienteNombre.toLowerCase().includes(pagoSearchTerm.toLowerCase());
      const matchDate = filterFechaPrestamo === '' || p.fechaPrestamo === filterFechaPrestamo;
      return matchClient && matchDate;
    })
    .sort((a,b) => new Date(b.fechaPago) - new Date(a.fechaPago));

  const handleRegistrarPago = async () => {
    if(!selectedPrestamo || !form.montoPagado || !form.fechaPago) return alert("Seleccione un préstamo de la lista, digite la fecha y el monto a pagar.");
    const pagRef = getCollectionRef(user, 'pagos');
    if(!pagRef) return alert("Error de conexión");

    setIsSaving(true);
    try {
      const saldoActual = parseFloat(selectedPrestamo.saldo !== undefined ? selectedPrestamo.saldo : selectedPrestamo.monto);
      const tasa = parseFloat(selectedPrestamo.tasa || 0);
      const interesGenerado = saldoActual * (tasa / 100);
      const montoPagado = parseFloat(form.montoPagado);

      let interesCobrado = 0;
      let nuevoSaldo = saldoActual;

      if (form.concepto === 'Interés') {
        interesCobrado = montoPagado;
      } else if (form.concepto === 'Amortización') {
        nuevoSaldo -= montoPagado;
      } else if (form.concepto === 'Ambos (Interés + Amortización)') {
        interesCobrado = interesGenerado;
        if (interesCobrado > montoPagado) interesCobrado = montoPagado;
        const amortizacion = montoPagado - interesCobrado;
        if (amortizacion > 0) {
          nuevoSaldo -= amortizacion;
        }
      }

      if (nuevoSaldo < 0.01) nuevoSaldo = 0;

      // --- CÁLCULO DE DEDUCCIÓN AL INVERSIONISTA ---
      let interesInversionistasCobrado = 0;
      if (interesCobrado > 0 && selectedPrestamo.financingSources?.includes('inversionista')) {
        let interesInversionistasTeorico = 0;
        
        selectedPrestamo.selectedInvestors?.forEach(invId => {
           const inv = investorsDb.find(i => i.id === invId);
           const montoInv = parseFloat(selectedPrestamo.investorAmounts?.[invId] || 0);
           const tasaInv = parseFloat(inv?.tasa || 0); 
           interesInversionistasTeorico += (montoInv * (tasaInv / 100));
        });
        
        let proporcion = 1;
        if (interesGenerado > 0) {
          proporcion = interesCobrado / interesGenerado;
          if (proporcion > 1) proporcion = 1; // Si paga de más, la deducción del inversor se limita a su cuota
        }
        
        interesInversionistasCobrado = interesInversionistasTeorico * proporcion;
      }

      let nuevaProximaFecha = selectedPrestamo.proximaFechaPago || getFechaUnMesDespues(selectedPrestamo.fecha);
      if (form.concepto === 'Interés' || form.concepto === 'Ambos (Interés + Amortización)') {
        if (nuevaProximaFecha) {
           const d = new Date(nuevaProximaFecha + 'T00:00:00');
           if (!isNaN(d.getTime())) {
             d.setMonth(d.getMonth() + 1);
             nuevaProximaFecha = d.toISOString().split('T')[0];
           }
        }
      }

      await addDoc(pagRef, {
        prestamoId: selectedPrestamo.id,
        clienteNombre: selectedPrestamo.clienteNombre,
        fechaPrestamo: selectedPrestamo.fecha || 'No especificada',
        fechaPago: form.fechaPago,
        montoPagado: form.montoPagado,
        banco: form.banco,
        concepto: form.concepto,
        comentario: form.comentario,
        interesCobrado: interesCobrado.toFixed(2), 
        interesInversionistas: interesInversionistasCobrado.toFixed(2), // Guardamos la parte que le toca al inversor
        voucher: pagoVoucher, 
        createdAt: serverTimestamp()
      });

      const prestamoRef = getDocRef(user, 'prestamos', selectedPrestamo.id);
      await updateDoc(prestamoRef, {
        saldo: nuevoSaldo.toFixed(2),
        proximaFechaPago: nuevaProximaFecha
      });

      alert("Pago registrado y préstamo actualizado correctamente");
      setForm({ fechaPago: '', montoPagado: '', banco: '', concepto: 'Interés', comentario: '' });
      setPagoVoucher(null);
      setClienteSearch('');
      setSelectedPrestamo(null);
    } catch(e) {
      console.error(e);
      alert("Ocurrió un error al registrar el pago.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditPago = (pago) => {
    setEditPagoForm({
      id: pago.id,
      clienteNombre: pago.clienteNombre || '',
      fechaPrestamo: pago.fechaPrestamo || '',
      fechaPago: pago.fechaPago || '',
      montoPagado: pago.montoPagado || '',
      banco: pago.banco || '',
      concepto: pago.concepto || '',
      comentario: pago.comentario || ''
    });
    setIsEditPagoModalOpen(true);
  };

  const handleGuardarEditPago = async () => {
    if(!editPagoForm.montoPagado) return alert("El monto es obligatorio");
    setIsSaving(true);
    try {
      const docRef = getDocRef(user, 'pagos', editPagoForm.id);
      await updateDoc(docRef, {
        fechaPago: editPagoForm.fechaPago,
        montoPagado: editPagoForm.montoPagado,
        banco: editPagoForm.banco,
        concepto: editPagoForm.concepto,
        comentario: editPagoForm.comentario
      });
      setIsEditPagoModalOpen(false);
    } catch (e) {
      console.error("Error al actualizar pago:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-10 lg:max-w-4xl">
      {/* SECCIÓN: FORMULARIO DE REGISTRO */}
      <div className="w-full lg:max-w-3xl">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700 mb-6">Registrar Pago</h1>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
          <div className="p-5 border-b border-slate-200 bg-slate-50 rounded-t-xl relative z-20">
            <h2 className="text-sm font-bold text-[#3173c6] mb-4 flex items-center gap-2"><Search size={16} /> Buscar Préstamo Activo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Cliente / Préstamo</label>
                <div className="relative">
                  <input type="text" value={clienteSearch} onChange={e => { setClienteSearch(e.target.value); setSelectedPrestamo(null); }} onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} placeholder="Escribe el nombre del cliente para buscar..." className="w-full border border-slate-300 rounded-lg p-3 text-sm bg-white focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] focus:outline-none transition-all shadow-sm" />
                  {showDropdown && filteredPrestamos.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-56 overflow-auto top-full left-0">
                      {filteredPrestamos.filter(p => parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0).map((c) => (
                        <li key={c.id} onMouseDown={(e) => { 
                          e.preventDefault(); 
                          setClienteSearch(c.clienteNombre); 
                          setSelectedPrestamo(c); 
                          setShowDropdown(false); 
                        }} className="p-3 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 transition-colors">
                          <span className="font-semibold text-slate-800">{c.clienteNombre}</span> 
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">Saldo: S/ {c.saldo !== undefined ? c.saldo : c.monto} <span className="opacity-50 mx-1">|</span> Vence: {c.proximaFechaPago || getFechaUnMesDespues(c.fecha)}</span>
                        </li>
                      ))}
                      {filteredPrestamos.filter(p => parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0).length === 0 && (
                         <li className="p-4 text-sm text-center text-slate-500">Este cliente no tiene deudas pendientes.</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 sm:p-6 space-y-5">
            {/* Panel de Ayuda del Préstamo Seleccionado */}
            {selectedPrestamo && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 shadow-inner mb-2 animate-in fade-in zoom-in-95 duration-300">
                 <div className="bg-white p-3 rounded-lg border border-blue-100/50 shadow-sm">
                   <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Deuda Pendiente</label>
                   <div className="text-lg font-bold text-[#3173c6]">S/ {selectedPrestamo.saldo !== undefined ? selectedPrestamo.saldo : selectedPrestamo.monto}</div>
                 </div>
                 <div className="bg-white p-3 rounded-lg border border-blue-100/50 shadow-sm">
                   <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Interés Generado ({selectedPrestamo.tasa}%)</label>
                   <div className="text-lg font-bold text-amber-600">S/ {((parseFloat(selectedPrestamo.saldo !== undefined ? selectedPrestamo.saldo : selectedPrestamo.monto) || 0) * (parseFloat(selectedPrestamo.tasa || 0) / 100)).toFixed(2)}</div>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Fecha del Pago</label>
                <input type="date" value={form.fechaPago} onChange={e=>setForm({...form, fechaPago: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] text-slate-800 bg-slate-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Monto Entregado (S/)</label>
                <input type="number" value={form.montoPagado} onChange={e=>setForm({...form, montoPagado: e.target.value})} placeholder="Ej. 150.00" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] text-slate-800 bg-slate-50 focus:bg-white transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Concepto</label>
                <div className="relative">
                  <select value={form.concepto} onChange={e=>setForm({...form, concepto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white appearance-none text-slate-800 font-medium transition-all">
                    <option value="Interés">Solo Interés</option>
                    <option value="Amortización">Amortización (Abono a capital)</option>
                    <option value="Ambos (Interés + Amortización)">Ambos (Interés + Abono)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Método de Pago</label>
                <div className="relative">
                  <select value={form.banco} onChange={e=>setForm({...form, banco: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white appearance-none text-slate-800 transition-all">
                    <option value="">Seleccionar método...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="BCP">BCP</option>
                    <option value="Interbank">Interbank</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Yape / Plin">Yape / Plin</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>

                {form.banco && form.banco !== 'Efectivo' && form.banco !== '' && (
                  <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="relative overflow-hidden inline-block flex-1">
                      <button className="w-full text-xs bg-white border border-slate-300 hover:border-[#3173c6] hover:text-[#3173c6] px-3 py-2 rounded-md text-slate-600 font-medium flex items-center justify-center gap-1.5 cursor-pointer truncate transition-colors">
                        <Upload size={14} className="flex-shrink-0" /> 
                        <span className="truncate">{pagoVoucher ? pagoVoucher.name : 'Adjuntar Voucher'}</span>
                      </button>
                      <input type="file" onChange={handleVoucherUpload} className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full" />
                    </div>
                    {pagoVoucher && (
                      <button onClick={(e) => { e.preventDefault(); openPreview(pagoVoucher.name, pagoVoucher.data); }} className="text-[#3173c6] bg-white hover:bg-blue-50 p-2 rounded-md border border-slate-300 shadow-sm transition-colors flex-shrink-0" title="Ver voucher">
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button onClick={handleRegistrarPago} disabled={isSaving || !selectedPrestamo} className={`w-full sm:w-auto px-8 py-3 rounded-lg shadow-md font-bold transition-all flex items-center justify-center gap-2 ${!selectedPrestamo ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#2d70c4] hover:bg-[#255ba1] hover:shadow-lg text-white'}`}>
                {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : 'Procesar Pago'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: HISTORIAL DE PAGOS */}
      <div className="w-full border-t border-slate-200 pt-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-700">Historial de Pagos Recientes</h2>
          
          {/* Opciones de Filtrado Compuesto */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                value={pagoSearchTerm}
                onChange={(e) => setPagoSearchTerm(e.target.value)}
                placeholder="Buscar por cliente..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-[#3173c6] shadow-sm text-slate-700 bg-white"
              />
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative flex-1">
                <input 
                  type="date" 
                  value={filterFechaPrestamo}
                  onChange={(e) => setFilterFechaPrestamo(e.target.value)}
                  title="Filtrar por fecha en que se dio el Préstamo"
                  className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-[#3173c6] shadow-sm text-slate-700 bg-white"
                />
              </div>
              {filterFechaPrestamo && (
                <button 
                  onClick={() => setFilterFechaPrestamo('')}
                  className="bg-white border border-slate-300 text-slate-500 hover:text-rose-500 px-3 py-2 rounded shadow-sm text-xs font-bold transition-colors"
                  title="Limpiar fecha"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6 w-24">Recibo ID</th>
                  <th className="py-3 px-4 sm:px-6">Cliente</th>
                  <th className="py-3 px-4 sm:px-6">F. Préstamo</th>
                  <th className="py-3 px-4 sm:px-6">F. Pago</th>
                  <th className="py-3 px-4 sm:px-6">Concepto</th>
                  <th className="py-3 px-4 sm:px-6">Monto</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagosHistory.length > 0 ? (
                  filteredPagosHistory.map((pago) => (
                    <tr key={pago.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-slate-400 font-mono text-[10px]">{pago.id.slice(0, 6)}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-800 font-bold">{pago.clienteNombre}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-500 text-xs">{pago.fechaPrestamo || '-'}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-700 font-medium">{pago.fechaPago || '-'}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-[10px] font-semibold text-slate-600">{pago.concepto}</span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-emerald-700 font-black">S/ {pago.montoPagado}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEditPago(pago)} className="bg-white border border-slate-300 text-slate-600 text-xs px-3 py-1.5 rounded hover:bg-slate-100 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => { setSelectedPagoModal(pago); setIsViewPagoModalOpen(true); }} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700 shadow-sm transition-colors">
                            Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard size={32} className="opacity-20" />
                        <p>No se encontraron pagos registrados con esos filtros.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Editar Pago */}
      {isEditPagoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Modificar Recibo de Pago</h2>
              <button onClick={() => setIsEditPagoModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cliente a modificar</label>
                  <input type="text" readOnly value={editPagoForm.clienteNombre} className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-not-allowed" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha Registrada</label>
                  <input type="date" value={editPagoForm.fechaPago} onChange={e=>setEditPagoForm({...editPagoForm, fechaPago: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6]" />
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto Pagado (S/)</label>
                  <input type="number" value={editPagoForm.montoPagado} onChange={e=>setEditPagoForm({...editPagoForm, montoPagado: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6]" />
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Método Guardado</label>
                    <div className="relative">
                      <select value={editPagoForm.banco} onChange={e=>setEditPagoForm({...editPagoForm, banco: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm appearance-none focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-white">
                        <option value="Efectivo">Efectivo</option>
                        <option value="BCP">BCP</option>
                        <option value="Interbank">Interbank</option>
                        <option value="BBVA">BBVA</option>
                        <option value="Yape / Plin">Yape / Plin</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Concepto Aplicado</label>
                    <div className="relative">
                      <select value={editPagoForm.concepto} onChange={e=>setEditPagoForm({...editPagoForm, concepto: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm appearance-none focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-white">
                        <option value="Interés">Interés</option>
                        <option value="Amortización">Amortización</option>
                        <option value="Ambos (Interés + Amortización)">Ambos</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                 </div>
               </div>
               <p className="text-xs text-rose-500 bg-rose-50 p-2 rounded border border-rose-100">
                 <b>Nota:</b> Modificar un pago antiguo desde aquí no recalculará el saldo automáticamente. Hazlo con cuidado.
               </p>
            </div>
            <div className="p-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white sm:bg-slate-50">
              <button onClick={() => setIsEditPagoModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 border border-slate-200 sm:border-transparent rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleGuardarEditPago} disabled={isSaving} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-[#3173c6] hover:bg-[#2860a8] rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors">
                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle de Pago */}
      {isViewPagoModalOpen && selectedPagoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Recibo de Pago Detallado</h2>
              <button onClick={() => setIsViewPagoModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mb-6 flex flex-col items-center justify-center text-center">
                 <p className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-1">Monto Recibido</p>
                 <p className="text-4xl font-black text-emerald-700">S/ {selectedPagoModal.montoPagado}</p>
                 <span className="mt-2 bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-slate-100">{selectedPagoModal.fechaPago}</span>
                 
                 {/* Desglose de Interés y Amortización */}
                 {selectedPagoModal.concepto === 'Ambos (Interés + Amortización)' && (
                   <div className="flex items-center gap-4 mt-4 w-full max-w-sm justify-center border-t border-emerald-200/60 pt-4">
                     <div className="text-center">
                       <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/70 mb-0.5">Interés</p>
                       <p className="text-sm font-bold text-emerald-800">S/ {selectedPagoModal.interesCobrado || '0.00'}</p>
                     </div>
                     <div className="text-emerald-400 font-black">+</div>
                     <div className="text-center">
                       <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/70 mb-0.5">Amortización</p>
                       <p className="text-sm font-bold text-emerald-800">S/ {(parseFloat(selectedPagoModal.montoPagado || 0) - parseFloat(selectedPagoModal.interesCobrado || 0)).toFixed(2)}</p>
                     </div>
                   </div>
                 )}

                 {/* Desglose Inversionista */}
                 {parseFloat(selectedPagoModal.interesInversionistas || 0) > 0 && (
                   <div className="w-full max-w-sm mt-3 pt-3 border-t border-emerald-200/60 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-700 font-medium">Interés Bruto Generado:</span>
                        <span className="text-emerald-800 font-bold">S/ {(selectedPagoModal.concepto === 'Interés' ? selectedPagoModal.montoPagado : selectedPagoModal.interesCobrado)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-700 font-medium">Pago a Inversionista(s):</span>
                        <span className="text-rose-600 font-bold">- S/ {selectedPagoModal.interesInversionistas}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1 bg-emerald-100/50 p-1.5 rounded">
                        <span className="text-emerald-800 font-bold uppercase tracking-wider">Ganancia Real (Neta):</span>
                        <span className="text-emerald-900 font-black">S/ {(parseFloat(selectedPagoModal.concepto === 'Interés' ? selectedPagoModal.montoPagado : selectedPagoModal.interesCobrado) - parseFloat(selectedPagoModal.interesInversionistas)).toFixed(2)}</span>
                      </div>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 px-2">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-bold">Cliente Emitente</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPagoModal.clienteNombre}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-bold">Método / Banco</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> {selectedPagoModal.banco || '-'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-bold">Concepto de Pago</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPagoModal.concepto}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-bold">ID Transacción</p>
                  <p className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">{selectedPagoModal.id.slice(0,10)}</p>
                </div>
                
                {selectedPagoModal.voucher && (
                  <div className="col-span-2 mt-2 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-bold">Comprobante / Voucher</p>
                    <button 
                      onClick={() => openPreview(selectedPagoModal.voucher.name, selectedPagoModal.voucher.data)}
                      className="flex items-center justify-center gap-2 text-sm font-bold text-[#3173c6] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-lg transition-colors w-full sm:w-fit"
                    >
                      <Eye size={18} /> Ver Documento Adjunto
                    </button>
                  </div>
                )}
                {selectedPagoModal.comentario && (
                  <div className="col-span-2 mt-2">
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Comentarios</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{selectedPagoModal.comentario}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end bg-white sm:bg-slate-50">
              <button onClick={() => setIsViewPagoModalOpen(false)} className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-colors">Cerrar Recibo</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Previsualización de Archivos */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-slate-800 truncate pr-4 flex items-center gap-2 text-sm sm:text-base">
                <Eye size={18} className="text-[#3173c6] flex-shrink-0" /> <span className="truncate">{previewModal.name}</span>
              </h3>
              <button onClick={() => setPreviewModal({isOpen: false, name: '', data: null})} className="text-slate-500 hover:text-slate-800 bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition-colors flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
              {previewModal.data ? (
                previewModal.data.startsWith('data:image/') ? (
                  <img src={previewModal.data} alt="Vista Previa" className="max-w-full max-h-full object-contain shadow-lg rounded bg-white" />
                ) : previewModal.data.startsWith('data:application/pdf') ? (
                  <iframe src={previewModal.data} className="w-full h-full rounded shadow-lg border-0 bg-white" title="PDF Preview" />
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center p-8">
                    <FileText size={48} className="mb-3 opacity-50 text-slate-400" />
                    <p className="font-medium text-lg">Vista previa no disponible</p>
                  </div>
                )
              ) : (
                <div className="text-center text-slate-500 flex flex-col items-center bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-slate-200 mx-4">
                  <Cloud size={64} className="mb-4 text-[#3173c6] opacity-80" />
                  <p className="text-lg sm:text-xl font-bold text-slate-700">Archivo antiguo o sin datos</p>
                  <p className="text-sm mt-3 text-slate-500 max-w-md leading-relaxed">Para visualizar este archivo, necesitas volver a subirlo o implementar Firebase Cloud Storage.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Reportes() {
  const user = useContext(UserContext);
  const [prestamos, setPrestamos] = useState([]);
  const [pagosDb, setPagosDb] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const reporteRef = useRef(null);
  
  // Estado para las columnas visibles
  const [visibleColumns, setVisibleColumns] = useState({
    cliente: true,
    saldo: true,
    tasa: true,
    interes: true,
    proximaFecha: true,
    estado: true
  });

  useEffect(() => {
    const presRef = getCollectionRef(user, 'prestamos');
    const pagRef = getCollectionRef(user, 'pagos');
    if(!presRef || !pagRef) return;

    const unsubP = onSnapshot(presRef, snap => setPrestamos(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPag = onSnapshot(pagRef, snap => setPagosDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { unsubP(); unsubPag(); };
  }, [user]);

  // Filtrar los datos con la lógica de estado calculada globalmente
  const prestamosConEstado = prestamos.map(p => ({
    ...p,
    estadoCalculado: getEstadoPrestamo(p)
  }));

  const filteredPrestamos = prestamosConEstado.filter(p => {
    const matchesSearch = p.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || p.estadoCalculado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const calcularInteres = (prestamo) => {
    const m = parseFloat(prestamo.saldo !== undefined ? prestamo.saldo : prestamo.monto || 0);
    const t = parseFloat(prestamo.tasa || 0);
    return (m * (t / 100)).toFixed(2);
  };

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleExportExcel = () => {
    const headers = [];
    if (visibleColumns.cliente) headers.push("Cliente");
    if (visibleColumns.saldo) headers.push("Saldo (S/)");
    if (visibleColumns.tasa) headers.push("Tasa (%)");
    if (visibleColumns.interes) headers.push("Interés (S/)");
    if (visibleColumns.proximaFecha) headers.push("Próx. Fecha");
    if (visibleColumns.estado) headers.push("Estado");

    const rows = filteredPrestamos.map(p => {
      const row = [];
      if (visibleColumns.cliente) row.push(`"${p.clienteNombre || ''}"`);
      if (visibleColumns.saldo) row.push(`"${parseFloat(p.saldo !== undefined ? p.saldo : p.monto).toFixed(2)}"`);
      if (visibleColumns.tasa) row.push(`"${p.tasa}"`);
      if (visibleColumns.interes) row.push(`"${calcularInteres(p)}"`);
      if (visibleColumns.proximaFecha) row.push(`"${p.proximaFechaPago || getFechaUnMesDespues(p.fecha)}"`);
      if (visibleColumns.estado) row.push(`"${p.estadoCalculado}"`);
      return row.join(",");
    });

    const csvString = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_prestamos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[900px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Reporte de Préstamos</h1>
        <button 
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Download size={16} /> Descargar Excel
        </button>
      </div>

      {/* Panel de Filtros y Configuración */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6 mb-6 flex flex-col gap-5">
        
        {/* Barra de Búsqueda y Filtro de Estado */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] bg-slate-50 focus:bg-white transition-all"
            />
          </div>
          <div className="relative w-full md:w-56">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#3173c6] focus:ring-1 focus:ring-[#3173c6] appearance-none bg-slate-50 focus:bg-white text-slate-700 font-bold cursor-pointer transition-all"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Al día">Solo Al día</option>
              <option value="Por vencer">Solo Por vencer</option>
              <option value="Vencido">Solo Vencidos</option>
              <option value="Pagado">Solo Pagados</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Configuración de Columnas */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Settings size={14} className="text-[#3173c6]" />
            Configurar Columnas Visibles
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={visibleColumns.cliente} onChange={() => toggleColumn('cliente')} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer" />
              Cliente
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={visibleColumns.saldo} onChange={() => toggleColumn('saldo')} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer" />
              Saldo
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={visibleColumns.tasa} onChange={() => toggleColumn('tasa')} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer" />
              Tasa
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={visibleColumns.interes} onChange={() => toggleColumn('interes')} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer" />
              Interés
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={visibleColumns.proximaFecha} onChange={() => toggleColumn('proximaFecha')} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer" />
              Próx. Fecha
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={visibleColumns.estado} onChange={() => toggleColumn('estado')} className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer" />
              Estado
            </label>
          </div>
        </div>

      </div>

      <div ref={reporteRef} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                {visibleColumns.cliente && <th className="py-3.5 px-4 sm:px-6">Cliente</th>}
                {visibleColumns.saldo && <th className="py-3.5 px-4 sm:px-6">Saldo</th>}
                {visibleColumns.tasa && <th className="py-3.5 px-4 sm:px-6 text-center">Tasa</th>}
                {visibleColumns.interes && <th className="py-3.5 px-4 sm:px-6">Interés</th>}
                {visibleColumns.proximaFecha && <th className="py-3.5 px-4 sm:px-6">Próx. Fecha</th>}
                {visibleColumns.estado && <th className="py-3.5 px-4 sm:px-6 text-center">Estado</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPrestamos.map((p) => {
                const estado = p.estadoCalculado;
                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {visibleColumns.cliente && <td className="py-3 px-4 sm:px-6 font-medium text-slate-700">{p.clienteNombre}</td>}
                    {visibleColumns.saldo && <td className="py-3 px-4 sm:px-6 font-bold text-slate-800">S/ {parseFloat(p.saldo !== undefined ? p.saldo : p.monto).toFixed(2)}</td>}
                    {visibleColumns.tasa && <td className="py-3 px-4 sm:px-6 text-center text-slate-600">{p.tasa}%</td>}
                    {visibleColumns.interes && <td className="py-3 px-4 sm:px-6 font-bold text-amber-600">S/ {calcularInteres(p)}</td>}
                    {visibleColumns.proximaFecha && <td className="py-3 px-4 sm:px-6 text-slate-600 font-medium">{p.proximaFechaPago || getFechaUnMesDespues(p.fecha)}</td>}
                    {visibleColumns.estado && (
                      <td className="py-3 px-4 sm:px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wide
                          ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-100 text-emerald-800' : 
                            estado === 'Vencido' ? 'bg-rose-100 text-rose-800' : 
                            'bg-amber-100 text-amber-800'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full 
                            ${estado === 'Al día' || estado === 'Pagado' ? 'bg-emerald-600' : 
                              estado === 'Vencido' ? 'bg-rose-600' : 
                              'bg-amber-600'}`}></span>
                          {estado}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredPrestamos.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={32} className="opacity-20" />
                      <p>No se encontraron préstamos que coincidan con los filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReporteSunat() {
  const user = useContext(UserContext);
  const [pagos, setPagos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Establecer fechas por defecto (Mes actual)
  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    setFechaInicio(primerDia);
    setFechaFin(ultimoDia);
  }, []);

  // Obtener los pagos
  useEffect(() => {
    const pagRef = getCollectionRef(user, 'pagos');
    if(!pagRef) return;
    const unsub = onSnapshot(pagRef, snap => setPagos(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsub();
  }, [user]);

  // Filtrar y calcular la data de la tabla
  const pagosFiltrados = pagos.filter(p => {
    if (!p.fechaPago) return false;
    return p.fechaPago >= fechaInicio && p.fechaPago <= fechaFin;
  }).sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago)); 

  let totalGanancia = 0;
  let totalSunat = 0;

  const filas = pagosFiltrados.map(p => {
    const montoRecibido = parseFloat(p.montoPagado || 0);
    let gananciaBruta = 0;

    if (p.concepto === 'Interés') {
      gananciaBruta = montoRecibido;
    } else if (p.concepto === 'Ambos (Interés + Amortización)') {
      gananciaBruta = parseFloat(p.interesCobrado || 0);
    } 

    const interesInv = parseFloat(p.interesInversionistas || 0);
    
    // La ganancia real de la empresa es el interés bruto cobrado menos la tajada del inversor
    const gananciaReal = Math.max(0, gananciaBruta - interesInv);
    const sunat = gananciaReal * 0.05; 

    totalGanancia += gananciaReal;
    totalSunat += sunat;

    return { ...p, montoRecibido, gananciaBruta, interesInv, gananciaReal, sunat };
  });

  const handleExportExcel = () => {
    const headers = ["Fecha de Pago", "Concepto", "Banco", "Monto Recibido (S/)", "Ganancia Bruta (S/)", "Pago Inversor (S/)", "Ganancia Real Neta (S/)", "SUNAT 5% (S/)"];
    const rows = filas.map(f => {
      return [
        `"${f.fechaPago}"`,
        `"${f.concepto}"`,
        `"${f.banco}"`,
        `"${f.montoRecibido.toFixed(2)}"`,
        `"${f.gananciaBruta.toFixed(2)}"`,
        `"${f.interesInv.toFixed(2)}"`,
        `"${f.gananciaReal.toFixed(2)}"`,
        `"${f.sunat.toFixed(2)}"`
      ].join(",");
    });

    rows.push(`"TOTALES","","","","","","${totalGanancia.toFixed(2)}","${totalSunat.toFixed(2)}"`);

    const csvString = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_sunat_${fechaInicio}_al_${fechaFin}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[900px]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700 flex items-center gap-2">
          <Calculator className="text-[#3173c6]" /> Reporte de Impuestos
        </h1>
        <button 
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Download size={16} /> Descargar Excel
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Search size={14}/> Filtrar Rango de Fechas</h3>
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] bg-slate-50 focus:bg-white" />
          </div>
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#3173c6] bg-slate-50 focus:bg-white" />
          </div>
        </div>
      </div>

      {/* Resumen Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
         <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-emerald-700 uppercase font-black tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp size={16}/> Ganancia Real Neta</p>
            <p className="text-3xl font-black text-emerald-800">S/ {totalGanancia.toFixed(2)}</p>
         </div>
         <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <p className="text-xs text-rose-700 uppercase font-black tracking-wider mb-1 flex items-center gap-1.5 relative z-10"><Calculator size={16}/> Total SUNAT (5%) a Pagar</p>
            <p className="text-3xl font-black text-rose-800 relative z-10">S/ {totalSunat.toFixed(2)}</p>
            <Calculator size={80} className="absolute -right-4 -bottom-4 text-rose-200/50" />
         </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 sm:px-6">Fecha de Pago</th>
                <th className="py-3.5 px-4 sm:px-6">Concepto</th>
                <th className="py-3.5 px-4 sm:px-6">Banco</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Monto Recibido</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ganancia Real</th>
                <th className="py-3.5 px-4 sm:px-6 text-right font-black text-rose-700">Impuesto 5%</th>
              </tr>
            </thead>
            <tbody>
              {filas.length > 0 ? (
                filas.map((fila) => (
                  <tr key={fila.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 sm:px-6 text-slate-600 font-medium">{fila.fechaPago}</td>
                    <td className="py-3 px-4 sm:px-6 text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold border border-slate-200">
                        {fila.concepto === 'Ambos (Interés + Amortización)' ? 'Ambos (Int. + Amort.)' : fila.concepto}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-slate-600">{fila.banco}</td>
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-800 text-right">S/ {fila.montoRecibido.toFixed(2)}</td>
                    <td className="py-3 px-4 sm:px-6 text-right">
                      <span className="font-bold text-emerald-600 block leading-tight">S/ {fila.gananciaReal.toFixed(2)}</span>
                      {fila.interesInv > 0 ? (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Bruto: S/ {fila.gananciaBruta.toFixed(2)} | Inv: -S/ {fila.interesInv.toFixed(2)}
                        </span>
                      ) : fila.concepto === 'Ambos (Interés + Amortización)' ? (
                        <span className="text-[10px] text-slate-400 font-medium block">Int: S/ {fila.gananciaBruta.toFixed(2)}</span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 sm:px-6 font-black text-rose-600 text-right bg-rose-50/30">S/ {fila.sunat.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calculator size={32} className="opacity-20" />
                      <p>No se encontraron pagos en el rango seleccionado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
