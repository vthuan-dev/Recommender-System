def calculate_precision(actual, predicted):
    """
    Tính độ chính xác của các gợi ý
    actual: list các sản phẩm thực tế người dùng đã tương tác
    predicted: list các sản phẩm được gợi ý
    """
    if len(predicted) == 0:
        return 0.0
    
    true_positives = len(set(actual) & set(predicted))
    return true_positives / len(predicted)

def calculate_recall(actual, predicted):
    """
    Tính độ bao phủ của các gợi ý
    actual: list các sản phẩm thực tế người dùng đã tương tác
    predicted: list các sản phẩm được gợi ý
    """
    if len(actual) == 0:
        return 0.0
    
    true_positives = len(set(actual) & set(predicted))
    return true_positives / len(actual)