// BeautyM - 테마 시스템
// 여러 브랜드 스타일을 정의하고 쉽게 전환 가능

export interface BrandTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;       // 메인 포인트 컬러
    primaryLight: string;  // 메인 밝은 버전 (배경용)
    primaryDark: string;   // 메인 어두운 버전 (호버용)
    secondary: string;     // 서브 컬러
    secondaryLight: string;
    accent: string;        // 강조 컬러
    text: string;          // 기본 텍스트
    textLight: string;     // 보조 텍스트
    textOnPrimary: string; // 메인 컬러 위 텍스트
    background: string;    // 기본 배경
    surface: string;       // 카드/패널 배경
    surfaceHover: string;  // 카드 호버 배경
    border: string;        // 기본 보더
    borderLight: string;   // 연한 보더
    sidebar: string;       // 사이드바 배경
    sidebarText: string;   // 사이드바 텍스트
    sidebarActive: string; // 사이드바 활성 메뉴
    sidebarHover: string;  // 사이드바 호버
  };
  logo: {
    icon: string;          // 로고 아이콘 (이모지 또는 SVG path)
    brandColor: string;    // "Beauty" 텍스트 색상
    accentColor: string;   // "M" 텍스트 색상
  };
  heroGradient: string;    // 히어로 배경 그라데이션
  cardShadow: string;      // 카드 그림자
  buttonRadius: string;    // 버튼 border-radius
}

export const BRAND_THEMES: Record<string, BrandTheme> = {
  'rose-gold': {
    id: 'rose-gold',
    name: '로즈골드',
    description: '고급스러운 여성적 프리미엄',
    colors: {
      primary: '#B76E79',
      primaryLight: '#F5E6E8',
      primaryDark: '#9E5A64',
      secondary: '#D4A89A',
      secondaryLight: '#FDF2EF',
      accent: '#C9956B',
      text: '#2D2D2D',
      textLight: '#6B7280',
      textOnPrimary: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceHover: '#FDF8F8',
      border: '#E5D5D8',
      borderLight: '#F5E6E8',
      sidebar: '#FFFFFF',
      sidebarText: '#4B5563',
      sidebarActive: '#B76E79',
      sidebarHover: '#F5E6E8',
    },
    logo: {
      icon: '🌸',
      brandColor: '#2D2D2D',
      accentColor: '#B76E79',
    },
    heroGradient: 'linear-gradient(135deg, #FFFFFF 0%, #FDF2EF 50%, #F5E6E8 100%)',
    cardShadow: '0 4px 20px rgba(183, 110, 121, 0.08)',
    buttonRadius: '9999px',
  },

  'deep-violet': {
    id: 'deep-violet',
    name: '딥바이올렛',
    description: '세련된 전문가 이미지',
    colors: {
      primary: '#7C3AED',
      primaryLight: '#EDE9FE',
      primaryDark: '#6D28D9',
      secondary: '#A78BFA',
      secondaryLight: '#F5F3FF',
      accent: '#8B5CF6',
      text: '#1F2937',
      textLight: '#6B7280',
      textOnPrimary: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceHover: '#FAFAFE',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      sidebar: '#FFFFFF',
      sidebarText: '#4B5563',
      sidebarActive: '#7C3AED',
      sidebarHover: '#EDE9FE',
    },
    logo: {
      icon: '💎',
      brandColor: '#1F2937',
      accentColor: '#7C3AED',
    },
    heroGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 50%, #EDE9FE 100%)',
    cardShadow: '0 4px 20px rgba(124, 58, 237, 0.08)',
    buttonRadius: '12px',
  },

  'soft-blush': {
    id: 'soft-blush',
    name: '소프트 블러쉬',
    description: '부드럽고 따뜻한 뷰티',
    colors: {
      primary: '#E8A0BF',
      primaryLight: '#FFF0F5',
      primaryDark: '#D17DA0',
      secondary: '#F0C5D4',
      secondaryLight: '#FFF5F9',
      accent: '#F4B8CC',
      text: '#3D3D3D',
      textLight: '#888888',
      textOnPrimary: '#FFFFFF',
      background: '#FFFBFD',
      surface: '#FFFFFF',
      surfaceHover: '#FFF5F8',
      border: '#F0D4DE',
      borderLight: '#FFF0F5',
      sidebar: '#FFFFFF',
      sidebarText: '#4B5563',
      sidebarActive: '#E8A0BF',
      sidebarHover: '#FFF0F5',
    },
    logo: {
      icon: '🌷',
      brandColor: '#3D3D3D',
      accentColor: '#E8A0BF',
    },
    heroGradient: 'linear-gradient(135deg, #FFFBFD 0%, #FFF5F9 50%, #FFF0F5 100%)',
    cardShadow: '0 4px 20px rgba(232, 160, 191, 0.1)',
    buttonRadius: '9999px',
  },

  'dark-luxury': {
    id: 'dark-luxury',
    name: '다크 럭셔리',
    description: '하이엔드 럭셔리',
    colors: {
      primary: '#C9A96E',
      primaryLight: '#F8F0E3',
      primaryDark: '#B08D4F',
      secondary: '#D4B896',
      secondaryLight: '#FDF8F0',
      accent: '#E6C88A',
      text: '#1A1A2E',
      textLight: '#6B6B80',
      textOnPrimary: '#1A1A2E',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceHover: '#FDFAF5',
      border: '#E8DFD0',
      borderLight: '#F5F0E8',
      sidebar: '#FFFFFF',
      sidebarText: '#4B5563',
      sidebarActive: '#C9A96E',
      sidebarHover: '#F8F0E3',
    },
    logo: {
      icon: '✨',
      brandColor: '#1A1A2E',
      accentColor: '#C9A96E',
    },
    heroGradient: 'linear-gradient(135deg, #FFFFFF 0%, #FDF8F0 50%, #F8F0E3 100%)',
    cardShadow: '0 4px 20px rgba(201, 169, 110, 0.08)',
    buttonRadius: '8px',
  },

  'ocean-teal': {
    id: 'ocean-teal',
    name: '오션 틸',
    description: '자연스럽고 신선한 느낌',
    colors: {
      primary: '#2DD4BF',
      primaryLight: '#E6FFFA',
      primaryDark: '#14B8A6',
      secondary: '#5EEAD4',
      secondaryLight: '#F0FDFA',
      accent: '#2DD4BF',
      text: '#1A2F33',
      textLight: '#5F7A7E',
      textOnPrimary: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceHover: '#F0FDFA',
      border: '#CCE8E4',
      borderLight: '#E6FFFA',
      sidebar: '#FFFFFF',
      sidebarText: '#4B5563',
      sidebarActive: '#2DD4BF',
      sidebarHover: '#E6FFFA',
    },
    logo: {
      icon: '🍃',
      brandColor: '#1A2F33',
      accentColor: '#2DD4BF',
    },
    heroGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 50%, #E6FFFA 100%)',
    cardShadow: '0 4px 20px rgba(45, 212, 191, 0.08)',
    buttonRadius: '12px',
  },
};

export const DEFAULT_THEME_ID = 'rose-gold';

export function getTheme(themeId: string): BrandTheme {
  return BRAND_THEMES[themeId] || BRAND_THEMES[DEFAULT_THEME_ID];
}

export function getThemeList(): Array<{ id: string; name: string; description: string; primary: string }> {
  return Object.values(BRAND_THEMES).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    primary: t.colors.primary,
  }));
}
