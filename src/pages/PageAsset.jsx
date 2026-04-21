import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import {
  fetchAssetConfig, upsertAssetConfig,
  fetchMonthlyRecords, saveMonthlyRecord, calculateProjection,
} from '../lib/assets'
import styles from './PageAsset.module.css'

const DEFAULT_CONFIG = {
  monthlyIncome: '',
  yearEndBonus: '',
  initialSavings: '0',
  annualReturnRate: '3',
  workYears: '5',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{d.label}</p>
      <p className={styles.tooltipValue}>
        {d.valueWan} 万
        <span className={`${styles.tooltipTag} ${d.isManual ? styles.tagBlue : styles.tagDim}`}>
          {d.isManual ? '已录入' : '预测'}
        </span>
      </p>
    </div>
  )
}

function RecordModal({ visible, defaultYear, defaultMonth, onClose, onSave }) {
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (visible && defaultYear && defaultMonth) {
      setYear(defaultYear.toString())
      setMonth(defaultMonth.toString())
      setValue('')
    }
  }, [visible, defaultYear, defaultMonth])

  if (!visible) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const y = parseInt(year)
    const m = parseInt(month)
    const v = parseFloat(value)
    if (!y || !m || m < 1 || m > 12 || isNaN(v)) return alert('请填写完整有效信息')
    await onSave(y, m, v)
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>录入资产</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>年</label>
              <input
                className={styles.modalInput}
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
              />
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>月</label>
              <input
                className={styles.modalInput}
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="4"
              />
            </div>
          </div>
          <div className={styles.modalFieldFull}>
            <label className={styles.modalLabel}>资产金额（元）</label>
            <input
              className={styles.modalInput}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="如：1920000"
              autoFocus
            />
          </div>
          <div className={styles.modalBtns}>
            <button type="button" className={styles.modalCancel} onClick={onClose}>取消</button>
            <button type="submit" className={styles.modalSave}>保存</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PageAsset() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [showConfig, setShowConfig] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [projection, setProjection] = useState([])
  const [monthlyRecords, setMonthlyRecords] = useState([])

  const [recordModalVisible, setRecordModalVisible] = useState(false)
  const [defaultYear, setDefaultYear] = useState(null)
  const [defaultMonth, setDefaultMonth] = useState(null)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [cfg, records] = await Promise.all([
        fetchAssetConfig(),
        fetchMonthlyRecords(),
      ])
      if (cfg) {
        setConfig({
          monthlyIncome: cfg.monthly_income?.toString() || '',
          yearEndBonus: cfg.year_end_bonus?.toString() || '',
          initialSavings: cfg.initial_savings?.toString() || '0',
          annualReturnRate: cfg.annual_return_rate?.toString() || '3',
          workYears: cfg.work_years?.toString() || '5',
        })
        setHasSaved(true)
      }
      setMonthlyRecords(records || [])
      if (cfg) {
        setProjection(calculateProjection(cfg, records))
      }
    } catch (e) {
      console.error(e)
    }
  }

  function handleChange(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSaveConfig(e) {
    e.preventDefault()
    if (!config.monthlyIncome) return alert('请输入月薪')
    setSaving(true)
    try {
      const numConfig = {
        monthlyIncome: parseFloat(config.monthlyIncome) || 0,
        yearEndBonus: parseFloat(config.yearEndBonus) || 0,
        initialSavings: parseFloat(config.initialSavings) || 0,
        annualReturnRate: parseFloat(config.annualReturnRate) || 3,
        workYears: parseInt(config.workYears) || 5,
      }
      await upsertAssetConfig(numConfig)
      setHasSaved(true)
      setProjection(calculateProjection(numConfig, monthlyRecords))
      setShowConfig(false)
    } catch (err) {
      console.error(err)
      alert('保存失败')
    }
    setSaving(false)
  }

  async function handleRecord(year, month, value) {
    try {
      const record = await saveMonthlyRecord({ year, month, value, isManual: true })
      const updated = [
        ...monthlyRecords.filter((r) => !(r.year === year && r.month === month)),
        record,
      ]
      setMonthlyRecords(updated)

      const cfg = hasSaved ? {
        monthlyIncome: parseFloat(config.monthlyIncome) || 0,
        yearEndBonus: parseFloat(config.yearEndBonus) || 0,
        initialSavings: parseFloat(config.initialSavings) || 0,
        annualReturnRate: parseFloat(config.annualReturnRate) || 3,
        workYears: parseInt(config.workYears) || 5,
      } : DEFAULT_CONFIG
      setProjection(calculateProjection(cfg, updated))
    } catch (err) {
      console.error(err)
      alert('录入失败')
    }
  }

  function openRecordThisMonth() {
    setDefaultYear(currentYear)
    setDefaultMonth(currentMonth)
    setRecordModalVisible(true)
  }

  function renderChart() {
    if (projection.length === 0) return null

    const maxValue = Math.max(...projection.map((d) => d.value / 10000)) * 1.15

    return (
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>资产走势</h3>
          <span className={styles.legend}>
            <span className={styles.legendDot} style={{ background: '#0095f6' }} />
            已录入
            <span className={styles.legendDot} style={{ background: 'rgba(188,24,136,0.35)' }} />
            预测
          </span>
        </div>

        <div className={styles.chartWrap}>
          <ResponsiveContainer width={Math.max(projection.length * 40, 400)} height={240}>
            <BarChart
              data={projection}
              margin={{ top: 10, right: 4, left: -20, bottom: 0 }}
              barSize={22}
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={[0, maxValue]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.06)' }} />
              <Bar
                dataKey="value"
                shape={(props) => {
                  const d = props.payload[0]?.payload
                  return (
                    <rect
                      {...props}
                      fill={d?.isManual ? '#0095f6' : 'rgba(188,24,136,0.35)'}
                      radius={[4, 4, 0, 0]}
                      style={{ cursor: d?.isManual ? 'pointer' : 'pointer' }}
                    />
                  )
                }}
                onClick={(data) => {
                  if (data) {
                    setDefaultYear(data.year)
                    setDefaultMonth(data.month)
                    setRecordModalVisible(true)
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>最新资产</span>
            <span className={styles.summaryValue}>
              {(monthlyRecords[monthlyRecords.length - 1]?.value / 10000).toFixed(2) || '--'} 万
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>已录入</span>
            <span className={styles.summaryValue}>
              {monthlyRecords.filter((r) => r.is_manual).length} 个月
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>最终预测</span>
            <span className={styles.summaryValue}>
              {projection[projection.length - 1]?.valueWan || '--'} 万
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>💰 资产</h1>
        <button className={styles.configBtn} onClick={() => setShowConfig(!showConfig)}>
          ⚙️
        </button>
      </header>

      <button className={styles.quickAddBtn} onClick={openRecordThisMonth}>
        + 录入 {currentYear}.{currentMonth} 资产
      </button>

      {showConfig && (
        <form className={styles.form} onSubmit={handleSaveConfig}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>月薪（元）</label>
            <input
              className={styles.input}
              type="number"
              placeholder="20000"
              value={config.monthlyIncome}
              onChange={(e) => handleChange('monthlyIncome', e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>年终奖（元）</label>
            <input
              className={styles.input}
              type="number"
              placeholder="50000"
              value={config.yearEndBonus}
              onChange={(e) => handleChange('yearEndBonus', e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>初始存款</label>
              <input
                className={styles.input}
                type="number"
                placeholder="0"
                value={config.initialSavings}
                onChange={(e) => handleChange('initialSavings', e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>年化收益率%</label>
              <input
                className={styles.input}
                type="number"
                step="0.1"
                placeholder="3"
                value={config.annualReturnRate}
                onChange={(e) => handleChange('annualReturnRate', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>预测年限</label>
            <input
              className={styles.input}
              type="number"
              placeholder="5"
              value={config.workYears}
              onChange={(e) => handleChange('workYears', e.target.value)}
            />
          </div>

          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? '保存中...' : '更新配置'}
          </button>
        </form>
      )}

      {renderChart()}

      <RecordModal
        visible={recordModalVisible}
        defaultYear={defaultYear}
        defaultMonth={defaultMonth}
        onClose={() => setRecordModalVisible(false)}
        onSave={handleRecord}
      />
    </div>
  )
}
