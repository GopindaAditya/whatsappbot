/* created by : 
I Komang Gopinda Aditya Saputra
*/

// import library 
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'laravelwabot'
});

/* membuat obyek client dan melakukan configurasi otentifikasinya dengan localAuth dan clientId client-one
agar dapat menyimpan data auth dari whatsapp client */
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one",
  }),
});

// generate QR code untuk proses otentikasi WhatsApp Web.
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// menampilkan pesan ketika client/bot sudah siap digunakan
client.on("ready", () => {
  console.log("Client is ready!");
});

// menampilkan pesan yg dikirim oleh pengguna ke terminal 
client.on("message", (message) => {
  console.log(message.body);
});

// memasukkan pesan ke dalam database
client.on('message', async message => {
  // save the message data to the database 
  const { from, body } = message;
  const sender = from;
  const content = body;

  // insert the message data into the database
  const query = `INSERT INTO whastapp_messages (sender, content) VALUES (?, ?)`;
  connection.query(query, [sender, content], (error, results) => {
    if (error) {
      console.error('Error saving message to database:', error);
    } else {
      console.log('Message saved to database!');
    }
  });
});

// menginisialisasi whatsapp client
client.initialize();

// variabel bantu untuk menunjukkan state/posisi saat ini
let currentState = "init";

// variabel yang memuat pesan pembuka 
const welcomeMessage =
  "*Terimakasih telah menghubungi Layanan Pengaduan Disdukcapil Kota Denpasar*\n\n" +
  "Silahkan ketik *menu* untuk pilih menu layanan kami\n\n" +
  "Admin Layanan Whatsapp Pengaduan Disdukcapil Kota Denpasar akan merespon dan melayani anda pada hari kerja:\n" +
  "*Senin - Kamis pukul 08.00 - 14.00 WITA*\n" +
  "*Jumat pukul 08.00-12.00 WITA*\n\n" +
  "Layanan WhatsApp ini hanya digunakan untuk keperluan chat dan tidak mendukung panggilan suara. " +
  "Jika Anda ingin menghubungi kami melalui telepon, silakan hubungi nomor berikut: 0361418597 atau 087727366547. " +
  "Kami akan dengan senang hati membantu Anda melalui panggilan telepon. Terima kasih atas perhatian dan pengertian Anda.\n\n" +
  "Salam Sewaka Dharma Melayani Adalah Kewajiban 🙏🏻🙏🏻🙏🏻";

// variabel yang memuat daftar menu layanan
const menuOptions =
  "*DAFTAR MENU LAYANAN DISDUKCAPIL KOTA DENPASAR*\n\n" +
  "Ketik nomor untuk info layanan sesuai kebutuhan anda:\n" +
  "1. Paket Akta Kelahiran\n" +
  "2. Paket Akta Perkawinan\n" +
  "3. Paket Akta Perceraian\n" +
  "4. Paket Akta Kematian\n" +
  "5. Kartu Keluarga\n" +
  "6. Surat Pindah Domisili\n" +
  "7. Akta/Surat Lainnya\n" +
  "8. KTP Elektronik Denpasar\n" +
  "9. KTP Elektronik Luar Denpasar\n" +
  "10. Kartu Identitas Anak\n" +
  "11. Tata Cara Daftar Akun\n" +
  "12. Tata Cara Pengisian Survey Kepuasan Masyarakat\n" +
  "13. Tata Cara Pengisian Dokumen f2.01\n\n";

// variabel yang memuat pesan yang muncul pada saat pengguna mengirim pesan yang tidak sesuai dengan perintah bot
const errorMessage = "Opsi yang dikirimkan tidak valid. Silakan ketik ulang opsi yang benar.";

// method untuk menjalankan logic dari bot
client.on("message", async (message) => {
  const lowercasedMessage = message.body.toLowerCase(); // error handle, untuk mengubah pesan yang dikirim pengguna menjadi lowecasing 

  // switch case, agar alur pesan yg dimasukkan pengguna benar
  switch (currentState) {

    case 'init': // case pada saat pengguna pertama kali mengirim pesan
      if (lowercasedMessage === "menu") { // masuk ke percabangan ini pada saat pesan yang dikirim pengguna = menu
        message.reply(menuOptions); // mengirim pesan balasan berupa isi dari variable menuOptions
        currentState = "menu"; // lanjut ke state menu
      } else {
        message.reply(welcomeMessage); // mengirim pesan balasan berupa isi dari variable welcomeMessage
      }
      break;
    case 'menu':// ketika pengguna sudah mengirim pesan menu atau ketika currentState sama dengan 'menu' 
      if (lowercasedMessage) { // bot akan mengirim pesan balasan sesuai dengan isi method headleMenuSelection
        handleMenuSelection(lowercasedMessage, message); // mengirim pesan balasan sesuai dengan menu yg dipilih pengguna 
      } else { //error handle, untuk pengguna yang mengirim opsi menu yang tidak sesuai
        message.reply(errorMessage);
      }
      break;
    case 'service_satisfaction': // ketika pengguna telah memilih salah satu menu maka akan menampilkan 3 pilihan 
      if (lowercasedMessage) { // bot akan mengirim pesan balasan sesuai dengan isi method handleRespon
        handleRespon(lowercasedMessage, message);
      } else { // error handle, dimana bot akan mengirim pesan bahwa pesan yang dikirim pengguna tidak sesuai dengan perintah bot
        message.reply(errorMessage);
      }
      break;
    default: // error handle, untuk kembali ke pilihan menu atau ke pesan selamat datang  
      if (lowercasedMessage === "menu") {
        message.reply(menuOptions);
        currentState = "menu"; // kembali ke state menu
      } else {
        message.reply(welcomeMessage);
        currentState = 'init'; // kembali ke state awal
      }
      break;
  }
});

// method untuk menangani pemilihan menu
function handleMenuSelection(option, message) {
  let replyMessage;

  /* penutup pesan */
  const conclus_response_message =
    "Apabila belum memiliki akun, silahkan klik login WNI untuk penduduk Warga Negara Indonesia dan login WNA " +
    "untuk penduduk Warga Negara asing dan klik daftar pengguna. Tata cara buat akun dan upload permohonan silahkan " +
    "dicek video pada link YouTube berikut: https://youtu.be/rPFvfp2jmfk\n\n" +
    "Apakah pesan ini telah menjawab pertanyaan anda? Jika sudah terjawab maka ketik *ya*, " +
    "jika masih terdapat pertanyaan yang ingin ditanyakan ke Admin kami ketik *tanya admin*.\n" +
    "Untuk kembali ke menu utama kami ketik *menu*.\n";

  switch (option) {
    case "1":
      replyMessage =
        "Untuk Paket Akta Kelahiran, pemohon akan mendapatkan:\n" +
        "- Kutipan Akta Kelahiran\n" +
        "- Kartu Keluarga (PAKET - Untuk WNI)\n" +
        "- KIA (PAKET)\n\n" +
        "Silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih Menu *PAKET AKTA KELAHIRAN*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "3 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Pencatatan Kelahiran Warga Negara Indonesia Dalam Wilayah NKRI\n" +
        "- Pencatatan Kelahiran Orang Asing\n" +
        "- Pencatatan Lahir Mati\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction    
      break;
    case "2":
      replyMessage =
        "Untuk Paket Akta Perkawinan, pemohon akan mendapatkan:\n" +
        "- Kutipan Akta Perkawinan\n" +
        "- Kartu Keluarga (PAKET - Untuk WNI)\n" +
        "- KIA (PAKET)\n\n" +
        "Silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih Menu *PAKET AKTA PERKAWINAN*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "3 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Pencatatan Perkawinan Warga Negara Indonesia Dalam Wilayah NKRI\n" +
        "- Pencatatan Perkawinan Orang Asing\n" +
        "- Pencatatan Perkawinan di Luar Wilayah NKRI\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction 
      break;
    case "3":
      replyMessage =
        "Untuk Paket Akta Perceraian, pemohon akan mendapatkan:\n" +
        "- Kutipan Akta Perceraian\n" +
        "- Kartu Keluarga (PAKET)\n" +
        "- KTP-el (PAKET)\n\n" +
        "Silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih Menu *PAKET AKTA PERCERAIAN*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "2 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Pencatatan Perceraian\n" +
        "- Pencatatan Pembatalan Perceraian\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction   
      break;
    case "4":
      replyMessage =
        "Untuk Paket Akta Kematian, pemohon akan mendapatkan:\n" +
        "- Kutipan Akta Kematian\n" +
        "- Surat Keterangan Kematian\n" +
        "- Kartu Keluarga (PAKET - Untuk WNI)\n" +
        "- KIA (PAKET)\n\n" +
        "Silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih Menu *PAKET AKTA KEMATIAN*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "2 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Pencatatan Kematian Warga Negara Indonesia Dalam Wilayah NKRI\n" +
        "- Pencatatan Kematian Orang Asing\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction    
      break;
    case "5":
      replyMessage =
        "Untuk mendapatkan kartu keluarga, silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ " +
        "dan memilih Menu *KARTU KELUARGA*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "8 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Pencatatan Biodata WNI Dalam Wilayah NKRI\n" +
        "- Pencatatan Biodata WNI di Luar Wilayah NKRI\n" +
        "- Pencatatan Biodata Orang Asing (OA)\n" +
        "- Penerbitan Kartu Keluarga Baru Karena Membentuk Keluarga Baru\n" +
        "- Penerbitan Kartu Keluarga Baru Karena Penggantian Kepala Keluarga (Kematian Kepala Keluarga)\n" +
        "- Penerbitan Kartu Keluarga Baru Karena Pisah KK Dalam Satu (1) Alamat\n" +
        "- Penerbitan Kartu Keluarga Baru Karena Perubahan Data\n" +
        "- Penerbitan Kartu Keluarga Baru Karena Hilang atau Rusak\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction    
      break;
    case "6":
      replyMessage =
        "Untuk Surat Pindah Domisili, pemohon akan mendapatkan:\n" +
        "- Surat Pindah\n" +
        "- Kartu Keluarga (PAKET)\n\n" +
        "Silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih Menu *SURAT PINDAH DOMISILI*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "6 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Perpindahan Penduduk WNI Dalam NKRI\n" +
        "- Perpindahan Penduduk Orang Asing Izin Tinggal Tetap (ITAP) Dalam NKRI\n" +
        "- Perpindahan Penduduk Orang Asing Izin Tinggal Terbatas (ITAS) Dalam NKRI\n" +
        "- Perpindahan Penduduk WNI Keluar Wilayah NKRI\n" +
        "- Perpindahan Penduduk WNI Datang Dari Luar Negeri\n" +
        "- Pendaftaran Bagi Orang Asing Izin Tinggal Terbatas (ITAS) yang Datang Dari Luar Wilayah NKRI\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction       
      break;
    case "7":
      replyMessage =
        "Untuk Akta/Surat Lainnya, pemohon akan mendapatkan:\n" +
        "- Surat Keterangan/Akta Lainnya\n" +
        "- Kartu Keluarga (PAKET)\n\n" +
        "Silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih Menu *AKTA/SURAT LAINNYA*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "23 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Pencatatan Pengangkatan Anak di Wilayah NKRI\n" +
        "- Pencatatan Pengakuan Anak di Wilayah NKRI\n" +
        "- Pencatatan Pengakuan Anak yang Dilahirkan di Luar Perkawinan yang SAH, " +
        "Menurut Hukum atau Kepercayaan Terhadap Tuhan Yang Maha Esa diWilayah NKRI\n" +
        "- Pencatatan Pengesahan Anak Bagi Penduduk WNI di Wilayah NKRI\n" +
        "- Pencatatan Pengesahan Anak Bagi Penduduk ASING di Wilayah NKRI\n" +
        "- Pencatatan Pengesahan Anak yang di Lahirkan Sebelum Orang Tuanya Melaksanakan Perkawinan yang SAH Menurut Hukum " +
        "atau Kepercayaan Terhadap Tuhan Yang Maha Esa diWilayah NKRI\n" +
        "- Pencatatan Perubahan Nama Penduduk\n" +
        "- Pencatatan Peristiwa Penting atau Lainnya Bagi Penduduk\n" +
        "- Pencatatan Pembetulan Akta Pencatatan Sipil Dengan Permohonan Dari Subyek Akta di Wilayah NKRI\n" +
        "- Pencatatan Pembatalan Akta Pencatatan Sipil Bagi Penduduk\n" +
        "- Pencatatan Pembatalan Akta Pencatatan Sipil Tanpa Melalui Penetapan Pengadilan (Contrarius Actus)\n" +
        "- Pencatatan Perubahan Status Kewarganegaraan WNA (Warga Negara Asing) " +
        "Menjadi WNI (Warga Negara Indonesia) di Wilayah NKRI\n" +
        "- Pencatatan Anak Berkewarganegaraan Ganda (ABG) yang Telah Memiliki Serfikat Bukti Pendaftran ABG\n" +
        "- Pencatatan Anak Berkewarganegaraan Ganda (ABG) yang Memilih Menjadi WNI\n" +
        "- Pencatatan Anak Berkewarganegaraan Ganda (ABG) yang Memilih Menjadi WNA\n" +
        "- Pencatatan Anak Berkewarganegaraan Ganda (ABG) yang Tidak Memilih Salah Satu Kewarganegaraan\n" +
        "- Pencatatan Perubahan Status Kewarganegaraan WNI Menjadi WNA\n" +
        "- Pelaporan Kelahiran WNI di Luar Wilayah NKRI\n" +
        "- Pelaporan Perkawinan WNI di Luar Wilayah NKRI\n" +
        "- Pelaporan Perceraian WNI di Luar Wilayah NKRI\n" +
        "- Penerbitan Pelaporan Akta Kematian WNI di Luar Wilayah NKRI yang Dilakukan pada Instansi yang Berwenang di " +
        "Negara Setempat\n" +
        "- Penerbitan Akta Pencatatan Sipil Karena Hilang atau Rusak dan Kartu Keluarga\n" +
        "- Penerbitan Catatan Pinggir Perjanjian Perkawinan atau Surat Keterangan Pelaporan Perjanjian Perkawinan " +
        "(Apabila perkawinan di luar NKRI)\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction       
      break;
    case "8":
      replyMessage =
        "Untuk KTP Elektronik Denpasar, pemohon akan mendapatkan:\n" +
        "- KTP Elektronik\n\n" +
        "Untuk pembuatan KTP Elektronik, silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ " +
        "dan memilih Menu *KTP ELEKTRONIK DENPASAR*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "4 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Penerbitan KTP-EL Baru untuk WNI\n" +
        "- Penerbitan KTP-EL Baru Karena Pindah, Perubahan Data, Rusak dan Hilang untuk WNI\n" +
        "- Penerbitan KTP-EL Baru untuk Orang Asing\n" +
        "- Penerbitan KTP-EL Baru Karena Pindah, Perubahan Data, Rusak, Hilang dan Perpanjangan untuk Orang Asing\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction       
      break;
    case "9":
      replyMessage =
        "Untuk KTP Elektronik Luar Denpasar, pemohon akan mendapatkan:\n" +
        "- KTP Elektronik\n\n" +
        "Untuk pembuatan KTP Elektronik, silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih " +
        "Menu *KTP ELEKTRONIK LUAR DENPASAR*, " +
        "form dan syarat tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction     
      break;
    case "10":
      replyMessage =
        "Untuk Kartu Identitas Anak, pemohon akan mendapatkan:\n" +
        "- Kartu Identitas Anak/KIA\n\n" +
        "Silahkan akses web kami https://taringdukcapil.denpasarkota.go.id/ dan memilih Menu *KARTU IDENTITAS ANAK*, " +
        "form dan syarat sudah tertera pada website sesuai dengan permohonan yang diajukan.\n\n" +
        "2 jenis permohonan yang dapat dilakukan yaitu:\n" +
        "- Penerbitan Kartu Identitas Anak Baru untuk Anak WNI (Warga Negara Indonesia)\n" +
        "- Penerbitan Kartu Identitas Anak Baru untuk Anak Orang Asing\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction       
      break;
    case "11":
      replyMessage =
        "Untuk melakukan pendaftaran akun, silahkan daftar melalui link https://taringdukcapil.denpasarkota.go.id/ " +
        "dan cari menu *DAFTAR AKUN*. Pendaftaran akun dilakukan dengan memilih salah satu kategori sebagai berikut:\n" +
        "- Pendaftaran Akun untuk Warga Negara Indonesia (WNI)\n" +
        "- Pendaftaran Akun untuk Warga Negara Asing (WNA)\n\n" +
        "Silahkan memilih salah satu kategori sesuai kebutuhan Anda.\n\n" +
        "Kode OTP akan dikirim ke email, cek emailnya pada inbox dan spam. Mengenai permasalahan akun, " +
        "silahkan menghubungi nomor berikut: +6285940476177.\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction      
      break;
    case "12":
      replyMessage =
        "Untuk melakukan pengisian survei kepuasan masyarakat, silahkan mengisi formulir melalui link " +
        "https://taringdukcapil.denpasarkota.go.id/ dan cari menu *SURVEY KEPUASAN MASYARAKAT*. " +
        "Pengisian formulir dilakukan dengan cara mengisi pilihan yang tersedia " +
        "pada nomor satu (1) seperti Umur Responden, Pekerjaan Utama, Jenis Kelamin, dan Jenis Layanan. " +
        "Selanjutnya, klik salah satu tombol untuk setiap pertanyaan yang sesuai dengan pendapat Anda berikan pada nomor dua (2). " +
        "Klik 'Simpan' untuk menyimpan hasil survei yang Anda berikan pada nomor tiga (3).\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction     
      break;
    case "13":
      replyMessage =
        "Data yang perlu diisi dalam dokumen f-2.01 dapat berbeda sesuai dengan kebutuhan pemohon. Berikut penjelasannya:\n\n" +
        "- *Untuk Akta Kelahiran:*\n" +
        " - Mengisi DATA PELAPOR: Diisi dengan data ayah dari si bayi.\n" +
        " - Mengisi DATA SAKSI I & II: Dapat diisi dengan data siapa saja kecuali orang tua dari si bayi.\n" +
        " - Mengisi DATA ORANG TUA: Diisi data ayah dan ibu dari bayi.\n" +
        " - Mengisi DATA KELAHIRAN: Diisi data bayi.\n" +
        " - Lengkapi dokumen dengan tanda tangan pemohon.\n" +
        " - Lengkapi dokumen dengan tanda tangan dan cap kepala desa.\n\n" +
        "*Untuk Akta Perkawinan:*\n" +
        " - Mengisi DATA PELAPOR: Diisi data mempelai pria.\n" +
        " - Mengisi DATA SUBJEK AKTA KESATU: Diisi data mempelai pria.\n" +
        " - Mengisi DATA SUBJEK AKTA KEDUA: Diisi data mempelai wanita.\n" +
        " - Mengisi DATA SAKSI I & II: Dapat diisi dengan data siapa saja kecuali orang tua dari kedua mempelai.\n" +
        " - Mengisi DATA PERKAWINAN poin 1-15 dan 21.\n" +
        " - Lengkapi dokumen dengan tanda tangan pelapor (mempelai pria).\n" +
        " - Lengkapi dokumen dengan tanda tangan dan cap kepala desa.\n\n" +
        "*Untuk Akta Perceraian:*\n" +
        " - Mengisi DATA PELAPOR: Diisi data yang menggugat.\n" +
        " - Mengisi DATA SUBJEK AKTA KESATU: Diisi data yang menggugat.\n" +
        " - Mengisi DATA SUBJEK AKTA KEDUA: Diisi data yang tergugat.\n" +
        " - Mengisi DATA SAKSI I & II: Dapat diisi dengan data siapa saja kecuali orang tua. " +
        "Data saksi ini tidak harus sama dengan saksi yang ada di pengadilan.\n" +
        " - Mengisi DATA PERCERAIAN poin 1-9.\n" +
        " - Lengkapi dokumen dengan tanda tangan pelapor (mempelai pria).\n" +
        " - Lengkapi dokumen dengan tanda tangan dan cap kepala desa.\n\n" +
        "*Untuk Akta Kematian*:\n" +
        " - Mengisi DATA PELAPOR.\n" +
        " - Mengisi DATA SAKSI I & II: Dapat diisi dengan data siapa saja kecuali orang tua almarhum.\n" +
        " - Mengisi DATA KEMATIAN.\n" +
        " - Lengkapi dokumen dengan tanda tangan pemohon.\n" +
        " - Lengkapi dokumen dengan tanda tangan dan cap kepala desa.\n\n" +
        conclus_response_message;
      currentState = "service_satisfaction"; // lanjut ke state service_satisfaction      
      break;
    default:
      replyMessage = errorMessage;
      currentState = "menu"; // state tidak berubah tetap berada pada state menu  
      break;
  }

  const response = `${replyMessage}`; // variabel ini memuat jawaban berdasarkan menu layanan yang dipilih pengguna
  message.reply(response); // bot mengirim pesan balasan sesuai dengan isi variabel response yang 
}

// method handleRespon
function getDataFromDatabase(callback) {
  const query = "SELECT off_date FROM off_days";

  connection.query(query, (err, results) => {
    if (err) throw err;
    const dataArray = results.map((row) =>
      row.off_date.toISOString().slice(0, 10)
    );

    callback(dataArray);
  });
}

function formatOffDate(date) {
  const formattedDate = new Date(date).toISOString().slice(0, 10);
  return formattedDate;
}

// Fungsi untuk menambahkan satu hari ke tanggal
function addOneDayToDate(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function handleRespon(option, message) {
  let replyMessage;
  switch (option) {
    case "ya":
      replyMessage =
        "Terimakasih telah menghubungi Layanan Pengaduan Disdukcapil Kota Denpasar melalui WhatsApp, " +
        "semoga pelayanan kami dapat membantu sesuai dengan harapan anda, " +
        "mohon maaf apabila kami ada salah dalam penyampaian informasi dan penggunaan bahasa.\n\n" +
        "Salam Sewaka Dharma Melayani Adalah Kewajiban 🙏🏻🙏🏻🙏🏻";
      currentState = "init"; // kembali ke state awal
      message.reply(replyMessage); // bot akan mengirim pesan balasan sesuai dengan isi variabel replyMessage
      break;
    case "tanya admin":
      let today = new Date(); // tanggal hari ini (yyyy-mm-dd)
      //console.log(formatOffDate(today));
      let todayOffDate = false;
      let offDates = [];

      const year = today.getFullYear(); // tahun saat ini
      const startDate = new Date(year + "-01-01"); // start date adalah 1 Januari dari tahun saat ini
      const endDate = new Date(year + "-12-31"); // end date adalah 31 Desember dari tahun saat ini
      let weekendDates = []; // array untuk menyimpan tanggal yang berada pada hari sabtu dan minggu

      // mencari tanggal yang berada pada hari sabtu dan minggu dalam setahun
      for (
        let currentDate = new Date(startDate);
        currentDate <= endDate;
        currentDate.setDate(currentDate.getDate() + 1)
      ) {
        const day = currentDate.getDay();
        if (day === 6 || day === 0) {
          // 6 = sabtu, 0 = minggu
          weekendDates.push(new Date(currentDate));
        }
      }

      weekendDates = weekendDates.map((date) => formatOffDate(date));
      getDataFromDatabase((dates) => {
        // Mendapatkan data dari database dan mengubahnya menjadi format yang diinginkan
        offDates = dates.map((date) => formatOffDate(date));

        // Mengubah array offDates dengan menambahkan satu hari ke setiap tanggal
        offDates.forEach((date, index, array) => {
          array[index] = addOneDayToDate(date);
        });
        for (let i = 0; i < offDates.length; i++) {
          if (offDates[i] === formatOffDate(today)) {
            todayOffDate = true;
            break;
          }
        }

        let todayWeekendDate = false;
        for (let i = 0; i < weekendDates.length; i++) {
          if (weekendDates[i] === formatOffDate(today)) {
            // jika salah satu tanggal pada array = tanggal hari ini maka,
            todayWeekendDate = true; // variabel akan bernilai true
            break;
          }
        }

        let excludedDates = offDates.concat(weekendDates); // menggabungkan array offDates dan weekendDates
        excludedDates.sort((a, b) => {
          // mengurutkan hasil penggabungan kedua array
          let [dayA, monthA, yearA] = a.split("-");
          let [dayB, monthB, yearB] = b.split("-");
          let dateA = new Date(`${monthA}-${dayA}-${yearA}`);
          let dateB = new Date(`${monthB}-${dayB}-${yearB}`);
          return dateA - dateB;
        });

        let activeDates = []; // array untuk menyimpan tanggal layanan akan tersedia kembali pada tanggal berapa
        for (
          let currentDate = new Date(startDate);
          currentDate <= endDate;
          currentDate.setDate(currentDate.getDate() + 1)
        ) {
          const formattedDate = formatOffDate(currentDate);
          if (!excludedDates.includes(formattedDate)) {
            activeDates.push(formattedDate);
          }
        }
        // console.log("Hari masuk : ", activeDates);
        let formattedToday = formatOffDate(today);
        let activeOn = null;
        for (let i = 0; i < activeDates.length; i++) {
          let date = activeDates[i];
          const x = new Date(date);
          const y = new Date(formattedToday);
          if (!excludedDates.includes(date) && x > y) {
            activeOn = date;
            break; // Keluar dari loop setelah menemukan tanggal aktif pertama setelah hari ini
          }
        }
        // Setelah data telah diubah, maka sekarang kita dapat mencetaknya

        if (todayOffDate || todayWeekendDate) {
          replyMessage =
            `Mohon maaf, saat ini Admin Taring Dukcapil sedang tidak aktif. ` +
            `Silakan tinggalkan pesan Anda dan kami akan membalas pesan Anda tanggal ${activeOn}. Terima kasih atas pengertiannya.`;
          message.reply(replyMessage); // bot akan mengirim pesan balasan sesuai dengan isi variabel replyMessage
        } else {
          replyMessage =
            "Mohon menunggu, Admin Taring Dukcapil akan membalas saat jam pelayanan kami.\n\n" +
            "Admin Layanan Whatsapp Pengaduan Disdukcapil Kota Denpasar akan merespon dan melayani anda pada hari kerja:\n" +
            "*Senin - Kamis pukul 08.00 - 14.00 WITA*\n" +
            "*Jumat pukul 08.00-12.00 WITA*\n\n" +
            "Layanan WhatsApp ini hanya digunakan untuk keperluan chat dan tidak mendukung panggilan suara. " +
            "Jika Anda ingin menghubungi kami melalui telepon, silakan hubungi nomor berikut: 0361418597 atau 087727366547. " +
            "Kami akan dengan senang hati membantu Anda melalui panggilan telepon. Terima kasih atas perhatian dan pengertian Anda.\n\n" +
            "Salam Sewaka Dharma Melayani Adalah Kewajiban 🙏🏻🙏🏻🙏🏻";
          message.reply(replyMessage); // bot akan mengirim pesan balasan sesuai dengan isi variabel replyMessage
        }
        //   // Akhiri koneksi database setelah selesai
        //   connection.end();(optional saran ga usah pake tar error wkwk)
      });
      currentState = "init"; // kembali ke awal
      break;
    case "menu":
      replyMessage = menuOptions;
      currentState = "menu"; // lanjut ke state menu
      message.reply(replyMessage); // bot akan mengirim pesan balasan sesuai dengan isi variabel replyMessage
      break;
    default:
      currentState = "service_satisfaction"; // state tidak berubah tetap berada pada state service_satisfaction
      replyMessage = errorMessage;
      message.reply(replyMessage); // bot akan mengirim pesan balasan sesuai dengan isi variabel replyMessage
      break;
  }
}
