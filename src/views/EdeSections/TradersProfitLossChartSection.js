import TradersProfitLossChart from "../components/TradersProfitLossChart";
import { useTradersData } from "../dataProvider";

import { CHART_HEIGHT, YAXIS_WIDTH } from "../helpers";
const TradersProfitLossChartSection = ({ params }) => {
  const [tradersData, tradersLoading] = useTradersData(params);

  return (
    <div className="chart-cell">
      <TradersProfitLossChart
        syncId="tradersId"
        loading={tradersLoading}
        tradersData={tradersData}
        yaxisWidth={YAXIS_WIDTH}
        chartHeight={CHART_HEIGHT}
      />
    </div>
  );
};

export default TradersProfitLossChartSection;
