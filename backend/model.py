from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy import func, Index
import json

db = SQLAlchemy()

class User(db.Model):
    """
    جدول المستخدمين - تخزين معلومات المستخدمين الأساسية
    العلاقات: الإعدادات، الفئات، جهات الطوارئ، السجلات، نتائج التصنيف، التنبيهات
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    settings = db.relationship('UserSettings', backref='user', uselist=False, cascade='all, delete-orphan')
    categories = db.relationship('UserCategory', backref='user', cascade='all, delete-orphan')
    emergency_contacts = db.relationship('EmergencyContact', backref='user', cascade='all, delete-orphan')
    activity_logs = db.relationship('UserActivityLog', backref='user', cascade='all, delete-orphan')
    classification_results = db.relationship('ClassificationResult', backref='user', cascade='all, delete-orphan')
    alert_history = db.relationship('AlertHistory', backref='user', cascade='all, delete-orphan')

class UserSettings(db.Model):
    """
    إعدادات المستخدم - تخصيص تجربة المستخدم
    المعاملات:
        user_id (int): معرف المستخدم (مفتاح خارجي)
        إعدادات الإشعارات: receive_notifications, notification_sound, notification_vibration
        إعدادات الخصوصية: keep_usage_history, share_location, emergency_contact_enabled, alarm_enabled
        إعدادات الموقع: auto_detect_location, location_update_interval
        إعدادات التصنيف: auto_classification, save_classification_history, alert_threshold
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    receive_notifications = db.Column(db.Boolean, default=True)
    notification_sound = db.Column(db.Boolean, default=True)
    notification_vibration = db.Column(db.Boolean, default=True)
    
    keep_usage_history = db.Column(db.Boolean, default=True)
    share_location = db.Column(db.Boolean, default=False)
    emergency_contact_enabled = db.Column(db.Boolean, default=True)
    alarm_enabled = db.Column(db.Boolean, default=True)
    
    auto_detect_location = db.Column(db.Boolean, default=True)
    location_update_interval = db.Column(db.Integer, default=15)
    
    auto_classification = db.Column(db.Boolean, default=True)
    save_classification_history = db.Column(db.Boolean, default=True)
    alert_threshold = db.Column(db.String(20), default='medium')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserCategory(db.Model):
    """
    فئات المستخدم - تخصيص الفئات المراد مراقبتها
    المعاملات:
        user_id (int): معرف المستخدم
        category_type (str): نوع الفئة (حركة مرور، حريق، حادث، عنف)
        is_enabled (bool): حالة تفعيل الفئة
        priority_level (int): مستوى الأولوية (1-5)
        إعدادات التنبيه: alert_enabled, email_alerts, sms_alerts, push_alerts
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    category_type = db.Column(db.String(50), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True)
    priority_level = db.Column(db.Integer, default=1)
    
    alert_enabled = db.Column(db.Boolean, default=True)
    email_alerts = db.Column(db.Boolean, default=True)
    sms_alerts = db.Column(db.Boolean, default=False)
    push_alerts = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'category_type', name='unique_user_category'),
    )

class EmergencyContact(db.Model):
    """
    جهات اتصال الطوارئ - الأشخاص المطلوب إشعارهم في الحالات الحرجة
    المعاملات:
        user_id (int): معرف المستخدم
        name (str): اسم جهة الاتصال
        phone_number (str): رقم الهاتف
        relationship (str): العلاقة (عائلة، صديق، إلخ)
        is_primary (bool): هل هي جهة الاتصال الأساسية
        can_receive_alerts (bool): هل يمكنها استقبال التنبيهات
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    relationship = db.Column(db.String(50))
    is_primary = db.Column(db.Boolean, default=False)
    can_receive_alerts = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserLocation(db.Model):
    """
    مواقع المستخدم - تتبع الموقع الجغرافي للمستخدم
    المعاملات:
        user_id (int): معرف المستخدم
        latitude (float): خط العرض
        longitude (float): خط الطول
        accuracy (float): دقة الموقع بالأمتار
        timestamp (datetime): وقت تسجيل الموقع
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserActivityLog(db.Model):
    """
    سجل أنشطة المستخدم - تسجيل جميع أنشطة المستخدم
    المعاملات:
        user_id (int): معرف المستخدم
        activity_type (str): نوع النشاط
        activity_description (str): وصف النشاط
        ip_address (str): عنوان IP
        user_agent (str): معلومات المتصفح/التطبيق
        device_info (str): معلومات الجهاز
        location (str): الموقع الجغرافي
        extra_data (JSON): بيانات إضافية
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    activity_type = db.Column(db.String(100), nullable=False)
    activity_description = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    device_info = db.Column(db.String(200))
    location = db.Column(db.String(200))
    extra_data = db.Column(db.JSON)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_user_activity', 'user_id', 'activity_type'),
        db.Index('idx_activity_date', 'user_id', 'created_at'),
    )

class ClassificationResult(db.Model):
    """
    نتائج التصنيف - تخزين نتائج تحليل الصور
    المعاملات:
        user_id (int): معرف المستخدم
        image_path (str): مسار الصورة
        image_size (str): أبعاد الصورة
        file_size (int): حجم الملف
        نتائج الفئات: traffic_score, traffic_class, traffic_risk, fire_score, fire_class, fire_risk, accident_score, accident_class, accident_risk, violence_score, violence_class, violence_risk
        overall_risk_level (str): مستوى الخطر الإجمالي
        processing_time (float): وقت المعالجة
        enabled_categories (JSON): الفئات المفعلة
        detailed_results (JSON): النتائج التفصيلية
        alerts_triggered (JSON): التنبيهات المطلقة
        معلومات الموقع: location_lat, location_lng, location_address
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    image_path = db.Column(db.String(500), nullable=False)
    image_size = db.Column(db.String(50))
    file_size = db.Column(db.Integer)
    
    traffic_score = db.Column(db.Float)
    traffic_class = db.Column(db.String(50))
    traffic_risk = db.Column(db.String(20))
    
    fire_score = db.Column(db.Float)
    fire_class = db.Column(db.String(50))
    fire_risk = db.Column(db.String(20))
    
    accident_score = db.Column(db.Float)
    accident_class = db.Column(db.String(50))
    accident_risk = db.Column(db.String(20))
    
    violence_score = db.Column(db.Float)
    violence_class = db.Column(db.String(50))
    violence_risk = db.Column(db.String(20))
    
    overall_risk_level = db.Column(db.String(20), nullable=False)
    processing_time = db.Column(db.Float)
    
    enabled_categories = db.Column(db.JSON)
    detailed_results = db.Column(db.JSON)
    alerts_triggered = db.Column(db.JSON)
    
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    location_address = db.Column(db.String(500))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    alerts = db.relationship('AlertHistory', backref='classification_result', cascade='all, delete-orphan')
    
    __table_args__ = (
        db.Index('idx_user_classification', 'user_id', 'created_at'),
        db.Index('idx_risk_level', 'user_id', 'overall_risk_level'),
        db.Index('idx_classification_date', 'created_at'),
    )

class AlertHistory(db.Model):
    """
    سجل التنبيهات - تخزين جميع التنبيهات المرسلة
    المعاملات:
        user_id (int): معرف المستخدم
        classification_id (int): معرف نتيجة التصنيف
        alert_type (str): نوع التنبيه
        alert_level (str): مستوى التنبيه
        alert_title (str): عنوان التنبيه
        alert_message (str): رسالة التنبيه
        حالة الإرسال: email_sent, sms_sent, push_sent
        emergency_contacts_notified (JSON): جهات الاتصال المشعورة
        extra_data (JSON): بيانات إضافية
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    classification_id = db.Column(db.Integer, db.ForeignKey('classification_result.id', ondelete='SET NULL'))
    
    alert_type = db.Column(db.String(50), nullable=False)
    alert_level = db.Column(db.String(20), nullable=False)
    alert_title = db.Column(db.String(200), nullable=False)
    alert_message = db.Column(db.Text, nullable=False)
    
    email_sent = db.Column(db.Boolean, default=False)
    email_sent_at = db.Column(db.DateTime)
    email_error = db.Column(db.Text)
    
    sms_sent = db.Column(db.Boolean, default=False)
    sms_sent_at = db.Column(db.DateTime)
    sms_error = db.Column(db.Text)
    
    push_sent = db.Column(db.Boolean, default=False)
    push_sent_at = db.Column(db.DateTime)
    push_error = db.Column(db.Text)
    
    emergency_contacts_notified = db.Column(db.JSON)
    extra_data = db.Column(db.JSON)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_user_alerts', 'user_id', 'created_at'),
        db.Index('idx_alert_type', 'user_id', 'alert_type'),
        db.Index('idx_alert_level', 'alert_level'),
    )

def get_user_categories(user_id):
    """
    استرجاع جميع التصنيفات التي اختارها المستخدم
    المعاملات:
        user_id (int): معرف المستخدم
    المخرجات:
        List[Dict]: قائمة التصنيفات مع تفاصيلها
    """
    try:
        categories = UserCategory.query.filter_by(user_id=user_id).all()
        return [
            {
                "id": cat.id,
                "category_type": cat.category_type,
                "is_enabled": cat.is_enabled,
                "priority_level": cat.priority_level,
                "alert_enabled": cat.alert_enabled,
                "email_alerts": cat.email_alerts,
                "sms_alerts": cat.sms_alerts,
                "push_alerts": cat.push_alerts,
                "created_at": cat.created_at.isoformat(),
                "updated_at": cat.updated_at.isoformat()
            }
            for cat in categories
        ]
    except Exception as e:
        print(f"Error getting user categories: {e}")
        return []

def get_enabled_categories(user_id):
    """
    استرجاع التصنيفات المفعلة فقط
    المعاملات:
        user_id (int): معرف المستخدم
    المخرجات:
        List[str]: قائمة أنواع الفئات المفعلة
    """
    try:
        categories = UserCategory.query.filter_by(
            user_id=user_id, 
            is_enabled=True
        ).all()
        
        return [cat.category_type for cat in categories]
    except Exception as e:
        print(f"Error getting enabled categories: {e}")
        return []

def save_classification_result(user_id, image_path, overall_result):
    """
    حفظ نتيجة التصنيف في قاعدة البيانات
    المعاملات:
        user_id (int): معرف المستخدم
        image_path (str): مسار الصورة
        overall_result (OverallResult): نتيجة التصنيف
    المخرجات:
        ClassificationResult: سجل نتيجة التصنيف المحفوظ أو None في حالة الخطأ
    """
    try:
        image_info = overall_result.image_info
        
        classification = ClassificationResult(
            user_id=user_id,
            image_path=image_path,
            image_size=f"{image_info.get('size', [0,0,0])[1]}x{image_info.get('size', [0,0,0])[0]}" if 'size' in image_info else None,
            file_size=image_info.get('file_size'),
            overall_risk_level=overall_result.overall_risk.value,
            processing_time=overall_result.processing_time,
            enabled_categories=[r.category for r in overall_result.results],
            detailed_results=[{
                "category": r.category,
                "class_name": r.class_name,
                "confidence": r.confidence,
                "risk_level": r.risk_level.value,
                "details": r.details
            } for r in overall_result.results],
            alerts_triggered=overall_result.alerts_triggered
        )
        
        for result in overall_result.results:
            if result.category == "traffic":
                classification.traffic_score = result.confidence
                classification.traffic_class = result.class_name
                classification.traffic_risk = result.risk_level.value
            elif result.category == "fire":
                classification.fire_score = result.confidence
                classification.fire_class = result.class_name
                classification.fire_risk = result.risk_level.value
            elif result.category == "accident":
                classification.accident_score = result.confidence
                classification.accident_class = result.class_name
                classification.accident_risk = result.risk_level.value
            elif result.category == "violence":
                classification.violence_score = result.confidence
                classification.violence_class = result.class_name
                classification.violence_risk = result.risk_level.value
        
        db.session.add(classification)
        db.session.commit()
        
        return classification
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving classification result: {e}")
        return None

def save_alert_history(user_id, classification_id, alert_type, alert_level, title, message):
    """
    حفظ تاريخ التنبيه
    المعاملات:
        user_id (int): معرف المستخدم
        classification_id (int): معرف نتيجة التصنيف
        alert_type (str): نوع التنبيه
        alert_level (str): مستوى التنبيه
        title (str): عنوان التنبيه
        message (str): رسالة التنبيه
    المخرجات:
        AlertHistory: سجل التنبيه المحفوظ أو None في حالة الخطأ
    """
    try:
        alert = AlertHistory(
            user_id=user_id,
            classification_id=classification_id,
            alert_type=alert_type,
            alert_level=alert_level,
            alert_title=title,
            alert_message=message
        )
        
        db.session.add(alert)
        db.session.commit()
        
        return alert
        
    except Exception as e:
        db.session.rollback()
        print(f"Error saving alert history: {e}")
        return None

def get_classification_history(user_id, page=1, per_page=20, risk_level=None, category=None):
    """
    استرجاع تاريخ التصنيفات
    المعاملات:
        user_id (int): معرف المستخدم
        page (int): رقم الصفحة
        per_page (int): عدد العناصر في الصفحة
        risk_level (str): مستوى الخطر للتصفية
        category (str): الفئة للتصفية
    المخرجات:
        Dict: نتائج التصنيف مع معلومات التقسيم
    """
    try:
        query = ClassificationResult.query.filter_by(user_id=user_id)
        
        if risk_level:
            query = query.filter_by(overall_risk_level=risk_level)
        
        if category:
            query = query.filter(ClassificationResult.enabled_categories.contains([category]))
        
        results = query.order_by(ClassificationResult.created_at.desc())\
                      .paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            "results": [
                {
                    "id": r.id,
                    "image_path": r.image_path,
                    "overall_risk_level": r.overall_risk_level,
                    "processing_time": r.processing_time,
                    "enabled_categories": r.enabled_categories,
                    "alerts_triggered": r.alerts_triggered,
                    "created_at": r.created_at.isoformat(),
                    "detailed_results": r.detailed_results
                }
                for r in results.items
            ],
            "total": results.total,
            "pages": results.pages,
            "current_page": page,
            "per_page": per_page
        }
        
    except Exception as e:
        print(f"Error getting classification history: {e}")
        return {"results": [], "total": 0, "pages": 0, "current_page": page, "per_page": per_page}

def get_classification_stats(user_id):
    """
    إحصائيات التصنيف للمستخدم
    المعاملات:
        user_id (int): معرف المستخدم
    المخرجات:
        Dict: إحصائيات التصنيف أو None في حالة الخطأ
    """
    try:
        total_classifications = ClassificationResult.query.filter_by(user_id=user_id).count()
        
        risk_stats = db.session.query(
            ClassificationResult.overall_risk_level,
            func.count(ClassificationResult.id).label('count')
        ).filter_by(user_id=user_id)\
         .group_by(ClassificationResult.overall_risk_level)\
         .all()
        
        today = datetime.utcnow().date()
        today_classifications = ClassificationResult.query.filter(
            ClassificationResult.user_id == user_id,
            func.date(ClassificationResult.created_at) == today
        ).count()
        
        latest_classification = ClassificationResult.query.filter_by(user_id=user_id)\
                                                         .order_by(ClassificationResult.created_at.desc())\
                                                         .first()
        
        return {
            "total_classifications": total_classifications,
            "today_classifications": today_classifications,
            "risk_level_stats": [
                {"risk_level": stat[0], "count": stat[1]} 
                for stat in risk_stats
            ],
            "latest_classification": {
                "id": latest_classification.id,
                "overall_risk_level": latest_classification.overall_risk_level,
                "created_at": latest_classification.created_at.isoformat()
            } if latest_classification else None
        }
        
    except Exception as e:
        print(f"Error getting classification stats: {e}")
        return None

def get_user_email(user_id):
    """
    استرجاع البريد الإلكتروني للمستخدم
    المعاملات:
        user_id (int): معرف المستخدم
    المخرجات:
        str: البريد الإلكتروني أو None في حالة الخطأ
    """
    try:
        user = User.query.get(user_id)
        if user:
            return user.email
        return None
    except Exception as e:
        print(f"Error getting user email: {e}")
        return None

def get_user_emergency_contacts(user_id):
    """
    استرجاع أرقام الطوارئ التابعة للمستخدم
    المعاملات:
        user_id (int): معرف المستخدم
    المخرجات:
        List[Dict]: قائمة جهات الاتصال أو [] في حالة الخطأ
    """
    try:
        contacts = EmergencyContact.query.filter_by(user_id=user_id).all()
        return [
            {
                "id": contact.id,
                "name": contact.name,
                "phone_number": contact.phone_number,
                "relationship": contact.relationship,
                "is_primary": contact.is_primary,
                "can_receive_alerts": contact.can_receive_alerts,
                "created_at": contact.created_at.isoformat(),
                "updated_at": contact.updated_at.isoformat()
            }
            for contact in contacts
        ]
    except Exception as e:
        print(f"Error getting emergency contacts: {e}")
        return []

def get_user_notification_settings(user_id):
    """
    استرجاع إعدادات الإشعارات للمستخدم
    المعاملات:
        user_id (int): معرف المستخدم
    المخرجات:
        Dict: إعدادات الإشعارات أو None في حالة الخطأ
    """
    try:
        settings = UserSettings.query.filter_by(user_id=user_id).first()
        if settings:
            return {
                "receive_notifications": settings.receive_notifications,
                "notification_sound": settings.notification_sound,
                "notification_vibration": settings.notification_vibration,
                "emergency_contact_enabled": settings.emergency_contact_enabled,
                "alarm_enabled": settings.alarm_enabled,
                "auto_classification": settings.auto_classification,
                "save_classification_history": settings.save_classification_history,
                "alert_threshold": settings.alert_threshold
            }
        return None
    except Exception as e:
        print(f"Error getting notification settings: {e}")
        return None

def get_user_by_email(email):
    """
    استرجاع المستخدم باستخدام البريد الإلكتروني
    المعاملات:
        email (str): البريد الإلكتروني
    المخرجات:
        User: كائن المستخدم أو None في حالة الخطأ
    """
    try:
        user = User.query.filter_by(email=email).first()
        return user
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None

def get_user_by_id(user_id):
    """
    استرجاع المستخدم باستخدام المعرف
    المعاملات:
        user_id (int): معرف المستخدم
    المخرجات:
        User: كائن المستخدم أو None في حالة الخطأ
    """
    try:
        user = User.query.get(user_id)
        return user
    except Exception as e:
        print(f"Error getting user by ID: {e}")
        return None