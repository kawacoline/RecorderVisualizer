import type { SongMetadata } from '../types/music'
import { PRESET_SONGS } from './songsLibrary'

const DB_NAME = 'RecorderStudioDB'
const DB_VERSION = 1
const STORE_NAME = 'songs'
const DELETED_PRESETS_KEY = 'recorder_deleted_presets_ids'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getDeletedPresetIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_PRESETS_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return new Set(arr)
    }
  } catch {
    // Ignore storage errors
  }
  return new Set()
}

function addDeletedPresetId(id: string) {
  try {
    const set = getDeletedPresetIds()
    set.add(id)
    localStorage.setItem(DELETED_PRESETS_KEY, JSON.stringify(Array.from(set)))
  } catch {
    // Ignore storage errors
  }
}

function clearDeletedPresetIds() {
  try {
    localStorage.removeItem(DELETED_PRESETS_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Loads all songs from IndexedDB.
 * If first time, initializes with PRESET_SONGS (excluding any explicitly deleted presets).
 */
export async function loadSongsFromDb(): Promise<SongMetadata[]> {
  const deletedPresets = getDeletedPresetIds()
  const initialPresets = PRESET_SONGS.filter((s) => !deletedPresets.has(s.id))

  try {
    const db = await openDb()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const result = request.result as SongMetadata[]
        if (!result || result.length === 0) {
          // Check if user previously deleted everything or if it's first run
          const hasInitializedBefore = localStorage.getItem('recorder_db_initialized')
          if (!hasInitializedBefore) {
            localStorage.setItem('recorder_db_initialized', 'true')
            saveMultipleSongsToDb(initialPresets)
            resolve(initialPresets)
          } else {
            resolve([])
          }
        } else {
          resolve(result)
        }
      }

      request.onerror = () => {
        resolve(initialPresets)
      }
    })
  } catch {
    return initialPresets
  }
}

/**
 * Save or update a song in the IndexedDB database.
 */
export async function saveSongToDb(song: SongMetadata): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(song)
    await new Promise((res) => {
      tx.oncomplete = () => res(true)
    })
  } catch (err) {
    console.error('Failed to save song to IndexedDB:', err)
  }
}

/**
 * Batch save multiple songs.
 */
export async function saveMultipleSongsToDb(songs: SongMetadata[]): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    songs.forEach((song) => store.put(song))
    await new Promise((res) => {
      tx.oncomplete = () => res(true)
    })
  } catch (err) {
    console.error('Failed to batch save songs:', err)
  }
}

/**
 * Deletes a song by ID from IndexedDB and tracks deleted preset IDs.
 */
export async function deleteSongFromDb(songId: string): Promise<void> {
  addDeletedPresetId(songId)
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(songId)
    await new Promise((res) => {
      tx.oncomplete = () => res(true)
    })
  } catch (err) {
    console.error('Failed to delete song from IndexedDB:', err)
  }
}

/**
 * Restores all original PRESET_SONGS into the database.
 */
export async function restorePresetSongsInDb(): Promise<SongMetadata[]> {
  clearDeletedPresetIds()
  localStorage.setItem('recorder_db_initialized', 'true')
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    // Put all presets back
    PRESET_SONGS.forEach((song) => store.put(song))
    await new Promise((res) => {
      tx.oncomplete = () => res(true)
    })
  } catch (err) {
    console.error('Failed to restore preset songs in IndexedDB:', err)
  }
  return PRESET_SONGS
}
