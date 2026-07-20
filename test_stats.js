import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

const app = initializeApp({ /* ... we need credentials or just let's check it in browser ... wait, I don't have auth credentials in node. */});
