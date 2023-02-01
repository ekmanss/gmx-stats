import FeesChart from "../components/FeesChart";
import { useFeesData } from "../dataProvider";
import { CHART_HEIGHT, YAXIS_WIDTH } from "../helpers";

const FeesChartSection = ({ params }) => {
  const [feesData, feesLoading] = useFeesData(params);

  return (
    <div className="chart-cell">
      <FeesChart
        data={feesData}
        loading={feesLoading}
        chartHeight={CHART_HEIGHT}
        yaxisWidth={YAXIS_WIDTH}
      />
    </div>
  );
};

export default FeesChartSection;
