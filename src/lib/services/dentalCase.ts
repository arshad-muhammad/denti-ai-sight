import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { PatientData, ClinicalData, DentalCase } from '@/types/newCase';

interface CreateCaseData {
  userId: string;
  patientData: PatientData;
  clinicalData: ClinicalData;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
}

export type { DentalCase };

export const dentalCaseService = {
  async create(data: CreateCaseData): Promise<string> {
    try {
      const casesRef = collection(db, 'cases');
      const docRef = await addDoc(casesRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await updateDoc(docRef, {
        id: docRef.id
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating case:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create case: ${error.message}`);
      }
      throw new Error('Failed to create case');
    }
  },

  async uploadRadiograph(caseId: string, file: File): Promise<void> {
    try {
      const storageRef = ref(storage, `radiographs/${caseId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      const caseRef = doc(db, 'cases', caseId);
      await updateDoc(caseRef, {
        radiographUrl: downloadUrl,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error uploading radiograph:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload radiograph: ${error.message}`);
      }
      throw new Error('Failed to upload radiograph');
    }
  },

  async getById(id: string): Promise<DentalCase | null> {
    try {
      const docRef = doc(db, 'cases', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        patientData: data.patientData,
        clinicalData: data.clinicalData,
        status: data.status,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        radiographUrl: data.radiographUrl,
        analysisResults: data.analysisResults
      } as DentalCase;
    } catch (error) {
      console.error('Error getting case:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get case: ${error.message}`);
      }
      throw new Error('Failed to get case');
    }
  },

  async update(id: string, data: Partial<DentalCase>): Promise<void> {
    try {
      const docRef = doc(db, 'cases', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating case:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update case: ${error.message}`);
      }
      throw new Error('Failed to update case');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'cases', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting case:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete case: ${error.message}`);
      }
      throw new Error('Failed to delete case');
    }
  },

  async getByUserId(userId: string): Promise<DentalCase[]> {
    try {
      const q = query(
        collection(db, 'cases'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const cases = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DentalCase[];

      return cases.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting user cases:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get user cases: ${error.message}`);
      }
      throw new Error('Failed to get user cases');
    }
  },

  async getByCaseId(userId: string, caseId: string): Promise<DentalCase | null> {
    const docRef = doc(db, 'cases', userId, 'cases', caseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as DentalCase;
    }
    
    return null;
  },
}; 