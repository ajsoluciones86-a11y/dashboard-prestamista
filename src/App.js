import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react";
import {
  Home,
  Users,
  Mail,
  Briefcase,
  Lock,
  Settings,
  Bell,
  Search,
  ChevronDown,
  RefreshCcw,
  Clock,
  PieChart,
  DollarSign,
  TrendingUp,
  BarChart2,
  Activity,
  X,
  Download,
  Check,
  Upload,
  FileText,
  CreditCard,
  Edit2,
  Eye,
  Cloud,
  Calculator,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

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

const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : manualFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const getCollectionRef = (user, colName) => {
  if (typeof __app_id !== "undefined") {
    if (!user) return null;
    return collection(db, "artifacts", __app_id, "users", user.uid, colName);
  }
  return collection(db, colName);
};

const getDocRef = (user, colName, docId) => {
  if (typeof __app_id !== "undefined") {
    if (!user) return null;
    return doc(db, "artifacts", __app_id, "users", user.uid, colName, docId);
  }
  return doc(db, colName, docId);
};

const getConfigRef = (user) => {
  if (typeof __app_id !== "undefined") {
    if (!user) return null;
    return doc(
      db,
      "artifacts",
      __app_id,
      "users",
      user.uid,
      "config",
      "general"
    );
  }
  return doc(db, "config", "general");
};

// Función auxiliar para sumar 1 mes seguro
const getFechaUnMesDespues = (fechaStr) => {
  if (!fechaStr) return "";
  const d = new Date(fechaStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
};

// Lógica Global de Estado de Préstamos
const getEstadoPrestamo = (prestamo) => {
  const saldoActual = parseFloat(
    prestamo.saldo !== undefined ? prestamo.saldo : prestamo.monto
  );
  if (saldoActual <= 0) return "Pagado";

  let fechaVencimiento;
  if (prestamo.proximaFechaPago) {
    fechaVencimiento = new Date(prestamo.proximaFechaPago + "T00:00:00");
  } else if (prestamo.fecha) {
    fechaVencimiento = new Date(prestamo.fecha + "T00:00:00");
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
  } else {
    return "Al día";
  }

  if (isNaN(fechaVencimiento.getTime())) return "Al día";

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffTime = fechaVencimiento.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Vencido"; // Ya pasó el día de pago
  if (diffDays <= 3) return "Por vencer"; // Faltan 3 días o es hoy (diffDays === 0)
  return "Al día"; // Faltan más de 3 días
};

const UserContext = createContext(null);

// ============================================================================
// APP PRINCIPAL
// ============================================================================
export default function App() {
  const [currentView, setCurrentView] = useState("inicio");
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
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

  return (
    <UserContext.Provider value={user}>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
        <aside className="w-[220px] bg-[#316cb6] text-white flex flex-col shadow-xl z-10">
          <div className="p-4 flex items-center gap-3 border-b border-[#407ac2]">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#316cb6] flex-shrink-0 shadow-sm">
              <Activity size={18} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] tracking-wide leading-tight">
                A&J Soluciones
              </span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider font-medium">
                Panel de Control
              </span>
            </div>
          </div>

          <nav className="flex-1 py-4">
            <SidebarItem
              icon={<Home size={18} />}
              label="Inicio"
              isActive={currentView === "inicio"}
              onClick={() => setCurrentView("inicio")}
            />
            <SidebarItem
              icon={<Users size={18} />}
              label="Clientes"
              isActive={currentView === "clientes"}
              onClick={() => setCurrentView("clientes")}
            />
            <SidebarItem
              icon={<Mail size={18} />}
              label="Préstamos"
              isActive={currentView === "prestamos"}
              onClick={() => setCurrentView("prestamos")}
            />
            <SidebarItem
              icon={<CreditCard size={18} />}
              label="Pagos"
              isActive={currentView === "pagos"}
              onClick={() => setCurrentView("pagos")}
            />
            <SidebarItem
              icon={<Briefcase size={18} />}
              label="Inversionistas"
              isActive={currentView === "inversionistas"}
              onClick={() => setCurrentView("inversionistas")}
            />
            <SidebarItem
              icon={<Lock size={18} />}
              label="Reportes"
              isActive={currentView === "reportes"}
              onClick={() => setCurrentView("reportes")}
            />
            <SidebarItem
              icon={<Calculator size={18} />}
              label="SUNAT"
              isActive={currentView === "sunat"}
              onClick={() => setCurrentView("sunat")}
            />
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

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-4xl mx-auto">
            {currentView === "inicio" && <DashboardPrincipal />}
            {currentView === "clientes" && <ListadoClientes />}
            {currentView === "prestamos" && <ListadoPrestamos />}
            {currentView === "inversionistas" && <ListadoInversionistas />}
            {currentView === "pagos" && <Pagos />}
            {currentView === "reportes" && <Reportes />}
            {currentView === "sunat" && <ReporteSunat />}
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
        isActive
          ? "bg-[#295c9e] border-l-4 border-white"
          : "hover:bg-[#3876c4] border-l-4 border-transparent"
      }`}
    >
      <span className={isActive ? "text-white" : "text-blue-100"}>{icon}</span>
      <span
        className={`text-sm ${
          isActive ? "font-medium text-white" : "text-blue-100"
        }`}
      >
        {label}
      </span>
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
  const [capitalInput, setCapitalInput] = useState("");
  const [capitalInversionistas, setCapitalInversionistas] = useState(0);
  const [capitalPrestado, setCapitalPrestado] = useState(0);
  const [prestamosDb, setPrestamosDb] = useState([]);
  const [interesesACobrar, setInteresesACobrar] = useState(0);
  const [gananciaMes, setGananciaMes] = useState(0);
  const [clientesNuevos, setClientesNuevos] = useState(0);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);

  useEffect(() => {
    const confRef = getConfigRef(user);
    const invRef = getCollectionRef(user, "inversionistas");
    const presRef = getCollectionRef(user, "prestamos");
    const cliRef = getCollectionRef(user, "clientes");
    const pagRef = getCollectionRef(user, "pagos");

    if (!confRef || !invRef || !presRef || !cliRef || !pagRef) return;

    const unsubConfig = onSnapshot(confRef, (docSnap) => {
      if (docSnap.exists()) {
        setCapitalPropio(parseFloat(docSnap.data().capitalPropio || 0));
        setCapitalInput(docSnap.data().capitalPropio || "");
      }
    });

    const unsubInv = onSnapshot(invRef, (snap) => {
      setCapitalInversionistas(
        snap.docs.reduce(
          (sum, doc) => sum + parseFloat(doc.data().monto || 0),
          0
        )
      );
    });

    const unsubPres = onSnapshot(presRef, (snap) => {
      const data = snap.docs.map((doc) => doc.data());
      setPrestamosDb(data);
      setCapitalPrestado(
        data.reduce(
          (sum, d) =>
            sum + parseFloat(d.saldo !== undefined ? d.saldo : d.monto || 0),
          0
        )
      );
      setInteresesACobrar(
        data.reduce((sum, d) => {
          const saldo = parseFloat(
            d.saldo !== undefined ? d.saldo : d.monto || 0
          );
          return sum + saldo * (parseFloat(d.tasa || 0) / 100);
        }, 0)
      );
    });

    const unsubClientes = onSnapshot(cliRef, (snap) =>
      setClientesNuevos(snap.docs.length)
    );

    const unsubPagos = onSnapshot(pagRef, (snap) => {
      const data = snap.docs.map((doc) => doc.data());
      setGananciaMes(
        data.reduce((sum, d) => {
          if (
            d.concepto === "Interés" ||
            d.concepto === "Ambos (Interés + Amortización)"
          ) {
            return sum + parseFloat(d.interesCobrado || d.montoPagado || 0);
          }
          return sum;
        }, 0)
      );
    });

    return () => {
      unsubConfig();
      unsubInv();
      unsubPres();
      unsubClientes();
      unsubPagos();
    };
  }, [user]);

  const handleSaveCapital = async () => {
    setIsEditingCapital(false);
    const val = parseFloat(capitalInput) || 0;
    const confRef = getConfigRef(user);
    if (!confRef) return;
    await setDoc(confRef, { capitalPropio: val }, { merge: true });
  };

  const capitalDisponible =
    capitalPropio + capitalInversionistas - capitalPrestado;
  const prestamosActivos = prestamosDb.filter(
    (p) => parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0
  ).length;
  const cuotasVencidas = prestamosDb.filter(
    (p) => getEstadoPrestamo(p) === "Vencido"
  ).length;

  return (
    <div className="w-full max-w-[480px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold text-slate-800">
          Dashboard Principal
        </h1>
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <Bell size={16} />
          <span className="ml-1">Panel Activo</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-[#46ca6e] rounded shadow-sm p-4 text-white relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10">
            <div className="text-xs font-medium mb-1 opacity-90 flex items-center gap-1">
              Capital Propio
              {!isEditingCapital && (
                <Edit2
                  size={12}
                  className="cursor-pointer hover:opacity-70 ml-1"
                  onClick={() => {
                    setIsEditingCapital(true);
                    setCapitalInput(capitalPropio);
                  }}
                />
              )}
            </div>
            <div className="text-2xl font-bold flex items-center gap-1">
              <span className="text-lg">S/</span>
              {isEditingCapital ? (
                <input
                  type="number"
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  onBlur={handleSaveCapital}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveCapital()}
                  autoFocus
                  className="bg-white text-slate-800 text-lg p-0.5 rounded w-24 outline-none"
                />
              ) : (
                <span
                  onClick={() => setIsEditingCapital(true)}
                  className="cursor-pointer"
                >
                  {formatCurrency(capitalPropio)}
                </span>
              )}
            </div>
          </div>
          <TrendingUp
            className="absolute -right-2 -bottom-2 opacity-20"
            size={64}
          />
        </div>

        <div className="bg-[#2f78d4] rounded shadow-sm p-4 text-white relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10">
            <div className="text-xs font-medium mb-1 opacity-90">
              Capital Inversionistas
            </div>
            <div className="text-2xl font-bold">
              S/ {formatCurrency(capitalInversionistas)}
            </div>
          </div>
          <BarChart2
            className="absolute right-0 bottom-0 opacity-20"
            size={60}
          />
        </div>

        <div className="bg-[#f24e4e] rounded shadow-sm p-4 text-white relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10">
            <div className="text-xs font-medium mb-1 opacity-90">
              Capital Prestado (Activo)
            </div>
            <div className="text-2xl font-bold">
              S/ {formatCurrency(capitalPrestado)}
            </div>
          </div>
          <Activity
            className="absolute -right-2 -bottom-2 opacity-20"
            size={64}
          />
        </div>

        <div className="bg-[#f69d35] rounded shadow-sm p-4 text-white relative overflow-hidden h-24 flex flex-col justify-center">
          <div className="relative z-10">
            <div className="text-xs font-medium mb-1 opacity-90">
              Disponible
            </div>
            <div className="text-2xl font-bold">
              S/ {formatCurrency(capitalDisponible)}
            </div>
          </div>
          <BarChart2
            className="absolute right-2 -bottom-4 opacity-20"
            size={64}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#46ca6e] rounded shadow-sm p-3 text-white flex items-center gap-3">
          <RefreshCcw size={28} className="opacity-80" />
          <div className="leading-tight">
            <div className="text-[11px] opacity-90">Préstamos Activos</div>
            <div className="text-lg font-bold">{prestamosActivos}</div>
          </div>
        </div>
        <div className="bg-[#f24e4e] rounded shadow-sm p-3 text-white flex items-center gap-3">
          <Clock size={28} className="opacity-80" />
          <div className="leading-tight">
            <div className="text-[11px] opacity-90">Cuotas Vencidas</div>
            <div className="text-lg font-bold">{cuotasVencidas}</div>
          </div>
        </div>
        <div className="bg-[#2f78d4] rounded shadow-sm p-3 text-white flex items-center gap-3">
          <PieChart size={28} className="opacity-80" />
          <div className="leading-tight">
            <div className="text-[11px] opacity-90">Cobrará Este Mes</div>
            <div className="text-lg font-bold">
              S/ {formatCurrency(interesesACobrar)}
            </div>
          </div>
        </div>
        <div className="bg-[#f69d35] rounded shadow-sm p-3 text-white flex items-center gap-3">
          <DollarSign size={28} className="opacity-80" />
          <div className="leading-tight">
            <div className="text-[11px] opacity-90">Ganancia del Mes</div>
            <div className="text-lg font-bold">
              S/ {formatCurrency(gananciaMes)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700 text-sm">
          Resumen Mensual
        </div>
        <div className="p-4 flex flex-col gap-3 text-sm text-slate-600">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <span>Total Prestado (Actual)</span>
            <span className="font-semibold text-slate-800">
              S/ {formatCurrency(capitalPrestado)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <span>Total Cobrado (Ganancia)</span>
            <span className="font-semibold text-slate-800">
              S/ {formatCurrency(gananciaMes)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <span>Intereses Por Cobrar</span>
            <span className="font-semibold text-slate-800">
              S/ {formatCurrency(interesesACobrar)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Clientes Registrados</span>
            <span className="font-semibold text-slate-800">
              {clientesNuevos}
            </span>
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
  const [searchTerm, setSearchTerm] = useState("");

  const [clients, setClients] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    direccion: "",
    banco: "",
    cuenta: "",
  });

  useEffect(() => {
    const cliRef = getCollectionRef(user, "clientes");
    const presRef = getCollectionRef(user, "prestamos");
    if (!cliRef || !presRef) return;

    const unsubC = onSnapshot(cliRef, (snapshot) => {
      setClients(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubP = onSnapshot(presRef, (snapshot) => {
      setPrestamos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubC();
      unsubP();
    };
  }, [user]);

  const handleGuardarCliente = async () => {
    if (!form.nombre || !form.telefono)
      return alert("Nombre y teléfono son obligatorios");
    setIsSaving(true);
    try {
      if (editingClientId) {
        const docRef = getDocRef(user, "clientes", editingClientId);
        await updateDoc(docRef, { ...form });
      } else {
        const cliRef = getCollectionRef(user, "clientes");
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
    setForm({
      nombre: "",
      dni: "",
      telefono: "",
      direccion: "",
      banco: "",
      cuenta: "",
    });
  };

  const openNewClient = () => {
    setForm({
      nombre: "",
      dni: "",
      telefono: "",
      direccion: "",
      banco: "",
      cuenta: "",
    });
    setEditingClientId(null);
    setIsModalOpen(true);
  };

  const openEditClient = (client) => {
    setForm({
      nombre: client.nombre || "",
      dni: client.dni || "",
      telefono: client.telefono || "",
      direccion: client.direccion || "",
      banco: client.banco || "",
      cuenta: client.cuenta || "",
    });
    setEditingClientId(client.id);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(
    (client) =>
      (client.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.dni || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (String(client.telefono) || "").includes(searchTerm)
  );

  const getClientLoans = (clientId) =>
    prestamos.filter((p) => p.clienteId === clientId);

  return (
    <div className="w-full max-w-[700px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-700">
          Listado de Clientes
        </h1>
        <button
          onClick={openNewClient}
          className="bg-[#3173c6] hover:bg-[#2860a8] text-white text-sm px-4 py-2 rounded shadow-sm flex items-center gap-1 transition-colors"
        >
          <span>+</span> Nuevo Cliente
        </button>
      </div>

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, DNI o teléfono..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-400 shadow-sm bg-white"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">DNI</th>
              <th className="py-3 px-4">Teléfono</th>
              <th className="py-3 px-4 text-center">Préstamos Activos</th>
              <th className="py-3 px-4 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const activeLoansCount = getClientLoans(client.id).filter(
                  (p) =>
                    parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0
                ).length;
                return (
                  <tr
                    key={client.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {client.nombre}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {client.dni || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {client.telefono}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {activeLoansCount}
                    </td>
                    <td className="py-3 px-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => openEditClient(client)}
                        className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setIsViewModalOpen(true);
                        }}
                        className="bg-[#3173c6] text-white text-xs px-3 py-1.5 rounded hover:bg-[#2860a8] transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo/Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editingClientId ? "Editar Cliente" : "Registrar Nuevo Cliente"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                    placeholder="Ej. 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                    placeholder="Ej. 987 654 321"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) =>
                    setForm({ ...form, direccion: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  placeholder="Ej. Av. Principal 123, Ciudad"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Banco
                  </label>
                  <div className="relative">
                    <select
                      value={form.banco}
                      onChange={(e) =>
                        setForm({ ...form, banco: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white appearance-none transition-shadow"
                    >
                      <option value="">Seleccione...</option>
                      <option>BCP</option>
                      <option>Interbank</option>
                      <option>BBVA</option>
                      <option>Scotiabank</option>
                      <option>BanBif</option>
                      <option>Otro</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Nro. de Cuenta
                  </label>
                  <input
                    type="text"
                    value={form.cuenta}
                    onChange={(e) =>
                      setForm({ ...form, cuenta: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                    placeholder="Ej. 191-1234567-0-00"
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCliente}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded shadow-sm transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <RefreshCcw size={16} className="animate-spin" />
                ) : editingClientId ? (
                  "Actualizar Cliente"
                ) : (
                  "Guardar Cliente"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                Detalles de Préstamos - {selectedClient.nombre}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
              {(() => {
                const clientLoans = getClientLoans(selectedClient.id);
                const activeLoansCount = clientLoans.filter(
                  (p) =>
                    parseFloat(p.saldo !== undefined ? p.saldo : p.monto) > 0
                ).length;
                return (
                  <>
                    <div className="mb-5 flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                          Préstamos Activos
                        </p>
                        <p className="font-bold text-slate-800 text-2xl">
                          {activeLoansCount}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                          Saldo Deudor Total
                        </p>
                        <p className="font-bold text-[#3173c6] text-2xl">
                          {new Intl.NumberFormat("es-PE", {
                            style: "currency",
                            currency: "PEN",
                          }).format(
                            clientLoans.reduce(
                              (acc, loan) =>
                                acc +
                                parseFloat(
                                  loan.saldo !== undefined
                                    ? loan.saldo
                                    : loan.monto || 0
                                ),
                              0
                            )
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      {clientLoans.length === 0 ? (
                        <p className="text-center text-slate-500 py-4 bg-white rounded border border-slate-200">
                          Este cliente no tiene préstamos registrados.
                        </p>
                      ) : (
                        clientLoans.map((loan) => {
                          const estado = getEstadoPrestamo(loan);
                          return (
                            <div
                              key={loan.id}
                              className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                                <h3 className="font-bold text-[#3173c6]">
                                  Préstamo (ID: {loan.id.slice(0, 6)})
                                </h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium uppercase tracking-wide
                                  ${
                                    estado === "Al día" || estado === "Pagado"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : estado === "Vencido"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full 
                                    ${
                                      estado === "Al día" || estado === "Pagado"
                                        ? "bg-emerald-600"
                                        : estado === "Vencido"
                                        ? "bg-rose-600"
                                        : "bg-amber-600"
                                    }`}
                                  ></span>
                                  {estado}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4">
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                                    Monto Prestado
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    S/ {loan.monto}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                                    Saldo Pendiente
                                  </p>
                                  <p className="text-sm font-bold text-rose-600">
                                    S/{" "}
                                    {loan.saldo !== undefined
                                      ? loan.saldo
                                      : loan.monto}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                                    Interés Mensual
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {loan.tasa}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                                    Próximo Pago
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {loan.proximaFechaPago ||
                                      getFechaUnMesDespues(loan.fecha)}
                                  </p>
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
            <div className="p-5 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded shadow-sm transition-colors"
              >
                Cerrar
              </button>
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
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    fecha: "",
    clienteId: "",
    monto: "",
    tasa: "",
    cuotas: "12",
  });

  const [financingSources, setFinancingSources] = useState(["propio"]);
  const [isCuotaFija, setIsCuotaFija] = useState(true);
  const [montoCuota, setMontoCuota] = useState("");

  const [selectedBanks, setSelectedBanks] = useState([]);
  const [bankAmounts, setBankAmounts] = useState({});
  const [bankVouchers, setBankVouchers] = useState({});
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const availableBanks = [
    "Efectivo",
    "BCP",
    "Interbank",
    "BBVA",
    "Scotiabank",
    "BanBif",
    "Yape / Plin",
    "Otro",
  ];

  const [selectedInvestors, setSelectedInvestors] = useState([]);
  const [investorAmounts, setInvestorAmounts] = useState({});
  const [isInvestorDropdownOpen, setIsInvestorDropdownOpen] = useState(false);

  const [documentStatus, setDocumentStatus] = useState("No Firmado");
  const [documentFile, setDocumentFile] = useState(null);
  const [comments, setComments] = useState("");

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    name: "",
    data: null,
  });

  useEffect(() => {
    const cliRef = getCollectionRef(user, "clientes");
    const invRef = getCollectionRef(user, "inversionistas");
    const presRef = getCollectionRef(user, "prestamos");
    if (!cliRef || !invRef || !presRef) return;

    const unsubC = onSnapshot(cliRef, (snap) =>
      setClientsDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubI = onSnapshot(invRef, (snap) =>
      setInvestorsDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubP = onSnapshot(presRef, (snap) =>
      setPrestamosDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubC();
      unsubI();
      unsubP();
    };
  }, [user]);

  const toggleFinancingSource = (source) => {
    if (financingSources.includes(source)) {
      setFinancingSources(financingSources.filter((s) => s !== source));
    } else {
      setFinancingSources([...financingSources, source]);
    }
  };

  const toggleBank = (bank) => {
    if (selectedBanks.includes(bank)) {
      setSelectedBanks(selectedBanks.filter((b) => b !== bank));
      const newAmounts = { ...bankAmounts };
      delete newAmounts[bank];
      setBankAmounts(newAmounts);
      const newVouchers = { ...bankVouchers };
      delete newVouchers[bank];
      setBankVouchers(newVouchers);
    } else {
      setSelectedBanks([...selectedBanks, bank]);
    }
  };

  const toggleInvestor = (invId) => {
    if (selectedInvestors.includes(invId)) {
      setSelectedInvestors(selectedInvestors.filter((i) => i !== invId));
      const newAmounts = { ...investorAmounts };
      delete newAmounts[invId];
      setInvestorAmounts(newAmounts);
    } else {
      setSelectedInvestors([...selectedInvestors, invId]);
    }
  };

  const handleBankAmountChange = (bank, amount) =>
    setBankAmounts({ ...bankAmounts, [bank]: amount });
  const handleAmountChange = (investor, amount) =>
    setInvestorAmounts({ ...investorAmounts, [investor]: amount });

  const handleBankVoucherUpload = (bank, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800000)
      return alert("El archivo es demasiado grande (máx 800KB).");
    const reader = new FileReader();
    reader.onloadend = () => {
      setBankVouchers((prev) => ({
        ...prev,
        [bank]: { name: file.name, data: reader.result },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800000)
      return alert("El archivo es demasiado grande (máx 800KB).");
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
    setForm({ fecha: "", clienteId: "", monto: "", tasa: "", cuotas: "12" });
    setFinancingSources(["propio"]);
    setIsCuotaFija(true);
    setMontoCuota("");
    setBankAmounts({});
    setBankVouchers({});
    setSelectedBanks([]);
    setInvestorAmounts({});
    setSelectedInvestors([]);
    setComments("");
    setDocumentStatus("No Firmado");
    setDocumentFile(null);
  };

  const openNewLoan = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const openEditLoan = (loan) => {
    setForm({
      fecha: loan.fecha || "",
      clienteId: loan.clienteId || "",
      monto: loan.monto || "",
      tasa: loan.tasa || "",
      cuotas: loan.cuotas || "12",
    });
    setFinancingSources(loan.financingSources || ["propio"]);
    setIsCuotaFija(loan.isCuotaFija !== undefined ? loan.isCuotaFija : true);
    setMontoCuota(loan.montoCuota || "");
    setSelectedBanks(loan.selectedBanks || []);
    setBankAmounts(loan.bankAmounts || {});
    setBankVouchers(loan.bankVouchers || {});
    setSelectedInvestors(loan.selectedInvestors || []);
    setInvestorAmounts(loan.investorAmounts || {});
    setDocumentStatus(loan.documentStatus || "No Firmado");
    setDocumentFile(loan.documentFile || null);
    setComments(loan.comments || "");

    setEditingLoanId(loan.id);
    setIsModalOpen(true);
  };

  const handleGuardarPrestamo = async () => {
    if (!form.clienteId || !form.monto || !form.fecha)
      return alert("Seleccione cliente, fecha y monto");
    setIsSaving(true);
    try {
      const clienteData = clientsDb.find((c) => c.id === form.clienteId);

      const payload = {
        ...form,
        clienteNombre: clienteData ? clienteData.nombre : "Desconocido",
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
        comments,
      };

      if (editingLoanId) {
        const docRef = getDocRef(user, "prestamos", editingLoanId);
        await updateDoc(docRef, payload);
      } else {
        const presRef = getCollectionRef(user, "prestamos");
        const proximaFecha = getFechaUnMesDespues(form.fecha);
        await addDoc(presRef, {
          ...payload,
          saldo: form.monto,
          proximaFechaPago: proximaFecha,
          createdAt: serverTimestamp(),
        });
      }
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPrestamos = prestamosDb.filter((p) =>
    (p.clienteNombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-[800px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-700">
          Listado de Préstamos
        </h1>
        <button
          onClick={openNewLoan}
          className="bg-[#3173c6] hover:bg-[#2860a8] text-white text-sm px-4 py-2 rounded shadow-sm flex items-center gap-1 transition-colors"
        >
          <span>+</span> Nuevo Préstamo
        </button>
      </div>

      <div className="relative mb-6 max-w-[400px]">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-400 shadow-sm bg-white"
        />
      </div>

      {/* Tabla de Préstamos */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-3 px-4 w-28">Creación</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Saldo / Orig</th>
              <th className="py-3 px-4">Próx. Pago</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 w-20">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrestamos.length > 0 ? (
              filteredPrestamos.map((p) => {
                const estado = getEstadoPrestamo(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-600">
                      {p.fecha || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.clienteNombre}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 font-semibold">
                        S/{" "}
                        {parseFloat(
                          p.saldo !== undefined ? p.saldo : p.monto
                        ).toFixed(2)}
                      </span>
                      <br />
                      <span className="text-[10px] text-slate-400">
                        Orig: S/ {p.monto}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {p.proximaFechaPago || getFechaUnMesDespues(p.fecha)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wide
                        ${
                          estado === "Al día" || estado === "Pagado"
                            ? "bg-emerald-100 text-emerald-800"
                            : estado === "Vencido"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full 
                          ${
                            estado === "Al día" || estado === "Pagado"
                              ? "bg-emerald-600"
                              : estado === "Vencido"
                              ? "bg-rose-600"
                              : "bg-amber-600"
                          }`}
                        ></span>
                        {estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditLoan(p)}
                        className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No hay préstamos registrados o que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario de Préstamo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingLoanId ? "Editar Préstamo" : "Nuevo Préstamo"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-1">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3">
                  Fecha Inicio:
                </label>
                <div className="w-2/3">
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm({ ...form, fecha: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-400 transition-shadow"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3">Cliente:</label>
                <div className="w-2/3 relative">
                  <select
                    value={form.clienteId}
                    onChange={(e) =>
                      setForm({ ...form, clienteId: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 bg-white appearance-none focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Seleccione un cliente...</option>
                    {clientsDb.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3">
                  Monto Original
                </label>
                <div className="w-2/3 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">
                    S/
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.monto}
                    onChange={(e) =>
                      setForm({ ...form, monto: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2 pl-8 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3">
                  Tasa de Interés (%)
                </label>
                <div className="w-2/3">
                  <input
                    type="number"
                    placeholder="Ej. 15"
                    value={form.tasa}
                    onChange={(e) => setForm({ ...form, tasa: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3">
                  Número de Cuotas
                </label>
                <div className="w-2/3 relative">
                  <select
                    value={form.cuotas}
                    onChange={(e) =>
                      setForm({ ...form, cuotas: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm text-slate-800 text-right font-medium bg-white appearance-none focus:outline-none focus:border-blue-400 pr-8"
                  >
                    {[...Array(36)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3 mt-1.5">
                  Tipo de Cuota:
                </label>
                <div className="w-2/3 flex flex-col gap-3">
                  <div
                    className={`inline-flex items-center gap-2 border rounded px-3 py-1.5 w-fit cursor-pointer transition-colors select-none ${
                      isCuotaFija
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-300 bg-white hover:bg-slate-50"
                    }`}
                    onClick={() => setIsCuotaFija(!isCuotaFija)}
                  >
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                        isCuotaFija
                          ? "bg-[#3173c6] text-white"
                          : "bg-slate-400 text-white"
                      }`}
                    >
                      FIJA
                    </span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        isCuotaFija
                          ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]"
                          : "bg-slate-300"
                      }`}
                    ></div>
                  </div>
                  {isCuotaFija && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <span className="text-xs font-medium text-slate-500">
                        Monto por cuota:
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          value={montoCuota}
                          onChange={(e) => setMontoCuota(e.target.value)}
                          placeholder="0.00"
                          className="w-28 border border-slate-300 rounded p-1.5 pl-7 text-sm text-right font-semibold text-slate-800 focus:outline-none focus:border-[#3173c6] transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3 mt-2">
                  Banco(s):
                </label>
                <div className="w-2/3 relative">
                  <div
                    className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 bg-white min-h-[38px] flex flex-wrap gap-1.5 cursor-pointer items-center pr-8"
                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                  >
                    {selectedBanks.length === 0 && (
                      <span className="text-slate-400 py-0.5">
                        Seleccione método...
                      </span>
                    )}
                    {selectedBanks.map((bank) => (
                      <span
                        key={bank}
                        className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                      >
                        {bank}
                        <X
                          size={12}
                          className="cursor-pointer hover:text-slate-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBank(bank);
                          }}
                        />
                      </span>
                    ))}
                    <ChevronDown
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                  {isBankDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-auto">
                      {availableBanks.map((bank) => (
                        <label
                          key={bank}
                          className="flex items-center gap-2 p-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 m-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBanks.includes(bank)}
                            onChange={() => toggleBank(bank)}
                            className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6]"
                          />
                          {bank}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedBanks.length > 0 && (
                <div className="flex justify-end pb-3 border-b border-slate-100">
                  <div className="w-2/3 flex flex-col gap-2">
                    {selectedBanks.map((bank) => {
                      const voucherObj = bankVouchers[bank];
                      const vName = voucherObj
                        ? typeof voucherObj === "string"
                          ? voucherObj
                          : voucherObj.name
                        : null;
                      const vData =
                        voucherObj && typeof voucherObj !== "string"
                          ? voucherObj.data
                          : null;

                      return (
                        <div
                          key={bank}
                          className="flex flex-col gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded shadow-sm animate-in fade-in slide-in-from-top-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700 font-medium">
                              {bank}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-medium">
                                S/
                              </span>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={bankAmounts[bank] || ""}
                                onChange={(e) =>
                                  handleBankAmountChange(bank, e.target.value)
                                }
                                className="w-24 border border-slate-300 rounded p-1 text-sm text-right font-semibold text-slate-800 focus:outline-none focus:border-[#3173c6]"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
                            <span className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                              Voucher
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="relative overflow-hidden inline-block">
                                <button className="text-[11px] bg-white border border-slate-300 hover:bg-slate-100 px-2 py-1 rounded text-slate-600 flex items-center gap-1 cursor-pointer max-w-[120px] truncate">
                                  <Upload size={10} className="flex-shrink-0" />
                                  <span className="truncate">
                                    {vName || "Subir archivo"}
                                  </span>
                                </button>
                                <input
                                  type="file"
                                  onChange={(e) =>
                                    handleBankVoucherUpload(bank, e)
                                  }
                                  className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full"
                                />
                              </div>
                              {vName && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openPreview(vName, vData);
                                  }}
                                  className="text-[#3173c6] hover:bg-blue-50 p-1 rounded border border-blue-100"
                                  title="Ver voucher"
                                >
                                  <Eye size={12} />
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

              <div className="flex flex-col py-3 border-b border-slate-100 gap-3 transition-all">
                <label className="text-sm text-slate-600">Financiar con:</label>
                <div className="flex items-center gap-8 pl-4">
                  <label
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    onClick={() => toggleFinancingSource("propio")}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        financingSources.includes("propio")
                          ? "bg-[#3173c6] border-[#3173c6]"
                          : "border-slate-300"
                      }`}
                    >
                      {financingSources.includes("propio") && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    Capital Propio
                  </label>
                  <label
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    onClick={() => toggleFinancingSource("inversionista")}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        financingSources.includes("inversionista")
                          ? "bg-[#3173c6] border-[#3173c6]"
                          : "border-slate-300"
                      }`}
                    >
                      {financingSources.includes("inversionista") && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    Inversionista
                  </label>
                </div>

                {financingSources.includes("inversionista") && (
                  <div className="mt-2 pl-4 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start justify-between">
                      <label className="text-sm text-slate-600 w-1/3 mt-2">
                        Inversionistas:
                      </label>
                      <div className="w-2/3 relative">
                        <div
                          className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 bg-white min-h-[38px] flex flex-wrap gap-1.5 cursor-pointer items-center pr-8"
                          onClick={() =>
                            setIsInvestorDropdownOpen(!isInvestorDropdownOpen)
                          }
                        >
                          {selectedInvestors.length === 0 && (
                            <span className="text-slate-400 py-0.5">
                              Seleccione inversionistas...
                            </span>
                          )}
                          {selectedInvestors.map((invId) => {
                            const inv = investorsDb.find((i) => i.id === invId);
                            return (
                              <span
                                key={invId}
                                className="bg-blue-50 border border-blue-200 text-[#3173c6] px-2 py-0.5 rounded text-xs flex items-center gap-1"
                              >
                                {inv ? inv.nombre : invId}
                                <X
                                  size={12}
                                  className="cursor-pointer hover:text-blue-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleInvestor(invId);
                                  }}
                                />
                              </span>
                            );
                          })}
                          <ChevronDown
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                            size={16}
                          />
                        </div>
                        {isInvestorDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-auto">
                            {investorsDb.length === 0 && (
                              <p className="p-2 text-xs text-slate-500">
                                No hay inversionistas registrados.
                              </p>
                            )}
                            {investorsDb.map((inv) => (
                              <label
                                key={inv.id}
                                className="flex items-center gap-2 p-2.5 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 m-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedInvestors.includes(inv.id)}
                                  onChange={() => toggleInvestor(inv.id)}
                                  className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6]"
                                />
                                {inv.nombre}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedInvestors.length > 0 && (
                      <div className="flex justify-end mt-3">
                        <div className="w-2/3 flex flex-col gap-2">
                          {selectedInvestors.map((invId) => {
                            const inv = investorsDb.find((i) => i.id === invId);
                            return (
                              <div
                                key={invId}
                                className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-2.5 rounded shadow-sm animate-in fade-in slide-in-from-top-1"
                              >
                                <span className="text-sm text-slate-700 font-medium">
                                  {inv ? inv.nombre : invId}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-500 font-medium">
                                    S/
                                  </span>
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    value={investorAmounts[invId] || ""}
                                    onChange={(e) =>
                                      handleAmountChange(invId, e.target.value)
                                    }
                                    className="w-24 border border-slate-300 rounded p-1 text-sm text-right font-semibold text-slate-800 focus:outline-none focus:border-[#3173c6]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between py-3 border-b border-slate-100">
                <label className="text-sm text-slate-600 w-1/3 mt-2">
                  Documento:
                </label>
                <div className="w-2/3 flex flex-col gap-3">
                  <div className="relative">
                    <select
                      value={documentStatus}
                      onChange={(e) => setDocumentStatus(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 bg-white appearance-none focus:outline-none focus:border-blue-400"
                    >
                      <option value="No Firmado">No Firmado</option>
                      <option value="Firmado">Firmado</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <div className="relative overflow-hidden inline-block flex-1">
                      <div className="w-full border border-dashed border-slate-300 rounded p-2.5 text-center text-sm text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white">
                        <FileText size={16} />
                        <span className="truncate max-w-[200px]">
                          {documentFile
                            ? typeof documentFile === "string"
                              ? documentFile
                              : documentFile.name
                            : "Adjuntar documento"}
                        </span>
                      </div>
                      <input
                        type="file"
                        onChange={handleDocumentUpload}
                        className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    {documentFile && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const dName =
                            typeof documentFile === "string"
                              ? documentFile
                              : documentFile.name;
                          const dData =
                            typeof documentFile === "string"
                              ? null
                              : documentFile.data;
                          openPreview(dName, dData);
                        }}
                        className="flex items-center justify-center text-[#3173c6] hover:bg-blue-50 p-2.5 rounded border border-blue-100 flex-shrink-0"
                        title="Ver documento"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col py-3 pb-8 gap-2">
                <label className="text-sm text-slate-600">Comentarios:</label>
                <textarea
                  rows="2"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Observaciones o notas adicionales sobre el préstamo..."
                  className="w-full border border-slate-300 rounded p-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none text-slate-700 bg-white"
                ></textarea>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 mt-auto">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPrestamo}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded shadow-sm transition-colors flex gap-2 items-center"
              >
                {isSaving ? (
                  <RefreshCcw size={16} className="animate-spin" />
                ) : editingLoanId ? (
                  "Actualizar"
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Previsualización de Archivos */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 truncate pr-4 flex items-center gap-2">
                <Eye size={18} className="text-[#3173c6]" /> {previewModal.name}
              </h3>
              <button
                onClick={() =>
                  setPreviewModal({ isOpen: false, name: "", data: null })
                }
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 rounded p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 overflow-auto relative">
              {previewModal.data ? (
                previewModal.data.startsWith("data:image/") ? (
                  <img
                    src={previewModal.data}
                    alt="Vista Previa"
                    className="max-w-full max-h-full object-contain shadow-md rounded"
                  />
                ) : previewModal.data.startsWith("data:application/pdf") ? (
                  <iframe
                    src={previewModal.data}
                    className="w-full h-full rounded shadow-md border-0 bg-white"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                    <FileText
                      size={48}
                      className="mb-3 opacity-50 text-slate-400"
                    />
                    <p className="font-medium">
                      Vista previa no disponible directamente aquí.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center text-slate-500 flex flex-col items-center bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                  <Cloud size={56} className="mb-4 text-[#3173c6] opacity-80" />
                  <p className="text-lg">
                    El archivo <strong>{previewModal.name}</strong> es antiguo o
                    no tiene datos incrustados.
                  </p>
                  <p className="text-sm mt-2 text-slate-400 max-w-md">
                    Para ver este archivo, necesitas volver a subirlo y
                    guardarlo en modo edición.
                  </p>
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
  const [pagosDb, setPagosDb] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    fecha: "",
    direccion: "",
    monto: "",
    tasa: "",
    banco: "",
  });

  useEffect(() => {
    const invRef = getCollectionRef(user, "inversionistas");
    const presRef = getCollectionRef(user, "prestamos");
    const pagRef = getCollectionRef(user, "pagos");
    if (!invRef || !presRef || !pagRef) return;

    const unsubI = onSnapshot(invRef, (snap) =>
      setInvestors(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );
    const unsubP = onSnapshot(presRef, (snap) =>
      setPrestamos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );
    const unsubPag = onSnapshot(pagRef, (snap) =>
      setPagosDb(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    return () => {
      unsubI();
      unsubP();
      unsubPag();
    };
  }, [user]);

  const handleGuardarInv = async () => {
    if (!form.nombre) return alert("El nombre es obligatorio");
    setIsSaving(true);
    try {
      if (editingInvestorId) {
        const docRef = getDocRef(user, "inversionistas", editingInvestorId);
        await updateDoc(docRef, { ...form });
      } else {
        const invRef = getCollectionRef(user, "inversionistas");
        await addDoc(invRef, { ...form, createdAt: serverTimestamp() });
      }
      closeModal();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvestorId(null);
    setForm({
      nombre: "",
      dni: "",
      telefono: "",
      fecha: "",
      direccion: "",
      monto: "",
      tasa: "",
      banco: "",
    });
  };

  const openNewInvestor = () => {
    setForm({
      nombre: "",
      dni: "",
      telefono: "",
      fecha: "",
      direccion: "",
      monto: "",
      tasa: "",
      banco: "",
    });
    setEditingInvestorId(null);
    setIsModalOpen(true);
  };

  const openEditInvestor = (investor) => {
    setForm({
      nombre: investor.nombre || "",
      dni: investor.dni || "",
      telefono: investor.telefono || "",
      fecha: investor.fecha || "",
      direccion: investor.direccion || "",
      monto: investor.monto || "",
      tasa: investor.tasa || "",
      banco: investor.banco || "",
    });
    setEditingInvestorId(investor.id);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-[700px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-700">
          Listado de Inversionistas
        </h1>
        <button
          onClick={openNewInvestor}
          className="bg-[#3173c6] hover:bg-[#2860a8] text-white text-sm px-4 py-2 rounded shadow-sm flex items-center gap-1 transition-colors"
        >
          <span>+</span> Nuevo Inversionista
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Capital Invertido</th>
              <th className="py-3 px-4 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {investors.length > 0 ? (
              investors.map((investor) => (
                <tr
                  key={investor.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {investor.nombre}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    S/ {investor.monto || "0.00"}
                  </td>
                  <td className="py-3 px-4 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => openEditInvestor(investor)}
                      className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInvestor(investor);
                        setIsDetailsModalOpen(true);
                      }}
                      className="bg-[#3173c6] text-white text-xs px-3 py-1.5 rounded hover:bg-[#2860a8] transition-colors"
                    >
                      Detalles
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="py-8 text-center text-slate-500">
                  No hay inversionistas registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo/Editar Inversionista */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editingInvestorId
                  ? "Editar Inversionista"
                  : "Registrar Inversionista"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ej. Pedro Diaz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej. 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej. 987 654 321"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) =>
                      setForm({ ...form, direccion: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej. Av. Principal 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Fecha de Inversión
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm({ ...form, fecha: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Monto de Inversión (S/)
                  </label>
                  <input
                    type="number"
                    value={form.monto}
                    onChange={(e) =>
                      setForm({ ...form, monto: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej. 10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Tasa Rendimiento (%)
                  </label>
                  <input
                    type="number"
                    value={form.tasa}
                    onChange={(e) => setForm({ ...form, tasa: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej. 12"
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarInv}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded flex gap-2 items-center"
              >
                {isSaving ? (
                  <RefreshCcw size={16} className="animate-spin" />
                ) : editingInvestorId ? (
                  "Actualizar"
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles del Inversionista */}
      {isDetailsModalOpen && selectedInvestor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                Detalles del Inversionista - {selectedInvestor.nombre}
              </h2>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-8 bg-blue-50/50 p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    DNI
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedInvestor.dni || "-"}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Teléfono
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedInvestor.telefono || "-"}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-2">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Dirección
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedInvestor.direccion || "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Monto Invertido
                  </p>
                  <p className="text-sm font-bold text-[#3173c6]">
                    S/ {selectedInvestor.monto || "0.00"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Tasa de Rendimiento
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    {selectedInvestor.tasa || "0"}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Users size={16} className="text-[#3173c6]" />
                  Préstamos Asignados
                </h3>

                <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 text-xs uppercase tracking-wider">
                        <th className="py-2.5 px-4">Cliente</th>
                        <th className="py-2.5 px-4">Monto del Préstamo</th>
                        <th className="py-2.5 px-4">Próx. Pago</th>
                        <th className="py-2.5 px-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const investorLoans = prestamos.filter(
                          (p) =>
                            p.selectedInvestors &&
                            p.selectedInvestors.includes(selectedInvestor.id)
                        );
                        if (investorLoans.length === 0)
                          return (
                            <tr>
                              <td
                                colSpan="4"
                                className="p-4 text-center text-slate-500"
                              >
                                No hay préstamos asignados a este inversionista.
                              </td>
                            </tr>
                          );
                        return investorLoans.map((loan) => {
                          const estado = getEstadoPrestamo(loan);
                          return (
                            <tr
                              key={loan.id}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                            >
                              <td className="py-3 px-4 text-slate-800 font-medium">
                                {loan.clienteNombre}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                S/ {loan.monto}
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                {loan.proximaFechaPago ||
                                  getFechaUnMesDespues(loan.fecha)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wide
                                  ${
                                    estado === "Al día" || estado === "Pagado"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : estado === "Vencido"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full 
                                    ${
                                      estado === "Al día" || estado === "Pagado"
                                        ? "bg-emerald-600"
                                        : estado === "Vencido"
                                        ? "bg-rose-600"
                                        : "bg-amber-600"
                                    }`}
                                  ></span>
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

            <div className="p-5 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pagos() {
  const user = useContext(UserContext);
  const [clienteSearch, setClienteSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedPrestamo, setSelectedPrestamo] = useState(null);

  const [form, setForm] = useState({
    fechaPago: "",
    montoPagado: "",
    banco: "",
    concepto: "Interés",
    comentario: "",
  });

  const [editPagoForm, setEditPagoForm] = useState({
    id: "",
    clienteNombre: "",
    fechaPrestamo: "",
    fechaPago: "",
    montoPagado: "",
    banco: "",
    concepto: "",
    comentario: "",
  });

  const [pagoVoucher, setPagoVoucher] = useState(null);

  const [prestamosDb, setPrestamosDb] = useState([]);
  const [pagosDb, setPagosDb] = useState([]);

  const [pagoSearchTerm, setPagoSearchTerm] = useState("");
  const [isViewPagoModalOpen, setIsViewPagoModalOpen] = useState(false);
  const [isEditPagoModalOpen, setIsEditPagoModalOpen] = useState(false);
  const [selectedPagoModal, setSelectedPagoModal] = useState(null);

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    name: "",
    data: null,
  });

  useEffect(() => {
    const presRef = getCollectionRef(user, "prestamos");
    const pagRef = getCollectionRef(user, "pagos");
    if (!presRef || !pagRef) return;

    const unsubP = onSnapshot(presRef, (snap) =>
      setPrestamosDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubPag = onSnapshot(pagRef, (snap) =>
      setPagosDb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubP();
      unsubPag();
    };
  }, [user]);

  const handleVoucherUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800000)
      return alert("El archivo es demasiado grande (máx 800KB).");
    const reader = new FileReader();
    reader.onloadend = () => {
      setPagoVoucher({ name: file.name, data: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const openPreview = (name, data) => {
    setPreviewModal({ isOpen: true, name, data });
  };

  const filteredPrestamos = prestamosDb.filter(
    (p) =>
      p.clienteNombre &&
      p.clienteNombre.toLowerCase().includes(clienteSearch.toLowerCase())
  );
  const filteredPagosHistory = pagosDb.filter(
    (p) =>
      p.clienteNombre &&
      p.clienteNombre.toLowerCase().includes(pagoSearchTerm.toLowerCase())
  );

  const handleRegistrarPago = async () => {
    if (!selectedPrestamo || !form.montoPagado || !form.fechaPago)
      return alert(
        "Seleccione un préstamo de la lista, digite la fecha y el monto a pagar."
      );
    const pagRef = getCollectionRef(user, "pagos");
    if (!pagRef) return alert("Error de conexión");

    setIsSaving(true);
    try {
      const saldoActual = parseFloat(
        selectedPrestamo.saldo !== undefined
          ? selectedPrestamo.saldo
          : selectedPrestamo.monto
      );
      const tasa = parseFloat(selectedPrestamo.tasa || 0);
      const interesGenerado = saldoActual * (tasa / 100);
      const montoPagado = parseFloat(form.montoPagado);

      let interesCobrado = 0;
      let nuevoSaldo = saldoActual;

      if (form.concepto === "Interés") {
        interesCobrado = montoPagado;
      } else if (form.concepto === "Amortización") {
        nuevoSaldo -= montoPagado;
      } else if (form.concepto === "Ambos (Interés + Amortización)") {
        interesCobrado = interesGenerado;
        if (interesCobrado > montoPagado) interesCobrado = montoPagado;
        const amortizacion = montoPagado - interesCobrado;
        if (amortizacion > 0) {
          nuevoSaldo -= amortizacion;
        }
      }

      if (nuevoSaldo < 0.01) nuevoSaldo = 0;

      let nuevaProximaFecha =
        selectedPrestamo.proximaFechaPago ||
        getFechaUnMesDespues(selectedPrestamo.fecha);

      if (
        form.concepto === "Interés" ||
        form.concepto === "Ambos (Interés + Amortización)"
      ) {
        if (nuevaProximaFecha) {
          const d = new Date(nuevaProximaFecha + "T00:00:00");
          if (!isNaN(d.getTime())) {
            d.setMonth(d.getMonth() + 1);
            nuevaProximaFecha = d.toISOString().split("T")[0];
          }
        }
      }

      await addDoc(pagRef, {
        prestamoId: selectedPrestamo.id,
        clienteNombre: selectedPrestamo.clienteNombre,
        fechaPrestamo: selectedPrestamo.fecha || "No especificada",
        fechaPago: form.fechaPago,
        montoPagado: form.montoPagado,
        banco: form.banco,
        concepto: form.concepto,
        comentario: form.comentario,
        interesCobrado: interesCobrado.toFixed(2), // Guardamos el interés real cobrado para reportes SUNAT
        voucher: pagoVoucher,
        createdAt: serverTimestamp(),
      });

      const prestamoRef = getDocRef(user, "prestamos", selectedPrestamo.id);
      await updateDoc(prestamoRef, {
        saldo: nuevoSaldo.toFixed(2),
        proximaFechaPago: nuevaProximaFecha,
      });

      alert("Pago registrado y préstamo actualizado correctamente");
      setForm({
        fechaPago: "",
        montoPagado: "",
        banco: "",
        concepto: "Interés",
        comentario: "",
      });
      setPagoVoucher(null);
      setClienteSearch("");
      setSelectedPrestamo(null);
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al registrar el pago.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditPago = (pago) => {
    setEditPagoForm({
      id: pago.id,
      clienteNombre: pago.clienteNombre || "",
      fechaPrestamo: pago.fechaPrestamo || "",
      fechaPago: pago.fechaPago || "",
      montoPagado: pago.montoPagado || "",
      banco: pago.banco || "",
      concepto: pago.concepto || "",
      comentario: pago.comentario || "",
    });
    setIsEditPagoModalOpen(true);
  };

  const handleGuardarEditPago = async () => {
    if (!editPagoForm.montoPagado) return alert("El monto es obligatorio");
    setIsSaving(true);
    try {
      const docRef = getDocRef(user, "pagos", editPagoForm.id);
      await updateDoc(docRef, {
        fechaPago: editPagoForm.fechaPago,
        montoPagado: editPagoForm.montoPagado,
        banco: editPagoForm.banco,
        concepto: editPagoForm.concepto,
        comentario: editPagoForm.comentario,
      });
      setIsEditPagoModalOpen(false);
    } catch (e) {
      console.error("Error al actualizar pago:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-10 max-w-[800px]">
      {/* SECCIÓN: FORMULARIO DE REGISTRO */}
      <div className="w-full max-w-[600px]">
        <h1 className="text-xl font-bold text-slate-700 mb-6">
          Registrar Pago
        </h1>
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-bold text-[#3173c6] mb-4 flex items-center gap-2">
              <Search size={16} /> Buscar Préstamo
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Cliente / Préstamo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value);
                      setSelectedPrestamo(null);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Escriba el nombre del cliente para buscar..."
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:border-blue-400 focus:outline-none"
                  />
                  {showDropdown && filteredPrestamos.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-auto">
                      {filteredPrestamos.map((c) => (
                        <li
                          key={c.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setClienteSearch(c.clienteNombre);
                            setSelectedPrestamo(c);
                            setShowDropdown(false);
                          }}
                          className="p-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-50"
                        >
                          <strong>{c.clienteNombre}</strong> - Saldo: S/{" "}
                          {c.saldo !== undefined ? c.saldo : c.monto}{" "}
                          <span className="text-slate-400 text-xs ml-1">
                            (Vencimiento actual:{" "}
                            {c.proximaFechaPago ||
                              getFechaUnMesDespues(c.fecha)}
                            )
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Panel de Ayuda del Préstamo Seleccionado */}
            {selectedPrestamo && (
              <div className="col-span-2 grid grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded border border-blue-100 mb-2 animate-in fade-in zoom-in-95">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500">
                    Saldo Pendiente
                  </label>
                  <div className="text-sm font-bold text-[#3173c6]">
                    S/{" "}
                    {selectedPrestamo.saldo !== undefined
                      ? selectedPrestamo.saldo
                      : selectedPrestamo.monto}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500">
                    Interés (Tasa {selectedPrestamo.tasa}%)
                  </label>
                  <div className="text-sm font-bold text-amber-600">
                    S/{" "}
                    {(
                      (parseFloat(
                        selectedPrestamo.saldo !== undefined
                          ? selectedPrestamo.saldo
                          : selectedPrestamo.monto
                      ) || 0) *
                      (parseFloat(selectedPrestamo.tasa || 0) / 100)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  value={form.fechaPago}
                  onChange={(e) =>
                    setForm({ ...form, fechaPago: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Monto Pagado
                </label>
                <input
                  type="number"
                  value={form.montoPagado}
                  onChange={(e) =>
                    setForm({ ...form, montoPagado: e.target.value })
                  }
                  placeholder="S/ 0.00"
                  className="w-full border border-slate-300 rounded p-2 text-sm font-medium focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Banco / Método
                </label>
                <div className="relative">
                  <select
                    value={form.banco}
                    onChange={(e) =>
                      setForm({ ...form, banco: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 bg-white appearance-none text-slate-700"
                  >
                    <option value="">Seleccionar banco...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="BCP">BCP</option>
                    <option value="Interbank">Interbank</option>
                    <option value="BBVA">BBVA</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>

                {form.banco &&
                  form.banco !== "Efectivo" &&
                  form.banco !== "" && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                      <div className="relative overflow-hidden inline-block flex-1">
                        <button className="w-full text-xs bg-slate-50 border border-slate-300 hover:bg-slate-100 px-2 py-1.5 rounded text-slate-600 flex items-center justify-center gap-1 cursor-pointer truncate">
                          <Upload size={12} className="flex-shrink-0" />
                          <span className="truncate">
                            {pagoVoucher ? pagoVoucher.name : "Subir voucher"}
                          </span>
                        </button>
                        <input
                          type="file"
                          onChange={handleVoucherUpload}
                          className="absolute left-0 top-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      {pagoVoucher && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            openPreview(pagoVoucher.name, pagoVoucher.data);
                          }}
                          className="text-[#3173c6] hover:bg-blue-50 p-1.5 rounded border border-blue-100"
                          title="Ver voucher"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Concepto
                </label>
                <div className="relative">
                  <select
                    value={form.concepto}
                    onChange={(e) =>
                      setForm({ ...form, concepto: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 bg-white appearance-none text-slate-700"
                  >
                    <option value="Interés">Interés</option>
                    <option value="Amortización">Amortización</option>
                    <option value="Ambos (Interés + Amortización)">
                      Ambos (Interés + Amortización)
                    </option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleRegistrarPago}
                disabled={isSaving || !selectedPrestamo}
                className={`${
                  !selectedPrestamo
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#255ba1]"
                } bg-[#2d70c4] text-white px-6 py-2.5 rounded shadow-sm font-medium transition-colors flex items-center gap-2`}
              >
                {isSaving ? (
                  <RefreshCcw size={16} className="animate-spin" />
                ) : (
                  "Registrar Pago"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: HISTORIAL DE PAGOS */}
      <div className="w-full border-t border-slate-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-700">
            Historial de Pagos
          </h2>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              value={pagoSearchTerm}
              onChange={(e) => setPagoSearchTerm(e.target.value)}
              placeholder="Buscar por cliente..."
              className="w-64 pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-400 shadow-sm text-slate-700 bg-white"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-20">ID</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Fecha Pago</th>
                <th className="py-3 px-4">Monto</th>
                <th className="py-3 px-4 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPagosHistory.length > 0 ? (
                filteredPagosHistory.map((pago) => (
                  <tr
                    key={pago.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-500">
                      {pago.id.slice(0, 6)}...
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {pago.clienteNombre}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pago.fechaPago || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">
                      S/ {pago.montoPagado}
                    </td>
                    <td className="py-3 px-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => openEditPago(pago)}
                        className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPagoModal(pago);
                          setIsViewPagoModalOpen(true);
                        }}
                        className="bg-[#3173c6] text-white text-xs px-3 py-1.5 rounded hover:bg-[#2860a8] transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No se encontraron pagos en la base de datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Pago */}
      {isEditPagoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Editar Pago</h2>
              <button
                onClick={() => setIsEditPagoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  readOnly
                  value={editPagoForm.clienteNombre}
                  className="w-full border border-slate-300 rounded p-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={editPagoForm.fechaPago}
                    onChange={(e) =>
                      setEditPagoForm({
                        ...editPagoForm,
                        fechaPago: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Monto Pagado
                  </label>
                  <input
                    type="number"
                    value={editPagoForm.montoPagado}
                    onChange={(e) =>
                      setEditPagoForm({
                        ...editPagoForm,
                        montoPagado: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Banco / Método
                  </label>
                  <select
                    value={editPagoForm.banco}
                    onChange={(e) =>
                      setEditPagoForm({
                        ...editPagoForm,
                        banco: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 bg-white"
                  >
                    <option value="">Seleccionar banco...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="BCP">BCP</option>
                    <option value="Interbank">Interbank</option>
                    <option value="BBVA">BBVA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Concepto
                  </label>
                  <select
                    value={editPagoForm.concepto}
                    onChange={(e) =>
                      setEditPagoForm({
                        ...editPagoForm,
                        concepto: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 bg-white"
                  >
                    <option value="">Seleccionar concepto...</option>
                    <option value="Interés">Interés</option>
                    <option value="Amortización">Amortización</option>
                    <option value="Ambos (Interés + Amortización)">
                      Ambos (Interés + Amortización)
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setIsEditPagoModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEditPago}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded flex items-center gap-2"
              >
                {isSaving ? (
                  <RefreshCcw size={16} className="animate-spin" />
                ) : (
                  "Actualizar Pago"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle de Pago */}
      {isViewPagoModalOpen && selectedPagoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                Detalle del Pago
              </h2>
              <button
                onClick={() => setIsViewPagoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Cliente
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedPagoModal.clienteNombre}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Banco / Método
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedPagoModal.banco || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Fecha de Préstamo
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedPagoModal.fechaPrestamo || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Fecha de Pago
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedPagoModal.fechaPago}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Concepto
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedPagoModal.concepto}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                    Monto Recibido
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    S/ {selectedPagoModal.montoPagado}
                  </p>
                </div>
                {selectedPagoModal.voucher && (
                  <div className="col-span-2 mt-2">
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-semibold">
                      Voucher Adjunto
                    </p>
                    <button
                      onClick={() =>
                        openPreview(
                          selectedPagoModal.voucher.name,
                          selectedPagoModal.voucher.data
                        )
                      }
                      className="flex items-center gap-2 text-sm text-[#3173c6] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded transition-colors w-fit"
                    >
                      <Eye size={16} /> Ver voucher subido
                    </button>
                  </div>
                )}
                {selectedPagoModal.comentario && (
                  <div className="col-span-2 mt-2">
                    <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">
                      Comentario
                    </p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                      {selectedPagoModal.comentario}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsViewPagoModalOpen(false)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#3173c6] hover:bg-[#2860a8] rounded shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Previsualización de Archivos */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 truncate pr-4 flex items-center gap-2">
                <Eye size={18} className="text-[#3173c6]" /> {previewModal.name}
              </h3>
              <button
                onClick={() =>
                  setPreviewModal({ isOpen: false, name: "", data: null })
                }
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-200 rounded p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 overflow-auto relative">
              {previewModal.data ? (
                previewModal.data.startsWith("data:image/") ? (
                  <img
                    src={previewModal.data}
                    alt="Vista Previa"
                    className="max-w-full max-h-full object-contain shadow-md rounded"
                  />
                ) : previewModal.data.startsWith("data:application/pdf") ? (
                  <iframe
                    src={previewModal.data}
                    className="w-full h-full rounded shadow-md border-0 bg-white"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                    <FileText
                      size={48}
                      className="mb-3 opacity-50 text-slate-400"
                    />
                    <p className="font-medium">
                      Vista previa no disponible directamente aquí.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center text-slate-500 flex flex-col items-center bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                  <Cloud size={56} className="mb-4 text-[#3173c6] opacity-80" />
                  <p className="text-lg">
                    El archivo <strong>{previewModal.name}</strong> es antiguo o
                    no tiene datos incrustados.
                  </p>
                  <p className="text-sm mt-2 text-slate-400 max-w-md">
                    Para ver este archivo, necesitas volver a subirlo y
                    guardarlo, o implementar Firebase Storage a futuro.
                  </p>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const reporteRef = useRef(null);

  // Estado para las columnas visibles
  const [visibleColumns, setVisibleColumns] = useState({
    cliente: true,
    saldo: true,
    tasa: true,
    interes: true,
    proximaFecha: true,
    estado: true,
  });

  useEffect(() => {
    const presRef = getCollectionRef(user, "prestamos");
    if (!presRef) return;

    const unsub = onSnapshot(
      presRef,
      (snap) => setPrestamos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Error DB reportes:", err)
    );
    return () => unsub();
  }, [user]);

  // Filtrar los datos con la lógica de estado calculada globalmente
  const prestamosConEstado = prestamos.map((p) => ({
    ...p,
    estadoCalculado: getEstadoPrestamo(p),
  }));

  const filteredPrestamos = prestamosConEstado.filter((p) => {
    const matchesSearch = p.clienteNombre
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "Todos" || p.estadoCalculado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const calcularInteres = (prestamo) => {
    const m = parseFloat(
      prestamo.saldo !== undefined ? prestamo.saldo : prestamo.monto || 0
    );
    const t = parseFloat(prestamo.tasa || 0);
    return (m * (t / 100)).toFixed(2);
  };

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleExportExcel = () => {
    const headers = [];
    if (visibleColumns.cliente) headers.push("Cliente");
    if (visibleColumns.saldo) headers.push("Saldo (S/)");
    if (visibleColumns.tasa) headers.push("Tasa (%)");
    if (visibleColumns.interes) headers.push("Interés (S/)");
    if (visibleColumns.proximaFecha) headers.push("Próx. Fecha");
    if (visibleColumns.estado) headers.push("Estado");

    const rows = filteredPrestamos.map((p) => {
      const row = [];
      if (visibleColumns.cliente) row.push(`"${p.clienteNombre || ""}"`);
      if (visibleColumns.saldo)
        row.push(
          `"${parseFloat(p.saldo !== undefined ? p.saldo : p.monto).toFixed(
            2
          )}"`
        );
      if (visibleColumns.tasa) row.push(`"${p.tasa}"`);
      if (visibleColumns.interes) row.push(`"${calcularInteres(p)}"`);
      if (visibleColumns.proximaFecha)
        row.push(`"${p.proximaFechaPago || getFechaUnMesDespues(p.fecha)}"`);
      if (visibleColumns.estado) row.push(`"${p.estadoCalculado}"`);
      return row.join(",");
    });

    // Crear el contenido CSV con BOM (\uFEFF) para compatibilidad UTF-8 en Excel
    const csvString = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });

    // Crear enlace oculto y forzar la descarga
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_prestamos_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[800px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-700">
          Reporte de Préstamos
        </h1>
        <button
          onClick={handleExportExcel}
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors"
        >
          <Download size={16} className="text-[#3173c6]" /> Descargar Excel
        </button>
      </div>

      {/* Panel de Filtros y Configuración */}
      <div className="bg-white border border-slate-200 rounded shadow-sm p-5 mb-5 flex flex-col gap-5">
        {/* Barra de Búsqueda y Filtro de Estado */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div className="relative w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-slate-50 focus:bg-white text-slate-700 font-medium cursor-pointer transition-colors"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Al día">Al día</option>
              <option value="Por vencer">Por vencer</option>
              <option value="Vencido">Vencido</option>
              <option value="Pagado">Pagado</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Configuración de Columnas */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings size={14} className="text-[#3173c6]" />
            Campos a Visualizar
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleColumns.cliente}
                onChange={() => toggleColumn("cliente")}
                className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer"
              />
              Nombre del cliente
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleColumns.saldo}
                onChange={() => toggleColumn("saldo")}
                className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer"
              />
              Saldo
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleColumns.tasa}
                onChange={() => toggleColumn("tasa")}
                className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer"
              />
              Tasa
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleColumns.interes}
                onChange={() => toggleColumn("interes")}
                className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer"
              />
              Interés
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleColumns.proximaFecha}
                onChange={() => toggleColumn("proximaFecha")}
                className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer"
              />
              Próx. fecha de pago
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleColumns.estado}
                onChange={() => toggleColumn("estado")}
                className="rounded border-slate-300 text-[#3173c6] focus:ring-[#3173c6] w-4 h-4 cursor-pointer"
              />
              Estado
            </label>
          </div>
        </div>
      </div>

      <div
        ref={reporteRef}
        className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden"
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                {visibleColumns.cliente && (
                  <th className="py-3 px-4">Cliente</th>
                )}
                {visibleColumns.saldo && <th className="py-3 px-4">Saldo</th>}
                {visibleColumns.tasa && (
                  <th className="py-3 px-4 text-center">Tasa</th>
                )}
                {visibleColumns.interes && (
                  <th className="py-3 px-4">Interés</th>
                )}
                {visibleColumns.proximaFecha && (
                  <th className="py-3 px-4">Próx. Fecha</th>
                )}
                {visibleColumns.estado && (
                  <th className="py-3 px-4 text-center">Estado</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPrestamos.map((p) => {
                const estado = p.estadoCalculado;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    {visibleColumns.cliente && (
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {p.clienteNombre}
                      </td>
                    )}
                    {visibleColumns.saldo && (
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        S/ {p.saldo !== undefined ? p.saldo : p.monto}
                      </td>
                    )}
                    {visibleColumns.tasa && (
                      <td className="py-3 px-4 text-center text-slate-600">
                        {p.tasa}%
                      </td>
                    )}
                    {visibleColumns.interes && (
                      <td className="py-3 px-4 font-medium text-amber-600">
                        S/ {calcularInteres(p)}
                      </td>
                    )}
                    {visibleColumns.proximaFecha && (
                      <td className="py-3 px-4 text-slate-600">
                        {p.proximaFechaPago || getFechaUnMesDespues(p.fecha)}
                      </td>
                    )}
                    {visibleColumns.estado && (
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                          ${
                            estado === "Al día" || estado === "Pagado"
                              ? "bg-emerald-100 text-emerald-800"
                              : estado === "Vencido"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full 
                            ${
                              estado === "Al día" || estado === "Pagado"
                                ? "bg-emerald-600"
                                : estado === "Vencido"
                                ? "bg-rose-600"
                                : "bg-amber-600"
                            }`}
                          ></span>
                          {estado}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredPrestamos.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-500">
                    No se encontraron préstamos que coincidan con los filtros.
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
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Establecer fechas por defecto (Mes actual)
  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    setFechaInicio(primerDia);
    setFechaFin(ultimoDia);
  }, []);

  // Obtener los pagos
  useEffect(() => {
    const pagRef = getCollectionRef(user, "pagos");
    if (!pagRef) return;
    const unsub = onSnapshot(
      pagRef,
      (snap) => setPagos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err)
    );
    return () => unsub();
  }, [user]);

  // Filtrar y calcular la data de la tabla
  const pagosFiltrados = pagos
    .filter((p) => {
      if (!p.fechaPago) return false;
      return p.fechaPago >= fechaInicio && p.fechaPago <= fechaFin;
    })
    .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago)); // Ordenar más reciente primero

  let totalGanancia = 0;
  let totalSunat = 0;

  const filas = pagosFiltrados.map((p) => {
    const montoRecibido = parseFloat(p.montoPagado || 0);
    let ganancia = 0;

    // Solo se cobra impuesto a la ganancia real (Interés)
    if (p.concepto === "Interés") {
      ganancia = montoRecibido;
    } else if (p.concepto === "Ambos (Interés + Amortización)") {
      ganancia = parseFloat(p.interesCobrado || 0);
    } // Si es amortización, la ganancia queda en 0

    const sunat = ganancia * 0.05; // 5% de impuesto

    totalGanancia += ganancia;
    totalSunat += sunat;

    return { ...p, montoRecibido, ganancia, sunat };
  });

  const handleExportExcel = () => {
    const headers = [
      "Fecha de Pago",
      "Concepto",
      "Banco",
      "Monto Recibido (S/)",
      "Ganancia (S/)",
      "SUNAT 5% (S/)",
    ];
    const rows = filas.map((f) => {
      return [
        `"${f.fechaPago}"`,
        `"${f.concepto}"`,
        `"${f.banco}"`,
        `"${f.montoRecibido.toFixed(2)}"`,
        `"${f.ganancia.toFixed(2)}"`,
        `"${f.sunat.toFixed(2)}"`,
      ].join(",");
    });

    // Agregar fila de totales al final del Excel
    rows.push(
      `"TOTALES","","","","${totalGanancia.toFixed(2)}","${totalSunat.toFixed(
        2
      )}"`
    );

    // Crear CSV
    const csvString = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });

    // Descargar
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_sunat_${fechaInicio}_al_${fechaFin}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[800px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-700 flex items-center gap-2">
          <Calculator className="text-[#3173c6]" /> Reporte SUNAT (Impuestos)
        </h1>
        <button
          onClick={handleExportExcel}
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-colors"
        >
          <Download size={16} className="text-[#3173c6]" /> Descargar Excel
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm p-5 mb-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Filtrar por Rango de Fechas
        </h3>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Resumen Total */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-emerald-700 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingUp size={14} /> Total Ganancia (Intereses)
          </p>
          <p className="text-2xl font-bold text-emerald-800">
            S/ {totalGanancia.toFixed(2)}
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded p-4 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-rose-700 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
            <Calculator size={14} /> Total SUNAT (5%) a Pagar
          </p>
          <p className="text-2xl font-bold text-rose-800">
            S/ {totalSunat.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#f0f3f7] text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Fecha de Pago</th>
                <th className="py-3 px-4">Concepto</th>
                <th className="py-3 px-4">Banco</th>
                <th className="py-3 px-4">Monto Recibido</th>
                <th className="py-3 px-4">Ganancia</th>
                <th className="py-3 px-4 font-bold text-rose-700">
                  SUNAT (5%)
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.length > 0 ? (
                filas.map((fila) => (
                  <tr
                    key={fila.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-600">
                      {fila.fechaPago}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {fila.concepto}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{fila.banco}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      S/ {fila.montoRecibido.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-medium text-emerald-600">
                      S/ {fila.ganancia.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      S/ {fila.sunat.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-500">
                    No se encontraron pagos en este rango de fechas.
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
