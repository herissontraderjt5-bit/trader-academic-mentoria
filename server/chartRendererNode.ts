import { createCanvas } from '@napi-rs/canvas';

export interface ChartRenderOptions {
  candles: any[]; // Array of candles { open, high, low, close }
  support: number;
  resistance: number;
  width?: number;
  height?: number;
}

export function generateChartImageBase64Node(options: ChartRenderOptions): string {
  const { candles, support, resistance, width = 800, height = 400 } = options;
  if (!candles || candles.length === 0) return '';

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // TradingView Dark Theme Colors
  const bg = '#131722';
  const gridColor = '#1e222d';
  const textColor = '#787b86';
  const upColor = '#089981';
  const downColor = '#f23645';

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Find min and max price to scale
  let minPrice = Math.min(...candles.map((c) => c.low));
  let maxPrice = Math.max(...candles.map((c) => c.high));

  const candleRange = maxPrice - minPrice;
  const maxAllowedDistance = candleRange * 2; 

  if (support && support > 0 && support < minPrice && (minPrice - support) <= maxAllowedDistance) {
    minPrice = support;
  }
  if (resistance && resistance > 0 && resistance > maxPrice && (resistance - maxPrice) <= maxAllowedDistance) {
    maxPrice = resistance;
  }

  const padding = (maxPrice - minPrice) * 0.1;
  minPrice -= padding;
  maxPrice += padding;
  
  if (maxPrice === minPrice) maxPrice += 1; 

  const priceRange = maxPrice - minPrice;
  const numCandles = Math.min(candles.length, 50); 
  const displayCandles = candles.slice(-numCandles);
  const chartWidth = width - 75; 
  const candleWidth = chartWidth / numCandles; 
  const candleBodyWidth = Math.max(candleWidth * 0.65, 3); 

  // Draw Grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const gridSteps = 6;
  for (let i = 0; i <= gridSteps; i++) {
    const y = (height / gridSteps) * i;
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
  }
  ctx.stroke();

  // Y-axis separator
  ctx.beginPath();
  ctx.moveTo(chartWidth, 0);
  ctx.lineTo(chartWidth, height);
  ctx.stroke();

  const getPriceY = (price: number) => {
    return height - ((price - minPrice) / priceRange) * height;
  };

  // Draw Fibonacci Retracements
  const swingHigh = Math.max(...displayCandles.map((c) => c.high));
  const swingLow = Math.min(...displayCandles.map((c) => c.low));
  const isUptrend = displayCandles[0].close < displayCandles[displayCandles.length - 1].close;
  
  const fibLevels = [
    { level: 0, color: '#787b86' },
    { level: 0.236, color: '#f23645' },
    { level: 0.382, color: '#ff9800' },
    { level: 0.5, color: '#4caf50' },
    { level: 0.618, color: '#089981' },
    { level: 0.786, color: '#2962ff' },
    { level: 1, color: '#787b86' },
  ];

  fibLevels.forEach(({ level, color }) => {
    const fibPrice = isUptrend 
      ? swingHigh - (swingHigh - swingLow) * level 
      : swingLow + (swingHigh - swingLow) * level;

    const y = getPriceY(fibPrice);
    
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = color;
    ctx.font = '11px Arial';
    ctx.fillText(`${level} (${fibPrice.toFixed(5)})`, 5, y - 5);
  });

  // Draw Support / Resistance lines
  if (resistance) {
    const y = getPriceY(resistance);
    ctx.strokeStyle = downColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();
  }

  if (support) {
    const y = getPriceY(support);
    ctx.strokeStyle = upColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();
  }

  // Draw Candles
  displayCandles.forEach((candle, i) => {
    const x = i * candleWidth + (candleWidth / 2);
    
    const openY = getPriceY(candle.open);
    const closeY = getPriceY(candle.close);
    const highY = getPriceY(candle.high);
    const lowY = getPriceY(candle.low);
    
    const isUp = candle.close >= candle.open; 
    const color = isUp ? upColor : downColor;

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    // Body
    ctx.fillStyle = color;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(openY - closeY), 1); 
    
    ctx.fillRect(x - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight);
    
    ctx.strokeStyle = color;
    ctx.strokeRect(x - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight);
  });

  // Draw y-axis labels
  ctx.fillStyle = textColor;
  ctx.font = '12px Arial';
  for (let i = 0; i <= gridSteps; i++) {
    const y = (height / gridSteps) * i;
    const priceVal = maxPrice - (priceRange * (i / gridSteps));
    const decimals = priceVal < 10 ? 5 : 2; 
    ctx.fillText(priceVal.toFixed(decimals), chartWidth + 8, y === 0 ? 15 : (y === height ? height - 5 : y + 4));
  }

  // Add current price tag
  if (displayCandles.length > 0) {
     const lastCandle = displayCandles[displayCandles.length - 1];
     const lastPriceY = getPriceY(lastCandle.close);
     const isLastUp = lastCandle.close >= lastCandle.open;
     const tagColor = isLastUp ? upColor : downColor;
     
     ctx.fillStyle = tagColor;
     ctx.fillRect(chartWidth, lastPriceY - 10, 75, 20);
     
     ctx.fillStyle = '#ffffff';
     const decimals = lastCandle.close < 10 ? 5 : 2;
     ctx.fillText(lastCandle.close.toFixed(decimals), chartWidth + 8, lastPriceY + 4);
  }

  // @napi-rs/canvas supports toDataURL directly
  return canvas.toDataURL('image/png');
}
