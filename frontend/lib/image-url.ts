/**
 * Local MinIO URL'leri browser'dan erişilebilir (`localhost:9000`) ama Docker
 * içindeki Next image optimizer için `localhost` frontend container'ı demektir.
 */
export function shouldBypassImageOptimization(src: string | null | undefined): boolean {
  return !!src && /^https?:\/\/localhost:9000\//.test(src);
}
