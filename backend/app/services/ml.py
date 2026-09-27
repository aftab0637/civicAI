import re
import os
from typing import Optional
from PIL import Image

# Import ML packages lazily to not slow down application startup unless necessary,
# but we define global slots here.
import torch
import torchvision.models as models
import torchvision.transforms as transforms

# Keywords mapped to issue categories (used for text fallback)
CATEGORIES_KEYWORDS = {
    "Waste Management & Sanitation": [
        "trash", "garbage", "waste", "rubbish", "dump", "bin", "litter", 
        "overflow", "smell", "scraps", "recycling", "landfill", "refuse",
        "sanitation", "dirty", "stagnant", "cleanliness"
    ],
    "Roads & Infrastructure": [
        "pothole", "road", "street", "pavement", "crack", "sidewalk", 
        "highway", "construction", "concrete", "asphalt", "sinkhole", "bridge", "lane"
    ],
    "Utilities & Lighting": [
        "light", "streetlight", "lamp", "blackout", "power", "electricity", 
        "wire", "cable", "outage", "generator", "leak", "water", "pipe", "sewer", "drain",
        "drainage", "gutter", "clogged", "overflowing"
    ],
    "Public Safety & Hazards": [
        "fire", "smoke", "accident", "hazard", "danger", "wire", "spark", 
        "collapsed", "falling", "tree", "flood", "waterlogging", "water logging", "emergency"
    ]
}

# Keywords that boost severity level
SEVERITY_KEYWORDS = {
    "CRITICAL": ["fire", "spark", "explosion", "injury", "injured", "hazard", "collapse", "live wire", "gas leak"],
    "HIGH": ["flood", "waterlogging", "blackout", "overflow", "drainage", "broken", "danger", "blockage", "crash"],
    "MEDIUM": ["pothole", "garbage", "smell", "streetlight", "litter", "outage", "leak"],
    "LOW": ["clean", "paint", "request", "minor", "suggestion", "dustbin"]
}

# Preprocessing transforms for ImageNet models
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# Global variables for model lazy loading
_model = None
_categories = None

def get_model():
    """
    Lazy-loads the pre-trained MobileNetV3 small model.
    Downloads weights on the first invocation.
    """
    global _model, _categories
    if _model is None:
        try:
            # Using the recommended multi-weight API for torchvision
            weights = models.MobileNet_V3_Small_Weights.DEFAULT
            _categories = weights.meta["categories"]
            # Load MobileNetV3 small which is fast and lightweight
            _model = models.mobilenet_v3_small(weights=weights)
            _model.eval()
            print("Successfully loaded MobileNetV3 small model.")
        except Exception as e:
            print(f"Error loading MobileNetV3 model: {e}")
            _model = None
            _categories = None
    return _model, _categories

def map_class_to_category(label: str) -> Optional[str]:
    """
    Maps an ImageNet class label to one of the four municipal categories.
    """
    label_lower = label.lower()
    
    # Waste Management & Sanitation
    waste_kws = ["ashcan", "trash", "garbage", "waste", "rubbish", "dumpster", "bin", "litter", "landfill"]
    # Roads & Infrastructure
    roads_kws = ["manhole", "streetcar", "pavement", "sidewalk", "cobblestone", "bridge", "viaduct", "barrier", "road", "paving", "pothole", "volcano", "alp", "valley"]
    # Utilities & Lighting
    utilities_kws = ["streetlight", "lamp", "hydrant", "fireplug", "pole", "wire", "cable", "pipe", "drain", "sewer", "electric", "canal", "ditch", "gutter", "waterway"]
    # Public Safety & Hazards
    safety_kws = ["fire", "smoke", "accident", "hazard", "danger", "flood", "landslide", "avalanche", "sinkhole", "collapsed", "ambulance"]

    if any(kw in label_lower for kw in waste_kws):
        return "Waste Management & Sanitation"
    if any(kw in label_lower for kw in roads_kws):
        return "Roads & Infrastructure"
    if any(kw in label_lower for kw in utilities_kws):
        return "Utilities & Lighting"
    if any(kw in label_lower for kw in safety_kws):
        return "Public Safety & Hazards"
    return None

def classify_image(image_path: str) -> Optional[dict]:
    """
    Loads an image, pre-processes it, runs through MobileNetV3,
    and returns predicted category and confidence.
    """
    try:
        model, categories = get_model()
        if not model or not categories:
            print("Model or categories list not available.")
            return None
            
        if not os.path.exists(image_path):
            print(f"Image path does not exist: {image_path}")
            return None
            
        img = Image.open(image_path).convert("RGB")
        input_tensor = preprocess(img)
        input_batch = input_tensor.unsqueeze(0)  # Add batch dimension
        
        with torch.no_grad():
            output = model(input_batch)
            
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        
        # Get top 5 predictions
        top5_prob, top5_catid = torch.topk(probabilities, 5)
        
        # Try to find the first prediction in top-5 that maps to a category
        for i in range(5):
            class_name = categories[top5_catid[i]]
            mapped_cat = map_class_to_category(class_name)
            if mapped_cat:
                return {
                    "predicted_category": mapped_cat,
                    "confidence": float(top5_prob[i]),
                    "class_name": class_name
                }
                
        # If none map, return top prediction details but no category
        top1_class_name = categories[top5_catid[0]]
        return {
            "predicted_category": None,
            "confidence": float(top5_prob[0]),
            "class_name": top1_class_name
        }
    except Exception as e:
        print(f"Error classifying image {image_path}: {e}")
        return None

def analyze_text_issue(description: str) -> dict:
    """
    Lightweight rule-based NLP Classifier that simulates TF-IDF/Naive Bayes category & severity prediction.
    """
    if not description:
        return {
            "predicted_category": "General / Other",
            "predicted_severity": "MEDIUM"
        }
        
    text = description.lower()
    
    # Predict Category
    category_scores = {}
    for category, keywords in CATEGORIES_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text))
        category_scores[category] = score
        
    best_category = max(category_scores, key=category_scores.get)
    if category_scores[best_category] == 0:
        best_category = "General / Other"
        
    # Predict Severity
    severity_scores = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for severity, keywords in SEVERITY_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text))
        severity_scores[severity] = score
        
    best_severity = max(severity_scores, key=severity_scores.get)
    if severity_scores[best_severity] == 0:
        best_severity = "MEDIUM"  # Default severity
        
    return {
        "predicted_category": best_category,
        "predicted_severity": best_severity
    }

def analyze_issue(description: str, image_path: Optional[str] = None) -> dict:
    """
    Integrates image-based classification (via MobileNetV3) and text-based description keyword matching.
    """
    predicted_category = None
    confidence = None
    class_name = None
    classification_source = "text"
    
    # 1. Image classification (if image is available)
    if image_path:
        print(f"Analyzing image: {image_path}")
        img_result = classify_image(image_path)
        if img_result and img_result.get("predicted_category"):
            predicted_category = img_result["predicted_category"]
            confidence = img_result.get("confidence")
            class_name = img_result.get("class_name")
            classification_source = "image"
            print(f"Image classification succeeded. Class: {class_name}, Confidence: {confidence:.2f}, Category: {predicted_category}")
        elif img_result:
            print(f"Image classified as: {img_result.get('class_name')} (confidence: {img_result.get('confidence'):.2f}), but did not map to a municipal category. Falling back to text description.")
            
    # 2. Text classification fallback for category, and primary severity prediction
    text_results = analyze_text_issue(description)
    
    if not predicted_category:
        predicted_category = text_results["predicted_category"]
        
    return {
        "predicted_category": predicted_category,
        "predicted_severity": text_results["predicted_severity"],
        "classification_source": classification_source,
        "image_class_name": class_name,
        "image_confidence": confidence
    }
