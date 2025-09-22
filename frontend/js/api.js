class ApiClient {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        console.log('Request Options:', this.token);
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers,
                ...(this.token ? { Authorization: `Bearer ${this.token}` ,"Origin":"http://alqudimi.com"} : {})
            },
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                //this.setToken(null);
                return;
            }

            const data = await response.json();
            return { response, data };
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async put(endpoint, body, options = {headers:this.token ? { 'Authorization': `Bearer ${this.token}` } : {}}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async delete(endpoint, options = {headers:this.token ? { 'Authorization': `Bearer ${this.token}` } : {}}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('image', file);
        console.log('تم إضافة الملف إلى FormData:', file.name);
        console.log('حجم الملف:', file.size, 'bytes');
        console.log('نوع الملف:', file.type);
        const arrayBuffer = await selectedFile.arrayBuffer();
        // طريقة لعرض محتوى FormData
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        return this.request(endpoint, {
            method: 'POST',
            body: file,
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` ,'Content-Type': 'application/octet-stream','X-File-Name': file.name} : {}
        });
    }

    async register(userData) {
        const  data  = await this.post('/register', userData, { auth: false });
        return data;
    }

    async login(credentials) {
        const { data } = await this.post('/login', credentials, { auth: false });
        if (data.success && data.access_token) {
            this.setToken(data.access_token);
            localStorage.setItem('authToken',data.token);
            localStorage.setItem('user_id',data.user.id);
            localStorage.setItem('user',data.user);
        }
        return data;
    }

    async logout() {
        try {
            await this.post('/logout', {});
        } finally {
            this.setToken(null);
        }
    }

    async validateToken() {
        const { data } = await this.get('/validate-token');
        return data;
    }

    async getUserInfo() {
        const { data } = await this.get('/user-info');
        return data;
    }

    async updateUserInfo(userInfo) {
        const { data } = await this.put('/user-info', userInfo);
        return data;
    }

    async getDashboardData() {
        const { data } = await this.get('/dashboard-data');
        return data;
    }

    async getChartData(period = 'today') {
        const { data } = await this.get(`/chart-data?period=${period}`);
        return data;
    }

    async getRecentClassifications(limit = 10) {
        const { data } = await this.get(`/recent-classifications?limit=${limit}`);
        return data;
    }

    async classifyImage(file, options = {}) {
        const additionalData = {
            save_result: options.saveResult !== false,
            send_alerts: options.sendAlerts !== false
        };
        
        const { data } = await this.uploadFile('/classify-image', file, additionalData);
        console.log("data",data);
        return data;
    }

    async getClassificationHistory(page = 1, limit = 20, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        
        const { data } = await this.get(`/classification-history?${params}`);
        return data;
    }

    async getClassificationDetails(id) {
        const { data } = await this.get(`/classification/${id}`);
        return data;
    }

    async deleteClassification(id) {
        const { data } = await this.delete(`/classification/${id}`);
        return data;
    }

    async getNotifications(unreadOnly = false) {
        const params = unreadOnly ? '?unread_only=true' : '';
        const { data } = await this.get(`/notifications${params}`);
        return data;
    }

    async markNotificationRead(id) {
        const { data } = await this.put(`/notifications/${id}/read`, {});
        return data;
    }

    async markAllNotificationsRead() {
        const { data } = await this.put('/notifications/mark-all-read', {});
        return data;
    }

    async getUserSettings() {
        const { data } = await this.get('/user-settings');
        return data;
    }

    async updateUserSettings(settings) {
        const { data } = await this.put('/user-settings', settings);
        return data;
    }

    async getEmergencyContacts() {
        const { data } = await this.get('/emergency-contacts');
        return data;
    }

    async addEmergencyContact(contact) {
        const { data } = await this.post('/emergency-contacts', contact);
        return data;
    }

    async updateEmergencyContact(id, contact) {
        const { data } = await this.put(`/emergency-contacts/${id}`, contact);
        return data;
    }

    async deleteEmergencyContact(id) {
        const { data } = await this.delete(`/emergency-contacts/${id}`);
        return data;
    }

    async getUserActivity(page = 1, limit = 20) {
        const { data } = await this.get(`/user-activity?page=${page}&limit=${limit}`);
        return data;
    }

    async exportData(format = 'csv') {
        const response = await fetch(`${this.baseUrl}/export-data?format=${format}`, {
            headers: this.getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('فشل في تصدير البيانات');
        }
        
        return response.blob();
    }

    async getSystemInfo() {
        const { data } = await this.get('/system-info');
        return data;
    }

    async checkHealth() {
        const { data } = await this.get('/health', { auth: false });
        return data;
    }

    async checkUsernameAvailability(username) {
        const { data } = await this.post('/check-username', { username }, { auth: false });
        return data;
    }

    async resetPassword(email) {
        const { data } = await this.post('/forgot-password', { email }, { auth: false });
        return data;
    }

    async changePassword(currentPassword, newPassword) {
        const { data } = await this.put('/change-password', {
            current_password: currentPassword,
            new_password: newPassword
        });
        return data;
    }

    async updateLocation(latitude, longitude) {
        const { data } = await this.put('/user-location', {
            latitude,
            longitude
        });
        return data;
    }

    async getAlertHistory(page = 1, limit = 20) {
        const { data } = await this.get(`/alert-history?page=${page}&limit=${limit}`);
        return data;
    }

    async testAlert(type = 'test') {
        const { data } = await this.post('/test-alert', { type });
        return data;
    }
}

const api = new ApiClient();

if (typeof window !== 'undefined') {
    window.api = api;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}

