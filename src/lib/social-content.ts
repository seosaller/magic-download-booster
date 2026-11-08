import type { Language } from "./i18n";
import { socialNames, type SocialPlatform } from "./social";

const links = { douyin: "v.douyin.com/… · douyin.com/video/…", twitter: "x.com/user/status/… · twitter.com/user/status/…", threads: "threads.net/@user/post/… · threads.com/@user/post/…" } as const;

export function socialContent(language: Language, platform: SocialPlatform) {
  const n = socialNames[platform];
  const l = links[platform];
  return {
    en: {
      howTitle: `How to download ${n} videos`,
      steps: [[`Copy the link`, `Open the public ${n} post and tap Share → Copy link.`], [`Paste it here`, `Paste the link into the box above or tap the Paste button.`], [`Choose quality`, `Tap Download and pick the quality you want.`], [`Save to device`, `The video saves with its original sound to your phone or computer.`]],
      whyTitle: `Why use our ${n} downloader`,
      features: [[`Original quality`, `Get the best resolution the uploader shared, up to HD where available.`], [`Original sound`, `Speech and music stay in the file exactly as posted.`], [`No app or sign-up`, `Works in any browser on Android, iPhone, tablet, Windows and Mac.`], [`Private & fast`, `We don't ask for your login and don't store your downloads.`]],
      linksTitle: `Supported ${n} links`, links: l,
      faqTitle: `${n} downloader FAQ`,
      faq: [[`Is the ${n} downloader free?`, `Yes, you can save public ${n} videos without an account.`], [`Will the video have a watermark?`, `We provide the cleanest file the source offers; some videos may still include the creator's mark.`], [`Can I download private videos?`, `No. Only public posts are supported, never private, deleted or LIVE content.`], [`Where is the file saved?`, `Usually in your Downloads folder, or Files app on iPhone.`], [`Is downloading legal?`, `Only save content you own or have permission to download, and respect the creator's rights.`]],
    },
    vi: {
      howTitle: `Cách tải video ${n}`,
      steps: [[`Sao chép liên kết`, `Mở bài đăng ${n} công khai, chọn Chia sẻ → Sao chép liên kết.`], [`Dán vào đây`, `Dán liên kết vào ô phía trên hoặc bấm nút Dán.`], [`Chọn chất lượng`, `Bấm Tải xuống và chọn chất lượng mong muốn.`], [`Lưu về máy`, `Video được lưu cùng âm thanh gốc về điện thoại hoặc máy tính.`]],
      whyTitle: `Vì sao nên dùng trình tải ${n}`,
      features: [[`Chất lượng gốc`, `Nhận độ phân giải tốt nhất có sẵn, tới HD nếu có.`], [`Âm thanh gốc`, `Giữ nguyên lời nói và nhạc như bài đăng.`], [`Không cần ứng dụng`, `Dùng trên mọi trình duyệt: Android, iPhone, máy tính bảng, Windows, Mac.`], [`Riêng tư & nhanh`, `Không yêu cầu đăng nhập, không lưu tệp của bạn.`]],
      linksTitle: `Liên kết ${n} được hỗ trợ`, links: l,
      faqTitle: `Câu hỏi thường gặp về ${n}`,
      faq: [[`Trình tải ${n} có miễn phí không?`, `Có, bạn có thể lưu video ${n} công khai mà không cần tài khoản.`], [`Video có logo không?`, `Chúng tôi cung cấp tệp sạch nhất mà nguồn cho phép; một số video vẫn có dấu của tác giả.`], [`Tải được video riêng tư không?`, `Không. Chỉ hỗ trợ bài đăng công khai, không hỗ trợ riêng tư, đã xóa hoặc LIVE.`], [`Tệp được lưu ở đâu?`, `Thường trong thư mục Tải xuống, hoặc ứng dụng Tệp trên iPhone.`], [`Tải video có hợp pháp không?`, `Chỉ lưu nội dung bạn sở hữu hoặc được phép, và tôn trọng quyền tác giả.`]],
    },
    pt: {
      howTitle: `Como baixar vídeos do ${n}`,
      steps: [[`Copie o link`, `Abra a publicação pública do ${n} e toque em Compartilhar → Copiar link.`], [`Cole aqui`, `Cole o link na caixa acima ou toque em Colar.`], [`Escolha a qualidade`, `Toque em Baixar e escolha a qualidade.`], [`Salve no dispositivo`, `O vídeo é salvo com o áudio original no celular ou computador.`]],
      whyTitle: `Por que usar nosso downloader do ${n}`,
      features: [[`Qualidade original`, `Receba a melhor resolução disponível, até HD quando houver.`], [`Áudio original`, `Fala e música permanecem como publicadas.`], [`Sem app ou cadastro`, `Funciona em qualquer navegador: Android, iPhone, tablet, Windows e Mac.`], [`Privado e rápido`, `Não pedimos login e não armazenamos seus downloads.`]],
      linksTitle: `Links do ${n} suportados`, links: l,
      faqTitle: `Perguntas frequentes sobre o ${n}`,
      faq: [[`O downloader do ${n} é gratuito?`, `Sim, você pode salvar vídeos públicos do ${n} sem conta.`], [`O vídeo terá marca d'água?`, `Entregamos o arquivo mais limpo que a fonte oferece; alguns vídeos ainda podem ter a marca do criador.`], [`Posso baixar vídeos privados?`, `Não. Apenas publicações públicas; privadas, excluídas ou LIVE não são suportadas.`], [`Onde o arquivo é salvo?`, `Normalmente na pasta Downloads, ou no app Arquivos no iPhone.`], [`Baixar é legal?`, `Salve apenas conteúdo seu ou autorizado e respeite os direitos do criador.`]],
    },
    id: {
      howTitle: `Cara mengunduh video ${n}`,
      steps: [[`Salin tautan`, `Buka postingan ${n} publik lalu ketuk Bagikan → Salin tautan.`], [`Tempel di sini`, `Tempel tautan di kotak atas atau ketuk Tempel.`], [`Pilih kualitas`, `Ketuk Unduh dan pilih kualitas yang diinginkan.`], [`Simpan ke perangkat`, `Video tersimpan dengan suara asli di ponsel atau komputer.`]],
      whyTitle: `Kenapa memakai pengunduh ${n} kami`,
      features: [[`Kualitas asli`, `Dapatkan resolusi terbaik yang tersedia, hingga HD bila ada.`], [`Suara asli`, `Ucapan dan musik tetap seperti yang diunggah.`], [`Tanpa aplikasi`, `Berfungsi di semua browser: Android, iPhone, tablet, Windows dan Mac.`], [`Privat & cepat`, `Tanpa login dan kami tidak menyimpan unduhan Anda.`]],
      linksTitle: `Tautan ${n} yang didukung`, links: l,
      faqTitle: `FAQ pengunduh ${n}`,
      faq: [[`Apakah pengunduh ${n} gratis?`, `Ya, Anda bisa menyimpan video ${n} publik tanpa akun.`], [`Apakah ada watermark?`, `Kami memberikan file terbersih dari sumber; beberapa video mungkin tetap memiliki tanda kreator.`], [`Bisakah mengunduh video privat?`, `Tidak. Hanya postingan publik; privat, dihapus atau LIVE tidak didukung.`], [`Di mana file disimpan?`, `Biasanya di folder Unduhan, atau aplikasi File di iPhone.`], [`Apakah mengunduh legal?`, `Simpan hanya konten milik Anda atau yang diizinkan, dan hormati hak kreator.`]],
    },
  }[language];
}
