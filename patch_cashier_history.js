const fs = require('fs');
let code = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf-8');

// 1. Add journalDate state
code = code.replace(
  "const [journalSearch, setJournalSearch] = useState('');",
  "const [journalSearch, setJournalSearch] = useState('');\n  const [journalDate, setJournalDate] = useState<Date>(new Date());"
);

// 2. Change useEffect for JournalOrders
const oldJournalEffect = `    // Load Completed Orders for Journal (only for today by default)
    const todayStart = startOfDay(new Date());
    const qJournal = query(
      collection(db, 'orders'),
      where('isPaid', '==', true),
      where('createdAt', '>=', todayStart),
      orderBy('createdAt', 'desc')
    );
    const unsubJournal = onSnapshot(qJournal, (snap) => {
      setJournalOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => {
      console.warn('Journal listener limited:', error.message);
    });`;

const newJournalEffect = `    // Load Completed Orders for Journal (based on selected date)
    const targetStart = startOfDay(journalDate);
    const targetEnd = endOfDay(journalDate);
    const qJournal = query(
      collection(db, 'orders'),
      where('isPaid', '==', true),
      where('createdAt', '>=', targetStart),
      where('createdAt', '<=', targetEnd),
      orderBy('createdAt', 'desc')
    );
    const unsubJournal = onSnapshot(qJournal, (snap) => {
      setJournalOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => {
      console.warn('Journal listener limited:', error.message);
    });
    
    return () => {
      unsubJournal();
    };
  }, [journalDate]);`;

// Since the old journal effect was inside the large useEffect without dependencies for journalDate, we need to extract it!
