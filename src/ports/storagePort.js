// Port untuk penyimpanan progres per anak.

export class StoragePort {
  /** @returns {object} seluruh state aplikasi */
  read() {
    throw new Error('not implemented');
  }

  /** @param {object} state */
  write(state) {
    throw new Error('not implemented');
  }

  /** Hapus semua data (dipakai tombol reset di menu orang tua). */
  clear() {
    throw new Error('not implemented');
  }
}
