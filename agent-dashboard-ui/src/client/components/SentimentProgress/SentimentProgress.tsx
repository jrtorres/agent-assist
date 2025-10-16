import React, { useEffect, useState } from "react";
import { RadarChart } from "@carbon/charts-react";
import "@carbon/charts/styles.css";
import * as widgetStyles from "@client/widget.module.scss";
import { useSocketEvent } from "@client/providers/Socket";

// --- Define sentiment data type ---
interface SentimentEntry {
  session_id: string;
  source: "internal" | "external";
  sadness: number;
  joy: number;
  fear: number;
  disgust: number;
  anger: number;
}

interface ChartDataEntry {
  group: string;
  key: string;
  value: number;
}

// --- Extend SocketPayload to include sentiment fields ---
interface SentimentSocketParameters {
  session_id: string;
  source: "internal" | "external";
  sadness?: number;
  joy?: number;
  fear?: number;
  disgust?: number;
  anger?: number;
}

interface SentimentSocketPayload {
  type: string;
  parameters: SentimentSocketParameters;
}

// --- Component ---
const SentimentProgress: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<SentimentEntry[]>([]);
  const [chartData, setChartData] = useState<ChartDataEntry[]>([]);
  const { lastMessage } = useSocketEvent("celeryMessage");

  console.log(lastMessage)

  // --- Listen for socket messages and update sentiment data ---
  useEffect(() => {
    if (!lastMessage) return;

    const payload = JSON.parse(lastMessage.payloadString);

    // Accept type "sentiment"
    if (payload?.type === "sentiment") {
      const entry: SentimentEntry = {
        session_id: lastMessage.agent_id || "unknown_session",
        source: payload.parameters.source as "internal" | "external",
        sadness: payload.parameters.sadness || 0,
        joy: payload.parameters.joy || 0,
        fear: payload.parameters.fear || 0,
        disgust: payload.parameters.disgust || 0,
        anger: payload.parameters.anger || 0,
      };

      setSentimentData((prev) => {
        // Replace old entry for same session_id + source
        const filtered = prev.filter(
          (d) =>
            !(d.session_id === entry.session_id && d.source === entry.source)
        );
        return [...filtered, entry];
      });
    }
  }, [lastMessage]);


  // --- Build chart data whenever sentimentData changes ---
  useEffect(() => {
    if (!sentimentData.length) return;

    // Get latest session_id safely
    const currentSessionId = sentimentData[0]?.session_id;
    // const currentSessionId = sentimentData[sentimentData.length - 1].session_id;

    if (!currentSessionId) return;

    const sessionSentiment = sentimentData.filter(
      (d) => d.session_id === currentSessionId
    );

    const externalSentiment =
      (sessionSentiment.find((d) => d.source === "external") as SentimentEntry) || {
        sadness: 0,
        joy: 0,
        fear: 0,
        disgust: 0,
        anger: 0,
      };

    const internalSentiment =
      (sessionSentiment.find((d) => d.source === "internal") as SentimentEntry) || {
        sadness: 0,
        joy: 0,
        fear: 0,
        disgust: 0,
        anger: 0,
      };

    const newChartData: ChartDataEntry[] = [
      { group: "Customer", key: "Sadness", value: externalSentiment.sadness * 100 },
      { group: "Customer", key: "Joy", value: externalSentiment.joy * 100 },
      { group: "Customer", key: "Fear", value: externalSentiment.fear * 100 },
      { group: "Customer", key: "Disgust", value: externalSentiment.disgust * 100 },
      { group: "Customer", key: "Anger", value: externalSentiment.anger * 100 },
      { group: "Agent", key: "Sadness", value: internalSentiment.sadness * 100 },
      { group: "Agent", key: "Joy", value: internalSentiment.joy * 100 },
      { group: "Agent", key: "Fear", value: internalSentiment.fear * 100 },
      { group: "Agent", key: "Disgust", value: internalSentiment.disgust * 100 },
      { group: "Agent", key: "Anger", value: internalSentiment.anger * 100 },
    ];

    setChartData(newChartData);
  }, [sentimentData]);

  // --- Chart options ---
  const chartOptions = {
    title: "Sentiment Analysis",
    radar: { axes: { angle: "key", value: "value" }, alignment: "center" },
    data: { groupMapsTo: "group" },
    legend: { alignment: "center" },
    height: "400px",
  };

  return (
    <div className={widgetStyles.dashboardWidget}>
      {chartData.length > 0 ? (
        <RadarChart data={chartData} options={chartOptions} />
      ) : (
        <p>Loading sentiment data...</p>
      )}
    </div>
  );
};

export default SentimentProgress;
