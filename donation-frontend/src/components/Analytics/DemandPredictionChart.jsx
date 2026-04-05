import { useState, useEffect } from "react";
import Chart from "react-apexcharts";

const DemandPredictionChart = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem("access");

                const response = await fetch(
                    `http://127.0.0.1:8000/api/analytics/admin/analytics/predictions/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch predictions");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPredictions();
    }, []);

    const categories = data ? data.predictions.map((p) => p.category) : [];
    const predictionData = data ? data.predictions.map((p) => p.predicted_quantity) : [];
    const confidenceData = data ? data.predictions.map((p) => (p.confidence_score * 100).toFixed(1)) : [];

    const chartOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
        },
        title: {
            text: `Predicted Demand for ${data?.target_month || "Next Month"}`,
            align: 'center',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#263238'
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: "50%",
                dataLabels: {
                    position: 'top',
                },
            },
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val;
            },
            offsetY: -20,
            style: {
                fontSize: '12px',
                colors: ["#304758"]
            }
        },
        xaxis: {
            categories,
            position: 'top',
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            },
            crosshairs: {
                fill: {
                    type: 'gradient',
                    gradient: {
                        colorFrom: '#D8E3F0',
                        colorTo: '#BED1E6',
                        stops: [0, 100],
                        opacityFrom: 0.4,
                        opacityTo: 0.5,
                    }
                }
            },
            tooltip: {
                enabled: true,
            }
        },
        yaxis: {
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false,
            },
            labels: {
                show: false,
                formatter: function (val) {
                    return val;
                }
            }
        },
        tooltip: {
            y: {
                formatter: function (val, { seriesIndex, dataPointIndex, w }) {
                    if (seriesIndex === 0) return val + " items";
                    return val + "% confidence";
                }
            }
        },
        colors: ['#008FFB', '#00E396'],
    };

    const chartSeries = [
        { name: "Predicted Quantity", data: predictionData },
        { name: "Confidence Score %", data: confidenceData }
    ];

    return (
        <div style={{
            padding: "24px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            marginBottom: "24px"
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#333' }}>AI Demand Forecasting</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Machine learning analysis of historical requests
                    </p>
                </div>
                {data?.target_month && (
                    <span style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        Target: {data.target_month}
                    </span>
                )}
            </div>

            {loading && <p>Analyzing historical patterns…</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loading && !error && data?.predictions.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Not enough historical data yet to generate accurate predictions.
                </p>
            )}

            {!loading && !error && data?.predictions.length > 0 && (
                <>
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        height={350}
                    />
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#555',
                        borderLeft: '4px solid #008FFB'
                    }}>
                        <strong>Pro-tip:</strong> High confidence scores (near 100%) indicate stable category trends. Low scores suggest volatile demand or insufficient data.
                    </div>
                </>
            )}
        </div>
    );
};

export default DemandPredictionChart;
