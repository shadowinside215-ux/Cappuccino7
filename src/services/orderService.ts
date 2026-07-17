import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, UserProfile, OrderStatus } from '../types';
import toast from 'react-hot-toast';


