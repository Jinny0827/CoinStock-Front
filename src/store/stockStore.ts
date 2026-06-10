import { create } from 'zustand'
import type { StockQuote } from '../types/stock'

interface StockStore {
  selectedSymbol: string
  selectedStock:  StockQuote | null   // 선택된 종목 전체 데이터 (이름·점수·수급 등)
  setSelectedSymbol: (symbol: string) => void
  setSelectedStock:  (stock: StockQuote | null) => void
}

export const useStockStore = create<StockStore>((set) => ({
  selectedSymbol: '005930.KS',
  selectedStock:  null,
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setSelectedStock:  (stock)  => set({ selectedStock: stock }),
}))
