# توثيق واجهات برمجة التطبيقات (API) لنظام الأمان الذكي

يقدم هذا المستند وصفًا شاملاً لجميع واجهات برمجة التطبيقات (APIs) المتاحة في الخادم الخلفي لنظام الأمان الذكي. يهدف هذا التوثيق إلى توفير فهم واضح لكيفية التفاعل مع النظام، بما في ذلك نقاط النهاية، طرق HTTP، المدخلات المتوقعة، والمخرجات المحتملة.

## 🔒 المصادقة

تتطلب معظم نقاط النهاية المصادقة باستخدام رمز JWT (JSON Web Token). يجب تضمين الرمز المميز في رأس `Authorization` كـ `Bearer Token`.

مثال:
`Authorization: Bearer <your_jwt_token>`

## 🌐 نقاط النهاية الأساسية

### 1. فحص صحة النظام (Health Check)

**المسار:** `/health`
**الطريقة:** `GET`
**الوصف:** يتحقق من حالة عمل النظام، بما في ذلك اتصال قاعدة البيانات وحالة مدير التصنيف.
**المصادقة:** لا يتطلب

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "classification_manager": "initialized",
  "available_categories": ["traffic", "fire", "accident", "violence"],
  "models_loaded": 4,
  "total_models": 4,
  "timestamp": "2025-09-18T10:00:00.000000"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "status": "unhealthy",
  "error": "Database connection failed",
  "timestamp": "2025-09-18T10:00:00.000000"
}
```

### 2. معلومات النظام (System Info)

**المسار:** `/system-info`
**الطريقة:** `GET`
**الوصف:** يوفر معلومات عامة حول النظام، مثل الإصدار، النماذج المدعومة، وأقصى حجم للملفات المسموح بها.
**المصادقة:** لا يتطلب

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "system_name": "نظام الإنذار والأمان الذكي",
  "version": "2.0.0",
  "models": {
    "traffic": {"loaded": true, "version": "1.0", "description": "نموذج تصنيف حركة المرور"},
    "fire": {"loaded": true, "version": "1.0", "description": "نموذج تصنيف الحرائق"},
    "accident": {"loaded": true, "version": "1.0", "description": "نموذج تصنيف الحوادث"},
    "violence": {"loaded": true, "version": "1.0", "description": "نموذج تصنيف العنف"}
  },
  "supported_categories": ["traffic", "fire", "accident", "violence"],
  "max_file_size": 33554432,
  "allowed_extensions": ["png", "jpg", "jpeg", "gif", "bmp", "tiff"],
  "features": [
    "تصنيف ذكي متعدد الفئات",
    "تنبيهات مخصصة",
    "تتبع التاريخ",
    "إدارة جهات الاتصال الطارئة"
  ]
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "error": "Failed to retrieve model info"
}
```

## 🔑 مسارات المصادقة

### 3. تسجيل مستخدم جديد (Register)

**المسار:** `/register`
**الطريقة:** `POST`
**الوصف:** يقوم بإنشاء حساب مستخدم جديد في النظام.
**المصادقة:** لا يتطلب

**المدخلات (Request Body - `application/json`):**
```json
{
  "email": "user@example.com",      // string, مطلوب, البريد الإلكتروني للمستخدم
  "password": "StrongPassword123", // string, مطلوب, كلمة المرور (8 أحرف على الأقل، حرف كبير وصغير، رقم، رمز خاص)
  "username": "newuser"            // string, مطلوب, اسم المستخدم (3 أحرف على الأقل)
}
```

**المخرجات (201 Created):**
```json
{
  "msg": "تم تسجيل المستخدم بنجاح",
  "user_id": 1,
  "default_categories_created": 4
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "البريد الإلكتروني، اسم المستخدم وكلمة المرور مطلوبان"
}
```

**المخرجات (409 Conflict):**
```json
{
  "msg": "هذا البريد الإلكتروني مسجل بالفعل"
}
// أو
{
  "msg": "اسم المستخدم هذا مسجل بالفعل"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء التسجيل"
}
```

### 4. تسجيل الدخول (Login)

**المسار:** `/login`
**الطريقة:** `POST`
**الوصف:** يقوم بمصادقة المستخدم وإرجاع رمز JWT للوصول.
**المصادقة:** لا يتطلب

**المدخلات (Request Body - `application/json`):**
```json
{
  "email": "user@example.com",      // string, مطلوب, البريد الإلكتروني للمستخدم
  "password": "StrongPassword123" // string, مطلوب, كلمة المرور
}
```

**المخرجات (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...", // string, رمز JWT للوصول
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "newuser",
    "created_at": "2025-09-18T09:30:00.000000"
  }
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "البريد الإلكتروني وكلمة المرور مطلوبان"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "بيانات الدخول غير صحيحة"
}
```

**المخرجات (403 Forbidden):**
```json
{
  "msg": "الحساب معطل"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تسجيل الدخول"
}
```

## 🖼️ مسارات التصنيف

### 5. تصنيف الصورة (Classify Image)

**المسار:** `/classify-image`
**الطريقة:** `POST`
**الوصف:** يقوم بتحليل صورة مرفوعة وتصنيفها بناءً على الفئات المدعومة (حركة مرور، حريق، حادث، عنف).
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `multipart/form-data`):**
- `image`: ملف الصورة (مطلوب). الأنواع المسموح بها: `png`, `jpg`, `jpeg`, `gif`, `bmp`, `tiff`. أقصى حجم: 32MB.

**المخرجات (200 OK):**
```json
{
  "msg": "تم تصنيف الصورة بنجاح",
  "filename": "20250918_100500_test_image.jpg",
  "file_path": "uploads/newuser/20250918_100500_test_image.jpg",
  "classification_id": "a1b2c3d4e5f6g7h8i9j0k1l2", // string, معرف التصنيف في قاعدة البيانات
  "overall_risk": "high", // string, مستوى المخاطر الكلي (low, medium, high, critical)
  "processing_time": 0.567, // float, وقت المعالجة بالثواني
  "results": [
    {
      "category": "fire",
      "class_name": "large_fire",
      "confidence": 98.5,
      "risk_level": "critical",
      "arabic_name": "الحريق"
    },
    {
      "category": "traffic",
      "class_name": "normal_traffic",
      "confidence": 10.2,
      "risk_level": "low",
      "arabic_name": "حركة المرور"
    }
  ],
  "alerts_triggered": true, // boolean, هل تم إطلاق تنبيهات
  "alerts_sent": 1, // integer, عدد التنبيهات المرسلة
  "alert_details": [
    {
      "category": "fire",
      "risk_level": "critical",
      "title": "تنبيه حريق عاجل!",
      "message": "تم اكتشاف حريق كبير بنسبة ثقة 98.5% في الصورة المرفوعة.",
      "channel": "email"
    }
  ]
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "لم يتم العثور على ملف الصورة"
}
// أو
{
  "msg": "لم يتم اختيار أي ملف"
}
// أو
{
  "msg": "نوع الملف غير مسموح به"
}
```

**المخرجات (413 Payload Too Large):**
```json
{
  "msg": "حجم الملف يتجاوز الحد المسموح (32MB)"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تصنيف الصورة: [رسالة الخطأ]"
}
```

### 6. استرجاع تاريخ التصنيفات (Get Classification History)

**المسار:** `/classification-history`
**الطريقة:** `GET`
**الوصف:** يسترجع سجل التصنيفات السابقة للمستخدم، مع إمكانية التصفية والترقيم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `page`: `integer`, رقم الصفحة (افتراضي: 1)
- `per_page`: `integer`, عدد النتائج في الصفحة (افتراضي: 20)
- `risk_level`: `string`, مستوى المخاطر للتصفية (اختياري: `low`, `medium`, `high`, `critical`)
- `category`: `string`, الفئة للتصفية (اختياري: `traffic`, `fire`, `accident`, `violence`)

**المخرجات (200 OK):**
```json
{
  "classifications": [
    {
      "id": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "filename": "image1.jpg",
      "file_path": "uploads/user/image1.jpg",
      "result": "fire",
      "confidence": 95.2,
      "overall_risk": "critical",
      "alert_sent": true,
      "created_at": "2025-09-18T09:45:00.000000"
    },
    {
      "id": "b2c3d4e5f6g7h8i9j0k1l2m3",
      "filename": "image2.png",
      "file_path": "uploads/user/image2.png",
      "result": "traffic",
      "confidence": 70.1,
      "overall_risk": "medium",
      "alert_sent": false,
      "created_at": "2025-09-18T09:40:00.000000"
    }
  ],
  "pagination": {
    "total": 100,
    "total_pages": 5,
    "current_page": 1,
    "per_page": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء استرجاع التاريخ"
}
```

### 7. إحصائيات التصنيف للمستخدم (Get User Classification Stats)

**المسار:** `/classification-stats`
**الطريقة:** `GET`
**الوصف:** يوفر إحصائيات مجمعة حول تصنيفات المستخدم، مثل إجمالي التصنيفات، متوسط الدقة، وما إلى ذلك.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "total_classifications": 150,
  "today_classifications": 15,
  "alerts_generated": 25,
  "avg_accuracy": 88.5,
  "category_distribution": [
    {"category": "fire", "count": 20, "percentage": 13.3},
    {"category": "traffic", "count": 60, "percentage": 40.0},
    {"category": "accident", "count": 30, "percentage": 20.0},
    {"category": "violence", "count": 10, "percentage": 6.7},
    {"category": "normal", "count": 30, "percentage": 20.0}
  ]
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
// أو
{
  "msg": "لا توجد إحصائيات متاحة"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء جلب الإحصائيات"
}
```

## ⚙️ مسارات الإعدادات

### 8. إدارة إعدادات المستخدم (User Settings)

**المسار:** `/user/settings`
**الطريقة:** `GET`, `PUT`
**الوصف:** استرجاع أو تحديث إعدادات التنبيهات والتفضيلات العامة للمستخدم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (GET):**
- لا يوجد

**المخرجات (GET - 200 OK):**
```json
{
  "id": 1,
  "user_id": 1,
  "email_notifications": true,
  "sms_notifications": false,
  "browser_notifications": true,
  "sound_notifications": true,
  "save_classification_history": true,
  "auto_delete_after_days": 30,
  "dark_mode": false,
  "language": "ar",
  "created_at": "2025-09-18T09:30:00.000000",
  "updated_at": "2025-09-18T10:15:00.000000"
}
```

**المدخلات (PUT - Request Body - `application/json`):**
```json
{
  "email_notifications": true, // boolean, تفعيل/تعطيل تنبيهات البريد الإلكتروني
  "sms_notifications": false,  // boolean, تفعيل/تعطيل تنبيهات الرسائل النصية
  "browser_notifications": true, // boolean, تفعيل/تعطيل تنبيهات المتصفح
  "sound_notifications": true, // boolean, تفعيل/تعطيل التنبيهات الصوتية
  "save_classification_history": true, // boolean, حفظ سجل التصنيفات
  "auto_delete_after_days": 30, // integer, عدد الأيام لحذف السجل تلقائياً
  "dark_mode": false,          // boolean, تفعيل/تعطيل الوضع المظلم
  "language": "ar"             // string, لغة الواجهة (مثل "ar", "en")
}
```

**المخرجات (PUT - 200 OK):**
```json
{
  "msg": "تم تحديث الإعدادات بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء معالجة الإعدادات"
}
```

### 9. إدارة فئات المستخدم (User Categories)

**المسار:** `/user/categories`
**الطريقة:** `GET`, `POST`, `PUT`
**الوصف:** استرجاع، إضافة، أو تحديث الفئات التي يهتم بها المستخدم وإعدادات التنبيه لكل فئة.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (GET):**
- لا يوجد

**المخرجات (GET - 200 OK):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "category_type": "traffic",
    "is_enabled": true,
    "priority_level": 3,
    "alert_enabled": true,
    "email_alerts": true,
    "sms_alerts": false,
    "push_alerts": true,
    "created_at": "2025-09-18T09:30:00.000000",
    "updated_at": "2025-09-18T09:30:00.000000"
  },
  // ... فئات أخرى
]
```

**المدخلات (POST - Request Body - `application/json`):**
```json
{
  "category_type": "fire",      // string, مطلوب, نوع الفئة (traffic, fire, accident, violence)
  "is_enabled": true,           // boolean, تفعيل/تعطيل الفئة (افتراضي: true)
  "priority_level": 5,          // integer, مستوى الأولوية (1-5، افتراضي: 3)
  "alert_enabled": true,        // boolean, تفعيل/تعطيل التنبيهات لهذه الفئة (افتراضي: true)
  "email_alerts": true,         // boolean, تفعيل/تعطيل تنبيهات البريد الإلكتروني لهذه الفئة (افتراضي: true)
  "sms_alerts": false,          // boolean, تفعيل/تعطيل تنبيهات الرسائل النصية لهذه الفئة (افتراضي: false)
  "push_alerts": true           // boolean, تفعيل/تعطيل تنبيهات الدفع لهذه الفئة (افتراضي: true)
}
```

**المخرجات (POST - 201 Created):**
```json
{
  "msg": "تم إضافة الفئة بنجاح"
}
```

**المخرجات (POST - 400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "نوع الفئة غير صحيح"
}
```

**المخرجات (POST - 409 Conflict):**
```json
{
  "msg": "هذه الفئة موجودة بالفعل"
}
```

**المدخلات (PUT - Request Body - `application/json`):**
```json
{
  "id": 1,                      // integer, مطلوب, معرف الفئة المراد تحديثها
  "is_enabled": false,          // boolean, تفعيل/تعطيل الفئة
  "priority_level": 2,          // integer, مستوى الأولوية
  "alert_enabled": false,       // boolean, تفعيل/تعطيل التنبيهات لهذه الفئة
  "email_alerts": false,        // boolean, تفعيل/تعطيل تنبيهات البريد الإلكتروني لهذه الفئة
  "sms_alerts": true,           // boolean, تفعيل/تعطيل تنبيهات الرسائل النصية لهذه الفئة
  "push_alerts": false          // boolean, تفعيل/تعطيل تنبيهات الدفع لهذه الفئة
}
```

**المخرجات (PUT - 200 OK):**
```json
{
  "msg": "تم تحديث الفئة بنجاح"
}
```

**المخرجات (PUT - 400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "معرف الفئة مطلوب"
}
```

**المخرجات (PUT - 404 Not Found):**
```json
{
  "msg": "الفئة غير موجودة"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء معالجة الفئات"
}
```

## 🚨 مسارات التنبيهات

### 10. استرجاع سجل التنبيهات (Get Alert History)

**المسار:** `/alerts/history`
**الطريقة:** `GET`
**الوصف:** يسترجع سجل التنبيهات التي تم إرسالها للمستخدم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `page`: `integer`, رقم الصفحة (افتراضي: 1)
- `per_page`: `integer`, عدد النتائج في الصفحة (افتراضي: 20)

**المخرجات (200 OK):**
```json
{
  "alerts": [
    {
      "id": "alert123",
      "user_id": 1,
      "classification_id": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "category": "fire",
      "risk_level": "critical",
      "title": "تنبيه حريق عاجل!",
      "message": "تم اكتشاف حريق كبير بنسبة ثقة 98.5% في الصورة المرفوعة.",
      "channel": "email",
      "created_at": "2025-09-18T10:05:00.000000"
    }
  ],
  "pagination": {
    "total": 50,
    "total_pages": 3,
    "current_page": 1,
    "per_page": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء استرجاع سجل التنبيهات"
}
```

### 11. إرسال تنبيه اختباري (Test Alert)

**المسار:** `/alerts/test`
**الطريقة:** `POST`
**الوصف:** يرسل تنبيهًا اختباريًا للمستخدم للتحقق من إعدادات التنبيهات.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `application/json`):**
```json
{
  "category": "fire", // string, مطلوب, نوع التنبيه الاختباري (traffic, fire, accident, violence)
  "channel": "email"  // string, اختياري, قناة التنبيه (email, sms, push). افتراضي: جميع القنوات المفعلة.
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم إرسال التنبيه الاختباري بنجاح",
  "sent_to": ["email"]
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "نوع الفئة غير صحيح"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء إرسال التنبيه الاختباري"
}
```

## 📞 مسارات جهات الاتصال الطارئة

### 12. إدارة جهات الاتصال الطارئة (Emergency Contacts)

**المسار:** `/emergency-contacts`
**الطريقة:** `GET`, `POST`
**الوصف:** استرجاع أو إضافة جهات اتصال طارئة للمستخدم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (GET):**
- لا يوجد

**المخرجات (GET - 200 OK):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "والدتي",
    "phone": "+966501234567",
    "email": "mom@example.com",
    "type": "personal",
    "created_at": "2025-09-18T10:20:00.000000",
    "updated_at": "2025-09-18T10:20:00.000000"
  },
  // ... جهات اتصال أخرى
]
```

**المدخلات (POST - Request Body - `application/json`):**
```json
{
  "name": "والدتي",              // string, مطلوب, اسم جهة الاتصال
  "phone": "+966501234567",      // string, مطلوب, رقم الهاتف
  "email": "mom@example.com",    // string, اختياري, البريد الإلكتروني
  "type": "personal"             // string, اختياري, نوع جهة الاتصال (emergency, police, fire, medical, personal). افتراضي: personal
}
```

**المخرجات (POST - 201 Created):**
```json
{
  "msg": "تم إضافة جهة الاتصال بنجاح",
  "contact_id": 2
}
```

**المخرجات (POST - 400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "الاسم ورقم الهاتف مطلوبان"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء إضافة جهة الاتصال"
}
```

### 13. تحديث جهة اتصال طارئة (Update Emergency Contact)

**المسار:** `/emergency-contacts/<contact_id>`
**الطريقة:** `PUT`
**الوصف:** تحديث معلومات جهة اتصال طارئة محددة.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (URL Parameters):**
- `contact_id`: `integer`, مطلوب, معرف جهة الاتصال.

**المدخلات (Request Body - `application/json`):**
```json
{
  "name": "والدتي المحدثة",      // string, اختياري, اسم جهة الاتصال
  "phone": "+966509876543",      // string, اختياري, رقم الهاتف
  "email": "updated_mom@example.com", // string, اختياري, البريد الإلكتروني
  "type": "emergency"            // string, اختياري, نوع جهة الاتصال
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم تحديث جهة الاتصال بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
// أو
{
  "msg": "جهة الاتصال غير موجودة"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تحديث جهة الاتصال"
}
```

### 14. حذف جهة اتصال طارئة (Delete Emergency Contact)

**المسار:** `/emergency-contacts/<contact_id>`
**الطريقة:** `DELETE`
**الوصف:** حذف جهة اتصال طارئة محددة.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (URL Parameters):**
- `contact_id`: `integer`, مطلوب, معرف جهة الاتصال.

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "msg": "تم حذف جهة الاتصال بنجاح"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
// أو
{
  "msg": "جهة الاتصال غير موجودة"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء حذف جهة الاتصال"
}
```

## 👤 مسارات المستخدم

### 15. معلومات المستخدم (User Info)

**المسار:** `/user/info`
**الطريقة:** `GET`
**الوصف:** استرجاع معلومات الملف الشخصي للمستخدم الحالي.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "created_at": "2025-09-18T09:30:00.000000",
  "last_login": "2025-09-18T10:30:00.000000",
  "is_active": true
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء استرجاع معلومات المستخدم"
}
```

### 16. تحديث معلومات المستخدم (Update User Info)

**المسار:** `/user/info`
**الطريقة:** `PUT`
**الوصف:** تحديث معلومات الملف الشخصي للمستخدم الحالي.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `application/json`):**
```json
{
  "username": "updated_user", // string, اختياري, اسم المستخدم الجديد
  "email": "updated_email@example.com" // string, اختياري, البريد الإلكتروني الجديد
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم تحديث معلومات المستخدم بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "اسم المستخدم أو البريد الإلكتروني مطلوب للتحديث"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (409 Conflict):**
```json
{
  "msg": "اسم المستخدم هذا مسجل بالفعل"
}
// أو
{
  "msg": "هذا البريد الإلكتروني مسجل بالفعل"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تحديث معلومات المستخدم"
}
```

### 17. تغيير كلمة المرور (Change Password)

**المسار:** `/user/change-password`
**الطريقة:** `PUT`
**الوصف:** يسمح للمستخدم بتغيير كلمة المرور الخاصة به.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `application/json`):**
```json
{
  "current_password": "StrongPassword123", // string, مطلوب, كلمة المرور الحالية
  "new_password": "NewStrongPassword456"   // string, مطلوب, كلمة المرور الجديدة
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم تغيير كلمة المرور بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "كلمة المرور الحالية والجديدة مطلوبتان"
}
// أو
{
  "msg": "كلمة المرور الجديدة ضعيفة جداً"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
// أو
{
  "msg": "كلمة المرور الحالية غير صحيحة"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تغيير كلمة المرور"
}
```

### 18. تسجيل الخروج (Logout)

**المسار:** `/logout`
**الطريقة:** `POST`
**الوصف:** يقوم بتسجيل خروج المستخدم وإلغاء صلاحية رمز JWT الحالي.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "msg": "تم تسجيل الخروج بنجاح"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تسجيل الخروج"
}
```

## 📊 مسارات لوحة التحكم

### 19. بيانات لوحة التحكم (Dashboard Data)

**المسار:** `/dashboard-data`
**الطريقة:** `GET`
**الوصف:** يوفر بيانات مجمعة لعرضها في لوحة التحكم، مثل إحصائيات التصنيف، التنبيهات، وما إلى ذلك.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total_images": 150,
    "images_change": 10, // نسبة التغيير مقارنة بالفترة السابقة
    "active_alerts": 5,
    "alerts_change": -20,
    "avg_processing_time": 0.75,
    "time_change": 5,
    "accuracy": 92.1,
    "accuracy_change": 2
  },
  "categories": [
    {"category": "fire", "percentage": 15},
    {"category": "traffic", "percentage": 40},
    {"category": "accident", "percentage": 25},
    {"category": "violence", "percentage": 10},
    {"category": "normal", "percentage": 10}
  ]
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء جلب بيانات لوحة التحكم"
}
```

### 20. بيانات الرسم البياني (Chart Data)

**المسار:** `/chart-data`
**الطريقة:** `GET`
**الوصف:** يوفر بيانات لتغذية الرسوم البيانية في لوحة التحكم، مثل عدد التصنيفات على مدار فترة زمنية.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `period`: `string`, مطلوب, الفترة الزمنية للبيانات (مثال: `today`, `week`, `month`, `year`)

**المخرجات (200 OK):**
```json
{
  "success": true,
  "labels": ["00:00", "01:00", ..., "23:00"], // أو أيام الأسبوع، أو أشهر السنة
  "values": [5, 10, 8, ..., 12] // عدد التصنيفات لكل فترة
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "الفترة الزمنية غير صالحة"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء جلب بيانات الرسم البياني"
}
```

### 21. التصنيفات الأخيرة (Recent Classifications)

**المسار:** `/recent-classifications`
**الطريقة:** `GET`
**الوصف:** يسترجع قائمة بأحدث التصنيفات التي قام بها المستخدم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `limit`: `integer`, اختياري, الحد الأقصى لعدد التصنيفات المراد استرجاعها (افتراضي: 10)

**المخرجات (200 OK):**
```json
{
  "success": true,
  "classifications": [
    {
      "id": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "filename": "latest_fire.jpg",
      "result": "fire",
      "confidence": 98.5,
      "created_at": "2025-09-18T10:40:00.000000"
    },
    // ... تصنيفات أخرى
  ]
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء جلب التصنيفات الأخيرة"
}
```

## 🚧 مسارات إضافية

### 22. التحقق من توفر اسم المستخدم (Check Username Availability)

**المسار:** `/check-username`
**الطريقة:** `POST`
**الوصف:** يتحقق مما إذا كان اسم المستخدم متاحًا للاستخدام.
**المصادقة:** لا يتطلب

**المدخلات (Request Body - `application/json`):**
```json
{
  "username": "desired_username" // string, مطلوب, اسم المستخدم المراد التحقق منه
}
```

**المخرجات (200 OK):**
```json
{
  "available": true // boolean, صحيح إذا كان اسم المستخدم متاحًا، خطأ إذا كان غير متاح
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "اسم المستخدم مطلوب"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء التحقق من اسم المستخدم"
}
```

### 23. طلب إعادة تعيين كلمة المرور (Forgot Password)

**المسار:** `/forgot-password`
**الطريقة:** `POST`
**الوصف:** يرسل رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمستخدم.
**المصادقة:** لا يتطلب

**المدخلات (Request Body - `application/json`):**
```json
{
  "email": "user@example.com" // string, مطلوب, البريد الإلكتروني للمستخدم
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "البريد الإلكتروني مطلوب"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء إرسال رابط إعادة التعيين"
}
```

### 24. تحديث موقع المستخدم (Update User Location)

**المسار:** `/user/location`
**الطريقة:** `PUT`
**الوصف:** تحديث الموقع الجغرافي للمستخدم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `application/json`):**
```json
{
  "latitude": 34.0522,  // float, مطلوب, خط العرض
  "longitude": -118.2437 // float, مطلوب, خط الطول
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم تحديث الموقع بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "خط العرض وخط الطول مطلوبان"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تحديث الموقع"
}
```

### 25. تصدير البيانات (Export Data)

**المسار:** `/export-data`
**الطريقة:** `GET`
**الوصف:** تصدير بيانات المستخدم (مثل سجل التصنيفات) بتنسيق محدد.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `format`: `string`, اختياري, تنسيق التصدير (افتراضي: `csv`). يدعم حاليًا `csv`.

**المخرجات (200 OK):**
- ملف CSV يحتوي على بيانات التصنيفات.

**المخرجات (400 Bad Request):**
```json
{
  "msg": "تنسيق التصدير غير مدعوم"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تصدير البيانات"
}
```

## ❌ معالجة الأخطاء العامة

### 401 Unauthorized

**الوصف:** يحدث عندما يحاول المستخدم الوصول إلى مورد محمي بدون رمز JWT صالح أو منتهي الصلاحية.
**المخرجات:**
```json
{
  "msg": "الوصول غير مصرح به"
}
// أو
{
  "msg": "الرمز غير صالح"
}
// أو
{
  "msg": "انتهت صلاحية الرمز"
}
```

### 404 Not Found

**الوصف:** يحدث عندما يحاول المستخدم الوصول إلى مسار غير موجود.
**المخرجات:**
```json
{
  "msg": "المسار غير موجود"
}
```

### 500 Internal Server Error

**الوصف:** يحدث عندما يواجه الخادم خطأ غير متوقع. يجب مراجعة سجلات الخادم للحصول على تفاصيل.
**المخرجات:**
```json
{
  "msg": "حدث خطأ داخلي في الخادم"
}
```

---



## 👤 مسارات المستخدم

### 15. معلومات المستخدم (User Info)

**المسار:** `/user/info`
**الطريقة:** `GET`
**الوصف:** استرجاع معلومات الملف الشخصي للمستخدم الحالي.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "created_at": "2025-09-18T09:30:00.000000",
  "last_login": "2025-09-18T10:30:00.000000",
  "is_active": true
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء استرجاع معلومات المستخدم"
}
```

### 16. تحديث معلومات المستخدم (Update User Info)

**المسار:** `/user/info`
**الطريقة:** `PUT`
**الوصف:** تحديث معلومات الملف الشخصي للمستخدم الحالي.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `application/json`):**
```json
{
  "username": "updated_user", // string, اختياري, اسم المستخدم الجديد
  "email": "updated_email@example.com" // string, اختياري, البريد الإلكتروني الجديد
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم تحديث معلومات المستخدم بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "اسم المستخدم أو البريد الإلكتروني مطلوب للتحديث"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (409 Conflict):**
```json
{
  "msg": "اسم المستخدم هذا مسجل بالفعل"
}
// أو
{
  "msg": "هذا البريد الإلكتروني مسجل بالفعل"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تحديث معلومات المستخدم"
}
```

### 17. تغيير كلمة المرور (Change Password)

**المسار:** `/user/change-password`
**الطريقة:** `PUT`
**الوصف:** يسمح للمستخدم بتغيير كلمة المرور الخاصة به.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `application/json`):**
```json
{
  "current_password": "StrongPassword123", // string, مطلوب, كلمة المرور الحالية
  "new_password": "NewStrongPassword456"   // string, مطلوب, كلمة المرور الجديدة
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم تغيير كلمة المرور بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "كلمة المرور الحالية والجديدة مطلوبتان"
}
// أو
{
  "msg": "كلمة المرور الجديدة ضعيفة جداً"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
// أو
{
  "msg": "كلمة المرور الحالية غير صحيحة"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تغيير كلمة المرور"
}
```

### 18. تسجيل الخروج (Logout)

**المسار:** `/logout`
**الطريقة:** `POST`
**الوصف:** يقوم بتسجيل خروج المستخدم وإلغاء صلاحية رمز JWT الحالي.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "msg": "تم تسجيل الخروج بنجاح"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تسجيل الخروج"
}
```

## 📊 مسارات لوحة التحكم

### 19. بيانات لوحة التحكم (Dashboard Data)

**المسار:** `/dashboard-data`
**الطريقة:** `GET`
**الوصف:** يوفر بيانات مجمعة لعرضها في لوحة التحكم، مثل إحصائيات التصنيف، التنبيهات، وما إلى ذلك.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات:**
- لا يوجد

**المخرجات (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total_images": 150,
    "images_change": 10, // نسبة التغيير مقارنة بالفترة السابقة
    "active_alerts": 5,
    "alerts_change": -20,
    "avg_processing_time": 0.75,
    "time_change": 5,
    "accuracy": 92.1,
    "accuracy_change": 2
  },
  "categories": [
    {"category": "fire", "percentage": 15},
    {"category": "traffic", "percentage": 40},
    {"category": "accident", "percentage": 25},
    {"category": "violence", "percentage": 10},
    {"category": "normal", "percentage": 10}
  ]
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء جلب بيانات لوحة التحكم"
}
```

### 20. بيانات الرسم البياني (Chart Data)

**المسار:** `/chart-data`
**الطريقة:** `GET`
**الوصف:** يوفر بيانات لتغذية الرسوم البيانية في لوحة التحكم، مثل عدد التصنيفات على مدار فترة زمنية.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `period`: `string`, مطلوب, الفترة الزمنية للبيانات (مثال: `today`, `week`, `month`, `year`)

**المخرجات (200 OK):**
```json
{
  "success": true,
  "labels": ["00:00", "01:00", ..., "23:00"], // أو أيام الأسبوع، أو أشهر السنة
  "values": [5, 10, 8, ..., 12] // عدد التصنيفات لكل فترة
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "الفترة الزمنية غير صالحة"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء جلب بيانات الرسم البياني"
}
```

### 21. التصنيفات الأخيرة (Recent Classifications)

**المسار:** `/recent-classifications`
**الطريقة:** `GET`
**الوصف:** يسترجع قائمة بأحدث التصنيفات التي قام بها المستخدم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `limit`: `integer`, اختياري, الحد الأقصى لعدد التصنيفات المراد استرجاعها (افتراضي: 10)

**المخرجات (200 OK):**
```json
{
  "success": true,
  "classifications": [
    {
      "id": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "filename": "latest_fire.jpg",
      "result": "fire",
      "confidence": 98.5,
      "created_at": "2025-09-18T10:40:00.000000"
    },
    // ... تصنيفات أخرى
  ]
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء جلب التصنيفات الأخيرة"
}
```

## 🚧 مسارات إضافية

### 22. التحقق من توفر اسم المستخدم (Check Username Availability)

**المسار:** `/check-username`
**الطريقة:** `POST`
**الوصف:** يتحقق مما إذا كان اسم المستخدم متاحًا للاستخدام.
**المصادقة:** لا يتطلب

**المدخلات (Request Body - `application/json`):**
```json
{
  "username": "desired_username" // string, مطلوب, اسم المستخدم المراد التحقق منه
}
```

**المخرجات (200 OK):**
```json
{
  "available": true // boolean, صحيح إذا كان اسم المستخدم متاحًا، خطأ إذا كان غير متاح
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "اسم المستخدم مطلوب"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء التحقق من اسم المستخدم"
}
```

### 23. طلب إعادة تعيين كلمة المرور (Forgot Password)

**المسار:** `/forgot-password`
**الطريقة:** `POST`
**الوصف:** يرسل رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمستخدم.
**المصادقة:** لا يتطلب

**المدخلات (Request Body - `application/json`):**
```json
{
  "email": "user@example.com" // string, مطلوب, البريد الإلكتروني للمستخدم
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "البريد الإلكتروني مطلوب"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء إرسال رابط إعادة التعيين"
}
```

### 24. تحديث موقع المستخدم (Update User Location)

**المسار:** `/user/location`
**الطريقة:** `PUT`
**الوصف:** تحديث الموقع الجغرافي للمستخدم.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Request Body - `application/json`):**
```json
{
  "latitude": 34.0522,  // float, مطلوب, خط العرض
  "longitude": -118.2437 // float, مطلوب, خط الطول
}
```

**المخرجات (200 OK):**
```json
{
  "msg": "تم تحديث الموقع بنجاح"
}
```

**المخرجات (400 Bad Request):**
```json
{
  "msg": "يجب تقديم البيانات بصيغة JSON"
}
// أو
{
  "msg": "خط العرض وخط الطول مطلوبان"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تحديث الموقع"
}
```

### 25. تصدير البيانات (Export Data)

**المسار:** `/export-data`
**الطريقة:** `GET`
**الوصف:** تصدير بيانات المستخدم (مثل سجل التصنيفات) بتنسيق محدد.
**المصادقة:** يتطلب (`jwt_required`)

**المدخلات (Query Parameters):**
- `format`: `string`, اختياري, تنسيق التصدير (افتراضي: `csv`). يدعم حاليًا `csv`.

**المخرجات (200 OK):**
- ملف CSV يحتوي على بيانات التصنيفات.

**المخرجات (400 Bad Request):**
```json
{
  "msg": "تنسيق التصدير غير مدعوم"
}
```

**المخرجات (401 Unauthorized):**
```json
{
  "msg": "الوصول غير مصرح به"
}
```

**المخرجات (404 Not Found):**
```json
{
  "msg": "المستخدم غير موجود"
}
```

**المخرجات (500 Internal Server Error):**
```json
{
  "msg": "حدث خطأ أثناء تصدير البيانات"
}
```

## ❌ معالجة الأخطاء العامة

### 401 Unauthorized

**الوصف:** يحدث عندما يحاول المستخدم الوصول إلى مورد محمي بدون رمز JWT صالح أو منتهي الصلاحية.
**المخرجات:**
```json
{
  "msg": "الوصول غير مصرح به"
}
// أو
{
  "msg": "الرمز غير صالح"
}
// أو
{
  "msg": "انتهت صلاحية الرمز"
}
```

### 404 Not Found

**الوصف:** يحدث عندما يحاول المستخدم الوصول إلى مسار غير موجود.
**المخرجات:**
```json
{
  "msg": "المسار غير موجود"
}
```

### 500 Internal Server Error

**الوصف:** يحدث عندما يواجه الخادم خطأ غير متوقع. يجب مراجعة سجلات الخادم للحصول على تفاصيل.
**المخرجات:**
```json
{
  "msg": "حدث خطأ داخلي في الخادم"
}
```

---

