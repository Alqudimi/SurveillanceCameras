let currentSettings = {};
let emergencyContacts = [];
let currentContactId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeSettingsPage();
});

function initializeSettingsPage() {
    loadUserSettings();
    loadEmergencyContacts();
    setupEventListeners();
}

function setupEventListeners() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    const settingsInputs = document.querySelectorAll('input[type="checkbox"], select');
    settingsInputs.forEach(input => {
        input.addEventListener('change', markSettingsChanged);
    });
}

async function loadUserSettings() {
    try {
        const data = await api.getUserSettings();
        
        if (data.success) {
            currentSettings = data.settings;
            populateSettings(data.settings);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
}

function populateSettings(settings) {
    const settingElements = {
        'emailNotifications': settings.email_notifications,
        'smsNotifications': settings.sms_notifications,
        'browserNotifications': settings.browser_notifications,
        'soundNotifications': settings.sound_notifications,
        'fireConfidence': settings.fire_confidence,
        'fireImmediate': settings.fire_immediate,
        'trafficConfidence': settings.traffic_confidence,
        'trafficImmediate': settings.traffic_immediate,
        'accidentConfidence': settings.accident_confidence,
        'accidentImmediate': settings.accident_immediate,
        'violenceConfidence': settings.violence_confidence,
        'violenceImmediate': settings.violence_immediate,
        'autoSaveImages': settings.auto_save_images,
        'autoRefresh': settings.auto_refresh,
        'darkMode': settings.dark_mode,
        'systemLanguage': settings.system_language
    };

    Object.keys(settingElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settingElements[id];
            } else {
                element.value = settingElements[id];
            }
        }
    });

    if (settings.dark_mode) {
        document.body.classList.add('dark-theme');
    }
}

async function loadEmergencyContacts() {
    try {
        const data = await api.getEmergencyContacts();
        
        if (data.success) {
            emergencyContacts = data.contacts;
            displayEmergencyContacts(data.contacts);
        }
    } catch (error) {
        console.error('خطأ في تحميل جهات الاتصال:', error);
    }
}

function displayEmergencyContacts(contacts) {
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;

    contactsList.innerHTML = '';

    if (contacts.length === 0) {
        contactsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book"></i>
                <p>لا توجد جهات اتصال طارئة</p>
                <button class="btn btn-primary" onclick="addContact()">
                    <i class="fas fa-plus"></i>
                    إضافة جهة اتصال
                </button>
            </div>
        `;
        return;
    }

    contacts.forEach(contact => {
        const contactElement = createContactElement(contact);
        contactsList.appendChild(contactElement);
    });
}

function createContactElement(contact) {
    const div = document.createElement('div');
    div.className = 'contact-item';
    
    const typeIcon = getContactTypeIcon(contact.type);
    const typeText = getContactTypeText(contact.type);
    
    div.innerHTML = `
        <div class="contact-info">
            <div class="contact-icon">
                <i class="${typeIcon}"></i>
            </div>
            <div class="contact-details">
                <h4>${contact.name}</h4>
                <p class="contact-phone">${contact.phone}</p>
                ${contact.email ? `<p class="contact-email">${contact.email}</p>` : ''}
                <span class="contact-type">${typeText}</span>
            </div>
        </div>
        <div class="contact-actions">
            <button class="btn btn-sm btn-secondary" onclick="editContact('${contact.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteContact('${contact.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

function getContactTypeIcon(type) {
    const icons = {
        'emergency': 'fas fa-exclamation-triangle',
        'police': 'fas fa-shield-alt',
        'fire': 'fas fa-fire',
        'medical': 'fas fa-user-md',
        'personal': 'fas fa-user'
    };
    return icons[type] || 'fas fa-phone';
}

function getContactTypeText(type) {
    const texts = {
        'emergency': 'طوارئ',
        'police': 'شرطة',
        'fire': 'إطفاء',
        'medical': 'طبي',
        'personal': 'شخصي'
    };
    return texts[type] || 'غير محدد';
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    contents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

function markSettingsChanged() {
    const saveBtn = document.querySelector('.btn-primary[onclick="saveSettings()"]');
    if (saveBtn) {
        saveBtn.classList.add('changed');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التغييرات';
    }
}

async function saveSettings() {
    try {
        const settings = collectSettings();
        
        const data = await api.updateUserSettings(settings);
        
        if (data.success) {
            currentSettings = settings;
            showNotification('تم الحفظ', 'تم حفظ الإعدادات بنجاح', 'success');
            
            const saveBtn = document.querySelector('.btn-primary[onclick="saveSettings()"]');
            if (saveBtn) {
                saveBtn.classList.remove('changed');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الإعدادات';
            }
            
            applySettings(settings);
        } else {
            showMessage('فشل في حفظ الإعدادات', 'error');
        }
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        showMessage('حدث خطأ أثناء حفظ الإعدادات', 'error');
    }
}

function collectSettings() {
    return {
        email_notifications: document.getElementById('emailNotifications').checked,
        sms_notifications: document.getElementById('smsNotifications').checked,
        browser_notifications: document.getElementById('browserNotifications').checked,
        sound_notifications: document.getElementById('soundNotifications').checked,
        fire_confidence: parseInt(document.getElementById('fireConfidence').value),
        fire_immediate: document.getElementById('fireImmediate').checked,
        traffic_confidence: parseInt(document.getElementById('trafficConfidence').value),
        traffic_immediate: document.getElementById('trafficImmediate').checked,
        accident_confidence: parseInt(document.getElementById('accidentConfidence').value),
        accident_immediate: document.getElementById('accidentImmediate').checked,
        violence_confidence: parseInt(document.getElementById('violenceConfidence').value),
        violence_immediate: document.getElementById('violenceImmediate').checked,
        auto_save_images: document.getElementById('autoSaveImages').checked,
        auto_refresh: document.getElementById('autoRefresh').checked,
        dark_mode: document.getElementById('darkMode').checked,
        system_language: document.getElementById('systemLanguage').value
    };
}

function applySettings(settings) {
    if (settings.dark_mode) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    if (settings.browser_notifications && 'Notification' in window) {
        Notification.requestPermission();
    }
}

function resetSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟')) {
        populateSettings(getDefaultSettings());
        markSettingsChanged();
    }
}

function getDefaultSettings() {
    return {
        email_notifications: true,
        sms_notifications: false,
        browser_notifications: true,
        sound_notifications: true,
        fire_confidence: 70,
        fire_immediate: true,
        traffic_confidence: 80,
        traffic_immediate: false,
        accident_confidence: 70,
        accident_immediate: true,
        violence_confidence: 60,
        violence_immediate: true,
        auto_save_images: true,
        auto_refresh: true,
        dark_mode: false,
        system_language: 'ar'
    };
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showMessage('كلمات المرور الجديدة غير متطابقة', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'error');
        return;
    }
    
    try {
        const data = await api.changePassword(currentPassword, newPassword);
        
        if (data.success) {
            showNotification('تم التحديث', 'تم تحديث كلمة المرور بنجاح', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            showMessage(data.message || 'فشل في تحديث كلمة المرور', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث كلمة المرور:', error);
        showMessage('حدث خطأ أثناء تحديث كلمة المرور', 'error');
    }
}

function addContact() {
    currentContactId = null;
    document.getElementById('contactModalTitle').textContent = 'إضافة جهة اتصال';
    document.getElementById('contactForm').reset();
    document.getElementById('contactModal').style.display = 'flex';
}

function editContact(contactId) {
    const contact = emergencyContacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentContactId = contactId;
    document.getElementById('contactModalTitle').textContent = 'تعديل جهة اتصال';
    
    document.getElementById('contactName').value = contact.name;
    document.getElementById('contactPhone').value = contact.phone;
    document.getElementById('contactEmail').value = contact.email || '';
    document.getElementById('contactType').value = contact.type;
    
    document.getElementById('contactModal').style.display = 'flex';
}

async function deleteContact(contactId) {
    if (!confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) return;
    
    try {
        const data = await api.deleteEmergencyContact(contactId);
        
        if (data.success) {
            showNotification('تم الحذف', 'تم حذف جهة الاتصال بنجاح', 'success');
            loadEmergencyContacts();
        } else {
            showMessage('فشل في حذف جهة الاتصال', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف جهة الاتصال:', error);
        showMessage('حدث خطأ أثناء الحذف', 'error');
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const contactData = {
        name: document.getElementById('contactName').value,
        phone: document.getElementById('contactPhone').value,
        email: document.getElementById('contactEmail').value,
        type: document.getElementById('contactType').value
    };
    
    try {
        let data;
        if (currentContactId) {
            data = await api.updateEmergencyContact(currentContactId, contactData);
        } else {
            data = await api.addEmergencyContact(contactData);
        }
        
        if (data.success) {
            const action = currentContactId ? 'تحديث' : 'إضافة';
            showNotification(`تم ${action}`, `تم ${action} جهة الاتصال بنجاح`, 'success');
            closeContactModal();
            loadEmergencyContacts();
        } else {
            showMessage(data.message || 'فشل في حفظ جهة الاتصال', 'error');
        }
    } catch (error) {
        console.error('خطأ في حفظ جهة الاتصال:', error);
        showMessage('حدث خطأ أثناء حفظ جهة الاتصال', 'error');
    }
}

function saveContact() {
    document.getElementById('contactForm').dispatchEvent(new Event('submit'));
}

function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
    currentContactId = null;
}

window.addEventListener('click', function(e) {
    const modal = document.getElementById('contactModal');
    if (e.target === modal) {
        closeContactModal();
    }
});

window.switchTab = switchTab;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.addContact = addContact;
window.editContact = editContact;
window.deleteContact = deleteContact;
window.saveContact = saveContact;
window.closeContactModal = closeContactModal;

