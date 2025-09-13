"use client";

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  deleteUser,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  projectId: string | null;
  deleteUserAccount: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const authRef = React.useRef<Auth | null>(null);
  const appRef = React.useRef<FirebaseApp | null>(null);

  useEffect(() => {
    try {
      const firebaseConfig = JSON.parse(
        process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}"
      );
      if (!firebaseConfig || !firebaseConfig.apiKey) {
        console.error("AuthProvider: Firebase config está faltando.");
        setLoading(false);
        return;
      }

      if (getApps().length === 0) {
        appRef.current = initializeApp(firebaseConfig);
      } else {
        appRef.current = getApp();
      }

      const app = appRef.current;
      if (app.options && "projectId" in app.options) {
        setCurrentProjectId(app.options.projectId || null);
      }
      authRef.current = getAuth(app);

      const unsubscribe = onAuthStateChanged(
        authRef.current,
        (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("AuthProvider: Falha ao inicializar Firebase:", error);
      setLoading(false);
    }
  }, []);

  const login = async () => {
    try {
      if (!authRef.current)
        throw new Error("Firebase Auth não foi inicializado.");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(authRef.current, provider);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("AuthProvider: Erro durante o login:", error.message);
      } else {
        console.error(
          "AuthProvider: Erro desconhecido durante o login:",
          error
        );
      }
    }
  };

  const logout = async () => {
    try {
      if (!authRef.current)
        throw new Error("Firebase Auth não foi inicializado.");
      await signOut(authRef.current);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("AuthProvider: Erro durante o logout:", error.message);
      } else {
        console.error(
          "AuthProvider: Erro desconhecido durante o logout:",
          error
        );
      }
    }
  };

  const deleteUserAccount = async () => {
    const currentUser = authRef.current?.currentUser;
    if (!currentUser || !appRef.current || !currentProjectId) {
      throw new Error("Usuário não autenticado ou app não inicializado.");
    }

    try {
      console.log("Iniciando exclusão de dados do Firestore...");
      const db = getFirestore(appRef.current);
      const collectionsToWipe = [
        "accounts",
        "categories",
        "paymentMethods",
        "financial-entries",
      ];

      for (const coll of collectionsToWipe) {
        console.log(`Limpando coleção: ${coll}`);
        const userColPath = `artifacts/${currentProjectId}/users/${currentUser.uid}/${coll}`;
        const userColRef = collection(db, userColPath);
        const snapshot = await getDocs(userColRef);

        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          console.log(`Coleção ${coll} limpa com sucesso.`);
        }
      }

      console.log("Limpando dados de perfil...");
      const profileSettingsRef = doc(
        db,
        `artifacts/${currentProjectId}/users/${currentUser.uid}/profile`,
        "settings"
      );

      const settingsSnap = await getDoc(profileSettingsRef);
      if (settingsSnap.exists()) {
        const batch = writeBatch(db);
        batch.delete(profileSettingsRef);
        await batch.commit();
        console.log("Documento de settings do perfil removido.");
      }

      console.log("Dados do Firestore excluídos. Excluindo usuário do Auth...");
      await deleteUser(currentUser);

      console.log("Usuário excluído do Firebase Authentication com sucesso.");
      setUser(null);
    } catch (error: unknown) {
      console.error("Erro ao deletar a conta do usuário:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === "auth/requires-recent-login"
      ) {
        throw new Error(
          "Esta operação é sensível e requer autenticação recente. Por favor, faça login novamente e tente de novo."
        );
      }
      throw new Error("Não foi possível remover a conta. Tente novamente.");
    }
  };

  const completeOnboarding = async () => {
    const currentUser = authRef.current?.currentUser;
    if (!currentUser || !appRef.current || !currentProjectId) {
      throw new Error("Usuário não autenticado ou app não inicializado.");
    }
    try {
      const db = getFirestore(appRef.current);
      const settingsRef = doc(
        db,
        `artifacts/${currentProjectId}/users/${currentUser.uid}/profile`,
        "settings"
      );

      await setDoc(settingsRef, {
        onboardingCompleted: true,
        createdAt: new Date(),
      });
      console.log(
        "Onboarding finalizado e salvo para o usuário no caminho correto."
      );
    } catch (error) {
      console.error("Erro ao salvar status do onboarding:", error);
      throw new Error("Não foi possível salvar suas configurações.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        projectId: currentProjectId,
        deleteUserAccount,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
