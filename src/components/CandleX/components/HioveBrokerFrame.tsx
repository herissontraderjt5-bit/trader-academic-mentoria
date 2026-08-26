import React, { useState } from "react";
import { TradeRecord } from "../../../types";

interface HioveBrokerFrameProps {
  activeTicker: string;
  onRecordTrade?: (trade: Omit<TradeRecord, "id" | "timestamp" | "result" | "pnl">) => void;
  lastAiDirection?: "CALL" | "PUT" | "NEUTRAL";
  currentPrice?: number;
}

export const HioveBrokerFrame: React.FC<HioveBrokerFrameProps> = ({
  activeTicker,
}) => {
  const [iframeKey] = useState<number>(0);

  const hioveUrl = `https://app.hiove.com/traderoom?ticker=${activeTicker}`;

  return (
    <div className="relative flex-1 w-full h-full bg-[#0B0E14] overflow-hidden">
      <iframe
        key={iframeKey}
        id="hiove-traderoom-iframe"
        src={hioveUrl}
        title={`Hiove Traderoom ${activeTicker}`}
        className="w-full h-full border-0 bg-[#0B0E14]"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

