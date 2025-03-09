import React, { useState } from 'react';
import { Hash, RefreshCw, ClipboardCheck, ShieldCheck, Search } from 'lucide-react';

type HashPattern = {
  name: string;
  regex: RegExp;
  length: number;
  description: string;
  confidence: number;
  uniqueIdentifiers?: string[];
};

type CrackResult = {
  hash: string;
  result: string | null;
  error?: string;
};

const hashPatterns: HashPattern[] = [
  // Modern Şifreleme Hash Türleri (Yüksek Güvenilirlik)
  {
    name: 'BCrypt',
    regex: /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/,
    length: 60,
    description: 'Blowfish-tabanlı kriptografik hash',
    confidence: 99,
    uniqueIdentifiers: ['$2a$', '$2b$', '$2y$']
  },
  {
    name: 'Argon2',
    regex: /^\$argon2[id]\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/,
    length: null,
    description: 'Şifre hash ve türetme fonksiyonu',
    confidence: 99,
    uniqueIdentifiers: ['$argon2i$', '$argon2d$']
  },
  {
    name: 'scrypt',
    regex: /^\$scrypt\$[a-zA-Z0-9/$.]+$/,
    length: null,
    description: 'Bellek-zorlu şifre türetme fonksiyonu',
    confidence: 95,
    uniqueIdentifiers: ['$scrypt$']
  },
  {
    name: 'PBKDF2',
    regex: /^\$pbkdf2-sha[0-9]+\$[0-9]+\$[a-zA-Z0-9/.]+\$[a-zA-Z0-9/.]+$/,
    length: null,
    description: 'Şifre-Tabanlı Anahtar Türetme Fonksiyonu 2',
    confidence: 95,
    uniqueIdentifiers: ['$pbkdf2-sha']
  },
  // MD Hash Ailesi
  {
    name: 'MD5',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: 'Message-Digest Algoritması 5',
    confidence: 60
  },
  {
    name: 'MD4',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: 'Message-Digest Algoritması 4',
    confidence: 40
  },
  {
    name: 'MD2',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: 'Message-Digest Algoritması 2',
    confidence: 40
  },
  {
    name: 'MD6-128',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: 'Message-Digest Algoritması 6 (128-bit)',
    confidence: 40
  },
  {
    name: 'MD6-256',
    regex: /^[a-f0-9]{64}$/i,
    length: 64,
    description: 'Message-Digest Algoritması 6 (256-bit)',
    confidence: 50
  },
  {
    name: 'MD6-512',
    regex: /^[a-f0-9]{128}$/i,
    length: 128,
    description: 'Message-Digest Algoritması 6 (512-bit)',
    confidence: 60
  },
  // SHA Ailesi
  {
    name: 'SHA-1',
    regex: /^[a-f0-9]{40}$/i,
    length: 40,
    description: 'Güvenli Hash Algoritması 1',
    confidence: 70
  },
  {
    name: 'SHA-224',
    regex: /^[a-f0-9]{56}$/i,
    length: 56,
    description: 'Güvenli Hash Algoritması 224',
    confidence: 85,
    uniqueIdentifiers: ['Uzunluk her zaman 56 karakter']
  },
  {
    name: 'SHA-256',
    regex: /^[a-f0-9]{64}$/i,
    length: 64,
    description: 'Güvenli Hash Algoritması 256',
    confidence: 80
  },
  {
    name: 'SHA-384',
    regex: /^[a-f0-9]{96}$/i,
    length: 96,
    description: 'Güvenli Hash Algoritması 384',
    confidence: 85,
    uniqueIdentifiers: ['Uzunluk her zaman 96 karakter']
  },
  {
    name: 'SHA-512',
    regex: /^[a-f0-9]{128}$/i,
    length: 128,
    description: 'Güvenli Hash Algoritması 512',
    confidence: 85
  },
  // SHA3 Ailesi
  {
    name: 'SHA3-224',
    regex: /^[a-f0-9]{56}$/i,
    length: 56,
    description: 'SHA-3 Ailesi (224-bit)',
    confidence: 75
  },
  {
    name: 'SHA3-256',
    regex: /^[a-f0-9]{64}$/i,
    length: 64,
    description: 'SHA-3 Ailesi (256-bit)',
    confidence: 75
  },
  {
    name: 'SHA3-384',
    regex: /^[a-f0-9]{96}$/i,
    length: 96,
    description: 'SHA-3 Ailesi (384-bit)',
    confidence: 80
  },
  {
    name: 'SHA3-512',
    regex: /^[a-f0-9]{128}$/i,
    length: 128,
    description: 'SHA-3 Ailesi (512-bit)',
    confidence: 80
  },
  // RIPEMD Ailesi
  {
    name: 'RIPEMD-128',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: 'RACE Bütünlük İlkelleri Değerlendirme Mesaj Özeti 128',
    confidence: 40
  },
  {
    name: 'RIPEMD-160',
    regex: /^[a-f0-9]{40}$/i,
    length: 40,
    description: 'RACE Bütünlük İlkelleri Değerlendirme Mesaj Özeti 160',
    confidence: 60
  },
  {
    name: 'RIPEMD-256',
    regex: /^[a-f0-9]{64}$/i,
    length: 64,
    description: 'RACE Bütünlük İlkelleri Değerlendirme Mesaj Özeti 256',
    confidence: 50
  },
  {
    name: 'RIPEMD-320',
    regex: /^[a-f0-9]{80}$/i,
    length: 80,
    description: 'RACE Bütünlük İlkelleri Değerlendirme Mesaj Özeti 320',
    confidence: 80,
    uniqueIdentifiers: ['Uzunluk her zaman 80 karakter']
  },
  // Diğer Hash Türleri
  {
    name: 'Tiger-128',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: '128-bit Tiger kriptografik hash fonksiyonu',
    confidence: 40
  },
  {
    name: 'Tiger-160',
    regex: /^[a-f0-9]{40}$/i,
    length: 40,
    description: '160-bit Tiger kriptografik hash fonksiyonu',
    confidence: 50
  },
  {
    name: 'Tiger-192',
    regex: /^[a-f0-9]{48}$/i,
    length: 48,
    description: '192-bit Tiger kriptografik hash fonksiyonu',
    confidence: 85,
    uniqueIdentifiers: ['Uzunluk her zaman 48 karakter']
  },
  {
    name: 'Whirlpool',
    regex: /^[a-f0-9]{128}$/i,
    length: 128,
    description: 'Whirlpool kriptografik hash fonksiyonu',
    confidence: 60
  },
  {
    name: 'NTLM',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: 'Microsoft New Technology LAN Manager',
    confidence: 40
  },
  {
    name: 'HMAC-MD5',
    regex: /^[a-f0-9]{32}$/i,
    length: 32,
    description: 'Hash-tabanlı Mesaj Doğrulama Kodu (MD5)',
    confidence: 40
  },
  {
    name: 'HMAC-SHA1',
    regex: /^[a-f0-9]{40}$/i,
    length: 40,
    description: 'Hash-tabanlı Mesaj Doğrulama Kodu (SHA1)',
    confidence: 50
  },
  {
    name: 'HMAC-SHA256',
    regex: /^[a-f0-9]{64}$/i,
    length: 64,
    description: 'Hash-tabanlı Mesaj Doğrulama Kodu (SHA256)',
    confidence: 50
  },
  {
    name: 'CRC32',
    regex: /^[a-f0-9]{8}$/i,
    length: 8,
    description: 'Döngüsel Artıklık Kontrolü 32',
    confidence: 90,
    uniqueIdentifiers: ['8 karakter uzunluğunda']
  },
  {
    name: 'Adler32',
    regex: /^[a-f0-9]{8}$/i,
    length: 8,
    description: 'Adler-32 Sağlama Toplamı',
    confidence: 85,
    uniqueIdentifiers: ['8 karakter uzunluğunda']
  }
];

function App() {
  const [hash, setHash] = useState('');
  const [results, setResults] = useState<HashPattern[]>([]);
  const [copied, setCopied] = useState(false);
  const [crackResult, setCrackResult] = useState<CrackResult | null>(null);
  const [isCracking, setIsCracking] = useState(false);

  const identifyHash = (input: string) => {
    if (!input.trim()) {
      setResults([]);
      return;
    }

    const matches = hashPatterns.filter(pattern => 
      pattern.regex.test(input.trim())
    );

    // Güvenilirlik sırasına göre sırala
    matches.sort((a, b) => b.confidence - a.confidence);
    setResults(matches);
  };

  const crackHash = async () => {
    if (!hash.trim()) return;

    setIsCracking(true);
    setCrackResult(null);

    try {
      // MD5 için nitrxgen API'sini kullan
      if (results.some(r => r.name === 'MD5')) {
        const response = await fetch(`https://www.nitrxgen.net/md5db/${hash.trim()}`);
        const text = await response.text();
        
        if (text.trim()) {
          setCrackResult({
            hash: hash.trim(),
            result: text.trim()
          });
        } else {
          setCrackResult({
            hash: hash.trim(),
            result: null,
            error: 'Hash çözülemedi'
          });
        }
      } else {
        setCrackResult({
          hash: hash.trim(),
          result: null,
          error: 'Bu hash türü için kırma desteği henüz mevcut değil'
        });
      }
    } catch (error) {
      setCrackResult({
        hash: hash.trim(),
        result: null,
        error: 'Hash kırma işlemi sırasında bir hata oluştu'
      });
    } finally {
      setIsCracking(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHash(e.target.value);
    identifyHash(e.target.value);
    setCopied(false);
    setCrackResult(null);
  };

  const handleClear = () => {
    setHash('');
    setResults([]);
    setCopied(false);
    setCrackResult(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 70) return 'bg-blue-500';
    if (confidence >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Hash className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Hash Tanımlayıcı</h1>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Hash değerini girin
            </label>
            <div className="relative">
              <textarea
                value={hash}
                onChange={handleInputChange}
                className="w-full h-32 p-4 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Hash değerini buraya yapıştırın..."
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <button
                  onClick={handleClear}
                  className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Temizle"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Kopyala"
                >
                  <ClipboardCheck className={`w-5 h-5 ${copied ? 'text-green-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Hash Kırma Butonu */}
          {results.length > 0 && (
            <div className="mb-6">
              <button
                onClick={crackHash}
                disabled={isCracking}
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                  isCracking 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                <Search className="w-5 h-5" />
                {isCracking ? 'Hash Kırılıyor...' : 'Hash\'i Kır'}
              </button>
            </div>
          )}

          {/* Kırma Sonucu */}
          {crackResult && (
            <div className={`mb-6 p-4 rounded-lg ${
              crackResult.result ? 'bg-green-600/20' : 'bg-red-600/20'
            }`}>
              <h3 className="font-medium mb-2">Kırma Sonucu:</h3>
              {crackResult.result ? (
                <p className="text-green-400">{crackResult.result}</p>
              ) : (
                <p className="text-red-400">{crackResult.error}</p>
              )}
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Olası Hash Türleri</h2>
            {results.length > 0 ? (
              <div className="grid gap-4">
                {results.map((result, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-blue-400">{result.name}</h3>
                          {result.confidence >= 90 && (
                            <ShieldCheck className="w-5 h-5 text-green-400" title="Yüksek Güvenilirlik" />
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{result.description}</p>
                        {result.uniqueIdentifiers && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-400">Benzersiz Özellikler:</p>
                            <ul className="list-disc list-inside text-sm text-gray-300 ml-2">
                              {result.uniqueIdentifiers.map((identifier, idx) => (
                                <li key={idx}>{identifier}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm bg-gray-600 px-2 py-1 rounded">
                          Uzunluk: {result.length || 'Değişken'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Güvenilirlik:</span>
                          <span className={`text-sm px-2 py-1 rounded ${getConfidenceColor(result.confidence)}`}>
                            %{result.confidence}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hash ? (
              <div className="text-center py-8 text-gray-400">
                Eşleşen hash türü bulunamadı
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Hash türünü belirlemek için yukarıya bir hash değeri girin
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-400">
          <p>MD2, MD4, MD5, MD6, SHA ailesi, SHA3, RIPEMD, Tiger, HMAC, CRC32, Adler32 ve modern şifreleme hash türlerini destekler</p>
          <p className="mt-2">MD5 hash'leri için kırma desteği mevcuttur</p>
        </footer>
      </div>
    </div>
  );
}

export default App;