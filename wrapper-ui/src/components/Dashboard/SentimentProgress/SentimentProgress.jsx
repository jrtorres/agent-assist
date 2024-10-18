import React, { useEffect, useState, useContext } from 'react';
import { RadarChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';
import { AppContext } from "../../../context/context";

const SentimentProgress = () => {
    const { currentSessionUser, sentimentData } = useContext(AppContext);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (!currentSessionUser || !sentimentData.length) return;

        const sessionSentiment = sentimentData.filter(data => data.session_id === currentSessionUser?.session_id);
        
        if (!sessionSentiment.length) return;

        const externalSentiment = sessionSentiment.filter(data => data.source === "external").pop() || {};
        const internalSentiment = sessionSentiment.filter(data => data.source === "internal").pop() || {};

        const newChartData = [
            { group: "Customer", key: "Sadness", value: externalSentiment.sadness * 100 },
            { group: "Customer", key: "Joy", value: externalSentiment.joy * 100 },
            { group: "Customer", key: "Fear", value: externalSentiment.fear * 100 },
            { group: "Customer", key: "Disgust", value: externalSentiment.disgust * 100 },
            { group: "Customer", key: "Anger", value: externalSentiment.anger * 100 },
            { group: "Agent", key: "Sadness", value: internalSentiment.sadness * 100 },
            { group: "Agent", key: "Joy", value: internalSentiment.joy * 100 },
            { group: "Agent", key: "Fear", value: internalSentiment.fear * 100 },
            { group: "Agent", key: "Disgust", value: internalSentiment.disgust * 100 },
            { group: "Agent", key: "Anger", value: internalSentiment.anger * 100 }
        ];

        setChartData(newChartData);
    }, [currentSessionUser, sentimentData]);

    const chartOptions = {
        title: "Sentiment Analysis",
        radar: {
            axes: {
                angle: "key",
                value: "value"
            },
            alignment: "center"
        },
        data: {
            groupMapsTo: "group"
        },
        legend: {
            alignment: "center"
        },
        height: "400px"
    };

    return (
        <div className="w-full h-full border border-blueGray-700 rounded-md p-4 overflow-y-auto bg-white">
            {chartData.length > 0 ? (
                <RadarChart data={chartData} options={chartOptions} />
            ) : (
                <p>Loading sentiment data...</p>
            )}
        </div>
    );
};

export default SentimentProgress;
