import { useEffect } from 'react';

/**
 * 페이지 진입 시 document.title 설정. 언마운트 시 이전 타이틀 복원.
 *
 * 사용:
 *   usePageTitle('Journal · FitCoach');
 *
 * 규칙(이 프로젝트):
 *   - 홈만 풀 태그라인: "FitCoach — 매일의 strength 저널"
 *   - 그 외 각 페이지: "{페이지명} · FitCoach"
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
