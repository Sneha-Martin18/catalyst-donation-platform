import React from "react";
import RecommendationEngine from "../../../components/Recommendations/RecommendationEngine";
import BackButton from "../../../components/BackButton";

function RecommendationPage() {
    return (
        <div className="recommendation-page" style={{ padding: '20px' }}>
            <BackButton />
            <RecommendationEngine />
        </div>
    );
}

export default RecommendationPage;
