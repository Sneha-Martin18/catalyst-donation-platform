import api from "../api/api";

const OptimizedRouteModal = ({ isOpen, onClose }) => {
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchRoute();
        }
    }, [isOpen]);

    const fetchRoute = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get("delivery/volunteer/optimized-route/");
            setRoute(response.data);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || "Failed to calculate optimized route.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '600px',
                width: '95%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>🚀 AI Optimized Route</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontWeight: 'bold'
                        }}
                    >✕</button>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner" style={{
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #10b981',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            margin: '0 auto 16px',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ color: '#64748b' }}>Calculating the most efficient path for you...</p>
                        <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
                    </div>
                )}

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        padding: '16px',
                        borderRadius: '8px',
                        color: '#dc2626',
                        marginBottom: '20px'
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {route && !loading && (
                    <div>
                        <div style={{
                            background: '#f0fdf4',
                            padding: '16px',
                            borderRadius: '12px',
                            marginBottom: '24px',
                            border: '1px solid #dcfce7'
                        }}>
                            <p style={{ margin: 0, color: '#166534', fontWeight: '500' }}>
                                Success! We've found the shortest path for your {route.total_stops - 1} tasks.
                            </p>
                        </div>

                        <div className="route-timeline">
                            {route.optimized_route.map((step, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginBottom: '16px',
                                    position: 'relative'
                                }}>
                                    {/* Connector Line */}
                                    {idx < route.optimized_route.length - 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            left: '11px',
                                            top: '24px',
                                            bottom: '-8px',
                                            width: '2px',
                                            background: '#e2e8f0'
                                        }}></div>
                                    )}

                                    {/* Circle Indicator */}
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: step.action === 'start' ? '#3b82f6' :
                                            step.action === 'pickup' ? '#f59e0b' : '#10b981',
                                        border: '4px solid #fff',
                                        boxShadow: '0 0 0 2px #e2e8f0',
                                        flexShrink: 0,
                                        zIndex: 1
                                    }}></div>

                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h4 style={{ margin: '0 0 4px 0', textTransform: 'capitalize', color: '#1e293b' }}>
                                                {step.action === 'start' ? 'Your Location' :
                                                    step.action === 'pickup' ? `Pick up: ${step.item_name}` :
                                                        `Deliver: ${step.item_name}`}
                                            </h4>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{idx + 1}</span>
                                        </div>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                                            {step.action === 'start' ? 'Starting Point' :
                                                step.action === 'pickup' ? `Collect item from donor` :
                                                    `Deliver to receiver`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flexGrow: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    color: '#64748b',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >Close Plan</button>
                            <button
                                onClick={() => window.open('https://www.google.com/maps', '_blank')}
                                style={{
                                    flexGrow: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#10b981',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >🚀 Open Maps</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OptimizedRouteModal;
