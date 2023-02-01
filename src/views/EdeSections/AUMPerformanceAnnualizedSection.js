import GenericChart from "../components/GenericChart"
import { useAumPerformanceData } from "../dataProvider"
import {
    COLORS,
    tooltipFormatterPercent,
    yaxisFormatterPercent
} from "../helpers"

const AUMPerformanceAnnualizedSection = ({ params }) => {
  const [aumPerformanceData, aumPerformanceLoading] =
    useAumPerformanceData(params);

  return (
    <div className="chart-cell">
      <GenericChart
        syncId="syncGlp"
        loading={aumPerformanceLoading}
        title="AUM Performance Annualized"
        data={aumPerformanceData}
        yaxisDataKey="apr"
        yaxisTickFormatter={yaxisFormatterPercent}
        tooltipFormatter={tooltipFormatterPercent}
        items={[{ key: "apr", name: "APR", color: COLORS[0] }]}
        description="Formula = Daily Fees / ELP Pool * 365 days * 100"
        type="Composed"
      />
    </div>
  );
};

export default AUMPerformanceAnnualizedSection;
