import styles from './TabBar.module.css'

const TABS = [
  {
    key: 'home',
    label: '探索',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    key: 'map',
    label: '地图',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" />
        <line x1="8" y1="2" x2="8" y2="18" stroke="#000" strokeWidth="2" opacity="0.4"/>
        <line x1="16" y1="6" x2="16" y2="22" stroke="#000" strokeWidth="2" opacity="0.4"/>
      </svg>
    ),
  },
  {
    key: 'profile',
    label: '我的',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.tabbar}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {activeTab === tab.key ? tab.activeIcon : tab.icon}
          <span className={styles.tabLabel}>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
