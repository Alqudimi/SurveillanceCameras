document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
});

function initializeAuthPage() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        setupLoginForm();
    }
    
    if (registerForm) {
        setupRegisterForm();
    }
    
    setupPasswordValidation();
}

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    
    form.addEventListener('submit', handleLogin);
    
    emailInput.addEventListener('blur', validateEmailField);
    passwordInput.addEventListener('input', debounce(validatePasswordField, 300));
    
    const socialButtons = document.querySelectorAll('.btn-social');
    socialButtons.forEach(button => {
        button.addEventListener('click', handleSocialLogin);
    });
}

function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');
    
    form.addEventListener('submit', handleRegister);
    
    usernameInput.addEventListener('blur', validateUsernameField);
    emailInput.addEventListener('blur', validateEmailField);
    passwordInput.addEventListener('input', debounce(handlePasswordInput, 300));
    confirmPasswordInput.addEventListener('input', debounce(validateConfirmPasswordField, 300));
    termsCheckbox.addEventListener('change', validateTermsField);
}

function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    setButtonLoading(loginBtn, true);
    clearFormErrors();
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                remember: remember
            })
        });
        const datares = {
                email: email,
                password: password,
                remember: remember
            };
        const data = await api.login(datares);
        
        if (data.success) {
            localStorage.setItem('authToken', data.access_token);
            if (remember) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            showMessage('تم تسجيل الدخول بنجاح', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showMessage(data.message || 'فشل في تسجيل الدخول', 'error');
            if (data.errors) {
                displayFormErrors(data.errors);
            }
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showMessage('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
        setButtonLoading(loginBtn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    const newsletter = document.getElementById('newsletter').checked;
    const registerBtn = document.getElementById('registerBtn');
    
    if (!validateRegisterForm(username, email, password, confirmPassword, terms)) {
        return;
    }
    
    setButtonLoading(registerBtn, true);
    clearFormErrors();
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                newsletter: newsletter
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('تم إنشاء الحساب بنجاح', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(data.message || 'فشل في إنشاء الحساب', 'error');
            if (data.errors) {
                displayFormErrors(data.errors);
            }
        }
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        showMessage('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
        setButtonLoading(registerBtn, false);
    }
}

function validateLoginForm(email, password) {
    let isValid = true;
    
    if (!email) {
        showFieldError('emailError', 'البريد الإلكتروني مطلوب');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('emailError', 'البريد الإلكتروني غير صحيح');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('passwordError', 'كلمة المرور مطلوبة');
        isValid = false;
    }
    
    return isValid;
}

function validateRegisterForm(username, email, password, confirmPassword, terms) {
    let isValid = true;
    
    if (!username) {
        showFieldError('usernameError', 'اسم المستخدم مطلوب');
        isValid = false;
    } else if (username.length < 3) {
        showFieldError('usernameError', 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        isValid = false;
    }
    
    if (!email) {
        showFieldError('emailError', 'البريد الإلكتروني مطلوب');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('emailError', 'البريد الإلكتروني غير صحيح');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('passwordError', 'كلمة المرور مطلوبة');
        isValid = false;
    } else {
        const validation = validatePassword(password);
        if (!validation.length) {
            showFieldError('passwordError', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            isValid = false;
        }
    }
    
    if (!confirmPassword) {
        showFieldError('confirmPasswordError', 'تأكيد كلمة المرور مطلوب');
        isValid = false;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPasswordError', 'كلمات المرور غير متطابقة');
        isValid = false;
    }
    
    if (!terms) {
        showFieldError('termsError', 'يجب الموافقة على شروط الاستخدام');
        isValid = false;
    }
    
    return isValid;
}

function validateEmailField() {
    const email = this.value;
    const errorElement = document.getElementById('emailError');
    
    if (!email) {
        showFieldError('emailError', 'البريد الإلكتروني مطلوب');
        return false;
    } else if (!validateEmail(email)) {
        showFieldError('emailError', 'البريد الإلكتروني غير صحيح');
        return false;
    } else {
        hideFieldError('emailError');
        return true;
    }
}

function validateUsernameField() {
    const username = this.value;
    
    if (!username) {
        showFieldError('usernameError', 'اسم المستخدم مطلوب');
        return false;
    } else if (username.length < 3) {
        showFieldError('usernameError', 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        return false;
    } else {
        hideFieldError('usernameError');
        checkUsernameAvailability(username);
        return true;
    }
}

function validatePasswordField() {
    const password = this.value;
    
    if (!password) {
        showFieldError('passwordError', 'كلمة المرور مطلوبة');
        return false;
    } else {
        const validation = validatePassword(password);
        if (!validation.length) {
            showFieldError('passwordError', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return false;
        } else {
            hideFieldError('passwordError');
            return true;
        }
    }
}

function validateConfirmPasswordField() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (!confirmPassword) {
        showFieldError('confirmPasswordError', 'تأكيد كلمة المرور مطلوب');
        return false;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPasswordError', 'كلمات المرور غير متطابقة');
        return false;
    } else {
        hideFieldError('confirmPasswordError');
        return true;
    }
}

function validateTermsField() {
    const terms = this.checked;
    
    if (!terms) {
        showFieldError('termsError', 'يجب الموافقة على شروط الاستخدام');
        return false;
    } else {
        hideFieldError('termsError');
        return true;
    }
}

function handlePasswordInput() {
    const password = this.value;
    updatePasswordStrength(password);
    validatePasswordField.call(this);
    
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput && confirmPasswordInput.value) {
        validateConfirmPasswordField.call(confirmPasswordInput);
    }
}

async function checkUsernameAvailability(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/check-username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username })
        });
        
        const data = await response.json();
        
        if (!data.available) {
            showFieldError('usernameError', 'اسم المستخدم غير متاح');
        }
    } catch (error) {
        console.error('خطأ في فحص اسم المستخدم:', error);
    }
}

function handleSocialLogin(e) {
    e.preventDefault();
    const provider = this.classList.contains('btn-google') ? 'google' : 'facebook';
    
    showMessage(`جاري تسجيل الدخول عبر ${provider === 'google' ? 'Google' : 'Facebook'}...`, 'info');
    
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        const inputElement = errorElement.previousElementSibling;
        if (inputElement && inputElement.classList.contains('input-group')) {
            inputElement.style.borderColor = 'var(--danger-color)';
        }
    }
}

function hideFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.style.display = 'none';
        
        const inputElement = errorElement.previousElementSibling;
        if (inputElement && inputElement.classList.contains('input-group')) {
            inputElement.style.borderColor = 'var(--gray-200)';
        }
    }
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });
    
    const inputGroups = document.querySelectorAll('.input-group');
    inputGroups.forEach(group => {
        group.style.borderColor = 'var(--gray-200)';
    });
}

function displayFormErrors(errors) {
    Object.keys(errors).forEach(field => {
        const errorId = field + 'Error';
        showFieldError(errorId, errors[field]);
    });
}

function handleForgotPassword() {
    const email = document.getElementById('email').value;
    
    if (!email) {
        showMessage('الرجاء إدخال البريد الإلكتروني أولاً', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('البريد الإلكتروني غير صحيح', 'error');
        return;
    }
    
    fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
        } else {
            showMessage(data.message || 'فشل في إرسال رابط إعادة التعيين', 'error');
        }
    })
    .catch(error => {
        console.error('خطأ في إرسال رابط إعادة التعيين:', error);
        showMessage('حدث خطأ في الاتصال بالخادم', 'error');
    });
}

const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        handleForgotPassword();
    });
}

