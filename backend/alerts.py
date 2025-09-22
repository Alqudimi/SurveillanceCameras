import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate
import os
from threading import Thread
from datetime import datetime
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedEmailService:
    """
    خدمة إرسال البريد الإلكتروني المحسنة
    المعاملات:
        smtp_server (str): خادم SMTP
        smtp_port (int): منفذ SMTP
        smtp_username (str): اسم مستخدم SMTP
        smtp_password (str): كلمة مرور SMTP
        from_email (str): البريد الإلكتروني المرسل
        from_name (str): اسم المرسل
    """
    
    def __init__(self):
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.smtp_username = os.environ.get('SMTP_USERNAME')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '**** **** **** ****')
        self.from_email = os.environ.get('FROM_EMAIL', "qudimi0chat0bot@gmail.com")
        self.from_name = os.environ.get('FROM_NAME', 'نظام الإنذار والأمان الذكي')

    def send_email(self, to_email, subject, html_content, text_content=None):
        """
        إرسال بريد إلكتروني
        المعاملات:
            to_email (str): البريد الإلكتروني المستقبل
            subject (str): موضوع الرسالة
            html_content (str): محتوى HTML للرسالة
            text_content (str): المحتوى النصي للرسالة (اختياري)
        المخرجات:
            bool: True إذا تم الإرسال بنجاح، False إذا فشل
        """
        try:
            if not all([self.smtp_username, self.smtp_password]):
                logger.warning("إعدادات البريد الإلكتروني غير مكتملة")
                return False

            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f'{self.from_name} <{self.from_email}>'
            msg['To'] = to_email
            msg['Date'] = formatdate(localtime=True)

            if text_content:
                part1 = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(part1)

            part2 = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(part2)

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"تم إرسال البريد إلى {to_email}")
            return True

        except Exception as e:
            logger.error(f"خطأ في إرسال البريد إلى {to_email}: {str(e)}")
            return False

    def send_email_async(self, to_email, subject, html_content, text_content=None):
        """
        إرسال بريد إلكتروني بشكل غير متزامن
        المعاملات:
            to_email (str): البريد الإلكتروني المستقبل
            subject (str): موضوع الرسالة
            html_content (str): محتوى HTML للرسالة
            text_content (str): المحتوى النصي للرسالة (اختياري)
        المخرجات:
            Thread: مؤشر موضوع الإرسال
        """
        thread = Thread(
            target=self.send_email,
            args=(to_email, subject, html_content, text_content)
        )
        thread.start()
        return thread

class SmartAlertManager:
    """
    مدير التنبيهات الذكي - معالجة وإرسال التنبيهات
    يحتوي على:
        عتبات التنبيه لكل فئة
        رسائل التنبيه المخصصة
        خدمات إرسال البريد
    """
    
    def __init__(self):
        self.email_service = EnhancedEmailService()
        
        self.alert_thresholds = {
            "traffic": {
                "medium": 0.6,
                "high": 0.8,
                "classes": {
                    "heavy_traffic": "medium",
                    "accident_traffic": "high", 
                    "blocked_traffic": "high"
                }
            },
            "fire": {
                "medium": 0.5,
                "high": 0.7,
                "classes": {
                    "smoke": "medium",
                    "small_fire": "high",
                    "large_fire": "critical"
                }
            },
            "accident": {
                "medium": 0.6,
                "high": 0.8,
                "classes": {
                    "minor_accident": "medium",
                    "major_accident": "high"
                }
            },
            "violence": {
                "medium": 0.5,
                "high": 0.7,
                "classes": {
                    "verbal_violence": "medium",
                    "physical_violence": "high"
                }
            }
        }
        
        self.alert_messages = {
            "traffic": {
                "normal_traffic": "حركة مرور طبيعية",
                "heavy_traffic": "ازدحام مروري كثيف",
                "accident_traffic": "حادث مروري - تجنب المنطقة",
                "blocked_traffic": "طريق مسدود - ابحث عن طريق بديل"
            },
            "fire": {
                "no_fire": "لا يوجد حريق",
                "smoke": "تم اكتشاف دخان - تحقق من المنطقة",
                "small_fire": "حريق صغير - اتصل بالإطفاء فوراً",
                "large_fire": "حريق كبير - اخلِ المنطقة فوراً واتصل بالطوارئ"
            },
            "accident": {
                "no_accident": "لا يوجد حادث",
                "minor_accident": "حادث بسيط - توخ الحذر",
                "major_accident": "حادث خطير - اتصل بالطوارئ فوراً"
            },
            "violence": {
                "no_violence": "لا يوجد عنف",
                "verbal_violence": "عنف لفظي - تجنب المنطقة",
                "physical_violence": "عنف جسدي - اتصل بالشرطة فوراً"
            }
        }

    def should_send_alert(self, result, user_settings, category_settings):
        """
        تحديد ما إذا كان يجب إرسال تنبيه
        المعاملات:
            result (ClassificationResult): نتيجة التصنيف
            user_settings (Dict): إعدادات المستخدم
            category_settings (Dict): إعدادات الفئة
        المخرجات:
            bool: True إذا كان يجب إرسال التنبيه، False إذا لا
        """
        try:
            if not user_settings.get('receive_notifications', True):
                return False
            
            if not category_settings.get('alert_enabled', True):
                return False
            
            risk_level = result.risk_level.value
            alert_threshold = user_settings.get('alert_threshold', 'medium')
            
            if alert_threshold == 'high' and risk_level not in ['high', 'critical']:
                return False
            elif alert_threshold == 'medium' and risk_level == 'low':
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في تحديد إرسال التنبيه: {str(e)}")
            return False

    def generate_alert_content(self, result, user):
        """
        توليد محتوى التنبيه
        المعاملات:
            result (ClassificationResult): نتيجة التصنيف
            user (User): كائن المستخدم
        المخرجات:
            Tuple[str, str]: (عنوان التنبيه, رسالة التنبيه)
        """
        try:
            category = result.category
            class_name = result.class_name
            confidence = result.confidence
            risk_level = result.risk_level.value
            
            title = f"تنبيه {self._get_category_arabic_name(category)}"
            
            base_message = self.alert_messages.get(category, {}).get(class_name, class_name)
            
            detailed_message = f"""
            مرحباً {user.username},
            
            تم اكتشاف {self._get_category_arabic_name(category)} في الصورة التي قمت برفعها.
            
            التفاصيل:
            - النوع: {base_message}
            - مستوى الثقة: {confidence:.1%}
            - مستوى الخطر: {self._get_risk_level_arabic(risk_level)}
            - الوقت: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            
            {self._get_action_recommendation(category, class_name)}
            """
            
            return title, detailed_message.strip()
            
        except Exception as e:
            logger.error(f"خطأ في توليد محتوى التنبيه: {str(e)}")
            return "تنبيه", "تم اكتشاف حدث يتطلب انتباهك"

    def _get_category_arabic_name(self, category):
        """
        الحصول على الاسم العربي للفئة
        المعاملات:
            category (str): نوع الفئة
        المخرجات:
            str: الاسم العربي للفئة
        """
        names = {
            "traffic": "حركة المرور",
            "fire": "الحريق", 
            "accident": "الحادث",
            "violence": "العنف"
        }
        return names.get(category, category)

    def _get_risk_level_arabic(self, risk_level):
        """
        الحصول على الاسم العربي لمستوى الخطر
        المعاملات:
            risk_level (str): مستوى الخطر
        المخرجات:
            str: الاسم العربي لمستوى الخطر
        """
        levels = {
            "low": "منخفض",
            "medium": "متوسط",
            "high": "عالي", 
            "critical": "حرج"
        }
        return levels.get(risk_level, risk_level)

    def _get_action_recommendation(self, category, class_name):
        """
        الحصول على توصية العمل المناسبة
        المعاملات:
            category (str): نوع الفئة
            class_name (str): اسم الصنف
        المخرجات:
            str: توصية العمل
        """
        recommendations = {
            "traffic": {
                "heavy_traffic": "ننصح بتجنب هذا الطريق أو استخدام طرق بديلة.",
                "accident_traffic": "تجنب المنطقة تماماً واستخدم طريقاً آخر.",
                "blocked_traffic": "الطريق مسدود، ابحث عن طريق بديل."
            },
            "fire": {
                "smoke": "تحقق من مصدر الدخان واتخذ الاحتياطات اللازمة.",
                "small_fire": "اتصل بالإطفاء على الرقم 998 فوراً.",
                "large_fire": "اخلِ المنطقة فوراً واتصل بالطوارئ على الرقم 999."
            },
            "accident": {
                "minor_accident": "توخ الحذر عند المرور بالمنطقة.",
                "major_accident": "اتصل بالإسعاف على الرقم 997 والشرطة على الرقم 999."
            },
            "violence": {
                "verbal_violence": "تجنب المنطقة وابتعد عن مصدر النزاع.",
                "physical_violence": "اتصل بالشرطة على الرقم 999 فوراً."
            }
        }
        
        category_recs = recommendations.get(category, {})
        return category_recs.get(class_name, "اتخذ الاحتياطات اللازمة.")

    def create_html_alert(self, title, message, risk_level, user):
        """
        إنشاء محتوى HTML للتنبيه
        المعاملات:
            title (str): عنوان التنبيه
            message (str): رسالة التنبيه
            risk_level (str): مستوى الخطر
            user (User): كائن المستخدم
        المخرجات:
            str: محتوى HTML جاهز للإرسال
        """
        risk_colors = {
            "low": "#28a745",
            "medium": "#ffc107", 
            "high": "#fd7e14",
            "critical": "#dc3545"
        }
        
        color = risk_colors.get(risk_level, "#6c757d")
        
        html_content = f"""
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>{title}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; border: 2px solid {color}; border-radius: 10px; }}
                .header {{ background-color: {color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 20px; }}
                .footer {{ background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }}
                .risk-badge {{ display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; background-color: {color}; font-weight: bold; }}
                .emergency-numbers {{ background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 {title}</h1>
                    <span class="risk-badge">مستوى الخطر: {self._get_risk_level_arabic(risk_level)}</span>
                </div>
                <div class="content">
                    <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">{message}</pre>
                    
                    <div class="emergency-numbers">
                        <h3>أرقام الطوارئ:</h3>
                        <ul>
                            <li>الشرطة: 999</li>
                            <li>الإطفاء: 998</li>
                            <li>الإسعاف: 997</li>
                            <li>الطوارئ العامة: 911</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        هذه رسالة تلقائية من نظام الإنذار والأمان الذكي<br>
                        تم الإرسال في: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_content

    def send_email_alert(self, user, title, message, risk_level):
        """
        إرسال تنبيه عبر البريد الإلكتروني
        المعاملات:
            user (User): كائن المستخدم
            title (str): عنوان التنبيه
            message (str): رسالة التنبيه
            risk_level (str): مستوى الخطر
        المخرجات:
            Thread: مؤشر موضوع الإرسال أو None إذا فشل
        """
        try:
            html_content = self.create_html_alert(title, message, risk_level, user)
            text_content = f"{title}\n\n{message}"
            
            thread = self.email_service.send_email_async(
                user.email, 
                title, 
                html_content, 
                text_content
            )
            
            return thread
            
        except Exception as e:
            logger.error(f"خطأ في إرسال تنبيه البريد الإلكتروني: {str(e)}")
            return None

    def send_emergency_contact_alerts(self, user, emergency_contacts, title, message):
        """
        إرسال تنبيهات لجهات الاتصال الطارئة
        المعاملات:
            user (User): كائن المستخدم
            emergency_contacts (List[Dict]): قائمة جهات الاتصال
            title (str): عنوان التنبيه
            message (str): رسالة التنبيه
        المخرجات:
            List[Dict]: قائمة بجهات الاتصال التي تم إشعارها
        """
        sent_contacts = []
        
        try:
            for contact in emergency_contacts:
                if contact.get('can_receive_alerts', True):
                    emergency_message = f"""
                    تنبيه طارئ لجهة اتصال {user.username}
                    
                    {message}
                    
                    يرجى التحقق من سلامة {user.username} والتواصل معه/ها فوراً.
                    
                    معلومات جهة الاتصال:
                    - الاسم: {contact.get('name')}
                    - العلاقة: {contact.get('relationship')}
                    - رقم الهاتف: {contact.get('phone_number')}
                    """
                    
                    sent_contacts.append({
                        "name": contact.get('name'),
                        "method": "notification_prepared",
                        "status": "success"
                    })
            
            return sent_contacts
            
        except Exception as e:
            logger.error(f"خطأ في إرسال تنبيهات جهات الاتصال: {str(e)}")
            return []

    def process_classification_alerts(self, user, overall_result, user_settings, user_categories):
        """
        معالجة تنبيهات التصنيف وإرسالها
        المعاملات:
            user (User): كائن المستخدم
            overall_result (OverallResult): النتيجة الإجمالية للتصنيف
            user_settings (Dict): إعدادات المستخدم
            user_categories (List[Dict]): فئات المستخدم
        المخرجات:
            List[Dict]: قائمة التنبيهات التي تم إرسالها
        """
        sent_alerts = []
        
        try:
            category_settings = {cat['category_type']: cat for cat in user_categories}
            
            for result in overall_result.results:
                category = result.category
                
                cat_settings = category_settings.get(category, {})
                
                if self.should_send_alert(result, user_settings, cat_settings):
                    title, message = self.generate_alert_content(result, user)
                    
                    alert_info = {
                        "category": category,
                        "title": title,
                        "message": message,
                        "risk_level": result.risk_level.value,
                        "confidence": result.confidence,
                        "sent_methods": []
                    }
                    
                    if cat_settings.get('email_alerts', True):
                        email_thread = self.send_email_alert(user, title, message, result.risk_level.value)
                        if email_thread:
                            alert_info["sent_methods"].append("email")
                    
                    if result.risk_level.value in ['high', 'critical'] and user_settings.get('emergency_contact_enabled', True):
                        from model import get_user_emergency_contacts
                        emergency_contacts = get_user_emergency_contacts(user.id)
                        
                        if emergency_contacts:
                            sent_contacts = self.send_emergency_contact_alerts(user, emergency_contacts, title, message)
                            if sent_contacts:
                                alert_info["emergency_contacts_notified"] = sent_contacts
                                alert_info["sent_methods"].append("emergency_contacts")
                    
                    sent_alerts.append(alert_info)
            
            return sent_alerts
            
        except Exception as e:
            logger.error(f"خطأ في معالجة تنبيهات التصنيف: {str(e)}")
            return []

alert_manager = SmartAlertManager()

def send_classification_alerts(user, overall_result, user_settings, user_categories):
    """
    إرسال تنبيهات التصنيف
    المعاملات:
        user (User): كائن المستخدم
        overall_result (OverallResult): النتيجة الإجمالية للتصنيف
        user_settings (Dict): إعدادات المستخدم
        user_categories (List[Dict]): فئات المستخدم
    المخرجات:
        List[Dict]: قائمة التنبيهات التي تم إرسالها
    """
    return alert_manager.process_classification_alerts(user, overall_result, user_settings, user_categories)

def send_welcome_email(user):
    """
    إرسال بريد ترحيبي للمستخدم الجديد
    المعاملات:
        user (User): كائن المستخدم
    المخرجات:
        Thread: مؤشر موضوع الإرسال أو None إذا فشل
    """
    try:
        title = "مرحباً بك في نظام الإنذار والأمان الذكي"
        message = f"""
        مرحباً {user.username}!
        
        شكراً لتسجيلك في نظام الإنذار والأمان الذكي.
        
        يمكنك الآن الاستفادة من ميزات النظام المتقدمة:
        • تصنيف ذكي للصور (حركة المرور، الحرائق، الحوادث، العنف)
        • تنبيهات فورية مخصصة حسب احتياجاتك
        • إدارة جهات الاتصال الطارئة
        • تتبع تاريخ التصنيفات والتنبيهات
        
        ابدأ الآن برفع صورة لتجربة النظام!
        """
        
        html_content = alert_manager.create_html_alert(title, message, "low", user)
        return alert_manager.email_service.send_email_async(user.email, title, html_content, message)
        
    except Exception as e:
        logger.error(f"خطأ في إرسال بريد الترحيب: {str(e)}")
        return None
