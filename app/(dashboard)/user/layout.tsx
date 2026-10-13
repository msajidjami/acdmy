'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageCircle,
  User,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  Compass,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

const navItems: NavItem[] = [
  { name: 'Chats', href: '/user', icon: MessageCircle },
  { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'Profile', href: '/user/profile', icon: User },
  { name: 'Settings', href: '/user/settings', icon: Settings },
];

const bottomTabs: NavItem[] = [
  { name: 'Chats', href: '/user', icon: MessageCircle },
  { name: 'Home', href: '/user/dashboard', icon: LayoutDashboard },
  { name: 'Explore', href: '/explore', icon: Compass },
  { name: 'Profile', href: '/user/profile', icon: User },
];

const SIDEBAR_W = 256;
const NAVBAR_H_FALLBACK = 56;

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navHeight, setNavHeight] = useState(NAVBAR_H_FALLBACK);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const measure = () => {
      const navs = Array.from(document.querySelectorAll('nav'));
      for (const n of navs) {
        const rect = n.getBoundingClientRect();
        if (rect.height === 0) continue;
        const cs = window.getComputedStyle(n);
        if (cs.position === 'sticky' || cs.position === 'fixed') {
          if (cs.bottom !== 'auto') continue;
          setNavHeight(rect.height || NAVBAR_H_FALLBACK);
          return;
        }
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isDesktop]);

  useEffect(() => { setIsMoreOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMoreOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMoreOpen]);

  useEffect(() => {
    if (!isDesktop) return;
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/contacts/unread-count', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setUnreadCount(Number(data?.count) || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname, isDesktop]);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  const isItemActive = (href: string) => {
    if (href === '/user') {
      return pathname === '/user' || pathname === '/user/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderSidebar = () => {
    if (!isDesktop) return null;

    return (
      <aside
        style={{
          position: 'fixed',
          top: navHeight,
          left: 0,
          bottom: 0,
          width: SIDEBAR_W,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Brand — violet theme for user */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 16px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <Link
            href="/user/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7, #c026d3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(168,85,247,0.25)',
                flexShrink: 0,
              }}
            >
              <GraduationCap style={{ width: 18, height: 18, color: '#ffffff' }} />
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#34d399',
                  border: '2px solid #ffffff',
                }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                My Account
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                Learn & connect
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            const isChats = item.href === '/user';
            const showBadge = isChats && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  background: active
                    ? 'linear-gradient(to right, #f5f3ff, #fdf4ff)'
                    : 'transparent',
                  color: active ? '#7c3aed' : '#475569',
                  transition: 'background 0.15s',
                }}
              >
                <span
                  style={{
                    position: 'relative',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: active
                      ? 'linear-gradient(135deg, #8b5cf6, #a855f7)'
                      : '#f1f5f9',
                    color: active ? '#ffffff' : '#64748b',
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {showBadge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        borderRadius: 999,
                        background: '#f43f5e',
                        color: '#ffffff',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #ffffff',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span style={{ flex: 1 }}>{item.name}</span>
                {showBadge && (
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 999,
                      background: '#ffe4e6',
                      color: '#e11d48',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid #f1f5f9',
            padding: 12,
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: '#e11d48',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffe4e6',
              }}
            >
              <LogOut style={{ width: 16, height: 16, color: '#e11d48' }} />
            </span>
            <span style={{ flex: 1 }}>Logout</span>
          </button>
        </div>
      </aside>
    );
  };

  const renderMobile = () => {
    if (isDesktop) return null;

    return (
      <>
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -4px 20px -8px rgba(15,23,42,0.15)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              height: 64,
            }}
          >
            {bottomTabs.map((tab) => {
              const active = isItemActive(tab.href);
              const Icon = tab.icon;
              const isChats = tab.href === '/user';
              const showBadge = isChats && unreadCount > 0;

              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 32,
                      borderRadius: 999,
                      background: active ? '#ede9fe' : 'transparent',
                      color: active ? '#7c3aed' : '#64748b',
                    }}
                  >
                    <Icon style={{ width: 20, height: 20 }} />
                    {showBadge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          minWidth: 16,
                          height: 16,
                          padding: '0 4px',
                          borderRadius: 999,
                          background: '#f43f5e',
                          color: '#ffffff',
                          fontSize: 9,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #ffffff',
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      lineHeight: 1,
                      color: active ? '#7c3aed' : '#64748b',
                    }}
                  >
                    {tab.name}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 32,
                  borderRadius: 999,
                  color: '#64748b',
                }}
              >
                <MoreHorizontal style={{ width: 20, height: 20 }} />
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  lineHeight: 1,
                  color: '#64748b',
                }}
              >
                More
              </span>
            </button>
          </div>
        </nav>

        {/* More sheet */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            pointerEvents: isMoreOpen ? 'auto' : 'none',
            opacity: isMoreOpen ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        >
          <div
            onClick={() => setIsMoreOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15,23,42,0.5)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#ffffff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: '0 -10px 40px rgba(15,23,42,0.2)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              transform: isMoreOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s ease-out',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div
              style={{
                paddingTop: 12,
                paddingBottom: 4,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  height: 6,
                  width: 48,
                  borderRadius: 999,
                  background: '#cbd5e1',
                }}
              />
            </div>
            <div
              style={{
                padding: '8px 16px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7, #c026d3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GraduationCap style={{ width: 20, height: 20, color: '#ffffff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    My Account
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Learn & connect
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight
                  style={{
                    width: 16,
                    height: 16,
                    color: '#334155',
                    transform: 'rotate(90deg)',
                  }}
                />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: 12 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 16,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      background: active
                        ? 'linear-gradient(to right, #f5f3ff, #fdf4ff)'
                        : 'transparent',
                      color: active ? '#7c3aed' : '#334155',
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: active
                          ? 'linear-gradient(135deg, #8b5cf6, #a855f7)'
                          : '#f1f5f9',
                        color: active ? '#ffffff' : '#64748b',
                      }}
                    >
                      <Icon style={{ width: 18, height: 18 }} />
                    </span>
                    <span style={{ flex: 1 }}>{item.name}</span>
                    <ChevronRight style={{ width: 16, height: 16, color: '#94a3b8' }} />
                  </Link>
                );
              })}
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    width: '100%',
                    borderRadius: 16,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#e11d48',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ffe4e6',
                    }}
                  >
                    <LogOut style={{ width: 18, height: 18, color: '#e11d48' }} />
                  </span>
                  <span style={{ flex: 1 }}>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {renderSidebar()}
      <div
        style={{
          paddingLeft: isDesktop ? SIDEBAR_W : 0,
          minHeight: '100vh',
          background: '#f8fafc',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            paddingBottom: isDesktop ? 0 : 80,
          }}
        >
          {children}
        </main>
      </div>
      {renderMobile()}
    </>
  );
}