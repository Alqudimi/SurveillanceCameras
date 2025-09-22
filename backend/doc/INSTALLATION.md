# دليل التثبيت والنشر - نظام الإنذار والأمان الذكي

## 📋 المتطلبات الأساسية

### متطلبات النظام
- Python 3.11 أو أحدث
- pip (مدير حزم Python)
- 4GB RAM كحد أدنى
- 10GB مساحة تخزين فارغة
- اتصال إنترنت مستقر

### متطلبات اختيارية
- Docker و Docker Compose (للنشر بالحاويات)
- PostgreSQL (لقاعدة بيانات أكثر قوة)
- Redis (للتخزين المؤقت)
- Nginx (كproxy عكسي)

## 🚀 التثبيت السريع

### 1. تحميل المشروع
```bash
# استنساخ المشروع أو تحميل الملفات
cd smart-security-system
```

### 2. إعداد البيئة الافتراضية
```bash
# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة الافتراضية
# على Linux/Mac:
source venv/bin/activate
# على Windows:
venv\Scripts\activate
```

### 3. تثبيت المتطلبات
```bash
pip install -r requirements.txt
```

### 4. إعداد متغيرات البيئة
```bash
# نسخ ملف الإعدادات النموذجي
cp .env.example .env

# تعديل الإعدادات حسب احتياجاتك
nano .env
```

### 5. تشغيل النظام
```bash
# تشغيل مع الاختبارات
python run.py test

# تشغيل الخادم
python run.py
```

## 🔧 الإعداد المتقدم

### إعداد قاعدة البيانات

#### SQLite (افتراضي)
```bash
# لا يتطلب إعداد إضافي
DATABASE_URL=sqlite:///enhanced_security_system.db
```

#### PostgreSQL
```bash
# تثبيت PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# إنشاء قاعدة بيانات
sudo -u postgres createdb smart_security

# تحديث .env
DATABASE_URL=postgresql://username:password@localhost/smart_security
```

### إعداد البريد الإلكتروني

#### Gmail
```bash
# في .env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # كلمة مرور التطبيق
FROM_EMAIL=your-email@gmail.com
```

#### خوادم أخرى
```bash
# Outlook
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587

# Yahoo
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
```

## 🐳 النشر باستخدام Docker

### النشر البسيط
```bash
# بناء الصورة
docker build -t smart-security-system .

# تشغيل الحاوية
docker run -d \
  --name smart-security \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  smart-security-system
```

### النشر باستخدام Docker Compose
```bash
# تشغيل النظام الكامل
docker-compose up -d

# تشغيل مع PostgreSQL
docker-compose --profile postgres up -d

# تشغيل مع جميع الخدمات
docker-compose --profile postgres --profile redis --profile nginx up -d
```

## 🌐 النشر على الخوادم

### النشر على VPS

#### 1. إعداد الخادم
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Python و pip
sudo apt install python3 python3-pip python3-venv -y

# تثبيت متطلبات النظام
sudo apt install libgl1-mesa-glx libglib2.0-0 -y
```

#### 2. نقل الملفات
```bash
# باستخدام scp
scp -r smart-security-system/ user@server:/opt/

# أو باستخدام git
git clone https://github.com/your-repo/smart-security-system.git
```

#### 3. إعداد خدمة systemd
```bash
# إنشاء ملف الخدمة
sudo nano /etc/systemd/system/smart-security.service
```

محتوى الملف:
```ini
[Unit]
Description=Smart Security System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/smart-security-system
Environment=PATH=/opt/smart-security-system/venv/bin
ExecStart=/opt/smart-security-system/venv/bin/python enhanced_app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# تفعيل وبدء الخدمة
sudo systemctl enable smart-security
sudo systemctl start smart-security
sudo systemctl status smart-security
```

### النشر على Heroku
```bash
# تثبيت Heroku CLI
# إنشاء Procfile
echo "web: python enhanced_app.py" > Procfile

# إعداد git
git init
git add .
git commit -m "Initial commit"

# إنشاء تطبيق Heroku
heroku create your-app-name

# إعداد متغيرات البيئة
heroku config:set JWT_SECRET_KEY=your-secret-key
heroku config:set SMTP_USERNAME=your-email
heroku config:set SMTP_PASSWORD=your-password

# نشر التطبيق
git push heroku main
```

### النشر على AWS EC2
```bash
# إنشاء instance EC2
# الاتصال بالخادم
ssh -i your-key.pem ubuntu@your-ec2-ip

# تثبيت Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu

# نقل الملفات ونشر التطبيق
docker-compose up -d
```

## 🔒 الأمان والحماية

### إعدادات الأمان الأساسية
```bash
# تغيير كلمات المرور الافتراضية
JWT_SECRET_KEY=generate-strong-random-key
SECRET_KEY=another-strong-random-key

# تفعيل HTTPS
# استخدام Let's Encrypt
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

### جدار الحماية
```bash
# تكوين UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### النسخ الاحتياطي
```bash
# نسخ احتياطي لقاعدة البيانات
sqlite3 enhanced_security_system.db ".backup backup.db"

# نسخ احتياطي للملفات
tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ models/ logs/
```

## 📊 المراقبة والصيانة

### مراقبة الأداء
```bash
# مراقبة استخدام الموارد
htop

# مراقبة السجلات
tail -f logs/app.log

# فحص صحة النظام
curl http://localhost:5000/health
```

### الصيانة الدورية
```bash
# تنظيف السجلات القديمة
find logs/ -name "*.log" -mtime +30 -delete

# تحديث المتطلبات
pip install -r requirements.txt --upgrade

# إعادة تشغيل الخدمة
sudo systemctl restart smart-security
```

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

#### خطأ في تثبيت OpenCV
```bash
# حل للأنظمة المبنية على Debian/Ubuntu
sudo apt install python3-opencv
# أو
pip install opencv-python-headless
```

#### مشاكل الأذونات
```bash
# إصلاح أذونات الملفات
sudo chown -R www-data:www-data /opt/smart-security-system
sudo chmod -R 755 /opt/smart-security-system
```

#### مشاكل قاعدة البيانات
```bash
# إعادة إنشاء قاعدة البيانات
rm enhanced_security_system.db
python -c "from enhanced_app import app, db; app.app_context().push(); db.create_all()"
```

### السجلات والتشخيص
```bash
# عرض سجلات النظام
journalctl -u smart-security -f

# فحص حالة الخدمات
systemctl status smart-security
docker-compose ps
```

## 📞 الدعم والمساعدة

### الحصول على المساعدة
- مراجعة ملف README.md
- فحص السجلات للأخطاء
- تشغيل الاختبارات: `python test_system.py`
- التحقق من الإعدادات في .env

### الإبلاغ عن المشاكل
عند الإبلاغ عن مشكلة، يرجى تضمين:
- نسخة النظام
- رسالة الخطأ كاملة
- خطوات إعادة إنتاج المشكلة
- محتوى ملف .env (بدون كلمات المرور)

---

**ملاحظة**: هذا الدليل يغطي الحالات الأكثر شيوعاً. للحالات المعقدة، يُنصح بالرجوع إلى وثائق الأدوات المستخدمة.

