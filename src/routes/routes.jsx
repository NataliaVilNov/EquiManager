import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { GuestRoute } from "./GuestRoute.jsx";
import { PermissionRoute } from "./PermissionRoute.jsx";

// Las pantallas del arranque van en el paquete principal: son las que se ven
// antes de poder tocar nada, y cargarlas aparte solo añadiría una espera.
import { AuthScreen } from "../features/auth/AuthScreen.jsx";
import { StableListScreen } from "../features/stables/StableListScreen.jsx";
import { HomePage } from "../features/home/HomePage.jsx";
import { HorseListPage } from "../features/horses/HorseListPage.jsx";
import { DayBoardPage } from "../features/tasks/DayBoardPage.jsx";

// El resto se carga al entrar en su ruta. El paquete era un único archivo de
// 1,29 MB: toda la aplicación —pizarras, estadísticas, informes, Notion,
// liquidaciones— se descargaba para ver la pantalla de inicio.
const HorseFormPage = lazy(() => import("../features/horses/HorseFormPage.jsx").then((m) => ({ default: m.HorseFormPage })));
const HorseDetailPage = lazy(() => import("../features/horses/detail/HorseDetailPage.jsx").then((m) => ({ default: m.HorseDetailPage })));
const TrainingFormPage = lazy(() => import("../features/trainings/TrainingFormPage.jsx").then((m) => ({ default: m.TrainingFormPage })));
const HealthFormPage = lazy(() => import("../features/health/HealthFormPage.jsx").then((m) => ({ default: m.HealthFormPage })));
const ExpenseFormPage = lazy(() => import("../features/expenses/ExpenseFormPage.jsx").then((m) => ({ default: m.ExpenseFormPage })));
const ExpenseSettlementPage = lazy(() => import("../features/expenses/ExpenseSettlementPage.jsx").then((m) => ({ default: m.ExpenseSettlementPage })));
const TaskFormPage = lazy(() => import("../features/tasks/TaskFormPage.jsx").then((m) => ({ default: m.TaskFormPage })));
const AlertsPage = lazy(() => import("../features/alerts/AlertsPage.jsx").then((m) => ({ default: m.AlertsPage })));
const AnswerSessionPage = lazy(() => import("../features/alerts/AnswerSessionPage.jsx").then((m) => ({ default: m.AnswerSessionPage })));
const TemplatesPage = lazy(() => import("../features/templates/TemplatesPage.jsx").then((m) => ({ default: m.TemplatesPage })));
const TemplateFormPage = lazy(() => import("../features/templates/TemplateFormPage.jsx").then((m) => ({ default: m.TemplateFormPage })));
const TeamPage = lazy(() => import("../features/team/TeamPage.jsx").then((m) => ({ default: m.TeamPage })));
const TeamMemberFormPage = lazy(() => import("../features/team/TeamMemberFormPage.jsx").then((m) => ({ default: m.TeamMemberFormPage })));
const TeamCalendarPage = lazy(() => import("../features/team/TeamCalendarPage.jsx").then((m) => ({ default: m.TeamCalendarPage })));
const MemberDayPage = lazy(() => import("../features/team/MemberDayPage.jsx").then((m) => ({ default: m.MemberDayPage })));
const TeamReportPage = lazy(() => import("../features/team/TeamReportPage.jsx").then((m) => ({ default: m.TeamReportPage })));
const StableWidePage = lazy(() => import("../features/stable-wide/StableWidePage.jsx").then((m) => ({ default: m.StableWidePage })));
const StableExpenseFormPage = lazy(() => import("../features/stable-wide/StableExpenseFormPage.jsx").then((m) => ({ default: m.StableExpenseFormPage })));
const BoardsPage = lazy(() => import("../features/boards/BoardsPage.jsx").then((m) => ({ default: m.BoardsPage })));
const BoardCellPage = lazy(() => import("../features/boards/weekly/BoardCellPage.jsx").then((m) => ({ default: m.BoardCellPage })));
const SmartOrderPage = lazy(() => import("../features/smart-order/SmartOrderPage.jsx").then((m) => ({ default: m.SmartOrderPage })));
const StatsPage = lazy(() => import("../features/stats/StatsPage.jsx").then((m) => ({ default: m.StatsPage })));
const TrainingReportPage = lazy(() => import("../features/reports/TrainingReportPage.jsx").then((m) => ({ default: m.TrainingReportPage })));

// Mientras llega el fragmento aparece algo de inmediato, y se anuncia, en vez de
// dejar la pantalla en blanco sin explicación.
function RouteFallback() {
  return (
    <div className="ld" role="status" aria-live="polite">
      <div className="sp" aria-hidden="true"></div>
      <span>Cargando…</span>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<AuthScreen />} />
        </Route>
        <Route element={<ProtectedRoute requireStable={false} />}>
          <Route path="/stables" element={<StableListScreen />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/horses" element={<HorseListPage />} />
          <Route path="/horses/:hid" element={<HorseDetailPage />} />
          <Route element={<PermissionRoute requires="horses" />}>
            <Route path="/horses/new" element={<HorseFormPage />} />
            <Route path="/horses/:hid/edit" element={<HorseFormPage />} />
          </Route>
          <Route element={<PermissionRoute requires="trainings" />}>
            <Route path="/horses/:hid/trainings/new" element={<TrainingFormPage />} />
          </Route>
          <Route element={<PermissionRoute requires="health" />}>
            <Route path="/horses/:hid/health/new" element={<HealthFormPage />} />
            <Route path="/horses/:hid/health/:eid/edit" element={<HealthFormPage />} />
          </Route>
          <Route element={<PermissionRoute requires="expenses" />}>
            <Route path="/horses/:hid/expenses/new" element={<ExpenseFormPage />} />
            <Route path="/horses/:hid/expenses/:eid/edit" element={<ExpenseFormPage />} />
            <Route path="/horses/:hid/expenses/settlement" element={<ExpenseSettlementPage />} />
          </Route>
          <Route element={<PermissionRoute requires="reports" />}>
            <Route path="/horses/:hid/report" element={<TrainingReportPage />} />
          </Route>
          <Route path="/day" element={<DayBoardPage />} />
          <Route element={<PermissionRoute requires="tasks" />}>
            <Route path="/tasks/new" element={<TaskFormPage />} />
            <Route path="/tasks/:tid/edit" element={<TaskFormPage />} />
          </Route>
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/alerts/:aid/answer" element={<AnswerSessionPage />} />
          <Route path="/team/:mid/day" element={<MemberDayPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/boards/cell/:hid/:date" element={<BoardCellPage />} />
          <Route element={<PermissionRoute requires={["tasks", "health", "expenses"]} />}>
            <Route path="/smart-order" element={<SmartOrderPage />} />
          </Route>
          <Route element={<PermissionRoute requires="stats" />}>
            <Route path="/stats" element={<StatsPage />} />
          </Route>
          <Route element={<PermissionRoute requires="team" />}>
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/new" element={<TemplateFormPage />} />
            <Route path="/templates/:tplid/edit" element={<TemplateFormPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/team/new" element={<TeamMemberFormPage />} />
            <Route path="/team/:mid/edit" element={<TeamMemberFormPage />} />
            <Route path="/team/calendar" element={<TeamCalendarPage />} />
            <Route path="/team/report" element={<TeamReportPage />} />
          </Route>
          <Route element={<PermissionRoute requires="stable" />}>
            <Route path="/cuadra" element={<StableWidePage />} />
            <Route path="/cuadra/expenses/new" element={<StableExpenseFormPage />} />
            <Route path="/cuadra/expenses/:eid/edit" element={<StableExpenseFormPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
