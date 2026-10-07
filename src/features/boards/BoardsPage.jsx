import { useNavigate, useSearchParams } from "react-router-dom";
import { td } from "../../lib/date.js";
import { boardStartOfWeek } from "./boardHelpers.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { Tabs } from "../../components/Tabs.jsx";
import { AccessLimited } from "../../components/AccessLimited.jsx";
import { WeeklyBoardGrid } from "./weekly/WeeklyBoardGrid.jsx";
import { MonthBoardGrid } from "./month/MonthBoardGrid.jsx";
import { ResourceBoardPage } from "./resource/ResourceBoardPage.jsx";
import { BoardConfigPage } from "./config/BoardConfigPage.jsx";

const BASE_TABS = [
  { key: "weekly", label: "Principal" },
  { key: "month", label: "Mes" },
  { key: "walker", label: "Caminador" },
  { key: "paddock", label: "Paddocks" },
];

const CONFIG_TAB = { key: "config", label: "Configurar" };

// Ports rBoards (public/legacy-app.js:1348-1357). Las cuatro primeras pestañas siguen sin
// gate, igual que en legacy (ver el razonamiento en routes.jsx); "Configurar" sí lo lleva:
// escribir la configuración de la pizarra exige el permiso `stable`, así que a un miembro
// normal la pantalla se le abría y la escritura fallaba en silencio.
export function BoardsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can } = usePermissions();
  const canConfig = can("stable");
  const tabs = canConfig ? [...BASE_TABS, CONFIG_TAB] : BASE_TABS;
  const tab = searchParams.get("tab") || "weekly";
  const week = searchParams.get("week") || boardStartOfWeek(td());
  const date = searchParams.get("date") || td();

  function switchTab(key) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", key);
    navigate(`/boards?${params.toString()}`);
  }

  return (
    <div className="view board-view">
      <div className="vh">
        <button className="ib" onClick={() => navigate("/home")} aria-label="Volver al inicio">
          ←
        </button>
        <div>
          <span className="ey">Organización diaria</span>
          <h1>Pizarras</h1>
        </div>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={switchTab} />
      {tab === "weekly" && <WeeklyBoardGrid week={week} />}
      {tab === "month" && <MonthBoardGrid />}
      {tab === "walker" && <ResourceBoardPage type="walker" date={date} />}
      {tab === "paddock" && <ResourceBoardPage type="paddock" date={date} />}
      {tab === "config" && (canConfig ? <BoardConfigPage /> : <AccessLimited />)}
    </div>
  );
}
