import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logoutMutation = trpc.localAuth.logout.useMutation();

  // 初始化时从localStorage恢复认证状态
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // 验证token是否仍然有效
        validateSession(storedToken);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        clearAuth();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // 验证会话
  const validateSession = async (tokenToValidate: string) => {
    try {
      // 使用fetch直接调用API，不传token参数，后端从cookie读取
      const response = await fetch('/api/trpc/localAuth.validateSession?batch=1', {
        credentials: 'include' // 确保发送cookie
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // tRPC batch响应格式: [{ result: { data: { valid, user } } }]
      const result = data[0]?.result?.data;
      
      if (result && result.valid && result.user) {
        setUser(result.user);
        setToken(tokenToValidate);
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error("Session validation failed:", error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  // 会话超时检测
  useEffect(() => {
    if (!token) return;

    let lastActivityTime = Date.now();
    const SESSION_TIMEOUT = 15 * 60 * 1000; // 15分钟

    // 更新最后活动时间
    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // 监听用户活动
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // 每分钟检查一次是否超时
    const checkTimeout = setInterval(() => {
      const idleTime = Date.now() - lastActivityTime;
      if (idleTime > SESSION_TIMEOUT) {
        console.log("Session timeout due to inactivity");
        logout();
      }
    }, 60 * 1000); // 每分钟检查一次

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(checkTimeout);
    };
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const logout = () => {
    if (token) {
      logoutMutation.mutate({ token });
    }
    clearAuth();
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
