let dashboardChart = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    loadDashboardData();
    setupChart();
    setupRefreshInterval();
    setupEventListeners();
    loadRecentClassifications();
}

function setupEventListeners() {
    const chartPeriodSelect = document.getElementById('chartPeriod');
    if (chartPeriodSelect) {
        chartPeriodSelect.addEventListener('change', function() {
            updateChart(this.value);
        });
    }

    const markAllReadBtn = document.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsRead);
    }
}

async function loadDashboardData() {
    if (!authToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/dashboard-data`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            updateDashboardStats(data.stats);
            updateCategoryDistribution(data.categories);
            animateStatCards();
        } else {
            console.error('فشل في تحميل بيانات لوحة التحكم:', data.message);
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
    }
}

function updateDashboardStats(stats) {
    const statElements = {
        'totalImages': { value: stats.total_images, change: stats.images_change },
        'alertsCount': { value: stats.active_alerts, change: stats.alerts_change },
        'avgTime': { value: stats.avg_processing_time, change: stats.time_change },
        'accuracy': { value: stats.accuracy, change: stats.accuracy_change }
    };

    Object.keys(statElements).forEach(id => {
        const element = document.getElementById(id);
        const stat = statElements[id];
        
        if (element) {
            animateNumber(element, stat.value);
        }

        const changeElement = element?.parentElement.querySelector('.stat-change');
        if (changeElement && stat.change !== undefined) {
            updateStatChange(changeElement, stat.change);
        }
    });
}

function animateNumber(element, targetValue) {
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1500;
    const startTime = Date.now();

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        
        if (element.id === 'avgTime') {
            element.textContent = currentValue.toFixed(1);
        } else if (element.id === 'accuracy') {
            element.textContent = currentValue.toFixed(1);
        } else {
            element.textContent = Math.floor(currentValue);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateStatChange(element, change) {
    const isPositive = change >= 0;
    const icon = element.querySelector('i');
    const span = element.querySelector('span');

    element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
    
    if (icon) {
        icon.className = `fas fa-arrow-${isPositive ? 'up' : 'down'}`;
    }
    
    if (span) {
        span.textContent = `${isPositive ? '+' : ''}${change}%`;
    }
}

function updateCategoryDistribution(categories) {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach((item, index) => {
        const categoryFill = item.querySelector('.category-fill');
        const categoryCount = item.querySelector('.category-count');
        
        if (categories[index] && categoryFill && categoryCount) {
            const percentage = categories[index].percentage;
            categoryCount.textContent = `${percentage}%`;
            
            setTimeout(() => {
                categoryFill.style.width = `${percentage}%`;
            }, index * 200);
        }
    });
}

function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'translateY(0)';
            card.style.opacity = '1';
        }, index * 100);
    });
}

function setupChart() {
    const chartCanvas = document.getElementById('classificationChart');
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    
    dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'التصنيفات',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });

    updateChart('today');
}

async function updateChart(period) {
    if (!authToken || !dashboardChart) return;

    try {
        const response = await fetch(`${API_BASE_URL}/chart-data?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            dashboardChart.data.labels = data.labels;
            dashboardChart.data.datasets[0].data = data.values;
            dashboardChart.update('active');
        }
    } catch (error) {
        console.error('خطأ في تحديث الرسم البياني:', error);
    }
}

async function loadRecentClassifications() {
    if (!authToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/recent-classifications`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            displayRecentClassifications(data.classifications);
        }
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات الأخيرة:', error);
    }
}

function displayRecentClassifications(classifications) {
    const container = document.querySelector('.recent-classifications');
    if (!container) return;

    container.innerHTML = '';

    if (classifications.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">لا توجد تصنيفات حديثة</p>';
        return;
    }

    classifications.forEach(classification => {
        const classificationElement = createClassificationElement(classification);
        container.appendChild(classificationElement);
    });
}

function createClassificationElement(classification) {
    const div = document.createElement('div');
    div.className = 'classification-item';
    
    const resultClass = getResultClass(classification.result);
    const resultText = getResultText(classification.result);
    
    div.innerHTML = `
        <div class="classification-image">
            <i class="fas fa-image"></i>
        </div>
        <div class="classification-info">
            <h4>${classification.filename}</h4>
            <div class="classification-result">
                <span class="result-badge ${resultClass}">${resultText}</span>
                <span class="confidence">${classification.confidence}%</span>
            </div>
            <small>${formatDate(classification.created_at)}</small>
        </div>
        <div class="classification-actions">
            <button class="btn btn-sm btn-secondary" onclick="viewClassification('${classification.id}')">
                عرض
            </button>
        </div>
    `;
    
    return div;
}

function getResultClass(result) {
    const classes = {
        'fire': 'fire',
        'traffic': 'traffic',
        'accident': 'accident',
        'violence': 'violence',
        'normal': 'normal'
    };
    return classes[result] || 'normal';
}

function getResultText(result) {
    const texts = {
        'fire': 'حريق',
        'traffic': 'حركة مرور',
        'accident': 'حادث',
        'violence': 'عنف',
        'normal': 'طبيعي'
    };
    return texts[result] || 'غير محدد';
}

function viewClassification(classificationId) {
    window.location.href = `classification-details.html?id=${classificationId}`;
}

function setupRefreshInterval() {
    refreshInterval = setInterval(() => {
        loadDashboardData();
        loadRecentClassifications();
        loadNotifications();
    }, 30000);
}

function markAllNotificationsRead() {
    if (!authToken) return;

    fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const notificationItems = document.querySelectorAll('.notification-item.unread');
            notificationItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            const notificationBadge = document.querySelector('.notification-badge');
            if (notificationBadge) {
                notificationBadge.style.display = 'none';
            }
        }
    })
    .catch(error => {
        console.error('خطأ في تحديد الإشعارات كمقروءة:', error);
    });
}

function refreshDashboard() {
    loadDashboardData();
    loadRecentClassifications();
    loadNotifications();
    
    showNotification('تم التحديث', 'تم تحديث بيانات لوحة التحكم', 'success');
}

function toggleAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        showNotification('تم إيقاف التحديث التلقائي', '', 'info');
    } else {
        setupRefreshInterval();
        showNotification('تم تفعيل التحديث التلقائي', '', 'success');
    }
}

window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

window.viewClassification = viewClassification;
window.refreshDashboard = refreshDashboard;
window.toggleAutoRefresh = toggleAutoRefresh;

