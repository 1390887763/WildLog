import { useState, useEffect, useRef } from 'react'
import { uploadImage, insertRecord, fetchRecords, deleteRecord } from '../lib/api'
import styles from './PageHome.module.css'

function ActionSheet({ visible, onCancel, onDelete }) {
  if (!visible) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.actionSheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.dangerBtn} onClick={onDelete}>删除</button>
        <button className={styles.cancelBtn} onClick={onCancel}>取消</button>
      </div>
    </div>
  )
}

function ConfirmAlert({ visible, message, onConfirm, onCancel }) {
  if (!visible) return null

  return (
    <div className={styles.alertOverlay} onClick={onCancel}>
      <div className={styles.alertBox} onClick={(e) => e.stopPropagation()}>
        <p className={styles.alertMsg}>{message}</p>
        <div className={styles.alertBtns}>
          <button className={styles.alertCancel} onClick={onCancel}>取消</button>
          <button className={styles.alertConfirm} onClick={onConfirm}>删除</button>
        </div>
      </div>
    </div>
  )
}

export default function PageHome() {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [note, setNote] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const [actionSheetId, setActionSheetId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const longPressTimer = useRef(null)

  useEffect(() => {
    loadRecords()
    getLocation()
  }, [])

  function loadRecords() {
    fetchRecords().then(setRecords).catch(console.error)
  }

  function getLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
      },
      () => {}
    )
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!image) return alert('请选择图片')

    setLoading(true)
    try {
      const imageUrl = await uploadImage(image)
      await insertRecord({
        image_url: imageUrl,
        note,
        latitude,
        longitude,
      })
      setImage(null)
      setImagePreview('')
      setNote('')
      fileInputRef.current.value = ''
      loadRecords()
    } catch (err) {
      console.error(err)
      alert('提交失败: ' + err.message)
    }
    setLoading(false)
  }

  function handleLongPressStart(id) {
    longPressTimer.current = setTimeout(() => {
      setActionSheetId(id)
      navigator.vibrate?.(10)
    }, 500)
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  async function handleDelete() {
    try {
      await deleteRecord(confirmId)
      setConfirmId(null)
      setActionSheetId(null)
      loadRecords()
    } catch (err) {
      console.error(err)
      alert('删除失败: ' + err.message)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>WildLog</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div
          className={styles.uploadArea}
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="预览" className={styles.preview} />
          ) : (
            <div className={styles.uploadPlaceholder}>
              <span>添加照片</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            hidden
          />
        </div>

        <textarea
          className={styles.textarea}
          placeholder="写下你的观察..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        {latitude && longitude && (
          <p className={styles.location}>
            📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? '发布中...' : '发布'}
        </button>
      </form>

      <div className={styles.recordList}>
        <h2>探索记录</h2>
        {records.length === 0 ? (
          <p className={styles.empty}>还没有记录，去发现大自然吧 🌿</p>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className={styles.card}
              onTouchStart={() => handleLongPressStart(record.id)}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
              onMouseDown={() => handleLongPressStart(record.id)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
            >
              <img src={record.image_url} alt="" className={styles.cardImg} />
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>W</div>
                <div className={styles.cardUserInfo}>
                  <span className={styles.cardUsername}>wildlog</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p>
                  <span className={styles.noteLabel}>wildlog</span>
                  {record.note || '无描述'}
                </p>
                <span className={styles.time}>
                  {new Date(record.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <ActionSheet
        visible={!!actionSheetId}
        onCancel={() => setActionSheetId(null)}
        onDelete={() => {
          setConfirmId(actionSheetId)
          setActionSheetId(null)
        }}
      />

      <ConfirmAlert
        visible={!!confirmId}
        message="确定要删除这条记录吗？此操作不可撤销。"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
