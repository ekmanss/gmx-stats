import GenericChart from "../components/GenericChart";
import { useAumPerformanceData } from "../dataProvider";
import {
  COLORS,
  tooltipFormatterPercent,
  yaxisFormatterPercent,
} from "../helpers";

const AumDailyUsageSection = ({ params }) => {
  const [aumPerformanceData, aumPerformanceLoading] =
    useAumPerformanceData(params);

  return (
    <div className="chart-cell">
      <GenericChart
        syncId="syncGlp"
        loading={aumPerformanceLoading}
        title="AUM Daily Usage"
        data={aumPerformanceData}
        yaxisDataKey="usage"
        yaxisTickFormatter={yaxisFormatterPercent}
        tooltipFormatter={tooltipFormatterPercent}
        items={[{ key: "usage", name: "Daily Usage", color: COLORS[4] }]}
        description="Formula = Daily Volume / ELP Pool * 100"
        type="Composed"
      />
    </div>
  );
};

export default AumDailyUsageSection;
