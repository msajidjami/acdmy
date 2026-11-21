
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';

import { useRouter } from 'next/navigation';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  provider?: string;
  isVerified: boolean;
  lastLogin?: string | null;
  loginCount?: number;
}

type CallKind = 'audio' | 'video';

interface IncomingCall {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  kind: CallKind;
  status: 'ringing';
  expiresAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

function normalizeUser(data: any): User | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const userId = String(data.userId || data.id || '').trim();

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    userId,
    name: String(data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    role: String(data.role || 'user'),
    avatar: String(data.avatar || ''),
    provider: String(data.provider || 'credentials'),
    isVerified: Boolean(data.isVerified),
    lastLogin: data.lastLogin || null,
    loginCount: Number(data.loginCount) || 0,
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [incomingCall, setIncomingCall] =
    useState<IncomingCall | null>(null);

  const [callActionLoading, setCallActionLoading] = useState(false);

  const seenCallIdRef = useRef<string | null>(null);
  const checkingCallRef = useRef(false);
  const mountedRef = useRef(true);

  /**
   * Normalize user state.
   */
  const setUser = useCallback<
    Dispatch<SetStateAction<User | null>>
  >((value) => {
    setUserState((previous) => {
      const nextValue =
        typeof value === 'function'
          ? value(previous)
          : value;

      return nextValue ? normalizeUser(nextValue) : null;
    });
  }, []);

  /**
   * Get current logged-in user.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        setUserState(null);
        return;
      }

      const data = await response.json();

      if (data?.success && data?.user) {
        setUserState(normalizeUser(data.user));
      } else {
        setUserState(null);
      }
    } catch (error) {
      console.error('[AuthProvider] User fetch error:', error);
      setUserState(null);
    }
  }, []);

  /**
   * Initialize authentication.
   */
  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!active) return;

        if (!response.ok) {
          setUserState(null);
          return;
        }

        const data = await response.json();

        if (!active) return;

        if (data?.success && data?.user) {
          setUserState(normalizeUser(data.user));
        } else {
          setUserState(null);
        }
      } catch (error) {
        if (active) {
          console.error(
            '[AuthProvider] Initialization error:',
            error
          );
          setUserState(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  /**
   * Reset incoming call state.
   */
  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
    seenCallIdRef.current = null;
  }, []);

  /**
   * Poll incoming calls while the user is logged in.
   *
   * Expected API:
   * GET /api/calls/incoming
   *
   * {
   *   success: true,
   *   call: {
   *     callId,
   *     callerId,
   *     callerName,
   *     callerAvatar,
   *     kind,
   *     status,
   *     expiresAt
   *   }
   * }
   */
  useEffect(() => {
    if (loading || !user?.userId) {
      setIncomingCall(null);
      seenCallIdRef.current = null;
      return;
    }

    let active = true;

    const checkIncomingCall = async () => {
      if (checkingCallRef.current || document.hidden) {
        return;
      }

      checkingCallRef.current = true;

      try {
        const response = await fetch('/api/calls/incoming', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!active) return;

        if (response.status === 401) {
          setIncomingCall(null);
          return;
        }

        if (!response.ok) {
          // API may not have been created yet.
          if (response.status !== 404) {
            console.warn(
              '[IncomingCall] API response:',
              response.status
            );
          }
          return;
        }

        const data = await response.json();

        if (!active) return;

        const incoming = data?.call;

        if (!data?.success || !incoming?.callId) {
          if (!incoming) {
            setIncomingCall(null);
            seenCallIdRef.current = null;
          }
          return;
        }

        const call: IncomingCall = {
          callId: String(incoming.callId),
          callerId: String(incoming.callerId || ''),
          callerName: String(
            incoming.callerName || 'Unknown caller'
          ),
          callerAvatar: incoming.callerAvatar
            ? String(incoming.callerAvatar)
            : '',
          kind: incoming.kind === 'video' ? 'video' : 'audio',
          status: 'ringing',
          expiresAt: incoming.expiresAt || undefined,
        };

        if (
          !call.callerId ||
          call.callerId === user.userId ||
          call.callId === seenCallIdRef.current
        ) {
          return;
        }

        seenCallIdRef.current = call.callId;
        setIncomingCall(call);
      } catch (error) {
        if (active) {
          console.error(
            '[IncomingCall] Polling error:',
            error
          );
        }
      } finally {
        checkingCallRef.current = false;
      }
    };

    checkIncomingCall();

    const interval = window.setInterval(
      checkIncomingCall,
      2000
    );

    const handleVisibility = () => {
      if (!document.hidden) {
        checkIncomingCall();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      active = false;
      window.clearInterval(interval);

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );

      checkingCallRef.current = false;
    };
  }, [user?.userId, loading]);

  /**
   * Accept incoming call.
   */
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || callActionLoading) return;

    setCallActionLoading(true);

    try {
      const response = await fetch('/api/calls/respond', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: incomingCall.callId,
          action: 'accept',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to accept call');
      }

      const call = incomingCall;

      clearIncomingCall();

      const params = new URLSearchParams({
        type: call.kind,
        name: call.callerName,
        incoming: '1',
        callId: call.callId,
      });

      router.push(
        `/call/${encodeURIComponent(call.callerId)}?${params.toString()}`
      );
    } catch (error: any) {
      console.error('[IncomingCall] Accept error:', error);
      alert(error?.message || 'Unable to accept call');
    } finally {
      setCallActionLoading(false);
    }
  }, [
    incomingCall,
    callActionLoading,
    clearIncomingCall,
    router,
  ]);

  /**
   * Reject incoming call.
   */
  const rejectIncomingCall = useCallback(async () => {
    if (!incomingCall || callActionLoading) return;

    setCallActionLoading(true);

    try {
      const response = await fetch('/api/calls/respond', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: incomingCall.callId,
          action: 'reject',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to reject call');
      }

      clearIncomingCall();
    } catch (error: any) {
      console.error('[IncomingCall] Reject error:', error);
      alert(error?.message || 'Unable to reject call');
    } finally {
      setCallActionLoading(false);
    }
  }, [
    incomingCall,
    callActionLoading,
    clearIncomingCall,
  ]);

  /**
   * Logout.
   *
   * HttpOnly cookies cannot be removed with document.cookie.
   * A server-side logout API should clear the token cookie.
   */
  const logout = useCallback(() => {
    setUserState(null);
    clearIncomingCall();

    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

    router.push('/login');
  }, [clearIncomingCall, router]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        logout,
        refreshUser,
      }}
    >
      {children}

      {/* Global Incoming Call Screen */}
      {incomingCall && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl">
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="mb-5 flex justify-center">
                <div className="relative">
                  {incomingCall.callerAvatar ? (
                    <img
                      src={incomingCall.callerAvatar}
                      alt={incomingCall.callerName}
                      className="h-28 w-28 rounded-full border-4 border-emerald-500/40 object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-500/40 bg-gradient-to-br from-emerald-500 to-teal-700 text-3xl font-bold">
                      {incomingCall.callerName
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}

                  <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-slate-950 bg-emerald-400" />
                </div>
              </div>

              <p className="mb-2 text-sm font-medium text-emerald-400">
                Incoming {incomingCall.kind === 'video' ? 'Video' : 'Audio'} Call
              </p>

              <h2 className="text-2xl font-bold">
                {incomingCall.callerName}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                is calling you...
              </p>
            </div>

            <div className="flex items-center justify-center gap-12 border-t border-white/10 bg-white/[0.03] px-6 py-6">
              <button
                type="button"
                onClick={rejectIncomingCall}
                disabled={callActionLoading}
                className="flex flex-col items-center gap-2 disabled:opacity-50"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl shadow-lg transition hover:bg-red-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-7 w-7 rotate-[135deg]"
                  >
                    <path
                      d="M5 15a10 10 0 0 1 14 0"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 15v4h4M19 15v4h-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-xs text-slate-300">
                  Reject
                </span>
              </button>

              <button
                type="button"
                onClick={acceptIncomingCall}
                disabled={callActionLoading}
                className="flex flex-col items-center gap-2 disabled:opacity-50"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl shadow-lg transition hover:bg-emerald-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-7 w-7"
                  >
                    <path
                      d="M5 15a10 10 0 0 1 14 0"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 15v4h4M19 15v4h-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-xs text-slate-300">
                  Accept
                </span>
              </button>
            </div>

            {callActionLoading && (
              <p className="pb-4 text-center text-xs text-slate-400">
                Please wait...
              </p>
            )}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}
