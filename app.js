/* ============================================================
   Ball Python Morph Identifier — Application Logic
   Menggunakan @gradio/client untuk koneksi ke HuggingFace Space
   ============================================================ */

// ---- Configuration ----
// Default values (bisa di-override via Settings Modal → disimpan di localStorage)
const DEFAULT_HF_SPACE = 'samfhy/ball-python-morph-identifier';
const DEFAULT_API_URL = 'https://samfhy-ball-python-morph-identifier.hf.space';

// Dynamic getters — ambil dari localStorage jika ada
function getHfSpace() {
    return localStorage.getItem('bp_hf_space') || DEFAULT_HF_SPACE;
}

function getApiUrl() {
    const space = getHfSpace();
    // Konversi format "user/space" ke URL HuggingFace
    return `https://${space.replace('/', '-')}.hf.space`;
}

function getHfToken() {
    return localStorage.getItem('bp_hf_token') || null;
}

// Gradio client instance (akan di-init saat connect)
let gradioClient = null;

const MORPH_LABELS = [
    'Pastel', 'Clown', 'Yellow Belly', 'Enchi', 'Piebald', 'Leopard',
    'Orange Dream', 'Fire', 'Mojave', 'Spotnose', 'Banana', 'Desert Ghost',
    'Black Pastel', 'Hypo', 'Normal', 'Pinstripe', 'GHI', 'Lesser',
    'Cinnamon', 'Red Stripe', 'Black Head', 'Super Pastel', 'Chocolate',
    'Axanthic (VPI)', 'Cypress', 'Vanilla', 'Gravel', 'Butter', 'Ultramel',
    'Asphalt', 'Calico', 'Stranger', 'Spider', 'Lavender Albino',
    'Hurricane', 'Mahogany', 'Albino'
];

// Morph color mapping for visual enrichment
const MORPH_COLORS = {
    'Pastel': '#f0d078',
    'Banana': '#fbbf24',
    'Albino': '#fef3c7',
    'Clown': '#c084fc',
    'Piebald': '#e2e8f0',
    'Normal': '#78716c',
    'Enchi': '#d97706',
    'Fire': '#ef4444',
    'Mojave': '#6b7280',
    'GHI': '#1f2937',
    'Black Pastel': '#374151',
    'Cinnamon': '#92400e',
    'Chocolate': '#78350f',
    'Axanthic (VPI)': '#9ca3af',
    'Lavender Albino': '#c4b5fd',
    'Spotnose': '#a3e635',
    'default': '#d4a84b'
};

// Example images data
const EXAMPLES = [
    {
        url: 'images/enchi_albino_clown.png',
        label: 'Enchi, Albino, Clown',
        morphs: ['Enchi', 'Albino', 'Clown']
    },
    {
        url: 'images/mojave_ghi.png',
        label: 'Mojave, GHI',
        morphs: ['Mojave', 'GHI']
    },
    {
        url: 'images/yb_pastel_gravel.png',
        label: 'YB, Pastel, Gravel',
        morphs: ['Yellow Belly', 'Pastel', 'Gravel']
    },
    {
        url: 'images/ivory.png',
        label: 'Super Yellow Belly',
        morphs: ['Yellow Belly']
    }
];


// ---- DOM Elements ----
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const uploadContent = document.getElementById('upload-content');
const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');
const removeBtn = document.getElementById('remove-btn');
const identifyBtn = document.getElementById('identify-btn');
const browseTrigger = document.getElementById('browse-trigger');
const examplesGrid = document.getElementById('examples-grid');
const resultsEmpty = document.getElementById('results-empty');
const resultsLoading = document.getElementById('results-loading');
const resultsDisplay = document.getElementById('results-display');
const resultsSummary = document.getElementById('results-summary');
const resultsList = document.getElementById('results-list');
const morphGrid = document.getElementById('morph-grid');
const navbar = document.getElementById('navbar');

let currentImageData = null; // File object atau Blob


// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initExamples();
    initMorphGrid();
    initEventListeners();
    initScrollObserver();
    initSettingsModal();     // Settings modal logic
    connectToHuggingFace(); // Auto-connect ke HF Space
});


// ============================================================
// HuggingFace Gradio API Connection
// ============================================================

/**
 * Connect ke HuggingFace Space menggunakan @gradio/client
 * Library ini handle CORS, upload, dan session management otomatis
 */
async function connectToHuggingFace() {
    updateConnectionStatus('connecting');

    const hfSpace = getHfSpace();
    const hfToken = getHfToken();
    const apiUrl = getApiUrl();

    console.log(`🔗 Connecting to: ${hfSpace}${hfToken ? ' (with token)' : ' (no token)'}`);

    try {
        // Coba pakai @gradio/client jika tersedia
        try {
            const module = await import('https://cdn.jsdelivr.net/npm/@gradio/client/+esm');
            const { Client } = module;

            // Connect dengan atau tanpa token
            const connectOptions = {};
            if (hfToken) {
                connectOptions.hf_token = hfToken;
            }

            gradioClient = await Client.connect(hfSpace, connectOptions);
            console.log('✅ Connected to HuggingFace Space via @gradio/client');
            updateConnectionStatus('connected');
            showToast('✅', `Terhubung ke ${hfSpace}${hfToken ? ' (authenticated)' : ''}`);
            return;
        } catch (e) {
            console.warn('Gradio client import failed, falling back to REST API:', e);
        }

        // Fallback: Test koneksi via REST API
        const headers = {};
        if (hfToken) {
            headers['Authorization'] = `Bearer ${hfToken}`;
        }

        const response = await fetch(`${apiUrl}/api/config`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
            console.log('✅ Connected to HuggingFace Space via REST API');
            updateConnectionStatus('connected');
            showToast('✅', `Terhubung ke ${hfSpace} via REST API`);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ Could not connect to HuggingFace:', error);
        updateConnectionStatus('offline');
        showToast('⚠️', 'Mode offline — hasil demo akan ditampilkan');
    }
}


/**
 * Update status indikator koneksi di navbar
 */
function updateConnectionStatus(status) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.nav-status span');
    const navStatus = document.querySelector('.nav-status');

    if (!statusDot || !statusText) return;

    switch (status) {
        case 'connecting':
            statusDot.style.background = '#fbbf24';
            statusText.textContent = 'Connecting...';
            navStatus.style.borderColor = 'rgba(251, 191, 36, 0.2)';
            navStatus.style.background = 'rgba(251, 191, 36, 0.1)';
            statusText.style.color = '#fbbf24';
            statusDot.style.animation = 'statusPulse 0.8s ease-in-out infinite';
            break;
        case 'connected':
            statusDot.style.background = '#34d399';
            statusText.textContent = 'AI Model Active';
            navStatus.style.borderColor = 'rgba(52, 211, 153, 0.2)';
            navStatus.style.background = 'rgba(52, 211, 153, 0.15)';
            statusText.style.color = '#34d399';
            statusDot.style.animation = 'statusPulse 2s ease-in-out infinite';
            break;
        case 'offline':
            statusDot.style.background = '#f87171';
            statusText.textContent = 'Offline (Demo)';
            navStatus.style.borderColor = 'rgba(248, 113, 113, 0.2)';
            navStatus.style.background = 'rgba(248, 113, 113, 0.1)';
            statusText.style.color = '#f87171';
            statusDot.style.animation = 'none';
            break;
    }
}


// ============================================================
// Identify Morphs — Main API Call
// ============================================================

async function identifyMorphs() {
    if (!currentImageData && !previewImage.src) {
        showToast('⚠️', 'Upload gambar terlebih dahulu');
        return;
    }

    showState('loading');
    identifyBtn.disabled = true;

    try {
        let imageBlob = currentImageData;

        // Jika tidak ada file data, coba ambil dari preview src
        if (!imageBlob && previewImage.src) {
            try {
                const response = await fetch(previewImage.src);
                imageBlob = await response.blob();
            } catch {
                throw new Error('Tidak bisa memproses gambar');
            }
        }

        let result;

        // Strategi 1: Pakai @gradio/client (paling reliable)
        if (gradioClient) {
            result = await callViaGradioClient(imageBlob);
        } else {
            // Strategi 2: REST API langsung
            result = await callViaRestAPI(imageBlob);
        }

        displayResults(result);
        showState('results');
        showToast('✅', 'Identifikasi berhasil!');

    } catch (error) {
        console.error('Identification error:', error);

        // Fallback ke demo results
        displayDemoResults();
        showState('results');
        showToast('ℹ️', 'Menampilkan hasil demo (API mungkin tidak tersedia)');
    } finally {
        identifyBtn.disabled = false;
    }
}


/**
 * Strategi 1: Call via @gradio/client
 * Ini cara paling reliable karena library handle semuanya
 */
async function callViaGradioClient(imageBlob) {
    console.log('🔄 Calling via @gradio/client...');

    const result = await gradioClient.predict('/predict', {
        img: imageBlob
    });

    // Gradio Label output format: { label, confidences: [{label, confidence}] }
    const data = result.data?.[0];
    return parseGradioResult(data);
}


/**
 * Strategi 2: Call via REST API (tanpa @gradio/client)
 * Menggunakan Gradio REST endpoints langsung
 */
async function callViaRestAPI(imageBlob) {
    console.log('🔄 Calling via REST API...');

    const apiUrl = getApiUrl();
    const hfToken = getHfToken();
    const authHeaders = hfToken ? { 'Authorization': `Bearer ${hfToken}` } : {};

    // Step 1: Upload gambar
    const formData = new FormData();
    formData.append('files', imageBlob, 'image.png');

    const uploadResponse = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
    });

    if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadResult = await uploadResponse.json();
    const filePath = uploadResult[0];

    // Step 2: Call predict via /api/predict
    const predictPayload = {
        data: [{
            path: filePath,
            url: `${apiUrl}/file=${filePath}`,
            orig_name: 'image.png',
            size: imageBlob.size,
            mime_type: imageBlob.type || 'image/png'
        }],
        fn_index: 0,
        session_hash: generateSessionHash()
    };

    const predictResponse = await fetch(`${apiUrl}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(predictPayload)
    });

    if (!predictResponse.ok) {
        // Coba endpoint alternatif /run/predict
        return await callViaRunEndpoint(filePath, imageBlob);
    }

    const predictResult = await predictResponse.json();
    return parseGradioResult(predictResult.data?.[0]);
}


/**
 * Strategi 2b: Endpoint /run/predict (Gradio versi tertentu)
 */
async function callViaRunEndpoint(filePath, imageBlob) {
    console.log('🔄 Trying /run/predict endpoint...');

    const apiUrl = getApiUrl();
    const hfToken = getHfToken();
    const authHeaders = hfToken ? { 'Authorization': `Bearer ${hfToken}` } : {};

    const payload = {
        data: [{
            path: filePath,
            url: `${apiUrl}/file=${filePath}`,
            orig_name: 'image.png',
            size: imageBlob.size,
            mime_type: imageBlob.type || 'image/png'
        }]
    };

    const response = await fetch(`${apiUrl}/run/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Run endpoint failed: ${response.status}`);

    const result = await response.json();
    return parseGradioResult(result.data?.[0]);
}


/**
 * Parse Gradio result ke format { morphName: confidence }
 */
function parseGradioResult(data) {
    if (!data) throw new Error('No data returned from API');

    // Format 1: { confidences: [{label, confidence}] } (gr.Label output)
    if (data.confidences && Array.isArray(data.confidences)) {
        const results = {};
        data.confidences.forEach(item => {
            results[item.label] = item.confidence;
        });
        return results;
    }

    // Format 2: { label: confidence } langsung
    if (typeof data === 'object' && !Array.isArray(data)) {
        // Pastikan values adalah angka
        const hasNumericValues = Object.values(data).some(v => typeof v === 'number');
        if (hasNumericValues) {
            return data;
        }
    }

    throw new Error('Unexpected API response format');
}


function generateSessionHash() {
    return Math.random().toString(36).substring(2, 12);
}


// ============================================================
// Particle System
// ============================================================

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 40;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.3 + 0.1,
            hue: Math.random() > 0.5 ? 43 : 160
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 60%, 60%, ${p.opacity})`;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }

    init();
    animate();
    window.addEventListener('resize', resize);
}


// ============================================================
// Examples
// ============================================================

function initExamples() {
    examplesGrid.innerHTML = '';
    EXAMPLES.forEach((example, i) => {
        const card = document.createElement('div');
        card.className = 'example-card';
        card.style.animationDelay = `${i * 0.1}s`;
        card.innerHTML = `
            <img src="${example.url}" alt="${example.label}" loading="lazy" onerror="this.style.display='none'">
            <div class="example-overlay">
                <span class="example-label">${example.label}</span>
            </div>
        `;
        card.addEventListener('click', () => loadExample(example));
        examplesGrid.appendChild(card);
    });
}


// ============================================================
// Morph Grid
// ============================================================

function initMorphGrid() {
    morphGrid.innerHTML = '';
    MORPH_LABELS.sort().forEach((morph, i) => {
        const tag = document.createElement('span');
        tag.className = 'morph-tag';
        tag.textContent = morph;
        tag.style.animationDelay = `${i * 0.02}s`;
        morphGrid.appendChild(tag);
    });
}


// ============================================================
// Event Listeners
// ============================================================

function initEventListeners() {
    browseTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    uploadZone.addEventListener('click', () => {
        if (!uploadZone.classList.contains('has-image')) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImage();
    });

    identifyBtn.addEventListener('click', identifyMorphs);

    // Paste gambar dari clipboard
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) handleFileUpload(file);
                    break;
                }
            }
        }
    });
}


// ============================================================
// Scroll Observer
// ============================================================

function initScrollObserver() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}


// ============================================================
// File Upload Handler
// ============================================================

function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('⚠️', 'Mohon upload file gambar (JPG, PNG, WEBP)');
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        showToast('⚠️', 'Ukuran file terlalu besar (maks 20MB)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        showPreview(e.target.result);
        currentImageData = file;
    };
    reader.readAsDataURL(file);
}


// ============================================================
// Load Example
// ============================================================

async function loadExample(example) {
    try {
        showPreview(example.url);

        // Fetch gambar sebagai blob untuk di-submit ke API
        const response = await fetch(example.url);
        if (response.ok) {
            const blob = await response.blob();
            currentImageData = new File([blob], 'example.png', { type: blob.type });
        } else {
            currentImageData = null;
        }

        showToast('🐍', `Contoh dimuat: ${example.label}`);
    } catch (error) {
        console.warn('Could not fetch example image as blob:', error);
        currentImageData = null;
        showToast('ℹ️', 'Contoh dimuat - klik Identifikasi untuk mencoba');
    }
}


// ============================================================
// Preview Management
// ============================================================

function showPreview(src) {
    previewImage.src = src;
    uploadContent.style.display = 'none';
    previewContainer.style.display = 'block';
    uploadZone.classList.add('has-image');
    identifyBtn.disabled = false;
    showState('empty');
}

function clearImage() {
    previewImage.src = '';
    uploadContent.style.display = 'flex';
    previewContainer.style.display = 'none';
    uploadZone.classList.remove('has-image');
    identifyBtn.disabled = true;
    currentImageData = null;
    fileInput.value = '';
    showState('empty');
}


// ============================================================
// State Management
// ============================================================

function showState(state) {
    resultsEmpty.style.display = state === 'empty' ? 'flex' : 'none';
    resultsLoading.style.display = state === 'loading' ? 'flex' : 'none';
    resultsDisplay.style.display = state === 'results' ? 'block' : 'none';
}


// ============================================================
// Display Results
// ============================================================

function displayResults(predictions) {
    const sorted = Object.entries(predictions)
        .sort(([, a], [, b]) => b - a);

    // Summary banner
    resultsSummary.innerHTML = `
        <div class="summary-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="summary-text">
            Terdeteksi <strong>${sorted.length} morph</strong> pada ball python ini
        </span>
    `;

    // Result cards
    resultsList.innerHTML = '';
    sorted.forEach(([morph, confidence], index) => {
        const percent = (confidence * 100).toFixed(1);
        const level = percent >= 70 ? 'high' : percent >= 40 ? 'medium' : 'low';

        const card = document.createElement('div');
        card.className = `result-card confidence-${level}`;
        card.style.animationDelay = `${index * 0.08}s`;

        card.innerHTML = `
            <div class="result-card-top">
                <div>
                    <span class="morph-rank">#${index + 1}</span>
                    <span class="morph-name">${morph}</span>
                </div>
                <span class="morph-confidence">${percent}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;

        resultsList.appendChild(card);

        // Animate progress bar
        requestAnimationFrame(() => {
            setTimeout(() => {
                card.querySelector('.progress-fill').style.width = `${percent}%`;
            }, 100 + index * 80);
        });
    });
}


// ============================================================
// Demo Results (Fallback saat API offline)
// ============================================================

function displayDemoResults() {
    const demoData = {
        'Pastel': 0.952,
        'Enchi': 0.876,
        'Yellow Belly': 0.734,
        'Fire': 0.612,
        'Spotnose': 0.489
    };
    displayResults(demoData);
}


// ============================================================
// Toast Notifications
// ============================================================

function showToast(icon, message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ============================================================
// Smooth Scroll Navigation
// ============================================================

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
});


// ============================================================
// Settings Modal
// ============================================================

function initSettingsModal() {
    const settingsBtn = document.getElementById('settings-btn');
    const modal = document.getElementById('settings-modal');
    const modalClose = document.getElementById('modal-close');
    const tokenInput = document.getElementById('hf-token');
    const spaceInput = document.getElementById('hf-space');
    const toggleToken = document.getElementById('toggle-token');
    const btnSave = document.getElementById('btn-save-settings');
    const btnClear = document.getElementById('btn-clear-token');

    if (!settingsBtn || !modal) return;

    // Load saved values
    const savedToken = getHfToken();
    const savedSpace = localStorage.getItem('bp_hf_space');
    if (savedToken) tokenInput.value = savedToken;
    if (savedSpace) spaceInput.value = savedSpace;

    // Open modal
    settingsBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        // Refresh values
        tokenInput.value = getHfToken() || '';
        spaceInput.value = getHfSpace();
    });

    // Close modal
    modalClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });

    // Toggle token visibility
    toggleToken.addEventListener('click', () => {
        const eyeOpen = toggleToken.querySelector('.eye-open');
        const eyeClosed = toggleToken.querySelector('.eye-closed');

        if (tokenInput.type === 'password') {
            tokenInput.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            tokenInput.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    });

    // Save settings & reconnect
    btnSave.addEventListener('click', async () => {
        const token = tokenInput.value.trim();
        const space = spaceInput.value.trim();

        // Validasi token format (opsional)
        if (token && !token.startsWith('hf_')) {
            showToast('⚠️', 'Token harus dimulai dengan "hf_"');
            return;
        }

        // Validasi space format
        if (!space || !space.includes('/')) {
            showToast('⚠️', 'Format Space: username/space-name');
            return;
        }

        // Simpan ke localStorage
        if (token) {
            localStorage.setItem('bp_hf_token', token);
        } else {
            localStorage.removeItem('bp_hf_token');
        }

        if (space !== DEFAULT_HF_SPACE) {
            localStorage.setItem('bp_hf_space', space);
        } else {
            localStorage.removeItem('bp_hf_space');
        }

        // Tutup modal
        modal.style.display = 'none';

        // Reset client & reconnect
        gradioClient = null;
        showToast('🔄', 'Menyambungkan ulang...');
        await connectToHuggingFace();
    });

    // Clear token
    btnClear.addEventListener('click', () => {
        tokenInput.value = '';
        localStorage.removeItem('bp_hf_token');
        showToast('🗑️', 'Token dihapus');
    });
}
