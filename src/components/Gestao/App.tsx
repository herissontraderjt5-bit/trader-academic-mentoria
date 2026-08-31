import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { Management2x1View } from './components/views/Management2x1View';
import { Management5x2View } from './components/views/Management5x2View';
import { MultiMarketManagementView } from './components/views/MultiMarketManagementView';
import { CalendarView } from './components/views/CalendarView';
import { TransactionsView } from './components/views/TransactionsView';
import { SettingsView } from './components/views/SettingsView';

// Modals
import { NewOperationModal } from './components/modals/NewOperationModal';
import { InitialSetupModal } from './components/modals/InitialSetupModal';
import { DayDetailsModal } from './components/modals/DayDetailsModal';
import { SessionSummaryModal } from './components/modals/SessionSummaryModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { AuthModal } from './components/modals/AuthModal';

import { Operation, DailySummary } from './types';
import { getTodayDateString } from './utils/formatters';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isNewOpOpen, setIsNewOpOpen] = useState<boolean>(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [defaultDateForNewOp, setDefaultDateForNewOp] = useState<string | undefined>(undefined);

  const [isInitialSetupOpen, setIsInitialSetupOpen] = useState<boolean>(false);
  const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  const [selectedDayDetails, setSelectedDayDetails] = useState<DailySummary | null>(null);
  const [deleteOpId, setDeleteOpId] = useState<string | null>(null);

  const { deleteOperation } = useTrading();

  const handleOpenNewOp = (date?: string) => {
    setDefaultDateForNewOp(date || getTodayDateString());
    setEditingOperation(null);
    setIsNewOpOpen(true);
  };

  const handleEditOp = (op: Operation) => {
    setEditingOperation(op);
    setIsNewOpOpen(true);
  };

  const handleDeleteOp = (id: string) => {
    setDeleteOpId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteOpId) {
      deleteOperation(deleteOpId);
      setDeleteOpId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenNewOp={() => handleOpenNewOp()}
        onOpenSessionSummary={() => setIsSessionSummaryOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenNewOp={() => handleOpenNewOp()}
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewOp={() => handleOpenNewOp()}
              onNavigate={setActiveTab}
              onSelectDay={(day) => setSelectedDayDetails(day)}
            />
          )}

          {activeTab === 'management2x1' && <Management2x1View />}

          {activeTab === 'management5x2' && <Management5x2View />}

          {activeTab === 'managementMulti' && <MultiMarketManagementView />}

          {activeTab === 'calendar' && (
            <CalendarView
              onSelectDay={(day) => setSelectedDayDetails(day)}
              onOpenNewOp={() => handleOpenNewOp()}
            />
          )}

          {activeTab === 'transactions' && <TransactionsView />}

          {activeTab === 'settings' && (
            <SettingsView onOpenInitialSetup={() => setIsInitialSetupOpen(true)} />
          )}
        </main>
      </div>

      {/* Modals Container */}
      <NewOperationModal
        isOpen={isNewOpOpen}
        onClose={() => setIsNewOpOpen(false)}
        initialData={editingOperation || undefined}
        defaultDate={defaultDateForNewOp}
      />

      <InitialSetupModal
        isOpen={isInitialSetupOpen}
        onClose={() => setIsInitialSetupOpen(false)}
      />

      <DayDetailsModal
        isOpen={selectedDayDetails !== null}
        onClose={() => setSelectedDayDetails(null)}
        daySummary={selectedDayDetails}
        onNewOpForDate={(date) => {
          setSelectedDayDetails(null);
          handleOpenNewOp(date);
        }}
        onEditOp={(op) => {
          setSelectedDayDetails(null);
          handleEditOp(op);
        }}
        onDeleteOp={(id) => {
          setSelectedDayDetails(null);
          handleDeleteOp(id);
        }}
      />

      <SessionSummaryModal
        isOpen={isSessionSummaryOpen}
        onClose={() => setIsSessionSummaryOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={deleteOpId !== null}
        onClose={() => setDeleteOpId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Operação"
        message="Tem certeza que deseja excluir esta operação? Esta ação recalculará imediatamente sua banca, lucros e assertividade."
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TradingProvider>
        <MainLayout />
      </TradingProvider>
    </AuthProvider>
  );
}
