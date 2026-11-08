export const languages = ['vi', 'en', 'pt', 'id'] as const;
export type Language = typeof languages[number];
export const languageNames: Record<Language, string> = { vi: 'Tiếng Việt', en: 'English', pt: 'Português', id: 'Bahasa Indonesia' };
export const languagePaths = {
  vi: { home: '/', reels: '/facebook-reels-downloader' },
  en: { home: '/en', reels: '/en/facebook-reels-downloader' },
  pt: { home: '/pt', reels: '/pt/facebook-reels-downloader' },
  id: { home: '/id', reels: '/id/facebook-reels-downloader' },
} as const;
export function languageFromPath(path: string): Language {
  const first = path.split('/')[1];
  if (first === 'en' || first === 'pt' || first === 'id' || first === 'vi') return first;
  return path === '/' || /^\/(facebook-reels|tiktok|douyin|twitter|threads)-downloader$/.test(path) ? 'vi' : 'en';
}
export const copy = {
  en: {
    linkAccepted: 'Link accepted',
    videoTitle: 'Facebook Video Downloader', reelsTitle: 'Facebook Reels Downloader',
    videoIntro: 'Download public Facebook videos and Reels in available quality, or save their original sound as 320 kbps MP3.',
    reelsIntro: 'Save public Facebook Reels in the available quality, or download their original sound as 320 kbps MP3.',
    placeholder: 'Paste Facebook video / Reel URL...', reelPlaceholder: 'Paste Facebook Reel URL...',
    download: 'Download', paste: 'Paste', clear: 'Clear', processing: 'Processing...', fetching: 'Fetching your video...', quality: 'Quality',
    save: 'Save', retry: 'Retry processing', cloud: 'Use CloudConvert instead', image: 'Download Image', thumbnail: 'Thumbnail image',
    mp3Working: 'Rendering MP3', mp3Retry: 'Retry MP3', render: 'render', workingVideo: 'Processing high quality video...',
    processingNote: 'Combining the original video and audio. Keep this page open. Processing uses your device; large files may need CloudConvert.',
    available: 'The HD/SD downloads above are still available.', key: 'Your CloudConvert API key', keyPlaceholder: 'Paste your API key',
    keyBefore: 'Conversion credits depend on your CloudConvert plan. Get a key', keyLink: 'from CloudConvert',
    keyAfter: 'and paste it below. Your saved key is stored in this browser and sent securely when you request a conversion.',
    reelExample: 'Public Reel links: facebook.com/reel/... or facebook.com/share/r/...',
    processing1080: 'Processing 1080p…', unavailable: '1080p · Not available', hdTooltip: 'Downloads the available HD source when native 1080p is unavailable',
    about: 'About', help: 'Help', privacy: 'Privacy', terms: 'Terms', contact: 'Contact', menuOpen: 'Open menu', menuClose: 'Close menu', language: 'Choose language',
    rights: 'Download only content you own or have permission to save.', independent: 'Independent service. Not affiliated with Facebook or Meta.',
  },
  vi: {
    linkAccepted: 'Đã nhận liên kết',
    videoTitle: 'Trình tải video Facebook', reelsTitle: 'Trình tải Facebook Reels',
    videoIntro: 'Tải video và Reels công khai trên Facebook với chất lượng có sẵn, hoặc lưu âm thanh gốc dưới dạng MP3 320 kbps.',
    reelsIntro: 'Tải Facebook Reels công khai với chất lượng có sẵn, hoặc lưu âm thanh gốc dưới dạng MP3 320 kbps.',
    placeholder: 'Dán liên kết video / Reel Facebook...', reelPlaceholder: 'Dán liên kết Facebook Reel...',
    download: 'Tải xuống', paste: 'Dán', clear: 'Xóa', processing: 'Đang xử lý...', fetching: 'Đang tìm video của bạn...', quality: 'Chất lượng',
    save: 'Lưu', retry: 'Thử xử lý lại', cloud: 'Dùng CloudConvert', image: 'Tải hình ảnh', thumbnail: 'Ảnh thu nhỏ',
    mp3Working: 'Đang chuyển đổi MP3', mp3Retry: 'Thử lại MP3', render: 'chuyển đổi', workingVideo: 'Đang xử lý video chất lượng cao...',
    processingNote: 'Đang ghép video và âm thanh gốc. Hãy giữ trang này mở. Xử lý trên thiết bị của bạn; tệp lớn có thể cần CloudConvert.',
    available: 'Các tệp HD/SD ở trên vẫn có thể tải xuống.', key: 'Khóa API CloudConvert của bạn', keyPlaceholder: 'Dán khóa API của bạn',
    keyBefore: 'Số lượt chuyển đổi phụ thuộc vào gói CloudConvert của bạn. Lấy khóa', keyLink: 'từ CloudConvert',
    keyAfter: 'và dán bên dưới. Khóa được lưu trong trình duyệt này và gửi an toàn khi bạn yêu cầu chuyển đổi.',
    reelExample: 'Liên kết Reel công khai: facebook.com/reel/... hoặc facebook.com/share/r/...',
    processing1080: 'Đang xử lý 1080p…', unavailable: '1080p · Không có sẵn', hdTooltip: 'Tải nguồn HD có sẵn khi không có nguồn 1080p gốc',
    about: 'Giới thiệu', help: 'Trợ giúp', privacy: 'Quyền riêng tư', terms: 'Điều khoản', contact: 'Liên hệ', menuOpen: 'Mở menu', menuClose: 'Đóng menu', language: 'Chọn ngôn ngữ',
    rights: 'Chỉ tải nội dung bạn sở hữu hoặc được phép lưu.', independent: 'Dịch vụ độc lập. Không liên kết với Facebook hoặc Meta.',
  },
  pt: {
    linkAccepted: 'Link aceito',
    videoTitle: 'Baixar vídeos do Facebook', reelsTitle: 'Baixar Reels do Facebook',
    videoIntro: 'Baixe vídeos e Reels públicos do Facebook na qualidade disponível ou salve o áudio original em MP3 de 320 kbps.',
    reelsIntro: 'Baixe Reels públicos do Facebook na qualidade disponível ou salve o áudio original em MP3 de 320 kbps.',
    placeholder: 'Cole o link do vídeo / Reel do Facebook...', reelPlaceholder: 'Cole o link do Reel do Facebook...',
    download: 'Baixar', paste: 'Colar', clear: 'Limpar', processing: 'Processando...', fetching: 'Buscando seu vídeo...', quality: 'Qualidade',
    save: 'Salvar', retry: 'Tentar processar novamente', cloud: 'Usar CloudConvert', image: 'Baixar imagem', thumbnail: 'Miniatura',
    mp3Working: 'Convertendo MP3', mp3Retry: 'Tentar MP3 novamente', render: 'converter', workingVideo: 'Processando vídeo de alta qualidade...',
    processingNote: 'Combinando vídeo e áudio originais. Mantenha esta página aberta. O processamento usa seu dispositivo; arquivos grandes podem precisar do CloudConvert.',
    available: 'Os downloads HD/SD acima continuam disponíveis.', key: 'Sua chave API do CloudConvert', keyPlaceholder: 'Cole sua chave API',
    keyBefore: 'Os créditos de conversão dependem do seu plano CloudConvert. Obtenha uma chave', keyLink: 'no CloudConvert',
    keyAfter: 'e cole abaixo. Sua chave é salva neste navegador e enviada com segurança ao solicitar uma conversão.',
    reelExample: 'Links públicos de Reels: facebook.com/reel/... ou facebook.com/share/r/...',
    processing1080: 'Processando 1080p…', unavailable: '1080p · Indisponível', hdTooltip: 'Baixa a fonte HD disponível quando não há 1080p nativo',
    about: 'Sobre', help: 'Ajuda', privacy: 'Privacidade', terms: 'Termos', contact: 'Contato', menuOpen: 'Abrir menu', menuClose: 'Fechar menu', language: 'Escolher idioma',
    rights: 'Baixe apenas conteúdo que você possui ou tem permissão para salvar.', independent: 'Serviço independente. Sem vínculo com Facebook ou Meta.',
  },
  id: {
    linkAccepted: 'Tautan diterima',
    videoTitle: 'Pengunduh Video Facebook', reelsTitle: 'Pengunduh Facebook Reels',
    videoIntro: 'Unduh video dan Reels publik Facebook dalam kualitas yang tersedia, atau simpan audio aslinya sebagai MP3 320 kbps.',
    reelsIntro: 'Unduh Facebook Reels publik dalam kualitas yang tersedia, atau simpan audio aslinya sebagai MP3 320 kbps.',
    placeholder: 'Tempel tautan video / Reel Facebook...', reelPlaceholder: 'Tempel tautan Facebook Reel...',
    download: 'Unduh', paste: 'Tempel', clear: 'Hapus', processing: 'Memproses...', fetching: 'Mencari video Anda...', quality: 'Kualitas',
    save: 'Simpan', retry: 'Coba proses lagi', cloud: 'Gunakan CloudConvert', image: 'Unduh gambar', thumbnail: 'Gambar mini',
    mp3Working: 'Mengonversi MP3', mp3Retry: 'Coba MP3 lagi', render: 'konversi', workingVideo: 'Memproses video berkualitas tinggi...',
    processingNote: 'Menggabungkan video dan audio asli. Biarkan halaman ini terbuka. Pemrosesan menggunakan perangkat Anda; file besar mungkin memerlukan CloudConvert.',
    available: 'Unduhan HD/SD di atas masih tersedia.', key: 'Kunci API CloudConvert Anda', keyPlaceholder: 'Tempel kunci API Anda',
    keyBefore: 'Kredit konversi bergantung pada paket CloudConvert Anda. Dapatkan kunci', keyLink: 'dari CloudConvert',
    keyAfter: 'dan tempel di bawah. Kunci disimpan di browser ini dan dikirim dengan aman saat Anda meminta konversi.',
    reelExample: 'Tautan Reel publik: facebook.com/reel/... atau facebook.com/share/r/...',
    processing1080: 'Memproses 1080p…', unavailable: '1080p · Tidak tersedia', hdTooltip: 'Mengunduh sumber HD yang tersedia saat 1080p asli tidak tersedia',
    about: 'Tentang', help: 'Bantuan', privacy: 'Privasi', terms: 'Ketentuan', contact: 'Kontak', menuOpen: 'Buka menu', menuClose: 'Tutup menu', language: 'Pilih bahasa',
    rights: 'Unduh hanya konten milik Anda atau yang diizinkan untuk disimpan.', independent: 'Layanan independen. Tidak berafiliasi dengan Facebook atau Meta.',
  },
};
export function downloaderHead(language: Language, reels = false) {
  const text = copy[language];
  const title = `${reels ? text.reelsTitle : text.videoTitle} — FB Download Hub`;
  const description = reels ? text.reelsIntro : text.videoIntro;
  return { meta: [
    { title }, { name: 'description', content: description },
    { property: 'og:title', content: title }, { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' }, { property: 'og:locale', content: { vi: 'vi_VN', en: 'en_US', pt: 'pt_BR', id: 'id_ID' }[language] },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] };
}
