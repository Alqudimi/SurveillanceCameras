let selectedFile = null;
let uploadProgress = 0;
let analysisResults = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeUploadPage();
});

function initializeUploadPage() {
    setupFileUpload();
    setupDragAndDrop();
    setupEventListeners();
}

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }
}

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    if (!uploadArea) return;
    
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
}

function setupEventListeners() {
    const clearBtn = document.querySelector('[onclick="clearUpload()"]');
    const uploadBtn = document.querySelector('[onclick="uploadImage()"]');
    
    window.clearUpload = clearUpload;
    window.uploadImage = uploadImage;
    window.downloadResults = downloadResults;
    window.shareResults = shareResults;
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files: files } });
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (!validateFile(file)) return;
    
    selectedFile = file;
    displayFilePreview(file);
}

function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 32 * 1024 * 1024;
    
    if (!allowedTypes.includes(file.type)) {
        showMessage('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG, PNG, GIF أو WebP', 'error');
        return false;
    }
    
    if (file.size > maxSize) {
        showMessage('حجم الملف كبير جداً. الحد الأقصى 32MB', 'error');
        return false;
    }
    
    return true;
}

function displayFilePreview(file) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImg = document.getElementById('previewImg');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    if (!uploadArea || !uploadPreview || !previewImg) return;
    
    uploadArea.style.display = 'none';
    uploadPreview.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function clearUpload() {
    selectedFile = null;
    uploadProgress = 0;
    analysisResults = null;
    
    const uploadArea = document.getElementById('uploadArea');
    const uploadPreview = document.getElementById('uploadPreview');
    const uploadProgressDiv = document.getElementById('uploadProgress');
    const resultsCard = document.getElementById('resultsCard');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (uploadPreview) uploadPreview.style.display = 'none';
    if (uploadProgressDiv) uploadProgressDiv.style.display = 'none';
    if (resultsCard) resultsCard.style.display = 'none';
    if (fileInput) fileInput.value = '';
}
function getRiskLevelText(level) {
    const levels = {
        'high': 'عالي',
        'medium': 'متوسط',
        'low': 'منخفض'
    };
    return levels[level] || level;
}

function getRiskLevelClass(level) {
    const levels = {
        'high': 'risk-high',
        'medium': 'risk-medium',
        'low': 'risk-low'
    };
    return levels[level] || 'risk-medium';
}

function renderClassificationData(data) {
    
    const avgConfidence = data.results.reduce((sum, result) => sum + result.confidence, 0) / data.results.length * 100;
    
    // إنشاء محتوى البطاقة الرئيسية
    const resultsBody = document.getElementById('results-body');
    resultsBody.innerHTML = `
        <div class="grid-container">
            <div class="card">
                <h3><i class="fas fa-info-circle"></i> معلومات الملف</h3>
                <div class="info-item">
                    <span class="info-label">اسم الملف:</span>
                    <span class="info-value">${data.filename}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">مسار الملف:</span>
                    <span class="info-value">${data.file_path}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">معرف التصنيف:</span>
                    <span class="info-value">${data.classification_id}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">وقت المعالجة:</span>
                    <span class="info-value">${data.processing_time.toFixed(2)} ثانية</span>
                </div>
            </div>

            <div class="card">
                <h3><i class="fas fa-exclamation-triangle"></i> مستوى الخطورة</h3>
                <div class="info-item">
                    <span class="info-label">الحالة العامة:</span>
                    <span class="info-value">
                        <span class="risk-badge ${getRiskLevelClass(data.overall_risk)}">${getRiskLevelText(data.overall_risk)}</span>
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">التنبيهات المشغلة:</span>
                    <span class="info-value">${data.alerts_triggered.length} تنبيهات</span>
                </div>
                <div class="info-item">
                    <span class="info-label">التنبيهات المرسلة:</span>
                    <span class="info-value">${data.alerts_sent} تنبيهات</span>
                </div>
                <div class="info-item">
                    <span class="info-label">مستوى الثقة العام:</span>
                    <span class="info-value">${avgConfidence.toFixed(2)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress ${getRiskLevelClass(data.overall_risk)}" style="width: ${avgConfidence.toFixed(2)}%"></div>
                </div>
            </div>

            <div class="card">
                <h3><i class="fas fa-tachometer-alt"></i> إحصائيات التحليل</h3>
                <div class="stats-container">
                    <div class="stat">
                        <div class="stat-value">${data.results.length}</div>
                        <div class="stat-label">الكيانات المكتشفة</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${(Math.min(...data.results.map(r => r.confidence)) * 100).toFixed(2)}%</div>
                        <div class="stat-label">أقل ثقة</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${(Math.max(...data.results.map(r => r.confidence)) * 100).toFixed(2)}%</div>
                        <div class="stat-label">أعلى ثقة</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h3><i class="fas fa-search"></i> نتائج التحليل التفصيلية</h3>
            <div class="grid-container">
                ${data.results.map((result, index) => `
                    <div class="card ${index === 0 ? 'glow' : 'pulse'}">
                        <h3><i class="fas ${result.category === 'accident' ? 'fa-car-crash' : 'fa-fist-raised'}"></i> ${result.arabic_name}</h3>
                        <div class="info-item">
                            <span class="info-label">الفئة:</span>
                            <span class="info-value">${result.category}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">مستوى الثقة:</span>
                            <span class="info-value">${(result.confidence * 100).toFixed(2)}%</span>
                        </div>
                        <div class="confidence-meter">
                            <div class="confidence-level" style="width: ${result.confidence * 100}%">${(result.confidence * 100).toFixed(2)}%</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">مستوى الخطورة:</span>
                            <span class="info-value">
                                <span class="risk-badge ${getRiskLevelClass(result.risk_level)}">${getRiskLevelText(result.risk_level)}</span>
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="card">
            <h3><i class="fas fa-bell"></i> التنبيهات المشغلة</h3>
            ${data.alerts_triggered.map(alert => `
                <div class="alert-container">
                    <h4><i class="fas fa-exclamation-circle"></i> تنبيه تم اكتشافه</h4>
                    <p>${alert}</p>
                </div>
            `).join('')}

            <h3 style="margin-top: 30px;"><i class="fas fa-paper-plane"></i> التفاصيل المرسلة</h3>
            ${data.alert_details.map(alert => `
                <div class="alert-detail">
                    <h4><i class="fas fa-envelope"></i> ${alert.title}</h4>
                    <div class="alert-message">${alert.message}</div>
                    <div style="margin-top: 15px;">
                        <span class="info-label">طرق الإرسال:</span>
                        ${alert.sent_methods.map(method => `
                            <span class="method-badge">${method === 'email' ? 'البريد الإلكتروني' : method}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // تحديث وقت المعالجة في الفوتر
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG');
    const timeStr = now.toLocaleTimeString('ar-EG');
    
    // إظهار العناصر المخفية
    document.getElementById('results-card').style.display = 'block';
    document.getElementById('results-footer').style.display = 'block';
    
    // تشغيل تأثيرات الرسوم المتحركة
    animateConfidenceBars();
}

function animateConfidenceBars() {
    const confidenceLevels = document.querySelectorAll('.confidence-level');
    confidenceLevels.forEach(level => {
        const width = level.style.width;
        level.style.width = '0';
        setTimeout(() => {
            level.style.width = width;
        }, 500);
    });
}

async function uploadImage() {
    if (!selectedFile) {
        showMessage('الرجاء اختيار صورة أولاً', 'error');
        return;
    }
    
    if (!authToken) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    showUploadProgress();
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    console.log("formData",selectedFile);
    console.log("formData",formData);
    try {
        updateProgress(10, 'جاري رفع الصورة...');
        
        // const response = await fetch(`${API_BASE_URL}/classify-image`, {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${authToken}`
        //     },
        //     body: formData
        // });
        const response = await api.uploadFile('/classify-image',selectedFile);
        console.log("response",response);
        if (!response || !response.response.ok) {
            throw new Error('فشل في رفع الصورة. الرجاء المحاولة مرة أخرى.');
        }
        
        updateProgress(50, 'جاري تحليل الصورة...');
        
        const data = response.data;
        
        updateProgress(80, 'جاري معالجة النتائج...');
        setTimeout(() => {
                renderClassificationData(data);
            }, 1000);
        if (data.success) {
            analysisResults = data.results;
            updateProgress(100, 'تم التحليل بنجاح');
            
            
        } else {
            throw new Error(data.message || 'فشل في تحليل الصورة');
        }
        
    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        showMessage(error.message || 'حدث خطأ أثناء تحليل الصورة', 'error');
        hideUploadProgress();
    }
}

function showUploadProgress() {
    const uploadPreview = document.getElementById('uploadPreview');
    const uploadProgress = document.getElementById('uploadProgress');
    
    if (uploadPreview) uploadPreview.style.display = 'none';
    if (uploadProgress) uploadProgress.style.display = 'block';
    
    updateProgress(0, 'جاري التحضير...');
}

function hideUploadProgress() {
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadPreview = document.getElementById('uploadPreview');
    
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (uploadPreview) uploadPreview.style.display = 'block';
}

function updateProgress(percentage, message) {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const steps = document.querySelectorAll('.step');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    
    steps.forEach((step, index) => {
        if (percentage >= (index + 1) * 33.33) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    uploadProgress = percentage;
}

function showResults(results) {
    const uploadProgress = document.getElementById('uploadProgress');
    const resultsCard = document.getElementById('resultsCard');
    
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (resultsCard) resultsCard.style.display = 'block';
    
    displayResultSummary(results);
    displayDetailedResults(results);
    displayRiskAssessment(results);
    displayRecommendations(results);
}

function displayResultSummary(results) {
    const summaryIcon = document.getElementById('summaryIcon');
    const summaryTitle = document.getElementById('summaryTitle');
    const summaryDescription = document.getElementById('summaryDescription');
    const confidenceValue = document.getElementById('confidenceValue');
    
    const primaryResult = results.alert_details[0];
    
    if (summaryIcon) {
        const iconClass = getClassificationIcon(primaryResult.category);
        const iconColor = getClassificationColor(primaryResult.category);
        summaryIcon.innerHTML = `<i class="${iconClass}"></i>`;
        summaryIcon.className = `summary-icon ${iconColor}`;
    }
    
    if (summaryTitle) {
        summaryTitle.textContent = getClassificationTitle(primaryResult.category);
    }
    
    if (summaryDescription) {
        summaryDescription.textContent = getClassificationDescription(primaryResult.category, primaryResult.subcategory);
    }
    
    if (confidenceValue) {
        confidenceValue.textContent = `${Math.round(primaryResult.confidence)}%`;
    }
}

function displayDetailedResults(results) {
    const resultsGrid = document.getElementById('resultsGrid');
    if (!resultsGrid) return;
    
    resultsGrid.innerHTML = '';
    
    results.alert_details.forEach(classification => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        resultItem.innerHTML = `
            <h5>${getClassificationTitle(classification.category)}</h5>
            <div class="result-percentage">${Math.round(classification.confidence)}%</div>
        `;
        
        resultsGrid.appendChild(resultItem);
    });
}

function displayRiskAssessment(results) {
    const riskFill = document.getElementById('riskFill');
    const riskText = document.getElementById('riskText');
    
    const riskLevel = calculateRiskLevel(results);
    const riskPercentage = getRiskPercentage(riskLevel);
    const riskColor = getRiskColor(riskLevel);
    const riskTextValue = getRiskText(riskLevel);
    
    if (riskFill) {
        riskFill.style.width = `${riskPercentage}%`;
        riskFill.style.background = riskColor;
    }
    
    if (riskText) {
        riskText.textContent = riskTextValue;
        riskText.style.color = riskColor;
    }
}

function displayRecommendations(results) {
    const recommendationList = document.getElementById('recommendationList');
    if (!recommendationList) return;
    
    const recommendations = generateRecommendations(results);
    recommendationList.innerHTML = '';
    
    recommendations.forEach(recommendation => {
        const recommendationItem = document.createElement('div');
        recommendationItem.className = 'recommendation-item';
        
        recommendationItem.innerHTML = `
            <i class="fas fa-lightbulb"></i>
            <span>${recommendation}</span>
        `;
        
        recommendationList.appendChild(recommendationItem);
    });
}

function getClassificationIcon(category) {
    const icons = {
        'fire': 'fas fa-fire',
        'traffic': 'fas fa-car',
        'accident': 'fas fa-exclamation-triangle',
        'violence': 'fas fa-fist-raised',
        'normal': 'fas fa-check-circle'
    };
    return icons[category] || 'fas fa-question-circle';
}

function getClassificationColor(category) {
    const colors = {
        'fire': 'danger',
        'traffic': 'warning',
        'accident': 'warning',
        'violence': 'danger',
        'normal': 'success'
    };
    return colors[category] || 'info';
}

function getClassificationTitle(category) {
    const titles = {
        'fire': 'حريق',
        'traffic': 'حركة مرور',
        'accident': 'حادث',
        'violence': 'عنف',
        'normal': 'طبيعي'
    };
    return titles[category] || 'غير محدد';
}

function getClassificationDescription(category, subcategory) {
    const descriptions = {
        'fire': {
            'small': 'تم اكتشاف حريق صغير يتطلب تدخل سريع',
            'large': 'تم اكتشاف حريق كبير يتطلب تدخل عاجل',
            'smoke': 'تم اكتشاف دخان قد يشير إلى بداية حريق'
        },
        'traffic': {
            'light': 'حركة مرور عادية',
            'heavy': 'ازدحام مروري شديد',
            'jam': 'توقف تام في حركة المرور'
        },
        'accident': {
            'minor': 'حادث بسيط بدون إصابات خطيرة',
            'major': 'حادث خطير يتطلب تدخل الطوارئ'
        },
        'violence': {
            'verbal': 'عنف لفظي أو تهديد',
            'physical': 'عنف جسدي يتطلب تدخل فوري'
        },
        'normal': {
            'safe': 'الوضع طبيعي وآمن'
        }
    };
    
    return descriptions[category]?.[subcategory] || 'تم تصنيف الصورة بنجاح';
}

function calculateRiskLevel(results) {
    const category = results.primary_classification.category;
    const confidence = results.confidence;
    
    if (category === 'normal') return 'low';
    if (category === 'traffic' && confidence < 70) return 'low';
    if (category === 'traffic' && confidence >= 70) return 'medium';
    if ((category === 'accident' || category === 'fire') && confidence < 80) return 'medium';
    if ((category === 'accident' || category === 'fire') && confidence >= 80) return 'high';
    if (category === 'violence') return 'critical';
    
    return 'medium';
}

function getRiskPercentage(riskLevel) {
    const percentages = {
        'low': 25,
        'medium': 50,
        'high': 75,
        'critical': 100
    };
    return percentages[riskLevel] || 50;
}

function getRiskColor(riskLevel) {
    const colors = {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#ef4444',
        'critical': '#7c2d12'
    };
    return colors[riskLevel] || '#6b7280';
}

function getRiskText(riskLevel) {
    const texts = {
        'low': 'منخفض',
        'medium': 'متوسط',
        'high': 'عالي',
        'critical': 'حرج'
    };
    return texts[riskLevel] || 'غير محدد';
}

function generateRecommendations(results) {
    const category = results.primary_classification.category;
    const confidence = results.confidence;
    
    const recommendations = {
        'fire': [
            'اتصل بالإطفاء فوراً على الرقم 998',
            'قم بإخلاء المنطقة المحيطة',
            'لا تحاول إطفاء الحريق بنفسك إذا كان كبيراً',
            'تأكد من سلامة الطرق المؤدية للموقع'
        ],
        'traffic': [
            'استخدم طرق بديلة إذا أمكن',
            'تحلى بالصبر وتجنب القيادة العدوانية',
            'حافظ على مسافة آمنة بين المركبات',
            'استخدم تطبيقات المرور لمعرفة الطرق الأفضل'
        ],
        'accident': [
            'اتصل بالإسعاف على الرقم 997',
            'لا تحرك المصابين إلا إذا كانوا في خطر',
            'قم بتأمين موقع الحادث',
            'انتظر وصول فرق الطوارئ'
        ],
        'violence': [
            'اتصل بالشرطة فوراً على الرقم 999',
            'ابتعد عن منطقة الخطر',
            'لا تتدخل مباشرة إلا إذا كنت مدرباً',
            'قم بتوثيق الحادث إذا أمكن بأمان'
        ],
        'normal': [
            'الوضع طبيعي وآمن',
            'استمر في المراقبة الدورية',
            'حافظ على اليقظة',
            'قم بالإبلاغ عن أي تغيير في الوضع'
        ]
    };
    
    return recommendations[category] || ['تم التحليل بنجاح'];
}

function downloadResults() {
    if (!analysisResults) return;
    
    const reportData = {
        filename: selectedFile.name,
        timestamp: new Date().toISOString(),
        results: analysisResults
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_التحليل_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    showNotification('تم التحميل', 'تم تحميل تقرير التحليل بنجاح', 'success');
}

function shareResults() {
    if (!analysisResults) return;
    
    const shareData = {
        title: 'نتائج تحليل الصورة - نظام الأمان الذكي',
        text: `تم تحليل الصورة وتصنيفها كـ: ${getClassificationTitle(analysisResults.primary_classification.category)} بنسبة ثقة ${Math.round(analysisResults.confidence)}%`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => showNotification('تم المشاركة', 'تم مشاركة النتائج بنجاح', 'success'))
            .catch(error => console.error('خطأ في المشاركة:', error));
    } else {
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
            .then(() => showNotification('تم النسخ', 'تم نسخ النتائج إلى الحافظة', 'success'))
            .catch(error => console.error('خطأ في النسخ:', error));
    }
}

