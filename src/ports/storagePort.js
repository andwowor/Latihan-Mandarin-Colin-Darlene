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

  /**
   * Setelan perangkat ini (mis. sambungan sinkronisasi).
   *
   * Disimpan terpisah dari progres dan TIDAK pernah ikut dikirim ke server:
   * alamat server, kode keluarga, dan PIN adalah milik perangkat, bukan bagian
   * dari catatan belajar anak.
   */
  readSettings() {
    return {};
  }

  /** @param {object} settings */
  writeSettings(settings) {
    return false;
  }
}
