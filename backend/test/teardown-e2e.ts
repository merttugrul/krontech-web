/**
 * Jest globalTeardown — tüm e2e testlerden SONRA bir kez çalışır.
 *
 * Stratejisi: test DB'yi tutuyoruz (silmiyoruz) — debug için faydalı.
 * Yeni test çalıştığında zaten TRUNCATE ile temizlenecek.
 *
 * Production/dev DB'ye asla dokunulmaz.
 */
export default async function globalTeardown(): Promise<void> {
  // Şu an için no-op. Flaky test debug'ı için DB'yi bozulmamış bırakıyoruz.
  // İlerde CI'de cleanup istersek buraya ekleriz.
}
