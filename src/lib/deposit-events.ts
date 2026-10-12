/**
 * ⚡ 무통장 입금 실시간 이벤트 스트림 허브 (deposit-events.ts)
 */

type DepositEventListener = (event: any) => void;

class DepositEventManager {
  private listeners: Set<DepositEventListener> = new Set();

  public subscribe(listener: DepositEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(event: {
    type: 'DEPOSIT_COMPLETED' | 'DEPOSIT_CREATED' | 'DEPOSIT_FAILED';
    requestId: string;
    userEmail: string;
    amountKrw: number;
    tokensCredited: number;
    depositorName?: string;
  }) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[DepositEventManager] Listener error:', err);
      }
    }
  }
}

export const depositEvents = new DepositEventManager();
