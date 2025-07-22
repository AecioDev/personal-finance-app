"use client";

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

interface AuthContextType {
  user: FirebaseUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  projectId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// REMOVIDO: O objeto firebaseConfig hardcoded foi removido daqui.
// Ele será lido das variáveis de ambiente.

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const authRef = React.useRef<any>(null);

  useEffect(() => {
    console.log(
      "AuthProvider: Iniciando useEffect de inicialização do Firebase..."
    );
    try {
      // NOVO: Lê a configuração do Firebase das variáveis de ambiente
      const firebaseConfig = JSON.parse(
        process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}"
      );
      console.log(
        "AuthProvider: Firebase Config (lida das variáveis de ambiente):",
        firebaseConfig
      );

      if (
        !firebaseConfig ||
        Object.keys(firebaseConfig).length === 0 ||
        !firebaseConfig.apiKey
      ) {
        console.error(
          "AuthProvider: Firebase config está faltando ou vazio. Por favor, configure NEXT_PUBLIC_FIREBASE_CONFIG nas variáveis de ambiente."
        );
        setLoading(false);
        return;
      }

      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        console.log(
          "AuthProvider: Firebase App inicializado pela primeira vez."
        );
      } else {
        app = getApp();
        console.log("AuthProvider: Usando Firebase App existente.");
      }

      setCurrentProjectId(app.options.projectId || null);

      authRef.current = getAuth(app);
      console.log("AuthProvider: Firebase Auth inicializado.");

      const unsubscribe = onAuthStateChanged(
        authRef.current,
        (firebaseUser) => {
          if (firebaseUser) {
            console.log(
              "AuthProvider: onAuthStateChanged - Usuário logado:",
              firebaseUser.email
            );
            setUser(firebaseUser);
          } else {
            console.log(
              "AuthProvider: onAuthStateChanged - Nenhum usuário logado."
            );
            setUser(null);
          }
          setLoading(false);
          console.log("AuthProvider: Loading set to false.");
        }
      );

      return () => {
        unsubscribe();
        console.log("AuthProvider: Limpeza do listener onAuthStateChanged.");
      };
    } catch (error: any) {
      console.error(
        "AuthProvider: Falha ao inicializar Firebase ou analisar configuração:",
        error
      );
      setLoading(false);
    }
  }, []);

  const login = async () => {
    console.log("AuthProvider: Tentando login com Google...");
    try {
      if (!authRef.current) {
        console.error(
          "AuthProvider: Firebase Auth não inicializado para login."
        );
        return;
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(authRef.current, provider);
      console.log("AuthProvider: signInWithPopup concluído.");
    } catch (error: any) {
      console.error(
        "AuthProvider: Erro durante o login com Google:",
        error.message
      );
    }
  };

  const logout = async () => {
    console.log("AuthProvider: Tentando logout...");
    try {
      if (!authRef.current) {
        console.error(
          "AuthProvider: Firebase Auth não inicializado para logout."
        );
        return;
      }
      await signOut(authRef.current);
      console.log("AuthProvider: signOut concluído.");
    } catch (error: any) {
      console.error("AuthProvider: Erro durante o logout:", error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, projectId: currentProjectId }}
    >
      {children}
    </AuthContext.Provider>
  );
};
