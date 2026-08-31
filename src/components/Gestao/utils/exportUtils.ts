import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Operation, MonthConfig, MonthlyStats, DailySummary, Transaction } from '../types';
import { formatCurrency, formatPercent, formatDateBR, formatSecondsToTime } from './formatters';

/**
 * Export all month data to a styled Excel (.xlsx) workbook with multiple sheets
 */
export function exportToExcel(
  config: MonthConfig,
  stats: MonthlyStats,
  operations: Operation[],
  dailySummaries: DailySummary[],
  transactions: Transaction[]
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumo Geral
  const summaryData = [
    ['TRADER ACADEMIC - GESTÃO DE CAPITAL', ''],
    ['Relatório Mensal de Performance', config.name],
    ['', ''],
    ['Métrica', 'Valor'],
    ['Banca Inicial', formatCurrency(stats.initialBankroll)],
    ['Total Depósitos', formatCurrency(stats.totalDeposits)],
    ['Total Saques', formatCurrency(stats.totalWithdrawals)],
    ['Lucro Operacional Líquido', formatCurrency(stats.netProfit)],
    ['Banca Atual', formatCurrency(stats.currentBankroll)],
    ['Meta Mensal', formatCurrency(stats.monthlyGoalAmount)],
    ['Progresso da Meta', `${stats.goalProgressPercent}%`],
    ['Taxa de Assertividade', `${stats.winRate}%`],
    ['Total de Operações', stats.totalOperations],
    ['Wins', stats.wins],
    ['Losses', stats.losses],
    ['Empates', stats.empates],
    ['Melhor Sequência de Wins', stats.bestWinStreak],
    ['Maior Sequência de Losses', stats.worstLossStreak],
    ['Tempo Operacional Total', formatSecondsToTime(stats.totalOperationalTimeSeconds)],
    ['Melhor Ativo', stats.bestAsset ? `${stats.bestAsset.asset} (${formatCurrency(stats.bestAsset.profit)})` : 'N/A'],
    ['Melhor Estratégia', stats.bestStrategy ? `${stats.bestStrategy.strategy} (${formatCurrency(stats.bestStrategy.profit)})` : 'N/A'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Geral');

  // Sheet 2: Operações
  const opsData = [
    ['ID', 'Data', 'Horário', 'Ativo', 'Mercado', 'Direção', 'Valor Entrada (R$)', 'Payout (%)', 'Tempo Exp.', 'Estratégia', 'Resultado', 'Lucro/Prejuízo (R$)', 'Observações'],
    ...operations.map((op) => [
      op.id,
      formatDateBR(op.date),
      op.time,
      op.asset,
      op.marketType,
      op.direction,
      op.investment,
      `${op.payout}%`,
      op.expiration,
      op.strategy,
      op.result,
      op.profit,
      op.notes || '',
    ]),
  ];
  const wsOps = XLSX.utils.aoa_to_sheet(opsData);
  XLSX.utils.book_append_sheet(wb, wsOps, 'Operações');

  // Sheet 3: Gestão Diária (1 a 31)
  const dailyData = [
    ['Dia', 'Data', 'Ativo 1', 'Ativo 2', 'Ativo 3', 'Payout Médio', 'Resultado Financeiro (R$)', 'WIN', 'LOSS', 'EMPATE', 'Total Ops', 'Tempo Operacional'],
    ...dailySummaries.map((d) => [
      `Dia ${String(d.dayNumber).padStart(2, '0')}`,
      formatDateBR(d.date),
      d.assets[0] || '-',
      d.assets[1] || '-',
      d.assets[2] || '-',
      d.averagePayout ? `${d.averagePayout}%` : '-',
      d.financialResult,
      d.wins,
      d.losses,
      d.empates,
      d.totalOperations,
      formatSecondsToTime(d.operationalTimeSeconds),
    ]),
  ];
  const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Gestão Diária');

  // Sheet 4: Saques e Depósitos
  const transData = [
    ['Tipo', 'Data', 'Valor (R$)', 'Corretora', 'Observações'],
    ...transactions.map((t) => [
      t.type === 'DEPOSIT' ? 'DEPÓSITO' : 'SAQUE',
      formatDateBR(t.date),
      t.amount,
      t.broker,
      t.notes || '',
    ]),
  ];
  const wsTrans = XLSX.utils.aoa_to_sheet(transData);
  XLSX.utils.book_append_sheet(wb, wsTrans, 'Saques e Depósitos');

  // Generate file and trigger download
  const fileName = `TraderAcademic_${config.id}_GestaoDeCapital.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export executive PDF summary report
 */
export function exportToPDF(
  config: MonthConfig,
  stats: MonthlyStats,
  operations: Operation[],
  dailySummaries: DailySummary[]
) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  // Orange accent line
  doc.setFillColor(249, 115, 22); // orange-500
  doc.rect(0, 38, 210, 3, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADER ACADEMIC', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Gestão Profissional de Capital • Opções Binárias', 14, 25);
  doc.text(`Mês: ${config.name} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);

  // Financial Overview Cards Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Resumo da Banca & Performance', 14, 50);

  const startY = 56;
  const metrics = [
    { label: 'Banca Inicial', value: formatCurrency(stats.initialBankroll) },
    { label: 'Banca Atual', value: formatCurrency(stats.currentBankroll) },
    { label: 'Lucro Operacional', value: formatCurrency(stats.netProfit) },
    { label: 'Meta Mensal', value: `${formatCurrency(stats.monthlyGoalAmount)} (${stats.goalProgressPercent}%)` },
    { label: 'Assertividade', value: `${stats.winRate}%` },
    { label: 'Placar (W/L/E)', value: `${stats.wins}W - ${stats.losses}L - ${stats.empates}E` },
    { label: 'Total Operações', value: `${stats.totalOperations}` },
    { label: 'Tempo Operacional', value: formatSecondsToTime(stats.totalOperationalTimeSeconds) },
  ];

  autoTable(doc, {
    startY,
    head: [['Métrica', 'Resultado', 'Métrica', 'Resultado']],
    body: [
      [metrics[0].label, metrics[0].value, metrics[1].label, metrics[1].value],
      [metrics[2].label, metrics[2].value, metrics[3].label, metrics[3].value],
      [metrics[4].label, metrics[4].value, metrics[5].label, metrics[5].value],
      [metrics[6].label, metrics[6].value, metrics[7].label, metrics[7].value],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // Table of recent operations
  const nextY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Extrato de Operações Recentes', 14, nextY);

  const opsRows = operations.slice(-25).reverse().map((op) => [
    formatDateBR(op.date),
    op.time,
    op.asset,
    op.marketType,
    op.direction,
    formatCurrency(op.investment),
    `${op.payout}%`,
    op.strategy,
    op.result,
    formatCurrency(op.profit, true),
  ]);

  autoTable(doc, {
    startY: nextY + 6,
    head: [['Data', 'Hora', 'Ativo', 'Mercado', 'Dir.', 'Entrada', 'Payout', 'Estratégia', 'Resultado', 'Lucro/Prej.']],
    body: opsRows,
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    didParseCell: (data) => {
      if (data.column.index === 8) {
        if (data.cell.raw === 'WIN') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'LOSS') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'EMPATE') {
          data.cell.styles.textColor = [234, 179, 8];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer disclaimer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Trader Academic – Ferramenta de gestão de capital e controle de risco. Não garante lucros futuros.',
      14,
      290
    );
    doc.text(`Página ${i} de ${pageCount}`, 180, 290);
  }

  const fileName = `TraderAcademic_${config.id}_Relatorio.pdf`;
  doc.save(fileName);
}
