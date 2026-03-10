import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Plus, 
  Trash2, 
  Quote,
  Coffee,
  Home,
  FileText,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  Lock,
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  CreditCard,
  Zap,
  ShoppingBag
} from 'lucide-react';

// --- Aapka Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAl8SxXsZa5jA44KG2hS1Ml_Wu4KaO3l5o",
  authDomain: "expencetracker-123.firebaseapp.com",
  projectId: "expencetracker-123",
  storageBucket: "expencetracker-123.firebasestorage.app",
  messagingSenderId: "1018716031566",
  appId: "1:1018716031566:web:99062e47e7519e51fc511f",
  measurementId: "G-VWTT1B3HJ9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'gronur-mobile-v1';

const USER_CONFIG = {
  Pavan: { num: '9554794429', icon: '🦇', theme: 'from-slate-900 via-slate-800 to-zinc-900', label: 'The Batman' },
  Pankaj: { num: '9137294937', icon: '🐢', theme: 'from-emerald-700 via-teal-800 to-cyan-900', label: 'The Turtle' },
  Prince: { num: '8591901779', icon: '🐦‍⬛', theme: 'from-blue-800 via-indigo-900 to-violet-950', label: 'The Crow' }
};

const CATEGORIES = [
  { name: 'Food', icon: <Coffee size={18}/>, color: 'bg-orange-500' },
  { name: 'Bill', icon: <Zap size={18}/>, color: 'bg-yellow-500' },
  { name: 'Rent', icon: <Home size={18}/>, color: 'bg-blue-500' },
  { name: 'Shopping', icon: <ShoppingBag size={18}/>, color: 'bg-pink-500' },
  { name: 'Others', icon: <FileText size={18}/>, color: 'bg-slate-500' }
];

const App = () => {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [boardData, setBoardData] = useState({ text: "Aaj ka kya scene h?", author: "Group" });
  const [isEditingThought, setIsEditingThought] = useState(false);
  const [tempThought, setTempThought] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: '', category: 'Food', note: '' });
  const [filterUser, setFilterUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        setAuthError("Auth Error: Check Firebase Console settings.");
      }
    };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, setUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const expRef = collection(db, 'artifacts', appId, 'public', 'data', 'expenses');
    const unsubExp = onSnapshot(expRef, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));
    
    const boardRef = doc(db, 'artifacts', appId, 'public', 'data', 'board_content', 'main_id');
    const unsubBoard = onSnapshot(boardRef, (snap) => {
      if (snap.exists()) setBoardData(snap.data());
    }, (err) => console.error(err));

    return () => { unsubExp(); unsubBoard(); };
  }, [user]);

  const totals = useMemo(() => {
    const res = { Pavan: 0, Pankaj: 0, Prince: 0 };
    expenses.forEach(e => { if (res[e.user_id] !== undefined) res[e.user_id] += parseFloat(e.amount || 0); });
    return res;
  }, [expenses]);

  const grandTotal = useMemo(() => Object.values(totals).reduce((a, b) => a + b, 0), [totals]);
  const averagePerPerson = grandTotal / 3;
  
  const balances = useMemo(() => {
    const bal = {};
    Object.keys(USER_CONFIG).forEach(u => bal[u] = totals[u] - averagePerPerson);
    return bal;
  }, [totals, averagePerPerson]);

  const handleLogin = () => {
    if (phoneInput.replace(/\s/g, '') === USER_CONFIG[selectedUser].num) {
      setCurrentPage('home');
      setLoginError(false);
    } else {
      setLoginError(true);
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!user || !selectedUser || !formData.amount) return;
    try {
      const expRef = collection(db, 'artifacts', appId, 'public', 'data', 'expenses');
      await addDoc(expRef, {
        ...formData,
        user_id: selectedUser,
        amount: parseFloat(formData.amount),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });
      setFormData({ amount: '', category: 'Food', note: '' });
      setIsModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const deleteExpense = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'expenses', id));
    } catch (e) { console.error(e); }
  };

  const updateThought = async () => {
    if (!tempThought.trim() || !user) return;
    try {
      const boardRef = doc(db, 'artifacts', appId, 'public', 'data', 'board_content', 'main_id');
      await setDoc(boardRef, { text: tempThought, author: selectedUser, timestamp: Date.now() });
      setIsEditingThought(false);
    } catch (e) { console.error(e); }
  };

  if (currentPage === 'login') return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col p-8 justify-center overflow-hidden">
      <div className="mb-12">
        <div className="w-16 h-1 bg-indigo-500 rounded-full mb-6"></div>
        <h1 className="text-6xl font-black text-white italic leading-none tracking-tighter uppercase">Gronur.</h1>
        <p className="text-slate-500 font-bold mt-2 tracking-[0.3em] text-xs uppercase">Premium Ledger</p>
      </div>
      <div className="space-y-4">
        {Object.keys(USER_CONFIG).map(u => (
          <button key={u} onClick={() => { setSelectedUser(u); setCurrentPage('verify'); }} className="w-full bg-slate-800/50 backdrop-blur-xl p-6 rounded-[30px] border border-slate-700/50 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-6">
              <span className="text-4xl">{USER_CONFIG[u].icon}</span>
              <div className="text-left">
                <p className="font-black text-xl text-white">{u}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{USER_CONFIG[u].label}</p>
              </div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded-full text-slate-400"><ChevronRight size={20}/></div>
          </button>
        ))}
      </div>
    </div>
  );

  if (currentPage === 'verify') return (
    <div className={`min-h-screen bg-gradient-to-b ${USER_CONFIG[selectedUser].theme} p-8 flex flex-col relative`}>
      <button onClick={() => setCurrentPage('login')} className="mt-8 text-white/50 self-start"><ArrowLeft size={32}/></button>
      <div className="flex-1 flex flex-col justify-center items-center gap-12">
        <div className="text-center">
          <div className="text-9xl mb-4">{USER_CONFIG[selectedUser].icon}</div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Security Check</h2>
        </div>
        <div className="w-full space-y-4">
          <input type="tel" placeholder="Phone Number..." className={`w-full bg-black/20 border-2 ${loginError ? 'border-red-500' : 'border-white/10'} rounded-[30px] py-7 px-8 text-white font-black text-2xl text-center`} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()}/>
          <button onClick={handleLogin} className="w-full bg-white text-slate-900 py-7 rounded-[30px] font-black text-xl uppercase tracking-widest">Verify Identity</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] max-w-md mx-auto relative overflow-hidden flex flex-col select-none">
      {authError && <div className="bg-red-600 text-white p-2 text-center text-xs font-bold">{authError}</div>}
      
      <div className="flex-1 overflow-y-auto pb-32">
        {currentPage === 'home' && (
          <div className="p-6 pt-12 animate-in fade-in duration-500">
            <header className="flex justify-between items-end mb-8">
              <div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Mera Khata</p>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">Stats.</h2>
              </div>
              <div className="text-4xl bg-white w-16 h-16 rounded-[22px] shadow-sm border border-slate-100 flex items-center justify-center">{USER_CONFIG[selectedUser].icon}</div>
            </header>

            <section className="bg-indigo-600 rounded-[35px] p-6 text-white shadow-xl mb-8 relative" onClick={() => { setTempThought(boardData.text); setIsEditingThought(true); }}>
              {!isEditingThought ? (
                <>
                  <p className="text-xl font-black italic mb-4">"{boardData.text}"</p>
                  <span className="text-[10px] font-black uppercase opacity-60">— {boardData.author}</span>
                </>
              ) : (
                <div className="space-y-4" onClick={e => e.stopPropagation()}>
                  <textarea autoFocus className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-4 text-white font-black italic outline-none" value={tempThought} onChange={e => setTempThought(e.target.value)} rows="2"/>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingThought(false)} className="p-2 bg-white/10 rounded-full"><X size={16}/></button>
                    <button onClick={updateThought} className="p-2 bg-white text-indigo-600 rounded-full"><Check size={16}/></button>
                  </div>
                </div>
              )}
            </section>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-6 rounded-[30px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Spent</p>
                <p className="text-3xl font-black text-slate-900">₹{totals[selectedUser]}</p>
              </div>
              <div className={`p-6 rounded-[30px] text-white ${balances[selectedUser] >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Status</p>
                <p className="text-2xl font-black">{balances[selectedUser] >= 0 ? `+₹${balances[selectedUser].toFixed(0)}` : `-₹${Math.abs(balances[selectedUser]).toFixed(0)}`}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Transactions</h3>
              {expenses.filter(e => e.user_id === selectedUser).sort((a,b)=>b.timestamp-a.timestamp).map(exp => (
                <div key={exp.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${CATEGORIES.find(c => c.name === exp.category)?.color} rounded-[18px] flex items-center justify-center text-white`}>
                      {CATEGORIES.find(c => c.name === exp.category)?.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{exp.note || exp.category}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{exp.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">₹{exp.amount}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Action Button (Only on Home) */}
            <button onClick={() => setIsModalOpen(true)} className="fixed bottom-28 right-6 bg-[#0F172A] text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-all">
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>
        )}

        {currentPage === 'shared' && (
          <div className="p-6 pt-12 animate-in slide-in-from-right">
             <header className="mb-8">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Sabka Ledger</p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">The Board.</h2>
            </header>
            <div className="bg-white rounded-[35px] p-6 shadow-sm border border-slate-100 space-y-6">
              {Object.keys(USER_CONFIG).map(u => (
                <div key={u} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{USER_CONFIG[u].icon}</span>
                    <span className="font-black text-slate-800">{u}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">₹{totals[u]}</p>
                    <p className={`text-[10px] font-black ${balances[u] >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {balances[u] >= 0 ? `+₹${balances[u].toFixed(0)}` : `-₹${Math.abs(balances[u]).toFixed(0)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'insights' && (
          <div className="p-6 pt-12 animate-in slide-in-from-right">
            <header className="mb-8">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Analysis</p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">Stats.</h2>
            </header>
            <div className="bg-slate-900 rounded-[35px] p-8 text-white shadow-2xl">
              <p className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-2">Target Average</p>
              <h3 className="text-6xl font-black italic text-indigo-400">₹{averagePerPerson.toFixed(0)}</h3>
              <div className="h-px bg-white/10 my-6"></div>
              <p className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-2">Total Pool</p>
              <p className="text-3xl font-black">₹{grandTotal}</p>
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 inset-x-0 h-24 bg-white/90 backdrop-blur-3xl border-t border-slate-100 flex items-center justify-around px-8 rounded-t-[40px] z-40">
        <button onClick={() => setCurrentPage('home')} className={`p-4 ${currentPage === 'home' ? 'text-indigo-600' : 'text-slate-300'}`}><Home size={28}/></button>
        <button onClick={() => setCurrentPage('shared')} className={`p-4 ${currentPage === 'shared' ? 'text-indigo-600' : 'text-slate-300'}`}><Users size={28}/></button>
        <button onClick={() => setCurrentPage('insights')} className={`p-4 ${currentPage === 'insights' ? 'text-indigo-600' : 'text-slate-300'}`}><BarChart3 size={28}/></button>
        <button onClick={() => { setCurrentPage('login'); setPhoneInput(''); }} className="p-4 text-slate-200"><Lock size={22}/></button>
      </nav>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full rounded-t-[50px] p-8 pb-12 shadow-2xl relative z-70 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
            <h2 className="text-3xl font-black text-slate-900 italic mb-10">Naya Kharch</h2>
            <form onSubmit={handleAddExpense} className="space-y-6">
              <input required autoFocus type="number" className="w-full bg-slate-50 p-8 rounded-[30px] text-5xl font-black outline-none border-4 border-transparent focus:border-indigo-100" placeholder="₹0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}/>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map(c => (
                  <button key={c.name} type="button" onClick={() => setFormData({...formData, category: c.name})} className={`p-4 rounded-[22px] flex flex-col items-center gap-2 border-2 ${formData.category === c.name ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                    {c.icon}<span className="text-[9px] font-black uppercase">{c.name}</span>
                  </button>
                ))}
              </div>
              {formData.category === 'Others' && (
                <input required autoFocus type="text" className="w-full bg-slate-50 p-6 rounded-[22px] font-black text-sm outline-none border-2 border-indigo-200 animate-in zoom-in" placeholder="Kisliye? (Likhna zaroori h)" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}/>
              )}
              <button type="submit" className="w-full bg-[#0F172A] text-white py-7 rounded-[30px] font-black text-xl active:scale-95 transition-all">Save Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
