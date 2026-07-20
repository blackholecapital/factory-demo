import TopBar from "../components/TopBar/TopBar";
import BuildPanel from "../components/BuildPanel/BuildPanel";
import SystemStats from "../components/SystemStats/SystemStats";
import Pipeline from "../components/Pipeline/Pipeline";
import RunQueue from "../components/RunQueue/RunQueue";
import RealJobs from "../components/RealJobs/RealJobs";
import Overwatch from "../components/Overwatch/Overwatch";

export default function Dashboard() {
  return (
    <main className="dashboard">
      <TopBar />
      <BuildPanel />
      <SystemStats />
      <Pipeline />
      <RunQueue />
      <RealJobs />
      <Overwatch />
    </main>
  );
}
