const API_BASE_URL = 'http://localhost:5000';

let currentUser = null;
let authToken = localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    setupNavigation();
    setupAnimations();
    setupScrollEffects();
    updateDashboardStats();
}

function setupEventListeners() {
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotifications);
    }

    document.addEventListener('click', function(e) {
        const notificationDropdown = document.querySelector('.notification-dropdown');
        if (notificationDropdown && !e.target.closest('.notifications')) {
            notificationDropdown.style.display = 'none';
        }
    });

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                if (entry.target.classList.contains('stat-number')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-card, .stat-item, .about-feature');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        });
    }
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(function() {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (navMenu && navToggle) {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
        sidebar.classList.toggle('open');
        
        if (window.innerWidth <= 1024) {
            if (sidebar.classList.contains('open')) {
                mainContent.style.marginRight = '0';
            } else {
                mainContent.style.marginRight = '0';
            }
        }
    }
}

function toggleNotifications() {
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        loadNotifications();
    }
}

function loadNotifications() {
    if (!authToken) return;

    fetch(`${API_BASE_URL}/notifications`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayNotifications(data.notifications);
        }
    })
    .catch(error => {
        console.error('خطأ في تحميل الإشعارات:', error);
    });
}

function displayNotifications(notifications) {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;

    notificationList.innerHTML = '';

    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="notification-item"><p>لا توجد إشعارات جديدة</p></div>';
        return;
    }

    notifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        notificationList.appendChild(notificationElement);
    });
}

function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = `notification-item ${notification.read ? '' : 'unread'}`;
    
    const iconClass = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    
    div.innerHTML = `
        <div class="notification-icon ${iconColor}">
            <i class="${iconClass}"></i>
        </div>
        <div class="notification-content">
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
            <small>${formatDate(notification.created_at)}</small>
        </div>
    `;
    
    return div;
}

function getNotificationIcon(type) {
    const icons = {
        'fire': 'fas fa-fire',
        'traffic': 'fas fa-car',
        'accident': 'fas fa-exclamation-triangle',
        'violence': 'fas fa-fist-raised',
        'success': 'fas fa-check',
        'info': 'fas fa-info'
    };
    return icons[type] || 'fas fa-bell';
}

function getNotificationColor(type) {
    const colors = {
        'fire': 'danger',
        'traffic': 'warning',
        'accident': 'warning',
        'violence': 'danger',
        'success': 'success',
        'info': 'info'
    };
    return colors[type] || 'info';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
}


console.log("authToken",localStorage.getItem('authToken',' '));
const data = api.validateToken();
console.log("data",data);
if (data.success) {
    currentUser = data.user;
    updateUserInterface();
} else {
    // localStorage.removeItem('authToken');
    // authToken = null;
    // redirectToLogin();
    console.error('validateToken',data);
}
    
   

function redirectToLogin() {
    const currentPage = window.location.pathname;
    const publicPages = ['/', '/index.html', '/pages/login.html', '/pages/register.html'];
    
    if (!publicPages.some(page => currentPage.includes(page))) {
        window.location.href = '../pages/login.html';
    }
}

function updateUserInterface() {
    if (!currentUser) return;

    const userNameElements = document.querySelectorAll('#userName, #welcomeName');
    userNameElements.forEach(element => {
        if (element) {
            element.textContent = currentUser.username;
        }
    });

    const userEmailElements = document.querySelectorAll('#userEmail');
    userEmailElements.forEach(element => {
        if (element) {
            element.textContent = currentUser.email;
        }
    });
}



function updateDashboardStats() {
    const stats = api.getUserInfo();
    const elements = {
        'totalImages': stats.total_images,
        'alertsCount': stats.active_alerts,
        'avgTime': stats.avg_processing_time,
        'accuracy': stats.accuracy
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
}

function logout() {
    if (!authToken) return;

    fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        window.location.href = '../index.html';
    })
    .catch(error => {
        console.error('خطأ في تسجيل الخروج:', error);
        localStorage.removeItem('authToken');
        window.location.href = '../index.html';
    });
}

function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('formMessage');
    if (!messageContainer) return;

    messageContainer.textContent = message;
    messageContainer.className = `form-message ${type}`;
    messageContainer.style.display = 'block';

    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}

function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification toast ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function handleScroll() {
    const scrollTop = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax');
    
    parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        element.style.transform = `translateY(${scrollTop * speed}px)`;
    });
}

function handleResize() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth > 1024) {
        if (sidebar) sidebar.classList.remove('open');
        if (mainContent) mainContent.style.marginRight = '280px';
    } else {
        if (mainContent) mainContent.style.marginRight = '0';
    }
}

function exportData() {
    if (!authToken) return;

    showNotification('تصدير البيانات', 'جاري تحضير ملف التصدير...', 'info');

    fetch(`${API_BASE_URL}/export-data`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('تم التصدير', 'تم تصدير البيانات بنجاح', 'success');
    })
    .catch(error => {
        console.error('خطأ في تصدير البيانات:', error);
        showNotification('خطأ', 'فشل في تصدير البيانات', 'error');
    });
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        button.className = 'fas fa-eye';
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
}

function updatePasswordStrength(password) {
    const validation = validatePassword(password);
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    const score = Object.values(validation).filter(Boolean).length;
    const percentage = (score / 5) * 100;
    
    strengthBar.style.width = `${percentage}%`;
    
    if (score < 2) {
        strengthBar.style.background = '#ef4444';
        strengthText.textContent = 'ضعيف';
    } else if (score < 4) {
        strengthBar.style.background = '#f59e0b';
        strengthText.textContent = 'متوسط';
    } else {
        strengthBar.style.background = '#10b981';
        strengthText.textContent = 'قوي';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

window.logout = logout;
window.exportData = exportData;
window.togglePassword = togglePassword;

