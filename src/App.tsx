import { useEffect } from "react";
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

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_CLIENT = "ca-pub-6520329273313822";
const AD_SLOT = "2232052568"; /* napolme */

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchRoute = location.pathname === "/";

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  }, []);

  return (
    <div className="page">
      <aside className="side side-left">
        <div className="ad-card ad-card--stack ad-card--adsense">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={AD_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
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
        <div className="ad-card ad-card--stack ad-card--adsense">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={AD_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </aside>
    </div>
  );
}
