from evaluation import RecommenderEvaluator, print_evaluation_report
from popularity_recommender import PopularityRecommender
import mysql.connector

# Config database 
db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '100103',
    'database': 'NLCN',
    'port': 3307,
    'auth_plugin': 'mysql_native_password'
}

def run_evaluation():
    try:
        # 1. Get recommendations
        recommender = PopularityRecommender()
        conn = mysql.connector.connect(**db_config)
        recommender.fit(conn)
        
        # Get raw recommendations data
        recommendations = recommender.get_recommendations_data()
        
        # 2. Evaluate
        evaluator = RecommenderEvaluator()
        evaluation_metrics = evaluator.evaluate(recommendations)
        
        # 3. Print report
        print_evaluation_report(evaluation_metrics)
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    run_evaluation() 