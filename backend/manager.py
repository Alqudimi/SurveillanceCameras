import cv2
import numpy as np
import json
import os
import logging

from tensorflow.keras.applications.mobilenet import preprocess_input
from tensorflow.keras.models import load_model

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """
    مستويات الخطر المحتملة للتصنيف
    القيم: LOW, MEDIUM, HIGH, CRITICAL
    """
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ClassificationResult:
    """
    نتيجة تصنيف لفئة واحدة
    المعاملات:
        category (str): نوع الفئة (حركة مرور، حريق، إلخ)
        class_name (str): اسم الصنف المكتشف
        confidence (float): درجة الثقة في التصنيف
        risk_level (RiskLevel): مستوى الخطر
        details (Dict): تفاصيل إضافية عن التصنيف
    """
    category: str
    class_name: str
    confidence: float
    risk_level: RiskLevel
    details: Dict[str, Any]

@dataclass
class OverallResult:
    """
    النتيجة الإجمالية لتصنيف الصورة
    المعاملات:
        results (List[ClassificationResult]): قائمة نتائج التصنيف
        overall_risk (RiskLevel): مستوى الخطر الإجمالي
        processing_time (float): وقت المعالجة بالثواني
        image_info (Dict): معلومات عن الصورة المعالجة
        alerts_triggered (List[str]): قائمة التنبيهات المطلقة
    """
    results: List[ClassificationResult]
    overall_risk: RiskLevel
    processing_time: float
    image_info: Dict[str, Any]
    alerts_triggered: List[str]

class ModelConfig:
    """
    تكوين نموذج التصنيف
    المعاملات:
        path (str): مسار ملف النموذج
        input_size (Tuple[int, int]): حجم الإدخال المطلوب
        preprocess_type (str): نوع المعالجة المسبقة
        classes (List[str]): قائمة الأصناف التي يتعرف عليها النموذج
        threshold_medium (float): عتبة الخطر المتوسط
        threshold_high (float): عتبة الخطر العالي
    """
    def __init__(self, path: str, input_size: Tuple[int, int], 
                 preprocess_type: str, classes: List[str], 
                 threshold_medium: float = 0.6, threshold_high: float = 0.8):
        self.path = path
        self.input_size = input_size
        self.preprocess_type = preprocess_type
        self.classes = classes
        self.threshold_medium = threshold_medium
        self.threshold_high = threshold_high

class EnhancedClassificationManager:
    """
    مدير التصنيف المحسن - يدعم التصنيف المتعدد للنماذج
    
    المعاملات:
        models_dir (str): مجلد نماذج التصنيف
    """
    
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.models = {}
        self.model_configs = self._initialize_model_configs()
        self.lock = threading.Lock()
        self.is_initialized = False
        self._load_available_models()
    
    def _initialize_model_configs(self) -> Dict[str, ModelConfig]:
        """تهيئة تكوينات النماذج المختلفة"""
        return {
            
            "accident": ModelConfig(
                path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"models","walk.keras"),
                input_size=(224, 224),
                preprocess_type="mobilenet", 
                classes=["accident", "dense_traffic","fire","sparse_traffic"]  ,
                threshold_medium=0.6,
                threshold_high=0.8
            ),
            "violence": ModelConfig(
                path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"models","violence.keras"),
                input_size=(224, 224),
                preprocess_type="mobilenet",
                classes=["no_violence", "violence"] ,
                threshold_medium=0.5,
                threshold_high=0.7
            )
        }
    
    def _load_available_models(self):
        """تحميل النماذج المتاحة من المجلد"""
        try:
            import tensorflow as tf
            from tensorflow.keras.models import load_model
            from tensorflow.keras.applications.mobilenet import preprocess_input as mobilenet_preprocess
            
            self.preprocess_functions = {
                "mobilenet": mobilenet_preprocess
            }
            
            loaded_models = []
            for category, config in self.model_configs.items():
                if os.path.exists(config.path):
                    try:
                        logger.info(f"تحميل نموذج {category}")
                        model = load_model(config.path)
                        self.models[category] = model
                        loaded_models.append(category)
                    except Exception as e:
                        logger.error(f"خطأ في تحميل نموذج {category}: {str(e)}")
                else:
                    logger.warning(f"ملف النموذج غير موجود: {config.path}")
            
            if loaded_models:
                logger.info(f"تم تحميل النماذج: {', '.join(loaded_models)}")
                self.is_initialized = True
            else:
                logger.warning("لم يتم تحميل أي نماذج - استخدام نماذج وهمية")
                
        except ImportError:
            logger.error("TensorFlow غير متوفر - استخدام نماذج وهمية")
        except Exception as e:
            logger.error(f"خطأ عام في تحميل النماذج: {str(e)}")
    

    def _preprocess_image(self, image: np.ndarray, config: ModelConfig) -> np.ndarray:
        """
        معالجة الصورة قبل التصنيف
        المعاملات:
            image (np.ndarray): الصورة المدخلة
            config (ModelConfig): تكوين النموذج
        المخرجات:
            np.ndarray: الصورة المعالجة
        """
        try:
            resized = cv2.resize(image, config.input_size)
            
            if len(resized.shape) == 3 and resized.shape[2] == 3:
                resized = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            
            processed = np.expand_dims(resized, axis=0)
            
            if config.preprocess_type in self.preprocess_functions:
                processed = self.preprocess_functions[config.preprocess_type](processed)
            else:
                processed = processed.astype(np.float32) / 255.0
            
            return processed
            
        except Exception as e:
            logger.error(f"خطأ في معالجة الصورة: {str(e)}")
            raise
    
    def _classify_single_category(self, image: np.ndarray, category: str) -> Optional[ClassificationResult]:
        """
        تصنيف صورة لفئة واحدة
        المعاملات:
            image (np.ndarray): الصورة المدخلة
            category (str): الفئة المطلوبة
        المخرجات:
            ClassificationResult: نتيجة التصنيف أو None في حالة الخطأ
        """
        try:
            if category not in self.models or category not in self.model_configs:
                logger.warning(f"النموذج غير متوفر للفئة: {category}")
                return None
            
            config = self.model_configs[category]
            model = self.models[category]
            
            processed_image = self._preprocess_image(image, config)
            
            if model == "mock_model":
                predictions = np.random.random(len(config.classes))
                predictions = predictions / np.sum(predictions)
            else:
                predictions = model.predict(processed_image, verbose=0)[0]
            
            max_idx = np.argmax(predictions)
            confidence = float(predictions[max_idx])
            class_name = config.classes[max_idx]
            
            if confidence >= config.threshold_high:
                risk_level = RiskLevel.HIGH
            elif confidence >= config.threshold_medium:
                risk_level = RiskLevel.MEDIUM
            else:
                risk_level = RiskLevel.LOW
            
            details = {
                "all_predictions": {config.classes[i]: float(predictions[i]) for i in range(len(config.classes))},
                "model_config": {
                    "input_size": config.input_size,
                    "preprocess_type": config.preprocess_type
                }
            }
            
            return ClassificationResult(
                category=category,
                class_name=class_name,
                confidence=confidence,
                risk_level=risk_level,
                details=details
            )
            
        except Exception as e:
            logger.error(f"خطأ في تصنيف الفئة {category}: {str(e)}")
            return None
    
    def _determine_overall_risk(self, results: List[ClassificationResult]) -> RiskLevel:
        """
        تحديد مستوى الخطر الإجمالي من النتائج
        المعاملات:
            results (List[ClassificationResult]): قائمة نتائج التصنيف
        المخرجات:
            RiskLevel: مستوى الخطر الإجمالي
        """
        if not results:
            return RiskLevel.LOW
        
        risk_levels = [result.risk_level for result in results]
        
        if RiskLevel.CRITICAL in risk_levels:
            return RiskLevel.CRITICAL
        elif RiskLevel.HIGH in risk_levels:
            return RiskLevel.HIGH
        elif RiskLevel.MEDIUM in risk_levels:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _generate_alerts(self, results: List[ClassificationResult]) -> List[str]:
        """
        توليد رسائل تنبيه بناءً على النتائج
        المعاملات:
            results (List[ClassificationResult]): قائمة نتائج التصنيف
        المخرجات:
            List[str]: قائمة رسائل التنبيه
        """
        alerts = []
        
        for result in results:
            if result.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                alert_msg = f"تنبيه {result.category}: تم اكتشاف {result.class_name} بثقة {result.confidence:.2%}"
                alerts.append(alert_msg)
        
        return alerts
    
    def classify_image(self, image_path: str, enabled_categories: Optional[List[str]] = None) -> OverallResult:
        """
        تصنيف صورة شامل باستخدام النماذج المتاحة
        المعاملات:
            image_path (str): مسار ملف الصورة
            enabled_categories (List[str]): الفئات المطلوب تصنيفها
        المخرجات:
            OverallResult: النتيجة الإجمالية للتصنيف
        """
        start_time = time.time()
        
        try:
            if not self.is_initialized:
                self._load_available_models()
            
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"الصورة غير موجودة: {image_path}")
            
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"لا يمكن قراءة الصورة: {image_path}")
            
            image_info = {
                "path": image_path,
                "size": image.shape,
                "file_size": os.path.getsize(image_path)
            }
            
            categories_to_process = enabled_categories or list(self.model_configs.keys())
            categories_to_process = [cat for cat in categories_to_process if cat in self.models]
            
            if not categories_to_process:
                raise ValueError("لا توجد فئات متاحة للتصنيف")
            
            results = []
            with ThreadPoolExecutor(max_workers=len(categories_to_process)) as executor:
                future_to_category = {
                    executor.submit(self._classify_single_category, image, category): category
                    for category in categories_to_process
                }
                
                for future in as_completed(future_to_category):
                    result = future.result()
                    if result:
                        results.append(result)
            
            overall_risk = self._determine_overall_risk(results)
            alerts = self._generate_alerts(results)
            
            processing_time = time.time() - start_time
            
            return OverallResult(
                results=results,
                overall_risk=overall_risk,
                processing_time=processing_time,
                image_info=image_info,
                alerts_triggered=alerts
            )
            
        except Exception as e:
            logger.error(f"خطأ في تصنيف الصورة: {str(e)}")
            processing_time = time.time() - start_time
            
            return OverallResult(
                results=[],
                overall_risk=RiskLevel.LOW,
                processing_time=processing_time,
                image_info={"error": str(e)},
                alerts_triggered=[f"خطأ في التصنيف: {str(e)}"]
            )
    
    def get_available_categories(self) -> List[str]:
        """
        الحصول على قائمة الفئات المتاحة للتصنيف
        المخرجات:
            List[str]: أسماء الفئات المتاحة
        """
        return list(self.models.keys())
    
    def get_model_info(self) -> Dict[str, Dict]:
        """
        الحصول على معلومات عن النماذج المحملة
        المخرجات:
            Dict[str, Dict]: معلومات تفصيلية عن النماذج
        """
        info = {}
        for category, config in self.model_configs.items():
            info[category] = {
                "loaded": category in self.models,
                "path": config.path,
                "classes": config.classes,
                "input_size": config.input_size,
                "preprocess_type": config.preprocess_type
            }
        return info
    
    def to_json(self, result: OverallResult) -> str:
        """
        تحويل نتيجة التصنيف إلى تنسيق JSON
        المعاملات:
            result (OverallResult): نتيجة التصنيف
        المخرجات:
            str: النتيجة بصيغة JSON
        """
        try:
            result_dict = {
                "overall_risk": result.overall_risk.value,
                "processing_time": result.processing_time,
                "image_info": result.image_info,
                "alerts_triggered": result.alerts_triggered,
                "results": []
            }
            
            for res in result.results:
                result_dict["results"].append({
                    "category": res.category,
                    "class_name": res.class_name,
                    "confidence": res.confidence,
                    "risk_level": res.risk_level.value,
                    "details": res.details
                })
            
            return json.dumps(result_dict, indent=2, ensure_ascii=False)
            
        except Exception as e:
            logger.error(f"خطأ في تحويل النتيجة إلى JSON: {str(e)}")
            return json.dumps({"error": str(e)}, ensure_ascii=False)

if __name__ == "__main__":
    manager = EnhancedClassificationManager()
    
    print("معلومات النماذج:")
    print(json.dumps(manager.get_model_info(), indent=2, ensure_ascii=False))
    
    test_image = "uploads\\test\\20250921_211340_accident.jpg"
    if os.path.exists(test_image):
        print(f"\nاختبار التصنيف على {test_image}:")
        result = manager.classify_image(test_image)
        print(manager.to_json(result))
    else:
        print(f"\nملف الاختبار {test_image} غير موجود")
        
    print(f"\nالفئات المتاحة: {manager.get_available_categories()}")