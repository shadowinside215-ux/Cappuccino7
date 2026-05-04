import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function clearOrders() {
  console.log('Fetching orders...');
  const querySnapshot = await getDocs(collection(db, 'orders'));
  console.log(`Found ${querySnapshot.size} orders. Deleting...`);
  
  const deletes = querySnapshot.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
  await Promise.all(deletes);
  
  console.log('All orders deleted successfully.');
  process.exit(0);
}

clearOrders().catch(err => {
  console.error(err);
  process.exit(1);
});
