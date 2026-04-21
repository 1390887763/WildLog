import { useState } from 'react'
import PageHome from './pages/PageHome'
import PageAsset from './pages/PageAsset'
import TabBar from './components/TabBar'
import styles from './App.module.css'

function PlaceholderPage({ icon, title, desc }) {
  return (
    <div className={styles.placeholder}>
      <div className={styles.placeholderIcon}>{icon}</div>
      <h2 className={styles.placeholderTitle}>{title}</h2>
      <p className={styles.placeholderDesc}>{desc}</p>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')

  function renderContent() {
    switch (activeTab) {
      case 'home':
        return <PageHome />
      case 'asset':
        return <PageAsset />
      case 'map':
        return (
          <PlaceholderPage
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            }
            title="地图"
            desc="记录的地点将在这里展示，敬请期待 🗺️"
          />
        )
      case 'profile':
        return (
          <PlaceholderPage
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              </svg>
            }
            title="我的"
            desc="个人设置与统计，敬请期待 👤"
          />
        )
      default:
        return <PageHome />
    }
  }

  return (
    <div className={styles.app}>
      <main className={styles.content}>
        {renderContent()}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
