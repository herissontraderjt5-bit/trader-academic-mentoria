export interface ChartRenderOptions {
  candles: any[]; // Array of candles { open, high, low, close }
  support: number;
  resistance: number;
  width?: number;
  height?: number;
}

export function generateChartImageBase64(options: ChartRenderOptions): string {
  const { candles, support, resistance, width = 600, height = 400 } = options;
  if (!candles || candles.length === 0) return '';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#0B0E14';
  ctx.fillRect(0, 0, width, height);

  // Find min and max price to scale
  let minPrice = Math.min(...candles.map((c) => c.low));
  let maxPrice = Math.max(...candles.map((c) => c.high));

  // Ensure support and resistance are visible on chart
  if (support && support < minPrice) minPrice = support;
  if (resistance && resistance > maxPrice) maxPrice = resistance;

  // Add padding
  const padding = (maxPrice - minPrice) * 0.1;
  minPrice -= padding;
  maxPrice += padding;
  
  if (maxPrice === minPrice) maxPrice += 1; // Prevent division by zero

  const priceRange = maxPrice - minPrice;
  const numCandles = Math.min(candles.length, 50); // Show last 50 candles max
  const displayCandles = candles.slice(-numCandles);
  const candleWidth = (width - 40) / numCandles; // 40px for y-axis

  // Draw Grid
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const y = (height / 5) * i;
    ctx.moveTo(0, y);
    ctx.lineTo(width - 40, y);
  }
  ctx.stroke();

  const getPriceY = (price: number) => {
    return height - ((price - minPrice) / priceRange) * height;
  };

  // Draw Support / Resistance lines
  if (resistance) {
    const y = getPriceY(resistance);
    ctx.strokeStyle = '#ef4444'; // Red for resistance
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.font = '12px Arial';
    ctx.fillText('RESISTANCE', width - 110, y - 5);
  }

  if (support) {
    const y = getPriceY(support);
    ctx.strokeStyle = '#22c55e'; // Green for support
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#22c55e';
    ctx.font = '12px Arial';
    ctx.fillText('SUPPORT', width - 90, y - 5);
  }

  // Draw Candles
  displayCandles.forEach((candle, i) => {
    const x = i * candleWidth + (candleWidth / 2);
    
    const openY = getPriceY(candle.open);
    const closeY = getPriceY(candle.close);
    const highY = getPriceY(candle.high);
    const lowY = getPriceY(candle.low);
    
    const isUp = candle.close > candle.open;
    const color = isUp ? '#22c55e' : '#ef4444';

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
    const bodyHeight = Math.max(Math.abs(openY - closeY), 1); // at least 1px
    ctx.fillRect(x - candleWidth * 0.35, bodyTop, candleWidth * 0.7, bodyHeight);
  });

  // Draw y-axis labels
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '10px Arial';
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    const priceVal = maxPrice - (priceRange * (i / 5));
    ctx.fillText(priceVal.toFixed(5), width - 35, y === 0 ? 10 : y);
  }

  return canvas.toDataURL('image/png');
}
