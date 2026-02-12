import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import CharacterDetailPage from "./pages/CharacterDetailPage";
import SearchPage from "./pages/SearchPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

const sideAds = [
  { role: "Backend Developer", company: "Wanted", action: "지원하기" },
  { role: "Backend & 서버개발", company: "Wanted", action: "지원하기" },
  { role: "빌드파이프 담당", company: "Wanted", action: "지원하기" },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchRoute = location.pathname === "/";

  return (
    <div className="page">
      <aside className="side side-left">
        <div className="ad-card ad-card--stack">
          {sideAds.map((ad) => (
            <div className="ad-item" key={`${ad.role}-left`}>
              <div className="ad-logo">wanted</div>
              <div className="ad-role">{ad.role}</div>
              <div className="ad-company">{ad.company}</div>
              <button className="ad-button" type="button">
                {ad.action}
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <Link className="brand brand-link" to="/">
            <span className="brand-mark">
              <img src="/napolme-logo.png" alt="Napolme" />
            </span>
            <div>
              <div className="brand-name">나폴미</div>
              <div className="brand-sub">Napolme</div>
            </div>
          </Link>

          <nav className="menu">
            <button
              className={`menu-chip ${isSearchRoute ? "is-active" : ""}`}
              type="button"
              onClick={() => navigate("/")}
            >
              캐릭터 검색
            </button>
            <button className="menu-chip" type="button">
              랭킹
            </button>
            <button className="menu-chip" type="button">
              통계
            </button>
            <button className="menu-chip" type="button">
              데이터
            </button>
            <button className="menu-chip" type="button">
              스탯 비교
            </button>
            <button className="menu-chip" type="button">
              서버 비교
            </button>
          </nav>

          <button className="cta" type="button">
            AION2 웹 던스트
          </button>
        </header>

        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route
            path="/character/:serverId/:characterId"
            element={<CharacterDetailPage />}
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>

        <footer className="footer">
          <Link className="footer-link" to="/terms">
            이용 약관
          </Link>
          <Link className="footer-link" to="/privacy">
            개인정보 처리방침
          </Link>
          <span>문의: support@napolme</span>
          <span className="footer-copy">
            © 2026 napolme. All rights reserved.
          </span>
        </footer>
      </main>

      <aside className="side side-right">
        <div className="ad-card ad-card--stack">
          {sideAds.map((ad) => (
            <div className="ad-item" key={`${ad.role}-right`}>
              <div className="ad-logo">wanted</div>
              <div className="ad-role">{ad.role}</div>
              <div className="ad-company">{ad.company}</div>
              <button className="ad-button" type="button">
                {ad.action}
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
