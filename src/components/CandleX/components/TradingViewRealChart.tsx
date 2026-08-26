import React, { useMemo } from "react";

interface TradingViewRealChartProps {
  ticker: string;
  interval: string;
}

export const TradingViewRealChart: React.FC<TradingViewRealChartProps> = ({
  ticker,
  interval,
}) => {
  // Map app ticker to TradingView symbol
  const getSymbol = (rawTicker: string) => {
    const clean = rawTicker.toUpperCase().replace(/_OTC$/, "");
    if (clean === "ETHUSDT") return "BINANCE:ETHUSDT";
    if (clean === "XRPUSDT") return "BINANCE:XRPUSDT";
    if (clean === "SOLUSDT" || clean === "SOLANAUSDT") return "BINANCE:SOLUSDT";
    if (clean === "BTCUSDT") return "BINANCE:BTCUSDT";
    if (clean === "BNBUSDT") return "BINANCE:BNBUSDT";
    if (clean === "EURUSD") return "FX:EURUSD";
    if (clean === "AUDUSD") return "FX:AUDUSD";
    if (clean === "EURGBP") return "FX:EURGBP";
    if (clean === "GBPCHF") return "FX:GBPCHF";
    if (clean === "GBPJPY") return "FX:GBPJPY";
    if (clean === "GBPUSD") return "FX:GBPUSD";
    if (clean === "NZDUSD") return "FX:NZDUSD";
    if (clean === "USDCAD") return "FX:USDCAD";
    if (clean === "USDCHF") return "FX:USDCHF";
    if (clean === "USDJPY") return "FX:USDJPY";
    if (clean.includes("USDT")) return `BINANCE:${clean}`;
    return `FX:${clean}`;
  };

  const getTvInterval = (rawInterval: string) => {
    const lower = rawInterval.toLowerCase();
    if (lower === "1m" || lower === "m1") return "1";
    if (lower === "5m" || lower === "m5") return "5";
    if (lower === "15m" || lower === "m15") return "15";
    if (lower === "30m" || lower === "m30") return "30";
    if (lower === "1h" || lower === "h1") return "60";
    return "1";
  };

  const symbol = getSymbol(ticker);
  const tvInterval = getTvInterval(interval);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      frameElementId: "tradingview_embed_chart",
      symbol: symbol,
      interval: tvInterval,
      hidesidetoolbar: "0",
      symboledit: "1",
      saveimage: "0",
      toolbarbg: "0B0E14",
      theme: "dark",
      style: "1",
      timezone: "America/Sao_Paulo",
      locale: "br",
      backgroundColor: "rgba(11, 14, 20, 1)",
      gridColor: "rgba(255, 255, 255, 0.04)",
      hide_side_toolbar: "0",
      allow_symbol_change: "1",
      details: "1",
      hotlist: "0",
      calendar: "0",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tvInterval]);

  return (
    <div className="relative w-full h-full bg-[#0B0E14] overflow-hidden flex flex-col">
      <iframe
        key={`${symbol}-${tvInterval}`}
        id="tradingview_advanced_chart_frame"
        src={embedUrl}
        title={`TradingView Chart ${symbol}`}
        className="w-full h-full flex-1 border-0 bg-[#0B0E14]"
        style={{ minHeight: "350px" }}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

