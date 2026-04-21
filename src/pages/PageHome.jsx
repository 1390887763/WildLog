import { useState, useEffect, useRef } from 'react'
import { uploadImage, insertRecord, fetchRecords, deleteRecord } from '../lib/api'
import styles from './PageHome.module.css'

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

function DetailModal({ record, onClose, onDelete }) {
  if (!record) return null
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <img src={record.image_url} alt="" className={styles.modalImg} />
        <div className={styles.modalBody}>
          <p>{record.note || '无描述'}</p>
          <span className={styles.time}>
            {new Date(record.created_at).toLocaleString('zh-CN')}
          </span>
        </div>
        <button className={styles.modalDelete} onClick={() => onDelete(record.id)}>
          删除此记录
        </button>
        <button className={styles.modalClose} onClick={onClose}>关闭</button>
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

  const [confirmId, setConfirmId] = useState(null)
  const [viewingRecord, setViewingRecord] = useState(null)

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

  async function handleDelete() {
    try {
      const record = records.find((r) => r.id === confirmId)
      await deleteRecord(confirmId, record?.image_url)
      setConfirmId(null)
      loadRecords()
    } catch (err) {
      console.error(err)
      alert('删除失败: ' + err.message)
    }
  }

  function handleModalDelete(id) {
    setViewingRecord(null)
    setConfirmId(id)
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
          <div className={styles.grid}>
            {records.map((record) => (
              <div
                key={record.id}
                className={styles.gridItem}
                onClick={() => setViewingRecord(record)}
              >
                <img src={record.image_url} alt="" className={styles.gridImg} />
              </div>
            ))}
          </div>
        )}
      </div>

      <DetailModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onDelete={handleModalDelete}
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
