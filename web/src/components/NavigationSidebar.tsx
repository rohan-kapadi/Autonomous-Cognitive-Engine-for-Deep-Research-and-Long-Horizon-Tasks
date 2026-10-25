import React from 'react';
import {
  Compass,
  Layers,
  History,
  FileText,
  Bookmark,
  Sliders,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type ActiveView = 'overview' | 'studio' | 'runs' | 'sources' | 'reports' | 'settings';

interface NavigationSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  onNewResearch: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  onNewResearch,
}) => {
  const navItems = [
    { id: 'studio' as ActiveView, label: 'Research Studio', icon: Layers, badge: 'ACTIVE' },
    { id: 'overview' as ActiveView, label: 'Overview', icon: Compass },
    { id: 'runs' as ActiveView, label: 'Research Runs', icon: History },
    { id: 'sources' as ActiveView, label: 'Evidence & Sources', icon: Bookmark },
    { id: 'reports' as ActiveView, label: 'Reports Archive', icon: FileText },
    { id: 'settings' as ActiveView, label: 'System & Engine', icon: Sliders },
  ];

  return (
    <aside
      style={{
        width: collapsed ? 'var(--nav-collapsed-width)' : 'var(--nav-sidebar-width)',
        minWidth: collapsed ? 'var(--nav-collapsed-width)' : 'var(--nav-sidebar-width)',
        height: 'calc(100vh - var(--topbar-height))',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width var(--dur-fast) var(--ease-mechanical)',
        zIndex: 40,
        position: 'relative',
      }}
    >
      {/* Top Action & Navigation List */}
      <div>
        {/* New Research Action Button */}
        <div style={{ padding: 'var(--space-md)' }}>
          <button
            onClick={onNewResearch}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: collapsed ? '8px 0' : '8px 12px',
              justifyContent: 'center',
            }}
            title="Initiate New Autonomous Research Investigation"
          >
            <Plus size={14} />
            {!collapsed && <span>NEW RESEARCH</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 var(--space-xs)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`btn ${isActive ? 'btn-secondary' : ''}`}
                style={{
                  width: '100%',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  border: 'none',
                  background: isActive ? 'var(--bg-panel)' : 'transparent',
                  color: isActive ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  padding: collapsed ? '10px 0' : '9px 12px',
                  marginBottom: '2px',
                  borderRadius: 'var(--radius-sm)',
                  position: 'relative',
                }}
                title={item.label}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '15%',
                      bottom: '15%',
                      width: '3px',
                      backgroundColor: 'var(--accent-lime)',
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                )}
                <Icon size={15} color={isActive ? 'var(--accent-lime)' : 'var(--text-secondary)'} />
                {!collapsed && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flex: 1,
                      marginLeft: '6px',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>{item.label}</span>
                    {item.badge && (
                      <span
                        className="status-pill running"
                        style={{ fontSize: '9px', padding: '1px 4px' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Collapse Toggle */}
      <div
        style={{
          padding: 'var(--space-sm) var(--space-md)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="text-meta" style={{ fontSize: '9px' }}>
              AUTONOMOUS MODE
            </span>
            <span className="mono-data" style={{ fontSize: '10px', color: 'var(--accent-lime)' }}>
              TEMPORAL v1.27
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-icon btn-secondary"
          style={{ padding: '4px' }}
          title={collapsed ? 'Expand Navigation Rail' : 'Collapse Navigation Rail'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>
    </aside>
  );
};
