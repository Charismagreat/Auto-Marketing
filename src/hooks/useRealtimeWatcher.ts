'use client';

import { useEffect, useRef } from 'react';
import { onUserDataChanged } from '@/lib/egdesk-helpers';

interface UseRealtimeWatcherOptions {
  tableName?: string;
  kind?: 'schema' | 'data';
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * ⚡ 이지데스크 공식 DB Watcher(SSE) 실시간 구독 훅 (Zero-Polling)
 *
 * 테이블에 INSERT / UPDATE / DELETE 변경이 발생하면 0.05초 만에 콜백(onInvalidate)을 호출합니다.
 *
 * @param onInvalidate 변경 발생 시 실행할 데이터 리패치 함수
 * @param options 감시 대상 테이블명 및 디바운스 설정
 */
export function useRealtimeWatcher(
  onInvalidate: () => void | Promise<void>,
  options: UseRealtimeWatcherOptions = {}
) {
  const { tableName, kind, debounceMs = 200, enabled = true } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(onInvalidate);

  useEffect(() => {
    callbackRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    if (!enabled) return;

    const unsub = onUserDataChanged(
      (event) => {
        // 테이블명이 지정된 경우 해당 테이블 일치 여부 확인
        if (tableName && event.tableName && event.tableName !== tableName) {
          return;
        }

        // 디바운스 적용하여 빠른 연속 변경 시 1회만 리패치
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          callbackRef.current?.();
        }, debounceMs);
      },
      { tableName, kind }
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      unsub();
    };
  }, [tableName, kind, debounceMs, enabled]);
}
