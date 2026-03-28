// test-a2a-api.ts
// Simulasi Agent lain yang memanggil API Noisezer

async function testA2A() {
  console.log('--- SIMULASI AGENT-TO-AGENT REQUEST ---');
  
  const payload = {
    query: "Is there any alpha on Base chain right now?",
    isPaid: false
  };

  try {
    // Simulasi request dari Agent lain ke API kita
    // Dalam produksi, ini akan memanggil URL aplikasi Anda
    const response = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    
    // Verifikasi Integritas JSON
    console.log('Data Diterima:', JSON.stringify(data, null, 2));
    
    if (data.type === 'TRUTH_REPORT' || data.nti_score !== undefined) {
      console.log('✅ Integritas Data JSON: TERVERIFIKASI');
    } else {
      console.log('❌ Integritas Data JSON: GAGAL (Schema tidak sesuai)');
    }
  } catch (error) {
    console.error('Simulasi Gagal:', error);
  }
}

testA2A();
