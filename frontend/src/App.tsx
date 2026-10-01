import { useCallback, useEffect, useState } from "react";

interface StatusResponse {
  StockLeft: number;
  HoldExpiresIn: number;
  QueuePosition: number;
  TotalPurchased: number;
}

function App() {
  const [userID, setUserID] = useState<string>(
    () => `user_${Math.ceil(Math.random() * 1000)}`,
  );
  const [status, setStatus] = useState<StatusResponse>({
    StockLeft: 20,
    HoldExpiresIn: 0,
    QueuePosition: 0,
    TotalPurchased: 0,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuying, setIsBuying] = useState<boolean>(false);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev].slice(0, 12));
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60).toString().padStart(2, "0");

    return `${mins}:${secs}`;
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/status?user_id=${userID}`);
        if (res.ok) {
          const data: StatusResponse = await res.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch status: ", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);

    return () => clearInterval(interval);
  }, [userID]);

  const handleBuy = async () => {
    setIsBuying(true);

    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userID }),
      });

      const data = await res.json();
      addLog(
        `Buy request: ${data.status} ${data.position ? `(#${data.position})` : ""}`,
      );
    } catch (error) {
      addLog(`Error: could not reach server!`);
    } finally {
      setIsBuying(false);
    }
  };

  const handlePayment = async () => {
    const txnID = `txn_${Math.ceil(Math.random() * 100000)}`;

    try {
      const res = await fetch("/api/webhook/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userID, payment_id: txnID }),
      });

      const data = await res.json();
      addLog(`Webhook ${txnID}: ${data}`);
    } catch (error) {
      addLog(`Webhook error: could not reach server!`);
    }
  };

  const isHolding = status.HoldExpiresIn > 0;
  const isQueued = status.QueuePosition > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sneaker Drop</h1>
            <p className="text-slate-400 text-sm">Flash Sale Engine</p>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
            <span className="text-sm text-slate-300">ID:</span>
            <span className="font-mono text-emerald-400 font-medium">
              {userID}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                Stock Left
              </span>
              <span className="text-3xl font-bold text-slate-800">
                {status.StockLeft}
                <span className="text-lg text-slate-400 font-medium">/20</span>
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                Your Pairs
              </span>
              <span className="text-3xl font-bold text-slate-800">
                {status.TotalPurchased}
                <span className="text-lg text-slate-400 font-medium">/2</span>
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${
              isHolding
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : isQueued
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            {isHolding ? (
              <>
                <span className="text-sm font-semibold uppercase tracking-wider mb-1">
                  Pair Held
                </span>
                <span className="text-2xl font-bold font-mono">
                  {formatTime(status.HoldExpiresIn)}
                </span>
                <span className="text-sm mt-1">
                  Complete payment before timer expires
                </span>
              </>
            ) : isQueued ? (
              <>
                <span className="text-sm font-semibold uppercase tracking-wider mb-1">
                  Waiting in Line
                </span>
                <span className="text-2xl font-bold">
                  Position #{status.QueuePosition}
                </span>
                <span className="text-sm mt-1">
                  You will automatically get a hold if stock frees up
                </span>
              </>
            ) : (
              <span className="font-medium">
                You are not holding any pairs.
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBuy}
              disabled={isBuying || isHolding || status.TotalPurchased >= 2}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors active:scale-[0.98]"
            >
              Request Buy
            </button>
            <button
              onClick={handlePayment}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors active:scale-[0.98] border border-slate-950"
            >
              Send Payment Webhook
            </button>
          </div>

          <button
            onClick={() =>
              setUserID(`user_${Math.floor(Math.random() * 1000)}`)
            }
            className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            Switch User Identity (For Testing)
          </button>

          <div className="bg-slate-900 rounded-xl p-4 shadow-inner">
            <div className="text-xs font-semibold text-slate-500 tracking-wider mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              SYSTEM LOGS
            </div>
            <div className="font-mono text-sm space-y-1 h-32 overflow-y-auto flex flex-col-reverse">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">
                  Waiting for events...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className="text-emerald-400/90 break-all leading-relaxed"
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
