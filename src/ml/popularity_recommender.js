// Thêm method để train lại model định kỳ
async function scheduleModelTraining(pool, interval = 3600000) { // 1 hour
    try {
        const recommender = new PopularityRecommender();
        
        const trainModel = async () => {
            console.log('Training recommender model...');
            await recommender.fit(pool);
            console.log('Model training completed');
        };

        // Train lần đầu
        await trainModel();
        
        // Train định kỳ
        setInterval(trainModel, interval);
        
        return recommender;
    } catch (error) {
        console.error('Error scheduling model training:', error);
        throw error;
    }
}