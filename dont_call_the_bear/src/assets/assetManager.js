import { IMAGE_MANIFEST, AUDIO_MANIFEST } from '../../assets/manifest.js';

/**
 * Керує зображеннями та аудіофайлами з manifest.js і завантаженими користувачем файлами.
 * Якщо файл не вказаний або не завантажився — повертає null, і гра використовує заглушки/синтез.
 */
export class AssetManager {
  constructor() {
    this.imageEntries = IMAGE_MANIFEST.map((entry) => ({ ...entry }));
    this.audioEntries = AUDIO_MANIFEST.map((entry) => ({ ...entry }));

    this.images = new Map();
    this.imageSourceKind = new Map(); // 'manifest' | 'upload'
    this.imageObjectUrls = new Map();

    this.audioBuffers = new Map();
    this.audioRawArrayBuffers = new Map();
    this.audioSourceKind = new Map(); // 'manifest' | 'upload'
    this.audioErrors = new Map();
    this.imageErrors = new Map();
  }

  async preloadManifest(audioCtx = null) {
    const imagePromises = this.imageEntries
      .filter((entry) => Boolean(entry.src))
      .map((entry) => this.#loadImageFromSrc(entry.id, entry.src, 'manifest'));

    const audioPromises = this.audioEntries
      .filter((entry) => Boolean(entry.src))
      .map((entry) => this.#fetchAudioFromSrc(entry.id, entry.src, 'manifest', audioCtx));

    await Promise.allSettled([...imagePromises, ...audioPromises]);
  }

  async decodePendingAudio(audioCtx) {
    if (!audioCtx) return;
    const tasks = [];
    for (const [id, rawBuffer] of this.audioRawArrayBuffers.entries()) {
      if (this.audioBuffers.has(id)) continue;
      tasks.push(this.#decodeAudio(id, rawBuffer.slice(0), audioCtx));
    }
    await Promise.allSettled(tasks);
  }

  #loadImageFromSrc(id, src, kind) {
    return new Promise((resolve) => {
      if (typeof Image === 'undefined') {
        resolve(false);
        return;
      }
      const img = new Image();
      img.onload = () => {
        this.images.set(id, img);
        this.imageSourceKind.set(id, kind);
        this.imageErrors.delete(id);
        resolve(true);
      };
      img.onerror = () => {
        this.imageErrors.set(id, `Не вдалося завантажити ${src}`);
        resolve(false);
      };
      img.src = src;
    });
  }

  async #fetchAudioFromSrc(id, src, kind, audioCtx = null) {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.audioRawArrayBuffers.set(id, arrayBuffer);
      this.audioSourceKind.set(id, kind);
      this.audioErrors.delete(id);
      if (audioCtx) {
        await this.#decodeAudio(id, arrayBuffer.slice(0), audioCtx);
      }
      return true;
    } catch (err) {
      this.audioErrors.set(id, `Не вдалося завантажити ${src}: ${err.message}`);
      return false;
    }
  }

  async #decodeAudio(id, arrayBuffer, audioCtx) {
    try {
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(id, decoded);
      this.audioErrors.delete(id);
      return true;
    } catch (err) {
      this.audioErrors.set(id, `Помилка декодування аудіо: ${err.message}`);
      return false;
    }
  }

  async setCustomImageFile(id, file) {
    if (!file) return false;
    const oldUrl = this.imageObjectUrls.get(id);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    this.imageObjectUrls.set(id, objectUrl);
    const ok = await this.#loadImageFromSrc(id, objectUrl, 'upload');
    if (!ok) {
      URL.revokeObjectURL(objectUrl);
      this.imageObjectUrls.delete(id);
    }
    return ok;
  }

  async setCustomAudioFile(id, file, audioCtx = null) {
    if (!file) return false;
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.audioRawArrayBuffers.set(id, arrayBuffer);
      this.audioSourceKind.set(id, 'upload');
      this.audioBuffers.delete(id);
      if (audioCtx) {
        return await this.#decodeAudio(id, arrayBuffer.slice(0), audioCtx);
      }
      return true;
    } catch (err) {
      this.audioErrors.set(id, `Помилка читання файлу: ${err.message}`);
      return false;
    }
  }

  async resetImage(id) {
    const oldUrl = this.imageObjectUrls.get(id);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      this.imageObjectUrls.delete(id);
    }
    this.images.delete(id);
    this.imageSourceKind.delete(id);
    this.imageErrors.delete(id);

    const entry = this.imageEntries.find((item) => item.id === id);
    if (entry?.src) {
      await this.#loadImageFromSrc(id, entry.src, 'manifest');
    }
  }

  async resetAudio(id, audioCtx = null) {
    this.audioBuffers.delete(id);
    this.audioRawArrayBuffers.delete(id);
    this.audioSourceKind.delete(id);
    this.audioErrors.delete(id);

    const entry = this.audioEntries.find((item) => item.id === id);
    if (entry?.src) {
      await this.#fetchAudioFromSrc(id, entry.src, 'manifest', audioCtx);
    }
  }

  getImage(id) {
    return this.images.get(id) || null;
  }

  getAudioBuffer(id) {
    return this.audioBuffers.get(id) || null;
  }

  isCustom(type, id) {
    if (type === 'image') {
      return this.images.has(id);
    }
    if (type === 'audio') {
      return this.audioBuffers.has(id) || this.audioRawArrayBuffers.has(id);
    }
    return false;
  }

  getStatusList() {
    const images = this.imageEntries.map((entry) => {
      const loaded = this.images.has(entry.id);
      const kind = this.imageSourceKind.get(entry.id) || null;
      return {
        ...entry,
        type: 'image',
        loaded,
        sourceKind: kind,
        statusLabel: loaded
          ? kind === 'upload'
            ? 'Завантажено (тест)'
            : 'Файл з manifest.js'
          : 'Заглушка',
        error: this.imageErrors.get(entry.id) || null
      };
    });

    const audio = this.audioEntries.map((entry) => {
      const loaded = this.audioBuffers.has(entry.id) || this.audioRawArrayBuffers.has(entry.id);
      const kind = this.audioSourceKind.get(entry.id) || null;
      return {
        ...entry,
        type: 'audio',
        loaded,
        sourceKind: kind,
        statusLabel: loaded
          ? kind === 'upload'
            ? 'Завантажено (тест)'
            : 'Файл з manifest.js'
          : 'Синтезатор (заглушка)',
        error: this.audioErrors.get(entry.id) || null
      };
    });

    return { images, audio };
  }
}
