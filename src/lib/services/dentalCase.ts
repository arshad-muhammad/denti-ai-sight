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
  setDoc,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { PatientData, ClinicalData } from '@/types/newCase';
import { FirebaseDentalCase } from '@/types/firebase';
import { getAuth } from 'firebase/auth';

interface CreateCaseData {
  userId: string;
  patientData: PatientData;
  clinicalData: ClinicalData;
  status: "pending" | "analyzing" | "completed" | "error";
  createdAt: string;
}

export const dentalCaseService = {
  async create(data: CreateCaseData): Promise<string> {
    try {
      // Get current user
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Generate a unique ID first
      const caseId = doc(collection(db, 'cases')).id;

      // Transform data to Firebase format
      const firebaseData: Omit<FirebaseDentalCase, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: data.userId,
        patientName: data.patientData.fullName,
        patientAge: parseInt(data.patientData.age) || 0,
        patientGender: data.patientData.gender,
        patientContact: {
          phone: data.patientData.phone || '',
          email: data.patientData.email || '',
          address: data.patientData.address || ''
        },
        medicalHistory: {
          smoking: data.patientData.smoking || false,
          alcohol: data.patientData.alcohol || false,
          diabetes: data.patientData.diabetes || false,
          hypertension: data.patientData.hypertension || false,
          notes: data.patientData.medicalHistory || ''
        },
        clinicalFindings: {
          toothNumber: data.clinicalData.toothNumber || '',
          mobility: data.clinicalData.mobility || false,
          bleeding: data.clinicalData.bleeding || false,
          sensitivity: data.clinicalData.sensitivity || false,
          pocketDepth: data.clinicalData.pocketDepth || '',
          notes: data.clinicalData.additionalNotes || ''
        },
        symptoms: [],
        status: data.status,
        radiographUrl: null,
        analysisResults: null,
        diagnosis: null,
        boneLoss: null,
        severity: null,
        confidence: null,
        pathologies: [],
        treatmentPlan: [],
        prognosis: null,
        followUp: null
      };

      const timestamps = {
        createdAt: serverTimestamp() as FieldValue,
        updatedAt: serverTimestamp() as FieldValue
      };

      // Create in both locations simultaneously using the same ID
      const mainCaseRef = doc(db, 'cases', caseId);
      const userCaseRef = doc(db, `cases/${userId}/cases/${caseId}`);
      
      // Set documents in both locations
      await Promise.all([
        setDoc(mainCaseRef, { id: caseId, ...firebaseData, ...timestamps }),
        setDoc(userCaseRef, { id: caseId, ...firebaseData, ...timestamps })
      ]).catch(async (error) => {
        // If either operation fails, try to clean up
        try {
          await Promise.all([
            deleteDoc(mainCaseRef),
            deleteDoc(userCaseRef)
          ]);
        } catch (cleanupError) {
          console.error('Failed to cleanup after error:', cleanupError);
        }
        throw error;
      });

      return caseId;
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
      console.log(`Starting radiograph upload for case ${caseId}`);
      
      // Validate file
      if (!file) {
        throw new Error('No file provided for upload');
      }

      if (!['image/jpeg', 'image/png', 'image/dicom'].includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Supported types: JPEG, PNG, DICOM`);
      }

      console.log(`File validation passed. Size: ${file.size} bytes, Type: ${file.type}`);

      // Get current user
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Verify case exists first
      const [mainCaseSnap, userCaseSnap] = await Promise.all([
        getDoc(doc(db, 'cases', caseId)),
        getDoc(doc(db, `cases/${userId}/cases/${caseId}`))
      ]);

      if (!mainCaseSnap.exists() && !userCaseSnap.exists()) {
        throw new Error('Case not found');
      }

      // Create storage reference with correct path structure
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `radiographs/${userId}/${caseId}/${fileName}`);
      
      console.log('Uploading to Firebase Storage...');
      await uploadBytes(storageRef, file);
      console.log('File uploaded to storage successfully');

      console.log('Getting download URL...');
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('Download URL obtained successfully');

      // Update both locations simultaneously
      const mainCaseRef = doc(db, 'cases', caseId);
      const userCaseRef = doc(db, `cases/${userId}/cases/${caseId}`);
      
      const updateData = {
        radiographUrl: downloadUrl,
        updatedAt: serverTimestamp()
      };

      // Try to update both locations
      const updatePromises = await Promise.allSettled([
        updateDoc(mainCaseRef, updateData),
        updateDoc(userCaseRef, updateData)
      ]);

      // Check if at least one update succeeded
      const successfulUpdates = updatePromises.filter(result => result.status === 'fulfilled');
      if (successfulUpdates.length === 0) {
        throw new Error('Failed to update case with radiograph URL');
      }

      // Verify the update with exponential backoff
      let verified = false;
      let retries = 0;
      const maxRetries = 5;
      let retryDelay = 1000; // Start with 1 second

      while (!verified && retries < maxRetries) {
        console.log(`Verifying radiograph URL (attempt ${retries + 1}/${maxRetries})...`);
        
        const [mainDoc, userDoc] = await Promise.all([
          getDoc(mainCaseRef),
          getDoc(userCaseRef)
        ]);

        if (mainDoc.exists() && mainDoc.data()?.radiographUrl === downloadUrl) {
          verified = true;
          break;
        }

        if (userDoc.exists() && userDoc.data()?.radiographUrl === downloadUrl) {
          verified = true;
          break;
        }

        console.log(`Radiograph URL not verified yet, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
        retries++;
      }

      if (!verified) {
        throw new Error('Failed to verify radiograph URL update after multiple attempts');
      }

      console.log('Radiograph upload and case update completed successfully');
    } catch (error) {
      console.error('Error in uploadRadiograph:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to upload radiograph: ${error.message}`);
      }
      throw new Error('Failed to upload radiograph');
    }
  },

  async getById(id: string): Promise<FirebaseDentalCase | null> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const docRef = doc(db, 'cases', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Transform Firebase data to FirebaseDentalCase format
      return {
        id: docSnap.id,
        userId: data.userId || currentUser.uid,
        patientName: data.patientName || "Anonymous Patient",
        patientAge: data.patientAge || 0,
        patientGender: data.patientGender || "",
        patientContact: data.patientContact || {
          phone: "",
          email: "",
          address: ""
        },
        medicalHistory: data.medicalHistory || {
          smoking: false,
          alcohol: false,
          diabetes: false,
          hypertension: false,
          notes: ""
        },
        clinicalFindings: data.clinicalFindings || {
          toothNumber: "",
          mobility: false,
          bleeding: false,
          sensitivity: false,
          pocketDepth: "",
          notes: ""
        },
        symptoms: data.symptoms || [],
        status: data.status || 'pending',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        radiographUrl: data.radiographUrl || null,
        analysisResults: data.analysisResults || null,
        diagnosis: data.diagnosis || null,
        boneLoss: data.boneLoss || null,
        severity: data.severity || null,
        confidence: data.confidence || null,
        pathologies: data.pathologies || [],
        treatmentPlan: data.treatmentPlan || [],
        prognosis: data.prognosis || null,
        followUp: data.followUp || null
      };
    } catch (error) {
      console.error('Error getting case:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get case: ${error.message}`);
      }
      throw new Error('Failed to get case');
    }
  },

  async update(id: string, data: Partial<FirebaseDentalCase>): Promise<FirebaseDentalCase> {
    try {
      // Get current user
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Create references to both locations
      const mainCaseRef = doc(db, 'cases', id);
      const userCaseRef = doc(db, `cases/${userId}/cases/${id}`);

      // Prepare update data with timestamp
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      // Update both locations
      await Promise.all([
        updateDoc(mainCaseRef, updateData),
        updateDoc(userCaseRef, updateData)
      ]);

      // Fetch and return the updated case
      const updatedCase = await this.getById(id);
      if (!updatedCase) {
        throw new Error('Failed to fetch updated case');
      }

      return updatedCase;
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

  async getByUserId(userId: string): Promise<FirebaseDentalCase[]> {
    try {
      // First try with ordering
      try {
        const q = query(
          collection(db, 'cases'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            patientName: data.patientName || 'Anonymous',
            patientAge: data.patientAge || 0,
            patientGender: data.patientGender || 'Not Specified',
            patientContact: data.patientContact || { phone: '', email: '', address: '' },
            medicalHistory: data.medicalHistory || {
              smoking: false,
              alcohol: false,
              diabetes: false,
              hypertension: false,
              notes: ''
            },
            clinicalFindings: data.clinicalFindings || {
              toothNumber: '',
              mobility: false,
              bleeding: false,
              sensitivity: false,
              pocketDepth: '',
              notes: ''
            },
            symptoms: data.symptoms || [],
            radiographUrl: data.radiographUrl,
            status: data.status || 'pending',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            analysisResults: data.analysisResults,
            diagnosis: data.diagnosis,
            boneLoss: data.boneLoss,
            severity: data.severity,
            confidence: data.confidence,
            pathologies: data.pathologies || [],
            treatmentPlan: data.treatmentPlan || [],
            prognosis: data.prognosis,
            followUp: data.followUp
          } as FirebaseDentalCase;
        });
      } catch (indexError) {
        // If index doesn't exist, fall back to simple query without ordering
        console.warn('Index not found, falling back to unordered query');
        const q = query(
          collection(db, 'cases'),
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const cases = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            patientName: data.patientName || 'Anonymous',
            patientAge: data.patientAge || 0,
            patientGender: data.patientGender || 'Not Specified',
            patientContact: data.patientContact || { phone: '', email: '', address: '' },
            medicalHistory: data.medicalHistory || {
              smoking: false,
              alcohol: false,
              diabetes: false,
              hypertension: false,
              notes: ''
            },
            clinicalFindings: data.clinicalFindings || {
              toothNumber: '',
              mobility: false,
              bleeding: false,
              sensitivity: false,
              pocketDepth: '',
              notes: ''
            },
            symptoms: data.symptoms || [],
            radiographUrl: data.radiographUrl,
            status: data.status || 'pending',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            analysisResults: data.analysisResults,
            diagnosis: data.diagnosis,
            boneLoss: data.boneLoss,
            severity: data.severity,
            confidence: data.confidence,
            pathologies: data.pathologies || [],
            treatmentPlan: data.treatmentPlan || [],
            prognosis: data.prognosis,
            followUp: data.followUp
          } as FirebaseDentalCase;
        });

        // Sort in memory if index is not available
        return cases.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      }
    } catch (error) {
      console.error('Error getting user cases:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get user cases: ${error.message}`);
      }
      throw new Error('Failed to get user cases');
    }
  },

  async getByCaseId(userId: string, caseId: string): Promise<FirebaseDentalCase | null> {
    try {
      const docRef = doc(db, 'cases', userId, 'cases', caseId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId,
          patientName: data.patientName || 'Anonymous',
          patientAge: data.patientAge || 0,
          patientGender: data.patientGender || 'Not Specified',
          patientContact: data.patientContact || { phone: '', email: '', address: '' },
          medicalHistory: data.medicalHistory || {
            smoking: false,
            alcohol: false,
            diabetes: false,
            hypertension: false,
            notes: ''
          },
          clinicalFindings: data.clinicalFindings || {
            toothNumber: '',
            mobility: false,
            bleeding: false,
            sensitivity: false,
            pocketDepth: '',
            notes: ''
          },
          symptoms: data.symptoms || [],
          radiographUrl: data.radiographUrl,
          status: data.status || 'pending',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          analysisResults: data.analysisResults,
          diagnosis: data.diagnosis,
          boneLoss: data.boneLoss,
          severity: data.severity,
          confidence: data.confidence,
          pathologies: data.pathologies || [],
          treatmentPlan: data.treatmentPlan || [],
          prognosis: data.prognosis,
          followUp: data.followUp
        } as FirebaseDentalCase;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting case by ID:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get case: ${error.message}`);
      }
      throw new Error('Failed to get case');
    }
  },
}; 
