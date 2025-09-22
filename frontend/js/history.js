let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let currentSort = 'date_desc';
let currentView = 'table';
let selectedClassification = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeHistoryPage();
});

function initializeHistoryPage() {
    loadHistoryStats();
    loadClassificationHistory();
    setupEventListeners();
    setupFilters();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortBy');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 500));
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    const filterInputs = document.querySelectorAll('#categoryFilter, #dateFrom, #dateTo, #confidenceFilter');
    filterInputs.forEach(input => {
        input.addEventListener('change', updateFilters);
    });
}

function setupFilters() {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    
    if (dateFromInput) {
        dateFromInput.value = oneWeekAgo.toISOString().split('T')[0];
    }
    
    if (dateToInput) {
        dateToInput.value = today.toISOString().split('T')[0];
    }
}

async function loadHistoryStats() {
    try {
        const data = await api.getUserActivity();
        
        if (data.success) {
            updateHistoryStats(data.stats);
        }
    } catch (error) {
        console.error('خطأ في تحميل إحصائيات التاريخ:', error);
    }
}

function updateHistoryStats(stats) {
    const elements = {
        'totalClassifications': stats.total_classifications || 0,
        'todayClassifications': stats.today_classifications || 0,
        'alertsGenerated': stats.alerts_generated || 0,
        'avgAccuracy': stats.avg_accuracy || 0
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'avgAccuracy') {
                animateNumber(element, elements[id], 1);
            } else {
                animateNumber(element, elements[id]);
            }
        }
    });
}

async function loadClassificationHistory() {
    try {
        showLoading();
        
        const params = {
            page: currentPage,
            limit: 20,
            sort: currentSort,
            ...currentFilters
        };
        
        const data = await api.getClassificationHistory(params.page, params.limit, params);
        
        if (data.success) {
            displayClassificationHistory(data.classifications);
            updatePagination(data.pagination);
        } else {
            showMessage('فشل في تحميل التاريخ', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحميل تاريخ التصنيفات:', error);
        showMessage('حدث خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

function displayClassificationHistory(classifications) {
    if (currentView === 'table') {
        displayTableView(classifications);
    } else {
        displayGridView(classifications);
    }
}

function displayTableView(classifications) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (classifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>لا توجد نتائج مطابقة للبحث</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    classifications.forEach(classification => {
        const row = createTableRow(classification);
        tbody.appendChild(row);
    });
}

function createTableRow(classification) {
    const tr = document.createElement('tr');
    tr.className = 'table-row';
    
    const resultClass = getResultClass(classification.result);
    const resultText = getResultText(classification.result);
    const statusClass = classification.alert_sent ? 'sent' : 'not-sent';
    const statusText = classification.alert_sent ? 'تم الإرسال' : 'لم يُرسل';
    
    tr.innerHTML = `
        <td>
            <div class="image-cell">
                <div class="image-placeholder">
                    <i class="fas fa-image"></i>
                </div>
            </div>
        </td>
        <td>
            <div class="filename-cell">
                <span class="filename">${classification.filename}</span>
                <small class="file-size">${formatFileSize(classification.file_size || 0)}</small>
            </div>
        </td>
        <td>
            <span class="result-badge ${resultClass}">${resultText}</span>
        </td>
        <td>
            <div class="confidence-cell">
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${classification.confidence}%"></div>
                </div>
                <span class="confidence-text">${Math.round(classification.confidence)}%</span>
            </div>
        </td>
        <td>
            <div class="date-cell">
                <span class="date">${formatDate(classification.created_at)}</span>
                <small class="time">${formatTime(classification.created_at)}</small>
            </div>
        </td>
        <td>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-sm btn-secondary" onclick="viewClassificationDetails('${classification.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="downloadClassificationReport('${classification.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteClassification('${classification.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

function displayGridView(classifications) {
    const grid = document.getElementById('historyGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (classifications.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>لا توجد نتائج مطابقة للبحث</p>
            </div>
        `;
        return;
    }
    
    classifications.forEach(classification => {
        const card = createGridCard(classification);
        grid.appendChild(card);
    });
}

function createGridCard(classification) {
    const div = document.createElement('div');
    div.className = 'history-card';
    
    const resultClass = getResultClass(classification.result);
    const resultText = getResultText(classification.result);
    
    div.innerHTML = `
        <div class="card-image">
            <div class="image-placeholder">
                <i class="fas fa-image"></i>
            </div>
            <div class="card-overlay">
                <button class="btn btn-sm btn-primary" onclick="viewClassificationDetails('${classification.id}')">
                    <i class="fas fa-eye"></i>
                    عرض التفاصيل
                </button>
            </div>
        </div>
        <div class="card-content">
            <div class="card-header">
                <h4 class="card-title">${classification.filename}</h4>
                <span class="result-badge ${resultClass}">${resultText}</span>
            </div>
            <div class="card-stats">
                <div class="stat">
                    <i class="fas fa-percentage"></i>
                    <span>${Math.round(classification.confidence)}%</span>
                </div>
                <div class="stat">
                    <i class="fas fa-clock"></i>
                    <span>${formatDate(classification.created_at)}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm btn-secondary" onclick="downloadClassificationReport('${classification.id}')">
                    <i class="fas fa-download"></i>
                    تحميل
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteClassification('${classification.id}')">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </div>
        </div>
    `;
    
    return div;
}

function updatePagination(pagination) {
    totalPages = pagination.total_pages;
    currentPage = pagination.current_page;
    
    const paginationInfo = document.getElementById('paginationInfo');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (paginationInfo) {
        const start = (currentPage - 1) * pagination.per_page + 1;
        const end = Math.min(currentPage * pagination.per_page, pagination.total);
        paginationInfo.textContent = `عرض ${start}-${end} من ${pagination.total} نتيجة`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    if (pageNumbers) {
        pageNumbers.innerHTML = '';
        
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => goToPage(i);
            pageNumbers.appendChild(pageBtn);
        }
    }
}

function handleSearch(e) {
    currentFilters.search = e.target.value;
    currentPage = 1;
    loadClassificationHistory();
}

function handleSortChange(e) {
    currentSort = e.target.value;
    currentPage = 1;
    loadClassificationHistory();
}

function updateFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    const confidenceFilter = document.getElementById('confidenceFilter').value;
    
    currentFilters = {};
    
    if (categoryFilter) currentFilters.category = categoryFilter;
    if (dateFrom) currentFilters.date_from = dateFrom;
    if (dateTo) currentFilters.date_to = dateTo;
    if (confidenceFilter) currentFilters.confidence = confidenceFilter;
}

function applyFilters() {
    updateFilters();
    currentPage = 1;
    loadClassificationHistory();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('confidenceFilter').value = '';
    
    currentFilters = {};
    currentPage = 1;
    loadClassificationHistory();
}

function switchView(view) {
    currentView = view;
    
    const tableView = document.getElementById('tableView');
    const gridView = document.getElementById('gridView');
    const viewButtons = document.querySelectorAll('.view-btn');
    
    viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    if (view === 'table') {
        tableView.style.display = 'block';
        gridView.style.display = 'none';
    } else {
        tableView.style.display = 'none';
        gridView.style.display = 'block';
    }
    
    loadClassificationHistory();
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        goToPage(newPage);
    }
}

function goToPage(page) {
    currentPage = page;
    loadClassificationHistory();
}

async function viewClassificationDetails(id) {
    try {
        const data = await api.getClassificationDetails(id);
        
        if (data.success) {
            selectedClassification = data.classification;
            showClassificationModal(data.classification);
        } else {
            showMessage('فشل في تحميل تفاصيل التصنيف', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحميل تفاصيل التصنيف:', error);
        showMessage('حدث خطأ في تحميل التفاصيل', 'error');
    }
}

function showClassificationModal(classification) {
    const modal = document.getElementById('classificationModal');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalBody) return;
    
    const resultClass = getResultClass(classification.result);
    const resultText = getResultText(classification.result);
    
    modalBody.innerHTML = `
        <div class="classification-details">
            <div class="detail-section">
                <h4>معلومات الملف</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>اسم الملف:</label>
                        <span>${classification.filename}</span>
                    </div>
                    <div class="detail-item">
                        <label>حجم الملف:</label>
                        <span>${formatFileSize(classification.file_size || 0)}</span>
                    </div>
                    <div class="detail-item">
                        <label>تاريخ الرفع:</label>
                        <span>${formatDateTime(classification.created_at)}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>نتائج التصنيف</h4>
                <div class="result-summary">
                    <div class="result-main">
                        <span class="result-badge ${resultClass}">${resultText}</span>
                        <span class="confidence-large">${Math.round(classification.confidence)}%</span>
                    </div>
                    <div class="result-description">
                        <p>${getClassificationDescription(classification.result, classification.subcategory)}</p>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>تفاصيل إضافية</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>وقت المعالجة:</label>
                        <span>${classification.processing_time || 'غير متاح'} ثانية</span>
                    </div>
                    <div class="detail-item">
                        <label>حالة التنبيه:</label>
                        <span class="status-badge ${classification.alert_sent ? 'sent' : 'not-sent'}">
                            ${classification.alert_sent ? 'تم الإرسال' : 'لم يُرسل'}
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>الموقع:</label>
                        <span>${classification.location || 'غير محدد'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('classificationModal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedClassification = null;
}

async function downloadClassificationReport(id) {
    try {
        const data = await api.getClassificationDetails(id);
        
        if (data.success) {
            const reportData = {
                classification: data.classification,
                generated_at: new Date().toISOString(),
                report_type: 'classification_details'
            };
            
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `تقرير_${data.classification.filename}_${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            showNotification('تم التحميل', 'تم تحميل تقرير التصنيف بنجاح', 'success');
        }
    } catch (error) {
        console.error('خطأ في تحميل التقرير:', error);
        showMessage('فشل في تحميل التقرير', 'error');
    }
}

function confirmDeleteClassification(id) {
    if (confirm('هل أنت متأكد من حذف هذا التصنيف؟ لا يمكن التراجع عن هذا الإجراء.')) {
        deleteClassificationById(id);
    }
}

async function deleteClassificationById(id) {
    try {
        const data = await api.deleteClassification(id);
        
        if (data.success) {
            showNotification('تم الحذف', 'تم حذف التصنيف بنجاح', 'success');
            loadClassificationHistory();
            loadHistoryStats();
        } else {
            showMessage('فشل في حذف التصنيف', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف التصنيف:', error);
        showMessage('حدث خطأ أثناء الحذف', 'error');
    }
}

function deleteClassification() {
    if (selectedClassification) {
        confirmDeleteClassification(selectedClassification.id);
        closeModal();
    }
}

function downloadClassification() {
    if (selectedClassification) {
        downloadClassificationReport(selectedClassification.id);
    }
}

async function exportHistory() {
    try {
        showNotification('تصدير البيانات', 'جاري تحضير ملف التصدير...', 'info');
        
        const blob = await api.exportData('csv');
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `تاريخ_التصنيفات_${new Date().toISOString().split('T')[0]}.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        showNotification('تم التصدير', 'تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showMessage('فشل في تصدير البيانات', 'error');
    }
}

function showLoading() {
    const tableBody = document.getElementById('historyTableBody');
    const grid = document.getElementById('historyGrid');
    
    const loadingHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>جاري تحميل البيانات...</p>
        </div>
    `;
    
    if (currentView === 'table' && tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7">${loadingHTML}</td></tr>`;
    } else if (currentView === 'grid' && grid) {
        grid.innerHTML = loadingHTML;
    }
}

function hideLoading() {
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

window.addEventListener('click', function(e) {
    const modal = document.getElementById('classificationModal');
    if (e.target === modal) {
        closeModal();
    }
});

window.viewClassificationDetails = viewClassificationDetails;
window.downloadClassificationReport = downloadClassificationReport;
window.confirmDeleteClassification = confirmDeleteClassification;
window.switchView = switchView;
window.changePage = changePage;
window.goToPage = goToPage;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.exportHistory = exportHistory;
window.closeModal = closeModal;
window.deleteClassification = deleteClassification;
window.downloadClassification = downloadClassification;

